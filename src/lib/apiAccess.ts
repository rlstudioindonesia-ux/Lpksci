import { findStudentForUser } from "./recordMatching";

/**
 * Who may change what through POST /api/state/update (security stage 2,
 * owner-approved 23-10-2026).
 *
 * Until now the server accepted every change from anyone. This decides, per
 * role, whether a (dataType, action) request is allowed and strips fields a
 * non-admin must not change (a student editing their profile cannot change
 * their own status, class or role).
 *
 * The server runs this in log-only mode until AUTH_ENFORCE=1 is set together
 * with a strong SESSION_SECRET (see server.ts), so denials can be reviewed
 * first.
 */

export const ADMIN_ROLES = ["Admin", "Admin Super", "Admin Biasa", "VVIP"];

export interface AccessUser {
  username?: string;
  role?: string;
  name?: string;
  email?: string;
  studentId?: string;
}

export interface AccessContext {
  activeStudents?: any[];
  registeredStudents?: any[];
  payments?: any[];
  messages?: any[];
  lmsComments?: any[];
}

export interface AccessDecision {
  allowed: boolean;
  /** Payload to hand to the handler (fields the role may not change removed). */
  payload?: any;
  reason?: string;
}

const norm = (v: any) => String(v ?? "").trim().toLowerCase();
const allow = (payload: any): AccessDecision => ({ allowed: true, payload });
const deny = (reason: string): AccessDecision => ({ allowed: false, reason });

function without(payload: any, keys: string[]): any {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return payload;
  const copy = { ...payload };
  for (const k of keys) delete copy[k];
  return copy;
}

/** Account fields only an admin may change. */
const PRIVILEGED_USER_FIELDS = ["role", "status", "studentId", "assignedClass", "kecakapanSensei", "passwordChangedAt"];

/** Student record fields only staff may change. */
const STAFF_STUDENT_FIELDS = [
  "status", "class", "sensei", "batch", "currentChapter", "keterangan", "statusPendaftaran", "kategoriPendaftaran",
  "verifiedDocs", "fiveSScore", "ethicsScore", "mathScore", "japaneseScore", "attendanceScore", "scores",
  "mitraSO", "jobKeterangan", "paymentStatus", "paymentAmount", "referrer",
];

/** The logged-in student's own active/registration record ids. */
function ownStudentIds(user: AccessUser, ctx: AccessContext): Set<string> {
  const ids = new Set<string>();
  if (user.studentId) ids.add(norm(user.studentId));
  const act = findStudentForUser<any>(ctx.activeStudents, user);
  if (act?.id) ids.add(norm(act.id));
  const reg = findStudentForUser<any>(ctx.registeredStudents, user);
  if (reg?.id) ids.add(norm(reg.id));
  return ids;
}

function ownStudentNames(user: AccessUser, ctx: AccessContext): Set<string> {
  const names = new Set<string>();
  const act = findStudentForUser<any>(ctx.activeStudents, user);
  if (act?.name) names.add(norm(act.name));
  const reg = findStudentForUser<any>(ctx.registeredStudents, user);
  if (reg?.name) names.add(norm(reg.name));
  if (!names.size && user.name) names.add(norm(user.name));
  return names;
}

const isSelf = (user: AccessUser, username: any) => !!user.username && norm(username) === norm(user.username);

export function authorizeStateUpdate(
  user: AccessUser | null | undefined,
  dataType: string,
  actionRaw: string,
  payload: any,
  ctx: AccessContext = {},
): AccessDecision {
  const action = String(actionRaw || "").toLowerCase();
  if (!user || !user.username) return deny("Harus login.");
  const role = user.role || "";

  if (ADMIN_ROLES.includes(role)) return allow(payload);

  // Shared by every logged-in role.
  if (dataType === "logs" && action === "add") return allow(payload);
  if (dataType === "messages") {
    if (action === "send") return isSelf(user, payload?.senderId) ? allow(payload) : deny("Pesan harus atas nama sendiri.");
    if (action === "mark_read" || action === "mark_read_all") return allow(payload);
    if (action === "delete") {
      const msg = (ctx.messages || []).find((m: any) => m && m.id === payload?.id);
      return msg && isSelf(user, msg.senderId) ? allow(payload) : deny("Hanya pesan sendiri yang bisa dihapus.");
    }
    if (action === "clear_chat") return isSelf(user, payload?.myChatId) || payload?.isGroup ? allow(payload) : deny("Bukan percakapan sendiri.");
    return deny("Aksi pesan tidak dikenal.");
  }
  if (dataType === "users") {
    if ((action === "edit" || action === "updatebank" || action === "registerbiometric") && isSelf(user, payload?.username)) {
      return allow(without(payload, PRIVILEGED_USER_FIELDS));
    }
    return deny("Hanya akun sendiri yang bisa diubah.");
  }
  if (dataType === "lmsComments") {
    if (action === "add") return allow(payload);
    const c = (ctx.lmsComments || []).find((x: any) => x && x.id === payload?.id);
    if ((action === "edit" || action === "update" || action === "delete") && c && (isSelf(user, c.username) || isSelf(user, c.authorUsername) || isSelf(user, c.userId))) {
      return allow(payload);
    }
    if (role !== "Pengajar") return deny("Hanya komentar sendiri.");
  }

  if (role === "Pengajar") {
    const PENGAJAR_TYPES = ["attendance", "attendanceRecords", "chapterAssessments", "lmsLessons", "lmsQuizzes", "lmsComments", "lmsClasses"];
    if (PENGAJAR_TYPES.includes(dataType)) return allow(payload);
    if (dataType === "activeStudents" && ["update", "update_status", "edit"].includes(action)) return allow(payload);
    if (dataType === "registeredStudents" && ["update", "edit", "update_status"].includes(action)) return allow(payload);
    if (dataType === "jobOrders" && ["recommend", "remove_recommendation", "submit_applicant_documents", "approve_interest", "reject_interest"].includes(action)) {
      return allow(payload);
    }
    if (dataType === "customization") {
      // Sensei only open/close chapters and edit classes (sent as class diffs).
      const keys = Object.keys(payload || {});
      const CLASS_KEYS = ["lmsClasses", "lmsClassesDiff", "deletedLmsClassId", "renamedClass"];
      return keys.length > 0 && keys.every((k) => CLASS_KEYS.includes(k)) ? allow(payload) : deny("Pengajar hanya boleh mengubah kelas.");
    }
    // Leaves, reports and contracts are recorded by the teacher's name.
    if (dataType === "teacherLeaves" && action === "add") return allow({ ...payload, teacherName: user.name || payload?.teacherName });
    if (dataType === "teacherReports" && action === "add") return allow({ ...payload, teacherName: user.name || payload?.teacherName });
    if (dataType === "teacherContracts" && action === "sign") {
      return norm(payload?.teacherName) && norm(payload?.teacherName) === norm(user.name) ? allow(payload) : deny("Hanya kontrak sendiri.");
    }
    return deny(`Pengajar tidak boleh ${dataType}/${action}.`);
  }

  if (role === "Siswa" || role === "Alumni") {
    const myIds = ownStudentIds(user, ctx);
    const isMine = (id: any) => !!id && myIds.has(norm(id));

    if (dataType === "activeStudents" && ["update", "edit"].includes(action)) {
      return isMine(payload?.id) ? allow(without(payload, STAFF_STUDENT_FIELDS)) : deny("Hanya data siswa sendiri.");
    }
    if (dataType === "registeredStudents" && ["update", "edit"].includes(action)) {
      return isMine(payload?.id) ? allow(without(payload, STAFF_STUDENT_FIELDS)) : deny("Hanya data pendaftaran sendiri.");
    }
    if (dataType === "chapterAssessments" && ["update", "upsert"].includes(action)) {
      return isMine(payload?.studentId) ? allow(payload) : deny("Hanya nilai sendiri.");
    }
    if ((dataType === "attendance" || dataType === "attendanceRecords") && action === "add") {
      return isMine(payload?.studentId) ? allow(payload) : deny("Hanya absen sendiri.");
    }
    if (dataType === "jobOrders" && ["express_interest", "cancel_interest", "submit_applicant_documents"].includes(action)) {
      return isMine(payload?.studentId) ? allow(payload) : deny("Hanya lamaran sendiri.");
    }
    if (dataType === "payments" && action === "update_payment") {
      const pay = (ctx.payments || []).find((p: any) => p && p.id === payload?.id);
      const myNames = ownStudentNames(user, ctx);
      const ownsBill = pay && (pay.studentId ? isMine(pay.studentId) : myNames.has(norm(pay.studentName)));
      if (!ownsBill) return deny("Hanya tagihan sendiri.");
      // A student only uploads proof; Admin verifies. (The old "Midtrans" button
      // was a simulation that let students mark their own bill as paid.)
      const safe = without(payload, ["isSigned", "signatureDate", "amount", "studentName", "category"]);
      return allow({ ...safe, status: "Pending" });
    }
    return deny(`Siswa tidak boleh ${dataType}/${action}.`);
  }

  return deny("Peran tidak dikenal.");
}
