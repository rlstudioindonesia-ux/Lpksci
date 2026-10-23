import { describe, it, expect, beforeEach, vi } from "vitest";
import { isOwnApiUrl, rememberLoginResponse, getSessionToken, getMustChangePassword, clearSession, installAuthFetch } from "./sessionToken";

describe("sessionToken", () => {
  beforeEach(() => clearSession());

  it("recognises this app's /api only", () => {
    const origin = "https://lpksci.com";
    expect(isOwnApiUrl("/api/state", origin)).toBe(true);
    expect(isOwnApiUrl("https://lpksci.com/api/login", origin)).toBe(true);
    expect(isOwnApiUrl("https://evil.com/api/state", origin)).toBe(false);
    expect(isOwnApiUrl("/assets/a.js", origin)).toBe(false);
  });

  it("remembers token and the must-change flag", () => {
    rememberLoginResponse({ token: "v1.a.b", mustChangePassword: true });
    expect(getSessionToken()).toBe("v1.a.b");
    expect(getMustChangePassword()).toBe(true);
    rememberLoginResponse({ token: "v1.c.d", mustChangePassword: false });
    expect(getMustChangePassword()).toBe(false);
    clearSession();
    expect(getSessionToken()).toBeNull();
  });

  it("adds the bearer header to own /api calls only", async () => {
    const spy = vi.fn(async () => new Response("{}"));
    (window as any).fetch = spy;
    installAuthFetch();
    rememberLoginResponse({ token: "v1.x.y" });
    await window.fetch("/api/state");
    await window.fetch("https://example.org/data");
    const firstHeaders = new Headers((spy.mock.calls[0] as any)[1]?.headers);
    expect(firstHeaders.get("Authorization")).toBe("Bearer v1.x.y");
    expect((spy.mock.calls[1] as any)[1]).toBeUndefined();
  });
});
