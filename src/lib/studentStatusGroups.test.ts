import { describe, it, expect } from "vitest";
import {
  countStudentsByStatusGroup,
  isAlumniStatusValue,
  getStudentStatusGroup,
  studentMatchesStatusGroup,
  isActiveStudent,
  countActiveStudents,
  isAlumniTabStudent,
} from "./studentStatusGroups";

describe("getStudentStatusGroup", () => {
  it("counts Lulus under Sertifikasi JFT/JLPT/SSW (same group in every table)", () => {
    expect(getStudentStatusGroup("Lulus")).toBe("On Progres JFT/JLPT/SSW");
  });

  it("counts the mis-spelt 'On Progres Job' saved by the old VVIP form as On Proges Job", () => {
    expect(getStudentStatusGroup("On Progres Job")).toBe("On Proges Job");
  });

  it("does not count Dikeluarkan as Belajar", () => {
    expect(getStudentStatusGroup("Dikeluarkan")).toBe("Dikeluarkan");
    expect(getStudentStatusGroup("Berhenti")).toBe("Dikeluarkan");
  });

  it("counts empty or unknown statuses as Belajar so they never vanish from the totals", () => {
    expect(getStudentStatusGroup(undefined)).toBe("Belajar");
    expect(getStudentStatusGroup("")).toBe("Belajar");
    expect(getStudentStatusGroup("status lama")).toBe("Belajar");
  });
});

describe("countStudentsByStatusGroup", () => {
  it("gives per-group counts that always add up to the total", () => {
    const students = [
      { status: "Belajar" },
      { status: "" },
      { status: "On Proges Job" },
      { status: "Diklat SO" },
      { status: "Di Jepang" },
      { status: "Lulus" },
      { status: "On Progres JFT/JLPT/SSW" },
      { status: "Dikeluarkan" },
    ];
    const counts = countStudentsByStatusGroup(students);
    expect(counts["Belajar"]).toBe(2);
    expect(counts["On Proges Job"]).toBe(1);
    expect(counts["Diklat SO"]).toBe(1);
    expect(counts["Di Jepang"]).toBe(1);
    expect(counts["On Progres JFT/JLPT/SSW"]).toBe(2);
    expect(counts["Dikeluarkan"]).toBe(1);
    const sum = counts["Belajar"] + counts["On Proges Job"] + counts["Diklat SO"] + counts["Di Jepang"] + counts["On Progres JFT/JLPT/SSW"] + counts["Dikeluarkan"];
    expect(sum).toBe(counts.total);
    expect(counts.total).toBe(students.length);
  });

  it("handles a missing list", () => {
    expect(countStudentsByStatusGroup(undefined).total).toBe(0);
  });
});

describe("studentMatchesStatusGroup", () => {
  it("lists Lulus students when filtering on the JFT row whose count includes them", () => {
    expect(studentMatchesStatusGroup({ status: "Lulus" }, "On Progres JFT/JLPT/SSW")).toBe(true);
  });

  it("does not list expelled students under Belajar", () => {
    expect(studentMatchesStatusGroup({ status: "Dikeluarkan" }, "Belajar")).toBe(false);
  });
});

describe("isActiveStudent (rumus Siswa Aktif)", () => {
  it("counts Belajar + On Progres Job + On Progres JFT + Lulus sertifikasi", () => {
    expect(isActiveStudent({ status: "Belajar" })).toBe(true);
    expect(isActiveStudent({ status: "On Proges Job" })).toBe(true);
    expect(isActiveStudent({ status: "On Progres JFT/JLPT/SSW" })).toBe(true);
    expect(isActiveStudent({ status: "Lulus" })).toBe(true);
  });

  it("excludes Diklat SO, Di Jepang and Dikeluarkan", () => {
    expect(isActiveStudent({ status: "Diklat SO" })).toBe(false);
    expect(isActiveStudent({ status: "Di Jepang" })).toBe(false);
    expect(isActiveStudent({ status: "Dikeluarkan" })).toBe(false);
  });

  it("counts a list", () => {
    expect(countActiveStudents([{ status: "Belajar" }, { status: "Lulus" }, { status: "Di Jepang" }, { status: "Diklat SO" }])).toBe(2);
  });
});

describe("isAlumniTabStudent", () => {
  it("lists only students already in Japan", () => {
    expect(isAlumniTabStudent({ status: "Di Jepang" })).toBe(true);
    expect(isAlumniTabStudent({ status: "Lulus" })).toBe(false);
    expect(isAlumniTabStudent({ status: "Diklat SO" })).toBe(false);
  });
});

describe("isAlumniStatusValue", () => {
  it("only Di Jepang is alumni; Lulus stays a student (owner, 23-10-2026)", () => {
    expect(isAlumniStatusValue("Di Jepang")).toBe(true);
    expect(isAlumniStatusValue("Lulus")).toBe(false);
    expect(isAlumniStatusValue("Belajar")).toBe(false);
    expect(isAlumniStatusValue(undefined)).toBe(false);
  });
});
