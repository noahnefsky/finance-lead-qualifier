export interface CallResponse {
    call_id: string;
    status?: string;
    completed?: boolean;
    answered_by?: string;
    transcript?: string;
    concatenated_transcript?: string;
    summary?: string;
    call_length?: number;
    error_message?: string;
}