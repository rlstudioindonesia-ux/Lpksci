/**
 * Keeps the Buku Kas expense entry of a salary in step with the salary
 * (23-10-2026). Salaries saved through "Input Penggajian" never reached the
 * cash book (payroll totals and the cash balance were too low), and the entry
 * written by the quick-pay button was not linked: editing or deleting the
 * salary left the old expense behind. Linked entries carry `salaryId` and code
 * "P1" (payroll), so the dashboards count them as Gaji.
 */

export type SalaryLedgerPlan =
  | { kind: "none" }
  | { kind: "add"; entry: Record<string, any> }
  | { kind: "update"; index: number; changes: Record<string, any> }
  | { kind: "remove"; index: number };

const norm = (v: any) => String(v ?? "").trim().toLowerCase();

function entryFields(salary: any): Record<string, any> {
  return {
    code: "P1",
    date: salary.paymentDate || "",
    description: `Gaji Staff: ${salary.staffName || "-"}${salary.monthString ? ` (${salary.monthString})` : ""}`,
    inAmount: 0,
    outAmount: Number(salary.amount) || 0,
    salaryId: salary.id,
  };
}

export function planLedgerSyncForSalary(
  ledger: any[] | null | undefined,
  salary: { id?: string; status?: string; amount?: any; staffName?: string; monthString?: string; paymentDate?: string } | null | undefined,
  deleted = false,
): SalaryLedgerPlan {
  if (!salary || !salary.id) return { kind: "none" };
  const list = Array.isArray(ledger) ? ledger : [];
  let index = list.findIndex((e) => e && e.salaryId === salary.id);
  const paid = !deleted && salary.status === "Lunas";

  // Quick-pay entries written before entries were linked: adopt the one that
  // matches (payroll, same amount, staff name in the description).
  if (index === -1 && salary.staffName) {
    index = list.findIndex(
      (e) => e && !e.salaryId && e.code === "P1" && Number(e.outAmount) === Number(salary.amount) &&
        norm(e.description).includes(norm(salary.staffName)),
    );
  }

  if (!paid) return index === -1 ? { kind: "none" } : { kind: "remove", index };
  const wanted = entryFields(salary);
  if (index === -1) return { kind: "add", entry: wanted };
  const current = list[index];
  const changes: Record<string, any> = {};
  for (const k of ["outAmount", "salaryId", "code"]) if (current[k] !== wanted[k]) changes[k] = wanted[k];
  if (wanted.date && current.date !== wanted.date) changes.date = wanted.date;
  return Object.keys(changes).length ? { kind: "update", index, changes } : { kind: "none" };
}
