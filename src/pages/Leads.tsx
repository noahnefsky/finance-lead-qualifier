import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Button,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getProjects } from '../services/api';
import type { Lead } from '../Models/Lead';

interface LeadWithProject extends Lead {
  projectId: string;
}

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    try {
      const projects = await getProjects();
      console.log("projects", projects);
      const allLeads = projects.flatMap(project => 
        project.leads.map(lead => ({
          ...lead,
          projectId: project.id
        }))
      );
      setLeads(allLeads);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    // Set up an interval to refresh the leads list
    const interval = setInterval(loadLeads, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 4, p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 'full', mx: 'auto', px: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">All Leads</Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>LinkedIn</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map(lead => (
              <TableRow key={`${lead.projectId}-${lead.id}`}>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.title}</TableCell>
                <TableCell>
                  {lead.linkedinUrl ? (
                    <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>{lead.phone ?? '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={lead.status} 
                    color={
                      lead.status === 'qualified' ? 'success' :
                      lead.status === 'rejected' ? 'error' :
                      lead.status === 'in_progress' ? 'warning' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => navigate(`/projects/${lead.projectId}`)}
                  >
                    View Project
                  </Button>
                </TableCell>
                <TableCell>
                  {lead.callScore !== undefined
                    ? `${lead.callScore.toFixed(1)}/10`
                    : lead.status === 'in_progress'
                    ? <CircularProgress size={20}/>
                    : '-'
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Leads; 