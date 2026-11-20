/* 2ndMBstudy — Serverless Endpoint: Generate 2nd MB Study Materials */

const ALLOWED_TYPES = new Set(['flashcards', 'questions', 'summary', 'revision']);

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

function buildGenerationPrompt({ materialType, title, subject, sourceText }) {
  const clippedSource = String(sourceText || '').slice(0, 18000);

  if (materialType === 'flashcards') {
    return `Create 6 concise, high-yield 2nd MB medical study flashcards (${subject}) titled "${title}" from the source below.
Return strictly valid JSON with this exact shape:
{"cards":[{"front":"...","back":"..."}]}
Do not wrap in markdown code fences.

Source:
${clippedSource}`;
  }

  if (materialType === 'questions') {
    return `Create 5 2nd MB exam-style practice questions (${subject}) titled "${title}" from the source below.
Return strictly valid JSON with this exact shape:
{"questions":[{"prompt":"...","answer":"..."}]}
Do not wrap in markdown code fences.

Source:
${clippedSource}`;
  }

  const label =
    materialType === 'revision'
      ? 'high-yield exam revision sheet with key distinctions and traps'
      : 'clear structured study summary';

  return `Create a ${label} for 2nd MB medical studies (${subject}) titled "${title}" from the source below.
Return strictly valid JSON with this exact shape:
{"text":"..."}
Do not wrap in markdown code fences.

Source:
${clippedSource}`;
}

function parseStructuredOutput(rawText, materialType) {
  const cleaned = String(rawText || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (materialType === 'flashcards' && Array.isArray(parsed?.cards) && parsed.cards.length > 0) {
      return {
        cards: parsed.cards.map((c) => ({
          front: String(c?.front || c?.question || '').trim(),
          back: String(c?.back || c?.answer || '').trim()
        }))
      };
    }
    if (materialType === 'questions' && Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
      return {
        questions: parsed.questions.map((q) => ({
          prompt: String(q?.prompt || q?.question || '').trim(),
          answer: String(q?.answer || q?.explanation || '').trim()
        }))
      };
    }
    if (typeof parsed?.text === 'string' && parsed.text.trim()) {
      return { text: parsed.text.trim() };
    }
  } catch {
    // Fall back to plain text wrapper if model returned prose
  }

  return { text: cleaned };
}

async function requestGeminiText(apiKey, model, prompt) {
  const url = `[https://generativelanguage.googleapis.com/v1beta/models/$](https://generativelanguage.googleapis.com/v1beta/models/$){encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 2000
      }
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Gemini generation request failed.');
  }

  const out =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || '')
      .join('')
      .trim() || '';

  if (!out) {
    throw new Error('Model returned empty material output.');
  }
  return out;
}

async function requestOpenAiText(apiKey, model, prompt) {
  const response = await fetch('[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a concise 2nd MB medical study material generator.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.35,
      max_tokens: 2000
    })
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || 'AI provider generation request failed.');
  }

  const out = data?.choices?.[0]?.message?.content?.trim() || '';
  if (!out) {
    throw new Error('Model returned empty material output.');
  }
  return out;
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
        'Study material generation is not configured on the server yet. Set GEMINI_API_KEY or OPENAI_API_KEY in your deployment environment variables.'
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON request body.' });
  }

  const materialType = ALLOWED_TYPES.has(body?.materialType) ? body.materialType : 'flashcards';
  const sourceText = String(body?.sourceText || '').trim();
  if (!sourceText) {
    return sendJson(res, 400, { error: 'Source text or topic context is required to generate materials.' });
  }

  const subject = String(body?.subject || 'General').trim();
  const title = String(body?.title || `2nd MB ${materialType}`).trim().slice(0, 140);
  const prompt = buildGenerationPrompt({ materialType, title, subject, sourceText });

  try {
    const rawOut = geminiKey
      ? await requestGeminiText(
          geminiKey,
          process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          prompt
        )
      : await requestOpenAiText(
          openaiKey,
          process.env.OPENAI_MODEL || 'gpt-4o-mini',
          prompt
        );

    const content = parseStructuredOutput(rawOut, materialType);

    return sendJson(res, 200, {
      type: materialType,
      title,
      content
    });
  } catch (err) {
    return sendJson(res, 502, {
      error: err?.message || 'Failed to generate study material.'
    });
  }
}
