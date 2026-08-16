import { describe, it, expect } from "vitest";
import { matchesClassLevel, alumniClassNameFor, resolveClassQuota } from "./classQuota";

describe("matchesClassLevel", () => {
  it("matches an exact class name", () => {
    expect(matchesClassLevel("Kelas Alumni Level N3", "Kelas Alumni Level N3")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(matchesClassLevel("KELAS ALUMNI LEVEL N3", "kelas alumni level n3")).toBe(true);
  });

  it("matches by a shared JLPT level token when names aren't identical", () => {
    expect(matchesClassLevel("Alumni N3 Kelas Sore", "Kelas Alumni Level N3")).toBe(true);
  });

  it("does not cross-match different levels", () => {
    expect(matchesClassLevel("Kelas Alumni Level N2", "Kelas Alumni Level N3")).toBe(false);
  });

  it("supports every JLPT level N1-N5, not a hardcoded subset", () => {
    for (const level of ["N1", "N2", "N3", "N4", "N5"]) {
      expect(matchesClassLevel(`Kelas ${level}`, `Kelas Alumni Level ${level}`)).toBe(true);
    }
  });

  it("matches the native level token", () => {
    expect(matchesClassLevel("Kelas Native Sore", "Kelas Alumni Level Native")).toBe(true);
  });

  it("returns false for an empty or missing candidate", () => {
    expect(matchesClassLevel("", "Kelas Alumni Level N3")).toBe(false);
    expect(matchesClassLevel(undefined, "Kelas Alumni Level N3")).toBe(false);
    expect(matchesClassLevel(null, "Kelas Alumni Level N3")).toBe(false);
  });
});

describe("alumniClassNameFor", () => {
  it("prefers title over level", () => {
    expect(alumniClassNameFor({ title: "Level N3", level: "N3" })).toBe("Kelas Alumni Level N3");
  });

  it("falls back to level when title is missing", () => {
    expect(alumniClassNameFor({ level: "N3" })).toBe("Kelas Alumni N3");
  });
});

describe("resolveClassQuota", () => {
  it("uses the real enrolled count when there are real students", () => {
    const result = resolveClassQuota({ registered: 99, quota: 10 }, 6);
    expect(result).toEqual({ registeredCount: 6, quotaLimit: 10, remaining: 4 });
  });

  it("falls back to the manually configured registered number when no real students are enrolled yet", () => {
    const result = resolveClassQuota({ registered: 5, quota: 10 }, 0);
    expect(result.registeredCount).toBe(5);
  });

  it("falls back to 0 - not a made-up placeholder - when there is no manual number and no real students", () => {
    // Regression test: desktop (FrontendView) used to fall back to a
    // hardcoded 8 here while mobile (MobilePilihKelasSubpage) fell back to
    // 0 for the exact same class data, showing two different "penuh" states
    // for a brand new CMS-added class before any student is enrolled.
    const result = resolveClassQuota({ quota: 10 }, 0);
    expect(result.registeredCount).toBe(0);
  });

  it("defaults quota to 10 when unset", () => {
    const result = resolveClassQuota({ registered: 3 }, 0);
    expect(result.quotaLimit).toBe(10);
  });

  it("clamps remaining to 0 when the class is over quota", () => {
    const result = resolveClassQuota({ quota: 5 }, 8);
    expect(result).toEqual({ registeredCount: 8, quotaLimit: 5, remaining: 0 });
  });
});
