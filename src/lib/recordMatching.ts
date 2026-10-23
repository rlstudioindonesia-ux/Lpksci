/**
 * Finds the student record a request refers to.
 *
 * Several server handlers used a single
 *   findIndex(s => idMatches || nameMatches || emailMatches)
 * which returns the FIRST record matching ANY criterion. When two students
 * share a name (common: "Muhammad Rizki", "Siti Aminah"), saving student B's
 * data (payload carries B's id AND name) could update student A instead,
 * simply because A comes earlier in the list. The id is now always tried
 * first; email next; name is only used when it identifies exactly one record.
 */
export interface RecordLookup {
  id?: string | null;
  name?: string | null;
  email?: string | null;
}

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export function findRecordIndex(list: any[] | null | undefined, lookup: RecordLookup): number {
  if (!Array.isArray(list) || list.length === 0) return -1;

  const id = norm(lookup.id);
  if (id) {
    const byId = list.findIndex((r) => r && norm(r.id) === id);
    if (byId !== -1) return byId;
  }

  const email = norm(lookup.email);
  if (email) {
    const byEmail = list.findIndex((r) => r && norm(r.email) === email);
    if (byEmail !== -1) return byEmail;
  }

  const name = norm(lookup.name);
  if (name) {
    let found = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i] && norm(list[i].name) === name) {
        if (found !== -1) return -1; // ambiguous: several students share this name
        found = i;
      }
    }
    return found;
  }

  return -1;
}

const STAFF_ROLES = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];

/**
 * Finds the login account of a student (23-10-2026). Linked studentId first,
 * then email/username; the name is only used when exactly one non-staff
 * account has it AND that account is not linked to another student. Matching
 * by name alone turned the account of a different student with the same name
 * into an Alumni account (class removed) on every server start.
 */
export function findStudentUserIndex(
  users: any[] | null | undefined,
  student: { id?: string | null; name?: string | null; email?: string | null } | null | undefined,
): number {
  if (!Array.isArray(users) || !student) return -1;
  const isStudentAccount = (u: any) => u && !STAFF_ROLES.includes(u.role);

  const id = norm(student.id);
  if (id) {
    const byId = users.findIndex((u) => isStudentAccount(u) && norm(u.studentId) === id);
    if (byId !== -1) return byId;
  }

  const email = norm(student.email);
  if (email) {
    const byEmail = users.findIndex((u) => isStudentAccount(u) && (norm(u.email) === email || norm(u.username) === email));
    if (byEmail !== -1) return byEmail;
  }

  const name = norm(student.name);
  if (name) {
    let found = -1;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (isStudentAccount(u) && norm(u.name) === name) {
        if (found !== -1) return -1;
        found = i;
      }
    }
    if (found !== -1 && norm(users[found].studentId) && norm(users[found].studentId) !== id) return -1;
    return found;
  }
  return -1;
}
