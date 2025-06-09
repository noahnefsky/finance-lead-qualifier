export interface Lead {
    id: string;
    name: string;
    company: string;
    title: string;
    linkedinUrl?: string;
    phone?: string;
    email?: string;
    initialScore?: number;
    callScore?: number;
    callTranscript?: string;
    callSummary?: string;
    callId?: string;
    status: 'qualified' | 'rejected' | 'pending' | 'in_progress';
    summary?: string;
}