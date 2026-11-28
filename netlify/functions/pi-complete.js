const PI_API_BASE = 'https://api.minepi.com/v2/payments';

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed', detail: event.httpMethod });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('[AFOMI pi-complete] Invalid JSON body:', err);
    return jsonResponse(400, {
      ok: false,
      error: 'Invalid JSON request body',
      detail: err instanceof Error ? err.message : 'JSON parse failure',
    });
  }

  const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
  const txid = typeof body.txid === 'string' && body.txid.trim() ? body.txid.trim() : null;
  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
  const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
  const bodyItemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
  const itemType = typeof body.itemType === 'string' ? body.itemType.trim() : '';

  if (!paymentId) {
    return jsonResponse(400, {
      ok: false,
      error: 'Missing paymentId.',
      detail: 'paymentId is required',
    });
  }

  const apiKey = (process.env.PI_NETWORK_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[AFOMI pi-complete] Missing PI_NETWORK_API_KEY environment variable.');
    return jsonResponse(500, {
      ok: false,
      error: 'Server PI_NETWORK_API_KEY not configured in Netlify',
      detail: 'PI_NETWORK_API_KEY env var is empty or unset.',
    });
  }

  try {
    const verifyRes = await fetch(`${PI_API_BASE}/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
      signal: AbortSignal.timeout(3500),
    });

    if (!verifyRes.ok) {
      const respText = await verifyRes.text().catch(() => '');
      console.error('[AFOMI pi-complete] Pi lookup failed:', verifyRes.status, respText);
      return jsonResponse(502, {
        ok: false,
        error: `Pi Platform payment lookup failed (${verifyRes.status}).`,
        detail: respText || verifyRes.statusText,
      });
    }

    const payment = await verifyRes.json();
    const meta = payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {};
    const itemId =
      taskId || productId || bodyItemId || meta.taskId || meta.productId || meta.itemId || '';
    const chainTxid =
      payment.transaction && payment.transaction.txid ? String(payment.transaction.txid) : null;

    if (txid && chainTxid && txid !== chainTxid) {
      const detail = `Body txid ${txid} does not match chain txid ${chainTxid}`;
      console.error('[AFOMI pi-complete] txid mismatch:', detail);
      return jsonResponse(400, {
        ok: false,
        error: 'txid mismatch against Pi Platform payment transaction.',
        detail,
      });
    }

    const effectiveTxid = chainTxid || txid;
    const amount = Number(payment.amount ?? body.amount ?? 0);
    const workerShare = Number((amount * 0.92).toFixed(6));
    const commission = Number((amount * 0.08).toFixed(6));

    if (payment.status && payment.status.developer_completed) {
      return jsonResponse(200, {
        ok: true,
        alreadyCompleted: true,
        escrow: 'held',
        workerShare,
        commission,
        itemId: itemId || null,
      });
    }

    if (!effectiveTxid) {
      return jsonResponse(400, {
        ok: false,
        error: 'Missing blockchain txid to complete payment.',
        detail: 'Neither payment.transaction.txid nor request body txid was present.',
      });
    }

    // Log paymentId + txid BEFORE calling complete for idempotency (no slow DB calls)
    console.log('[AFOMI pi-complete] Idempotent pre-complete log:', {
      paymentId,
      txid: effectiveTxid,
      itemId: itemId || null,
      itemType: itemType || meta.type || null,
      amount,
    });

    const completeRes = await fetch(`${PI_API_BASE}/${encodeURIComponent(paymentId)}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid: effectiveTxid }),
      signal: AbortSignal.timeout(4000),
    });

    if (!completeRes.ok) {
      const respText = await completeRes.text().catch(() => '');
      console.error('[AFOMI pi-complete] Pi complete rejected:', completeRes.status, respText);
      return jsonResponse(502, {
        ok: false,
        error: `Pi Platform payment completion failed (${completeRes.status}).`,
        detail: respText || completeRes.statusText,
      });
    }

    // Hold in escrow; worker/seller gets 92% ONLY after client approves work / delivery
    return jsonResponse(200, {
      ok: true,
      escrow: 'held',
      workerShare,
      commission,
      itemId: itemId || null,
    });
  } catch (err) {
    console.error('[AFOMI pi-complete] Unexpected error:', err);
    return jsonResponse(500, {
      ok: false,
      error: 'Internal error while completing Pi payment.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};
