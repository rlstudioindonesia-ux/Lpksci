import { describe, it, expect } from "vitest";
import { planLedgerSyncForPayment } from "./paymentLedger";

const ledger = [
  { code: "MANUAL-1", inAmount: 100000 },
  { code: "PAY-1", inAmount: 500000 },
];

describe("planLedgerSyncForPayment", () => {
  it("adds an income entry when a payment becomes Lunas", () => {
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-2", status: "Lunas", amount: 750000 })).toEqual({ kind: "add", inAmount: 750000 });
  });

  it("removes the income entry when a paid payment is deleted or cancelled", () => {
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-1", status: "Dihapus" })).toEqual({ kind: "remove", index: 1 });
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-1", status: "Belum Bayar" })).toEqual({ kind: "remove", index: 1 });
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-1", status: "Lunas", isDeleted: true })).toEqual({ kind: "remove", index: 1 });
  });

  it("corrects the income when the amount of a paid payment changes", () => {
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-1", status: "Lunas", amount: "600000" })).toEqual({ kind: "update", index: 1, inAmount: 600000 });
  });

  it("does nothing when the entry already matches, or for unpaid payments without an entry", () => {
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-1", status: "Lunas", amount: 500000 })).toEqual({ kind: "none" });
    expect(planLedgerSyncForPayment(ledger, { id: "PAY-3", status: "Belum Bayar" })).toEqual({ kind: "none" });
  });

  it("never touches manual ledger entries", () => {
    expect(planLedgerSyncForPayment(ledger, { id: "MANUAL-X", status: "Dihapus" })).toEqual({ kind: "none" });
  });
});
