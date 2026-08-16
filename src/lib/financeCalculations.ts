import { CashLedgerRecord, PaymentRecord } from "../types";

export interface FinancialMetrics {
  totalLunas: number;
  totalCicilan: number;
  totalInLedger: number;
  totalOutLedger: number;
  totalGaji: number;
  totalOperasional: number;
  sisaSaldo: number;
}

/**
 * Core financial summary used across the VVIP/Admin dashboards: revenue
 * collected from student payments, and expense breakdown from the cash
 * ledger (Buku Kas). Cash ledger codes: "P1" is payroll (Gaji), "P9B" is
 * excluded from operational-expense totals (it isn't a real cost line),
 * everything else counts as operational expense.
 */
export function computeFinancialMetrics(
  payments: PaymentRecord[] | undefined,
  ledger: CashLedgerRecord[] | undefined,
): FinancialMetrics {
  const safePayments = payments || [];
  const safeLedger = ledger || [];

  const totalLunas = safePayments
    .filter((p) => p.status === "Lunas")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalCicilan = safePayments
    .filter((p) => p.status === "Cicilan")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalInLedger = safeLedger.reduce((acc, curr) => acc + (curr.inAmount || 0), 0);
  const totalOutLedger = safeLedger.reduce((acc, curr) => acc + (curr.outAmount || 0), 0);

  const totalGaji = safeLedger
    .filter((entry) => entry.code === "P1")
    .reduce((acc, curr) => acc + (curr.outAmount || 0), 0);

  const totalOperasional = safeLedger
    .filter((entry) => entry.code !== "P1" && entry.code !== "P9B")
    .reduce((acc, curr) => acc + (curr.outAmount || 0), 0);

  const sisaSaldo = totalInLedger - totalOutLedger;

  return {
    totalLunas,
    totalCicilan,
    totalInLedger,
    totalOutLedger,
    totalGaji,
    totalOperasional,
    sisaSaldo,
  };
}

export interface MonthlyExpenseBreakdown {
  [monthKey: string]: {
    total: number;
    gaji: number;
    operasional: number;
    list: CashLedgerRecord[];
  };
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/**
 * Groups cash-ledger expense entries (outAmount > 0) by "<MonthName> <Year>",
 * splitting each month's total into payroll (code "P1") vs operational.
 */
export function computeMonthlyExpenseBreakdown(
  ledger: CashLedgerRecord[] | undefined,
): MonthlyExpenseBreakdown {
  const safeLedger = ledger || [];
  const monthsData: MonthlyExpenseBreakdown = {};

  safeLedger.forEach((entry) => {
    if (entry.outAmount <= 0) return;
    const dateParts = entry.date.split("-");
    if (dateParts.length < 2) return;
    const year = dateParts[0];
    const monthIndex = parseInt(dateParts[1], 10) - 1;
    const monthName = MONTH_NAMES[monthIndex] || "Januari";
    const key = `${monthName} ${year}`;

    if (!monthsData[key]) {
      monthsData[key] = { total: 0, gaji: 0, operasional: 0, list: [] };
    }

    monthsData[key].total += entry.outAmount;
    if (entry.code === "P1") {
      monthsData[key].gaji += entry.outAmount;
    } else {
      monthsData[key].operasional += entry.outAmount;
    }
    monthsData[key].list.push(entry);
  });

  return monthsData;
}
