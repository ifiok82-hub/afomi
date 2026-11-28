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
    console.error('[AFOMI pi-approve] Invalid JSON body:', err);
    return jsonResponse(400, {
      ok: false,
      error: 'Invalid JSON request body',
      detail: err instanceof Error ? err.message : 'JSON parse failure',
    });
  }

  const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
  const payerUid = typeof body.payerUid === 'string' ? body.payerUid.trim() : '';
  const amount = Number(body.amount);
  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
  const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
  const bodyItemId = typeof body.itemId === 'string' ? body.itemId.trim() : '';
  const itemType = typeof body.itemType === 'string' ? body.itemType.trim() : '';

  if (!paymentId || !payerUid || !Number.isFinite(amount) || amount <= 0) {
    const detail = {
      hasPaymentId: Boolean(paymentId),
      hasPayerUid: Boolean(payerUid),
      amount: body.amount ?? null,
    };
    console.error('[AFOMI pi-approve] Validation failed:', detail);
    return jsonResponse(400, {
      ok: false,
      error: 'Missing or invalid paymentId, amount (> 0), or payerUid.',
      detail,
    });
  }

  const apiKey = (process.env.PI_NETWORK_API_KEY || '').trim();
  if (!apiKey) {
    console.error('[AFOMI pi-approve] Missing PI_NETWORK_API_KEY environment variable.');
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
      console.error('[AFOMI pi-approve] Pi lookup failed:', verifyRes.status, respText);
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

    console.log('[AFOMI pi-approve] Payment metadata:', JSON.stringify(meta), 'resolved itemId:', itemId);

    if (Number(payment.amount) !== Number(amount)) {
      const detail = `Expected ${amount}, got ${payment.amount}`;
      console.error('[AFOMI pi-approve] Amount mismatch:', detail);
      return jsonResponse(400, { ok: false, error: 'Payment amount mismatch.', detail });
    }

    if (payment.user_uid !== payerUid) {
      const detail = `Expected user_uid ${payerUid}, got ${payment.user_uid}`;
      console.error('[AFOMI pi-approve] Payer UID mismatch:', detail);
      return jsonResponse(403, { ok: false, error: 'Payment user_uid does not match payerUid.', detail });
    }

    if (payment.direction !== 'user_to_app') {
      const detail = `Expected user_to_app, got ${payment.direction}`;
      console.error('[AFOMI pi-approve] Direction mismatch:', detail);
      return jsonResponse(400, { ok: false, error: 'Invalid payment direction; expected user_to_app.', detail });
    }

    if (payment.status && payment.status.developer_approved) {
      return jsonResponse(200, { ok: true, alreadyApproved: true, itemId: itemId || null });
    }

    // Log paymentId BEFORE approve for idempotency (no slow DB calls)
    console.log('[AFOMI pi-approve] Idempotent pre-approve log:', {
      paymentId,
      itemId: itemId || null,
      itemType: itemType || meta.type || null,
      amount: Number(payment.amount),
      payerUid,
    });

    const approveRes = await fetch(`${PI_API_BASE}/${encodeURIComponent(paymentId)}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!approveRes.ok) {
      const respText = await approveRes.text().catch(() => '');
      console.error('[AFOMI pi-approve] Pi approve rejected:', approveRes.status, respText);
      return jsonResponse(502, {
        ok: false,
        error: `Pi Platform payment approval failed (${approveRes.status}).`,
        detail: respText || approveRes.statusText,
      });
    }

    return jsonResponse(200, { ok: true, itemId: itemId || null });
  } catch (err) {
    console.error('[AFOMI pi-approve] Unexpected error:', err);
    return jsonResponse(500, {
      ok: false,
      error: 'Internal error while verifying and approving Pi payment.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
};
