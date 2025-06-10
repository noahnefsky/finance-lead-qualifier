import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { checkCallStatus as checkBlandCallStatus, startCallWithBland } from './services/blandAIService.js';
import { getStructuredResponse, LeadQualificationResponse, leadQualificationSchema } from './services/OpenAIService.js';
import { Batch, Lead } from '../models/Models.js';
import { CallResponse } from '../models/BlandModels.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3001;
const DATA_DIR = path.join(__dirname, '../data');


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

// Read batch data
async function readbatch(batchId: string): Promise<Batch | null> {
  try {
    const filePath = path.join(DATA_DIR, `${batchId}.json`);
    console.log('Reading batch from:', filePath);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading batch:', error);
    return null;
  }
}

// Write batch data
async function writebatch(batchId: string, data: Batch): Promise<void> {
  const filePath = path.join(DATA_DIR, `${batchId}.json`);
  console.log('Writing batch to:', filePath);
  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2)
  );
}

// List all batches
async function listbatches(): Promise<Array<Batch & { id: string }>> {
  try {
    const files = await fs.readdir(DATA_DIR);
    const batches: Array<Batch & { id: string }> = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const batchId = path.basename(file, '.json');
        const batch = await readbatch(batchId);
        if (batch) {
          batches.push({ id: batchId, ...batch });
        }
      }
    }
    return batches;
  } catch (error) {
    console.error('Error listing batches:', error);
    return [];
  }
}

// Remove all polling-related code and replace with direct status check
async function updatebatchCallStatus(batchId: string): Promise<void> {
  const batch = await readbatch(batchId);
  if (!batch) return;

  let hasUpdates = false;
  const updatedLeads: Lead[] = [];

  for (const lead of batch.leads) {
    if (lead.status === 'in_progress' && lead.callId) {
      try {
        console.log(`Checking call status for lead ${lead.id}, callId: ${lead.callId}`);

        // Make request to Bland AI service to get call details
        const callDetails = await checkBlandCallStatus(lead.callId) satisfies CallResponse;
        console.log("callDetails", callDetails);
        // Update lead based on call status
        if (callDetails.completed) {
          hasUpdates = true;
          lead.callConcatenatedTranscript = callDetails.concatenated_transcript || '';
          lead.callTranscript = callDetails.transcript || '';
          lead.callDuration = callDetails.call_length || 0;
          lead.callEndedAt = new Date().toISOString();

          // Handle no-answer or very short calls
          if (callDetails.answered_by === 'no-answer') {
            lead.status = 'pending';
            lead.callScore = undefined;
            lead.callSummary = 'Call had no answer';
          } else {
            // Get lead qualification from OpenAI
            const qualification = await getStructuredResponse(
              `Analyze this call transcript.
              Your goal is to qualify the lead and determine which financial services they may be most interested in.
              Score their interest level from 1–5, where 5 means highly engaged and interested.`,
              callDetails.concatenated_transcript || ''
            );

            lead.callScore = qualification.score;
            lead.callSummary = qualification.summary;
            lead.status = qualification.score >= 3 ? 'qualified' : 'rejected';
            lead.callTranscript = qualification.transcript;
          }

          console.log(`Call completed for lead ${lead.id}: ${lead.status}`);
        } else if (callDetails.status === 'failed' || callDetails.status === 'error') {
          hasUpdates = true;
          lead.status = 'rejected';
          lead.callSummary = callDetails.error_message || 'Call failed to complete';
          lead.callScore = 0;
          lead.callEndedAt = new Date().toISOString();

          console.log(`Call failed for lead ${lead.id}`);
        }
      } catch (error) {
        console.error(`Error checking call status for lead ${lead.id}:`, error);
      }
    }
    updatedLeads.push(lead);
  }

  if (hasUpdates) {
    // Check if all leads are no longer in progress
    const allCallsCompleted = !updatedLeads.some(lead => lead.status === 'in_progress');
    batch.status = allCallsCompleted ? 'completed' : 'in_progress';
    batch.leads = updatedLeads;
    await writebatch(batchId, batch);
    console.log(`Updated batch ${batchId} with call status changes. batch status: ${batch.status}`);
  }
}

// Start call sequence for a batch - initiate calls for ALL leads with phone numbers
async function initiateCallSequence(batch: Batch): Promise<Batch> {
  console.log(`Starting call sequence for ${batch.leads.length} leads`);

  const callPromises = batch.leads.map(async (lead, index): Promise<Lead> => {
    if (!lead.phone) {
      console.log(`Skipping lead ${lead.id} - no phone number`);
      return {
        ...lead,
        status: 'rejected',
        callSummary: 'No phone number provided'
      };
    }

    console.log(`Initiating call for lead ${lead.id} (${index + 1}/${batch.leads.length})`);
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
  console.log(`Call sequence completed: ${successfulCalls}/${batch.leads.length} calls started successfully`);

  return { ...batch, leads: updatedLeads };
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
    // List all batches
    if (req.method === 'GET' && url.pathname === '/api/batches') {
      const batches = await listbatches();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(batches));
      return;
    }

    // Get batch
    if (req.method === 'GET' && url.pathname.startsWith('/api/batches/')) {
      const batchId = url.pathname.split('/').pop()!;
      console.log('Getting batch:', batchId);
      const batch = await readbatch(batchId);
      if (!batch) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'batch not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(batch));
      return;
    }

    // Create batch
    if (req.method === 'POST' && url.pathname === '/api/batches') {
      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const batch: Batch = JSON.parse(body);
          const batchId = `batch-${Date.now()}`;
          console.log('Creating batch:', batchId, 'with', batch.leads.length, 'leads');

          // Filter out leads without phone numbers and add IDs if missing
          const validLeads: Lead[] = batch.leads
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

          console.log(`Found ${validLeads.length} valid leads out of ${batch.leads.length} total leads`);

          // Create batch with valid leads
          const batchWithValidLeads: Batch = {
            ...batch,
            leads: validLeads,
            createdAt: new Date().toISOString(),
            status: 'in_progress',
            name: batch.name || '',
          };

          // Initiate calls for ALL leads with phone numbers
          const batchWithCalls = await initiateCallSequence(batchWithValidLeads);
          console.log("batchWithCalls", batchWithCalls);

          // Save the batch with call IDs
          await writebatch(batchId, batchWithCalls);

          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: batchId,
            leadsProcessed: validLeads.length,
            callsStarted: batchWithCalls.leads.filter(l => l.status === 'in_progress').length,
            status: batchWithCalls.status
          }));
        } catch (error) {
          console.error('Error creating batch:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ error: 'Failed to create batch' }));
        }
      });
      return;
    }

    // Manual call status check for a batch
    if (req.method === 'POST' && url.pathname.startsWith('/api/batches/') && url.pathname.endsWith('/check-status')) {
      const batchId = url.pathname.split('/')[3];
      console.log('Manual status check for batch:', batchId);

      await updatebatchCallStatus(batchId);
      const batch = await readbatch(batchId);
      if (batch) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(batch));
        return;
      }
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'batch not found' }));
      return;
    }

    // Start call for a specific lead (legacy endpoint)
    if (req.method === 'POST' && url.pathname.startsWith('/api/batches/') && url.pathname.endsWith('/start-call')) {
      const batchId = url.pathname.split('/')[3];
      console.log('Starting call for batch:', batchId);
      const batch = await readbatch(batchId);
      if (!batch) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'batch not found' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk.toString(); });
      req.on('end', async () => {
        try {
          const { leadId }: { leadId: string } = JSON.parse(body);
          const lead = batch.leads.find(l => l.id === leadId);
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

          await writebatch(batchId, batch);

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

    // Delete batch
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/batches/')) {
      const batchId = url.pathname.split('/').pop()!;
      console.log('Deleting batch:', batchId);

      // Clear any active polling
      if (activePollingIntervals.has(batchId)) {
        clearInterval(activePollingIntervals.get(batchId)!);
        activePollingIntervals.delete(batchId);
      }

      await fs.unlink(path.join(DATA_DIR, `${batchId}.json`));
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

// Remove the graceful shutdown polling cleanup since we no longer have polling
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});