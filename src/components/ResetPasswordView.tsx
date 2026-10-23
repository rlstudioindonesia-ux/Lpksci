import React, { useState, useEffect } from "react";
import { Key, ShieldAlert, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import { validateNewPassword } from "../lib/loginPolicy";
import { isPasswordResetLink, getStoredResetEmail, completePasswordResetFromLink } from "../lib/emailPasswordReset";

// Opened from the emailed reset link (23-10-2026, owner: reset by email).
// The link proves the mailbox; the server then stores the new password.
export default function ResetPasswordView() {
  const [isValidLink, setIsValidLink] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const href = window.location.href;
    if (isPasswordResetLink(href)) {
      setIsValidLink(true);
      setEmail(getStoredResetEmail());
    } else {
      setStatus("error");
      setMessage("Tautan reset tidak valid atau sudah tidak berlaku. Silakan minta tautan baru lewat menu \"Lupa Password\".");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidLink) return;

    if (!email.trim()) {
      setStatus("error");
      setMessage("Masukkan email yang menerima tautan ini.");
      return;
    }
    const problem = validateNewPassword(newPassword);
    if (problem) {
      setStatus("error");
      setMessage(problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setStatus("loading");
    setMessage("");
    const result = await completePasswordResetFromLink(email, window.location.href, newPassword);
    setStatus(result.ok ? "success" : "error");
    setMessage(result.message);
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900 font-display">Berhasil!</h2>
            <p className="text-sm text-slate-600">{message}</p>
          </div>
          <button
            onClick={() => (window.location.href = "/login")}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl transition shadow-sm"
          >
            Ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  const disabled = status === "loading" || !isValidLink;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="space-y-2">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Kembali ke Utama
          </button>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">Buat Kata Sandi Baru</h2>
          <p className="text-sm text-slate-600">Masukkan kata sandi baru untuk akun LPK SCI Anda.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs flex gap-3 ${status === "error" ? "bg-rose-50 text-rose-800 border border-rose-100" : "bg-blue-50 text-blue-800 border border-blue-100"}`}>
            <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${status === "error" ? "text-rose-600" : "text-blue-600"}`} />
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email penerima tautan</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="nama@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Kata Sandi Baru</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={disabled}
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Minimal 8 karakter"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Konfirmasi Kata Sandi</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={disabled}
                autoComplete="new-password"
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ketik ulang kata sandi baru"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 text-sm rounded-xl transition shadow-sm mt-2"
          >
            {status === "loading" ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
