import { describe, it, expect } from "vitest";
import { computeAttendanceRate, resolveAttendanceScore } from "./attendanceMetrics";

describe("computeAttendanceRate", () => {
  it("returns null rate and zero counts for a student with no matching records", () => {
    const result = computeAttendanceRate({ id: "S1", name: "Budi" }, []);
    expect(result).toEqual({ rate: null, hadirCount: 0, totalRecords: 0 });
  });

  it("returns null for a missing student", () => {
    expect(computeAttendanceRate(null, [{ studentId: "S1", status: "Hadir" }])).toEqual({
      rate: null,
      hadirCount: 0,
      totalRecords: 0,
    });
  });

  it("computes the rounded percentage of Hadir records", () => {
    const records = [
      { studentId: "S1", status: "Hadir" },
      { studentId: "S1", status: "Hadir" },
      { studentId: "S1", status: "Alpa" },
    ];
    const result = computeAttendanceRate({ id: "S1", name: "Budi" }, records);
    expect(result).toEqual({ rate: 67, hadirCount: 2, totalRecords: 3 });
  });

  it("matches records by studentId OR studentName so either identifier counts", () => {
    const records = [
      { studentId: "S1", status: "Hadir" },
      { studentName: "Budi", status: "Hadir" },
      { studentName: "Budi", status: "Alpa" },
    ];
    const result = computeAttendanceRate({ id: "S1", name: "Budi" }, records);
    expect(result.totalRecords).toBe(3);
    expect(result.hadirCount).toBe(2);
  });

  it("only counts a student's own records, not other students'", () => {
    const records = [
      { studentId: "S1", status: "Hadir" },
      { studentId: "S2", status: "Alpa" },
      { studentId: "S2", status: "Alpa" },
    ];
    const result = computeAttendanceRate({ id: "S1", name: "Budi" }, records);
    expect(result).toEqual({ rate: 100, hadirCount: 1, totalRecords: 1 });
  });

  it("treats Izin/Sakit/Alpa (any non-Hadir status) as absent", () => {
    const records = [
      { studentId: "S1", status: "Hadir" },
      { studentId: "S1", status: "Izin" },
      { studentId: "S1", status: "Sakit" },
      { studentId: "S1", status: "Alpa" },
    ];
    const result = computeAttendanceRate({ id: "S1", name: "Budi" }, records);
    expect(result).toEqual({ rate: 25, hadirCount: 1, totalRecords: 4 });
  });

  it("handles a null/undefined attendanceRecords array safely", () => {
    expect(computeAttendanceRate({ id: "S1" }, null)).toEqual({ rate: null, hadirCount: 0, totalRecords: 0 });
    expect(computeAttendanceRate({ id: "S1" }, undefined)).toEqual({ rate: null, hadirCount: 0, totalRecords: 0 });
  });
});

describe("resolveAttendanceScore", () => {
  it("prefers the live-computed rate over a stale stored attendanceScore", () => {
    const records = [
      { studentId: "S1", status: "Hadir" },
      { studentId: "S1", status: "Hadir" },
      { studentId: "S1", status: "Alpa" },
    ];
    // Stored score is stale (e.g. saved before the latest attendance records came in).
    const score = resolveAttendanceScore({ id: "S1", name: "Budi", attendanceScore: 40 }, records);
    expect(score).toBe(67);
  });

  it("falls back to the stored attendanceScore when there are no attendance records", () => {
    const score = resolveAttendanceScore({ id: "S1", name: "Budi", attendanceScore: 55 }, []);
    expect(score).toBe(55);
  });

  it("falls back to 0 when there are no records and no stored score", () => {
    expect(resolveAttendanceScore({ id: "S1", name: "Budi" }, [])).toBe(0);
  });

  it("returns 0 for a missing student", () => {
    expect(resolveAttendanceScore(null, [])).toBe(0);
  });
});
