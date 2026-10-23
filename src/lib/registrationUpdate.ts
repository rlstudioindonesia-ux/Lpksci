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
 * 23-10-2026 (owner): a registration whose person is already an active
 * student: same id (copies made by the old update bug) or same email AND
 * same name (an approved registration written back by an instance whose
 * memory was not yet updated). These are hidden, never shown in "Siswa Baru".
 */
export function isConvertedRegistration(registration: any, active: any[] | null | undefined): boolean {
  if (!registration || !Array.isArray(active)) return false;
  const id = norm(registration.id);
  const email = norm(registration.email);
  const name = norm(registration.name);
  return active.some(
    (s) => s && ((id && norm(s.id) === id) || (email && name && norm(s.email) === email && norm(s.name) === name)),
  );
}

const isBlank = (v: any) => !String(v ?? "").trim();

/**
 * 23-10-2026 (owner): phantom registrants must not appear at all, and must not
 * be deleted again and again. The server keeps them out of its memory instead
 * (so they are never served and never written back); Firestore is untouched.
 * Hidden: registrations of people who are already active students (except
 * approved alumni sign-ups), and empty
 * records without name, email and phone.
 */
export function isHiddenRegistration(registration: any, active: any[] | null | undefined): boolean {
  if (!registration) return true;
  // Alumni sign-ups are stored as "Disetujui" next to their active record on
  // purpose (their documents live there) and never show in "Siswa Baru".
  if (registration.status !== "Disetujui" && isConvertedRegistration(registration, active)) return true;
  return isBlank(registration.name) && isBlank(registration.email) && isBlank(registration.phone);
}

export function visibleRegistrations(registered: any[] | null | undefined, active: any[] | null | undefined): any[] {
  if (!Array.isArray(registered)) return [];
  return registered.filter((r) => !isHiddenRegistration(r, active));
}
