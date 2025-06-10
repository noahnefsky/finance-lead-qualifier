// TypeScript interfaces
interface Lead {
    id: string;
    phone?: string;
    status: 'pending' | 'in_progress' | 'qualified' | 'rejected';
    callId?: string;
    callStartedAt?: string;
    callEndedAt?: string;
    callTranscript?: string;
    callConcatenatedTranscript?: string;
    callSummary?: string;
    callScore?: number;
    callDuration?: number;
    [key: string]: any; // Allow additional properties
  }
  
  interface CallDetails {
    completed: boolean;
    answered_by?: string;
    transcript?: string;
    concatenated_transcript?: string;
    summary?: string;
    call_length?: number;
    status?: string;
    error_message?: string;
  }
  
  interface CallResult {
    call_id: string;
  }
  
  interface Batch {
    leads: Lead[];
    createdAt: string;
    status: 'in_progress' | 'completed';
    name: string;
  }