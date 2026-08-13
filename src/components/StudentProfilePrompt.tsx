import React, { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Calendar, ShieldAlert, Eye, EyeOff, UserCheck, CheckCircle2 } from "lucide-react";
import { UserAccount, SystemState } from "../types";

interface StudentProfilePromptProps {
  user: UserAccount;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  onClose: () => void;
  isDefaultPasswordPrompt?: boolean;
}

export default function StudentProfilePrompt({
  user,
  systemState,
  onUpdateState,
  onClose,
  isDefaultPasswordPrompt = false,
}: StudentProfilePromptProps) {
  // Check student record in activeStudents / registeredStudents / user
  const studentRecord =
    systemState?.activeStudents?.find(
      (s) =>
        (user.studentId && s.id === user.studentId) ||
        (user.username && s.id === user.username) ||
        (user.name && s.name?.toLowerCase() === user.name?.toLowerCase()) ||
        (user.email && s.email?.toLowerCase() === user.email?.toLowerCase())
    ) ||
    systemState?.registeredStudents?.find(
      (r) =>
        (user.studentId && r.id === user.studentId) ||
        (user.username && r.id === user.username) ||
        (user.name && r.name?.toLowerCase() === user.name?.toLowerCase()) ||
        (user.email && r.email?.toLowerCase() === user.email?.toLowerCase())
    );

  const existingBirthDate =
    studentRecord?.birthDate ||
    (studentRecord as any)?.tanggalLahir ||
    (studentRecord as any)?.tglLahir ||
    user?.birthDate ||
    "";

  const isMissingBirthDate = !existingBirthDate || existingBirthDate === "-" || existingBirthDate.trim() === "";

  const [birthDate, setBirthDate] = useState(existingBirthDate !== "-" ? existingBirthDate : "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Save suppression preference if checkbox is checked
  const handleSuppress = () => {
    if (dontShowAgain && typeof window !== "undefined") {
      try {
        localStorage.setItem(`suppress_student_profile_prompt_${user.username}`, "true");
      } catch (e) {
        console.error("Failed to save prompt suppression state", e);
      }
    }
  };

  const handleDismiss = () => {
    handleSuppress();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const isChangingPassword = isDefaultPasswordPrompt || newPassword.trim().length > 0;

    if (isChangingPassword) {
      if (newPassword.trim().length < 6) {
        setError("Kata sandi baru minimal 6 karakter.");
        return;
      }
      if (newPassword.trim() === "123456") {
        setError("Gunakan kata sandi baru yang berbeda dari kata sandi bawaan (123456).");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }

    if (isMissingBirthDate && !birthDate) {
      setError("Silakan isi tanggal lahir Anda.");
      return;
    }

    setIsSaving(true);

    try {
      let success = true;

      // 1. Update user account
      const userPayload: any = { username: user.username };
      if (isChangingPassword) {
        userPayload.password = newPassword.trim();
      }
      if (birthDate) {
        userPayload.birthDate = birthDate;
      }

      const userSuccess = await onUpdateState("users", "edit", userPayload);
      if (!userSuccess) success = false;

      // 2. Update activeStudent or registeredStudent if found
      if (birthDate && studentRecord) {
        if (systemState?.activeStudents?.some((s) => s.id === studentRecord.id)) {
          await onUpdateState("activeStudents", "update", {
            id: studentRecord.id,
            birthDate: birthDate,
          });
        } else if (systemState?.registeredStudents?.some((r) => r.id === studentRecord.id)) {
          await onUpdateState("registeredStudents", "edit", {
            id: studentRecord.id,
            birthDate: birthDate,
          });
        }
      }

      setIsSaving(false);

      if (success) {
        handleSuppress();
        onClose();
      } else {
        setError("Gagal memperbarui data profil. Silakan coba lagi.");
      }
    } catch (err) {
      setIsSaving(false);
      setError("Terjadi kesalahan saat menyimpan data.");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleDismiss} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200 overflow-hidden text-left font-sans">
        {/* Header Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-amber-500 to-rose-500" />

        <div className="p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 bg-amber-50 text-amber-600 border border-amber-200/60 shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-display font-bold text-slate-900 mb-1">
              Lengkapi Profil & Amankan Akun
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Halo <span className="font-bold text-slate-800">{user.name || user.username}</span>, ada beberapa informasi akun yang perlu diperbarui agar layanan belajar & administrasi Anda lancar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Notice 1: Missing Birth Date */}
            {isMissingBirthDate && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Tanggal Lahir Belum Diisi</h4>
                    <p className="text-[11px] text-amber-700/90 leading-normal mt-0.5">
                      Tanggal lahir Anda belum terdaftar. Mohon lengkapi untuk kemudahan data administrasi & monitoring belajar.
                    </p>
                  </div>
                </div>
                <div className="pt-1">
                  <label className="block text-[10px] font-black text-amber-900 uppercase mb-1">
                    Tanggal Lahir Anda <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full text-xs p-3 border border-amber-300 rounded-xl outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-200 bg-white font-medium text-slate-800"
                    required={isMissingBirthDate}
                  />
                </div>
              </div>
            )}

            {/* Notice 2: Default Password */}
            {isDefaultPasswordPrompt && (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900">Ganti Kata Sandi Default</h4>
                    <p className="text-[11px] text-indigo-700/90 leading-normal mt-0.5">
                      Akun Anda masih menggunakan kata sandi default (<span className="font-mono bg-indigo-100 px-1 rounded text-indigo-900">123456</span>). Buat kata sandi baru agar akun lebih aman.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-950 uppercase mb-1">
                      Kata Sandi Baru <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full text-xs p-3 border border-indigo-200 rounded-xl outline-none focus:border-indigo-600 bg-white pr-10"
                        required={isDefaultPasswordPrompt}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-indigo-950 uppercase mb-1">
                      Konfirmasi Kata Sandi Baru <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full text-xs p-3 border border-indigo-200 rounded-xl outline-none focus:border-indigo-600 bg-white"
                      required={isDefaultPasswordPrompt}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Checkbox: Jangan tampilkan lagi di login berikutnya */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer group select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 group-hover:text-slate-900 leading-snug">
                  Jangan tampilkan peringatan ini lagi saat login berikutnya
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all text-xs cursor-pointer order-2 sm:order-1"
              >
                Nanti Saja
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-indigo-600/20 text-xs disabled:opacity-60 cursor-pointer order-1 sm:order-2 flex items-center justify-center gap-2"
              >
                {isSaving ? "Menyimpan..." : "Simpan & Perbarui"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
