/**
 * Browser side of the login session (security stage 1, 23-10-2026).
 *
 * /api/login (and /api/auth/google, /api/auth/change-password) return a
 * signed session token. It is kept in localStorage and sent automatically as
 * `Authorization: Bearer <token>` with every request to this app's /api.
 */

const TOKEN_KEY = "lpk_session_token";
const MUST_CHANGE_KEY = "lpk_must_change_password";
export const AUTH_CHANGED_EVENT = "lpk-auth-changed";

const notify = () => {
  try {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch (e) {}
};

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
}

export function setSessionToken(token: string | null | undefined) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
  notify();
}

export function getMustChangePassword(): boolean {
  try {
    return localStorage.getItem(MUST_CHANGE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

export function setMustChangePassword(value: boolean) {
  try {
    if (value) localStorage.setItem(MUST_CHANGE_KEY, "1");
    else localStorage.removeItem(MUST_CHANGE_KEY);
  } catch (e) {}
  notify();
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MUST_CHANGE_KEY);
  } catch (e) {}
  notify();
}

/** Saves what a login endpoint returned ({ token, mustChangePassword }). */
export function rememberLoginResponse(data: { token?: string; mustChangePassword?: boolean } | null | undefined) {
  if (!data) return;
  if (data.token) setSessionToken(data.token);
  setMustChangePassword(!!data.mustChangePassword);
}

/** Whether a fetch target is this app's own /api (relative or same origin). */
export function isOwnApiUrl(url: string, origin: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/")) return true;
  try {
    const u = new URL(url, origin);
    return u.origin === origin && u.pathname.startsWith("/api/");
  } catch (e) {
    return false;
  }
}

let installed = false;

/** Adds the session token to every request to this app's /api. Call once at startup. */
export function installAuthFetch() {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
      const token = getSessionToken();
      if (token && isOwnApiUrl(url, window.location.origin)) {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
        return originalFetch(input, { ...(init || {}), headers });
      }
    } catch (e) {}
    return originalFetch(input, init);
  };
}

export type GoogleServerLogin =
  | { status: "ok"; user: any }
  | { status: "error"; message: string }
  | { status: "unavailable" };

/**
 * Sends the Firebase ID token of a Google sign-in to the server, which verifies
 * it and logs the account in. "unavailable" (old server / network) lets the
 * caller fall back to the previous browser-only flow during stage 1.
 */
export async function loginWithGoogleOnServer(firebaseUser: { getIdToken: () => Promise<string> }): Promise<GoogleServerLogin> {
  try {
    const idToken = await firebaseUser.getIdToken();
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (res.status === 404) return { status: "unavailable" };
    const data = await res.json().catch(() => null);
    if (res.ok && data?.user) {
      rememberLoginResponse(data);
      return { status: "ok", user: data.user };
    }
    if (res.status >= 500) return { status: "unavailable" };
    return { status: "error", message: data?.error || "Login Google gagal." };
  } catch (e) {
    return { status: "unavailable" };
  }
}
