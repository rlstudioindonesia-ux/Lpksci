import { describe, it, expect } from "vitest";
import { findRecordIndex } from "./recordMatching";

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
