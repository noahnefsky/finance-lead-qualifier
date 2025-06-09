import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { CloudUpload as UploadIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { createBatch } from '../services/api';
import type { Lead } from '../Models/Lead';

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Confirmation state
  const [previewLeads, setPreviewLeads] = useState<Lead[] | null>(null);
  const [batchName, setBatchName] = useState('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setProgress(0);

    try {
      // Read and parse CSV
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0].map(h => h.trim());

      const leads: Lead[] = rows.slice(1)
        .map((row, index) => ({
          id: row[headers.indexOf('id')]?.trim() || `lead-${index}`,
          name: row[headers.indexOf('name')]?.trim() || '',
          company: '',
          title: '',
          linkedinUrl: row[headers.indexOf('linkedin_url')]?.trim() || '',
          phone: row[headers.indexOf('phone_number')]?.trim() || '',
          email: '',
          status: 'in_progress',
        }))
        .filter(lead => lead.phone);

      if (leads.length === 0) {
        throw new Error('No valid leads with phone numbers found in the CSV');
      }

      setPreviewLeads(leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const handleConfirm = async () => {
    if (!previewLeads) return;

    setError(null);
    setIsProcessing(true);
    setProgress(30);
    // Close dialog
    const leadsToSubmit = previewLeads;
    setPreviewLeads(null);

    try {
      setProgress(60);
      const batchId = await createBatch(leadsToSubmit, batchName || undefined);
      setProgress(100);
      navigate(`/batches/${batchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create batch');
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setPreviewLeads(null);
    setBatchName('');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        backgroundColor: 'background.default',
        p: 2,
      }}
    >
      {/* Back Button */}
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/')}
        sx={{ 
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1
        }}
      >
        Back
      </Button>

      {/* Main Content */}
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pt: 4
        }}
      >
        <Paper
          sx={{
            width: 600,
            maxWidth: '90%',
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
          elevation={3}
        >
          <Typography variant="h4" gutterBottom>
            Upload Leads
          </Typography>

          <Typography variant="body1" color="text.secondary" align="center">
            Upload a CSV file containing your leads. Include columns for name, linkedin_url, and phone_number.
          </Typography>

          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="upload-file"
              type="file"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
            <label htmlFor="upload-file">
              <Button
                variant="contained"
                component="span"
                size="large"
                startIcon={<UploadIcon />}
                disabled={isProcessing}
              >
                Select File
              </Button>
            </label>
          </Box>

          {/* Processing Indicator */}
          {isProcessing && (
            <Box sx={{ width: '100%' }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                {progress < 60
                  ? 'Creating batch...'
                  : 'Almost done...'}
              </Typography>
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Typography color="error" align="center">
              {error}
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={!!previewLeads} onClose={handleCancel} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Batch Creation</DialogTitle>
        <DialogContent>
          <Typography>
            You are about to create a batch with <strong>{previewLeads?.length}</strong> leads.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Batch Name (optional)"
            type="text"
            fullWidth
            value={batchName}
            onChange={e => setBatchName(e.target.value)}
            disabled={isProcessing}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} variant="contained" disabled={isProcessing}>
            {isProcessing ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Upload;