/**
 * Which student a bill belongs to (23-10-2026).
 *
 * Bills used to be linked only by `studentName`: two students with the same
 * name shared each other's bills and "Lunas" status, and renaming a student
 * (e.g. fixing a typo) detached all their bills. Bills now also carry
 * `studentId`; the name is kept for display and for old bills that could not
 * be linked yet (a name shared by several students is never guessed).
 */

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

export interface StudentRef {
  id?: string | null;
  name?: string | null;
}

/** Id of the only student with this name (active students first, then registrations). */
export function resolveStudentIdByName(name: any, active: any[] | null | undefined, registered?: any[] | null): string | undefined {
  const n = norm(name);
  if (!n) return undefined;
  for (const list of [active, registered]) {
    const matches = (list || []).filter((s: any) => s && s.id && norm(s.name) === n);
    if (matches.length === 1) return matches[0].id;
    if (matches.length > 1) return undefined; // ambiguous: never guess
  }
  return undefined;
}

/** Whether a bill belongs to the given student. */
export function paymentMatchesStudent(payment: any, ref: StudentRef | null | undefined): boolean {
  if (!payment || !ref) return false;
  if (payment.studentId && ref.id) return norm(payment.studentId) === norm(ref.id);
  return !!norm(ref.name) && norm(payment.studentName) === norm(ref.name);
}

export interface BillingEntry {
  /** Unique text shown in the billing list (name, or "name (id)" when several students share the name). */
  label: string;
  id?: string;
  name: string;
}

/**
 * Entries for the billing list: one per student, plus names that only exist in
 * bills (manual receipts). Students sharing a name get "Name (SIS-001)" labels
 * so their bills are no longer merged.
 */
export function buildBillingEntries(students: Array<{ id?: string; name?: string }>, extraNames: string[] = []): BillingEntry[] {
  const byName = new Map<string, Array<{ id?: string; name: string }>>();
  for (const s of students || []) {
    const name = String(s?.name || "").trim();
    if (!name) continue;
    const key = norm(name);
    const list = byName.get(key) || [];
    if (s.id && list.some((x) => x.id === s.id)) continue;
    if (!s.id && list.length > 0) continue;
    list.push({ id: s.id, name });
    byName.set(key, list);
  }
  const entries: BillingEntry[] = [];
  for (const list of byName.values()) {
    const withId = list.filter((x) => x.id);
    const items = withId.length > 0 ? withId : list.slice(0, 1);
    if (items.length === 1) entries.push({ label: items[0].name, id: items[0].id, name: items[0].name });
    else for (const x of items) entries.push({ label: `${x.name} (${x.id})`, id: x.id, name: x.name });
  }
  for (const raw of extraNames) {
    const name = String(raw || "").trim();
    if (name && !byName.has(norm(name))) {
      byName.set(norm(name), [{ name }]);
      entries.push({ label: name, name });
    }
  }
  return entries.sort((a, b) => a.label.localeCompare(b.label));
}

export interface PaymentFieldChange {
  id: string;
  changes: Record<string, any>;
}

/** Old bills without studentId whose name identifies exactly one student. */
export function planPaymentStudentIdBackfill(payments: any[] | null | undefined, active: any[] | null | undefined, registered?: any[] | null): PaymentFieldChange[] {
  const out: PaymentFieldChange[] = [];
  for (const p of payments || []) {
    if (!p || !p.id || p.studentId) continue;
    const studentId = resolveStudentIdByName(p.studentName, active, registered);
    if (studentId) out.push({ id: p.id, changes: { studentId } });
  }
  return out;
}

/**
 * Linked bills show the student's current name: renaming a student (any
 * screen) no longer detaches their bills.
 */
export function planPaymentNameSync(payments: any[] | null | undefined, active: any[] | null | undefined, registered?: any[] | null): PaymentFieldChange[] {
  const nameById = new Map<string, string>();
  for (const list of [registered, active]) {
    for (const s of list || []) if (s && s.id && String(s.name || "").trim()) nameById.set(norm(s.id), String(s.name).trim());
  }
  const out: PaymentFieldChange[] = [];
  for (const p of payments || []) {
    if (!p || !p.id || !p.studentId) continue;
    const current = nameById.get(norm(p.studentId));
    if (current && p.studentName !== current) out.push({ id: p.id, changes: { studentName: current } });
  }
  return out;
}

/** A registration became an active student with a new id: move its bills. */
export function planPaymentOwnerMove(payments: any[] | null | undefined, fromId: string, toId: string): PaymentFieldChange[] {
  if (!fromId || !toId || fromId === toId) return [];
  return (payments || [])
    .filter((p: any) => p && p.id && norm(p.studentId) === norm(fromId))
    .map((p: any) => ({ id: p.id, changes: { studentId: toId } }));
}
