import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { createProject } from '../services/api';
import type { Lead } from '../Models/Lead';

const Upload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      // Read CSV file
      const text = await file.text();
      const rows = text.split('\n').map(row => row.split(','));
      const headers = rows[0];
      
      const leads: Lead[] = rows.slice(1).map((row, index) => ({
        id: row[headers.indexOf('id')] || `lead-${index}`,
        name: row[headers.indexOf('name')] || '',
        company: '',  // Not in CSV
        title: '',    // Not in CSV
        linkedinUrl: row[headers.indexOf('linkedin_url')] || '',
        phone: row[headers.indexOf('phone_number')] || '',
        email: '',    // Not in CSV
        status: 'in_progress',
      }));

      // Filter out leads without phone numbers
      const validLeads = leads.filter(lead => lead.phone);
      if (validLeads.length === 0) {
        throw new Error('No valid leads with phone numbers found in the CSV');
      }
      setProgress(30);
      
      // Create project and initiate calls
      const projectId = await createProject(validLeads);
      setProgress(100);
      
      // Navigate to project page
      navigate(`/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 2 }}>
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Upload Leads
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
          Upload a CSV file containing your leads. The file should include columns for name, linkedin_url, and phone_number.
          Calls will be automatically initiated for all leads with valid phone numbers.
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
              startIcon={<UploadIcon />}
              disabled={isProcessing}
            >
              Select File
            </Button>
          </label>
        </Box>

        {isProcessing && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
              {progress < 30 ? 'Processing file...' : 
               progress < 100 ? 'Initiating calls...' : 
               'Complete!'}
            </Typography>
          </Box>
        )}

        {error && (
          <Typography color="error" align="center">
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Upload;