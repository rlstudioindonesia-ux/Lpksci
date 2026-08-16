import React from "react";
import { Bell, Check } from "lucide-react";
import { ConfirmForm } from "../ConfirmForm";

interface AdminInformasiSegmentProps {
  apkUpdateSaveSuccess: any;
  custApkUpdateNotes: any;
  custLatestApkVersion: any;
  custPlayStoreUrl: any;
  custRunningText: any;
  onUpdateState: any;
  runningTextSaveSuccess: any;
  setApkUpdateSaveSuccess: any;
  setCustApkUpdateNotes: any;
  setCustLatestApkVersion: any;
  setCustPlayStoreUrl: any;
  setCustRunningText: any;
  setRunningTextSaveSuccess: any;
}

export default function AdminInformasiSegment({ apkUpdateSaveSuccess, custApkUpdateNotes, custLatestApkVersion, custPlayStoreUrl, custRunningText, onUpdateState, runningTextSaveSuccess, setApkUpdateSaveSuccess, setCustApkUpdateNotes, setCustLatestApkVersion, setCustPlayStoreUrl, setCustRunningText, setRunningTextSaveSuccess }: AdminInformasiSegmentProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                    <Bell className="h-6 w-6 text-yellow-500" />
                    BROADCAST INFORMASI LPK
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Atur teks berjalan (marquee) yang akan tampil di halaman Beranda utama untuk semua pengguna.
                  </p>
                </div>
                
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 max-w-2xl">
                  <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                    Teks Berjalan (Marquee)
                  </label>
                  <textarea
                    value={custRunningText || ""}
                    onChange={(e) => setCustRunningText(e.target.value)}
                    className="w-full text-sm rounded-xl border border-slate-200 p-4 outline-none focus:border-indigo-500 transition min-h-[120px] bg-white shadow-inner text-slate-800"
                    placeholder="Masukkan info terkini yang akan berjalan di layar utama..."
                  />
                  <div className="text-xs text-slate-500 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-lg">💡</span> 
                      Gunakan simbol | (garis vertikal) untuk memisahkan pengumuman.
                    </div>
                    
                    <ConfirmForm
                      confirmTitle="Simpan Teks Berjalan"
                      confirmMessage="Menerapkan teks berjalan baru ini ke beranda publik secara instan?"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await onUpdateState("customization", "update", {
                          runningText: custRunningText
                        });
                        if (ok) {
                          setRunningTextSaveSuccess(true);
                          setTimeout(() => setRunningTextSaveSuccess(false), 3000);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="h-4 w-4" /> 
                        {runningTextSaveSuccess ? "Berhasil Disimpan!" : "Simpan Teks Berjalan"}
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
    
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 max-w-2xl">
                  <div>
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block mb-1">
                      Notifikasi Update Aplikasi Android (APK)
                    </label>
                    <p className="text-xs text-slate-500">
                      Setiap kali Anda upload versi APK baru ke Play Store, isi nomor versi terbaru di sini lalu simpan.
                      Pengguna yang membuka aplikasi lewat APK (bukan browser biasa) akan melihat banner pengingat untuk
                      update, dengan tombol langsung ke Play Store. Banner otomatis hilang sendiri untuk pengguna yang
                      sudah update / menekan "Nanti Saja", sampai Anda menaikkan lagi nomor versi ini.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                        Versi Terbaru di Play Store
                      </label>
                      <input
                        type="text"
                        value={custLatestApkVersion}
                        onChange={(e) => setCustLatestApkVersion(e.target.value)}
                        placeholder="Contoh: 1.2.0"
                        className="w-full text-sm rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500 transition bg-white shadow-inner text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                        Link Play Store
                      </label>
                      <input
                        type="text"
                        value={custPlayStoreUrl}
                        onChange={(e) => setCustPlayStoreUrl(e.target.value)}
                        placeholder="https://play.google.com/store/apps/details?id=..."
                        className="w-full text-sm rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500 transition bg-white shadow-inner text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                      Catatan Update (opsional)
                    </label>
                    <input
                      type="text"
                      value={custApkUpdateNotes}
                      onChange={(e) => setCustApkUpdateNotes(e.target.value)}
                      placeholder="Contoh: Perbaikan bug chat & tampilan kelas alumni"
                      className="w-full text-sm rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500 transition bg-white shadow-inner text-slate-800"
                    />
                  </div>
                  <div className="flex justify-end">
                    <ConfirmForm
                      confirmTitle="Simpan Info Update APK"
                      confirmMessage="Menerapkan versi APK terbaru ini? Pengguna aplikasi Android akan mulai melihat banner pengingat update."
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const ok = await onUpdateState("customization", "update", {
                          latestApkVersion: custLatestApkVersion.trim(),
                          apkUpdateNotes: custApkUpdateNotes.trim(),
                          playStoreUrl: custPlayStoreUrl.trim(),
                        });
                        if (ok) {
                          setApkUpdateSaveSuccess(true);
                          setTimeout(() => setApkUpdateSaveSuccess(false), 3000);
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="h-4 w-4" />
                        {apkUpdateSaveSuccess ? "Berhasil Disimpan!" : "Simpan Info Update APK"}
                      </button>
                    </ConfirmForm>
                  </div>
                </div>
              </div>
  );
}
