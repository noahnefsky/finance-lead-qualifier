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
  Link,
  Fade,
} from '@mui/material';
import { Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Inbox as InboxIcon } from '@mui/icons-material';
import { getBatch, deleteBatch, checkBatchStatus } from '../services/api';
import type { Batch } from '../Models/Batch';
import type { Lead } from '../Models/Lead';

const Batch = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callDetailsOpen, setCallDetailsOpen] = useState(false);

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

  const handleViewCallDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setCallDetailsOpen(true);
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
        <InboxIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
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
            color={batch.status === 'completed' ? 'success' : 'warning'}
            size="small"
            sx={{ 
              textTransform: 'capitalize',
              fontWeight: 500
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

      {batch.leads.length === 0 ? (
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
            No leads in this batch
          </Typography>
          <Typography color="text.secondary" align="center">
            This batch appears to be empty
          </Typography>
        </Box>
      ) : (
        <Fade in timeout={500}>
          <Paper 
            elevation={1}
            sx={{ 
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
              <Table sx={{ width: '100%', tableLayout: 'fixed', minWidth: 1200 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '12%' }}>
                      Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '10%' }}>
                      LinkedIn
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '12%' }}>
                      Phone
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '10%' }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '8%' }}>
                      Score
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: '33%' }}>
                      Summary
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batch.leads.map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      onClick={() => lead.callId && handleViewCallDetails(lead)}
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'grey.25' },
                        '&:hover': { bgcolor: 'grey.100' },
                        transition: 'background-color 0.2s',
                        cursor: lead.callId ? 'pointer' : 'default'
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                        <Box sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {lead.name || '-'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {lead.linkedinUrl ? (
                          <Link 
                            href={lead.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            sx={{ 
                              color: 'primary.main',
                              textDecoration: 'none',
                              '&:hover': { textDecoration: 'underline' }
                            }}
                          >
                            View Profile
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Box sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {lead.phone || '-'}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lead.status}
                          color={
                            lead.status === 'qualified' ? 'success' :
                            lead.status === 'rejected' ? 'error' :
                            lead.status === 'in_progress' ? 'warning' : 'default'
                          }
                          size="small"
                          sx={{ 
                            textTransform: 'capitalize',
                            fontWeight: 500,
                            fontSize: '0.75rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {lead.callScore !== undefined ? (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1 
                          }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 600,
                                color: lead.callScore >= 7 ? 'success.main' : 
                                       lead.callScore >= 4 ? 'warning.main' : 'error.main'
                              }}
                            >
                              {lead.callScore}/5
                            </Typography>
                          </Box>
                        ) : lead.initialScore !== undefined ? (
                          <Typography variant="body2" color="text.secondary">
                            {lead.initialScore}/10
                          </Typography>
                        ) : lead.status === 'in_progress' ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CircularProgress size={16} color="warning" />
                            <Typography variant="caption" color="text.secondary">
                              Processing...
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {(lead.callSummary || lead.summary) ? (
                          <Box 
                            sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.4,
                              maxHeight: '2.8em',
                              wordBreak: 'break-word'
                            }}
                            title={lead.callSummary || lead.summary} // Shows full text on hover
                          >
                            {lead.callSummary || lead.summary}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Fade>
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

      <Dialog
        open={callDetailsOpen}
        onClose={() => setCallDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          Call Details
        </DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {selectedLead.name}
              </Typography>
              {selectedLead.callSummary && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Summary
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="body1">
                      {selectedLead.callSummary}
                    </Typography>
                  </Paper>
                </Box>
              )}
              {selectedLead.callTranscript && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                    Transcript
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, maxHeight: 400, overflow: 'auto' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedLead.callTranscript}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setCallDetailsOpen(false)}
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Batch;