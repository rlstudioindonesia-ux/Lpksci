/**
 * Login & password rules (security stage 1, owner-approved 23-10-2026).
 *
 * Before: "123456" and "adminadmin" opened ANY account, and the admin/VVIP
 * accounts also accepted "admin123", even after their owner chose a real
 * password. Now a default password only works for an account that has never
 * set its own password (no `passwordChangedAt`), and such a login must change
 * the password right away. Once changed, only the real password works.
 */

export const DEFAULT_PASSWORDS = ["123456", "adminadmin", "admin123"];

export const STAFF_ROLES = ["Pengajar", "VVIP", "Admin", "Admin Super", "Admin Biasa"];

export const isDefaultPasswordValue = (plain: unknown) => DEFAULT_PASSWORDS.includes(String(plain ?? "").trim());

export interface PasswordLoginInput {
  plain: string;
  /** Stored hash/legacy plaintext of the account (may be empty). */
  stored: unknown;
  /** Set when the account owner picked their own password via the new flow. */
  passwordChangedAt?: string | null;
  /** verifyPassword from server/auth-utils (injected so this stays testable in the browser bundle). */
  verify: (plain: string, stored: unknown) => boolean;
}

export interface PasswordLoginResult {
  valid: boolean;
  mustChangePassword: boolean;
}

export function evaluatePasswordLogin(input: PasswordLoginInput): PasswordLoginResult {
  const plain = String(input.plain ?? "").trim();
  if (!plain) return { valid: false, mustChangePassword: false };

  const hasStored = typeof input.stored === "string" && input.stored.length > 0;
  const matchesStored = hasStored && input.verify(plain, input.stored);
  const isDefault = isDefaultPasswordValue(plain);
  const neverChanged = !input.passwordChangedAt;

  if (matchesStored) {
    // The stored password may itself still be a default one.
    return { valid: true, mustChangePassword: isDefault };
  }
  // Legacy: accounts without a password, or that never chose one, could log in
  // with a default password. Allowed one more time, but it must be changed.
  if (neverChanged && (isDefault || !hasStored)) {
    return { valid: true, mustChangePassword: true };
  }
  return { valid: false, mustChangePassword: false };
}

/** Returns an error message (Bahasa Indonesia) or null when the new password is acceptable. */
export function validateNewPassword(newPassword: unknown, username?: string | null): string | null {
  const pw = String(newPassword ?? "");
  if (pw.trim().length < 8) return "Kata sandi baru minimal 8 karakter.";
  if (isDefaultPasswordValue(pw)) return "Kata sandi bawaan tidak boleh dipakai lagi.";
  if (username && pw.trim().toLowerCase() === String(username).trim().toLowerCase()) {
    return "Kata sandi tidak boleh sama dengan username.";
  }
  if (/^(\d)\1+$/.test(pw.trim()) || ["12345678", "password", "qwertyui", "87654321"].includes(pw.trim().toLowerCase())) {
    return "Kata sandi terlalu mudah ditebak.";
  }
  return null;
}
