import { ChapterAssessment } from "../types";

export type SubjectGroup = "Bahasa Jepang" | "Matematika";

const MATH_SUBJECTS = ["SSW", "Matematika", "SSW Matematika"];

/** A chapter assessment only counts toward an average once it's actually been graded. */
export function isGradedAssessment(a: Pick<ChapterAssessment, "status" | "score">): boolean {
  return (
    (a.status === "Telah Dinilai" || a.status === "Sudah Dinilai") &&
    typeof a.score === "number" &&
    !isNaN(a.score as number)
  );
}

function matchesSubjectGroup(a: Pick<ChapterAssessment, "subject">, subjectGroup: SubjectGroup): boolean {
  if (subjectGroup === "Bahasa Jepang") return (a.subject || "Bahasa Jepang") === "Bahasa Jepang";
  return MATH_SUBJECTS.includes((a.subject as string) || "");
}

export function filterStudentAssessments(
  assessments: ChapterAssessment[] | null | undefined,
  student: { id?: string; name?: string } | null | undefined,
): ChapterAssessment[] {
  if (!student) return [];
  return (assessments || []).filter(
    (a) => (!!student.id && a.studentId === student.id) || (!!student.name && a.studentName === student.name),
  );
}

/**
 * A student's own graded chapter assessments for a subject group (Bahasa
 * Jepang, or Matematika/SSW - matched via its known subject-string
 * aliases). Only assessments actually graded ("Telah Dinilai" or "Sudah
 * Dinilai", both equally valid) with a real numeric score are included - a
 * not-yet-graded chapter must never get counted as belonging to the wrong
 * subject or drag an average down.
 */
export function filterGradedAssessmentsBySubject(
  assessments: ChapterAssessment[] | null | undefined,
  student: { id?: string; name?: string } | null | undefined,
  subjectGroup: SubjectGroup,
): ChapterAssessment[] {
  const mine = filterStudentAssessments(assessments, student);
  return mine.filter((a) => isGradedAssessment(a) && matchesSubjectGroup(a, subjectGroup));
}

export interface SubjectAverageResult {
  /** Rounded average score of graded assessments in this subject group, or null when none are graded yet. */
  average: number | null;
  gradedCount: number;
}

/** Averages a student's graded chapter assessments for a subject group - see filterGradedAssessmentsBySubject. */
export function computeSubjectAverage(
  assessments: ChapterAssessment[] | null | undefined,
  student: { id?: string; name?: string } | null | undefined,
  subjectGroup: SubjectGroup,
): SubjectAverageResult {
  const graded = filterGradedAssessmentsBySubject(assessments, student, subjectGroup);
  if (graded.length === 0) return { average: null, gradedCount: 0 };
  const average = Math.round(graded.reduce((acc, c) => acc + (c.score || 0), 0) / graded.length);
  return { average, gradedCount: graded.length };
}
