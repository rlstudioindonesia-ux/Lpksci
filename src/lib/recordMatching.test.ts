import { describe, it, expect } from "vitest";
import { findRecordIndex, findStudentUserIndex, findStudentForUser } from "./recordMatching";

const students = [
  { id: "SIS-001", name: "Muhammad Rizki", email: "rizki.a@contoh.id" },
  { id: "SIS-002", name: "Siti Aminah", email: "siti@contoh.id" },
  { id: "SIS-003", name: "Muhammad Rizki", email: "rizki.b@contoh.id" },
];

describe("findRecordIndex", () => {
  it("updates the student with the given id even when an earlier student shares the name", () => {
    expect(findRecordIndex(students, { id: "SIS-003", name: "Muhammad Rizki" })).toBe(2);
  });

  it("falls back to email when the id is unknown", () => {
    expect(findRecordIndex(students, { id: "REG-9", email: "RIZKI.B@contoh.id " })).toBe(2);
  });

  it("uses the name only when it is unique", () => {
    expect(findRecordIndex(students, { name: "siti aminah" })).toBe(1);
  });

  it("refuses to guess when several students share the name", () => {
    expect(findRecordIndex(students, { name: "Muhammad Rizki" })).toBe(-1);
  });

  it("returns -1 for nothing to match", () => {
    expect(findRecordIndex(students, {})).toBe(-1);
    expect(findRecordIndex(undefined, { id: "SIS-001" })).toBe(-1);
  });
});

describe("findStudentUserIndex", () => {
  const users = [
    { username: "admin", name: "Muhammad Rizki", role: "Admin" },
    { username: "rizki.a", name: "Muhammad Rizki", studentId: "SIS-001", role: "Siswa" },
    { username: "siti@x.id", name: "Siti", email: "siti@x.id", role: "Siswa" },
    { username: "budi", name: "Budi", role: "Siswa" },
  ];

  it("prefers the linked studentId, then email", () => {
    expect(findStudentUserIndex(users, { id: "SIS-001", name: "X" })).toBe(1);
    expect(findStudentUserIndex(users, { id: "SIS-9", email: "SITI@x.id" })).toBe(2);
  });

  it("never takes the account of another student with the same name", () => {
    expect(findStudentUserIndex(users, { id: "SIS-002", name: "Muhammad Rizki" })).toBe(-1);
  });

  it("uses a unique unlinked name as last resort and ignores staff", () => {
    expect(findStudentUserIndex(users, { id: "SIS-003", name: " budi " })).toBe(3);
    expect(findStudentUserIndex(users, { id: "SIS-004", name: "Tidak Ada" })).toBe(-1);
  });
});

describe("findStudentForUser", () => {
  const list = [
    { id: "SIS-001", name: "Muhammad Rizki", email: "rizki.a@x.id" },
    { id: "SIS-002", name: "Muhammad Rizki", email: "rizki.b@x.id" },
    { id: "SIS-003", name: "Siti", email: "" },
  ];

  it("returns the account's own record even when another student listed first has the same name", () => {
    expect(findStudentForUser(list, { studentId: "SIS-002", name: "Muhammad Rizki" })?.id).toBe("SIS-002");
  });

  it("falls back to email (also from an email username), then a unique name", () => {
    expect(findStudentForUser(list, { username: "RIZKI.B@x.id", name: "Muhammad Rizki" })?.id).toBe("SIS-002");
    expect(findStudentForUser(list, { name: "siti" })?.id).toBe("SIS-003");
  });

  it("does not guess between students sharing a name", () => {
    expect(findStudentForUser(list, { name: "Muhammad Rizki" })).toBeUndefined();
    expect(findStudentForUser(list, null)).toBeUndefined();
  });
});
