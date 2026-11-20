/* 2ndMBstudy — Serverless Endpoint: Restore Server-Verified Premium Entitlement */

const REQUIRED_AMOUNT_KOBO = 100000; // ₦1,000 one-time Premium

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

  const reference = String(body?.reference || '').trim();
  const email = String(body?.email || '').trim().toLowerCase();

  if (!reference) {
    return sendJson(res, 200, {
      restored: false,
      entitled: false,
      message:
        'Provide your Paystack transaction reference to restore automatic access, or message 08106625261 on WhatsApp with your PalmPay transfer details.'
    });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return sendJson(res, 200, {
      restored: false,
      entitled: false,
      message:
        'Automatic reference verification is not configured on this server yet. Contact 08106625261 on WhatsApp to verify your entitlement.'
    });
  }

  try {
    const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`;
    const psResponse = await fetch(verifyUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      }
    });

    const psJson = await psResponse.json().catch(() => null);
    const tx = psJson?.data;

    if (
      !psResponse.ok ||
      !psJson?.status ||
      !tx ||
      String(tx.status || '').toLowerCase() !== 'success' ||
      String(tx.currency || '').toUpperCase() !== 'NGN' ||
      Number(tx.amount || 0) < REQUIRED_AMOUNT_KOBO
    ) {
      return sendJson(res, 200, {
        restored: false,
        entitled: false,
        message: 'No successful ₦1,000 Paystack transaction matched that reference.'
      });
    }

    const txEmail = String(tx.customer?.email || '').trim().toLowerCase();
    if (email && txEmail && email !== txEmail) {
      return sendJson(res, 200, {
        restored: false,
        entitled: false,
        message: 'Email address did not match the payer email on that transaction reference.'
      });
    }

    return sendJson(res, 200, {
      restored: true,
      entitled: true,
      oneTime: true,
      reference: tx.reference || reference,
      message: 'Server-verified ₦1,000 one-time Premium entitlement restored.'
    });
  } catch {
    return sendJson(res, 200, {
      restored: false,
      entitled: false,
      message: 'Unable to check reference right now. Please try again or message 08106625261 on WhatsApp.'
    });
  }
}
