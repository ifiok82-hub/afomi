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
  const txid = typeof body.txid === 'string' && body.txid.trim() ? body.txid.trim() : null;

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
    const chainTxid = payment.transaction && payment.transaction.txid ? String(payment.transaction.txid) : null;

    if (txid && chainTxid && txid !== chainTxid) {
      return jsonResponse(400, {
        ok: false,
        error: 'txid mismatch against Pi Platform payment transaction.',
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
      });
    }

    if (!effectiveTxid) {
      return jsonResponse(400, {
        ok: false,
        error: 'Missing blockchain txid to complete payment.',
      });
    }

    // Persist paymentId + txid BEFORE calling complete for idempotency
    const ledger = readLedger();
    ledger[paymentId] = {
      ...(ledger[paymentId] || {}),
      paymentId,
      txid: effectiveTxid,
      amount,
      escrow: 'held',
      workerShare,
      commission,
      status: 'completing',
      updatedAt: new Date().toISOString(),
    };
    writeLedger(ledger);
    console.log('[AFOMI pi-complete] Completing U2A paymentId:', paymentId, 'txid:', effectiveTxid);

    const completeRes = await fetch(`${PI_API_BASE}/${encodeURIComponent(paymentId)}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid: effectiveTxid }),
    });

    if (!completeRes.ok) {
      return jsonResponse(502, {
        ok: false,
        error: `Pi Platform payment completion failed (${completeRes.status}).`,
      });
    }

    ledger[paymentId] = {
      ...ledger[paymentId],
      status: 'completed',
      escrow: 'held',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    writeLedger(ledger);

    // Hold in escrow; worker gets 92% ONLY after client clicks Approve Work
    return jsonResponse(200, {
      ok: true,
      escrow: 'held',
      workerShare,
      commission,
    });
  } catch {
    return jsonResponse(500, {
      ok: false,
      error: 'Internal error while completing Pi payment.',
    });
  }
};
