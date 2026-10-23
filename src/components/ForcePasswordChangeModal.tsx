import React, { useState } from "react";
import { KeyRound, LogOut, Eye, EyeOff } from "lucide-react";
import { validateNewPassword } from "../lib/loginPolicy";
import { setMustChangePassword, setSessionToken } from "../lib/sessionToken";

interface ForcePasswordChangeModalProps {
  user: { username: string; name?: string; role?: string };
  onChanged: (user: any) => void;
  onLogout: () => void;
}

// Security stage 1 (23-10-2026): an account that logged in with a default
// password (123456, adminadmin, admin123, or none) must choose its own
// password before continuing. Cannot be dismissed - only "Keluar".
export default function ForcePasswordChangeModal({ user, onChanged, onLogout }: ForcePasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const problem = validateNewPassword(newPassword, user.username);
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Gagal mengganti kata sandi. Coba lagi.");
        return;
      }
      if (data.token) setSessionToken(data.token);
      setMustChangePassword(false);
      onChanged(data.user);
    } catch (err) {
      setError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 text-left">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-black text-slate-900 text-lg leading-tight">Ganti Kata Sandi Dulu</h2>
            <p className="text-xs text-slate-500">
              Akun <strong>{user.name || user.username}</strong> masih memakai kata sandi bawaan. Demi keamanan, buat kata sandi baru sebelum melanjutkan.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Kata sandi baru</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-indigo-400"
              placeholder="Minimal 8 karakter"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Ulangi kata sandi baru</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <p className="text-[11px] text-slate-400">Jangan pakai 123456, nama, atau username Anda.</p>
        </div>

        {error && <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-black cursor-pointer"
          >
            {isSaving ? "Menyimpan..." : "Simpan Kata Sandi"}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </form>
    </div>
  );
}
