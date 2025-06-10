/**
 * Response type for lead qualification analysis
 */
export interface LeadQualificationResponse {
  score: number;  // Interest level from 1-5
  summary: string;  // 3-4 sentence insight about the lead's interests
  transcript: string;
}

export const leadQualificationSchema = {
  type: 'object',
  properties: {
    score: {
      type: 'number',
      minimum: 1,
      maximum: 5,
      description: 'Interest level from 1-5, where 5 means highly engaged and interested'
    },
    summary: {
      type: 'string',
      description: '3-4 sentence insight about the lead\'s interests and potential financial services they may be interested in'
    },
    transcript: {
      type: 'string',
      description: 'The transcript of the call organized and rotating back and forth between the caller and the lead'
    }
  },
  required: ['score', 'summary', 'transcript'],
  additionalProperties: false  // This is required for strict mode
};

/**
 * Fetches a structured response from OpenAI using the Chat Completions API
 * with Structured Outputs (JSON Schema) enabled.
 *
 * @param prompt         Instructions for the model about what to do
 * @param transcript     Any additional context or transcript to include
 * @returns              A Promise resolving to the parsed structured output
 */
export async function getStructuredResponse(
    prompt: string,
    transcript: string
  ): Promise<LeadQualificationResponse> {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
  
    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. Respond **only** in valid JSON adhering exactly to the provided schema.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nTranscript:\n${transcript}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'LeadQualificationResponse',
          strict: true,
          schema: leadQualificationSchema
        }
      }
    };
  
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });
  
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }
  
    const { choices } = await res.json();
    const content = choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }
  
    try {
      return JSON.parse(content) as LeadQualificationResponse;
    } catch (e) {
      throw new Error(`Failed to parse JSON: ${e}`);
    }
  }