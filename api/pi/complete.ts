import type { Request, Response } from 'express';
import { getServerPiApiKey, readServerDb, sanitizeString, writeServerDb } from './_store.ts';

export async function handlePiComplete(req: Request, res: Response) {
  try {
    const paymentId = sanitizeString(req.body?.paymentId, 128);
    const txid = sanitizeString(req.body?.txid, 160);
    const expectedAmount = req.body?.amount !== undefined ? Number(req.body.amount) : undefined;

    if (!paymentId || !/^[a-zA-Z0-9_-]{4,128}$/.test(paymentId)) {
      return res.status(400).json({ ok: false, error: 'Invalid paymentId.' });
    }
    if (!txid || txid.length < 6) {
      return res.status(400).json({ ok: false, error: 'Invalid or missing blockchain txid.' });
    }

    const db = readServerDb();
    const existing = db.payments.find((p) => p.paymentId === paymentId);

    if (!existing) {
      return res.status(404).json({
        ok: false,
        error: 'Payment was not approved by server first. Approval is required before completion.',
      });
    }

    if (existing.status === 'COMPLETED') {
      return res.status(409).json({
        ok: false,
        error: 'Duplicate payment completion blocked (double-spend protection).',
      });
    }

    const duplicateTx = db.payments.find(
      (p) => p.txid === txid && p.paymentId !== paymentId && p.status === 'COMPLETED'
    );
    if (duplicateTx) {
      return res.status(409).json({
        ok: false,
        error: 'Duplicate txid detected (double-spend protection).',
      });
    }

    if (
      expectedAmount !== undefined &&
      Number.isFinite(expectedAmount) &&
      Math.abs(existing.amount - expectedAmount) > 0.0001
    ) {
      return res.status(400).json({
        ok: false,
        error: 'Amount mismatch during payment completion.',
      });
    }

    const piApiKey = getServerPiApiKey();
    if (piApiKey && existing.mode === 'pi-platform-api') {
      const completeRes = await fetch(
        `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${piApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ txid }),
        }
      );

      if (!completeRes.ok) {
        existing.status = 'FAILED';
        existing.errorReason = 'Pi Platform API completion rejected';
        existing.updatedAt = new Date().toISOString();
        writeServerDb(db);
        return res.status(502).json({
          ok: false,
          error: 'Pi Platform API failed to verify transaction completion.',
        });
      }
    }

    existing.status = 'COMPLETED';
    existing.txid = txid;
    existing.updatedAt = new Date().toISOString();
    writeServerDb(db);

    return res.json({
      ok: true,
      status: 'COMPLETED',
      network: 'testnet',
      payment: existing,
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error completing Pi payment.' });
  }
}

export default handlePiComplete;
