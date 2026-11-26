declare global { interface Window { Pi?: any } }
const APP_STUDIO_LOGIN = "https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login";
export type PiSession = { sessionToken: string; uid: string; username: string };
let piInitPromise: Promise<void> | null = null;
export function loadPiSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).Pi) return Promise.resolve();
  if (piInitPromise) return piInitPromise;
  piInitPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.minepi.com/pi-sdk.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Pi SDK failed to load"));
    document.head.appendChild(s);
  });
  return piInitPromise;
}
export async function initPi(): Promise<void> {
  await loadPiSdk();
  await (window as any).Pi.init({ version: "2.0" });
}
function onIncompletePaymentFound(payment: any) {
  console.log("AFOMI incomplete payment", payment?.identifier);
}
export async function signInWithPi(): Promise<PiSession> {
  await initPi();
  const auth = await (window as any).Pi.authenticate(["username"], onIncompletePaymentFound);
  const accessToken: string | undefined = auth?.accessToken;
  if (!accessToken) throw new Error("No accessToken from Pi.authenticate");
  const res = await fetch(APP_STUDIO_LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  if (!res.ok) throw new Error("App Studio login failed: " + res.status);
  const data = await res.json();
  const sessionToken = data?.sessionToken as string | undefined;
  const uid = data?.user?.uid as string | undefined;
  const username = data?.user?.username as string | undefined;
  if (!sessionToken || !uid || !username) throw new Error("Invalid App Studio response");
  const session: PiSession = { sessionToken, uid, username };
  (window as any).__AFOMI_PI_SESSION__ = session;
  return session;
}
export function getPiSession(): PiSession | null {
  return (window as any).__AFOMI_PI_SESSION__ ?? null;
}
export function signOutPi() {
  (window as any).__AFOMI_PI_SESSION__ = null;
}
