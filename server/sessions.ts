import crypto from "crypto";

/**
 * Login sessions (security stage 1, owner-approved 23-10-2026).
 *
 * Until now the browser only kept the user object it got at login and the
 * server never checked who sent a request. After a successful login the server
 * now hands out a signed session token; the browser sends it with every /api
 * request (Authorization: Bearer ...).
 *
 * Tokens are stateless (HMAC-signed), so every Cloud Run instance can verify
 * them without a database lookup. A token only proves WHO the user is; the
 * role is always read from the current account record, and a token issued
 * before the last password change is rejected.
 *
 * SESSION_SECRET must be set in the Cloud Run environment before stage 2
 * (enforcement). Without it a public fallback is used and tokens could be forged.
 */

const FALLBACK_SECRET = "lpksci-insecure-fallback-secret-set-SESSION_SECRET";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

let warnedAboutSecret = false;
function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn("⚠️ [Auth] SESSION_SECRET is not set (or shorter than 16 chars) - session tokens use an insecure fallback secret.");
  }
  return FALLBACK_SECRET;
}

export function hasStrongSessionSecret(): boolean {
  const s = process.env.SESSION_SECRET;
  return !!s && s.length >= 16;
}

const b64url = (buf: Buffer) => buf.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const fromB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

function sign(data: string, secret: string): string {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

export interface SessionPayload {
  /** username (lowercase) */
  u: string;
  /** issued at (ms) */
  iat: number;
  /** expires at (ms) */
  exp: number;
  /** passwordChangedAt of the account when the token was issued ("" if never) */
  pv: string;
}

export function createSessionToken(
  user: { username?: string; passwordChangedAt?: string | null },
  now: number = Date.now(),
  secret: string = getSecret(),
): string {
  const payload: SessionPayload = {
    u: String(user.username || "").trim().toLowerCase(),
    iat: now,
    exp: now + SESSION_TTL_MS,
    pv: String(user.passwordChangedAt || ""),
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  return `v1.${body}.${sign(body, secret)}`;
}

/** Verifies signature and expiry; returns the payload or null. */
export function verifySessionToken(token: unknown, now: number = Date.now(), secret: string = getSecret()): SessionPayload | null {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [, body, sig] = parts;
  const expected = sign(body, secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as SessionPayload;
    if (!payload || typeof payload.u !== "string" || !payload.u) return null;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readBearerToken(headers: Record<string, any> | undefined): string | null {
  const raw = headers?.authorization || headers?.Authorization;
  if (typeof raw !== "string") return null;
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Resolves the account behind a request's session token, or null.
 * The token must match an existing, non-suspended account and its current
 * password version.
 */
export function resolveSessionUser(headers: Record<string, any> | undefined, users: any[] | null | undefined, now: number = Date.now()): any | null {
  const payload = verifySessionToken(readBearerToken(headers), now);
  if (!payload) return null;
  const user = (users || []).find((u: any) => u && String(u.username || "").trim().toLowerCase() === payload.u);
  if (!user) return null;
  if (user.status === "Suspended") return null;
  if (String(user.passwordChangedAt || "") !== payload.pv) return null;
  return user;
}
