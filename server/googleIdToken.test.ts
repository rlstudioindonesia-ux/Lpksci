// @vitest-environment node
import { describe, it, expect } from "vitest";
import { checkIdTokenClaims, verifyFirebaseIdToken } from "./googleIdToken";

describe("checkIdTokenClaims", () => {
  const base = { aud: "proj", iss: "https://securetoken.google.com/proj", exp: 2000, iat: 1000, sub: "uid1", email: "a@gmail.com" };

  it("accepts valid claims", () => {
    expect(checkIdTokenClaims(base, "proj", 1500)).toBeNull();
  });

  it("rejects wrong project, issuer, expired or missing email", () => {
    expect(checkIdTokenClaims({ ...base, aud: "other" }, "proj", 1500)).toBe("aud");
    expect(checkIdTokenClaims({ ...base, iss: "x" }, "proj", 1500)).toBe("iss");
    expect(checkIdTokenClaims(base, "proj", 2500)).toBe("exp");
    expect(checkIdTokenClaims({ ...base, email: "" }, "proj", 1500)).toBe("email");
  });
});

describe("verifyFirebaseIdToken", () => {
  it("rejects malformed tokens without network access", async () => {
    expect(await verifyFirebaseIdToken("abc", "proj")).toBeNull();
    expect(await verifyFirebaseIdToken(undefined, "proj")).toBeNull();
    const unsigned = `${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")}.${Buffer.from("{}").toString("base64url")}.`;
    expect(await verifyFirebaseIdToken(unsigned, "proj")).toBeNull();
  });
});
