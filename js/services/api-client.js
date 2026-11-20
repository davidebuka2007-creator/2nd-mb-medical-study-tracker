/* 2ndMBstudy — Serverless API Client Wrapper */

export async function postJson(endpoint, payload = {}, { timeoutMs = 20000, headers = {} } = {}) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('/api/')) {
    throw new Error('Invalid API endpoint.');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timerId =
    controller && timeoutMs > 0
      ? window.setTimeout(() => controller.abort(), timeoutMs)
      : null;

  try {
    const response = await window.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    });

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      const text = await response.text().catch(() => '');
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errMsg =
        (data && (data.error || data.message)) ||
        `Request failed with status ${response.status}.`;
      const error = new Error(errMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data ?? {};
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('The request timed out. Please check your connection and try again.');
    }
    throw err instanceof Error ? err : new Error('Network error while contacting server.');
  } finally {
    if (timerId !== null) {
      window.clearTimeout(timerId);
    }
  }
    }
