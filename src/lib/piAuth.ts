declare global {
  interface Window {
    Pi?: {
      init: (opts: { version: string }) => Promise<void> | void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{ accessToken?: string }>;
      createPayment?: (
        paymentData: { amount: number; memo: string; metadata: Record<string, unknown> },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void | Promise<void>;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: { identifier?: string }) => void;
        }
      ) => void;
    };
    __AFOMI_PI_SESSION__?: PiSession | null;
  }
}

const APP_STUDIO_LOGIN =
  'https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login';

export type PiSession = { sessionToken: string; uid: string; username: string };

let piInitPromise: Promise<void> | null = null;

async function waitForPiSdk(timeoutMs = 4000): Promise<NonNullable<Window['Pi']>> {
  if (typeof window === 'undefined') {
    throw new Error('Pi SDK requires a browser environment');
  }
  if (window.Pi) return window.Pi;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 80));
    if (window.Pi) return window.Pi;
  }
  throw new Error('Pi SDK not loaded');
}

export async function initPi(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (piInitPromise) return piInitPromise;
  piInitPromise = (async () => {
    try {
      const Pi = await waitForPiSdk();
      await Pi.init({ version: '2.0' });
    } catch (err) {
      piInitPromise = null;
      throw err;
    }
  })();
  return piInitPromise;
}

export function onIncompletePaymentFound(payment: {
  identifier?: string;
  transaction?: { txid?: string };
}) {
  if (!payment?.identifier) return;
  void fetch('/.netlify/functions/pi-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentId: payment.identifier,
      txid: payment.transaction?.txid || null,
      resume: true,
    }),
  }).catch(() => undefined);
}

export async function signInWithPi(): Promise<PiSession> {
  await initPi();
  const Pi = window.Pi;
  if (!Pi) throw new Error('Pi SDK unavailable');

  const auth = await Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
  const accessToken = auth?.accessToken;
  if (!accessToken) throw new Error('No accessToken returned by Pi authentication');

  const res = await fetch(APP_STUDIO_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) throw new Error('App Studio login failed: ' + res.status);

  const data = await res.json();
  const sessionToken = data?.sessionToken as string | undefined;
  const uid = data?.user?.uid as string | undefined;
  const username = data?.user?.username as string | undefined;
  if (!sessionToken || !uid || !username) {
    throw new Error('Invalid App Studio response');
  }

  const session: PiSession = { sessionToken, uid, username };
  window.__AFOMI_PI_SESSION__ = session;
  return session;
}

export function getPiSession(): PiSession | null {
  return typeof window !== 'undefined' ? (window.__AFOMI_PI_SESSION__ ?? null) : null;
}

export function signOutPi() {
  if (typeof window !== 'undefined') {
    window.__AFOMI_PI_SESSION__ = null;
  }
}
