import { describe, it, expect } from "vitest";
import { isQuizInBatchScope } from "./quizBatchScope";

const q = (over: any) => ({ chapterNumber: 3, subject: "Bahasa Jepang", subTitle: "", lessonId: "", targetClass: "Kelas A", ...over });

describe("isQuizInBatchScope", () => {
  const batchA = { chapterNumber: 3, subject: "Bahasa Jepang", targetClass: "Kelas A", incomingQuizzes: [{ subTitle: "", lessonId: "" }] };

  it("does not touch another class's quiz for the same chapter", () => {
    expect(isQuizInBatchScope(q({ targetClass: "Kelas B" }), batchA)).toBe(false);
  });

  it("does not touch other sub-titles when the batch has no sub-title", () => {
    expect(isQuizInBatchScope(q({ subTitle: "Sub 2: Kuis Kanji" }), batchA)).toBe(false);
  });

  it("still replaces the batch's own group so removed questions get deleted", () => {
    expect(isQuizInBatchScope(q({}), batchA)).toBe(true);
    const editing = { ...batchA, incomingQuizzes: [{ subTitle: "Sub 2: Kuis Kanji" }] };
    expect(isQuizInBatchScope(q({ subTitle: "Sub 2: Kuis Kanji" }), editing)).toBe(true);
  });

  it("scopes to the given sub-title / materi", () => {
    const bySub = { ...batchA, subTitle: "Sub 1" };
    expect(isQuizInBatchScope(q({ subTitle: "sub 1" }), bySub)).toBe(true);
    expect(isQuizInBatchScope(q({ subTitle: "Sub 2" }), bySub)).toBe(false);
  });

  it("treats 'Semua' as shared on either side", () => {
    expect(isQuizInBatchScope(q({ targetClass: "Semua" }), batchA)).toBe(true);
    expect(isQuizInBatchScope(q({ targetClass: "Kelas B" }), { ...batchA, targetClass: "Semua" })).toBe(true);
  });

  it("ignores other chapters and subjects", () => {
    expect(isQuizInBatchScope(q({ chapterNumber: 4 }), batchA)).toBe(false);
    expect(isQuizInBatchScope(q({ subject: "Matematika" }), batchA)).toBe(false);
  });
});
