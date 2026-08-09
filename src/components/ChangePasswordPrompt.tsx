import React, { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { UserAccount } from "../types";

interface ChangePasswordPromptProps {
  user: UserAccount;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  onClose: () => void;
}

export default function ChangePasswordPrompt({ user, onUpdateState, onClose }: ChangePasswordPromptProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.trim().length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword.trim() === "123456") {
      setError("Gunakan kata sandi baru yang berbeda dari kata sandi default.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setIsSaving(true);
    const success = await onUpdateState("users", "edit", {
      username: user.username,
      password: newPassword.trim(),
    });
    setIsSaving(false);
    if (success) {
      onClose();
    } else {
      setError("Gagal menyimpan kata sandi baru ke server. Silakan coba lagi.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-amber-50 text-amber-600">
              <KeyRound className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 mb-1.5">Amankan Akun Anda</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Akun Anda masih menggunakan kata sandi bawaan (default). Segera ganti dengan kata sandi milik Anda sendiri agar akun lebih aman.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Konfirmasi Kata Sandi</label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>

            {error && <p className="text-[11px] text-rose-600 font-semibold">{error}</p>}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all order-2 sm:order-1 text-xs cursor-pointer"
              >
                Nanti Saja
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:flex-1 px-4 py-3 bg-indigo-600 rounded-2xl text-white font-bold hover:bg-indigo-700 transition-all order-1 sm:order-2 text-xs disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? "Menyimpan..." : "Ganti Sekarang"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
