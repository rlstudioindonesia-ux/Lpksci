export interface AlumniStatusStudent {
  status?: string;
  kategoriPendaftaran?: string;
  statusPendaftaran?: string;
}

/**
 * Whether a student counts as an alumnus for general display/access
 * purposes: either explicitly flagged via registration
 * (kategoriPendaftaran/statusPendaftaran, two historically redundant
 * fields that different screens have checked inconsistently), or their
 * program status shows they've completed training and moved to Japan
 * ("Lulus"/"Di Jepang").
 *
 * This is deliberately NOT used by Job Order eligibility/access
 * (src/lib/jobAccess.ts) - there, a "Lulus" student is still an active
 * job-seeker going through their first placement, not yet an alumnus, so
 * that module only trusts the explicit registration category. Everywhere
 * else in the app (rosters, billing, profile labels) has historically
 * treated "Lulus"/"Di Jepang" as alumni, which this function preserves.
 */
export function isStudentAlumni(student: AlumniStatusStudent | null | undefined): boolean {
  if (!student) return false;
  return (
    student.statusPendaftaran === "Alumni" ||
    student.kategoriPendaftaran === "Alumni" ||
    student.status === "Lulus" ||
    student.status === "Di Jepang"
  );
}

/** Class-level heuristic (e.g. "Kelas Alumni N3") for LMS/admin styling - a different concern from isStudentAlumni, not a substitute for it. */
export function isAlumniClassName(className: string | null | undefined): boolean {
  return (className || "").toLowerCase().includes("alumni");
}
