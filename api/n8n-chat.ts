export default async function handler(req: any, res: any) {
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

  const N8N_CHAT_WEBHOOK_URL =
    process.env.N8N_CHAT_WEBHOOK_URL ||
    'https://kaparapu-meghana2006.app.n8n.cloud/webhook/49c9e446-d730-463f-82f6-33a70a5eb966/chat';

  const { action = 'sendMessage', sessionId, chatInput } = req.body || {};

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(N8N_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (err) {
    console.warn('Vercel n8n-chat proxy forwarding error:', err);
  }

  if (action === 'loadPreviousSession') {
    return res.status(200).json({ data: [] });
  }

  // Graceful response if n8n cloud webhook is sleeping
  return res.status(200).json({
    output:
      "I'm here to help you enhance your resume! Here are three quick tips while I connect to your latest workflow data:\n• **Quantify achievements:** Use numbers and metrics (e.g. 'solved 340+ problems', 'served 200+ users').\n• **Highlight tech tools:** Clearly group languages, frameworks, and developer tools.\n• **Showcase GitHub demos:** Include clickable URLs to your portfolio or repository.",
    recovered: true,
  });
}
