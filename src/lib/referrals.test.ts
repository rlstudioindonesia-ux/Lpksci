import { describe, it, expect } from "vitest";
import { collectReferrals, groupReferralsByReferrer, isSelfReferral, isSuccessfulReferral } from "./referrals";

const users = [
  { username: "budi@x.id", name: "Budi Alumni", role: "Alumni" },
  { username: "sari@x.id", name: "Sari", studentId: "SIS-002", email: "sari@x.id", role: "Siswa" },
];

describe("collectReferrals", () => {
  const registered = [
    { id: "REG-1", name: "Andi", referrer: "Budi@x.id ", status: "Pending" },
    { id: "REG-2", name: "Dewi", referrer: "budi@x.id", status: "Ditolak" },
    { id: "SIS-001", name: "Eko", referrer: "budi@x.id", status: "Belajar" }, // phantom copy of an active student
    { id: "REG-3", name: "Fajar", referrer: "fajar", status: "Pending" }, // self referral by name
  ];
  const active = [
    { id: "SIS-001", name: "Eko", referrer: "BUDI@X.ID", status: "Belajar" },
    { id: "SIS-002", name: "Sari", email: "sari@x.id", referrer: "sari@x.id", status: "Belajar" }, // self (own username)
    { id: "SIS-003", name: "Gita", referrer: "budi@x.id", status: "Di Jepang" },
    { id: "SIS-004", name: "Hadi", referrer: "budi@x.id", status: "Dikeluarkan" },
  ];

  const list = collectReferrals(registered, active, users);

  it("normalises the code, skips rejected, self and phantom-duplicate entries", () => {
    expect(list.map((r) => `${r.type}:${r.name}:${r.referrer}`)).toEqual([
      "registered:Andi:budi@x.id",
      "active:Eko:budi@x.id",
      "active:Gita:budi@x.id",
      "active:Hadi:budi@x.id",
    ]);
  });

  it("groups one alumni under one row with the real name", () => {
    const map = groupReferralsByReferrer(list, users);
    expect(Object.keys(map)).toEqual(["budi@x.id"]);
    expect(map["budi@x.id"]).toMatchObject({ realName: "Budi Alumni", total: 4, activeCount: 3, registeredCount: 1 });
  });

  it("counts success as active students or already in Japan", () => {
    expect(list.filter(isSuccessfulReferral).map((r) => r.name)).toEqual(["Eko", "Gita"]);
  });
});

describe("isSelfReferral", () => {
  it("detects own name, email or username", () => {
    expect(isSelfReferral({ id: "X", name: "Andi" }, " andi ", users)).toBe(true);
    expect(isSelfReferral({ id: "X", email: "a@x.id" }, "A@x.id", users)).toBe(true);
    expect(isSelfReferral({ id: "SIS-002", name: "Sari" }, "sari@x.id", users)).toBe(true);
    expect(isSelfReferral({ id: "X", name: "Andi" }, "budi@x.id", users)).toBe(false);
    expect(isSelfReferral({ id: "X", name: "Andi" }, "", users)).toBe(false);
  });
});
