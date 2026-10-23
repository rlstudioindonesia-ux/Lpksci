/**
 * Monthly totals offered by the Pajak "impor otomatis" list (23-10-2026).
 *
 * Paid payments already have their own Buku Kas income entry (`code` =
 * payment id, see paymentLedger.ts). The import used to recognise that entry
 * only when amount AND date matched, but the entry is dated on the day the
 * payment was marked paid while the payment keeps its invoice date, so the
 * same income was counted twice and the suggested tax was too high.
 */
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function monthKey(date: any): string | null {
  const parts = String(date || "").split("-");
  if (parts.length < 2) return null;
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (!(monthIndex >= 0 && monthIndex < 12) || !parts[0]) return null;
  return `${MONTHS[monthIndex]} ${parts[0]}`;
}

export interface TaxImportMonth {
  monthString: string;
  totalRevenue: number;
  totalExpenses: number;
}

export function computeTaxImportMonths(
  ledger: any[] | null | undefined,
  payments: any[] | null | undefined,
  savedMonthStrings: string[],
): TaxImportMonth[] {
  const monthly: Record<string, { in: number; out: number }> = {};
  const add = (key: string, inAmt: number, outAmt: number) => {
    if (!monthly[key]) monthly[key] = { in: 0, out: 0 };
    monthly[key].in += inAmt;
    monthly[key].out += outAmt;
  };

  const ledgerList = Array.isArray(ledger) ? ledger : [];
  const ledgerCodes = new Set(ledgerList.map((l) => l && l.code).filter(Boolean));
  for (const entry of ledgerList) {
    const key = entry && monthKey(entry.date);
    if (!key) continue;
    add(key, Number(entry.inAmount) || 0, Number(entry.outAmount) || 0);
  }

  for (const p of Array.isArray(payments) ? payments : []) {
    if (!p || p.isDeleted || (p.status !== "Lunas" && p.status !== "Cicilan")) continue;
    const key = monthKey(p.date);
    if (!key) continue;
    // Already in the cash book: linked entry, or (old data) same amount on the same day.
    if (p.id && ledgerCodes.has(p.id)) continue;
    if (ledgerList.some((l) => l && Number(l.inAmount) === Number(p.amount) && l.date === p.date)) continue;
    add(key, Number(p.amount) || 0, 0);
  }

  return Object.keys(monthly)
    .filter((m) => !savedMonthStrings.includes(m))
    .map((m) => ({ monthString: m, totalRevenue: monthly[m].in, totalExpenses: monthly[m].out }));
}
