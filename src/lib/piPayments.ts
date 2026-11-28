import { initPi, signInWithPi } from './piAuth';

export interface PayForTaskParams {
  taskId: string;
  taskTitle: string;
  amount: number;
  workerUid?: string;
}

export interface PayForTaskResult {
  paymentId: string;
  txid: string;
}

export async function payForTask({
  taskId,
  taskTitle,
  amount,
  workerUid = '',
}: PayForTaskParams): Promise<PayForTaskResult> {
  if (typeof window === 'undefined' || !window.Pi) {
    throw new Error('Pi SDK not available. Please open AFOMI in Pi Browser.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Invalid task payment amount.');
  }

  await initPi();
  const session = await signInWithPi();
  const payerUid = session.uid;

  const Pi = window.Pi;
  if (!Pi?.createPayment) {
    throw new Error('Pi.createPayment is unavailable in this Pi SDK environment.');
  }

  const memo = `AFOMI Task - ${taskTitle}`.slice(0, 100);
  const metadata = {
    type: 'task_escrow',
    taskId,
    payerUid,
    workerUid,
    app: 'AFOMI',
  };

  return new Promise<PayForTaskResult>((resolve, reject) => {
    let settled = false;
    const failOnce = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    Pi.createPayment!(
      { amount, memo, metadata },
      {
        onReadyForServerApproval: async (paymentId: string) => {
          const res = await fetch('/.netlify/functions/pi-approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, taskId, amount, payerUid }),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as { error?: string };
            const err = new Error(data.error || `Server approval failed (${res.status})`);
            failOnce(err);
            throw err;
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            const res = await fetch('/.netlify/functions/pi-complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId, txid, taskId, amount, payerUid }),
            });
            const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
            if (!res.ok || !data.ok) {
              failOnce(new Error(data.error || `Server completion failed (${res.status})`));
              return;
            }
            if (!settled) {
              settled = true;
              resolve({ paymentId, txid });
            }
          } catch (err) {
            failOnce(err instanceof Error ? err : new Error('Failed to complete Pi payment.'));
          }
        },
        onCancel: () => {
          failOnce(new Error('Payment was cancelled. Funds were not locked in escrow.'));
        },
        onError: (error: Error) => {
          failOnce(error instanceof Error ? error : new Error('Pi payment error.'));
        },
      }
    );
  });
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
    const res = await fetch('/.netlify/functions/pi-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.identifier,
        txid: payment.transaction?.txid || null,
        resume: true,
      }),
    });
    if (!res.ok) return { resolved: false, status: 'FAILED' };
    const data = (await res.json()) as { ok?: boolean; escrow?: string };
    return { resolved: Boolean(data.ok), status: data.escrow || 'COMPLETED' };
  } catch {
    return { resolved: false, status: 'FAILED' };
  }
}

export async function checkServerIncompletePayments(): Promise<number> {
  return 0;
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
    return {
      ok: false,
      paymentId: `pi_fail_${Date.now()}`,
      error: 'Pi Testnet payment failed. Funds were NOT locked in Escrow.',
    };
  }

  if (isPiBrowserEnvironment() && window.Pi?.createPayment) {
    try {
      await initPi();
      const session = await signInWithPi();
      const payerUid = session.uid;
      const taskId = String(metadata.taskId || metadata.id || `afomi_${Date.now()}`);

      return new Promise<PiPaymentOutcome>((resolve) => {
        onPhase?.('creating');
        window.Pi!.createPayment!(
          {
            amount,
            memo: memo.slice(0, 100),
            metadata: { ...metadata, taskId, payerUid, app: 'AFOMI' },
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              try {
                onPhase?.('approving');
                const res = await fetch('/.netlify/functions/pi-approve', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, taskId, amount, payerUid }),
                });
                if (!res.ok) {
                  const err = (await res.json().catch(() => ({}))) as { error?: string };
                  resolve({ ok: false, paymentId, error: err.error || 'Server approval failed.' });
                }
              } catch {
                resolve({ ok: false, paymentId, error: 'Network error calling pi-approve.' });
              }
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              try {
                onPhase?.('completing');
                const res = await fetch('/.netlify/functions/pi-complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ paymentId, txid, taskId, amount, payerUid }),
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
                resolve({ ok: false, paymentId, error: 'Network error calling pi-complete.' });
              }
            },
            onCancel: (paymentId: string) => {
              resolve({
                ok: false,
                paymentId,
                cancelled: true,
                error: 'Payment cancelled by user. Escrow funds were NOT locked.',
              });
            },
            onError: (error: Error, payment?: { identifier?: string }) => {
              resolve({
                ok: false,
                paymentId: payment?.identifier || `err_${Date.now()}`,
                error: error.message || 'Pi payment encountered an error.',
              });
            },
          }
        );
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Pi payment initialization failed.',
      };
    }
  }

  return {
    ok: false,
    error: 'Please open AFOMI in Pi Browser to complete real Pi U2A payment.',
  };
}
