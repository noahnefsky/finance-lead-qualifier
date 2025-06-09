interface CallResponse {
  call_id: string;
  status?: string;
  completed?: boolean;
  answered_by?: string;
  concatenated_transcript?: string;
  summary?: string;
  call_length?: number;
  error_message?: string;
}

export const startCallWithBland = async (phone: string) => {
  const response = await fetch('https://us.api.bland.ai/v1/calls', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: phone,
      task: `You are Bree's virtual agent. Call the recipient and ask about their business funding needs. Ask the following questions:\n
1) I understand you're in the [industry] space. What are your current growth plans?\n
2) What kind of funding or financial support are you currently looking for?\n
3) What's your timeline for securing additional funding?\n
4) What are the main challenges you're facing in your business right now?`,
      temperature: 0.7,
      record: true,
      voicemail_action: "leave_message",
      voicemail_message: "Hi, this is Bree checking in about a short conversation to help with your financial goals. We'll try again soon!",
      answered_by_enabled: true,
      metadata: {
        source: "lead_upload",
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to call ${phone}: ${err}`);
  }

  return response.json();
};

export async function checkCallStatus(callId: string): Promise<CallResponse> {
  const response = await fetch(`https://us.api.bland.ai/v1/calls/${callId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.BLAND_AI_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check call status: ${response.statusText}`);
  }

  return response.json();
} 