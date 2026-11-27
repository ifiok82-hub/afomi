import type { Request, Response } from 'express';
import { setPiSessionCookie } from './_session.ts';
import { sanitizeString } from './_store.ts';

const APP_STUDIO_LOGIN_URL =
  'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login';

export async function handlePiLogin(req: Request, res: Response) {
  if (req.method && req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    // Treat accessToken as the sole credential; never trust browser-supplied uid or username.
    const accessToken = sanitizeString(req.body?.accessToken, 4096);
    if (!accessToken) {
      return res.status(400).json({ ok: false, error: 'Missing Pi accessToken.' });
    }

    const appStudioRes = await fetch(APP_STUDIO_LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });

    if (!appStudioRes.ok) {
      return res.status(401).json({
        ok: false,
        error: 'Pi App Studio rejected the provided accessToken.',
      });
    }

    const data = (await appStudioRes.json()) as {
      sessionToken?: string;
      user?: { uid?: string; username?: string };
    };

    const verifiedUid = sanitizeString(data.user?.uid, 128);
    const verifiedUsername = sanitizeString(data.user?.username, 128);

    if (!verifiedUid || !verifiedUsername) {
      return res.status(502).json({
        ok: false,
        error: 'Invalid identity payload returned by Pi App Studio.',
      });
    }

    setPiSessionCookie(req, res, {
      uid: verifiedUid,
      username: verifiedUsername,
      iat: Date.now(),
    });

    return res.status(200).json({
      ok: true,
      sessionToken: data.sessionToken || undefined,
      user: {
        uid: verifiedUid,
        username: verifiedUsername,
      },
    });
  } catch {
    return res.status(502).json({
      ok: false,
      error: 'Unable to reach Pi App Studio authentication service.',
    });
  }
}

export default handlePiLogin;
