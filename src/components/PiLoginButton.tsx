import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithPi } from '../lib/piAuth';

export default function PiLoginButton({
  onSignedIn,
}: {
  onSignedIn?: (u: { uid: string; username: string }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handle() {
    setLoading(true);
    setError('');
    try {
      const s = await signInWithPi();
      onSignedIn?.({ uid: s.uid, username: s.username });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Pi login failed';
      setError(message || 'Pi login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handle}
        disabled={loading}
        className="w-full min-h-[48px] px-4 py-3.5 rounded-2xl bg-[#6A1B9A] hover:bg-[#581482] disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-[#FFC107]" />
        ) : (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FFC107] text-[#2B1F00] font-extrabold text-xs">
            π
          </span>
        )}
        <span>{loading ? 'Connecting to Pi...' : 'Login with Pi'}</span>
      </button>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
