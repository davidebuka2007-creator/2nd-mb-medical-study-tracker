/* 2ndMBstudy — Serverless Endpoint: Verify Paystack ₦1,000 One-Time Payment */

const REQUIRED_AMOUNT_KOBO = 100000; // ₦1,000 in kobo
const REQUIRED_CURRENCY = 'NGN';

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

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return sendJson(res, 503, {
      error: 'Paystack verification is not configured on the server yet (missing PAYSTACK_SECRET_KEY).'
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON request body.' });
  }

  const reference = String(body?.reference || '').trim();
  if (!reference || reference.length > 160) {
    return sendJson(res, 400, { error: 'A valid Paystack transaction reference is required.' });
  }

  const expectedEmail = String(body?.email || '').trim().toLowerCase();

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
    if (!psResponse.ok || !psJson || !psJson.status || !psJson.data) {
      return sendJson(res, 400, {
        verified: false,
        entitled: false,
        error: psJson?.message || 'Unable to verify transaction with Paystack.'
      });
    }

    const tx = psJson.data;
    const txStatus = String(tx.status || '').toLowerCase();
    const txCurrency = String(tx.currency || '').toUpperCase();
    const txAmount = Number(tx.amount || 0);
    const txEmail = String(tx.customer?.email || '').trim().toLowerCase();

    if (txStatus !== 'success') {
      return sendJson(res, 400, {
        verified: false,
        entitled: false,
        error: `Transaction status is "${txStatus || 'unknown'}", not successful.`
      });
    }

    if (txCurrency !== REQUIRED_CURRENCY) {
      return sendJson(res, 400, {
        verified: false,
        entitled: false,
        error: `Unsupported transaction currency "${txCurrency}". Expected ${REQUIRED_CURRENCY}.`
      });
    }

    if (!Number.isFinite(txAmount) || txAmount < REQUIRED_AMOUNT_KOBO) {
      return sendJson(res, 400, {
        verified: false,
        entitled: false,
        error: `Payment amount is below the required ₦1,000 one-time Premium fee.`
      });
    }

    if (expectedEmail && txEmail && expectedEmail !== txEmail) {
      return sendJson(res, 400, {
        verified: false,
        entitled: false,
        error: 'Transaction customer email does not match the email provided.'
      });
    }

    return sendJson(res, 200, {
      verified: true,
      entitled: true,
      oneTime: true,
      reference: tx.reference || reference,
      amountNaira: Math.round(txAmount / 100),
      currency: REQUIRED_CURRENCY,
      paidAt: tx.paid_at || null
    });
  } catch {
    return sendJson(res, 502, {
      error: 'Error reaching Paystack verification service. Please try again.'
    });
  }
}
