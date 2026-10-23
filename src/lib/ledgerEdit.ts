import { paymentMatchesStudent, resolveStudentIdByName } from "./paymentOwner";

/**
 * Editing a Buku Kas entry (23-10-2026).
 *
 * Two money bugs in the "Edit entri kas" dialog (Admin & VVIP):
 *  - Income entries created from a paid bill carry the bill id as `code`. The
 *    category dropdown had no such option, so the browser showed the first
 *    one ("P1 - Gaji Karyawan") and saving re-coded the income as salary and
 *    cut the link to the bill - the next bill update then added a second
 *    entry (income counted twice).
 *  - "Terkait Pembayaran Siswa" ADDED the cash amount to the bill on every
 *    save (Rp 500.000 -> 1.000.000 -> 1.500.000) and created a duplicate cash
 *    entry for the same money.
 */

export const LEDGER_CATEGORY_CODES = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9A", "P9B", "DLL"];

export function isPaymentLinkedCode(code: any, payments: any[] | null | undefined): boolean {
  return !!code && (payments || []).some((p: any) => p && p.id === code);
}

/** Entries linked to a bill keep the bill id as their code. */
export function finalLedgerCode(originalCode: any, selectedCode: any, payments: any[] | null | undefined): string {
  if (isPaymentLinkedCode(originalCode, payments)) return String(originalCode);
  return String(selectedCode || "DLL");
}

export interface LedgerStudentSyncInput {
  payments: any[] | null | undefined;
  activeStudents?: any[] | null;
  registeredStudents?: any[] | null;
  studentName: string;
  category: string;
  inAmount: number;
  date?: string;
  newPaymentId: string;
}

export interface LedgerStudentSyncPlan {
  /** Code the cash entry must carry so the bill and the entry stay one record. */
  ledgerCode?: string;
  payment?: { action: "edit" | "add"; payload: any };
  /** Message for the admin when nothing could be synchronised. */
  note?: string;
}

export function planLedgerStudentSync(input: LedgerStudentSyncInput): LedgerStudentSyncPlan {
  const studentId = resolveStudentIdByName(input.studentName, input.activeStudents, input.registeredStudents);
  const ref = { id: studentId, name: input.studentName };
  const existing = (input.payments || []).find(
    (p: any) => p && !p.isDeleted && p.status !== "Dihapus" && paymentMatchesStudent(p, ref) && p.category === input.category,
  );
  const amount = Number(input.inAmount) || 0;

  if (existing) {
    if (existing.status === "Lunas") {
      return { note: `Tagihan "${existing.category}" untuk ${input.studentName} sudah LUNAS; tagihan tidak diubah.` };
    }
    if (amount >= (Number(existing.amount) || 0)) {
      return {
        ledgerCode: existing.id,
        payment: { action: "edit", payload: { id: existing.id, status: "Lunas", ...(input.date ? { date: input.date } : {}) } },
      };
    }
    return { note: `Nominal kas (Rp ${amount.toLocaleString("id-ID")}) lebih kecil dari tagihan; tagihan tidak diubah. Catat cicilan di menu Pembayaran.` };
  }

  return {
    ledgerCode: input.newPaymentId,
    payment: {
      action: "add",
      payload: {
        id: input.newPaymentId,
        studentName: input.studentName,
        ...(studentId ? { studentId } : {}),
        category: input.category,
        amount,
        date: input.date,
        status: "Lunas",
        paymentMethod: "Cash / Tunai",
      },
    },
  };
}
