const PI_API_BASE = 'https://api.minepi.com/v2/payments';
const TIMEOUT = 8000;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return jsonResponse(405, { ok: false, error: 'Method not allowed' });
    }

    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return jsonResponse(400, {
        ok: false,
        error: 'Invalid JSON request body',
        detail: e && e.message ? e.message : String(e),
      });
    }

    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
    const payerUid = typeof body.payerUid === 'string' ? body.payerUid.trim() : '';
    const amount = body.amount !== undefined && body.amount !== null ? Number(body.amount) : NaN;
    const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
    const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
    const bodyItemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';

    console.log('pi-approve start', paymentId, amount);

    if (!paymentId) {
      return jsonResponse(400, {
        ok: false,
        error: 'Missing paymentId.',
      });
    }

    const apiKey = (process.env.PI_NETWORK_API_KEY || '').trim();
    if (!apiKey) {
      return jsonResponse(500, {
        ok: false,
        error: 'Server PI_NETWORK_API_KEY not configured in Netlify',
      });
    }

    let verifyRes;
    try {
      verifyRes = await fetchWithTimeout(`${PI_API_BASE}/${encodeURIComponent(paymentId)}`, {
        method: 'GET',
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      });
    } catch (e) {
      if (e && e.name === 'AbortError') {
        console.error('pi-approve GET timeout', paymentId);
        return jsonResponse(504, { error: 'Pi API timeout, tap Pay again' });
      }
      throw e;
    }

    if (verifyRes.status === 404) {
      console.error('pi-approve GET 404 payment_not_found_stale', paymentId);
      return jsonResponse(400, {
        error: 'payment_not_found_stale - cancel old payment, start fresh',
      });
    }

    if (!verifyRes.ok) {
      const detail = await verifyRes.text().catch(() => verifyRes.statusText);
      console.error('pi-approve GET failed', verifyRes.status, detail);
      return jsonResponse(400, {
        error: `Pi Platform payment lookup failed (${verifyRes.status})`,
        detail,
      });
    }

    const payment = await verifyRes.json();
    const meta = payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {};
    const itemId =
      taskId || productId || bodyItemId || meta.taskId || meta.productId || meta.itemId || null;

    if (Number.isFinite(amount) && amount > 0) {
      if (Math.abs(Number(payment.amount) - amount) > 0.0001) {
        return jsonResponse(400, {
          error: `Payment amount mismatch: expected ${amount}, got ${payment.amount}`,
        });
      }
    }

    if (payerUid && payment.user_uid && payment.user_uid !== payerUid) {
      return jsonResponse(400, {
        error: 'Payment user_uid mismatch against payerUid',
      });
    }

    if (payment.direction && payment.direction !== 'user_to_app') {
      return jsonResponse(400, {
        error: `Invalid payment direction: ${payment.direction}`,
      });
    }

    if (payment.status && payment.status.developer_approved) {
      console.log('pi-approve done', paymentId, '(alreadyApproved)');
      return jsonResponse(200, { ok: true, alreadyApproved: true, paymentId });
    }

    console.log('pi-approve pre-approve', {
      paymentId,
      itemId,
      status: payment.status,
      metadata: meta,
    });

    let approveRes;
    try {
      approveRes = await fetchWithTimeout(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (e) {
      if (e && e.name === 'AbortError') {
        console.error('pi-approve POST timeout', paymentId);
        return jsonResponse(504, { error: 'Pi API timeout, tap Pay again' });
      }
      throw e;
    }

    if (!approveRes.ok) {
      const detail = await approveRes.text().catch(() => approveRes.statusText);
      console.error('pi-approve POST failed', approveRes.status, detail);
      return jsonResponse(400, {
        error: `Pi Platform payment approval failed (${approveRes.status})`,
        detail,
      });
    }

    console.log('pi-approve done', paymentId);
    return jsonResponse(200, { ok: true, paymentId });
  } catch (e) {
    console.error('pi-approve error:', e);
    return jsonResponse(500, {
      error: (e && e.message) || 'approve failed',
    });
  }
};
