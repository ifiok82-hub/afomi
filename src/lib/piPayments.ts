import { initPi } from './piAuth';

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

interface PiPaymentSdk {
  createPayment?: (
    paymentData: { amount: number; memo: string; metadata: Record<string, unknown> },
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, payment?: { identifier?: string }) => void;
    }
  ) => void;
}

export function isPiBrowserEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('pibrowser') || ua.includes('pinet');
}

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

  const piSdk = (window as unknown as { Pi?: PiPaymentSdk }).Pi;
  if (isPiBrowserEnvironment() && piSdk?.createPayment) {
    try {
      await initPi();
      return new Promise<PiPaymentOutcome>((resolve) => {
        onPhase?.('creating');
        piSdk.createPayment!(
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
    } catch {
      // Fall through cleanly if Pi SDK is unavailable
    }
  }

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
