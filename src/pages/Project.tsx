import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { getProject, deleteProject, checkProjectStatus } from '../services/api';
import type { Project } from '../Models/Project';
import type { Lead } from '../Models/Lead';

const Project = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callDetailsOpen, setCallDetailsOpen] = useState(false);

  const loadProject = async () => {
    if (!projectId) return;
      const data = await checkProjectStatus(projectId) satisfies Project;
      setProject(data)
      // check if all leads are done
      let isDone = true;
      for (const lead of data.leads) {
        if (lead.callId && lead.status === 'in_progress') {
          isDone = false;
          break;
        }
      }
      if (isDone) {
        data.status = 'completed';
      }
      setProject(data);
      setError(null);
      setIsLoading(false);
  };

  // Initial load and periodic refresh
  useEffect(() => {
    if (project?.status === 'completed') {
      return;
    }
    
    loadProject();
    const interval = setInterval(loadProject, 20000); // Poll every 20 seconds
    return () => clearInterval(interval);
  }, [projectId, project?.status]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectId) return;
    await deleteProject(projectId);
    navigate('/projects');
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleViewCallDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setCallDetailsOpen(true);
  };

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

  if (!project) {
    return (
      <Box sx={{ mt: 4, p: 2 }}>
        <Typography>Project not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: 'full', mx: 'auto', px: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Project {project.id}</Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDeleteClick}
        >
          Delete Project
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
              <TableCell>Score</TableCell>
              <TableCell>Summary</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.leads.map((lead) => (
              <TableRow
                key={lead.id}
                onClick={() => lead.callId && handleViewCallDetails(lead)}
                sx={{ cursor: lead.callId ? 'pointer' : 'default' }}
              >
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.title}</TableCell>
                <TableCell>
                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </TableCell>
                <TableCell>{lead.phone}</TableCell>
                <TableCell>
                  <Chip
                    label={lead.status}
                    color={
                      lead.status === 'qualified' ? 'success' :
                        lead.status === 'rejected' ? 'error' :
                          lead.status === 'in_progress' ? 'warning' :
                            'default'
                    }
                  />
                </TableCell>
                <TableCell>{lead.callScore || lead.initialScore || 'N/A'}</TableCell>
                <TableCell>
                  {lead.callSummary || lead.summary || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this project? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={callDetailsOpen}
        onClose={() => setCallDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Call Details</DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedLead.name}
              </Typography>
              {selectedLead.callSummary && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Summary
                  </Typography>
                  <Typography variant="body1">
                    {selectedLead.callSummary}
                  </Typography>
                </Box>
              )}
              {selectedLead.callTranscript && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Transcript
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedLead.callTranscript}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCallDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Project;