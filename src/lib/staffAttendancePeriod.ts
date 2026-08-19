const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Indonesian national holidays ("hari libur nasional"), keyed "YYYY-MM-DD",
 * excluded from working-day counts alongside weekends.
 *
 * 2026 dates are official, per SKB 3 Menteri No. 1497/2/5 Tahun 2025
 * (ditetapkan 19 September 2025) - 17 hari libur nasional.
 *
 * 2027 dates are ESTIMATES based on the expected lunar/solar calendar
 * pattern - the government has not yet issued an official SKB 3 Menteri
 * for 2027 (typically published around September of the preceding year).
 * Update this list once the real 2027 SKB is published.
 */
export const INDONESIAN_NATIONAL_HOLIDAYS: string[] = [
  // 2026 - resmi (SKB 3 Menteri)
  "2026-01-01", // Tahun Baru Masehi
  "2026-01-16", // Isra Mikraj Nabi Muhammad SAW
  "2026-02-17", // Tahun Baru Imlek 2577
  "2026-03-19", // Hari Suci Nyepi (Tahun Baru Saka 1948)
  "2026-03-21", // Hari Raya Idul Fitri 1447 H
  "2026-03-22", // Hari Raya Idul Fitri 1447 H
  "2026-04-03", // Wafat Yesus Kristus
  "2026-04-05", // Kebangkitan Yesus Kristus (Paskah)
  "2026-05-01", // Hari Buruh Internasional
  "2026-05-14", // Kenaikan Isa Almasih
  "2026-05-27", // Hari Raya Idul Adha 1447 H
  "2026-05-31", // Hari Raya Waisak 2570 BE
  "2026-06-01", // Hari Lahir Pancasila
  "2026-06-16", // Tahun Baru Islam 1448 H
  "2026-08-17", // Hari Kemerdekaan RI
  "2026-08-25", // Maulid Nabi Muhammad SAW
  "2026-12-25", // Hari Raya Natal

  // 2027 - perkiraan, belum ada SKB 3 Menteri resmi
  "2027-01-01", // Tahun Baru Masehi
  "2027-01-05", // Isra Mikraj Nabi Muhammad SAW (perkiraan)
  "2027-02-06", // Tahun Baru Imlek 2578 (perkiraan)
  "2027-03-08", // Hari Suci Nyepi (perkiraan)
  "2027-03-10", // Hari Raya Idul Fitri 1448 H (perkiraan)
  "2027-03-11", // Hari Raya Idul Fitri 1448 H (perkiraan)
  "2027-03-26", // Wafat Yesus Kristus (perkiraan)
  "2027-05-01", // Hari Buruh Internasional
  "2027-05-06", // Kenaikan Isa Almasih (perkiraan)
  "2027-05-17", // Hari Raya Idul Adha 1448 H (perkiraan)
  "2027-05-20", // Hari Raya Waisak 2571 (perkiraan)
  "2027-06-01", // Hari Lahir Pancasila
  "2027-06-06", // Tahun Baru Islam 1449 H (perkiraan)
  "2027-08-15", // Maulid Nabi Muhammad SAW (perkiraan)
  "2027-08-17", // Hari Kemerdekaan RI
  "2027-12-25", // Hari Raya Natal
];

const NATIONAL_HOLIDAYS_SET = new Set(INDONESIAN_NATIONAL_HOLIDAYS);

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isNationalHoliday(d: Date): boolean {
  return NATIONAL_HOLIDAYS_SET.has(toDateKey(d));
}

/**
 * LPK SCI's payroll/attendance period runs from the 21st of one month
 * through the 20th of the next - not a calendar month. A period is keyed
 * as "YYYY-MM" where MM is the 1-indexed START month (e.g. "2026-07"
 * covers 21 July - 20 August 2026).
 */
export function getCurrentPayrollPeriodKey(now: Date = new Date()): string {
  const day = now.getDate();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed
  if (day < 21) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function getPayrollPeriodRange(periodKey: string): { start: Date; end: Date } {
  const [yearStr, monthStr] = periodKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed start month
  const start = new Date(year, month - 1, 21, 0, 0, 0, 0);
  const end = new Date(year, month, 20, 23, 59, 59, 999); // JS Date rolls month=12 into next year Jan
  return { start, end };
}

export function isTimestampInPayrollPeriod(
  timestamp: string | number | Date | null | undefined,
  periodKey: string,
): boolean {
  if (!timestamp) return false;
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return false;
  const { start, end } = getPayrollPeriodRange(periodKey);
  return d >= start && d <= end;
}

export function formatPayrollPeriodLabel(periodKey: string): string {
  const [yearStr, monthStr] = periodKey.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-indexed start month
  const startMonthName = MONTH_NAMES_ID[month - 1] || "";
  let endMonth = month + 1;
  let endYear = year;
  if (endMonth > 12) {
    endMonth = 1;
    endYear += 1;
  }
  const endMonthName = MONTH_NAMES_ID[endMonth - 1] || "";
  return `21 ${startMonthName} - 20 ${endMonthName} ${endYear}`;
}

/**
 * Number of working days within a payroll period, used as the denominator
 * for "Tidak Hadir" (absent days). Excludes weekends (Sat/Sun) and
 * Indonesian national holidays (see INDONESIAN_NATIONAL_HOLIDAYS). For the
 * period currently in progress this is capped at `asOfDate` (default: now)
 * so future days that haven't happened yet are never counted as absences;
 * a fully elapsed past period uses its full 21-20 span.
 */
export function countWorkingDaysInPayrollPeriod(periodKey: string, asOfDate: Date = new Date()): number {
  const { start, end } = getPayrollPeriodRange(periodKey);
  const cappedEnd = asOfDate < end ? asOfDate : end;
  if (cappedEnd < start) return 0;
  let count = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDateOnly = new Date(cappedEnd.getFullYear(), cappedEnd.getMonth(), cappedEnd.getDate());
  while (cursor <= endDateOnly) {
    const day = cursor.getDay(); // 0 = Sunday, 6 = Saturday
    if (day !== 0 && day !== 6 && !isNationalHoliday(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Most recent `count` payroll period keys, most recent first - for a period picker dropdown. */
export function generateRecentPayrollPeriods(count: number = 12, now: Date = new Date()): string[] {
  const periods: string[] = [];
  let key = getCurrentPayrollPeriodKey(now);
  for (let i = 0; i < count; i++) {
    periods.push(key);
    const [yearStr, monthStr] = key.split("-");
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) - 1; // previous period's start month
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    key = `${year}-${String(month).padStart(2, "0")}`;
  }
  return periods;
}
