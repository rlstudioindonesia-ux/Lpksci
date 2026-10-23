import { isActiveStudent, isAlumniTabStudent } from "./studentStatusGroups";
import { isPhantomRegistration } from "./registrationUpdate";

/**
 * Alumni referrals (23-10-2026). The Admin page, the VVIP page and the alumni
 * dashboard each counted referrals differently: the referral code was compared
 * case-sensitively in two places (so "Budi@x.id" and "budi@x.id " became two
 * alumni), VVIP still counted self-referrals, rejected applicants were counted
 * and the alumni "Sukses" box looked for a status "Aktif" that no student has.
 * One list is built here and every page reads from it.
 */

export const normalizeReferralCode = (v: any) => String(v ?? "").trim().toLowerCase();

export interface ReferredStudent {
  id: string;
  name: string;
  status: string;
  /** Normalised referral code (lowercase, trimmed). */
  referrer: string;
  date: string;
  type: "registered" | "active";
}

/**
 * The optional "Kode Referral" field is free text; some applicants type their
 * own name or email, which later resolves to their own account (username =
 * email). Those are not referrals.
 */
export function isSelfReferral(
  student: { id?: string; name?: string; email?: string } | null | undefined,
  referrer: any,
  users: any[] | null | undefined,
): boolean {
  const r = normalizeReferralCode(referrer);
  if (!r || !student) return false;
  if (normalizeReferralCode(student.name) === r) return true;
  if (normalizeReferralCode(student.email) === r) return true;
  const ownUser = (users || []).find(
    (u) => u && ((u.studentId && u.studentId === student.id) || (student.email && normalizeReferralCode(u.email) === normalizeReferralCode(student.email))),
  );
  return !!ownUser && normalizeReferralCode(ownUser.username) === r;
}

export function collectReferrals(
  registered: any[] | null | undefined,
  active: any[] | null | undefined,
  users: any[] | null | undefined,
): ReferredStudent[] {
  const activeList = Array.isArray(active) ? active : [];
  const activeEmails = new Set(activeList.map((s) => normalizeReferralCode(s?.email)).filter(Boolean));

  const fromRegistered = (Array.isArray(registered) ? registered : [])
    .filter(
      (s) =>
        s &&
        normalizeReferralCode(s.referrer) &&
        s.status !== "Ditolak" &&
        // Already a student: counted once, from the active list.
        !isPhantomRegistration(s, activeList) &&
        !(s.email && activeEmails.has(normalizeReferralCode(s.email))) &&
        !isSelfReferral(s, s.referrer, users),
    )
    .map((s) => ({
      id: s.id,
      name: s.name || "",
      status: s.status || "",
      referrer: normalizeReferralCode(s.referrer),
      date: s.date || "-",
      type: "registered" as const,
    }));

  const fromActive = activeList
    .filter((s) => s && normalizeReferralCode(s.referrer) && !isSelfReferral(s, s.referrer, users))
    .map((s) => ({
      id: s.id,
      name: s.name || "",
      status: s.status || "",
      referrer: normalizeReferralCode(s.referrer),
      date: "-",
      type: "active" as const,
    }));

  return [...fromRegistered, ...fromActive];
}

/** A referral counts as successful once the friend is an active student or already in Japan. */
export function isSuccessfulReferral(r: Pick<ReferredStudent, "type" | "status">): boolean {
  return r.type === "active" && (isActiveStudent(r) || isAlumniTabStudent(r));
}

export interface ReferrerSummary {
  username: string;
  realName: string;
  total: number;
  activeCount: number;
  registeredCount: number;
  students: ReferredStudent[];
}

export function groupReferralsByReferrer(referrals: ReferredStudent[], users: any[] | null | undefined): Record<string, ReferrerSummary> {
  const map: Record<string, ReferrerSummary> = {};
  for (const s of referrals) {
    const ref = s.referrer;
    if (!map[ref]) {
      const matchedUser = (users || []).find((u) => u && normalizeReferralCode(u.username) === ref);
      map[ref] = {
        username: ref,
        realName: matchedUser?.name || ref,
        total: 0,
        activeCount: 0,
        registeredCount: 0,
        students: [],
      };
    }
    map[ref].total += 1;
    if (s.type === "active") map[ref].activeCount += 1;
    else map[ref].registeredCount += 1;
    map[ref].students.push(s);
  }
  return map;
}
