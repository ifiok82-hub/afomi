import React, { useEffect, useState } from 'react';
import { Delete, Lock, ShieldAlert, X } from 'lucide-react';
import { useAfomi } from '../context/AfomiContext';
import { AFOMI_LOGO_URL } from '../data/seedData';

export const AdminPinModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { adminSettings, unlockAdminWithPin, showToast } = useAfomi();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);

  useEffect(() => {
    if (!open) {
      setPin('');
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

  if (!open) return null;

  const verifyPin = async (candidate: string) => {
    if (submitting || lockSeconds > 0 || candidate.length !== 4) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: candidate }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        locked?: boolean;
        remainingSeconds?: number;
        message?: string;
      };
      if (res.ok && data.ok) {
        setPin('');
        onClose();
        unlockAdminWithPin();
        showToast('AFOMI Admin Management Dashboard unlocked.', 'success');
      } else {
        setPin('');
        if (data.locked && data.remainingSeconds) {
          setLockSeconds(data.remainingSeconds);
          setError(`Too many attempts. Locked for ${data.remainingSeconds} seconds.`);
        } else {
          setError(data.message || 'Incorrect PIN.');
        }
      }
    } catch {
      setError('Network error verifying Admin PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDigit = (d: string) => {
    if (lockSeconds > 0 || submitting) return;
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      void verifyPin(next);
    }
  };

  const handleBackspace = () => {
    if (lockSeconds > 0 || submitting) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl border border-[#E7E3EE] p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={adminSettings.logoUrl || AFOMI_LOGO_URL}
              alt="AFOMI Logo"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-sm font-extrabold text-[#6A1B9A]">AFOMI Admin Access</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin PIN"
            className="min-h-[36px] min-w-[36px] rounded-xl hover:bg-[#FAF8FC] flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#F5EEFA] text-[#6A1B9A] mx-auto flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-[#1A1625]">Enter 4-Digit Security PIN</h2>
          <div className="flex items-center justify-center gap-3 pt-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-extrabold tabular-nums ${
                  pin[idx]
                    ? 'border-[#6A1B9A] bg-[#F5EEFA] text-[#6A1B9A]'
                    : 'border-[#E7E3EE] bg-[#FAF8FC] text-[#645E72]'
                }`}
              >
                {pin[idx] ? '•' : ''}
              </div>
            ))}
          </div>
        </div>

        {(error || lockSeconds > 0) && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>
              {lockSeconds > 0
                ? `Too many attempts. Try again in ${lockSeconds}s.`
                : error}
            </span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={lockSeconds > 0 || submitting}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl border border-[#E7E3EE] bg-[#FAF8FC] hover:border-[#6A1B9A] hover:bg-[#F5EEFA] text-lg font-bold text-[#1A1625] tabular-nums disabled:opacity-40 cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={lockSeconds > 0 || submitting}
            onClick={() => {
              setPin('');
              setError('');
            }}
            className="h-12 rounded-2xl border border-[#E7E3EE] bg-white text-xs font-semibold text-[#645E72] hover:text-[#1A1625] disabled:opacity-40 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            disabled={lockSeconds > 0 || submitting}
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl border border-[#E7E3EE] bg-[#FAF8FC] hover:border-[#6A1B9A] hover:bg-[#F5EEFA] text-lg font-bold text-[#1A1625] tabular-nums disabled:opacity-40 cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            disabled={lockSeconds > 0 || submitting}
            onClick={handleBackspace}
            aria-label="Backspace"
            className="h-12 rounded-2xl border border-[#E7E3EE] bg-white flex items-center justify-center text-[#1A1625] hover:bg-[#FAF8FC] disabled:opacity-40 cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <input
          type="password"
          inputMode="numeric"
          maxLength={4}
          value={pin}
          disabled={lockSeconds > 0 || submitting}
          onChange={(e) => {
            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(cleaned);
            if (cleaned.length === 4) void verifyPin(cleaned);
          }}
          placeholder="Or type 4-digit PIN..."
          className="w-full min-h-[40px] px-3.5 rounded-xl border border-[#E7E3EE] text-center text-xs tracking-widest focus:outline-none focus:border-[#6A1B9A]"
        />
      </div>
    </div>
  );
};
