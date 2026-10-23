import { describe, it, expect, vi } from "vitest";

vi.mock("../firebaseClient", () => ({ auth: {} }));
vi.mock("firebase/auth", () => ({
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(() => false),
  signInWithEmailLink: vi.fn(),
}));

import { resolveResetEmail } from "./emailPasswordReset";

describe("resolveResetEmail", () => {
  const users = [
    { username: "budi", email: "Budi@X.id" },
    { username: "sari", email: "" },
  ];

  it("uses a typed email directly, or the email of a username", () => {
    expect(resolveResetEmail(" Siapa@Mail.com ", users)).toBe("siapa@mail.com");
    expect(resolveResetEmail("BUDI", users)).toBe("budi@x.id");
  });

  it("returns null for usernames without email or empty input", () => {
    expect(resolveResetEmail("sari", users)).toBeNull();
    expect(resolveResetEmail("tidakada", users)).toBeNull();
    expect(resolveResetEmail("", users)).toBeNull();
  });
});
