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

  // n8n Chatbot Webhook Endpoint
  const N8N_CHAT_WEBHOOK_URL =
    process.env.N8N_CHAT_WEBHOOK_URL ||
    'https://kaparapu-meghana2006.app.n8n.cloud/webhook/49c9e446-d730-463f-82f6-33a70a5eb966/chat';

  app.post('/api/n8n-chat', async (req, res) => {
    const { action = 'sendMessage', sessionId, chatInput } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const payload: Record<string, any> = {
      action,
      sessionId,
    };

    if (action === 'sendMessage') {
      if (!chatInput || typeof chatInput !== 'string') {
        return res.status(400).json({ error: 'chatInput is required for sendMessage' });
      }
      payload.chatInput = chatInput;
    }

    try {
      // First attempt: call n8n cloud webhook with 15s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(N8N_CHAT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }

      console.warn(`n8n webhook returned status ${response.status}. Attempting graceful recovery...`);
    } catch (n8nErr: any) {
      console.warn('n8n webhook fetch failed or timed out:', n8nErr?.message || n8nErr);
    }

    // Graceful recovery for session loading
    if (action === 'loadPreviousSession') {
      return res.json({ data: [] });
    }

    // Graceful recovery for sendMessage using server Gemini AI
    try {
      if (process.env.GEMINI_API_KEY && chatInput) {
        const ai = getGenAiClient();
        const fallbackPrompt = `You are an AI Career and Resume Coach assisting a student as the AI Resume Analyzer Agent.
The student asked:
"${chatInput}"

Provide a friendly, highly actionable, and professional response to help them improve their resume or interview preparation. Keep it structured with clear bullet points and bold key points.`;

        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: fallbackPrompt,
        });

        const outputText =
          fallbackResponse.text ||
          "Here are some actionable tips: 1. Quantify achievements with metrics. 2. Highlight key technical tools. 3. Include direct links to live projects or code repositories.";

        return res.json({
          output: outputText,
          recovered: true,
        });
      }
    } catch (aiErr: any) {
      console.error('Gemini fallback failed:', aiErr);
    }

    // Return friendly message if both fail
    return res.json({
      output:
        "I'm currently receiving high traffic on the workflow. Here are three quick tips while I reconnect:\n• **Quantify your results:** Use metrics and numbers (e.g., 'Improved load speed by 25%').\n• **Highlight relevant skills:** Group skills by category (Languages, Frameworks, Tools).\n• **Showcase GitHub demos:** Include clickable URLs to your portfolio or repository.",
      recovered: true,
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasKey: !!process.env.GEMINI_API_KEY,
      n8nChatWebhook: N8N_CHAT_WEBHOOK_URL,
    });
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
