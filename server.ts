import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client
  const getGenAiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Endpoint to analyze resume
  app.post('/api/analyze-resume', async (req, res) => {
    try {
      const { resumeText } = req.body;

      if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 25) {
        return res.status(400).json({
          error: 'Please paste a complete resume with at least 25 characters to analyze.',
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'Gemini API key is not configured on the server. Please check your environment configuration.',
        });
      }

      const ai = getGenAiClient();

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
              systemInstruction: 'You are an objective, encouraging, and highly analytical AI career coach for students. Provide structured, accurate, and student-focused analysis.',
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
          console.warn(`Model ${modelName} encountered an error:`, err?.message || err);
          lastError = err;
          // small delay before trying fallback model
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      if (!responseText) {
        let cleanErrorMessage = 'Gemini AI is temporarily busy. Please click "Analyze Resume" again in a moment.';
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
      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      return res.status(500).json({
        error: error?.message || 'An error occurred during resume analysis. Please try again.',
      });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', hasKey: !!process.env.GEMINI_API_KEY });
  });

  // Serve frontend in production or mount Vite in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Resume Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
