import { describe, expect, it } from "vitest";
import {
  formatPayrollPeriodLabel,
  generateRecentPayrollPeriods,
  getCurrentPayrollPeriodKey,
  getPayrollPeriodRange,
  isTimestampInPayrollPeriod,
} from "./staffAttendancePeriod";

describe("getCurrentPayrollPeriodKey", () => {
  it("returns the current month when the day is on/after the 21st", () => {
    expect(getCurrentPayrollPeriodKey(new Date(2026, 7, 21))).toBe("2026-08"); // Aug 21
    expect(getCurrentPayrollPeriodKey(new Date(2026, 7, 31))).toBe("2026-08"); // Aug 31
  });

  it("returns the previous month when the day is before the 21st", () => {
    expect(getCurrentPayrollPeriodKey(new Date(2026, 7, 20))).toBe("2026-07"); // Aug 20 -> July period
    expect(getCurrentPayrollPeriodKey(new Date(2026, 7, 1))).toBe("2026-07"); // Aug 1 -> July period
  });

  it("rolls back across a year boundary", () => {
    expect(getCurrentPayrollPeriodKey(new Date(2026, 0, 5))).toBe("2025-12"); // Jan 5 -> Dec period
  });
});

describe("getPayrollPeriodRange", () => {
  it("spans the 21st of the start month through the 20th of the next month", () => {
    const { start, end } = getPayrollPeriodRange("2026-07");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6); // July (0-indexed)
    expect(start.getDate()).toBe(21);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(7); // August (0-indexed)
    expect(end.getDate()).toBe(20);
  });

  it("rolls the end date into the next year for a December period", () => {
    const { end } = getPayrollPeriodRange("2026-12");
    expect(end.getFullYear()).toBe(2027);
    expect(end.getMonth()).toBe(0); // January
    expect(end.getDate()).toBe(20);
  });
});

describe("isTimestampInPayrollPeriod", () => {
  it("includes timestamps on the boundary days", () => {
    expect(isTimestampInPayrollPeriod("2026-07-21T00:00:00", "2026-07")).toBe(true);
    expect(isTimestampInPayrollPeriod("2026-08-20T23:59:00", "2026-07")).toBe(true);
  });

  it("excludes timestamps just outside the boundary", () => {
    expect(isTimestampInPayrollPeriod("2026-07-20T23:59:00", "2026-07")).toBe(false);
    expect(isTimestampInPayrollPeriod("2026-08-21T00:00:01", "2026-07")).toBe(false);
  });

  it("returns false for missing or invalid timestamps", () => {
    expect(isTimestampInPayrollPeriod(null, "2026-07")).toBe(false);
    expect(isTimestampInPayrollPeriod(undefined, "2026-07")).toBe(false);
    expect(isTimestampInPayrollPeriod("not-a-date", "2026-07")).toBe(false);
  });
});

describe("formatPayrollPeriodLabel", () => {
  it("formats a mid-year period", () => {
    expect(formatPayrollPeriodLabel("2026-07")).toBe("21 Juli - 20 Agustus 2026");
  });

  it("rolls the year forward for a December period", () => {
    expect(formatPayrollPeriodLabel("2026-12")).toBe("21 Desember - 20 Januari 2027");
  });
});

describe("generateRecentPayrollPeriods", () => {
  it("generates the requested count, most recent first, stepping back one period at a time", () => {
    const periods = generateRecentPayrollPeriods(4, new Date(2026, 7, 25)); // Aug 25 -> current period 2026-08
    expect(periods).toEqual(["2026-08", "2026-07", "2026-06", "2026-05"]);
  });

  it("rolls across a year boundary", () => {
    const periods = generateRecentPayrollPeriods(3, new Date(2026, 0, 5)); // Jan 5 -> current period 2025-12
    expect(periods).toEqual(["2025-12", "2025-11", "2025-10"]);
  });
});
