import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { getBatches } from '../services/api';
import type { Lead } from '../Models/Lead';
import LeadsTable from '../components/LeadsTable';

interface LeadWithBatch extends Lead {
  batchId: string;
}

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadWithBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    try {
      const batches = await getBatches();
      console.log("batches", batches);
      const allLeads = batches.flatMap(batch => 
        batch.leads.map(lead => ({
          ...lead,
          batchId: batch.id
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
          Loading leads...
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
          Error Loading Leads
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
          All Leads
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/batches')}
          sx={{ px: 3 }}
        >
          Back to Batches
        </Button>
      </Box>

      <LeadsTable 
        leads={leads}
      />
    </Box>
  );
};

export default Leads;