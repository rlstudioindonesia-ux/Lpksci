import { describe, it, expect } from "vitest";
import { isAdminTier, isAdminOrVvip, hasStaffOversight } from "./permissions";

describe("isAdminTier", () => {
  it("is true for all 3 admin sub-roles", () => {
    for (const role of ["Admin", "Admin Super", "Admin Biasa"] as const) {
      expect(isAdminTier(role)).toBe(true);
    }
  });

  it("is false for VVIP, Pengajar, Siswa, Alumni", () => {
    for (const role of ["VVIP", "Pengajar", "Siswa", "Alumni"] as const) {
      expect(isAdminTier(role)).toBe(false);
    }
  });

  it("is false for a missing role", () => {
    expect(isAdminTier(null)).toBe(false);
    expect(isAdminTier(undefined)).toBe(false);
  });
});

describe("isAdminOrVvip", () => {
  it("is true for VVIP and every admin sub-role", () => {
    for (const role of ["VVIP", "Admin", "Admin Super", "Admin Biasa"] as const) {
      expect(isAdminOrVvip(role)).toBe(true);
    }
  });

  it("is false for Pengajar, Siswa, Alumni", () => {
    for (const role of ["Pengajar", "Siswa", "Alumni"] as const) {
      expect(isAdminOrVvip(role)).toBe(false);
    }
  });
});

describe("hasStaffOversight", () => {
  it("is true for Pengajar, every admin sub-role, and VVIP", () => {
    for (const role of ["Pengajar", "Admin", "Admin Super", "Admin Biasa", "VVIP"] as const) {
      expect(hasStaffOversight(role)).toBe(true);
    }
  });

  it("is false for Siswa and Alumni - they only ever see their own records", () => {
    expect(hasStaffOversight("Siswa")).toBe(false);
    expect(hasStaffOversight("Alumni")).toBe(false);
  });
});
