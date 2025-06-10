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
  Link,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';
import { useState } from 'react';
import type { Lead } from '../Models/Lead';

interface LeadsTableProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
}

const LeadsTable = ({ leads, onLeadClick }: LeadsTableProps) => {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [callDetailsOpen, setCallDetailsOpen] = useState(false);

  const handleViewCallDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setCallDetailsOpen(true);
  };

  if (leads.length === 0) {
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
        p: 4
      }}>
        <InboxIcon sx={{ fontSize: 60, color: 'text.secondary' }} />
        <Typography variant="h6" color="text.secondary">
          No leads found
        </Typography>
      </Box>
    );
  }

  return (
    <>
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
                {leads.map((lead) => (
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
                          title={lead.callSummary || lead.summary}
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
    </>
  );
};

export default LeadsTable; 