import { describe, expect, it } from "vitest";
import {
  countWorkingDaysInPayrollPeriod,
  formatPayrollPeriodLabel,
  generateRecentPayrollPeriods,
  getCurrentPayrollPeriodKey,
  getPayrollPeriodRange,
  isNationalHoliday,
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

describe("countWorkingDaysInPayrollPeriod", () => {
  it("counts Mon-Fri days across the full 21 Jul - 20 Aug 2026 period once it has fully elapsed, minus the 17 Aug national holiday", () => {
    // Jul 21 2026 is a Tuesday, Aug 20 2026 is a Thursday; the 31-day span
    // contains 4 Saturdays and 4 Sundays (23 weekdays), minus 17 Aug 2026
    // (Hari Kemerdekaan RI, a Monday) -> 22 working days.
    expect(countWorkingDaysInPayrollPeriod("2026-07", new Date(2026, 8, 1))).toBe(22);
  });

  it("caps the count at asOfDate for a period still in progress, minus the 17 Aug national holiday", () => {
    // Aug 18 2026 is a Tuesday, 29 days into the period (Jul 21 - Aug 18
    // inclusive), containing 4 Saturdays and 4 Sundays (21 weekdays), minus
    // 17 Aug 2026 (Hari Kemerdekaan RI) -> 20 working days.
    expect(countWorkingDaysInPayrollPeriod("2026-07", new Date(2026, 7, 18, 12, 0, 0))).toBe(20);
  });

  it("returns 0 when asOfDate is before the period starts", () => {
    expect(countWorkingDaysInPayrollPeriod("2026-07", new Date(2026, 6, 1))).toBe(0);
  });

  it("excludes multiple weekday national holidays that fall outside the Aug 17 example", () => {
    // Period 2026-05 covers 21 May - 20 June 2026, which contains three
    // weekday national holidays: 27 May (Idul Adha, Wed), 1 June (Hari
    // Lahir Pancasila, Mon), and 16 June (Tahun Baru Islam, Tue). 31 May
    // (Waisak) also falls in range but lands on a Sunday, already excluded
    // by the weekend rule, so it doesn't add to this count.
    const withoutHolidayLogic = (() => {
      // Independently recompute using only the weekend rule, to prove the
      // two holiday dates are exactly what's being subtracted.
      let count = 0;
      const cursor = new Date(2026, 4, 21);
      const end = new Date(2026, 5, 20);
      while (cursor <= end) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) count++;
        cursor.setDate(cursor.getDate() + 1);
      }
      return count;
    })();
    expect(countWorkingDaysInPayrollPeriod("2026-05", new Date(2026, 6, 1))).toBe(withoutHolidayLogic - 3);
  });
});

describe("isNationalHoliday", () => {
  it("recognizes a known 2026 national holiday", () => {
    expect(isNationalHoliday(new Date(2026, 7, 17))).toBe(true); // Hari Kemerdekaan RI
  });

  it("returns false for an ordinary weekday", () => {
    expect(isNationalHoliday(new Date(2026, 7, 18))).toBe(false);
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
