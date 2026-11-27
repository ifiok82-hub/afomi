export interface PiAuthResult {
  uid: string;
  username: string;
  walletAddress: string;
  accessToken: string;
  mode: 'pi-browser' | 'testnet-sandbox';
}

export interface PiPaymentCallbacks {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  userUid?: string;
  piUsername?: string;
  simulateFailure?: boolean;
  onPhase?: (phase: 'creating' | 'approving' | 'completing' | 'verified') => void;
}

export interface PiPaymentOutcome {
  ok: boolean;
  paymentId?: string;
  txid?: string;
  cancelled?: boolean;
  error?: string;
}

interface WindowWithPi extends Window {
  Pi?: {
    init: (opts: { version: string }) => Promise<void> | void;
    authenticate: (
      scopes: string[],
      onIncompletePaymentFound: (payment: { identifier: string; transaction?: { txid?: string } }) => void
    ) => Promise<{
      accessToken: string;
      user?: { uid?: string; username?: string; wallet_address?: string };
    }>;
    createPayment: (
      paymentData: { amount: number; memo: string; metadata: Record<string, unknown> },
      callbacks: {
        onReadyForServerApproval: (paymentId: string) => void;
        onReadyForServerCompletion: (paymentId: string, txid: string) => void;
        onCancel: (paymentId: string) => void;
        onError: (error: Error, payment?: { identifier?: string }) => void;
      }
    ) => void;
  };
}

let piInitialized = false;
let piInitPromise: Promise<boolean> | null = null;

const safeMetaEnv =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : {};

export const PI_SANDBOX_MODE = safeMetaEnv.VITE_PI_SANDBOX !== 'false';
export const PI_DEMO_MODE_DEFAULT = safeMetaEnv.VITE_DEMO_MODE !== 'false';

export async function fetchPiBackendStatus(): Promise<{
  ok: boolean;
  network: 'testnet';
  sandbox: boolean;
  piApiConfigured: boolean;
}> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { ok: false, network: 'testnet', sandbox: true, piApiConfigured: false };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      sandbox?: boolean;
      piApiConfigured?: boolean;
    };
    return {
      ok: Boolean(data.ok),
      network: 'testnet',
      sandbox: data.sandbox !== false,
      piApiConfigured: Boolean(data.piApiConfigured),
    };
  } catch {
    return { ok: false, network: 'testnet', sandbox: true, piApiConfigured: false };
  }
}

export function isPiBrowserEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('pibrowser') || ua.includes('pinet');
}

export async function handleIncompletePayment(payment: {
  identifier: string;
  transaction?: { txid?: string };
}): Promise<{ resolved: boolean; status: string }> {
  try {
    const res = await fetch('/api/pi/incomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.identifier,
        txid: payment.transaction?.txid || '',
      }),
    });
    if (!res.ok) return { resolved: false, status: 'FAILED' };
    const data = (await res.json()) as { resolved?: boolean; status?: string };
    return { resolved: Boolean(data.resolved), status: data.status || 'PENDING' };
  } catch {
    return { resolved: false, status: 'FAILED' };
  }
}

export async function initPiTestnetSdk(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const w = window as WindowWithPi;
  if (!w.Pi) return false;
  if (piInitialized) return true;
  if (piInitPromise) return piInitPromise;

  piInitPromise = (async () => {
    try {
      // Do not pass "sandbox" - Pi SDK v2.0 detects environment automatically.
      await w.Pi!.init({ version: '2.0' });
      piInitialized = true;
      return true;
    } catch {
      piInitPromise = null;
      return false;
    }
  })();

  return piInitPromise;
}

export async function checkServerIncompletePayments(): Promise<number> {
  try {
    const res = await fetch('/api/pi/payments');
    if (!res.ok) return 0;
    const data = (await res.json()) as { payments?: { paymentId: string; status: string; txid?: string }[] };
    const pending = (data.payments || []).filter(
      (p) => p.status === 'PENDING' || p.status === 'APPROVED'
    );
    for (const p of pending) {
      if (p.txid) {
        await handleIncompletePayment({ identifier: p.paymentId, transaction: { txid: p.txid } });
      }
    }
    return pending.length;
  } catch {
    return 0;
  }
}

async function exchangeAccessTokenWithServer(accessToken: string): Promise<{
  uid: string;
  username: string;
  sessionToken?: string;
}> {
  const loginRes = await fetch('/api/pi/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ accessToken }),
  });

  if (!loginRes.ok) {
    const err = (await loginRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Server failed to validate Pi accessToken.');
  }

  const data = (await loginRes.json()) as {
    ok?: boolean;
    sessionToken?: string;
    user?: { uid?: string; username?: string };
  };

  if (!data.ok || !data.user?.uid || !data.user?.username) {
    throw new Error('Invalid verified identity returned by server.');
  }

  return {
    uid: data.user.uid,
    username: data.user.username,
    sessionToken: data.sessionToken,
  };
}

export async function authenticateWithPiTestnet(): Promise<PiAuthResult> {
  const sdkReady = await initPiTestnetSdk();
  const w = window as WindowWithPi;

  if (sdkReady && w.Pi && isPiBrowserEnvironment()) {
    const auth = await w.Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      (incomplete) => {
        void handleIncompletePayment(incomplete);
      }
    );
    // Keep only accessToken; ignore browser-supplied uid & username and trust only /api/pi/login (App Studio).
    const verified = await exchangeAccessTokenWithServer(auth.accessToken);
    return {
      uid: verified.uid,
      username: verified.username.startsWith('@') ? verified.username : `@${verified.username}`,
      walletAddress:
        auth.user?.wallet_address ||
        `GTEST${verified.uid.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 18)}AFOMI`,
      accessToken: verified.sessionToken || auth.accessToken,
      mode: 'pi-browser',
    };
  }

  // When running outside Pi Browser / PiNet, attempt SDK auth briefly before falling back to local Testnet sandbox preview
  if (sdkReady && w.Pi) {
    try {
      const auth = await Promise.race([
        w.Pi.authenticate(['username', 'payments', 'wallet_address'], (incomplete) => {
          void handleIncompletePayment(incomplete);
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Pi Browser host not detected')), 1600)
        ),
      ]);
      const verified = await exchangeAccessTokenWithServer(auth.accessToken);
      return {
        uid: verified.uid,
        username: verified.username.startsWith('@') ? verified.username : `@${verified.username}`,
        walletAddress:
          auth.user?.wallet_address ||
          `GTEST${verified.uid.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 18)}AFOMI`,
        accessToken: verified.sessionToken || auth.accessToken,
        mode: 'pi-browser',
      };
    } catch {
      // Fall through cleanly to local Testnet sandbox preview when Pi Browser host is unavailable
    }
  }

  const sandboxUid = `pi_testnet_${Math.random().toString(36).slice(2, 10)}`;
  return {
    uid: sandboxUid,
    username: '@amara_testnet',
    walletAddress: 'GTESTAFOMI7X9P2K4L8M3Q5R9W2Z6N1C4V8TESTNET',
    accessToken: `testnet_token_${Date.now()}`,
    mode: 'testnet-sandbox',
  };
}

export async function executePiPayment(params: PiPaymentCallbacks): Promise<PiPaymentOutcome> {
  const { amount, memo, metadata, simulateFailure, onPhase } = params;

  if (!Number.isFinite(amount) || amount < 0.1 || amount > 1000) {
    return {
      ok: false,
      error: 'Pi amount must be between 0.1 Pi and 1000 Pi.',
    };
  }

  if (simulateFailure) {
    const failedId = `pi_fail_${Date.now()}`;
    await fetch('/api/pi/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: failedId,
        amount,
        memo,
        status: 'FAILED',
        reason: 'Simulated payment failure before server approval',
      }),
    }).catch(() => undefined);
    return {
      ok: false,
      paymentId: failedId,
      error: 'Pi Testnet payment failed. Funds were NOT locked in Escrow.',
    };
  }

  const sdkReady = await initPiTestnetSdk();
  const w = window as WindowWithPi;

  if (sdkReady && w.Pi && isPiBrowserEnvironment()) {
    return new Promise<PiPaymentOutcome>((resolve) => {
      onPhase?.('creating');
      w.Pi!.createPayment(
        {
          amount,
          memo,
          metadata: { ...metadata, network: 'testnet' },
        },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              onPhase?.('approving');
              const res = await fetch('/api/pi/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                  paymentId,
                  amount,
                  memo,
                  metadata,
                }),
              });
              if (!res.ok) {
                const err = (await res.json().catch(() => ({}))) as { error?: string };
                resolve({ ok: false, paymentId, error: err.error || 'Server approval failed.' });
              }
            } catch {
              resolve({ ok: false, paymentId, error: 'Network error calling /api/pi/approve.' });
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              onPhase?.('completing');
              const res = await fetch('/api/pi/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ paymentId, txid, amount }),
              });
              const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
              if (!res.ok || !data.ok) {
                resolve({
                  ok: false,
                  paymentId,
                  txid,
                  error: data.error || 'Backend payment verification failed.',
                });
                return;
              }
              onPhase?.('verified');
              resolve({ ok: true, paymentId, txid });
            } catch {
              resolve({ ok: false, paymentId, error: 'Network error calling /api/pi/complete.' });
            }
          },
          onCancel: async (paymentId: string) => {
            await fetch('/api/pi/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, amount, memo, status: 'CANCELLED' }),
            }).catch(() => undefined);
            resolve({
              ok: false,
              paymentId,
              cancelled: true,
              error: 'Payment cancelled by user. Escrow funds were NOT locked.',
            });
          },
          onError: async (error: Error, payment?: { identifier?: string }) => {
            const paymentId = payment?.identifier || `err_${Date.now()}`;
            await fetch('/api/pi/cancel', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentId,
                amount,
                memo,
                status: 'FAILED',
                reason: error.message,
              }),
            }).catch(() => undefined);
            resolve({
              ok: false,
              paymentId,
              error: error.message || 'Pi payment encountered an error.',
            });
          },
        }
      );
    });
  }

  // Testnet Sandbox Server-Verified Flow (when outside Pi Browser host, still strictly runs /api/pi/approve -> /api/pi/complete)
  const paymentId = `pi_tn_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const txid = `tx_testnet_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    onPhase?.('creating');
    await new Promise((r) => setTimeout(r, 250));

    onPhase?.('approving');
    const approveRes = await fetch('/api/pi/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        paymentId,
        amount,
        memo,
        metadata: { ...metadata, network: 'testnet' },
      }),
    });
    const approveData = (await approveRes.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!approveRes.ok || !approveData.ok) {
      return {
        ok: false,
        paymentId,
        error: approveData.error || 'Server payment approval failed.',
      };
    }

    onPhase?.('completing');
    const completeRes = await fetch('/api/pi/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ paymentId, txid, amount }),
    });
    const completeData = (await completeRes.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!completeRes.ok || !completeData.ok) {
      return {
        ok: false,
        paymentId,
        txid,
        error: completeData.error || 'Server payment completion verification failed.',
      };
    }

    onPhase?.('verified');
    return { ok: true, paymentId, txid };
  } catch {
    return {
      ok: false,
      paymentId,
      error: 'Network failure while verifying Pi payment on backend.',
    };
  }
}
