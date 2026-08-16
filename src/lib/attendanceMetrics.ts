export interface AttendanceRecordLike {
  studentId?: string;
  studentName?: string;
  status?: string;
}

export interface StudentLike {
  id?: string;
  name?: string;
}

export interface AttendanceRateResult {
  /** Rounded percentage of the student's own records marked "Hadir", or null when the student has no attendance records at all. */
  rate: number | null;
  hadirCount: number;
  totalRecords: number;
}

/**
 * Canonical attendance-rate calculation: percentage of a student's own
 * attendance records marked "Hadir" out of all their records. Matches
 * records by studentId OR studentName so records that only carry one of
 * the two identifiers still count.
 */
export function computeAttendanceRate(
  student: StudentLike | null | undefined,
  attendanceRecords: AttendanceRecordLike[] | null | undefined,
): AttendanceRateResult {
  if (!student) return { rate: null, hadirCount: 0, totalRecords: 0 };
  const records = (attendanceRecords || []).filter(
    (r) => (!!student.id && r.studentId === student.id) || (!!student.name && r.studentName === student.name),
  );
  const hadirCount = records.filter((r) => r.status === "Hadir").length;
  const totalRecords = records.length;
  const rate = totalRecords > 0 ? Math.round((hadirCount / totalRecords) * 100) : null;
  return { rate, hadirCount, totalRecords };
}

/**
 * Attendance score for call sites that also have a stored `attendanceScore`
 * field to fall back on. Prefers the live-computed rate whenever the
 * student has attendance records - consistent with how math/Japanese
 * scores are recomputed from live chapter assessments elsewhere - and only
 * falls back to the stored field (or 0) when there are no records to
 * compute from, so a stale stored value never overrides fresher data.
 */
export function resolveAttendanceScore(
  student: (StudentLike & { attendanceScore?: number }) | null | undefined,
  attendanceRecords: AttendanceRecordLike[] | null | undefined,
): number {
  const { rate } = computeAttendanceRate(student, attendanceRecords);
  return rate ?? student?.attendanceScore ?? 0;
}
