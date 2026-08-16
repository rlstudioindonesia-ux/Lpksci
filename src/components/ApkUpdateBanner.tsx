import React, { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

const DISMISSED_VERSION_KEY = "lpksci_apk_update_dismissed_version";

// The wrapped Android APK has no way to report its own installed version to
// this web app (it's a plain WebView shell, not a native project we control
// here), so we can't detect "your APK is outdated" precisely. Instead: admin
// bumps `latestApkVersion` whenever a new build is published to Play Store,
// and every APK user sees the banner until they dismiss that exact version
// (tracked in localStorage) or the admin bumps it again.
function isAndroidWebView(): boolean {
  if (typeof navigator === "undefined") return false;
  return /wv|Android.*Version\/[0-9]/i.test(navigator.userAgent);
}

export default function ApkUpdateBanner({ customization }: { customization?: any }) {
  const latestApkVersion: string = (customization?.latestApkVersion || "").trim();
  const apkUpdateNotes: string = (customization?.apkUpdateNotes || "").trim();
  const playStoreUrl: string = (customization?.playStoreUrl || "").trim();

  const [dismissedVersion, setDismissedVersion] = useState<string>(() => {
    try {
      return localStorage.getItem(DISMISSED_VERSION_KEY) || "";
    } catch {
      return "";
    }
  });

  if (!latestApkVersion) return null;
  if (!isAndroidWebView()) return null;
  if (dismissedVersion === latestApkVersion) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_VERSION_KEY, latestApkVersion);
    } catch {
      // ignore storage errors (e.g. private mode)
    }
    setDismissedVersion(latestApkVersion);
  };

  return (
    <div
      className="fixed top-0 inset-x-0 z-[9999] bg-gradient-to-r from-indigo-700 to-indigo-900 text-white shadow-lg animate-fade-only"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="h-8 w-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <Smartphone className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold leading-tight">
            Versi baru aplikasi tersedia (v{latestApkVersion})
          </p>
          {apkUpdateNotes && (
            <p className="text-[10px] text-indigo-200 leading-tight truncate">{apkUpdateNotes}</p>
          )}
        </div>
        <a
          href={playStoreUrl || undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!playStoreUrl) e.preventDefault();
          }}
          className="flex items-center gap-1 bg-white text-indigo-800 text-[10px] font-black uppercase tracking-wide px-3 py-2 rounded-xl shrink-0 active:scale-95 transition"
        >
          <Download className="h-3 w-3" /> Update
        </a>
        <button
          onClick={dismiss}
          className="p-1.5 text-indigo-200 hover:text-white shrink-0"
          title="Nanti Saja"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
