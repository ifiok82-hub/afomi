const PI_API_BASE = 'https://api.minepi.com/v2/payments';
const PI_TIMEOUT_MS = 8000;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PI_TIMEOUT_MS);
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
      return jsonResponse(400, { ok: false, error: 'Invalid JSON request body', detail: e.message });
    }

    const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
    const txid = typeof body.txid === 'string' && body.txid.trim() ? body.txid.trim() : null;

    console.log('pi-complete start', paymentId, txid);

    if (!paymentId) {
      return jsonResponse(400, { ok: false, error: 'Missing paymentId.' });
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
        console.error('pi-complete GET timeout', paymentId);
        return jsonResponse(504, { error: 'Pi API timeout, try again' });
      }
      throw e;
    }

    if (verifyRes.status === 404) {
      console.error('pi-complete GET 404 payment_not_found', paymentId);
      return jsonResponse(400, {
        error: 'payment_not_found - stale payment or wrong API key for afomii.netlify.app, start fresh payment',
      });
    }

    if (!verifyRes.ok) {
      const detail = await verifyRes.text().catch(() => verifyRes.statusText);
      console.error('pi-complete GET failed', verifyRes.status, detail);
      return jsonResponse(400, {
        error: `Pi Platform payment lookup failed (${verifyRes.status})`,
        detail,
      });
    }

    const payment = await verifyRes.json();
    const chainTxid =
      payment.transaction && payment.transaction.txid ? String(payment.transaction.txid) : null;

    if (txid && chainTxid && txid !== chainTxid) {
      return jsonResponse(400, {
        error: 'txid mismatch against Pi Platform payment transaction.',
      });
    }

    const effectiveTxid = chainTxid || txid;
    const amount = Number(payment.amount ?? body.amount ?? 0);
    const workerShare = Number((amount * 0.92).toFixed(6));
    const commission = Number((amount * 0.08).toFixed(6));

    if (payment.status && payment.status.developer_completed) {
      console.log('pi-complete already completed', paymentId);
      return jsonResponse(200, {
        ok: true,
        alreadyCompleted: true,
        escrow: 'held',
        workerShare,
        commission,
      });
    }

    if (!effectiveTxid) {
      return jsonResponse(400, {
        error: 'Missing blockchain txid to complete payment.',
      });
    }

    console.log('pi-complete pre-complete', { paymentId, txid: effectiveTxid, status: payment.status });

    let completeRes;
    try {
      completeRes = await fetchWithTimeout(
        `${PI_API_BASE}/${encodeURIComponent(paymentId)}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txid: effectiveTxid }),
        }
      );
    } catch (e) {
      if (e && e.name === 'AbortError') {
        console.error('pi-complete POST timeout', paymentId);
        return jsonResponse(504, { error: 'Pi API timeout, try again' });
      }
      throw e;
    }

    if (!completeRes.ok) {
      const detail = await completeRes.text().catch(() => completeRes.statusText);
      console.error('pi-complete POST failed', completeRes.status, detail);
      return jsonResponse(400, {
        error: `Pi Platform payment completion failed (${completeRes.status})`,
        detail,
      });
    }

    console.log('pi-complete done', paymentId);
    return jsonResponse(200, {
      ok: true,
      escrow: 'held',
      workerShare,
      commission,
    });
  } catch (e) {
    console.error('pi-complete error:', e);
    return jsonResponse(500, { error: e && e.message ? e.message : String(e) });
  }
};
