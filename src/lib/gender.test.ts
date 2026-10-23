import { describe, it, expect } from "vitest";
import { normalizeGender } from "./gender";

describe("normalizeGender", () => {
  it("maps common spellings", () => {
    expect(normalizeGender("L")).toBe("Laki-laki");
    expect(normalizeGender("LAKI-LAKI")).toBe("Laki-laki");
    expect(normalizeGender("Pria")).toBe("Laki-laki");
    expect(normalizeGender("P")).toBe("Perempuan");
    expect(normalizeGender("wanita")).toBe("Perempuan");
    expect(normalizeGender("Perempuan")).toBe("Perempuan");
  });

  it("never guesses a default", () => {
    expect(normalizeGender(undefined)).toBe("");
    expect(normalizeGender("")).toBe("");
    expect(normalizeGender("lainnya")).toBe("");
  });
});
