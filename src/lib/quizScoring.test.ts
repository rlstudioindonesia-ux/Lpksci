import { describe, it, expect } from "vitest";
import { computeQuizScore, gradeSubmissionOnServer } from "./quizScoring";

describe("computeQuizScore", () => {
  it("equals the share of correct questions when all points are default", () => {
    const qs: Array<{ id: number; points?: number }> = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    expect(computeQuizScore(qs, (q) => q.id <= 3)).toBe(75);
  });

  it("weights questions by their points like the Sensei correction modal", () => {
    const qs = [{ id: 1, points: 30 }, { id: 2, points: 10 }];
    expect(computeQuizScore(qs, (q) => q.id === 1)).toBe(75);
    expect(computeQuizScore(qs, (q) => q.id === 2)).toBe(25);
  });

  it("returns 0 for an empty quiz", () => {
    expect(computeQuizScore([], () => true)).toBe(0);
  });
});

describe("gradeSubmissionOnServer", () => {
  const quizzes = [
    { id: "Q1", questionType: "pilihan_ganda", correctAnswerIndex: 2, points: 10 },
    { id: "Q2", questionType: "pilihan_ganda_kompleks", correctAnswerIndices: [0, 3], points: 20 },
    { id: "Q3", questionType: "essay", correctAnswerEssay: "sakura", points: 10 },
  ];
  const base = {
    studentId: "SIS-1",
    score: 100,
    status: "Telah Dinilai",
    notes: "Kuis Bab 1: 3/3 benar (Akurasi: 100%)",
    studentAnswers: { Q1: 2, Q2: [3, 0] },
    essayAnswers: { Q3: "salah" },
    details: { quizDetails: [{ quizId: "Q1", isCorrect: true }, { quizId: "Q2", isCorrect: true }, { quizId: "Q3", isCorrect: true }] },
  };

  it("replaces a forged score with the real one", () => {
    const graded = gradeSubmissionOnServer(base, quizzes);
    expect(graded.score).toBe(75);
    expect(graded.status).toBe("Telah Dinilai");
    expect(graded.notes).toBe("Kuis Bab 1: 2/3 benar (Akurasi: 75%)");
    expect(graded.details.quizDetails.map((d: any) => d.isCorrect)).toEqual([true, true, false]);
    expect(graded.details.quizDetails[1].correctAnswerIndices).toEqual([0, 3]);
  });

  it("marks low scores as not passed and leaves unknown quizzes untouched", () => {
    const low = gradeSubmissionOnServer({ ...base, studentAnswers: { Q1: 1 } }, quizzes);
    expect(low.score).toBe(0);
    expect(low.status).toBe("Selesai Belajar");
    const unknown = { ...base, details: { quizDetails: [{ quizId: "QX" }] } };
    expect(gradeSubmissionOnServer(unknown, quizzes)).toBe(unknown);
    expect(gradeSubmissionOnServer({ score: 50 }, quizzes)).toEqual({ score: 50 });
  });
});
