import { describe, it, expect } from "vitest";
import { computeJobEligibility } from "./jobEligibility";
import { ActiveStudent, ChapterAssessment, JobOrder } from "../types";

function makeStudent(overrides: Partial<ActiveStudent> = {}): ActiveStudent {
  return {
    id: "SIS-1",
    name: "Budi Santoso",
    batch: "2026",
    class: "Kelas A",
    status: "Belajar",
    gender: "Laki-laki",
    mathScore: 95,
    fiveSScore: 90,
    ethicsScore: 90,
    attendanceScore: 95,
    tb: 170,
    bb: 60,
    age: 22,
    japaneseScore: 20,
    ...overrides,
  } as ActiveStudent;
}

function makeJob(overrides: Partial<JobOrder> = {}): JobOrder {
  return {
    id: "JOB-1",
    noReg: "001",
    partnerName: "PT Mitra",
    occupation: "Kaigo",
    location: "Tokyo",
    salary: "200000 JPY",
    overtime: "ADA",
    allowance: "-",
    contractDuration: "3 tahun",
    status: "Aktif",
    minMathScore: "90",
    minFiveSScore: "80",
    minEthicsScore: "80",
    minAttendanceScore: "80",
    minJapaneseScore: "BAB 15",
    ...overrides,
  } as JobOrder;
}

describe("computeJobEligibility", () => {
  it("returns a safe default when student or job is missing", () => {
    expect(computeJobEligibility(null, makeJob(), [], [])).toEqual(
      expect.objectContaining({ isEligible: true, autoRejectNote: "" }),
    );
    expect(computeJobEligibility(makeStudent(), null, [], [])).toEqual(
      expect.objectContaining({ isEligible: true, autoRejectNote: "" }),
    );
  });

  it("marks a student meeting every requirement as eligible", () => {
    const result = computeJobEligibility(makeStudent(), makeJob(), [], []);
    expect(result.isEligible).toBe(true);
    expect(result.autoRejectNote).toBe("");
  });

  it("rejects when math score is below the job's minimum", () => {
    const result = computeJobEligibility(makeStudent({ mathScore: 80 }), makeJob({ minMathScore: "90" }), [], []);
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("MTK (80 < 90)");
  });

  it("rejects when 5S score is below the job's minimum", () => {
    const result = computeJobEligibility(makeStudent({ fiveSScore: 70 }), makeJob({ minFiveSScore: "80" }), [], []);
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("5S (70 < 80)");
  });

  it("rejects when ethics score is below the job's minimum", () => {
    const result = computeJobEligibility(makeStudent({ ethicsScore: 60 }), makeJob({ minEthicsScore: "80" }), [], []);
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("Etika (60 < 80)");
  });

  it("computes attendance from records when student.attendanceScore is unset", () => {
    const student = makeStudent({ attendanceScore: undefined });
    const records = [
      { studentId: "SIS-1", status: "Hadir" },
      { studentId: "SIS-1", status: "Hadir" },
      { studentId: "SIS-1", status: "Alpa" },
      { studentId: "SIS-1", status: "Hadir" },
    ];
    const result = computeJobEligibility(student, makeJob({ minAttendanceScore: "80" }), records, []);
    // 3/4 hadir = 75%, below the 80% requirement
    expect(result.attendanceScore).toBe(75);
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("Absensi (75% < 80%)");
  });

  it("rejects when height (TB) is outside the required range", () => {
    const tooShort = computeJobEligibility(makeStudent({ tb: 150 }), makeJob({ tbRequirement: "160 - 180" }), [], []);
    expect(tooShort.isEligible).toBe(false);
    expect(tooShort.autoRejectNote).toContain("TB (150cm < 160cm)");

    const tooTall = computeJobEligibility(makeStudent({ tb: 190 }), makeJob({ tbRequirement: "160 - 180" }), [], []);
    expect(tooTall.isEligible).toBe(false);
    expect(tooTall.autoRejectNote).toContain("TB (190cm > 180cm)");
  });

  it("rejects when weight (BB) is outside the required range", () => {
    const tooLight = computeJobEligibility(makeStudent({ bb: 40 }), makeJob({ bbRequirement: "50 - 80" }), [], []);
    expect(tooLight.isEligible).toBe(false);
    expect(tooLight.autoRejectNote).toContain("BB (40kg < 50kg)");

    const tooHeavy = computeJobEligibility(makeStudent({ bb: 90 }), makeJob({ bbRequirement: "50 - 80" }), [], []);
    expect(tooHeavy.isEligible).toBe(false);
    expect(tooHeavy.autoRejectNote).toContain("BB (90kg > 80kg)");
  });

  it("rejects when age is outside the required range", () => {
    const tooYoung = computeJobEligibility(makeStudent({ age: 17 }), makeJob({ ageRequirement: "18 - 30" }), [], []);
    expect(tooYoung.isEligible).toBe(false);
    expect(tooYoung.autoRejectNote).toContain("Usia (17th < 18th)");

    const tooOld = computeJobEligibility(makeStudent({ age: 35 }), makeJob({ ageRequirement: "18 - 30" }), [], []);
    expect(tooOld.isEligible).toBe(false);
    expect(tooOld.autoRejectNote).toContain("Usia (35th > 30th)");
  });

  it("prefers birthDate over the stored age field when computing age", () => {
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    const student = makeStudent({ age: 99, birthDate: eighteenYearsAgo.toISOString().slice(0, 10) });
    const result = computeJobEligibility(student, makeJob({ ageRequirement: "18 - 30" }), [], []);
    expect(result.myAge).toBe(18);
    expect(result.isEligible).toBe(true);
  });

  it("rejects when Japanese chapter level is below the job's minimum", () => {
    const result = computeJobEligibility(
      makeStudent({ japaneseScore: 10 }),
      makeJob({ minJapaneseScore: "BAB 15" }),
      [],
      [],
    );
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("B.Jepang (Bab 10 < Bab 15)");
  });

  it("rejects when gender doesn't match a single-gender requirement", () => {
    const result = computeJobEligibility(
      makeStudent({ gender: "Perempuan" }),
      makeJob({ gender: "LAKI-LAKI" }),
      [],
      [],
    );
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("Gender");
  });

  it("does not reject on gender when the job accepts both", () => {
    const result = computeJobEligibility(
      makeStudent({ gender: "Perempuan" }),
      makeJob({ gender: "LAKI-LAKI/PEREMPUAN" }),
      [],
      [],
    );
    expect(result.isEligible).toBe(true);
  });

  it("treats a requirement of 0 (unset) as no requirement at all", () => {
    const result = computeJobEligibility(
      makeStudent({ mathScore: 0 }),
      makeJob({ minMathScore: "0" }),
      [],
      [],
    );
    expect(result.autoRejectNote).not.toContain("MTK");
  });

  it("accumulates every failed requirement into a single note", () => {
    const result = computeJobEligibility(
      makeStudent({ mathScore: 50, fiveSScore: 50, age: 99 }),
      makeJob({ minMathScore: "90", minFiveSScore: "80", ageRequirement: "18 - 30" }),
      [],
      [],
    );
    expect(result.isEligible).toBe(false);
    expect(result.autoRejectNote).toContain("MTK");
    expect(result.autoRejectNote).toContain("5S");
    expect(result.autoRejectNote).toContain("Usia");
  });

  it("computes math/Japanese scores from graded chapter assessments instead of the stale stored field", () => {
    // Regression test for the exact bug fixed earlier this session: the stored
    // mathScore/japaneseScore fields are display-only and never get updated
    // once real chapter assessments exist, so eligibility must average the
    // live assessments instead of trusting the (possibly stale/zero) field.
    const student = makeStudent({ mathScore: 0, japaneseScore: 0 });
    const assessments: ChapterAssessment[] = [
      { id: "a1", studentId: "SIS-1", studentName: "Budi Santoso", chapterNumber: 1, title: "Bab 1", status: "Telah Dinilai", subject: "SSW", score: 90 },
      { id: "a2", studentId: "SIS-1", studentName: "Budi Santoso", chapterNumber: 2, title: "Bab 2", status: "Telah Dinilai", subject: "SSW", score: 100 },
      { id: "a3", studentId: "SIS-1", studentName: "Budi Santoso", chapterNumber: 15, title: "Bab 15", status: "Telah Dinilai", subject: "Bahasa Jepang", score: 85 },
      // Not-yet-graded assessments must be excluded from the average.
      { id: "a4", studentId: "SIS-1", studentName: "Budi Santoso", chapterNumber: 16, title: "Bab 16", status: "Belum Belajar", subject: "Bahasa Jepang", score: 0 },
    ];
    const result = computeJobEligibility(student, makeJob({ minMathScore: "90", minJapaneseScore: "BAB 10" }), [], assessments);
    expect(result.mathScore).toBe(95); // average of 90 and 100
    expect(result.myJpn).toBe(85);
    expect(result.isEligible).toBe(true);
  });

  it("only counts assessments belonging to the given student", () => {
    const student = makeStudent({ id: "SIS-1", mathScore: 0 });
    const assessments: ChapterAssessment[] = [
      { id: "a1", studentId: "SIS-1", studentName: "Budi Santoso", chapterNumber: 1, title: "Bab 1", status: "Telah Dinilai", subject: "SSW", score: 100 },
      { id: "a2", studentId: "SIS-2", studentName: "Other Student", chapterNumber: 1, title: "Bab 1", status: "Telah Dinilai", subject: "SSW", score: 0 },
    ];
    const result = computeJobEligibility(student, makeJob({ minMathScore: "90" }), [], assessments);
    expect(result.mathScore).toBe(100);
  });
});
