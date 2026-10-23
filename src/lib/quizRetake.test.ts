import { describe, it, expect } from "vitest";
import { mergeQuizRetake, CBT_AUTO_ASSESSOR } from "./quizRetake";

const attempt = (score: number, extra: any = {}) => ({
  id: "asses-SIS-001-L1",
  score,
  status: score >= 75 ? "Telah Dinilai" : "Selesai Belajar",
  assessedBy: CBT_AUTO_ASSESSOR,
  studentAnswers: { q1: score },
  submittedAt: `2026-10-23T0${score % 10}:00:00Z`,
  ...extra,
});

describe("mergeQuizRetake", () => {
  it("keeps the best score (and its answers) when a retake scores lower", () => {
    const result = mergeQuizRetake(attempt(90), attempt(60));
    expect(result.score).toBe(90);
    expect(result.status).toBe("Telah Dinilai");
    expect(result.studentAnswers).toEqual({ q1: 90 });
    expect(result.lastAttemptScore).toBe(60);
    expect(result.attemptCount).toBe(2);
    expect(result.bestScore).toBe(90);
  });

  it("takes a retake that scores higher", () => {
    const result = mergeQuizRetake(attempt(60), attempt(85));
    expect(result.score).toBe(85);
    expect(result.bestScore).toBe(85);
    expect(result.attemptCount).toBe(2);
  });

  it("counts attempts across several retakes", () => {
    const second = mergeQuizRetake(attempt(70), attempt(50));
    const third = mergeQuizRetake(second, attempt(65));
    expect(third.score).toBe(70);
    expect(third.attemptCount).toBe(3);
  });

  it("lets a Sensei correction lower the score", () => {
    const result = mergeQuizRetake(attempt(90), { ...attempt(70), assessedBy: "Sensei Tanaka" });
    expect(result.score).toBe(70);
  });

  it("uses the submission as-is for a first attempt", () => {
    const first = attempt(40);
    expect(mergeQuizRetake(null, first)).toBe(first);
  });
});
