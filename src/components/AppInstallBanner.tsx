import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, Sparkles, Chrome, Compass, Zap } from "lucide-react";
import { SystemState } from "../types";

interface AppInstallBannerProps {
  systemState?: SystemState;
  onOpenDownloadModal: () => void;
  deferredPrompt?: any;
  onInstallPWA?: () => void;
}

export default function AppInstallBanner({
  systemState,
  onOpenDownloadModal,
  deferredPrompt,
  onInstallPWA,
}: AppInstallBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const logoUrl = systemState?.customization?.logoUrl || "/logo.png";
  const logoText = systemState?.customization?.logoText || "LPK SCI";

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if already running in standalone PWA or Android WebView
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      setIsStandalone(isPWA);

      const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isApple = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIOS(isApple);

      // Check if dismissed in this session
      const isDismissed = sessionStorage.getItem("dismiss_app_install_banner") === "true";

      if (!isPWA && !isDismissed) {
        // Show after 1 second delay for natural prompt feel
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("dismiss_app_install_banner", "true");
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deferredPrompt && onInstallPWA) {
      onInstallPWA();
    } else {
      onOpenDownloadModal();
    }
  };

  if (!isVisible || isStandalone) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 z-[99999] max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div
        onClick={onOpenDownloadModal}
        className="bg-slate-900/95 hover:bg-slate-900 backdrop-blur-xl text-white p-3 sm:p-3.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] border border-emerald-500/30 flex items-center justify-between gap-3 cursor-pointer group transition-all transform hover:-translate-y-0.5"
      >
        {/* App Logo */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-white p-1 shadow-md border border-slate-700 flex items-center justify-center overflow-hidden">
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
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-black ring-2 ring-slate-900">
            ✓
          </span>
        </div>

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors truncate">
              {logoText} Mobile App
            </h4>
            <span className="text-[9px] bg-emerald-500/25 text-emerald-300 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/40 uppercase">
              Web APK
            </span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
            {isIOS ? "Pasang ke Layar Utama iPhone" : "Instal di Layar Utama HP (1-Klik)"}
          </p>
        </div>

        {/* Action Button & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleActionClick}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Zap size={14} className="fill-current" />
            <span>Pasang</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
