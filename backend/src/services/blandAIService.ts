interface CallResponse {
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

const task = `
      You are a warm, conversational AI sales agent representing a licensed financial services company.

      Your job is to call a potential lead and naturally assess their interest in a specific financial solution through open conversation.

      Do not ask survey-style questions. Instead, guide the discussion in a natural way that allows you to infer the following:
      1. The lead’s current financial goal or concern.
      2. Their life stage (e.g., working, retired, self-employed).
      3. Which financial service is most relevant (investing, insurance, debt support, retirement, or none).
      4. Whether they expressed any curiosity, urgency, or openness to learning more.
      5. How interested they are overall on a scale of 1 to 5.

      Use light rapport and respectful curiosity to explore their situation. Speak like a human — not a script — and keep the tone warm, efficient, and professional.

      If the lead seems interested or like a good fit, offer to connect them with a specialist or send more information. If they’re uninterested or busy, thank them and wrap up politely.

      Your goal is to qualify the lead based on the conversation — not to sell. Focus on gathering insight, identifying potential fit, and logging the outcome.
      `;
  
export const startCallWithBland = async (phone: string) => {
  const response = await fetch('https://us.api.bland.ai/v1/calls', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VITE_BLAND_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone_number: phone,
      task: task,
      temperature: 0.7,
      record: true,
      voicemail_action: "leave_message",
      voicemail_message: "Hi, I'm calling on behalf of a financial services company. I'm calling about a short conversation to help with your financial goals. We'll try again soon!",
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
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_BLAND_AI_API_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to check call status: ${response.statusText}`);
  }

  return response.json();
} 

export const analyzeCall = async (callId: string) => {
  const response = await fetch(`https://us.api.bland.ai/v1/calls/${callId}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VITE_BLAND_AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      goal: "Your goal is to qualify the lead and determine which financial services they may be most interested in. Score their interest level from 1–5, where 5 means highly engaged and interested.",
      questions: [
        "What was the lead's current financial goal or concern?",
        "What life stage are they in (e.g., working, retired, self-employed)?",
        "Which financial service are they most likely to be interested in (investing, insurance, debt, retirement, or none)?",
        "Did the lead express interest, curiosity, or urgency in speaking with someone further?",
        "On a scale from 1 to 5, how interested was this lead in the financial service being discussed?"
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to analyze call ${callId}: ${err}`);
  }

  return response.json();
};
