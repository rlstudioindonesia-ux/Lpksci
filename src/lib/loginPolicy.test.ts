import { describe, it, expect } from "vitest";
import { evaluatePasswordLogin, validateNewPassword, isDefaultPasswordValue } from "./loginPolicy";

const verify = (plain: string, stored: unknown) => plain === stored;

describe("evaluatePasswordLogin", () => {
  it("accepts the real password", () => {
    expect(evaluatePasswordLogin({ plain: "RahasiaKu9", stored: "RahasiaKu9", verify })).toEqual({ valid: true, mustChangePassword: false });
  });

  it("accepts a default password only for accounts that never chose one, and forces a change", () => {
    expect(evaluatePasswordLogin({ plain: "123456", stored: "RahasiaKu9", verify })).toEqual({ valid: true, mustChangePassword: true });
    expect(evaluatePasswordLogin({ plain: "adminadmin", stored: "", verify })).toEqual({ valid: true, mustChangePassword: true });
  });

  it("rejects default passwords once the owner set their own password", () => {
    expect(
      evaluatePasswordLogin({ plain: "123456", stored: "RahasiaKu9", passwordChangedAt: "2026-10-23T00:00:00Z", verify }),
    ).toEqual({ valid: false, mustChangePassword: false });
    expect(
      evaluatePasswordLogin({ plain: "admin123", stored: "RahasiaKu9", passwordChangedAt: "2026-10-23T00:00:00Z", verify }).valid,
    ).toBe(false);
  });

  it("flags a stored default password for change", () => {
    expect(evaluatePasswordLogin({ plain: "123456", stored: "123456", passwordChangedAt: null, verify })).toEqual({ valid: true, mustChangePassword: true });
  });

  it("rejects wrong passwords and empty input", () => {
    expect(evaluatePasswordLogin({ plain: "salah", stored: "RahasiaKu9", verify }).valid).toBe(false);
    expect(evaluatePasswordLogin({ plain: "  ", stored: "", verify }).valid).toBe(false);
    expect(evaluatePasswordLogin({ plain: "apasaja", stored: "", passwordChangedAt: "x", verify }).valid).toBe(false);
  });

  it("a random password on an account without password works only before it was ever changed", () => {
    expect(evaluatePasswordLogin({ plain: "apasaja", stored: "", verify })).toEqual({ valid: true, mustChangePassword: true });
  });
});

describe("validateNewPassword", () => {
  it("enforces length, no defaults, not the username, not trivial", () => {
    expect(validateNewPassword("abc")).toMatch(/minimal 8/);
    expect(validateNewPassword("adminadmin")).toMatch(/bawaan/);
    expect(validateNewPassword("budisantoso", "BudiSantoso")).toMatch(/username/);
    expect(validateNewPassword("11111111")).toMatch(/mudah/);
    expect(validateNewPassword("12345678")).toMatch(/mudah/);
    expect(validateNewPassword("Sakura2026!", "budi")).toBeNull();
  });

  it("knows the default passwords", () => {
    expect(isDefaultPasswordValue(" 123456 ")).toBe(true);
    expect(isDefaultPasswordValue("Sakura2026")).toBe(false);
  });
});
