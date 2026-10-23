import { describe, it, expect } from "vitest";
import { computeQuizScore } from "./quizScoring";

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
