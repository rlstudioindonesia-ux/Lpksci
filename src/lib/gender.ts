/**
 * Normalises the many spellings found in student data ("L", "P", "LAKI-LAKI",
 * "Pria", "Wanita", "male", ...) to the two values the forms use. Unknown or
 * empty input returns "" (never a guessed default: the CV form used to fall
 * back to "Laki-laki", so saving a CV turned female students without a stored
 * gender into male).
 */
export type Gender = "Laki-laki" | "Perempuan";

export function normalizeGender(value: unknown): Gender | "" {
  const v = String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (!v) return "";
  if (["l", "lk", "laki", "lakilaki", "pria", "male", "m", "cowok", "男"].includes(v)) return "Laki-laki";
  if (["p", "pr", "perempuan", "wanita", "female", "f", "w", "cewek", "女"].includes(v)) return "Perempuan";
  return "";
}
