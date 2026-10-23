import { checkEssayAnswer } from "./essayAnswer";
/**
 * Score (0-100) of a CBT submission, weighted by each question's `points`
 * (default 10) - the same formula the Sensei correction modal
 * (StudentQuizReviewModal) uses. The submission used to count correct
 * questions only, so with non-default points the score changed as soon as a
 * Sensei opened the correction modal and saved without changing anything.
 */
export function computeQuizScore<Q extends { points?: number | string }>(
  quizzes: Q[],
  isCorrect: (q: Q) => boolean,
): number {
  if (!Array.isArray(quizzes) || quizzes.length === 0) return 0;
  let max = 0;
  let earned = 0;
  for (const q of quizzes) {
    const pts = Number(q.points) || 10;
    max += pts;
    if (isCorrect(q)) earned += pts;
  }
  return max > 0 ? Math.round((earned / max) * 100) : 0;
}

/**
 * Whether one CBT answer is correct (shared by the browser and the server,
 * 23-10-2026). Multiple choice: the chosen option set must equal the key set.
 * Essay: checkEssayAnswer against `correctAnswerEssay` / `correctAnswerText`.
 */
export function isQuizAnswerCorrect(
  q: any,
  mcqAnswers: Record<string, any> | null | undefined,
  essayAnswers: Record<string, any> | null | undefined,
): boolean {
  if (!q) return false;
  if (q.questionType === "essay") {
    return checkEssayAnswer(essayAnswers?.[q.id], q.correctAnswerEssay || q.correctAnswerText);
  }
  const rawAns = mcqAnswers?.[q.id];
  if (rawAns === undefined || rawAns === null) return false;
  const studentKeys: number[] = Array.isArray(rawAns) ? rawAns.map(Number) : [Number(rawAns)];
  const correctKeys: number[] = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
    ? q.correctAnswerIndices.map(Number)
    : [q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0];
  if (studentKeys.length !== correctKeys.length) return false;
  const a = [...studentKeys].sort((x, y) => x - y);
  const b = [...correctKeys].sort((x, y) => x - y);
  return a.every((v, i) => v === b[i]);
}

/** Answer-key fields of a quiz question (never sent to students before they submit). */
export const QUIZ_ANSWER_KEY_FIELDS = ["correctAnswerIndex", "correctAnswerIndices", "correctAnswerEssay", "correctAnswerText", "explanation"];

/**
 * Server-side grading of a student's CBT submission (23-10-2026). The browser
 * used to compute the score and the server stored whatever it received, so a
 * student could send any score. The score, status, per-question correctness
 * and the summary note are recomputed from the stored questions. Returns the
 * payload unchanged when the questions cannot all be found.
 */
export function gradeSubmissionOnServer(payload: any, lmsQuizzes: any[] | null | undefined): any {
  const details = payload?.details;
  const quizDetails: any[] = Array.isArray(details?.quizDetails) ? details.quizDetails : [];
  if (!payload || quizDetails.length === 0) return payload;
  const byId = new Map((lmsQuizzes || []).filter((q: any) => q && q.id).map((q: any) => [q.id, q]));
  const quizzes = quizDetails.map((d: any) => byId.get(d?.quizId));
  if (quizzes.some((q) => !q)) return payload;

  const mcq = payload.studentAnswers || details.studentQuizAnswers || {};
  const essay = payload.essayAnswers || details.studentQuizEssayAnswers || {};
  const correct = (q: any) => isQuizAnswerCorrect(q, mcq, essay);
  const score = computeQuizScore(quizzes as any[], correct);
  const correctCount = (quizzes as any[]).filter(correct).length;

  const gradedDetails = quizDetails.map((d: any, i: number) => {
    const q: any = quizzes[i];
    const cIndices = Array.isArray(q.correctAnswerIndices) && q.correctAnswerIndices.length > 0
      ? q.correctAnswerIndices.map(Number)
      : [q.correctAnswerIndex !== undefined ? Number(q.correctAnswerIndex) : 0];
    return {
      ...d,
      isCorrect: correct(q),
      points: q.points || 10,
      correctAnswerIndex: cIndices[0],
      correctAnswerIndices: cIndices,
      correctAnswerEssay: q.correctAnswerEssay || q.correctAnswerText || "",
    };
  });

  const notes = typeof payload.notes === "string"
    ? payload.notes.replace(/\d+\/\d+ benar \(Akurasi: \d+%\)/, `${correctCount}/${quizzes.length} benar (Akurasi: ${score}%)`)
    : payload.notes;

  return {
    ...payload,
    score,
    status: score >= 75 ? "Telah Dinilai" : "Selesai Belajar",
    notes,
    details: { ...details, quizDetails: gradedDetails },
  };
}
