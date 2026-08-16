import { describe, it, expect } from "vitest";
import { computeFinancialMetrics, computeMonthlyExpenseBreakdown } from "./financeCalculations";
import { CashLedgerRecord, PaymentRecord } from "../types";

function payment(overrides: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: "PAY-1",
    studentName: "Budi",
    category: "DP",
    amount: 0,
    date: "2026-01-01",
    status: "Lunas",
    ...overrides,
  };
}

function ledgerEntry(overrides: Partial<CashLedgerRecord>): CashLedgerRecord {
  return {
    id: "L-1",
    code: "P2",
    date: "2026-01-15",
    description: "Beban operasional",
    inAmount: 0,
    outAmount: 0,
    ...overrides,
  };
}

describe("computeFinancialMetrics", () => {
  it("returns all zeros for empty input", () => {
    expect(computeFinancialMetrics([], [])).toEqual({
      totalLunas: 0,
      totalCicilan: 0,
      totalInLedger: 0,
      totalOutLedger: 0,
      totalGaji: 0,
      totalOperasional: 0,
      sisaSaldo: 0,
    });
  });

  it("treats undefined payments/ledger the same as empty arrays", () => {
    expect(computeFinancialMetrics(undefined, undefined)).toEqual(
      computeFinancialMetrics([], []),
    );
  });

  it("sums Lunas and Cicilan payments into separate totals, ignoring other statuses", () => {
    const payments = [
      payment({ status: "Lunas", amount: 5_000_000 }),
      payment({ status: "Lunas", amount: 3_000_000 }),
      payment({ status: "Cicilan", amount: 1_500_000 }),
      payment({ status: "Belum Bayar", amount: 2_000_000 }),
      payment({ status: "Dibatalkan", amount: 9_000_000 }),
    ];
    const result = computeFinancialMetrics(payments, []);
    expect(result.totalLunas).toBe(8_000_000);
    expect(result.totalCicilan).toBe(1_500_000);
  });

  it("sums ledger in/out amounts across all entries regardless of code", () => {
    const ledger = [
      ledgerEntry({ code: "P1", inAmount: 0, outAmount: 10_000_000 }),
      ledgerEntry({ code: "P2", inAmount: 0, outAmount: 2_000_000 }),
      ledgerEntry({ code: "P9B", inAmount: 20_000_000, outAmount: 0 }),
    ];
    const result = computeFinancialMetrics([], ledger);
    expect(result.totalInLedger).toBe(20_000_000);
    expect(result.totalOutLedger).toBe(12_000_000);
    expect(result.sisaSaldo).toBe(8_000_000);
  });

  it("attributes only code P1 entries to totalGaji (payroll)", () => {
    const ledger = [
      ledgerEntry({ code: "P1", outAmount: 7_000_000 }),
      ledgerEntry({ code: "P1", outAmount: 3_000_000 }),
      ledgerEntry({ code: "P2", outAmount: 1_000_000 }),
    ];
    const result = computeFinancialMetrics([], ledger);
    expect(result.totalGaji).toBe(10_000_000);
  });

  it("excludes P1 (payroll) and P9B from totalOperasional", () => {
    const ledger = [
      ledgerEntry({ code: "P1", outAmount: 10_000_000 }),
      ledgerEntry({ code: "P9B", outAmount: 5_000_000 }),
      ledgerEntry({ code: "P2", outAmount: 1_000_000 }),
      ledgerEntry({ code: "P3", outAmount: 2_000_000 }),
    ];
    const result = computeFinancialMetrics([], ledger);
    expect(result.totalOperasional).toBe(3_000_000);
  });

  it("computes sisaSaldo as total in minus total out, allowing a negative balance", () => {
    const ledger = [
      ledgerEntry({ inAmount: 1_000_000, outAmount: 0 }),
      ledgerEntry({ inAmount: 0, outAmount: 4_000_000 }),
    ];
    const result = computeFinancialMetrics([], ledger);
    expect(result.sisaSaldo).toBe(-3_000_000);
  });
});

describe("computeMonthlyExpenseBreakdown", () => {
  it("returns an empty object for empty input", () => {
    expect(computeMonthlyExpenseBreakdown([])).toEqual({});
  });

  it("groups entries by <MonthName> <Year> derived from the entry date", () => {
    const ledger = [
      ledgerEntry({ date: "2026-01-10", outAmount: 100_000 }),
      ledgerEntry({ date: "2026-01-20", outAmount: 200_000 }),
      ledgerEntry({ date: "2026-02-05", outAmount: 50_000 }),
    ];
    const result = computeMonthlyExpenseBreakdown(ledger);
    expect(Object.keys(result).sort()).toEqual(["Februari 2026", "Januari 2026"]);
    expect(result["Januari 2026"].total).toBe(300_000);
    expect(result["Februari 2026"].total).toBe(50_000);
  });

  it("splits each month's total into gaji (code P1) vs operasional", () => {
    const ledger = [
      ledgerEntry({ date: "2026-03-01", code: "P1", outAmount: 8_000_000 }),
      ledgerEntry({ date: "2026-03-05", code: "P4", outAmount: 500_000 }),
    ];
    const result = computeMonthlyExpenseBreakdown(ledger);
    expect(result["Maret 2026"].gaji).toBe(8_000_000);
    expect(result["Maret 2026"].operasional).toBe(500_000);
    expect(result["Maret 2026"].total).toBe(8_500_000);
    expect(result["Maret 2026"].list).toHaveLength(2);
  });

  it("ignores entries with no outgoing amount (income-only rows)", () => {
    const ledger = [ledgerEntry({ date: "2026-04-01", inAmount: 5_000_000, outAmount: 0 })];
    const result = computeMonthlyExpenseBreakdown(ledger);
    expect(result).toEqual({});
  });

  it("ignores malformed dates instead of throwing", () => {
    const ledger = [ledgerEntry({ date: "not-a-date", outAmount: 100_000 })];
    expect(() => computeMonthlyExpenseBreakdown(ledger)).not.toThrow();
  });

  it("falls back to Januari for an out-of-range month index", () => {
    const ledger = [ledgerEntry({ date: "2026-13-01", outAmount: 100_000 })];
    const result = computeMonthlyExpenseBreakdown(ledger);
    expect(result["Januari 2026"].total).toBe(100_000);
  });
});
