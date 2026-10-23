import { isSameSubject } from "./subjectHelper";

/**
 * Which existing quiz questions a "Simpan Kuis" batch (lmsQuizzes batch_upsert)
 * replaces. Questions in scope that are missing from the batch get deleted.
 *
 * Previously a batch without a Sub-Judul/Materi replaced EVERY question of that
 * chapter + subject: all other sub-titles and all other classes' quizzes for
 * the chapter were deleted (Sensei Kelas A saving Bab 3 wiped Kelas B's Bab 3).
 * Now a batch only replaces:
 *  - the same class (a "Semua"/empty class on either side counts as shared), and
 *  - the same Sub-Judul / Materi; without one, only the sub-title/materi
 *    groups the batch's own questions belong to.
 */
export interface QuizBatchInfo {
  chapterNumber: number;
  subject: string;
  subTitle?: string;
  lessonId?: string;
  targetClass?: string;
  /** subTitle/lessonId of the questions being saved (used when the batch has neither). */
  incomingQuizzes?: Array<{ subTitle?: string; lessonId?: string }>;
}

const norm = (v: any) => String(v ?? "").trim().toLowerCase();
const isSharedClass = (cls: any) => !norm(cls) || norm(cls) === "semua" || norm(cls) === "semua kelas";
const groupKey = (q: { subTitle?: string; lessonId?: string }) => `${norm(q.subTitle)}|${norm(q.lessonId)}`;

export function isQuizInBatchScope(quiz: any, batch: QuizBatchInfo): boolean {
  if (!quiz) return false;
  const ch = Number(quiz.chapterNumber !== undefined ? quiz.chapterNumber : quiz.chapterId);
  if (ch !== Number(batch.chapterNumber) || !isSameSubject(quiz.subject, batch.subject)) return false;

  const sameClass = isSharedClass(batch.targetClass) || isSharedClass(quiz.targetClass) || norm(quiz.targetClass) === norm(batch.targetClass);
  if (!sameClass) return false;

  if (norm(batch.subTitle)) return norm(quiz.subTitle) === norm(batch.subTitle);
  if (norm(batch.lessonId)) return norm(quiz.lessonId) === norm(batch.lessonId);

  const groups = new Set((batch.incomingQuizzes || []).map(groupKey));
  if (groups.size === 0) groups.add(groupKey({}));
  return groups.has(groupKey(quiz));
}
