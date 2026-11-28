import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PI_API_BASE = 'https://api.minepi.com/v2/payments';
const LEDGER_PATH = path.join(os.tmpdir(), 'afomi-pi-u2a-payments.json');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function readLedger() {
  try {
    if (!fs.existsSync(LEDGER_PATH)) return {};
    return JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeLedger(ledger) {
  try {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
  } catch {
    // Ignore ephemeral /tmp write errors
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid JSON request body' });
  }

  const paymentId = typeof body.paymentId === 'string' ? body.paymentId.trim() : '';
  const taskId = typeof body.taskId === 'string' ? body.taskId.trim() : '';
  const payerUid = typeof body.payerUid === 'string' ? body.payerUid.trim() : '';
  const amount = Number(body.amount);

  if (!paymentId || !taskId || !payerUid || !Number.isFinite(amount) || amount <= 0) {
    return jsonResponse(400, {
      ok: false,
      error: 'Missing or invalid paymentId, taskId, amount (> 0), or payerUid.',
    });
  }

  const apiKey = (process.env.PI_NETWORK_API_KEY || '').trim();
  if (!apiKey) {
    return jsonResponse(500, {
      ok: false,
      error: 'Server PI_NETWORK_API_KEY not configured in Netlify',
    });
  }

  try {
    const verifyRes = await fetch(`${PI_API_BASE}/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Key ${apiKey}`,
      },
    });

    if (!verifyRes.ok) {
      return jsonResponse(502, {
        ok: false,
        error: `Pi Platform payment lookup failed (${verifyRes.status}).`,
      });
    }

    const payment = await verifyRes.json();

    if (Number(payment.amount) !== Number(amount)) {
      return jsonResponse(400, { ok: false, error: 'Payment amount mismatch.' });
    }
    if (!payment.metadata || payment.metadata.taskId !== taskId) {
      return jsonResponse(400, { ok: false, error: 'Payment metadata taskId mismatch.' });
    }
    if (payment.user_uid !== payerUid) {
      return jsonResponse(403, { ok: false, error: 'Payment user_uid does not match payerUid.' });
    }
    if (payment.direction !== 'user_to_app') {
      return jsonResponse(400, { ok: false, error: 'Invalid payment direction; expected user_to_app.' });
    }

    if (payment.status && payment.status.developer_approved) {
      return jsonResponse(200, { ok: true, alreadyApproved: true });
    }

    // Persist paymentId BEFORE calling approve for idempotency
    const ledger = readLedger();
    ledger[paymentId] = {
      ...(ledger[paymentId] || {}),
      paymentId,
      taskId,
      payerUid,
      amount: Number(payment.amount),
      status: 'approving',
      updatedAt: new Date().toISOString(),
    };
    writeLedger(ledger);
    console.log('[AFOMI pi-approve] Approving U2A paymentId:', paymentId, 'taskId:', taskId);

    const approveRes = await fetch(`${PI_API_BASE}/${encodeURIComponent(paymentId)}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!approveRes.ok) {
      return jsonResponse(502, {
        ok: false,
        error: `Pi Platform payment approval failed (${approveRes.status}).`,
      });
    }

    ledger[paymentId] = {
      ...ledger[paymentId],
      status: 'approved',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeLedger(ledger);

    return jsonResponse(200, { ok: true });
  } catch {
    return jsonResponse(500, {
      ok: false,
      error: 'Internal error while verifying and approving Pi payment.',
    });
  }
};
