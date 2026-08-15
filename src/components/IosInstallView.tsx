import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  ArrowLeft,
  QrCode as QrCodeIcon,
  Compass,
  Layers,
  Info,
  Apple,
  AlertTriangle,
  ArrowDown,
  ExternalLink,
  Lock,
  ChevronRight
} from "lucide-react";
import { SystemState } from "../types";

interface IosInstallViewProps {
  systemState?: SystemState;
  onBack: () => void;
}

export default function IosInstallView({ systemState, onBack }: IosInstallViewProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const logoUrl = systemState?.customization?.logoUrl || "/logo.png";
  const logoText = systemState?.customization?.logoText || "LPK SCI";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isApple = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(isApple);
      
      const inApp = /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|WhatsApp|TikTok/i.test(ua);
      setIsInAppBrowser(inApp);

      const isWebkitSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS|OPiOS|Snapchat/i.test(ua) && !inApp;
      setIsSafari(isWebkitSafari);

      const standalone = (window.navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
      setIsStandalone(standalone);
    }
  }, []);

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://lpksci.com";

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=ffffff&color=0f172a&margin=4`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-28 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold tracking-wide uppercase transition active:scale-95 cursor-pointer"
            id="btn-back-from-install"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <Apple className="w-3.5 h-3.5 fill-current" />
              <span>Apple iOS Web App (PWA)</span>
            </span>
          </div>
        </div>

        {/* Warning if opened inside In-App Browser (WA, IG, TikTok, etc) */}
        {isInAppBrowser && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-amber-950/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-300">
                  Anda Membuka dari In-App Browser (WhatsApp/Instagram)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apple iOS tidak mengizinkan pemasangan PWA dari dalam peramban WhatsApp/Instagram. Silakan salin tautan dan buka di <strong>Apple Safari</strong>.
                </p>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? "Tautan Disalin!" : "Salin Link untuk Safari"}</span>
            </button>
          </div>
        )}

        {/* Hero Card: AI Studio & iOS App Hub Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 text-center md:text-left">
            {/* App Icon (iOS Squircle Preview) */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] bg-white p-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.4)] border border-white/20 flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logoUrl}
                  alt={logoText}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as any).src = "/logo.png";
                  }}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-full shadow-md border-2 border-slate-900">
                <Apple className="w-3.5 h-3.5 fill-current" />
              </div>
            </div>

            {/* App Details & Title */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white uppercase font-sans">
                  {logoText}
                </h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] sm:text-xs font-black uppercase px-2.5 py-0.5 rounded-full">
                  Official Web App
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Pasang aplikasi resmi <strong>LPK Source Course Indonesia</strong> langsung ke Layar Utama iPhone atau iPad Anda melalui Apple Safari tanpa perlu melalui App Store.
              </p>

              {/* Status & Quick Action */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {isStandalone ? (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Aplikasi Sedang Berjalan dalam Mode Standalone iOS</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 text-xs font-medium">
                    <Compass className="w-4 h-4 text-indigo-400" />
                    <span>
                      {isIOS ? (isSafari ? "Browser: Apple Safari (Siap Pasang)" : "Buka link ini di browser Apple Safari") : "Panduan Pemasangan Khusus Apple iOS"}
                    </span>
                  </div>
                )}

                {/* Copy Link Button */}
                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition active:scale-95 cursor-pointer"
                  title="Salin URL Aplikasi"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Tautan Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin URL Web</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kenapa iOS Tidak Otomatis? (Explanation Box) */}
        <div className="rounded-2xl bg-indigo-950/40 border border-indigo-500/20 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
            <Lock className="w-4 h-4 text-indigo-400" />
            <span>Mengapa di iPhone / iPad Tidak Bisa Otomatis Sekali Klik?</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sesuai standar privasi dan keamanan ketat <strong>Apple WebKit (iOS)</strong>, Apple <em>tidak mengizinkan website manapun</em> untuk memaksa memasang aplikasi ke Home Screen secara otomatis tanpa izin eksplisit pengguna. Apple mewajibkan pengguna memilih <strong>Share [↑] &gt; Tambah ke Layar Utama [+]</strong> di Safari untuk mencegah situs web berbahaya memasang aplikasi tanpa persetujuan.
          </p>
        </div>

        {/* 3-Step Apple iOS Safari Installation Guide */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>3 Langkah Cepat Pasang di iPhone & iPad</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">Hanya 5 Detik</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Step 1 */}
            <div className="relative rounded-2xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black flex items-center justify-center font-mono">
                    01
                  </span>
                  <div className="p-2 rounded-xl bg-white/5 text-indigo-300 border border-white/5">
                    <Compass className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  1. Buka di Apple Safari
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pastikan Anda membuka website ini menggunakan peramban bawaan <strong>Apple Safari</strong> di iPhone atau iPad.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 text-[11px] text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Bukan Chrome/WA browser.</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl bg-slate-900/70 border border-indigo-500/40 p-5 sm:p-6 space-y-4 flex flex-col justify-between hover:border-indigo-500/60 transition shadow-lg shadow-indigo-950/40">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center font-mono shadow-md">
                    02
                  </span>
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                    <Share className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  2. Tekan Tombol Share [↑]
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ketuk ikon <strong>Bagikan (Share)</strong> berbentuk kotak dengan panah mengarah ke atas di bilah bawah layar iPhone Anda.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-center justify-center gap-2 font-bold">
                <Share className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ikon [ ↑ ] di bilah navigasi Safari</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl bg-slate-900/70 border border-white/10 p-5 sm:p-6 space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center font-mono">
                    03
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  3. Tambah ke Layar Utama [+]
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gulir ke bawah pada menu, pilih <strong>"Tambah ke Layar Utama"</strong> (<em>Add to Home Screen</em>), lalu ketuk <strong>"Tambah"</strong> di kanan atas.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center justify-center gap-2 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Selesai! Ikon muncul di Layar Utama</span>
              </div>
            </div>

          </div>
        </div>

        {/* Benefits & QR Code Scanner Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left 2 Cols: iOS PWA Perks */}
          <div className="lg:col-span-2 rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-8 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Keunggulan Menggunakan Web App iOS</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Zap className="w-4 h-4" />
                  <span>Layar Penuh (Full Screen)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bebas dari bilah navigasi dan URL Safari, memberikan ruang pandang materi belajar dan ujian yang lebih luas.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Akses Cepat 1 Ketukan</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Langsung buka LMS, kalender ujian, dan riwayat absensi dari Layar Utama ponsel tanpa mengetik alamat website.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Hemat Memori & Ringan</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tidak memakan ruang penyimpanan bergiga-giga seperti aplikasi konvensional dan tetap terbarukan otomatis.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs">
                  <Apple className="w-4 h-4 fill-current" />
                  <span>Ikon Logo Asli LPK SCI</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ikon aplikasi di layar ponsel otomatis menampilkan logo resmi beresolusi tinggi yang terverifikasi.
                </p>
              </div>

            </div>
          </div>

          {/* Right Col: QR Code for Desktop / Laptop Users */}
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 p-6 flex flex-col items-center justify-between text-center space-y-4">
            <div className="space-y-1">
              <div className="inline-flex p-2 rounded-xl bg-white/5 text-slate-300 border border-white/10 mb-1">
                <QrCodeIcon className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Buka di iPhone Sekarang
              </h4>
              <p className="text-[11px] text-slate-400">
                Pindai QR ini langsung dengan kamera iPhone atau iPad Anda
              </p>
            </div>

            {/* QR Image Box */}
            <div className="p-3 bg-white rounded-2xl shadow-xl border border-white/20">
              <img
                src={qrCodeUrl}
                alt="QR Code LPK SCI"
                className="w-36 h-36 object-contain"
              />
            </div>

            <div className="w-full pt-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tautan Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin URL Web</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Interactive Guide for iPhone Users on Safari */}
      {isIOS && !isStandalone && (
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 animate-bounce">
          <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-md">
                <Share className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black tracking-tight">Tekan tombol [ ↑ ] di bawah</p>
                <p className="text-[10px] text-slate-300">Lalu pilih "Tambah ke Layar Utama"</p>
              </div>
            </div>
            <ArrowDown className="w-5 h-5 text-indigo-400 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
