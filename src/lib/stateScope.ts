import { ADMIN_ROLES } from "./apiAccess";
import { findStudentForUser } from "./recordMatching";
import { QUIZ_ANSWER_KEY_FIELDS } from "./quizScoring";

/**
 * What GET /api/state sends to whom (security stage 2, 23-10-2026).
 *
 * Until now every visitor - even without logging in - received the complete
 * database: phone numbers, addresses, document links of every student,
 * everybody's bills, salaries, taxes and the cash book. With enforcement on,
 * staff (Admin/VVIP/Pengajar) still get everything; students get their own
 * records in full and only public fields of others; visitors get only what
 * the public website needs.
 */

const STAFF_ROLES = [...ADMIN_ROLES, "Pengajar"];
const norm = (v: any) => String(v ?? "").trim().toLowerCase();

const pick = (obj: any, keys: string[]) => {
  const out: any = {};
  if (!obj || typeof obj !== "object") return out;
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
};

/** Student fields any logged-in user / visitor may see (class lists, map, rankings, referrals). */
export const PUBLIC_STUDENT_FIELDS = [
  "id", "name", "batch", "class", "status", "sensei", "profilePicture", "prefecture", "city", "company",
  "latitude", "longitude", "graduationYear", "kategoriPendaftaran", "statusPendaftaran", "currentChapter",
  "japaneseLevel", "gender", "referrer",
];
export const PUBLIC_USER_FIELDS = ["username", "name", "role", "profilePicture", "assignedClass", "status", "studentId", "lastActive", "kecakapanSensei", "japaneseLevel"];
const PUBLIC_REGISTRATION_FIELDS = ["id", "name", "status", "referrer", "date", "program"];
const ASSESSMENT_ANSWER_FIELDS = ["quizDetails", "studentQuizAnswers", "studentQuizEssayAnswers", "answers", "essayAnswers"];

/** Collections only staff ever receive. */
const STAFF_ONLY_KEYS = ["cashLedger", "salaries", "taxes", "logs", "teacherContracts", "teacherLeaves", "teacherReports", "inventory", "passwordResets"];

export function isStaffViewer(viewer: { role?: string } | null | undefined): boolean {
  return !!viewer && STAFF_ROLES.includes(viewer.role || "");
}

export function scopeStateForViewer(payload: any, viewer: { username?: string; role?: string; name?: string; email?: string; studentId?: string } | null | undefined): any {
  if (!payload || typeof payload !== "object") return payload;
  if (isStaffViewer(viewer)) return payload;

  const scoped: any = { ...payload };
  for (const k of STAFF_ONLY_KEYS) if (k in scoped) scoped[k] = Array.isArray(payload[k]) ? [] : undefined;

  const active: any[] = Array.isArray(payload.activeStudents) ? payload.activeStudents : [];
  const registered: any[] = Array.isArray(payload.registeredStudents) ? payload.registeredStudents : [];
  const users: any[] = Array.isArray(payload.users) ? payload.users : [];

  const ownActive = viewer ? findStudentForUser<any>(active, viewer) : undefined;
  const ownReg = viewer ? findStudentForUser<any>(registered, viewer) : undefined;
  const ownIds = new Set([ownActive?.id, ownReg?.id, viewer?.studentId].filter(Boolean).map(norm));
  const ownNames = new Set([ownActive?.name, ownReg?.name].filter(Boolean).map(norm));
  const me = norm(viewer?.username);

  scoped.activeStudents = active.map((s) => (s && ownIds.has(norm(s.id)) ? s : pick(s, PUBLIC_STUDENT_FIELDS)));
  scoped.registeredStudents = viewer
    ? registered
        .filter((r) => r && (ownIds.has(norm(r.id)) || norm(r.referrer)))
        .map((r) => (ownIds.has(norm(r.id)) ? r : pick(r, PUBLIC_REGISTRATION_FIELDS)))
    : [];

  const staffOnly = !viewer;
  scoped.users = users
    .filter((u) => u && (!staffOnly || STAFF_ROLES.includes(u.role)))
    .map((u) => (me && norm(u.username) === me ? u : pick(u, PUBLIC_USER_FIELDS)));
  if (scoped.unfilteredUsers) scoped.unfilteredUsers = undefined;

  // Bills linked by student id; old bills by name (src/lib/paymentOwner.ts).
  scoped.payments = viewer
    ? (payload.payments || []).filter((p: any) => p && (p.studentId ? ownIds.has(norm(p.studentId)) : ownNames.has(norm(p.studentName))))
    : [];
  scoped.attendance = viewer ? (payload.attendance || []).filter((a: any) => a && ownIds.has(norm(a.studentId))) : [];
  scoped.chapterAssessments = viewer
    ? (payload.chapterAssessments || []).map((c: any) => {
        if (!c || ownIds.has(norm(c.studentId))) return c;
        const copy = { ...c };
        for (const k of ASSESSMENT_ANSWER_FIELDS) delete copy[k];
        return copy;
      })
    : [];

  // Answer keys only for quizzes this student already submitted (for the review).
  const submittedQuizIds = new Set<string>();
  for (const c of scoped.chapterAssessments as any[]) {
    if (c && ownIds.has(norm(c.studentId))) {
      for (const d of c.details?.quizDetails || []) if (d?.quizId) submittedQuizIds.add(d.quizId);
    }
  }
  scoped.lmsQuizzes = (payload.lmsQuizzes || []).map((q: any) => {
    if (!q || submittedQuizIds.has(q.id)) return q;
    const copy = { ...q };
    for (const k of QUIZ_ANSWER_KEY_FIELDS) delete copy[k];
    return copy;
  });

  if (!viewer) {
    scoped.messages = [];
  } else {
    const usernames = new Set(users.map((u) => norm(u?.username)).filter(Boolean));
    scoped.messages = (payload.messages || []).filter((m: any) => {
      if (!m) return false;
      const from = norm(m.senderId);
      const to = norm(m.receiverId);
      if (from === me || to === me) return true;
      // Direct messages between two other people stay private; group chats remain.
      return !(usernames.has(from) && usernames.has(to));
    });
  }

  return scoped;
}
