import { describe, it, expect } from "vitest";
import { findRegistrationUpdateTarget, isPhantomRegistration, findPhantomRegistrations } from "./registrationUpdate";

const registered = [
  { id: "REG-1", name: "Siti Aminah", email: "siti@x.id" },
  { id: "REG-2", name: "Budi", email: "budi@x.id" },
];
const active = [
  { id: "SIS-010", name: "Muhammad Rizki", email: "rizki@x.id" },
  { id: "SIS-011", name: "Muhammad Rizki", email: "rizki2@x.id" },
];

describe("findRegistrationUpdateTarget", () => {
  it("updates the registration with the same id", () => {
    expect(findRegistrationUpdateTarget(registered, active, { id: "REG-2" })).toEqual({ kind: "registration", index: 1 });
  });

  it("sends documents of an approved (active) student to the active student, never a new registrant", () => {
    const payload = { id: "SIS-011", name: "Muhammad Rizki", email: "rizki2@x.id", docKTP: "ktp.pdf|url" };
    expect(findRegistrationUpdateTarget(registered, active, payload)).toEqual({ kind: "activeStudent", index: 1 });
  });

  it("returns none for an unknown id instead of creating a registration", () => {
    expect(findRegistrationUpdateTarget(registered, active, { id: "REG-999", verifiedDocs: [] } as any)).toEqual({ kind: "none" });
  });

  it("falls back to email or a unique name for registrations", () => {
    expect(findRegistrationUpdateTarget(registered, active, { id: "OLD", email: "BUDI@x.id" })).toEqual({ kind: "registration", index: 1 });
    expect(findRegistrationUpdateTarget(registered, active, { name: " siti aminah " })).toEqual({ kind: "registration", index: 0 });
  });

  it("does not guess between registrants sharing a name", () => {
    const dup = [...registered, { id: "REG-3", name: "Siti Aminah" }];
    expect(findRegistrationUpdateTarget(dup, active, { name: "Siti Aminah" })).toEqual({ kind: "none" });
  });

  it("tolerates missing lists", () => {
    expect(findRegistrationUpdateTarget(undefined, null, { id: "X" })).toEqual({ kind: "none" });
  });
});

describe("isPhantomRegistration", () => {
  it("flags registrations that share an id with an active student", () => {
    expect(isPhantomRegistration({ id: "SIS-010", name: "Muhammad Rizki" }, active)).toBe(true);
    expect(isPhantomRegistration({ id: "REG-1" }, active)).toBe(false);
    expect(isPhantomRegistration({}, active)).toBe(false);
  });
});

describe("findPhantomRegistrations", () => {
  it("returns copies of active students and empty records only", () => {
    const regs = [
      { id: "REG-1", name: "Siti Aminah", phone: "0812" },
      { id: "SIS-010", name: "Muhammad Rizki", status: "Belajar" },
      { id: "REG-7", verifiedDocs: ["docKTP"] },
      { id: "REG-8", name: "", email: "", phone: "", docKK: "kk.pdf|url" },
      { id: "REG-9", email: "baru@x.id" },
    ];
    expect(findPhantomRegistrations(regs, active).map((r) => r.id)).toEqual(["SIS-010", "REG-7", "REG-8"]);
  });

  it("returns nothing for missing lists", () => {
    expect(findPhantomRegistrations(undefined, active)).toEqual([]);
    expect(findPhantomRegistrations([{ id: "REG-1", name: "A" }], undefined)).toEqual([]);
  });
});
