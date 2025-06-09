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
  Paper,
  Fade,
  LinearProgress,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon, 
  Delete as DeleteIcon, 
  Inbox as InboxIcon, 
  CheckCircle as CheckCircleIcon, 
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';
import { getBatches, deleteBatch } from '../services/api';
import type { Batch } from '../Models/Batch';
import type { Lead } from '../Models/Lead';

interface BatchCard extends Batch {
  createdAt: string;
  leadCount: number;
  qualifiedLeads: number;
  status: 'processing' | 'completed';
}

const Batches = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);

  const loadBatches = async () => {
    const fetchedBatches = await getBatches();
    const batchCards = fetchedBatches.map(batch => ({
      ...batch,
      createdAt: new Date(parseInt(batch.id.split('-')[1])).toLocaleDateString(),
      leadCount: batch.leads.length,
      qualifiedLeads: batch.leads.filter(lead => lead.status === 'qualified').length,
      status: batch.leads.some(lead => lead.status === 'in_progress') ? 'processing' as const : 'completed' as const
    }));
    setBatches(batchCards);
    setError(null);
    setIsLoading(false);
  };

  useEffect(() => {
    loadBatches();
    const interval = setInterval(loadBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteClick = (batchId: string) => {
    setBatchToDelete(batchId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (batchToDelete) {
      try {
        await deleteBatch(batchToDelete);
        await loadBatches();
        setDeleteDialogOpen(false);
        setBatchToDelete(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete batch');
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setBatchToDelete(null);
  };

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="h6" color="text.secondary">
          Loading batches...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        mt: 4, 
        p: 3, 
        bgcolor: 'error.light',
        borderRadius: 2,
        maxWidth: 600,
        mx: 'auto'
      }}>
        <Typography color="error.contrastText" variant="h6">
          Error Loading Batches
        </Typography>
        <Typography color="error.contrastText" sx={{ mt: 1 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', mx: 'auto', mt: 3, px: { xs: 2, md: 4 } }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3
      }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Lead Batches
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/leads')}
            sx={{ px: 3 }}
          >
            View All Leads
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/upload')}
            sx={{ px: 3 }}
          >
            New Batch
          </Button>
        </Box>
      </Box>

      {batches.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '40vh',
          gap: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 4
        }}>
          <InboxIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
          <Typography variant="h6" color="text.secondary">
            No batches found
          </Typography>
          <Typography color="text.secondary" align="center">
            Create your first batch by clicking the "New Batch" button above
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {batches.map((batch) => (
            <Grid item xs={12} sm={6} md={4} key={batch.id}>
              <Fade in timeout={500}>
                <Card 
                  sx={{ 
                    height: '100%',
                    minHeight: 200,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 2
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {batch.name && (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 2 
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                          {batch.name}
                        </Typography>
                        <Chip
                          label={batch.status}
                          color={batch.status === 'completed' ? 'success' : 'warning'}
                          size="small"
                          sx={{ 
                            textTransform: 'capitalize',
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    )}

                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2 }}
                    >
                      Created: {batch.createdAt}
                    </Typography>

                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mt: 'auto',
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider'
                    }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Leads: {batch.leadCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Qualified: {batch.qualifiedLeads}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => navigate(`/batches/${batch.id}`)}
                            color="primary"
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Batch">
                          <IconButton
                            onClick={() => handleDeleteClick(batch.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      {batch.status === 'processing' ? (
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <LinearProgress 
                              sx={{ 
                                flexGrow: 1,
                                height: 4,
                                borderRadius: 2,
                                bgcolor: 'warning.light',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: 'warning.main'
                                }
                              }} 
                            />
                            <CircularProgress 
                              size={14} 
                              sx={{ ml: 1, color: 'warning.main' }} 
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Processing leads...
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          color: 'success.main',
                          gap: 1
                        }}>
                          <CheckCircleIcon fontSize="small" />
                          <Typography variant="caption" color="success.main">
                            Processing complete
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 400
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          Delete Batch
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this batch? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDeleteCancel}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Batches;