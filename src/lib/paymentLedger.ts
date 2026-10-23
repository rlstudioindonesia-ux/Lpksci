/**
 * What must happen to the auto-created Buku Kas income entry of a payment
 * (the entry whose `code` is the payment id) after the payment changed.
 *
 * Previously the entry was only ever ADDED when a payment became "Lunas", so
 * cancelling/deleting a paid payment ("Dihapus", back to "Belum Bayar") or
 * correcting its amount left the old income in the cash book.
 */
export type LedgerSyncPlan =
  | { kind: "none" }
  | { kind: "add"; inAmount: number }
  | { kind: "update"; index: number; inAmount: number }
  | { kind: "remove"; index: number };

export function planLedgerSyncForPayment(
  ledger: Array<{ code?: string; inAmount?: number | string }> | null | undefined,
  payment: { id?: string; status?: string; amount?: number | string; isDeleted?: boolean } | null | undefined,
): LedgerSyncPlan {
  if (!payment || !payment.id) return { kind: "none" };
  const list = Array.isArray(ledger) ? ledger : [];
  const index = list.findIndex((c) => c && c.code === payment.id);
  const isPaid = payment.status === "Lunas" && !payment.isDeleted;
  if (isPaid) {
    const inAmount = Number(payment.amount) || 0;
    if (index === -1) return { kind: "add", inAmount };
    if (Number(list[index].inAmount) !== inAmount) return { kind: "update", index, inAmount };
    return { kind: "none" };
  }
  return index === -1 ? { kind: "none" } : { kind: "remove", index };
}
