import { loginWithPi } from './piAuth';

export interface PayForTaskParams {
  taskId: string;
  taskTitle: string;
  amount: number;
  workerUid?: string;
}

export interface PayForProductParams {
  productId: string;
  productTitle: string;
  amount: number;
  sellerUid?: string;
}

export interface PiU2APaymentResult {
  paymentId: string;
  txid: string;
}

const APPROVAL_TIMEOUT_MSG = 'Server approval timed out';
const COMPLETION_TIMEOUT_MSG = 'Server completion timed out';
const STALE_PAYMENT_MSG = 'Old payment cancelled. Please tap Pay again - you will see 2 popups.';

async function fetchJsonWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  timeoutMessage: string
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function formatBackendError(
  data: Record<string, unknown>,
  status: number,
  fallback: string
): string {
  const rawErr = typeof data.error === 'string' ? data.error : '';
  if (rawErr === 'payment_not_found_stale' || rawErr.startsWith('payment_not_found_stale')) {
    return STALE_PAYMENT_MSG;
  }
  const errStr = rawErr || `${fallback} (${status})`;
  const detailText = typeof data.detail === 'string' && data.detail ? ` (${data.detail})` : '';
  return `${errStr}${detailText}`;
}

async function runGenericU2APayment(opts: {
  amount: number;
  memo: string;
  itemType: 'task' | 'product';
  taskId?: string;
  productId?: string;
  itemId: string;
  buildMetadata: (payerUid: string) => Record<string, unknown>;
}): Promise<PiU2APaymentResult> {
  if (typeof window === 'undefined' || !window.Pi) {
    throw new Error('Pi SDK not available. Please open AFOMI in Pi Browser.');
  }
  if (!Number.isFinite(opts.amount) || opts.amount <= 0) {
    throw new Error('Invalid payment amount.');
  }

  const session = await loginWithPi();
  const payerUid = session.uid;

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('afomi_stale_payment');
    }
  } catch {
    // ignore storage errors
  }

  const Pi = window.Pi;
  if (!Pi?.createPayment) {
    throw new Error('Pi.createPayment is unavailable in this Pi SDK environment.');
  }

  const cleanAmount = Number(opts.amount.toFixed(7));
  const memo = opts.memo.slice(0, 100);
  const metadata = opts.buildMetadata(payerUid);

  return new Promise<PiU2APaymentResult>((resolve, reject) => {
    let settled = false;
    const failOnce = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    try {
      const maybePromise = Pi.createPayment!(
        { amount: cleanAmount, memo, metadata },
        {
          onReadyForServerApproval: async (paymentId: string) => {
            try {
              const { ok, status, data } = await fetchJsonWithTimeout(
                '/.netlify/functions/pi-approve',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    paymentId,
                    amount: cleanAmount,
                    payerUid,
                    taskId: opts.taskId,
                    productId: opts.productId,
                    itemId: opts.itemId,
                    itemType: opts.itemType,
                  }),
                },
                9000,
                APPROVAL_TIMEOUT_MSG
              );
              if (!ok) {
                const err = new Error(formatBackendError(data, status, 'Server approval failed'));
                failOnce(err);
                throw err;
              }
            } catch (err) {
              const finalErr =
                err instanceof Error ? err : new Error('Server approval failed.');
              failOnce(finalErr);
              throw finalErr;
            }
          },
          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            try {
              const { ok, status, data } = await fetchJsonWithTimeout(
                '/.netlify/functions/pi-complete',
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    paymentId,
                    txid,
                    amount: cleanAmount,
                    payerUid,
                    taskId: opts.taskId,
                    productId: opts.productId,
                    itemId: opts.itemId,
                    itemType: opts.itemType,
                  }),
                },
                9000,
                COMPLETION_TIMEOUT_MSG
              );
              if (!ok || !data.ok) {
                failOnce(new Error(formatBackendError(data, status, 'Server completion failed')));
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
          onError: (error: unknown, payment?: { identifier?: string }) => {
            console.error('Pi.createPayment onError:', error, payment);
            const msg =
              error instanceof Error
                ? error.message
                : error && typeof error === 'object' && 'message' in error
                ? String((error as { message: unknown }).message)
                : typeof error === 'string'
                ? error
                : 'Pi payment error.';
            failOnce(new Error(msg || 'Pi payment error.'));
          },
        }
      ) as unknown;
      if (maybePromise && typeof (maybePromise as Promise<unknown>).catch === 'function') {
        (maybePromise as Promise<unknown>).catch((err: unknown) => {
          console.error('Pi.createPayment rejected:', err);
          failOnce(err instanceof Error ? err : new Error(String(err || 'Pi payment failed.')));
        });
      }
    } catch (err) {
      failOnce(err instanceof Error ? err : new Error('Failed to start Pi payment.'));
    }
  });
}

export async function payForTask({
  taskId,
  taskTitle,
  amount,
  workerUid = '',
}: PayForTaskParams): Promise<PiU2APaymentResult> {
  return runGenericU2APayment({
    amount,
    memo: `AFOMI Task - ${taskTitle}`,
    itemType: 'task',
    taskId,
    itemId: taskId,
    buildMetadata: (payerUid) => ({
      type: 'task_escrow',
      taskId,
      payerUid,
      workerUid,
      app: 'AFOMI',
    }),
  });
}

export async function payForProduct({
  productId,
  productTitle,
  amount,
  sellerUid = '',
}: PayForProductParams): Promise<PiU2APaymentResult> {
  return runGenericU2APayment({
    amount,
    memo: `AFOMI Product - ${productTitle}`,
    itemType: 'product',
    productId,
    itemId: productId,
    buildMetadata: (payerUid) => ({
      type: 'product_escrow',
      productId,
      itemId: productId,
      payerUid,
      sellerUid,
      app: 'AFOMI',
    }),
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
  console.log('Ignoring stale incomplete payment', payment?.identifier);
  return { resolved: false, status: 'IGNORED' };
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

  if (typeof window !== 'undefined' && window.Pi?.createPayment) {
    try {
      const session = await loginWithPi();
      const payerUid = session.uid;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('afomi_stale_payment');
        }
      } catch {
        // ignore storage errors
      }
      const itemType = String(metadata.type || 'market');
      const taskId = typeof metadata.taskId === 'string' ? metadata.taskId : undefined;
      const productId =
        typeof metadata.productId === 'string'
          ? metadata.productId
          : itemType === 'market' && typeof metadata.id === 'string'
          ? metadata.id
          : undefined;
      const itemId = String(taskId || productId || metadata.id || `afomi_${Date.now()}`);

      return await new Promise<PiPaymentOutcome>((resolve) => {
        let settled = false;
        const resolveOnce = (outcome: PiPaymentOutcome) => {
          if (settled) return;
          settled = true;
          resolve(outcome);
        };

        onPhase?.('creating');
        window.Pi!.createPayment!(
          {
            amount,
            memo: memo.slice(0, 100),
            metadata: { ...metadata, itemId, payerUid, app: 'AFOMI' },
          },
          {
            onReadyForServerApproval: async (paymentId: string) => {
              try {
                onPhase?.('approving');
                const { ok, status, data } = await fetchJsonWithTimeout(
                  '/.netlify/functions/pi-approve',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      paymentId,
                      amount,
                      payerUid,
                      taskId,
                      productId,
                      itemId,
                      itemType,
                    }),
                  },
                  9000,
                  APPROVAL_TIMEOUT_MSG
                );
                if (!ok) {
                  const errMsg = formatBackendError(data, status, 'Server approval failed');
                  resolveOnce({ ok: false, paymentId, error: errMsg });
                  throw new Error(errMsg);
                }
              } catch (err) {
                const errMsg =
                  err instanceof Error ? err.message : 'Network error calling pi-approve.';
                resolveOnce({ ok: false, paymentId, error: errMsg });
                throw err instanceof Error ? err : new Error(errMsg);
              }
            },
            onReadyForServerCompletion: async (paymentId: string, txid: string) => {
              try {
                onPhase?.('completing');
                const { ok, status, data } = await fetchJsonWithTimeout(
                  '/.netlify/functions/pi-complete',
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      paymentId,
                      txid,
                      amount,
                      payerUid,
                      taskId,
                      productId,
                      itemId,
                      itemType,
                    }),
                  },
                  9000,
                  COMPLETION_TIMEOUT_MSG
                );
                if (!ok || !data.ok) {
                  resolveOnce({
                    ok: false,
                    paymentId,
                    txid,
                    error: formatBackendError(data, status, 'Backend payment verification failed'),
                  });
                  return;
                }
                onPhase?.('verified');
                resolveOnce({ ok: true, paymentId, txid });
              } catch (err) {
                resolveOnce({
                  ok: false,
                  paymentId,
                  error: err instanceof Error ? err.message : 'Network error calling pi-complete.',
                });
              }
            },
            onCancel: (paymentId: string) => {
              resolveOnce({
                ok: false,
                paymentId,
                cancelled: true,
                error: 'Payment cancelled by user. Escrow funds were NOT locked.',
              });
            },
            onError: (error: Error, payment?: { identifier?: string }) => {
              resolveOnce({
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
