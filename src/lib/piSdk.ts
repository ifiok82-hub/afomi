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
    init: (opts: { version: string; sandbox: boolean }) => void;
    authenticate: (
      scopes: string[],
      onIncompletePaymentFound: (payment: { identifier: string; transaction?: { txid?: string } }) => void
    ) => Promise<{
      accessToken: string;
      user: { uid: string; username: string; wallet_address?: string };
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

export function initPiTestnetSdk(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as WindowWithPi;
  if (!w.Pi) return false;
  if (!piInitialized) {
    try {
      // Strictly enforce Pi Testnet (sandbox: true). Never use Mainnet.
      w.Pi.init({ version: '2.0', sandbox: true });
      piInitialized = true;
    } catch {
      return false;
    }
  }
  return true;
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

export async function authenticateWithPiTestnet(): Promise<PiAuthResult> {
  const sdkReady = initPiTestnetSdk();
  const w = window as WindowWithPi;

  if (sdkReady && w.Pi && isPiBrowserEnvironment()) {
    const auth = await w.Pi.authenticate(
      ['username', 'payments', 'wallet_address'],
      (incomplete) => {
        void handleIncompletePayment(incomplete);
      }
    );
    return {
      uid: auth.user.uid,
      username: auth.user.username.startsWith('@') ? auth.user.username : `@${auth.user.username}`,
      walletAddress:
        auth.user.wallet_address ||
        `GTEST${auth.user.uid.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 18)}AFOMI`,
      accessToken: auth.accessToken,
      mode: 'pi-browser',
    };
  }

  // Testnet Sandbox Bridge when running outside Pi Browser / PiNet
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
      return {
        uid: auth.user.uid,
        username: auth.user.username.startsWith('@') ? auth.user.username : `@${auth.user.username}`,
        walletAddress:
          auth.user.wallet_address ||
          `GTEST${auth.user.uid.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 18)}AFOMI`,
        accessToken: auth.accessToken,
        mode: 'pi-browser',
      };
    } catch {
      // Fall through cleanly to Testnet sandbox session below
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
  const { amount, memo, metadata, userUid, piUsername, simulateFailure, onPhase } = params;

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

  const sdkReady = initPiTestnetSdk();
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
                body: JSON.stringify({
                  paymentId,
                  amount,
                  memo,
                  metadata,
                  userUid,
                  piUsername,
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
      body: JSON.stringify({
        paymentId,
        amount,
        memo,
        metadata: { ...metadata, network: 'testnet' },
        userUid,
        piUsername,
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
