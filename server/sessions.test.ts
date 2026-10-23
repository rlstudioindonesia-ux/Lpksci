// @vitest-environment node
import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, resolveSessionUser, readBearerToken, SESSION_TTL_MS } from "./sessions";

const SECRET = "test-secret-1234567890";

describe("session tokens", () => {
  it("round-trips and expires", () => {
    const t = createSessionToken({ username: "Budi@X.id" }, 1000, SECRET);
    expect(verifySessionToken(t, 2000, SECRET)).toMatchObject({ u: "budi@x.id", pv: "" });
    expect(verifySessionToken(t, 1000 + SESSION_TTL_MS + 1, SECRET)).toBeNull();
  });

  it("rejects tampered tokens and other secrets", () => {
    const t = createSessionToken({ username: "budi" }, 1000, SECRET);
    const [v, body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "admin", iat: 1000, exp: 9e15, pv: "" })).toString("base64url");
    expect(verifySessionToken(`${v}.${forged}.${sig}`, 2000, SECRET)).toBeNull();
    expect(verifySessionToken(t, 2000, "another-secret-123456")).toBeNull();
    expect(verifySessionToken("abc", 2000, SECRET)).toBeNull();
    expect(verifySessionToken(undefined, 2000, SECRET)).toBeNull();
    expect(body.length).toBeGreaterThan(0);
  });

  it("reads the bearer header", () => {
    expect(readBearerToken({ authorization: "Bearer abc.def" })).toBe("abc.def");
    expect(readBearerToken({})).toBeNull();
  });
});

describe("resolveSessionUser", () => {
  const users = [
    { username: "budi", role: "Siswa", passwordChangedAt: "2026-10-23T01:00:00Z" },
    { username: "sari", role: "Siswa", status: "Suspended" },
  ];

  it("returns the account and rejects tokens from before a password change or for suspended accounts", () => {
    process.env.SESSION_SECRET = SECRET;
    const ok = createSessionToken(users[0], Date.now(), SECRET);
    const old = createSessionToken({ username: "budi", passwordChangedAt: "" }, Date.now(), SECRET);
    const suspended = createSessionToken(users[1], Date.now(), SECRET);
    expect(resolveSessionUser({ authorization: `Bearer ${ok}` }, users)?.username).toBe("budi");
    expect(resolveSessionUser({ authorization: `Bearer ${old}` }, users)).toBeNull();
    expect(resolveSessionUser({ authorization: `Bearer ${suspended}` }, users)).toBeNull();
    expect(resolveSessionUser({}, users)).toBeNull();
    delete process.env.SESSION_SECRET;
  });
});
