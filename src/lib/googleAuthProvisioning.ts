export type ProvisionedRole = "VVIP" | "Pengajar" | "Admin" | "Alumni" | "Siswa";

export interface GoogleProvisionedRole {
  role: ProvisionedRole;
  studentId?: string;
  assignedClass?: string;
}

// Editing who gets VVIP/Pengajar/Admin access on first Google sign-in only
// requires touching this one list - every login surface (desktop modal,
// inline panel, mobile beranda) resolves the new user's role through
// resolveGoogleSignupRole below instead of keeping its own copy.
const VVIP_EMAILS = ["linggadhani79@gmail.com", "ekaichiro@gmail.com", "rlstudioindonesia@gmail.com"];
const PENGAJAR_EMAILS = [
  "linggabusiness7@gmail.com",
  "sulisindonesia@gmail.com",
  "fahmikusuma81@gmail.com",
  "fahmikusuma003@gmail.com",
  "faisaltkjmadiun@gmail.com",
  "linggadhani95@gmail.com",
];
const ADMIN_EMAIL_ALLOWLIST = ["sakti.wardana@lpksc.id"];

/**
 * Determines the role (and, for students, the linked studentId/class) a
 * brand-new Google-sign-in user should be provisioned with. `email` must
 * already be trimmed/lowercased by the caller. `activeMatch`/`regMatch` are
 * the caller's own lookups into activeStudents/registeredStudents by email
 * - passed in rather than looked up here since each call site already has
 * systemState in scope.
 */
export function resolveGoogleSignupRole(
  email: string,
  activeMatch: { id: string; class?: string; status?: string; kategoriPendaftaran?: string } | null | undefined,
  regMatch: { id: string } | null | undefined,
): GoogleProvisionedRole {
  if (VVIP_EMAILS.includes(email)) return { role: "VVIP" };
  if (PENGAJAR_EMAILS.includes(email)) return { role: "Pengajar" };
  if (email.includes("admin") || ADMIN_EMAIL_ALLOWLIST.includes(email)) return { role: "Admin" };
  if (activeMatch) {
    const role: ProvisionedRole =
      activeMatch.status === "Lulus" || activeMatch.status === "Di Jepang" || activeMatch.kategoriPendaftaran === "Alumni"
        ? "Alumni"
        : "Siswa";
    return { role, studentId: activeMatch.id, assignedClass: activeMatch.class };
  }
  if (regMatch) return { role: "Siswa", studentId: regMatch.id };
  return { role: "Siswa" };
}
