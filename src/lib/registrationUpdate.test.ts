import { describe, it, expect } from "vitest";
import { findRegistrationUpdateTarget, isConvertedRegistration, visibleRegistrations } from "./registrationUpdate";

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

describe("isConvertedRegistration", () => {
  it("matches the same id, or the same email and name", () => {
    expect(isConvertedRegistration({ id: "SIS-010", name: "Muhammad Rizki" }, active)).toBe(true);
    expect(isConvertedRegistration({ id: "REG-5", name: " muhammad rizki ", email: "RIZKI2@x.id" }, active)).toBe(true);
    expect(isConvertedRegistration({ id: "REG-1" }, active)).toBe(false);
    expect(isConvertedRegistration({}, active)).toBe(false);
  });

  it("keeps a real registrant who only shares the email or only the name", () => {
    expect(isConvertedRegistration({ id: "REG-6", name: "Adik Rizki", email: "rizki@x.id" }, active)).toBe(false);
    expect(isConvertedRegistration({ id: "REG-7", name: "Muhammad Rizki", email: "rizki.baru@x.id" }, active)).toBe(false);
  });
});

describe("visibleRegistrations", () => {
  it("hides converted and empty records, keeps real registrants", () => {
    const regs = [
      { id: "REG-1", name: "Siti Aminah", phone: "0812" },
      { id: "SIS-010", name: "Muhammad Rizki", status: "Belajar" },
      { id: "REG-7", verifiedDocs: ["docKTP"] },
      { id: "REG-8", name: "", email: "", phone: "", docKK: "kk.pdf|url" },
      { id: "REG-9", email: "baru@x.id" },
      { id: "REG-10", name: "Muhammad Rizki", email: "rizki@x.id", status: "Pending" },
      { id: "REG-11", name: "Muhammad Rizki", email: "rizki2@x.id", status: "Disetujui", statusPendaftaran: "Alumni" },
    ];
    expect(visibleRegistrations(regs, active).map((r) => r.id)).toEqual(["REG-1", "REG-9", "REG-11"]);
  });

  it("tolerates missing lists", () => {
    expect(visibleRegistrations(undefined, active)).toEqual([]);
    expect(visibleRegistrations([{ id: "REG-1", name: "A" }], undefined)).toEqual([{ id: "REG-1", name: "A" }]);
  });
});
