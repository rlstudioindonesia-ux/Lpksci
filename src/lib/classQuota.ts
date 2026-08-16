/**
 * Matches a student/user's class name against a target class name: exact
 * match first, then falls back to a shared JLPT-level token (N1-N5,
 * "native") extracted from the target name. Avoids a hardcoded n1/n2/n3
 * allow-list that would silently match nothing for a level like N4/N5 that
 * wasn't in it, hiding real students from the enrollment/quota count.
 */
export function matchesClassLevel(candidateClassName: string | undefined | null, targetClassName: string): boolean {
  const c = (candidateClassName || "").toLowerCase();
  const t = targetClassName.toLowerCase();
  if (!c) return false;
  if (c === t) return true;
  const levelToken = t.match(/\bn[1-5]\b/)?.[0] || (t.includes("native") ? "native" : null);
  return !!levelToken && c.includes(levelToken);
}

/** The real class name students get assigned to, per the "Manajemen Kelas Alumni" admin panel. */
export function alumniClassNameFor(cls: { title?: string; level?: string }): string {
  return `Kelas Alumni ${cls.title || cls.level || ""}`;
}

export interface ClassQuotaResult {
  registeredCount: number;
  quotaLimit: number;
  remaining: number;
}

/**
 * Resolves the final registered/quota/remaining numbers for a class card,
 * given how many real students were found enrolled. Prefers that real,
 * synced count; only falls back to a manually-typed `registered` number -
 * or 0, never a made-up placeholder - when there's genuinely no student
 * assigned yet (e.g. a brand new class card added via the admin CMS).
 */
export function resolveClassQuota(
  cls: { registered?: number; quota?: number },
  realEnrolledCount: number,
): ClassQuotaResult {
  const registeredCount = realEnrolledCount > 0 ? realEnrolledCount : (cls.registered !== undefined ? cls.registered : 0);
  const quotaLimit = cls.quota !== undefined ? cls.quota : 10;
  const remaining = Math.max(0, quotaLimit - registeredCount);
  return { registeredCount, quotaLimit, remaining };
}
