import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Smartphone,
  Share2,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  X,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Bell,
  Camera,
  Layers,
  QrCode as QrCodeIcon,
  Globe,
  Chrome,
  Compass,
  ArrowRight,
  ArrowDown,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { SystemState } from "../types";

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState?: SystemState;
  deferredPrompt?: any;
  onInstallPWA?: () => void;
  isInstallable?: boolean;
}

export default function AppDownloadModal({
  isOpen,
  onClose,
  systemState,
  deferredPrompt,
  onInstallPWA,
  isInstallable = false,
}: AppDownloadModalProps) {
  const [activePlatform, setActivePlatform] = useState<"android" | "ios">("android");
  const [isCopied, setIsCopied] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  const logoUrl = systemState?.customization?.logoUrl || "/logo.png";
  const logoText = systemState?.customization?.logoText || "LPK SCI";

  // Auto detect user OS
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        setActivePlatform("ios");
      } else {
        setActivePlatform("android");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://lpksci.com";

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleInstallClick = async () => {
    setHasPrompted(true);
    if (deferredPrompt && onInstallPWA) {
      onInstallPWA();
    } else if (onInstallPWA) {
      onInstallPWA();
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=0f172a&margin=4`;

  return createPortal(
    <div className="fixed inset-0 z-[99999999] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto overflow-x-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden text-left font-sans flex flex-col max-h-[90vh]">
        {/* Mobile drag handle indicator */}
        <div className="sm:hidden w-full flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Top Accent Gradient */}
        <div className="hidden sm:block h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600" />

        {/* Header */}
        <div className="px-5 pt-3 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-md p-1 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={logoUrl}
                alt={logoText}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as any).src = "/logo.png";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {logoText} Mobile App
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
                  Web APK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pasang langsung ke Layar Utama HP Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        {/* OS Platform Switcher */}
        <div className="px-5 pt-4 pb-2 bg-slate-50">
          <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setActivePlatform("android")}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatform === "android"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Chrome size={16} className="text-emerald-600" />
              <span>Android (Chrome)</span>
            </button>

            <button
              onClick={() => setActivePlatform("ios")}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatform === "ios"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass size={16} className="text-indigo-600" />
              <span>iPhone (iOS Safari)</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs leading-relaxed">
          {/* ANDROID SECTION */}
          {activePlatform === "android" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* 1-Click Install Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                      Instalasi Otomatis Chrome (Mirip AI Studio)
                    </h4>
                    <p className="text-[11.5px] text-emerald-800/90 mt-0.5 font-medium leading-normal">
                      Tanpa download file APK manual. Cukup klik tombol di bawah untuk memunculkan pop-up instalasi resmi dari Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Zap size={18} className="fill-current" />
                    <span>Pasang Aplikasi Sekarang (1-Klik)</span>
                  </button>
                </div>

                {hasPrompted && (
                  <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-[11px] font-medium flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>
                      Jendela konfirmasi instalasi Chrome telah dipicu. Ketuk <b>"Instal"</b> pada pop-up layar Anda.
                    </span>
                  </div>
                )}
              </div>

              {/* Manual Steps for Android */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Info size={14} className="text-slate-600" />
                  <span>Jika Pop-up Otomatis Belum Muncul:</span>
                </h5>

                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <p className="text-[11.5px] text-slate-700">
                      Ketuk ikon <span className="font-bold text-slate-900">Titik Tiga (⋮)</span> di pojok kanan atas Chrome.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <p className="text-[11.5px] text-slate-700">
                      Pilih menu <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">"Instal aplikasi"</span> atau <span className="font-bold text-slate-800">"Tambahkan ke Layar Utama"</span>.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-[11.5px] text-slate-700">
                      Ketuk <span className="font-bold text-slate-900">Instal</span>. Ikon {logoText} akan terpasang di layar utama HP Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IOS SECTION */}
          {activePlatform === "ios" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* iOS Hero Card */}
              <div className="bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                      Instalasi di iPhone & iPad (iOS Safari)
                    </h4>
                    <p className="text-[11.5px] text-indigo-800/90 mt-0.5 font-medium leading-normal">
                      iOS Apple mendukung instalasi aplikasi web resmi ke Layar Utama melalui browser Safari tanpa butuh App Store.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {isCopied ? <Check size={15} /> : <Copy size={15} />}
                    <span>{isCopied ? "Tautan Tersalin!" : "Salin Tautan (Buka di Safari)"}</span>
                  </button>
                </div>
              </div>

              {/* Visual Safari Guide */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h5 className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Compass size={14} className="text-indigo-600" />
                  <span>3 Langkah Pasang di Safari iPhone:</span>
                </h5>

                <div className="space-y-2.5">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Ketuk Tombol Bagikan</span>
                        <span className="inline-flex items-center justify-center p-1 bg-slate-100 rounded text-slate-700 border border-slate-200">
                          <Share2 size={13} />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Ikon kotak berpanah ke atas di bilah navigasi bawah Safari iPhone.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span>Pilih "Tambah ke Layar Utama"</span>
                        <span className="inline-flex items-center justify-center p-1 bg-slate-100 rounded text-slate-700 border border-slate-200">
                          <PlusSquare size={13} />
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Gulir menu ke bawah hingga opsi <b>Add to Home Screen</b>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200/60 shadow-xs">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="font-bold text-emerald-800 text-xs">
                        Ketuk "Tambah" (Add) di Kanan Atas
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Aplikasi {logoText} langsung muncul sebagai ikon di Layar Utama iPhone!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Animated visual pointer for iOS Safari */}
                <div className="p-3 bg-indigo-900/90 text-white rounded-xl flex items-center justify-between gap-2 text-center mt-2">
                  <span className="text-[11px] font-bold">
                    👇 Ketuk tombol Share di bilah bawah Safari sekarang
                  </span>
                  <ArrowDown size={16} className="animate-bounce shrink-0 text-amber-300" />
                </div>
              </div>
            </div>
          )}

          {/* QR Code Scan section */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
              <img
                src={qrCodeUrl}
                alt="QR Code Install Mobile App"
                className="w-20 h-20 object-contain"
              />
            </div>
            <div className="text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-md">
                <QrCodeIcon size={12} />
                <span>Buka Cepat via Kamera HP</span>
              </div>
              <h5 className="text-xs font-bold text-white leading-tight">
                Scan Barcode untuk Buka & Pasang di HP
              </h5>
              <p className="text-[10.5px] text-slate-300">
                Arahkan kamera smartphone ke kode QR untuk membuka langsung di peramban Chrome atau Safari HP Anda.
              </p>
            </div>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <ShieldCheck size={16} className="text-indigo-600 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800">Aman & Terverifikasi</div>
              <div className="text-[9px] text-slate-500">Tanpa APK Berbahaya</div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <Camera size={16} className="text-emerald-600 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800">Presensi Wajah</div>
              <div className="text-[9px] text-slate-500">Kamera & GPS Presisi</div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <Bell size={16} className="text-amber-600 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800">Notifikasi Cepat</div>
              <div className="text-[9px] text-slate-500">Jadwal & Lowongan</div>
            </div>

            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/60 text-center">
              <Layers size={16} className="text-sky-600 mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-800">Sangat Ringan</div>
              <div className="text-[9px] text-slate-500">Ukuran &lt; 2 MB</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">
            LPK Source Course Indonesia • Web App
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
