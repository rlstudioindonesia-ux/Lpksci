import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  Volume2,
  Copy,
  Check,
  Code2,
  Zap,
  Info,
  Radio,
  RefreshCw,
} from "lucide-react";
import {
  getNotificationEnvironmentStatus,
  requestNotificationPermission,
  testDeviceNotification,
} from "../lib/notifications";

interface AndroidNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidNotificationModal({ isOpen, onClose }: AndroidNotificationModalProps) {
  const [activeTab, setActiveTab] = useState<"status" | "java" | "kotlin" | "fcm">("status");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ running: boolean; message: string; success?: boolean } | null>(null);
  const [envStatus, setEnvStatus] = useState(getNotificationEnvironmentStatus());
  const [showUnblockTip, setShowUnblockTip] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const status = getNotificationEnvironmentStatus();
      setEnvStatus(status);
      setShowUnblockTip(status.permission === "denied");
      setTestResult(null);
    }
  }, [isOpen]);

  const handleCopy = (key: string, text: string) => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleRequestPermission = async () => {
    const current = getNotificationEnvironmentStatus();
    if (current.permission === "denied") {
      setShowUnblockTip(true);
      return;
    }
    const perm = await requestNotificationPermission();
    const updated = getNotificationEnvironmentStatus();
    setEnvStatus(updated);
    if (updated.permission === "granted") {
      setShowUnblockTip(false);
      handleRunTest();
    } else {
      setShowUnblockTip(true);
    }
  };

  const handleRunTest = async () => {
    setTestResult({ running: true, message: "Mengirim sinyal getar dan notifikasi langsung ke status bar / layar HP..." });
    try {
      const res = await testDeviceNotification();
      setEnvStatus(res.status);
      setTestResult({
        running: false,
        success: res.success,
        message: res.success
          ? "✅ Notifikasi berhasil dikirim! Silakan periksa status bar / layar notifikasi HP Anda."
          : "⚠️ Notifikasi terkirim, namun izin notifikasi sistem belum diizinkan di HP ini. Silakan klik tombol 'Izinkan Notifikasi'."
      });
    } catch (e: any) {
      setTestResult({
        running: false,
        success: false,
        message: `Terjadi kendala pengujian: ${e.message || e}`
      });
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-sans">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Integrasi Notifikasi HP Android (APK)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Panduan sinkronisasi notifikasi web ke status bar HP Android
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("status")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "status"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            Status & Uji Coba HP
          </button>
          <button
            onClick={() => setActiveTab("java")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "java"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Project Android (Java)
          </button>
          <button
            onClick={() => setActiveTab("kotlin")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "kotlin"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Project Android (Kotlin)
          </button>
          <button
            onClick={() => setActiveTab("fcm")}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === "fcm"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Push Saat APK Mati (FCM)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-slate-700 text-xs leading-relaxed">
          {activeTab === "status" && (
            <div className="space-y-4">
              {/* Jawaban Langsung */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs sm:text-sm">
                  <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Di Sini (Web) atau di Bagian Project Android-nya?</span>
                </div>
                <p className="text-[11.5px] text-indigo-950/80 leading-relaxed font-medium">
                  <strong>Keduanya saling terhubung:</strong> Sisi Web bertindak sebagai pemicu (trigger data jadwal & job order), 
                  sedangkan <strong>sisi Project Android (APK / Android Studio)</strong> adalah tempat yang membuat notifikasi muncul 
                  ke <em>Status Bar</em> HP, bergetar, dan berbunyi layaknya WhatsApp. WebView Android secara default memblokir notifikasi jika 
                  tidak diberi jembatan JavascriptInterface di project APK-nya.
                </p>
              </div>

              {/* Status Perangkat Saat Ini */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Status Perangkat Saat Ini
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Izin Notifikasi HP</div>
                      <div className="font-extrabold text-xs mt-0.5 text-slate-800">
                        {envStatus.permission === "granted" ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Diizinkan (Granted)
                          </span>
                        ) : envStatus.permission === "denied" ? (
                          <span className="text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Ditolak / Diblokir
                          </span>
                        ) : (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> Belum Diaktifkan
                          </span>
                        )}
                      </div>
                    </div>
                    {envStatus.permission !== "granted" && (
                      <button
                        onClick={handleRequestPermission}
                        className={`px-2.5 py-1.5 text-white rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          envStatus.permission === "denied"
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        {envStatus.permission === "denied" ? "Petunjuk Buka Blokir" : "Izinkan"}
                      </button>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Jembatan Native APK</div>
                      <div className="font-extrabold text-xs mt-0.5 text-slate-800">
                        {envStatus.isApkBridgeConnected ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Android Bridge Terhubung
                          </span>
                        ) : envStatus.isInsideApk ? (
                          <span className="text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="h-3.5 w-3.5" /> APK Terdeteksi (Bridge Belum Ditambah)
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center gap-1">
                            🌐 Mode Browser / PWA Standalone
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panduan Buka Blokir jika permission denied */}
                {(showUnblockTip || envStatus.permission === "denied") && (
                  <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 text-left space-y-2 text-[11px] text-slate-800 animate-in fade-in">
                    <div className="font-extrabold text-rose-800 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>Izin Notifikasi Diblokir di Browser HP</span>
                    </div>
                    <p className="text-[10.5px] text-slate-600 leading-relaxed">
                      Tombol izin browser tidak dapat memunculkan popup jika perizinan notifikasi dalam status diblokir. Silakan aktifkan dalam 3 langkah mudah:
                    </p>
                    <div className="bg-white rounded-xl p-2.5 border border-rose-100 space-y-1.5 text-[10.5px] text-slate-700 font-medium">
                      <div className="flex items-start gap-2">
                        <span className="h-4 w-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                        <span>Ketuk ikon <strong>Gembok 🔒</strong> di samping alamat web (URL) browser HP Anda.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-4 w-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                        <span>Pilih menu <strong>Izin (Permissions)</strong> &gt; <strong>Notifikasi</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-4 w-4 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                        <span>Ubah menjadi <strong>Izinkan (Allow)</strong>.</span>
                      </div>
                    </div>
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => {
                          const updated = getNotificationEnvironmentStatus();
                          setEnvStatus(updated);
                          if (updated.permission === "granted") {
                            setShowUnblockTip(false);
                            handleRunTest();
                          } else {
                            alert("Izin belum terdeteksi aktif. Pastikan Anda telah mengubah perizinan notifikasi menjadi 'Izinkan' di setelan browser, lalu coba lagi.");
                          }
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Periksa Ulang Izin Sekarang</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Tombol Uji Notifikasi */}
                <div className="pt-2">
                  <button
                    onClick={handleRunTest}
                    disabled={testResult?.running}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer text-xs"
                  >
                    <Bell className="h-4 w-4 animate-bounce" />
                    <span>🔔 Uji Getar & Notifikasi ke HP Sekarang</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold ${
                      testResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : "bg-amber-50 border-amber-200 text-amber-900"
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}
              </div>

              {/* Rekomendasi Langkah */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Langkah yang Harus Dilakukan di Project Android (APK):
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-600 font-medium">
                  <li>
                    <strong>Izin Android 13+ (Wajib):</strong> Tambahkan izin <code>POST_NOTIFICATIONS</code> di <code>AndroidManifest.xml</code>. Tanpa ini, Android 13/14/15 memblokir seluruh notifikasi dari APK.
                  </li>
                  <li>
                    <strong>Jembatan WebView (Wajib):</strong> Tambahkan class <code>WebAppInterface.java</code> dan pasang <code>myWebView.addJavascriptInterface(..., "Android")</code> di <code>MainActivity</code> agar website bisa memicu notifikasi native.
                  </li>
                  <li>
                    <strong>Notifikasi Saat Aplikasi Ditutup:</strong> Pasang file <code>google-services.json</code> dan Firebase Cloud Messaging (FCM) pada project Android Anda.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === "java" && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-600">
                Salin 3 blok kode berikut ke project Android Studio Anda (versi Java):
              </p>

              {/* 1. AndroidManifest.xml */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">1. AndroidManifest.xml</span>
                  <button
                    onClick={() => handleCopy("manifest", manifestXml)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md cursor-pointer"
                  >
                    {copiedKey === "manifest" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "manifest" ? "Tersalin!" : "Salin XML"}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed">
                  {manifestXml}
                </pre>
              </div>

              {/* 2. WebAppInterface.java */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">2. WebAppInterface.java (Bridge Notifikasi)</span>
                  <button
                    onClick={() => handleCopy("interface", webAppInterfaceJava)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md cursor-pointer"
                  >
                    {copiedKey === "interface" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "interface" ? "Tersalin!" : "Salin Java"}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed max-h-60">
                  {webAppInterfaceJava}
                </pre>
              </div>

              {/* 3. MainActivity.java */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">3. MainActivity.java (Setup WebView & Izin)</span>
                  <button
                    onClick={() => handleCopy("activity", mainActivityJava)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md cursor-pointer"
                  >
                    {copiedKey === "activity" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "activity" ? "Tersalin!" : "Salin Java"}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed max-h-60">
                  {mainActivityJava}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "kotlin" && (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-600">
                Jika project Android Anda menggunakan bahasa Kotlin, gunakan kode berikut:
              </p>

              {/* WebAppInterface.kt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">1. WebAppInterface.kt</span>
                  <button
                    onClick={() => handleCopy("kt_interface", webAppInterfaceKotlin)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md cursor-pointer"
                  >
                    {copiedKey === "kt_interface" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "kt_interface" ? "Tersalin!" : "Salin Kotlin"}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed max-h-60">
                  {webAppInterfaceKotlin}
                </pre>
              </div>

              {/* MainActivity.kt */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-xs">2. MainActivity.kt</span>
                  <button
                    onClick={() => handleCopy("kt_activity", mainActivityKotlin)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md cursor-pointer"
                  >
                    {copiedKey === "kt_activity" ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    {copiedKey === "kt_activity" ? "Tersalin!" : "Salin Kotlin"}
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto text-[10.5px] font-mono leading-relaxed max-h-60">
                  {mainActivityKotlin}
                </pre>
              </div>
            </div>
          )}

          {activeTab === "fcm" && (
            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="font-extrabold text-xs text-amber-900 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-600" />
                  <span>Notifikasi Saat Aplikasi Ditutup / Layar HP Mati</span>
                </div>
                <p className="text-[11px] text-amber-950/80">
                  Ketika APK ditutup oleh user atau HP masuk mode tidur (sleep/locked), OS Android mematikan proses web di dalam WebView. 
                  Agar notifikasi tetap tembus ke HP secara instan seperti WhatsApp, solusinya adalah <strong>Firebase Cloud Messaging (FCM)</strong>.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900">Langkah Menghubungkan Firebase ke APK Android:</h4>
                <ol className="list-decimal pl-4 space-y-2 text-[11px] text-slate-600">
                  <li>
                    Buka Firebase Console dengan project: <strong>gen-lang-client-0782283050</strong>
                  </li>
                  <li>
                    Tambahkan Aplikasi Android (masukkan package name APK Anda, misalnya <code>com.lpksci.app</code>).
                  </li>
                  <li>
                    Unduh file <strong><code>google-services.json</code></strong> dan letakkan di dalam folder <code>app/</code> di Android Studio Anda.
                  </li>
                  <li>
                    Tambahkan dependency di <code>app/build.gradle</code>:
                    <pre className="bg-slate-900 text-slate-200 p-2.5 rounded-lg mt-1 font-mono text-[10px]">
                      implementation 'com.google.firebase:firebase-messaging:23.4.1'
                    </pre>
                  </li>
                  <li>
                    Notifikasi push yang dikirim dari server/admin akan langsung diterima oleh Google Play Services di HP dan ditampilkan ke status bar secara native!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-3.5 px-5 flex items-center justify-between border-t border-slate-200 shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
            Dokumen lengkap tersedia di file: <code>ANDROID_NOTIFICATION_GUIDE.md</code>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const manifestXml = `<!-- Tambahkan di AndroidManifest.xml di dalam <manifest> -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- Izin Notifikasi (Wajib untuk Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />`;

const webAppInterfaceJava = `package com.lpksci.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import androidx.core.app.NotificationCompat;

public class WebAppInterface {
    private Context mContext;
    private static final String CHANNEL_ID = "lpk_sci_notifications";

    public WebAppInterface(Context c) {
        mContext = c;
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Notifikasi LPK SCI Pati",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifikasi informasi, order job, dan jadwal LPK SCI");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{100, 300, 150, 300});

            NotificationManager manager = mContext.getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @JavascriptInterface
    public void showNotification(String title, String message) {
        showNotification(title, message, "/", "notif_" + System.currentTimeMillis());
    }

    @JavascriptInterface
    public void showNotification(String title, String message, String url, String notifId) {
        Intent intent = new Intent(mContext, MainActivity.class);
        intent.putExtra("targetUrl", url);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            mContext,
            (int) System.currentTimeMillis(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(mContext, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setVibrate(new long[]{100, 300, 150, 300})
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent);

        NotificationManager manager = (NotificationManager) mContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify((int) (System.currentTimeMillis() % 100000), builder.build());
        }
    }
}`;

const mainActivityJava = `package com.lpksci.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends AppCompatActivity {
    private WebView myWebView;
    private static final int NOTIF_REQ_CODE = 101;
    // URL web app LPK SCI
    private static final String APP_URL = "https://ais-dev-p5vvbtckirqwqsbdspi4qi-757028175661.asia-southeast1.run.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 1. Minta Izin Notifikasi untuk Android 13+
        requestNotificationPermission();

        // 2. Setup WebView
        myWebView = findViewById(R.id.webview);
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);

        // 3. PASANG JAVASCRIPT INTERFACE "Android"
        myWebView.addJavascriptInterface(new WebAppInterface(this), "Android");

        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        myWebView.setWebViewClient(new WebViewClient());
        myWebView.loadUrl(APP_URL);
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) 
                != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this, 
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, 
                    NOTIF_REQ_CODE
                );
            }
        }
    }
}`;

const webAppInterfaceKotlin = `package com.lpksci.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.webkit.JavascriptInterface
import androidx.core.app.NotificationCompat

class WebAppInterface(private val context: Context) {
    private val channelId = "lpk_sci_notifications"

    init {
        createChannel()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Notifikasi LPK SCI Pati",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifikasi informasi & job LPK SCI"
                enableVibration(true)
            }
            val manager = context.getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String) {
        showNotification(title, message, "/", "notif_" + System.currentTimeMillis())
    }

    @JavascriptInterface
    fun showNotification(title: String, message: String, url: String, notifId: String) {
        val intent = Intent(context, MainActivity::class.java).apply {
            putExtra("targetUrl", url)
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            System.currentTimeMillis().toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        val builder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setAutoCancel(true)
            .setSound(soundUri)
            .setVibrate(longArrayOf(100, 300, 150, 300))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        manager?.notify(System.currentTimeMillis().toInt() % 100000, builder.build())
    }
}`;

const mainActivityKotlin = `package com.lpksci.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val appUrl = "https://ais-dev-p5vvbtckirqwqsbdspi4qi-757028175661.asia-southeast1.run.app"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        checkNotifPermission()

        webView = findViewById(R.id.webview)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
        }

        // Bridge ke Javascript Web LPK SCI
        webView.addJavascriptInterface(WebAppInterface(this), "Android")

        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread { request.grant(request.resources) }
            }
        }
        webView.webViewClient = WebViewClient()
        webView.loadUrl(appUrl)
    }

    private fun checkNotifPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }
    }
}`;
