import crypto from "crypto";

/**
 * Verifies a Firebase Authentication ID token (Google sign-in) on the server
 * (security stage 1, 23-10-2026). Google sign-in used to happen only in the
 * browser, which then simply claimed "I am <email>"; the server now checks the
 * token's signature against Google's public certificates before trusting it.
 */

const CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

async function getGoogleCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expiresAt > Date.now()) return certCache.certs;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error(`certs ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = Number((res.headers.get("cache-control") || "").match(/max-age=(\d+)/)?.[1] || 3600);
  certCache = { certs, expiresAt: Date.now() + Math.max(60, maxAge) * 1000 };
  return certs;
}

const decodeSegment = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));

export interface VerifiedGoogleIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

/** Pure claim checks (exported for tests). */
export function checkIdTokenClaims(payload: any, projectId: string, nowSec: number): string | null {
  if (!payload || typeof payload !== "object") return "payload";
  if (payload.aud !== projectId) return "aud";
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return "iss";
  if (typeof payload.exp !== "number" || payload.exp <= nowSec) return "exp";
  if (typeof payload.iat !== "number" || payload.iat > nowSec + 300) return "iat";
  if (!payload.sub || typeof payload.sub !== "string") return "sub";
  if (!payload.email || typeof payload.email !== "string") return "email";
  return null;
}

export async function verifyFirebaseIdToken(idToken: unknown, projectId: string): Promise<VerifiedGoogleIdentity | null> {
  if (typeof idToken !== "string" || !projectId) return null;
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decodeSegment(parts[0]);
    const payload = decodeSegment(parts[1]);
    if (header.alg !== "RS256" || !header.kid) return null;
    const certs = await getGoogleCerts();
    const cert = certs[header.kid];
    if (!cert) return null;
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2].replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (!verifier.verify(cert, signature)) return null;
    if (checkIdTokenClaims(payload, projectId, Math.floor(Date.now() / 1000))) return null;
    return {
      uid: payload.sub,
      email: String(payload.email).trim().toLowerCase(),
      emailVerified: payload.email_verified === true,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (e) {
    // Google's certificates unreachable: let the caller answer 5xx (the browser
    // then falls back) instead of claiming the token is invalid.
    if (String((e as Error)?.message || "").startsWith("certs") || (e as Error)?.name === "TypeError") throw e;
    console.warn("[Auth] Google ID token verification failed:", (e as Error)?.message || e);
    return null;
  }
}
