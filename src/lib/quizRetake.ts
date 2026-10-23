/**
 * Owner's rule (23-10-2026): a retaken quiz overwrites the same assessment
 * record ("ditumpuk"), but the BEST score is the one that counts.
 *
 * Only automatic CBT submissions by the student are compared; a Sensei's
 * manual grading/correction always replaces the score (it may lower it).
 */
export const CBT_AUTO_ASSESSOR = "Sistem CBT (Otomatis)";

// Fields that belong to one attempt: kept together so the stored answers
// always match the stored (best) score.
const ATTEMPT_FIELDS = [
  "score", "status", "grade", "notes", "assessedBy", "assessedDate",
  "scoreKotoba", "scoreBumpo", "scoreKaiwa", "scoreKanji",
  "studentAnswers", "essayAnswers", "quizDetails", "details",
  "submittedAt", "submissionDate", "timestamp",
];

const asScore = (v: any): number | null => (typeof v === "number" && !isNaN(v) ? v : null);

export function mergeQuizRetake<T extends Record<string, any>>(existing: T | null | undefined, incoming: T): T {
  if (!existing || incoming.assessedBy !== CBT_AUTO_ASSESSOR) return incoming;

  const bestScore = asScore(existing.bestScore) ?? asScore(existing.score);
  const newScore = asScore(incoming.score);
  if (bestScore === null || newScore === null) return incoming;

  const attemptCount = (Number(existing.attemptCount) || 1) + 1;
  const attemptInfo = {
    attemptCount,
    lastAttemptScore: newScore,
    lastAttemptAt: incoming.submittedAt || new Date().toISOString(),
  };

  if (newScore >= bestScore) {
    return { ...incoming, ...attemptInfo, bestScore: newScore } as unknown as T;
  }

  // Lower than the best attempt: keep the best attempt's result and answers.
  const kept: Record<string, any> = { ...incoming };
  for (const field of ATTEMPT_FIELDS) {
    if (existing[field] !== undefined) kept[field] = existing[field];
  }
  return { ...kept, ...attemptInfo, bestScore } as unknown as T;
}
