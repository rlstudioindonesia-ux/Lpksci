import React, { useState, useEffect } from "react";
import { Key, ShieldAlert, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordView() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setStatus("error");
      setMessage("Token reset tidak valid atau tidak ditemukan di URL.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("Password minimal 6 karakter.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setStatus("success");
        setMessage("Password Anda berhasil diubah. Silakan kembali ke halaman utama untuk login.");
      } else {
        setStatus("error");
        setMessage(data.error || "Gagal mengubah password.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Terjadi kesalahan pada sistem.");
    }
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
            onClick={() => window.location.href = "/"}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl transition shadow-sm"
          >
            Ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
        <div className="space-y-2">
          <button 
            onClick={() => window.location.href = "/"}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Kembali ke Utama
          </button>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display">Buat Password Baru</h2>
          <p className="text-sm text-slate-600">
            Silakan masukkan password baru untuk akun Anda.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-xs flex gap-3 ${status === "error" ? "bg-rose-50 text-rose-800 border border-rose-100" : "bg-blue-50 text-blue-800 border border-blue-100"}`}>
            <ShieldAlert className={`w-5 h-5 flex-shrink-0 ${status === "error" ? "text-rose-600" : "text-blue-600"}`} />
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password Baru</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={status === "loading" || !token}
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Minimal 6 karakter"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Konfirmasi Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={status === "loading" || !token}
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Ketik ulang password baru"
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={status === "loading" || !token}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 text-sm rounded-xl transition shadow-sm mt-2"
          >
            {status === "loading" ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
