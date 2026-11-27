import type { Request, Response } from 'express';
import { getVerifiedSessionFromRequest } from './_session.ts';
import {
  getServerPiApiKey,
  readServerDb,
  sanitizeString,
  writeServerDb,
  type ServerPaymentRecord,
} from './_store.ts';

export async function handlePiApprove(req: Request, res: Response) {
  try {
    const paymentId = sanitizeString(req.body?.paymentId, 128);
    const amountRaw = Number(req.body?.amount);
    const memo = sanitizeString(req.body?.memo, 240) || 'AFOMI Escrow Testnet Payment';
    const verifiedSession = getVerifiedSessionFromRequest(req);
    const piUsername = verifiedSession?.username;
    const userUid = verifiedSession?.uid;
    const metadata =
      req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};

    if (!paymentId || !/^[a-zA-Z0-9_-]{4,128}$/.test(paymentId)) {
      return res.status(400).json({ ok: false, error: 'Invalid or missing paymentId.' });
    }
    if (!Number.isFinite(amountRaw) || amountRaw < 0.1 || amountRaw > 1000) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid Pi amount. Must be between 0.1 Pi and 1000 Pi.',
      });
    }

    const amount = Number(amountRaw.toFixed(4));
    const db = readServerDb();
    const existing = db.payments.find((p) => p.paymentId === paymentId);

    if (existing && existing.status === 'COMPLETED') {
      return res.status(409).json({
        ok: false,
        error: 'Duplicate paymentId: this payment has already been completed.',
      });
    }

    const piApiKey = getServerPiApiKey();
    let mode: ServerPaymentRecord['mode'] = 'testnet-sandbox';

    if (piApiKey) {
      const piRes = await fetch(
        `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}`,
        {
          headers: { Authorization: `Key ${piApiKey}` },
        }
      );

      if (!piRes.ok) {
        return res.status(502).json({
          ok: false,
          error: 'Unable to verify payment with Pi Platform API.',
        });
      }

      const piPayment = (await piRes.json()) as {
        amount?: number;
        network?: string;
        status?: { cancelled?: boolean };
      };

      if (piPayment.network && piPayment.network !== 'Pi Testnet') {
        return res.status(403).json({
          ok: false,
          error: 'Mainnet payments are blocked. AFOMI is configured for Pi Testnet only.',
        });
      }

      if (typeof piPayment.amount === 'number' && Math.abs(piPayment.amount - amount) > 0.0001) {
        return res.status(400).json({
          ok: false,
          error: 'Payment amount mismatch detected by server verification.',
        });
      }

      const approveRes = await fetch(
        `https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Key ${piApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!approveRes.ok) {
        return res.status(502).json({
          ok: false,
          error: 'Pi Platform API rejected payment approval.',
        });
      }

      mode = 'pi-platform-api';
    }

    const nowIso = new Date().toISOString();
    const record: ServerPaymentRecord = {
      paymentId,
      amount,
      memo,
      metadata,
      status: 'APPROVED',
      network: 'testnet',
      mode,
      piUsername: piUsername || undefined,
      userUid: userUid || undefined,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    if (existing) {
      db.payments = db.payments.map((p) => (p.paymentId === paymentId ? record : p));
    } else {
      db.payments.unshift(record);
    }
    writeServerDb(db);

    return res.json({
      ok: true,
      status: 'APPROVED',
      network: 'testnet',
      mode,
      payment: record,
    });
  } catch {
    return res.status(500).json({ ok: false, error: 'Server error approving Pi payment.' });
  }
}

export default handlePiApprove;
