import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { checkCallStatus, startCallWithBland } from './services/blandAIService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3001;
const DATA_DIR = path.join(__dirname, '../data');

// TypeScript interfaces
interface Lead {
  id: string;
  phone?: string;
  status: 'pending' | 'in_progress' | 'qualified' | 'rejected';
  callId?: string;
  callStartedAt?: string;
  callEndedAt?: string;
  callTranscript?: string;
  callSummary?: string;
  callScore?: number;
  callDuration?: number;
  [key: string]: any; // Allow additional properties
}

interface Project {
  leads: Lead[];
  createdAt: string;
  [key: string]: any; // Allow additional properties
}

interface CallDetails {
  completed: boolean;
  answered_by?: string;
  concatenated_transcript?: string;
  summary?: string;
  call_length?: number;
  status?: string;
  error_message?: string;
}

interface CallResult {
  call_id: string;
}

// Store active polling intervals
const activePollingIntervals = new Map<string, NodeJS.Timeout>();

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Read project data
async function readProject(projectId: string): Promise<Project | null> {
  try {
    const filePath = path.join(DATA_DIR, `${projectId}.json`);
    console.log('Reading project from:', filePath);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading project:', error);
    return null;
  }
}

// Write project data
async function writeProject(projectId: string, data: Project): Promise<void> {
  const filePath = path.join(DATA_DIR, `${projectId}.json`);
  console.log('Writing project to:', filePath);
  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2)
  );
}

// List all projects
async function listProjects(): Promise<Array<Project & { id: string }>> {
  try {
    const files = await fs.readdir(DATA_DIR);
    const projects: Array<Project & { id: string }> = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const projectId = path.basename(file, '.json');
        const project = await readProject(projectId);
        if (project) {
          projects.push({ id: projectId, ...project });
        }
      }
    }
    return projects;
  } catch (error) {
    console.error('Error listing projects:', error);
    return [];
  }
}

// Poll call status for a project by fetching call details from Bland AI
async function pollCallStatus(projectId: string): Promise<void> {
  const project = await readProject(projectId);
  if (!project) return;

  let hasUpdates = false;
  const updatedLeads: Lead[] = [];

  for (const lead of project.leads) {
    if (lead.status === 'in_progress' && lead.callId) {
      try {
        console.log(`Checking call status for lead ${lead.id}, callId: ${lead.callId}`);

        // Make request to Bland AI service to get call details
        const callDetails = await checkCallStatus(lead.callId);

        // Update lead based on call status
        if (callDetails.completed === true) {
          hasUpdates = true;
          lead.status = callDetails.answered_by === 'human' ? 'qualified' : 'rejected';
          lead.callTranscript = callDetails.concatenated_transcript || '';
          lead.callSummary = callDetails.summary || '';
          lead.callScore = callDetails.answered_by === 'human' ? 10 : 0;
          lead.callDuration = callDetails.call_length || 0;
          lead.callEndedAt = new Date().toISOString();

          console.log(`Call completed for lead ${lead.id}: ${lead.status}`);
        } else if (callDetails.status === 'failed' || callDetails.status === 'error') {
          hasUpdates = true;
          lead.status = 'rejected';
          lead.callSummary = callDetails.error_message || 'Call failed to complete';
          lead.callScore = 0;
          lead.callEndedAt = new Date().toISOString();

          console.log(`Call failed for lead ${lead.id}`);
        }
        // If call is still in progress, keep polling

      } catch (error) {
        console.error(`Error checking call status for lead ${lead.id}:`, error);
        // Don't mark as failed immediately, might be a temporary API issue
      }
    }
    updatedLeads.push(lead);
  }

  if (hasUpdates) {
    project.leads = updatedLeads;
    await writeProject(projectId, project);
    console.log(`Updated project ${projectId} with call status changes`);
  }
}

// Start polling for a project
function startPolling(projectId: string): void {
  // Clear any existing polling for this project
  if (activePollingIntervals.has(projectId)) {
    clearInterval(activePollingIntervals.get(projectId)!);
  }

  console.log(`Starting polling for project ${projectId}`);

  const interval = setInterval(async () => {
    try {
      const project = await readProject(projectId);

      // Stop polling if project doesn't exist or no calls are in progress
      if (!project || !project.leads.some(lead => lead.status === "in_progress")) {
        console.log(`Stopping polling for project ${projectId} - no active calls`);
        clearInterval(interval);
        activePollingIntervals.delete(projectId);
        return;
      }

      await pollCallStatus(projectId);
    } catch (error) {
      console.error(`Error during polling for project ${projectId}:`, error);
    }
  }, 15000); // Poll every 15 seconds

  activePollingIntervals.set(projectId, interval);
}

// Start call sequence for a project - initiate calls for ALL leads with phone numbers
async function initiateCallSequence(project: Project): Promise<Project> {
  console.log(`Starting call sequence for ${project.leads.length} leads`);

  const callPromises = project.leads.map(async (lead, index): Promise<Lead> => {
    if (!lead.phone) {
      console.log(`Skipping lead ${lead.id} - no phone number`);
      return {
        ...lead,
        status: 'rejected',
        callSummary: 'No phone number provided'
      };
    }

    console.log(`Initiating call for lead ${lead.id} (${index + 1}/${project.leads.length})`);
    // Start the call via Bland AI service
    const callResult = await startCallWithBland(lead.phone);

    console.log(`Call initiated for lead ${lead.id}, callId: ${callResult.call_id}`);

    return {
      ...lead,
      callId: callResult.call_id,
      status: 'in_progress',
      callStartedAt: new Date().toISOString()
    };
  });

  // Wait for all call initiations to complete
  const updatedLeads = await Promise.all(callPromises);

  const successfulCalls = updatedLeads.filter(lead => lead.status === 'in_progress').length;
  console.log(`Call sequence completed: ${successfulCalls}/${project.leads.length} calls started successfully`);

  return { ...project, leads: updatedLeads };
}

// Create HTTP server
const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  console.log('Received request:', req.method, url.pathname);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // List all projects
    if (req.method === 'GET' && url.pathname === '/api/projects') {
      const projects = await listProjects();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
      return;
    }

    // Get project
    if (req.method === 'GET' && url.pathname.startsWith('/api/projects/')) {
      const projectId = url.pathname.split('/').pop()!;
      console.log('Getting project:', projectId);
      const project = await readProject(projectId);
      if (!project) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Project not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(project));
      return;
    }

    // Create project
    if (req.method === 'POST' && url.pathname === '/api/projects') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const project: Project = JSON.parse(body);
          const projectId = `project-${Date.now()}`;
          console.log('Creating project:', projectId, 'with', project.leads.length, 'leads');

          // Filter out leads without phone numbers and add IDs if missing
          const validLeads: Lead[] = project.leads
            .filter(lead => lead.phone)
            .map((lead, index) => ({
              ...lead,
              id: lead.id || `lead-${index + 1}`,
              status: 'pending' as const
            }));

          if (validLeads.length === 0) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'No valid leads with phone numbers found' }));
            return;
          }

          console.log(`Found ${validLeads.length} valid leads out of ${project.leads.length} total leads`);

          // Create project with valid leads
          const projectWithValidLeads: Project = {
            ...project,
            leads: validLeads,
            createdAt: new Date().toISOString()
          };

          // Initiate calls for ALL leads with phone numbers
          const projectWithCalls = await initiateCallSequence(projectWithValidLeads);
          console.log("projectWithCalls", projectWithCalls);

          // Save the project with call IDs
          await writeProject(projectId, projectWithCalls);

          // Start polling for call status updates
          startPolling(projectId);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: projectId,
            leadsProcessed: validLeads.length,
            callsStarted: projectWithCalls.leads.filter(l => l.status === 'in_progress').length
          }));
        } catch (error) {
          console.error('Error creating project:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to create project' }));
        }
      });
      return;
    }

    // Manual call status check for a project
    if (req.method === 'POST' && url.pathname.startsWith('/api/projects/') && url.pathname.endsWith('/check-status')) {
      const projectId = url.pathname.split('/')[3];
      console.log('Manual status check for project:', projectId);

      await pollCallStatus(projectId);
      const project = await readProject(projectId);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(project));
      return;
    }

    // Start call for a specific lead (legacy endpoint)
    if (req.method === 'POST' && url.pathname.startsWith('/api/projects/') && url.pathname.endsWith('/start-call')) {
      const projectId = url.pathname.split('/')[3];
      console.log('Starting call for project:', projectId);
      const project = await readProject(projectId);
      if (!project) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Project not found' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { leadId }: { leadId: string } = JSON.parse(body);
          const lead = project.leads.find(l => l.id === leadId);
          if (!lead) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Lead not found' }));
            return;
          }

          if (!lead.phone) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Lead has no phone number' }));
            return;
          }

          const call = await startCallWithBland(lead.phone);
          lead.callId = call.call_id;
          lead.status = 'in_progress';
          lead.callStartedAt = new Date().toISOString();

          await writeProject(projectId, project);

          // Ensure polling is active for this project
          if (!activePollingIntervals.has(projectId)) {
            startPolling(projectId);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ callId: call.call_id }));
        } catch (error) {
          console.error('Error starting individual call:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: `Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}` }));
        }
      });
      return;
    }

    // Delete project
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/projects/')) {
      const projectId = url.pathname.split('/').pop()!;
      console.log('Deleting project:', projectId);

      // Clear any active polling
      if (activePollingIntervals.has(projectId)) {
        clearInterval(activePollingIntervals.get(projectId)!);
        activePollingIntervals.delete(projectId);
      }

      await fs.unlink(path.join(DATA_DIR, `${projectId}.json`));
      res.writeHead(204);
      res.end();
      return;
    }

    // Handle unknown routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

// Initialize data directory and start server
async function startServer(): Promise<void> {
  try {
    await ensureDataDir();
    server.listen(PORT, () => {
      console.log('✨ Server initialization complete');
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log('📁 Data directory:', DATA_DIR);
    });
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');

  // Clear all polling intervals
  for (const interval of activePollingIntervals.values()) {
    clearInterval(interval);
  }

  process.exit(0);
});