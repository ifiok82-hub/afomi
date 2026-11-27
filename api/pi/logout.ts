import type { Request, Response } from 'express';
import { clearPiSessionCookie } from './_session.ts';

export function handlePiLogout(req: Request, res: Response) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }
  clearPiSessionCookie(req, res);
  return res.status(200).json({ ok: true });
}

export default handlePiLogout;
