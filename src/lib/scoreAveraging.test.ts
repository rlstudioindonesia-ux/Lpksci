import { describe, it, expect } from "vitest";
import { isGradedAssessment, filterStudentAssessments, computeSubjectAverage } from "./scoreAveraging";
import { ChapterAssessment } from "../types";

function makeAssessment(overrides: Partial<ChapterAssessment> = {}): ChapterAssessment {
  return {
    id: "a1",
    studentId: "SIS-1",
    studentName: "Budi Santoso",
    chapterNumber: 1,
    title: "Bab 1",
    status: "Telah Dinilai",
    subject: "Bahasa Jepang",
    score: 80,
    ...overrides,
  } as ChapterAssessment;
}

describe("isGradedAssessment", () => {
  it("accepts both Telah Dinilai and Sudah Dinilai as graded", () => {
    expect(isGradedAssessment({ status: "Telah Dinilai", score: 80 })).toBe(true);
    expect(isGradedAssessment({ status: "Sudah Dinilai", score: 80 })).toBe(true);
  });

  it("rejects not-yet-graded statuses", () => {
    expect(isGradedAssessment({ status: "Belum Belajar", score: 80 })).toBe(false);
    expect(isGradedAssessment({ status: "Selesai Belajar", score: 80 })).toBe(false);
    expect(isGradedAssessment({ status: "Menunggu Penilaian", score: 80 })).toBe(false);
  });

  it("rejects a missing, non-numeric, or NaN score even when the status says graded", () => {
    expect(isGradedAssessment({ status: "Telah Dinilai", score: undefined })).toBe(false);
    expect(isGradedAssessment({ status: "Telah Dinilai", score: "80" as unknown as number })).toBe(false);
    expect(isGradedAssessment({ status: "Telah Dinilai", score: NaN })).toBe(false);
  });
});

describe("filterStudentAssessments", () => {
  it("matches by studentId or studentName", () => {
    const assessments = [
      makeAssessment({ id: "a1", studentId: "SIS-1", studentName: "Budi Santoso" }),
      makeAssessment({ id: "a2", studentId: "OTHER", studentName: "Budi Santoso" }),
      makeAssessment({ id: "a3", studentId: "SIS-2", studentName: "Other Student" }),
    ];
    const result = filterStudentAssessments(assessments, { id: "SIS-1", name: "Budi Santoso" });
    expect(result.map((a) => a.id)).toEqual(["a1", "a2"]);
  });

  it("returns an empty array for a missing student", () => {
    expect(filterStudentAssessments([makeAssessment()], null)).toEqual([]);
  });
});

describe("computeSubjectAverage", () => {
  const student = { id: "SIS-1", name: "Budi Santoso" };

  it("averages only graded Bahasa Jepang assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", subject: "Bahasa Jepang", status: "Telah Dinilai", score: 90 }),
      makeAssessment({ id: "a2", subject: "Bahasa Jepang", status: "Sudah Dinilai", score: 100 }),
      makeAssessment({ id: "a3", subject: "Bahasa Jepang", status: "Belum Belajar", score: undefined }),
    ];
    const result = computeSubjectAverage(assessments, student, "Bahasa Jepang");
    expect(result).toEqual({ average: 95, gradedCount: 2 });
  });

  it("treats a missing subject as Bahasa Jepang (the historical default)", () => {
    const assessments = [makeAssessment({ subject: undefined, score: 88 })];
    const result = computeSubjectAverage(assessments, student, "Bahasa Jepang");
    expect(result).toEqual({ average: 88, gradedCount: 1 });
  });

  it("accepts every Matematika subject alias (SSW, Matematika, SSW Matematika)", () => {
    for (const subject of ["SSW", "Matematika", "SSW Matematika"]) {
      const result = computeSubjectAverage(
        [makeAssessment({ subject: subject as ChapterAssessment["subject"], score: 70 })],
        student,
        "Matematika",
      );
      expect(result.average).toBe(70);
    }
  });

  it("does not mix Bahasa Jepang and Matematika scores together", () => {
    const assessments = [
      makeAssessment({ id: "a1", subject: "Bahasa Jepang", score: 100 }),
      makeAssessment({ id: "a2", subject: "SSW", score: 0 }),
    ];
    expect(computeSubjectAverage(assessments, student, "Bahasa Jepang")).toEqual({ average: 100, gradedCount: 1 });
    expect(computeSubjectAverage(assessments, student, "Matematika")).toEqual({ average: 0, gradedCount: 1 });
  });

  it("returns null average and zero count when nothing is graded yet", () => {
    const assessments = [makeAssessment({ status: "Belum Belajar", score: undefined })];
    expect(computeSubjectAverage(assessments, student, "Bahasa Jepang")).toEqual({ average: null, gradedCount: 0 });
  });

  it("only counts the given student's own assessments", () => {
    const assessments = [
      makeAssessment({ id: "a1", studentId: "SIS-1", studentName: "Budi Santoso", score: 100 }),
      makeAssessment({ id: "a2", studentId: "SIS-2", studentName: "Other Student", score: 0 }),
    ];
    expect(computeSubjectAverage(assessments, student, "Bahasa Jepang")).toEqual({ average: 100, gradedCount: 1 });
  });

  it("returns a safe result for a missing student", () => {
    expect(computeSubjectAverage([makeAssessment()], null, "Bahasa Jepang")).toEqual({ average: null, gradedCount: 0 });
  });
});
