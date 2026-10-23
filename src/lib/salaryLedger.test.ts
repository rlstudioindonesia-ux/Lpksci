import { describe, it, expect } from "vitest";
import { planLedgerSyncForSalary } from "./salaryLedger";

const salary = { id: "SAL-1", staffName: "Tanaka", amount: 3000000, monthString: "Oktober 2026", paymentDate: "2026-10-23", status: "Lunas" };

describe("planLedgerSyncForSalary", () => {
  it("adds one payroll entry for a paid salary", () => {
    const plan = planLedgerSyncForSalary([], salary);
    expect(plan).toEqual({
      kind: "add",
      entry: { code: "P1", date: "2026-10-23", description: "Gaji Staff: Tanaka (Oktober 2026)", inAmount: 0, outAmount: 3000000, salaryId: "SAL-1" },
    });
  });

  it("follows edits and removes the entry when unpaid or deleted", () => {
    const ledger = [{ id: "K1", code: "P1", salaryId: "SAL-1", outAmount: 3000000, date: "2026-10-23" }];
    expect(planLedgerSyncForSalary(ledger, { ...salary, amount: 3500000 })).toEqual({ kind: "update", index: 0, changes: { outAmount: 3500000 } });
    expect(planLedgerSyncForSalary(ledger, { ...salary, status: "Pending" })).toEqual({ kind: "remove", index: 0 });
    expect(planLedgerSyncForSalary(ledger, salary, true)).toEqual({ kind: "remove", index: 0 });
    expect(planLedgerSyncForSalary(ledger, salary)).toEqual({ kind: "none" });
  });

  it("adopts an old unlinked quick-pay entry instead of adding a second one", () => {
    const ledger = [
      { id: "K0", code: "P2", outAmount: 3000000, description: "Gaji Staff: Tanaka" },
      { id: "K1", code: "P1", outAmount: 3000000, description: "Gaji Staff: Tanaka (Okt)", date: "2026-10-23" },
    ];
    expect(planLedgerSyncForSalary(ledger, salary)).toEqual({ kind: "update", index: 1, changes: { salaryId: "SAL-1" } });
  });

  it("ignores salaries without id", () => {
    expect(planLedgerSyncForSalary([], {})).toEqual({ kind: "none" });
  });
});
