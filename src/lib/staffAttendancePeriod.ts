const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

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
 * Number of working days (Mon-Fri) within a payroll period, used as the
 * denominator for "Tidak Hadir" (absent days). For the period currently in
 * progress this is capped at `asOfDate` (default: now) so future days that
 * haven't happened yet are never counted as absences; a fully elapsed past
 * period uses its full 21-20 span.
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
    if (day !== 0 && day !== 6) count++;
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
