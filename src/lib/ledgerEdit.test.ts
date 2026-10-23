import { describe, it, expect } from "vitest";
import { finalLedgerCode, planLedgerStudentSync } from "./ledgerEdit";

const payments = [
  { id: "PAY-A", studentName: "Budi", studentId: "SIS-1", category: "Administrasi Pendaftaran", amount: 500000, status: "Belum Bayar" },
  { id: "PAY-B", studentName: "Budi", studentId: "SIS-1", category: "DP Biaya Belajar", amount: 5000000, status: "Lunas" },
];
const activeStudents = [{ id: "SIS-1", name: "Budi" }];

describe("finalLedgerCode", () => {
  it("keeps the bill id of a linked entry, otherwise uses the chosen category", () => {
    expect(finalLedgerCode("PAY-A", "P1", payments)).toBe("PAY-A");
    expect(finalLedgerCode("P2", "P4", payments)).toBe("P4");
    expect(finalLedgerCode("", "", payments)).toBe("DLL");
  });
});

describe("planLedgerStudentSync", () => {
  const base = { payments, activeStudents, studentName: "Budi", newPaymentId: "PAY-NEW", date: "2026-10-23" };

  it("marks an unpaid bill as paid without changing its amount", () => {
    expect(planLedgerStudentSync({ ...base, category: "Administrasi Pendaftaran", inAmount: 500000 })).toEqual({
      ledgerCode: "PAY-A",
      payment: { action: "edit", payload: { id: "PAY-A", status: "Lunas", date: "2026-10-23" } },
    });
  });

  it("does not touch a bill that is already paid or underpaid", () => {
    expect(planLedgerStudentSync({ ...base, category: "DP Biaya Belajar", inAmount: 100 }).payment).toBeUndefined();
    expect(planLedgerStudentSync({ ...base, category: "Administrasi Pendaftaran", inAmount: 100 }).payment).toBeUndefined();
  });

  it("creates one paid bill linked to the cash entry when none exists", () => {
    const plan = planLedgerStudentSync({ ...base, category: "Biaya Tes Bahasa", inAmount: 300000 });
    expect(plan.ledgerCode).toBe("PAY-NEW");
    expect(plan.payment).toEqual({
      action: "add",
      payload: { id: "PAY-NEW", studentName: "Budi", studentId: "SIS-1", category: "Biaya Tes Bahasa", amount: 300000, date: "2026-10-23", status: "Lunas", paymentMethod: "Cash / Tunai" },
    });
  });
});
