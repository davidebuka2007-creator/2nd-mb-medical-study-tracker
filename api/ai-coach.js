/* 2ndMBstudy — Serverless Endpoint: 2nd MB AI Study Coach */

const SYSTEM_PROMPT = `You are the 2ndMBstudy AI Study Coach for 2nd MB medical students studying Anatomy, Biochemistry (including 341 and 351), and Physiology.
Give clear, accurate, exam-focused medical explanations with structured headings or bullet points when helpful, highlight high-yield points and common exam traps, and stay concise and practical.`;

function sendJson(res, statusCode, body) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(body);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  if (req && req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (req && typeof req.body === 'string' && req.body.trim()) {
    return JSON.parse(req.body);
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function buildStyleInstruction(mode, topicContext) {
  const parts = [];
  if (topicContext && typeof topicContext === 'object') {
    const meta = [
      topicContext.title ? `Topic: ${topicContext.title}` : '',
      topicContext.subject ? `Subject: ${topicContext.subject}` : '',
      topicContext.semesterLabel ? `Semester: ${topicContext.semesterLabel}` : '',
      topicContext.department ? `Department: ${topicContext.department}` : ''
    ]
      .filter(Boolean)
      .join(' | ');
    if (meta) parts.push(`Current syllabus context -> ${meta}.`);
  }

  if (mode === 'essay_breakdown') {
    parts.push('Structure your answer as a clear medical exam essay outline (Introduction, Core Anatomy/Mechanism/Pathway, Clinical Correlation, Summary).');
  } else if (mode === 'clinical_correlate') {
    parts.push('Emphasize clinical correlations, classic presentations, and high-yield exam pitfalls.');
  }
  return parts.join(' ');
}

async function callGemini(apiKey, model, messages, styleNote) {
  const contents = [];
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const text = String(m.text || '').trim();
    if (!text) continue;
    contents.push({
      role,
      parts: [{ text }]
    });
  }

  const systemInstructionText = [SYSTEM_PROMPT, styleNote].filter(Boolean).join('\n\n');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstructionText }] },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1600
      }
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini AI request failed.');
  }

  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim() || '';

  if (!reply) {
    throw new Error('AI Coach returned an empty response.');
  }
  return reply;
}

async function callOpenAiCompatible(apiKey, model, messages, styleNote) {
  const systemContent = [SYSTEM_PROMPT, styleNote].filter(Boolean).join('\n\n');
  const formatted = [
    { role: 'system', content: systemContent },
    ...messages
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.text || '').trim()
      }))
      .filter((m) => m.content)
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: formatted,
      temperature: 0.4,
      max_tokens: 1600
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || 'AI provider request failed.');
  }

  const reply = data?.choices?.[0]?.message?.content?.trim() || '';
  if (!reply) {
    throw new Error('AI Coach returned an empty response.');
  }
  return reply;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return sendJson(res, 503, {
      error:
        'AI Coach is not configured on the server yet. Set GEMINI_API_KEY or OPENAI_API_KEY in your deployment environment variables.'
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON request body.' });
  }

  const rawMessages = Array.isArray(body?.messages) ? body.messages : [];
  const messages = rawMessages
    .slice(-16)
    .map((m) => ({
      role: m?.role === 'assistant' ? 'assistant' : 'user',
      text: String(m?.text || m?.content || '').slice(0, 4000)
    }))
    .filter((m) => m.text.trim().length > 0);

  if (messages.length === 0) {
    return sendJson(res, 400, { error: 'Please provide a study question or message.' });
  }

  const styleNote = buildStyleInstruction(body?.mode, body?.topicContext);

  try {
    const reply = geminiKey
      ? await callGemini(
          geminiKey,
          process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          messages,
          styleNote
        )
      : await callOpenAiCompatible(
          openaiKey,
          process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages,
          styleNote
        );

    return sendJson(res, 200, { reply });
  } catch (err) {
    return sendJson(res, 502, {
      error: err?.message || 'AI Coach failed to generate a response.'
    });
  }
}
