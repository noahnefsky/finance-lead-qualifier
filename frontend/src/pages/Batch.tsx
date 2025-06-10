import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { deleteBatch, checkBatchStatus } from '../services/api';
import type { Batch } from '../Models/Batch';
import type { Lead } from '../Models/Lead';
import LeadsTable from '../components/LeadsTable';

const Batch = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const loadBatch = async () => {
    if (!batchId) return;
    try {
      const data = await checkBatchStatus(batchId) satisfies Batch;
      setBatch(data);
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
      setBatch(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    if (batch?.status === 'completed') {
      return;
    }

    loadBatch();
    const interval = setInterval(loadBatch, 20000); // Poll every 20 seconds
    return () => clearInterval(interval);
  }, [batchId, batch?.status]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!batchId) return;
    try {
      await deleteBatch(batchId);
      navigate('/batches');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete batch');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
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
          Loading batch details...
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
          Error Loading Batch
        </Typography>
        <Typography color="error.contrastText" sx={{ mt: 1 }}>
          {error}
        </Typography>
      </Box>
    );
  }

  if (!batch) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        gap: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        p: 4,
        mx: 'auto',
        mt: 4,
        maxWidth: 600
      }}>
        <Typography variant="h6" color="text.secondary">
          Batch not found
        </Typography>
        <Typography color="text.secondary" align="center">
          The requested batch could not be found
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {batch.name ? `Batch: ${batch.name}` : `Batch`}
          </Typography>
          <Chip
            label={batch.status || 'completed'}
            size="small"
            sx={{
              textTransform: 'capitalize',
              fontWeight: 500,
              backgroundColor: batch.status === 'completed' ? '#e6f4ea' : '#fff3cd', // light green / light yellow
              color: batch.status === 'completed' ? '#388e3c' : '#856404',           // medium green / dark yellow
              border: batch.status === 'completed' ? '1px solid #c8e6c9' : '1px solid #ffeeba'
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/batches')}
            sx={{ px: 3 }}
          >
            Back to Batches
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            sx={{ px: 3 }}
          >
            Delete Batch
          </Button>
        </Box>
      </Box>

      <LeadsTable
        leads={batch.leads}
      />

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

export default Batch;