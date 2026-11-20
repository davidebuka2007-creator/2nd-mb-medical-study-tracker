/* 2ndMBstudy — Serverless Endpoint: Log Pending PalmPay Bank Transfer Claim */
/* Never auto-unlocks Premium before manual verification by admin. */

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON request body.' });
  }

  const senderName = String(body?.senderName || '').trim();
  if (!senderName) {
    return sendJson(res, 400, { error: 'Sender name is required for a transfer claim.' });
  }

  const claimId = `TRF-${Date.now().toString(36).toUpperCase()}`;

  return sendJson(res, 200, {
    ok: true,
    claimId,
    status: 'pending_manual_verification',
    entitled: false,
    amountNaira: 1000,
    bankName: 'PalmPay',
    accountNumber: '8106625261',
    accountName: 'Okonkwo David Chukwuebuka',
    whatsappNumber: '08106625261',
    message:
      'Transfer claim logged as pending manual verification. Please send your transfer proof on WhatsApp to 08106625261 so Okonkwo David Chukwuebuka can confirm and activate your ₦1,000 one-time Premium access.'
  });
}
