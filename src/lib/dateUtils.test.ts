import { describe, it, expect } from "vitest";
import { toLocalISODate, todayJakartaISO } from "./dateUtils";

describe("toLocalISODate", () => {
  it("uses the device's local calendar day, not the UTC one", () => {
    // 06:30 local time - in WIB this is still the previous day in UTC.
    expect(toLocalISODate(new Date(2026, 9, 23, 6, 30))).toBe("2026-10-23");
  });

  it("returns an empty string for invalid input", () => {
    expect(toLocalISODate("bukan tanggal")).toBe("");
  });
});

describe("todayJakartaISO", () => {
  it("returns the WIB date even when UTC is still on the previous day", () => {
    // 2026-10-22T23:30Z = 2026-10-23 06:30 WIB
    expect(todayJakartaISO(new Date("2026-10-22T23:30:00Z"))).toBe("2026-10-23");
  });

  it("matches UTC later in the day", () => {
    expect(todayJakartaISO(new Date("2026-10-23T10:00:00Z"))).toBe("2026-10-23");
  });
});
