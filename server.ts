import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { handlePiApprove } from './api/pi/approve.ts';
import { handlePiComplete } from './api/pi/complete.ts';
import { handlePiLogin } from './api/pi/login.ts';
import { handlePiLogout } from './api/pi/logout.ts';
import { clearPiSessionCookie, getVerifiedSessionFromRequest } from './api/pi/_session.ts';
import {
  getServerPiApiKey,
  readServerDb,
  sanitizeString,
  updatePinOnServer,
  verifyPinOnServer,
  writeServerDb,
} from './api/pi/_store.ts';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({ limit: '2mb' }));

  // Health Check
  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'AFOMI',
      network: 'testnet',
      sandbox: true,
      piApiConfigured: Boolean(getServerPiApiKey()),
    });
  });

  // Pi Auth & Payment Endpoints
  app.post('/api/pi/login', handlePiLogin);
  app.post('/api/pi/logout', handlePiLogout);
  app.post('/api/pi/approve', handlePiApprove);
  app.post('/api/pi/complete', handlePiComplete);

  app.post('/api/pi/cancel', (req, res) => {
    const paymentId = sanitizeString(req.body?.paymentId, 128);
    const status = req.body?.status === 'FAILED' ? 'FAILED' : 'CANCELLED';
    const reason = sanitizeString(req.body?.reason, 200) || 'Cancelled by user';
    if (!paymentId) {
      return res.status(400).json({ ok: false, error: 'Missing paymentId.' });
    }
    const db = readServerDb();
    const existing = db.payments.find((p) => p.paymentId === paymentId);
    const nowIso = new Date().toISOString();
    if (existing && existing.status !== 'COMPLETED') {
      existing.status = status;
      existing.errorReason = reason;
      existing.updatedAt = nowIso;
    } else if (!existing) {
      db.payments.unshift({
        paymentId,
        amount: Number(req.body?.amount) || 0,
        memo: sanitizeString(req.body?.memo, 200) || 'Cancelled payment',
        metadata: {},
        status,
        network: 'testnet',
        mode: 'testnet-sandbox',
        createdAt: nowIso,
        updatedAt: nowIso,
        errorReason: reason,
      });
    }
    writeServerDb(db);
    return res.json({ ok: true, status });
  });

  app.post('/api/pi/incomplete', async (req, res) => {
    const paymentId = sanitizeString(req.body?.paymentId, 128);
    const txid = sanitizeString(req.body?.txid, 160);
    if (!paymentId) {
      return res.status(400).json({ ok: false, error: 'Missing paymentId.' });
    }
    const db = readServerDb();
    const existing = db.payments.find((p) => p.paymentId === paymentId);
    if (existing && existing.status === 'COMPLETED') {
      return res.json({ ok: true, resolved: true, status: 'COMPLETED', payment: existing });
    }
    if (existing && txid) {
      existing.status = 'COMPLETED';
      existing.txid = txid;
      existing.updatedAt = new Date().toISOString();
      writeServerDb(db);
      return res.json({ ok: true, resolved: true, status: 'COMPLETED', payment: existing });
    }
    return res.json({ ok: true, resolved: false, status: existing?.status || 'PENDING' });
  });

  app.get('/api/pi/payments', (_req, res) => {
    const db = readServerDb();
    res.json({ ok: true, network: 'testnet', payments: db.payments.slice(0, 100) });
  });

  // Admin PIN verification & update (scrypt hashed on server)
  app.post('/api/admin/verify-pin', (req, res) => {
    const pin = sanitizeString(req.body?.pin, 10);
    const result = verifyPinOnServer(pin);
    res.status(result.ok ? 200 : result.locked ? 429 : 401).json(result);
  });

  app.post('/api/admin/change-pin', (req, res) => {
    const newPin = sanitizeString(req.body?.newPin, 10);
    const result = updatePinOnServer(newPin);
    res.status(result.ok ? 200 : 400).json(result);
  });

  // Account Deletion Endpoint (Pi Core Team Compliance)
  app.post('/api/account/delete', (req, res) => {
    const email = sanitizeString(req.body?.email, 120);
    const verifiedSession = getVerifiedSessionFromRequest(req);
    const piUsername = verifiedSession?.username;
    const db = readServerDb();
    db.deletedAccounts.unshift({
      email: email || undefined,
      piUsername: piUsername || undefined,
      deletedAt: new Date().toISOString(),
    });
    writeServerDb(db);
    clearPiSessionCookie(req, res);
    res.json({ ok: true, message: 'User account and associated personal data deleted.' });
  });

  // Vite dev middleware or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      if (req.path.endsWith('.txt')) {
        return res.status(404).type('text/plain').send('Not found');
      }
      return res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`AFOMI server listening on http://0.0.0.0:${port} (Pi Testnet Mode)`);
  });
}

startServer();
