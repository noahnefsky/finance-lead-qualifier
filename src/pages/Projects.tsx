import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getProjects, deleteProject } from '../services/api';
import type { Project } from '../services/api';

interface ProjectCard extends Project {
  createdAt: string;
  leads: number;
  qualifiedLeads: number;
  status: 'processing' | 'completed';
}

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const loadProjects = async () => {
    try {
      const fetchedProjects = await getProjects();
      console.log("fetchedProjects", fetchedProjects);
      const projectCards = fetchedProjects.map(project => ({
        ...project,
        createdAt: new Date(parseInt(project.id.split('-')[1])).toLocaleDateString(),
        leads: project.leads.length,
        qualifiedLeads: project.leads.filter(lead => lead.status === 'qualified').length,
        status: project.leads.some(lead => lead.status === 'in_progress') ? 'processing' as const : 'completed' as const
      }));
      setProjects(projectCards);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // Set up an interval to refresh the projects list
    const interval = setInterval(loadProjects, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteClick = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
        await loadProjects();
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete project');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Projects</Typography>
        <Box>
          <Button
            variant="outlined"
            onClick={() => navigate('/leads')}
            sx={{ mr: 2 }}
          >
            View All Leads
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/upload')}
          >
            New Project
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {project.id}
                  </Typography>
                  <Chip
                    label={project.status}
                    color={project.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created: {project.createdAt}
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Leads: {project.leads}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Qualified: {project.qualifiedLeads}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Tooltip title="View Details">
                      <IconButton
                        onClick={() => navigate(`/projects/${project.id}`)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Project">
                      <IconButton
                        onClick={() => handleDeleteClick(project.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
    </Box>
  );
};

export default Projects; 