import type { Request, Response } from 'express';
import { getServerPiApiKey } from './pi/_store.ts';

export default function handler(_req: Request, res: Response) {
  res.json({
    ok: true,
    app: 'AFOMI',
    network: 'testnet',
    sandbox: true,
    piApiConfigured: Boolean(getServerPiApiKey()),
  });
}
