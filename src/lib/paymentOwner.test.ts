import { describe, it, expect } from "vitest";
import {
  resolveStudentIdByName,
  paymentMatchesStudent,
  buildBillingEntries,
  planPaymentStudentIdBackfill,
  planPaymentNameSync,
  planPaymentOwnerMove,
} from "./paymentOwner";

const active = [
  { id: "SIS-001", name: "Muhammad Rizki" },
  { id: "SIS-002", name: "Muhammad Rizki" },
  { id: "SIS-003", name: "Siti Aminah" },
];
const registered = [{ id: "REG-1", name: "Budi" }];

describe("resolveStudentIdByName", () => {
  it("links only unique names, active students first", () => {
    expect(resolveStudentIdByName(" siti aminah ", active, registered)).toBe("SIS-003");
    expect(resolveStudentIdByName("Budi", active, registered)).toBe("REG-1");
    expect(resolveStudentIdByName("Muhammad Rizki", active, registered)).toBeUndefined();
    expect(resolveStudentIdByName("", active)).toBeUndefined();
  });
});

describe("paymentMatchesStudent", () => {
  it("uses the id when both sides have one, otherwise the name", () => {
    expect(paymentMatchesStudent({ studentId: "SIS-001", studentName: "Muhammad Rizki" }, { id: "SIS-002", name: "Muhammad Rizki" })).toBe(false);
    expect(paymentMatchesStudent({ studentId: "SIS-002", studentName: "Nama Lama" }, { id: "SIS-002", name: "Muhammad Rizki" })).toBe(true);
    expect(paymentMatchesStudent({ studentName: "muhammad rizki" }, { id: "SIS-002", name: "Muhammad Rizki" })).toBe(true);
    expect(paymentMatchesStudent({ studentName: "X" }, null)).toBe(false);
  });
});

describe("buildBillingEntries", () => {
  it("separates students sharing a name and keeps manual names", () => {
    const entries = buildBillingEntries([...active, ...registered, { id: "SIS-003", name: "Siti Aminah" }], ["Siti Aminah", "Pak Manual"]);
    expect(entries.map((e) => e.label)).toEqual([
      "Budi",
      "Muhammad Rizki (SIS-001)",
      "Muhammad Rizki (SIS-002)",
      "Pak Manual",
      "Siti Aminah",
    ]);
    expect(entries.find((e) => e.label === "Pak Manual")?.id).toBeUndefined();
  });
});

describe("plans", () => {
  const payments = [
    { id: "P1", studentName: "Siti Aminah" },
    { id: "P2", studentName: "Muhammad Rizki" },
    { id: "P3", studentName: "Siti Aminah", studentId: "SIS-003" },
    { id: "P4", studentName: "Budi", studentId: "REG-1" },
  ];

  it("backfills only unambiguous names", () => {
    expect(planPaymentStudentIdBackfill(payments, active, registered)).toEqual([{ id: "P1", changes: { studentId: "SIS-003" } }]);
  });

  it("linked bills follow a renamed student; unlinked ones are left alone", () => {
    const renamed = [{ id: "SIS-003", name: "Siti Aminah Putri" }, ...active.slice(0, 2)];
    expect(planPaymentNameSync(payments, renamed, registered)).toEqual([{ id: "P3", changes: { studentName: "Siti Aminah Putri" } }]);
    expect(planPaymentNameSync(payments, active, registered)).toEqual([]);
  });

  it("moves bills from a registration to the new active student", () => {
    expect(planPaymentOwnerMove(payments, "REG-1", "SIS-010")).toEqual([{ id: "P4", changes: { studentId: "SIS-010" } }]);
    expect(planPaymentOwnerMove(payments, "REG-1", "REG-1")).toEqual([]);
  });
});
