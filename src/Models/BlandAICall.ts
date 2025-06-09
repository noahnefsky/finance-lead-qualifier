export interface BlandAICall {
  id: string;
  phone: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  transcript?: string;
  completed: boolean;
  answered_by?: string;
  summary?: string;
  concatenated_transcript?: string;
  error_message?: string | null;
} 