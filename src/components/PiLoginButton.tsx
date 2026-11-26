import { useState } from "react";
import { signInWithPi } from "../lib/piAuth";
export default function PiLoginButton({ onSignedIn }: { onSignedIn?: (u: { uid: string; username: string }) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function handle() {
    setLoading(true); setError("");
    try {
      const s = await signInWithPi();
      onSignedIn?.({ uid: s.uid, username: s.username });
    } catch (e: any) { setError(e?.message || "Pi login failed"); }
    finally { setLoading(false); }
  }
  return (
    <div>
      <button onClick={handle} disabled={loading} style={{ width: "100%", padding: 14, borderRadius: 12, background: "#6A1B9A", color: "#fff", fontWeight: 700 }}>
        {loading ? "Connecting to Pi..." : "Login with Pi"}
      </button>
      {error && <p style={{ color: "red", fontSize: 13 }}>{error}</p>}
    </div>
  );
}
