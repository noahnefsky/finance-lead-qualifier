import OpenAI from 'openai';
import type { Lead } from '../Models/Lead';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// export const analyzeLinkedInProfile = async (linkedinUrl: string): Promise<number> => {
//   try {
//     const profileData = {
//       experience: "10+ years in finance",
//       companySize: "50-200 employees",
//       funding: "Series A",
//       industry: "FinTech",
//     };

//     const prompt = `
//       Analyze this LinkedIn profile data and score how likely this person/company needs a cash advance (0-10):
//       Experience: ${profileData.experience}
//       Company Size: ${profileData.companySize}
//       Funding Stage: ${profileData.funding}
//       Industry: ${profileData.industry}
      
//       Consider:
//       1. Company stage and funding
//       2. Industry volatility
//       3. Growth indicators
//       4. Financial needs
      
//       Return only a number between 0-10.
//     `;

//     // const completion = await openai.chat.completions.create({
//     //   messages: [{ role: "user", content: prompt }],
//     //   model: "gpt-4",
//     // });

//     // const score = parseFloat(completion.choices[0].message.content || "0");
//     // return Math.min(Math.max(score, 0), 10);
//     return 7.4;
//   } catch (error) {
//     console.error('Error analyzing LinkedIn profile:', error);
//     return 0;
//   }
// };

export const analyzeCallTranscript = async (transcript: string): Promise<{ score: number; summary: string }> => {
  try {
    const prompt = `
      Analyze this call transcript and provide:
      1. A score (0-10) for how likely this person/company needs a cash advance
      2. A brief summary of the key points discussed
      
      Transcript: ${transcript}
      
      Consider for scoring:
      1. Explicit need for funding
      2. Current financial situation
      3. Growth plans
      4. Pain points mentioned
      5. Urgency level
      
      Return in JSON format:
      {
        "score": number,
        "summary": string
      }
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    const response = JSON.parse(completion.choices[0].message.content || '{"score": 0, "summary": "No transcript available"}');
    return {
      score: Math.min(Math.max(response.score, 0), 10),
      summary: response.summary
    };
  } catch (error) {
    console.error('Error analyzing call transcript:', error);
    return { score: 0, summary: 'Error analyzing transcript' };
  }
};

export const processLeads = async (leads: Lead[]): Promise<Lead[]> => {
  return leads.map(lead => ({
    ...lead,
    status: 'in_progress' as const
  }));
};

export const updateLeadWithCallResults = async (
  lead: Lead,
  transcript: string
): Promise<Lead> => {
  const { score, summary } = await analyzeCallTranscript(transcript);
  
  // Determine if the lead is qualified based on call score only
  const isQualified = score >= 7;
  
  return {
    ...lead,
    callScore: score,
    callTranscript: summary,
    status: isQualified ? 'qualified' : 'rejected'
  };
}; 