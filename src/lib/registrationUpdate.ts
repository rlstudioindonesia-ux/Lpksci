import { findRecordIndex } from "./recordMatching";

/**
 * Decides which record a `registeredStudents` update/edit request refers to.
 *
 * 23-10-2026: the server used to CREATE a new registration whenever the
 * update target was not found. Approving a registrant removes its
 * registration, so editing documents of an active student from the admin
 * "Lihat Berkas" panel (which sends `registeredStudents` updates with the
 * active student's id) produced phantom "Siswa Baru" registrants that nobody
 * submitted. Real registrations only come from /api/register, so an update
 * never creates anything now: it goes to the registration, to the active
 * student with that id, or nowhere.
 */
export type RegistrationUpdateTarget =
  | { kind: "registration"; index: number }
  | { kind: "activeStudent"; index: number }
  | { kind: "none" };

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export function findRegistrationUpdateTarget(
  registered: any[] | null | undefined,
  active: any[] | null | undefined,
  payload: { id?: string | null; email?: string | null; name?: string | null } | null | undefined,
): RegistrationUpdateTarget {
  const id = norm(payload?.id);
  const regList = Array.isArray(registered) ? registered : [];
  const actList = Array.isArray(active) ? active : [];

  if (id) {
    const regById = regList.findIndex((r) => r && norm(r.id) === id);
    if (regById !== -1) return { kind: "registration", index: regById };
    const actById = actList.findIndex((s) => s && norm(s.id) === id);
    if (actById !== -1) return { kind: "activeStudent", index: actById };
  }

  const regIdx = findRecordIndex(regList, { email: payload?.email, name: payload?.name });
  if (regIdx !== -1) return { kind: "registration", index: regIdx };

  return { kind: "none" };
}

/**
 * Registrations that are only leftovers of the bug above: they share their id
 * with an active student, so the person is already a student.
 */
export function isPhantomRegistration(registration: any, active: any[] | null | undefined): boolean {
  const id = norm(registration?.id);
  if (!id || !Array.isArray(active)) return false;
  return active.some((s) => s && norm(s.id) === id);
}
