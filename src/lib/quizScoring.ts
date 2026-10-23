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
