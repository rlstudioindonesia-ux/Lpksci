import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { auth } from "../firebaseClient";

/**
 * "Lupa kata sandi" by email (owner's choice, 23-10-2026).
 *
 * The old flow sent a Firebase *password reset* email, but that only changed
 * the Firebase Auth password - the app checks its own password store, so the
 * new password never worked. Now Firebase only DELIVERS a sign-in link (free,
 * no mail server needed). Opening it proves the person owns the mailbox; the
 * browser sends the resulting verified ID token to /api/auth/reset-with-email
 * and the SERVER stores the new app password.
 *
 * Requires "Email link (passwordless sign-in)" enabled in Firebase Console ->
 * Authentication -> Sign-in method -> Email/Password.
 */

const RESET_EMAIL_KEY = "lpk_reset_email";

/** Resolves what the user typed (email or username) to the email to send to. */
export function resolveResetEmail(input: string, users: any[] | null | undefined): string | null {
  const v = String(input || "").trim().toLowerCase();
  if (!v) return null;
  if (v.includes("@")) return v;
  const user = (users || []).find((u: any) => u && String(u.username || "").trim().toLowerCase() === v);
  const email = String(user?.email || "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export async function sendPasswordResetLink(email: string): Promise<{ ok: boolean; message: string }> {
  try {
    await sendSignInLinkToEmail(auth, email, {
      url: `${window.location.origin}/reset-password?mode=email`,
      handleCodeInApp: true,
    });
    try {
      localStorage.setItem(RESET_EMAIL_KEY, email);
    } catch (e) {}
    return {
      ok: true,
      message: `Tautan untuk membuat kata sandi baru sudah dikirim ke ${email}. Buka email tersebut (periksa juga folder Spam) dan klik tautannya dari perangkat ini.`,
    };
  } catch (err: any) {
    if (err?.code === "auth/operation-not-allowed") {
      return { ok: false, message: "Reset lewat email belum diaktifkan oleh pengelola. Silakan hubungi Admin LPK SCI." };
    }
    if (err?.code === "auth/invalid-email") {
      return { ok: false, message: "Format email tidak valid." };
    }
    return { ok: false, message: "Gagal mengirim email reset. Coba lagi beberapa saat lagi." };
  }
}

/** Shared handler for the three "Lupa Password" forms. */
export async function requestPasswordResetByEmail(input: string, users: any[] | null | undefined): Promise<{ ok: boolean; message: string }> {
  const email = resolveResetEmail(input, users);
  if (!email) {
    return { ok: false, message: "Masukkan email yang terdaftar di akun Anda (username ini tidak memiliki email)." };
  }
  return sendPasswordResetLink(email);
}

export function isPasswordResetLink(href: string): boolean {
  try {
    return isSignInWithEmailLink(auth, href);
  } catch (e) {
    return false;
  }
}

export function getStoredResetEmail(): string {
  try {
    return localStorage.getItem(RESET_EMAIL_KEY) || "";
  } catch (e) {
    return "";
  }
}

/** Completes the email link and asks the server to store the new password. */
export async function completePasswordResetFromLink(
  email: string,
  href: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string; data?: any }> {
  let idToken = "";
  try {
    const result = await signInWithEmailLink(auth, email.trim().toLowerCase(), href);
    idToken = await result.user.getIdToken();
  } catch (err: any) {
    if (err?.code === "auth/invalid-action-code" || err?.code === "auth/expired-action-code") {
      return { ok: false, message: "Tautan sudah kedaluwarsa atau sudah dipakai. Silakan minta tautan baru." };
    }
    if (err?.code === "auth/invalid-email") {
      return { ok: false, message: "Email tidak cocok dengan tautan. Masukkan email yang menerima tautan ini." };
    }
    return { ok: false, message: "Tautan tidak dapat diverifikasi. Silakan minta tautan baru." };
  }
  try {
    const res = await fetch("/api/auth/reset-with-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, newPassword }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      return { ok: false, message: data?.error || "Gagal menyimpan kata sandi baru." };
    }
    try {
      localStorage.removeItem(RESET_EMAIL_KEY);
    } catch (e) {}
    return { ok: true, message: "Kata sandi berhasil diganti. Silakan login dengan kata sandi baru.", data };
  } catch (e) {
    return { ok: false, message: "Gagal terhubung ke server. Periksa koneksi internet Anda." };
  }
}
