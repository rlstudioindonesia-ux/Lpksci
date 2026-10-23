import { describe, it, expect } from "vitest";
import { computeTaxImportMonths } from "./taxImport";

describe("computeTaxImportMonths", () => {
  const ledger = [
    { code: "PAY-1", date: "2026-10-05", inAmount: 500000, outAmount: 0 },
    { code: "", date: "2026-10-07", inAmount: 0, outAmount: 200000 },
  ];

  it("does not count a paid payment twice when its cash entry has another date", () => {
    const payments = [{ id: "PAY-1", date: "2026-09-28", amount: 500000, status: "Lunas" }];
    expect(computeTaxImportMonths(ledger, payments, [])).toEqual([
      { monthString: "Oktober 2026", totalRevenue: 500000, totalExpenses: 200000 },
    ]);
  });

  it("adds paid payments that are not in the cash book, skips deleted/unpaid ones", () => {
    const payments = [
      { id: "PAY-2", date: "2026-10-10", amount: 300000, status: "Lunas" },
      { id: "PAY-3", date: "2026-10-11", amount: 999, status: "Lunas", isDeleted: true },
      { id: "PAY-4", date: "2026-10-12", amount: 999, status: "Belum Bayar" },
    ];
    expect(computeTaxImportMonths(ledger, payments, [])[0].totalRevenue).toBe(800000);
  });

  it("keeps the old same-amount-same-day check and hides saved months", () => {
    const old = [{ date: "2026-08-01", inAmount: 100, outAmount: 0 }];
    const payments = [{ id: "PAY-5", date: "2026-08-01", amount: 100, status: "Lunas" }];
    expect(computeTaxImportMonths(old, payments, [])).toEqual([{ monthString: "Agustus 2026", totalRevenue: 100, totalExpenses: 0 }]);
    expect(computeTaxImportMonths(old, payments, ["Agustus 2026"])).toEqual([]);
  });

  it("ignores invalid dates", () => {
    expect(computeTaxImportMonths([{ date: "kemarin", inAmount: 5 }, { date: "2026-13-01", inAmount: 5 }], [], [])).toEqual([]);
  });
});
