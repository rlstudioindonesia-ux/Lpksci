/**
 * Suffix for new record ids (CAS-, PAY-, ATT-, SAL-, EV-, INV-, REG-, L-, Q-...).
 *
 * Ids used to be built from the last 4 digits of Date.now(), which repeat
 * every 10 seconds. Firestore writes use the id as the document key, so two
 * Buku Kas / payment / attendance entries that happened to get the same 4
 * digits silently overwrote each other (one entry vanished after the next
 * server restart). The full timestamp plus a random part makes a collision
 * practically impossible while keeping the existing prefixes.
 */
let sequence = 0;

export function uniqueIdSuffix(): string {
  // Counter: unique within this server process; random part: across instances.
  sequence = (sequence + 1) % 10000;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "0");
  return `${Date.now()}${String(sequence).padStart(4, "0")}${rand}`;
}

/**
 * Next "<PREFIX>-NNN" id that is higher than every id already in use.
 *
 * SIS-/JOB- ids used to start from `list.length + 1`: after a deletion that
 * either collided with an existing id (a new Job Order overwrote another one)
 * or re-used a deleted student's id, so the new student inherited the old
 * student's grades, attendance and job recommendations (all keyed by id).
 * Callers pass every id still referenced anywhere, not just the live list.
 */
export function nextSequentialId(prefix: string, usedIds: Iterable<string | null | undefined>, pad = 3): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let max = 0;
  for (const id of usedIds) {
    const m = pattern.exec(String(id ?? "").trim());
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(pad, "0")}`;
}

/** Every student id still referenced in the state (records, accounts, grades, attendance, job orders). */
export function collectUsedStudentIds(state: any): string[] {
  const ids: string[] = [];
  const push = (v: any) => { if (v) ids.push(String(v)); };
  (state?.activeStudents || []).forEach((s: any) => push(s?.id));
  (state?.users || []).forEach((u: any) => push(u?.studentId));
  (state?.attendance || []).forEach((a: any) => push(a?.studentId));
  (state?.chapterAssessments || []).forEach((c: any) => push(c?.studentId));
  (state?.jobOrders || []).forEach((j: any) => {
    [...(j?.recommendations || []), ...(j?.interestedStudents || []), ...(j?.approvedApplicants || [])].forEach(push);
    Object.keys(j?.applicantDocuments || {}).forEach(push);
  });
  return ids;
}
