import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { resumeText } = req.body || {};

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 25) {
      return res.status(400).json({
        error: 'Please paste a complete resume with at least 25 characters to analyze.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables. Please add it in your Vercel Project Settings > Environment Variables.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `You are an expert AI Resume Analyst agent specialized in reviewing student and early-career resumes.
Analyze the following student resume thoroughly through an Agentic AI workflow:
1. Extract Skills: Find all technical skills, programming languages, frameworks, developer tools, databases, and technologies.
2. Identify Strengths: Highlight strong points, notable projects, academic excellence, leadership, or quantifiable results.
3. Find Skills to Improve: Identify technical competencies, tools, practices, or industry standards that the student could learn or improve to become more competitive for internships and junior roles.
4. AI Suggestions: Provide 3 to 5 simple, high-impact, actionable suggestions tailored to improve this resume (e.g., using action verbs, adding GitHub demo links, quantifying results, restructuring sections).
5. Generate a brief agent execution log for each workflow phase (Extract Skills, Identify Strengths, Find Skills to Improve, Generate Suggestions).

Student Resume Content:
"""
${resumeText.trim()}
"""`;

    const candidateModels = [
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
    ];

    let lastError: any = null;
    let responseText: string | undefined = undefined;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction:
              'You are an objective, encouraging, and highly analytical AI career coach for students. Provide structured, accurate, and student-focused analysis.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                skills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of technical skills extracted from the resume',
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Strong points and standout highlights in the resume',
                },
                skillsToImprove: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Skills or technical areas the student should improve or learn next',
                },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 5 simple, actionable suggestions to improve the resume',
                },
                workflowLog: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phase: { type: Type.STRING },
                      finding: { type: Type.STRING },
                    },
                    required: ['phase', 'finding'],
                  },
                  description: 'Brief agentic milestone findings for the demonstration workflow',
                },
                summary: {
                  type: Type.STRING,
                  description: 'A brief 1-2 sentence overall assessment of the resume',
                },
              },
              required: ['skills', 'strengths', 'skillsToImprove', 'suggestions'],
            },
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    if (!responseText) {
      let cleanErrorMessage =
        'Gemini AI is temporarily busy. Please click "Analyze Resume" again in a moment.';
      if (lastError?.message) {
        try {
          const parsed = JSON.parse(lastError.message);
          if (parsed?.error?.message) {
            cleanErrorMessage = parsed.error.message;
          }
        } catch {
          cleanErrorMessage = lastError.message;
        }
      }
      throw new Error(cleanErrorMessage);
    }

    const parsedData = JSON.parse(responseText);
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/analyze-resume handler:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze resume.',
    });
  }
}
