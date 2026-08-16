import { describe, it, expect } from "vitest";
import { isStudentAlumni, isAlumniClassName } from "./alumniStatus";

describe("isStudentAlumni", () => {
  it("returns false for a missing student", () => {
    expect(isStudentAlumni(null)).toBe(false);
    expect(isStudentAlumni(undefined)).toBe(false);
  });

  it("returns false for a student with no alumni markers", () => {
    expect(isStudentAlumni({ status: "Belajar" })).toBe(false);
  });

  it("treats statusPendaftaran === Alumni as alumni regardless of status", () => {
    expect(isStudentAlumni({ status: "Belajar", statusPendaftaran: "Alumni" })).toBe(true);
  });

  it("treats kategoriPendaftaran === Alumni as alumni regardless of status", () => {
    expect(isStudentAlumni({ status: "Belajar", kategoriPendaftaran: "Alumni" })).toBe(true);
  });

  it("treats status Lulus as alumni even with no registration category set", () => {
    // Regression case: records created via RegistrationView only ever set
    // statusPendaftaran, never kategoriPendaftaran - a student who
    // graduated (Lulus) must still count as alumni even when both
    // registration fields are undefined.
    expect(isStudentAlumni({ status: "Lulus" })).toBe(true);
  });

  it("treats status Di Jepang as alumni", () => {
    expect(isStudentAlumni({ status: "Di Jepang" })).toBe(true);
  });

  it("does not treat other job-pipeline statuses as alumni on their own", () => {
    for (const status of ["Belajar", "On Proges Job", "On Progres JFT/JLPT/SSW", "Diklat SO", "Dikeluarkan"]) {
      expect(isStudentAlumni({ status })).toBe(false);
    }
  });

  it("does not treat statusPendaftaran 'Siswa Baru' as alumni", () => {
    expect(isStudentAlumni({ status: "Belajar", statusPendaftaran: "Siswa Baru" })).toBe(false);
  });
});

describe("isAlumniClassName", () => {
  it("matches a class name containing 'alumni' case-insensitively", () => {
    expect(isAlumniClassName("Kelas Alumni N3")).toBe(true);
    expect(isAlumniClassName("KELAS ALUMNI LEVEL N2")).toBe(true);
  });

  it("does not match a regular class name", () => {
    expect(isAlumniClassName("Kelas Reguler A")).toBe(false);
  });

  it("handles empty/missing class names safely", () => {
    expect(isAlumniClassName("")).toBe(false);
    expect(isAlumniClassName(null)).toBe(false);
    expect(isAlumniClassName(undefined)).toBe(false);
  });
});
