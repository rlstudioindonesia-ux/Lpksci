/**
 * Single source of truth for the "jumlah siswa per status" formula.
 *
 * Before this module every screen (Admin Data Siswa, VVIP Monitoring,
 * VVIP summary cards, Admin Monitoring Belajar tabs) counted students with
 * its own inline filter, and they disagreed:
 *  - "Lulus" was counted under Sertifikasi JFT/JLPT/SSW in some tables but
 *    under Di Jepang in the per-class table, so the same student was
 *    counted in different columns depending on the screen;
 *  - "Belajar" was sometimes `status === "Belajar"` (students with an
 *    empty status vanished) and sometimes "anything not in the other
 *    groups" (so Dikeluarkan students were counted as Belajar);
 *  - the status filter compared `status === filter` exactly, so clicking
 *    the JFT row (whose count includes Lulus) never listed Lulus students.
 *
 * Every group below is mutually exclusive, so the per-group counts always
 * add up to the total.
 */

export type StudentStatusGroupId =
  | "Belajar"
  | "On Proges Job"
  | "Diklat SO"
  | "Di Jepang"
  | "On Progres JFT/JLPT/SSW"
  | "Dikeluarkan";

export const STUDENT_STATUS_GROUP_IDS: StudentStatusGroupId[] = [
  "Belajar",
  "On Proges Job",
  "Diklat SO",
  "Di Jepang",
  "On Progres JFT/JLPT/SSW",
  "Dikeluarkan",
];

/**
 * Maps a raw student `status` to its counting group.
 * - "Lulus" (passed JFT/JLPT/SSW) belongs to the Sertifikasi group, which is
 *   how most of the existing screens already labelled it.
 * - Empty or unknown statuses (old records, typos) count as "Belajar" so
 *   they never disappear from the totals.
 */
export function getStudentStatusGroup(status: string | null | undefined): StudentStatusGroupId {
  const s = (status || "").trim();
  if (s === "Lulus") return "On Progres JFT/JLPT/SSW";
  if (s === "Berhenti") return "Dikeluarkan";
  if ((STUDENT_STATUS_GROUP_IDS as string[]).includes(s)) return s as StudentStatusGroupId;
  return "Belajar";
}

/** Whether a student belongs to the given status group (used by the list filters so they match the counts). */
export function studentMatchesStatusGroup(student: { status?: string | null } | null | undefined, groupId: string): boolean {
  if (!student) return false;
  return getStudentStatusGroup(student.status) === groupId;
}

export type StudentStatusCounts = Record<StudentStatusGroupId, number> & { total: number };

export function countStudentsByStatusGroup(students: Array<{ status?: string | null }> | null | undefined): StudentStatusCounts {
  const counts = {
    "Belajar": 0,
    "On Proges Job": 0,
    "Diklat SO": 0,
    "Di Jepang": 0,
    "On Progres JFT/JLPT/SSW": 0,
    "Dikeluarkan": 0,
    total: 0,
  } as StudentStatusCounts;
  for (const s of students || []) {
    if (!s) continue;
    counts[getStudentStatusGroup(s.status)]++;
    counts.total++;
  }
  return counts;
}

/** Students still in the LPK pipeline (not expelled, not yet working in Japan) - "Jumlah Siswa" of a class. */
export function isStudentStillActive(student: { status?: string | null } | null | undefined): boolean {
  if (!student) return false;
  const group = getStudentStatusGroup(student.status);
  return group !== "Dikeluarkan" && group !== "Di Jepang";
}
