/**
 * Decides whether the CV (Rirekisho) form should be re-initialised from the
 * student record coming from the server.
 *
 * The app refetches /api/state every ~25s and every refetch creates new
 * student objects, even when nothing about THIS student changed. StudentCvView
 * used to re-initialise its form on every new object, so whatever the student
 * was typing got wiped mid-fill ("bug pengisian CV"). Now the form only
 * reloads when a different student is opened, or when there are no unsaved
 * local edits to lose.
 */
export function shouldReloadCvForm(params: {
  previousStudentId: string | null | undefined;
  nextStudentId: string | null | undefined;
  hasUnsavedChanges: boolean;
}): boolean {
  const { previousStudentId, nextStudentId, hasUnsavedChanges } = params;
  if (!nextStudentId) return false;
  if (previousStudentId !== nextStudentId) return true;
  return !hasUnsavedChanges;
}
