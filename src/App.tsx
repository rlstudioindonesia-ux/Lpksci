/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth, db } from "./firebaseClient";
import { getRedirectResult } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useState, useEffect, useRef } from "react";

function useDeviceDimensions() {
  const [deviceInfo, setDeviceInfo] = useState(() => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      return {
        width,
        isMobileDevice: width < 768,
        isTablet: width >= 640 && width <= 1366,
        isLandscape,
      };
    }
    return { width: 1200, isMobileDevice: false, isTablet: false, isLandscape: false };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      setDeviceInfo({
        width,
        isMobileDevice: width < 768,
        isTablet: width >= 640 && width <= 1366,
        isLandscape,
      });
    };

    window.addEventListener("resize", handleResize);
    const mql = window.matchMedia("(orientation: landscape)");
    mql.addEventListener("change", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      mql.removeEventListener("change", handleResize);
    };
  }, []);

  return deviceInfo;
}

import Navbar from "./components/Navbar";
import RunningTextTicker from "./components/RunningTextTicker";
import { SystemState, UserAccount, RegisteredStudent } from "./types";
import {
  requestNotificationPermission,
  showOutsideApkNotification,
  sendBroadcastNotification,
  startBroadcastNotificationListener,
  markNotificationAsRead,
  stopAllNotificationChimes,
  markAllNotificationsAsRead,
  checkAndNotifyJobOrdersOnLogin,
  unlockAudio,
  BroadcastNotificationItem
} from "./lib/notifications";
import { hasStaffOversight } from "./lib/permissions";
import { findRecordIndex } from "./lib/recordMatching";
import { mergeRecentLocalItems } from "./lib/recentLocalItems";
import { diffClassList, diffShallowObject } from "./lib/classListDiff";
import {
  Bell,
  Volume2,
  VolumeX,
  ShieldAlert,
  LogIn,
  Lock,
  GraduationCap,
  Building,
  PhoneCall,
  Globe,
  BookOpen,
  Award,
  User,
  Instagram,
  Youtube,
  Facebook,
  Share2,
  Copy,
  LogOut,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import LoginModal from "./components/LoginModal";
import StudentProfilePrompt from "./components/StudentProfilePrompt";
import ApkUpdateBanner from "./components/ApkUpdateBanner";
import ResetPasswordView from "./components/ResetPasswordView";
import PembayaranSiswaView from "./components/PembayaranSiswaView";
import JobsView from "./components/JobsView";
import EksplorasiView from "./components/EksplorasiView";

function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  moduleName?: string
) {
  return React.lazy(async () => {
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastError = err;
        console.warn(`[DynamicImport] Attempt ${attempt}/${maxRetries} failed for ${moduleName || "module"}:`, err);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 400));
        }
      }
    }

    console.error(`[DynamicImport] All retry attempts failed for ${moduleName || "module"}:`, lastError);

    const FallbackComponent: React.FC<any> = () => (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 my-8 mx-auto max-w-lg bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl mb-4">
          ⚠️
        </div>
        <h3 className="text-base font-black text-slate-900 mb-1">
          Gagal Memuat Modul {moduleName ? `(${moduleName})` : ""}
        </h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Koneksi ke server sempat terputus atau modul sedang diperbarui. Silakan klik tombol di bawah untuk memuat ulang modul.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
        >
          Muat Ulang Halaman
        </button>
      </div>
    );

    return { default: FallbackComponent as unknown as T };
  });
}

const FrontendView = safeLazy(() => import("./components/FrontendView"), "Frontend");
const LmsView = safeLazy(() => import("./components/LmsView"), "LMS");
const AdminView = safeLazy(() => import("./components/AdminView"), "Admin Desk");
const VvipView = safeLazy(() => import("./components/VvipView"), "VVIP Monitoring");
const AccountSettingsView = safeLazy(() => import("./components/AccountSettingsView"), "Pengaturan Akun");
const CalendarView = safeLazy(() => import("./components/CalendarView"), "Kalender");
const ChatView = safeLazy(() => import("./components/ChatView"), "Chat");
const RegistrationView = safeLazy(() => import("./components/RegistrationView"), "Pendaftaran");
const PrivacyPolicyView = safeLazy(() => import("./components/PrivacyPolicyView"), "Kebijakan Privasi");
const AlumniDashboardView = safeLazy(() => import("./components/AlumniDashboardView"), "Dashboard Alumni");
const SenseiDashboardView = safeLazy(() => import("./components/SenseiDashboardView"), "Dashboard Sensei");
const IosInstallView = safeLazy(() => import("./components/IosInstallView"), "Panduan iOS");
// The mobile app shell is a very large component (dashboard, admin/VVIP panels,
// chat, calendar, LMS, CV editor, etc.) - lazy-loading it keeps the initial
// bundle small for every first-time mobile visitor, not just logged-in ones.
// It already renders inside a <React.Suspense> boundary at its call site below.
const MobileDashboardView = safeLazy(() => import("./components/MobileDashboardView"), "Mobile Shell");

export default function App() {
  const [activeTab, setActiveTabState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/kebijakan") return "privacy";
      if (path === "/login") return "frontend";
      if (path === "/daftar" || path === "/register") return "registration";
      if (path === "/install" || path === "/pasang" || path === "/ios") return "install";

      const saved = localStorage.getItem("lpk_auth_session");
      if (saved) {
        try {
          const { tab, timestamp } = JSON.parse(saved);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return tab || "frontend";
          }
        } catch (e) {}
      }
    }
    return "frontend";
  });

  const setActiveTab = (tab: string) => {
    // Scroll to top of window when active tab changes
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    if (tab === "kalender") {
      const role = currentUser?.role;
      if (role === "Admin" || role === "Admin Super" || role === "Admin Biasa") {
        setAdminSegment("kalender");
        setActiveTabState("admin");
        window.history.pushState({ type: "tab", tab: "admin" }, "", "/");
        return;
      } else if (role === "VVIP") {
        setVvipViewMode("kalender");
        setActiveTabState("vvip");
        window.history.pushState({ type: "tab", tab: "vvip" }, "", "/");
        return;
      }
    }

    if (tab === activeTab) return;
    setActiveTabState(tab);
    let path = "/";
    if (tab === "privacy") path = "/kebijakan";
    if (tab === "registration") path = "/daftar";
    if (tab === "install") path = "/install";
    window.history.pushState({ type: "tab", tab }, "", path);
  };

  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [showAppDownloadModal, setShowAppDownloadModal] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [showNotificationPermissionPrompt, setShowNotificationPermissionPrompt] = useState<boolean>(false);
  const [notificationPromptState, setNotificationPromptState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [isIframeEnvironment, setIsIframeEnvironment] = useState<boolean>(false);

  const handlePromptNotificationPermissionOnLogin = () => {
    try {
      if (typeof window !== "undefined") {
        const inIframe = window.self !== window.top;
        setIsIframeEnvironment(inIframe);

        const hasNativeBridge = Boolean(
          ((window as any).Android && typeof (window as any).Android.requestNotificationPermission === "function") ||
          ((window as any).JSBridge && typeof (window as any).JSBridge.requestNotificationPermission === "function")
        );
        if (hasNativeBridge) {
          requestNotificationPermission().catch(() => {});
          return;
        }
        if ("Notification" in window) {
          if (Notification.permission !== "granted") {
            setNotificationPromptState(Notification.permission === "denied" ? "denied" : "idle");
            setShowNotificationPermissionPrompt(true);
          }
        }
      }
    } catch (_) {}
  };

  const handleAcceptNotificationPermission = async () => {
    setNotificationPromptState("requesting");
    try {
      const perm = await requestNotificationPermission();
      if (perm === "granted") {
        setNotificationPromptState("granted");
        try {
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([250, 100, 250]);
          }
        } catch (_) {}
        showOutsideApkNotification(
          "🔔 LPK SCI Pati (Resmi)",
          "Notifikasi HP berhasil diizinkan! Informasi jadwal, materi, dan seleksi kerja Jepang akan masuk langsung ke layar HP Anda.",
          { url: "/?tab=notifikasi", id: `login_welcome_${Date.now()}` }
        );
        setTimeout(() => {
          setShowNotificationPermissionPrompt(false);
          setNotificationPromptState("idle");
        }, 2200);
      } else {
        setNotificationPromptState("denied");
      }
    } catch (e) {
      setNotificationPromptState("denied");
    }
  };

  const handleRecheckNotificationPermission = () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setNotificationPromptState("granted");
        showOutsideApkNotification(
          "🔔 LPK SCI Pati",
          "Izin notifikasi telah aktif! Notifikasi siap diterima di luar aplikasi.",
          { url: "/?tab=notifikasi" }
        );
        setTimeout(() => {
          setShowNotificationPermissionPrompt(false);
          setNotificationPromptState("idle");
        }, 1800);
      } else {
        alert("Izin notifikasi belum aktif. Di browser HP Anda, ketuk ikon gembok 🔒 di samping URL situs, pilih Izin > Notifikasi > Izinkan, lalu ketuk Cek Ulang.");
      }
    }
  };

  // Dynamic references to ensure broadcast notifications filter appropriately for the current user
  const currentUserRef = useRef<UserAccount | null>(null);
  const systemStateRef = useRef<SystemState | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    (window as any).openAppDownloadModal = () => setActiveTab("install");
    (window as any).navigateToInstall = () => setActiveTab("install");

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    } else {
      setShowAppDownloadModal(true);
    }
  };

  useEffect(() => {
    // Fire background health ping to warm up backend container and database connection
    fetch("/api/ping").catch(() => {});

    // Start listening for real-time broadcast notifications across all registered accounts
    // Dispatches directly to user devices outside the application (OS notification center & lockscreen)
    const unsubscribeBroadcast = startBroadcastNotificationListener(
      undefined,
      () => ({
        user: currentUserRef.current,
        activeStudents: systemStateRef.current?.activeStudents,
      })
    );
    // Parse referral code on mount and save to localStorage
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref") || params.get("referral") || params.get("code");
      if (refCode) {
        localStorage.setItem("lpk_referral_code", refCode);
      }
    }

    return () => {
      unsubscribeBroadcast();
    };
  }, []);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.type === "tab") {
        setActiveTabState(e.state.tab);
      } else if (!e.state) {
        const path = window.location.pathname;
        if (path === "/kebijakan") {
          setActiveTabState("privacy");
        } else if (path === "/daftar" || path === "/register") {
          setActiveTabState("registration");
        } else if (path === "/login") {
          setActiveTabState("frontend");
          setIsLoginOpen(true);
        } else {
          setActiveTabState("frontend");
        }
      }
    };
    
    // Check initial load
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/login") {
        setIsLoginOpen(true);
      } else if (path === "/daftar" || path === "/register") {
        setActiveTabState("registration");
      }
    }
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeTab]);
  const [originalUser, setOriginalUser] = useState<UserAccount | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lpk_original_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lpk_auth_session");
      if (saved) {
        try {
          const { user, timestamp } = JSON.parse(saved);
          // 24 hour expiration check
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            return user;
          } else {
            localStorage.removeItem("lpk_auth_session");
          }
        } catch (e) {
          console.error("Failed to parse saved session", e);
        }
      }
    }
    return null;
  });

  // Persist session on changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (currentUser) {
        localStorage.setItem("lpk_auth_session", JSON.stringify({
          user: currentUser,
          tab: activeTab,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem("lpk_auth_session");
      }
    }
  }, [currentUser, activeTab]);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState<boolean>(false);
  const [showStudentProfilePrompt, setShowStudentProfilePrompt] = useState<boolean>(false);
  const [isDefaultPasswordPrompt, setIsDefaultPasswordPrompt] = useState<boolean>(false);
  const [pendingAdminStudentSearch, setPendingAdminStudentSearch] = useState<string>("");
  const [adminSegment, setAdminSegment] = useState<
    | "siswa"
    | "pembayaran"
    | "inventaris"
    | "pajak"
    | "kustomisasi"
    | "galeri"
    | "joborders"
    | "petasebaran"
    | "informasi"
    | "dataCV"
    | "gaji"
    | "afiliasi"
    | "kalender"
    | "kelas"
    | "manajemen"
    | null
  >("siswa");
  const [vvipViewMode, setVvipViewMode] = useState<"full" | "gaji" | "exec" | "eval" | "pajak" | "ai" | "security" | "kalender" | "afiliasi">("full");

  // Pure Firestore initialization: Do NOT cache or strip data in browser local storage.
  // Immediately purge any legacy stripped state cache from browser storage.
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("lpk_cached_system_state");
        sessionStorage.removeItem("lpk_cached_system_state");
      } catch (e) {}
    }
  }, []);

  const initialEmptyState: SystemState = {
    registeredStudents: [],
    activeStudents: [],
    attendance: [],
    payments: [],
    inventory: [],
    taxes: [],
    users: [],
    lmsLessons: [],
    chapterAssessments: [],
    galleries: [],
    costConfig: {
      registration: 500000,
      dp: 5000000,
      fullPayment: 2000000,
      stage3: 3000000,
      managementFee: 0,
    },
    customization: {
      logoText: "LPK SCI",
      logoIcon: "Award",
      themeColor: "indigo",
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.png",
      runningText: "🇯🇵 Selamat Datang di Portal Resmi LPK Source Course Indonesia (SCI) Pati • Lembaga Resmi Pelatihan Kerja & Pengiriman Tenaga Profesional ke Jepang (Program Tokutei Ginou / SSW & Magang) • Bimbingan Bahasa Jepang Intensif N5, N4, JFT-Basic & Skill Kaigo Lansia • Info Pendaftaran & Konsultasi Hubungi Kantor LPK SCI Pati",
      slides: [],
      gallery: [],
      landingConfig: {
        ecosystemTitle: "Ekosistem Pendidikan & Penyaluran Karir",
        ecosystemSubtitle: "Selamat datang di portal resmi LPK SCI (Source Course Indonesia).",
        perks: [],
        alumniTitle: "Testimoni Alumni",
        alumniSubtitle: "Kisah sukses alumni LPK SCI.",
        testimonials: [],
        programsTitle: "Program Unggulan LPK SCI",
        programsSubtitle: "Jalur karir spesifik (SSW) dan Magang (Ginou Jisshusei).",
        programs: [],
        opportunityImages: [
          {
            id: 1,
            label: "Pelatihan Teori & Praktik",
            url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/galeri%2F1788397965132_WhatsApp_Image_2026-09-02_at_10.02.15.jpeg?alt=media&token=afd37c47-ed69-440a-bf04-0f524e94c79f"
          },
          {
            id: 2,
            label: "Penyerahan Sertifikat",
            url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/galeri%2F1788398049192_WhatsApp_Image_2026-09-02_at_09.10.45.jpeg?alt=media&token=f7bcb632-ff46-4e62-879e-9589b46ceecc"
          },
          {
            id: 3,
            label: "Foto Bersama Alumni",
            url: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0782283050.firebasestorage.app/o/galeri%2F1788398162422_WhatsApp_Image_2026-09-01_at_09.06.50.jpg?alt=media&token=a63b6a63-c29b-48db-9416-1cb10d74401d"
          }
        ]
      }
    }
  };

  // Synchronized Full-Stack State (hydrates directly from server & Firestore)
  const [systemState, setSystemState] = useState<SystemState>(initialEmptyState);

  currentUserRef.current = currentUser;
  systemStateRef.current = systemState;

  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<"connected" | "connecting" | "syncing">("connecting");

  // Safety net: ensure loading state never hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingState(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Check profile completeness & default password for student users
  const checkAndShowStudentProfilePrompt = (user: UserAccount | null, isDefaultPass: boolean = false) => {
    if (!user) return;

    const isStudent = user.role === "Siswa" || user.role === "Alumni";

    // Check suppression in localStorage
    let isSuppressed = false;
    if (typeof window !== "undefined") {
      isSuppressed = localStorage.getItem(`suppress_student_profile_prompt_${user.username}`) === "true";
    }

    // Check if birthDate is missing
    let isMissingBirthDate = false;
    if (isStudent) {
      const studentObj =
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
        studentObj?.birthDate ||
        (studentObj as any)?.tanggalLahir ||
        (studentObj as any)?.tglLahir ||
        user?.birthDate ||
        "";

      isMissingBirthDate = !existingBirthDate || existingBirthDate === "-" || String(existingBirthDate).trim() === "";
    }

    if (isDefaultPass || (isStudent && isMissingBirthDate)) {
      if (isSuppressed && !isDefaultPass) {
        return;
      }
      setIsDefaultPasswordPrompt(isDefaultPass);
      setShowStudentProfilePrompt(true);
    }
  };

  useEffect(() => {
    if (currentUser && !isLoadingState) {
      checkAndShowStudentProfilePrompt(currentUser, false);
      checkAndNotifyJobOrdersOnLogin(currentUser, systemState);
    }
  }, [currentUser?.username, isLoadingState]);

  // Load backend state on initialization with automatic persistent retries for cold starts
  const isFetchingStateRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(Date.now());
  const lastEtagRef = useRef<string | null>(null);
  // id -> time this device saved a lesson/quiz (protects it from the refetch merge)
  const recentLocalItemIdsRef = useRef<Map<string, number>>(new Map());
  const retryTimeoutRef = useRef<any>(null);

  const fetchState = async (retryCount = 0, force = false) => {
    // Strictly prevent concurrent state fetches to avoid saturating mobile/iOS network
    if (isFetchingStateRef.current) return;
    isFetchingStateRef.current = true;
    lastFetchTimeRef.current = Date.now();

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    try {
      setSyncStatus("syncing");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const headers: Record<string, string> = { "Cache-Control": "no-cache" };
      if (force) {
        lastEtagRef.current = null;
      } else if (lastEtagRef.current) {
        headers["If-None-Match"] = lastEtagRef.current;
      }

      const response = await fetch("/api/state", {
        signal: controller.signal,
        headers
      });
      clearTimeout(timeoutId);

      // 304 Not Modified: Data on server is unchanged, zero payload needed!
      if (response.status === 304) {
        setSyncStatus("connected");
        setIsLoadingState(false);
        return;
      }

      if (response.ok) {
        const etag = response.headers.get("ETag");
        if (etag) lastEtagRef.current = etag;

        const data = await response.json();
        const isServerReady = data?._isReady !== false;

        setSystemState((prevState) => {
          if (!data) return prevState;
          const safeData: any = { ...data };
          if (!isServerReady) {
            const arrayKeys = [
              "activeStudents", "registeredStudents", "users", "attendance",
              "payments", "inventory", "taxes", "events", "jobOrders",
              "lmsLessons", "lmsQuizzes", "lmsComments", "chapterAssessments",
              "messages", "logs", "salaries", "cashLedger", "teacherLeaves",
              "teacherReports", "teacherContracts", "lmsClasses", "galleries"
            ];
            arrayKeys.forEach((key) => {
              const prevArr = prevState[key as keyof typeof prevState];
              if ((!safeData[key] || safeData[key].length === 0) && Array.isArray(prevArr) && prevArr.length > 0) {
                safeData[key] = prevArr;
              }
            });
          }

          // Safety merge: Never lose student scores (5S, ethics, math, japanese, attendance) on background refetches
          if (Array.isArray(prevState?.activeStudents) && Array.isArray(safeData?.activeStudents)) {
            safeData.activeStudents = safeData.activeStudents.map((servStudent: any) => {
              const prev = prevState.activeStudents.find((p: any) => p && p.id && servStudent && servStudent.id && String(p.id).trim().toLowerCase() === String(servStudent.id).trim().toLowerCase());
              if (!prev) return servStudent;
              return {
                ...servStudent,
                fiveSScore: (servStudent.fiveSScore !== undefined && servStudent.fiveSScore !== null) ? servStudent.fiveSScore : (prev.fiveSScore || 0),
                ethicsScore: (servStudent.ethicsScore !== undefined && servStudent.ethicsScore !== null) ? servStudent.ethicsScore : (prev.ethicsScore || 0),
                mathScore: (servStudent.mathScore !== undefined && servStudent.mathScore !== null) ? servStudent.mathScore : (prev.mathScore || 0),
                japaneseScore: (servStudent.japaneseScore !== undefined && servStudent.japaneseScore !== null) ? servStudent.japaneseScore : (prev.japaneseScore || 0),
                attendanceScore: (servStudent.attendanceScore !== undefined && servStudent.attendanceScore !== null) ? servStudent.attendanceScore : (prev.attendanceScore || 0),
              };
            });
          }

          // Safety merge: keep lessons/quizzes this device saved moments ago that the
          // server response may not contain yet - but never resurrect ones deleted
          // or replaced elsewhere (see lib/recentLocalItems.ts).
          if (Array.isArray(safeData.lmsLessons)) {
            safeData.lmsLessons = mergeRecentLocalItems(safeData.lmsLessons, prevState?.lmsLessons, recentLocalItemIdsRef.current);
          }
          if (Array.isArray(safeData.lmsQuizzes)) {
            safeData.lmsQuizzes = mergeRecentLocalItems(safeData.lmsQuizzes, prevState?.lmsQuizzes, recentLocalItemIdsRef.current);
          }

          // Safety merge & cross-class Mandiri sync: Never lose recently added mandiri chapters and ensure they propagate across all lmsClasses
          const prevClasses = prevState?.customization?.lmsClasses || prevState?.lmsClasses;
          const ensureMandiriChaptersInAllClasses = (classesList: any[]) => {
            if (!Array.isArray(classesList) || classesList.length === 0) return classesList;
            const mandiriChapters: any[] = [];
            const mandiriMathChapters: any[] = [];
            classesList.forEach((cls: any) => {
              if (Array.isArray(cls.chapters)) {
                cls.chapters.forEach((ch: any) => {
                  if (ch && (ch.isMandiri || Number(ch.number) > 35)) {
                    if (!mandiriChapters.some((m) => Number(m.number) === Number(ch.number))) {
                      mandiriChapters.push({ ...ch, isMandiri: true, isActive: true });
                    }
                  }
                });
              }
              if (Array.isArray(cls.mathChapters)) {
                cls.mathChapters.forEach((ch: any) => {
                  if (ch && (ch.isMandiri || Number(ch.number) > 25)) {
                    if (!mandiriMathChapters.some((m) => Number(m.number) === Number(ch.number))) {
                      mandiriMathChapters.push({ ...ch, isMandiri: true, isActive: true });
                    }
                  }
                });
              }
            });

            // Also incorporate any lessons marked as isMandiri so they appear for all classes
            const lessonsList = Array.isArray(safeData.lmsLessons) ? safeData.lmsLessons : [];
            lessonsList.forEach((l: any) => {
              const chNum = Number(l?.chapterNumber);
              if (!chNum) return;
              const isMath = l?.subject && (String(l.subject).toLowerCase().includes("ssw") || String(l.subject).toLowerCase().includes("matematika"));
              if (l.isMandiri || (isMath ? chNum > 25 : chNum > 35)) {
                if (isMath) {
                  if (!mandiriMathChapters.some((m) => Number(m.number) === chNum)) {
                    mandiriMathChapters.push({ number: chNum, title: l.title || `Bab ${chNum} Mandiri SSW`, isMandiri: true, isActive: true });
                  }
                } else {
                  if (!mandiriChapters.some((m) => Number(m.number) === chNum)) {
                    mandiriChapters.push({ number: chNum, title: l.title || `Bab ${chNum} Mandiri`, isMandiri: true, isActive: true });
                  }
                }
              }
            });

            return classesList.map((cls: any) => {
              let chapters = cls.chapters || [];
              if (mandiriChapters.length > 0) {
                const existingNums = new Set(chapters.map((ch: any) => Number(ch.number)));
                const toAdd = mandiriChapters.filter((m) => !existingNums.has(Number(m.number)));
                if (toAdd.length > 0) {
                  chapters = [...chapters, ...toAdd].sort((a: any, b: any) => Number(a.number) - Number(b.number));
                }
              }
              let mathChapters = cls.mathChapters || [];
              if (mandiriMathChapters.length > 0) {
                const existingMathNums = new Set(mathChapters.map((ch: any) => Number(ch.number)));
                const toAddMath = mandiriMathChapters.filter((m) => !existingMathNums.has(Number(m.number)));
                if (toAddMath.length > 0) {
                  mathChapters = [...mathChapters, ...toAddMath].sort((a: any, b: any) => Number(a.number) - Number(b.number));
                }
              }
              return { ...cls, chapters, mathChapters };
            });
          };

          const mergeClassesWithPrev = (targetClasses: any[]) => {
            if (!Array.isArray(targetClasses)) return targetClasses;
            return targetClasses.map((tc: any) => {
              const pc = Array.isArray(prevClasses) ? prevClasses.find((p: any) => (p.name || p.id || "").trim().toLowerCase() === (tc.name || tc.id || "").trim().toLowerCase()) : null;
              if (!pc) return tc;
              let mergedChapters = tc.chapters || [];
              if (Array.isArray(pc.chapters)) {
                const tcChapterNums = new Set((tc.chapters || []).map((ch: any) => Number(ch.number)));
                const extraChapters = pc.chapters.filter((ch: any) => ch && ch.isMandiri && !tcChapterNums.has(Number(ch.number)));
                if (extraChapters.length > 0) {
                  mergedChapters = [...mergedChapters, ...extraChapters].sort((a: any, b: any) => Number(a.number) - Number(b.number));
                }
              }
              let mergedMathChapters = tc.mathChapters || [];
              if (Array.isArray(pc.mathChapters)) {
                const tcMathNums = new Set((tc.mathChapters || []).map((ch: any) => Number(ch.number)));
                const extraMathChapters = pc.mathChapters.filter((ch: any) => ch && ch.isMandiri && !tcMathNums.has(Number(ch.number)));
                if (extraMathChapters.length > 0) {
                  mergedMathChapters = [...mergedMathChapters, ...extraMathChapters].sort((a: any, b: any) => Number(a.number) - Number(b.number));
                }
              }
              return {
                ...tc,
                chapters: mergedChapters,
                mathChapters: mergedMathChapters
              };
            });
          };

          if (safeData.customization && Array.isArray(safeData.customization.lmsClasses)) {
            safeData.customization.lmsClasses = ensureMandiriChaptersInAllClasses(
              mergeClassesWithPrev(safeData.customization.lmsClasses)
            );
          }
          if (Array.isArray(safeData.lmsClasses)) {
            safeData.lmsClasses = ensureMandiriChaptersInAllClasses(
              mergeClassesWithPrev(safeData.lmsClasses)
            );
          }
          return safeData;
          return safeData;
        });
        setIsLoadingState(false);

        if (!isServerReady) {
          setSyncStatus("connecting");
          const nextRetry = Math.min(3000 + retryCount * 2000, 15000);
          retryTimeoutRef.current = setTimeout(() => fetchState(retryCount + 1), nextRetry);
        } else {
          setSyncStatus("connected");
        }
      } else {
        setSyncStatus("connecting");
        const nextRetry = Math.min(5000 + retryCount * 3000, 25000);
        retryTimeoutRef.current = setTimeout(() => fetchState(retryCount + 1), nextRetry);
        setIsLoadingState(false);
      }
    } catch (error) {
      setSyncStatus("connecting");
      setIsLoadingState(false);
      const nextRetry = Math.min(5000 + retryCount * 3000, 25000);
      retryTimeoutRef.current = setTimeout(() => fetchState(retryCount + 1), nextRetry);
    } finally {
      isFetchingStateRef.current = false;
    }
  };

  useEffect(() => {
    fetchState();

    // Refresh state periodically with safe, non-congesting interval (every 25 seconds)
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchState();
      }
    }, 25000);

    const triggerDebouncedFetch = () => {
      const now = Date.now();
      // Refetch on interaction/focus only if at least 20 seconds have passed
      if (now - lastFetchTimeRef.current > 20000) {
        fetchState(0, true);
      }
    };

    window.addEventListener("focus", triggerDebouncedFetch);
    window.addEventListener("online", triggerDebouncedFetch);
    window.addEventListener("pageshow", triggerDebouncedFetch);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        triggerDebouncedFetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      window.removeEventListener("focus", triggerDebouncedFetch);
      window.removeEventListener("online", triggerDebouncedFetch);
      window.removeEventListener("pageshow", triggerDebouncedFetch);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Real-time synchronization across all tabs and domain mappings (e.g. lpksci.com)
  useEffect(() => {
    if (!db) return;
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, "system", "sync_meta"), (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const updateAge = Date.now() - (data?.updatedAt || 0);
        // Instant refetch if update was within the last 60 seconds
        if (updateAge < 60000) {
          fetchState(0, true);
        }
      }, (err) => {
        // Silently tolerate if offline or network hiccup; background interval polling handles fallback
      });
    } catch (e) {}

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Dedicated instant real-time synchronization for SOP Cost Configuration (costConfig)
  useEffect(() => {
    if (!db) return;
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, "system", "costConfig"), (snapshot) => {
        if (!snapshot.exists()) return;
        const freshCost = snapshot.data();
        if (freshCost) {
          setSystemState((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              costConfig: {
                ...(prev?.costConfig || {}),
                ...freshCost
              }
            };
          });
        }
      }, (err) => {
        // Silently tolerate if offline
      });
    } catch (e) {}

    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    // Check for redirect result from Google Sign-In
    const checkRedirect = async () => {
      if (!auth) return;
      const isAndroidWebView = typeof navigator !== "undefined" && (
        /wv|Android.*Version\/[0-9]/i.test(navigator.userAgent)
      );
      if (isAndroidWebView) return;

      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const email = user.email || "";
          const name = user.displayName || email.split("@")[0] || "User";

          // Fetch latest state if needed
          let currentState = systemState;
          if (!currentState.users || currentState.users.length === 0) {
            const response = await fetch("/api/state");
            if (response.ok) {
              currentState = await response.json();
              setSystemState(currentState);
            }
          }

          const existingUser = currentState.users?.find(
            (u) => u.email === email || u.username === email,
          );

          if (existingUser) {
            if (existingUser.status === "Suspended") {
              alert(
                "Akses Ditolak: Akun Anda telah disuspend oleh Admin atau Direktur.",
              );
              return;
            }
            const now = new Date().toISOString();
            handleUpdateState("users", "edit", { username: existingUser.username, lastActive: now });
            setCurrentUser({ ...existingUser, lastActive: now });
            if (
              existingUser.role === "Siswa" ||
              existingUser.role === "Pengajar"
            )
              setActiveTab("lms");
            if (existingUser.role === "Admin" || existingUser.role === "Admin Super" || existingUser.role === "Admin Biasa") setActiveTab("admin");
            if (existingUser.role === "VVIP") setActiveTab("vvip");
            return;
          }

          // Strict Role & Eligibility Enforcement for new auto-created Google logins
          // Seeded users that are NOT yet in the database will be created ONCE
          let role: "Admin" | "VVIP" | "Siswa" | "Pengajar" | "Alumni" | "Admin Super" | "Admin Biasa" | null = null;

          if (email === "linggadhani79@gmail.com" || email === "ekaichiro@gmail.com" || email === "rlstudioindonesia@gmail.com") {
            role = "VVIP";
          } else if (
            email === "sakti.wardana@lpksc.id" ||
            email.includes("admin")
          ) {
            role = "Admin";
          } else if (
            email === "linggadhani95@gmail.com" ||
            email === "lanangrudis11@gmail.com" ||
            email.toLowerCase().includes("sensei") ||
            email.toLowerCase().includes("lanang")
          ) {
            role = "Pengajar";
          }

          if (role) {
            const newUser = {
              username: email,
              name: name,
              email: email,
              role: role,
              status: "Active" as const,
              studentId:
                role === "Siswa" || role === "Alumni" ? "SIS-013" : undefined,
              password: "google-auth-user",
              lastActive: new Date().toISOString()
            };

            // PERSIST to database so it's not hardcoded next time
            // This ensures that if the role is changed in VVIP, it stays changed
            await fetch("/api/state/update", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dataType: "users",
                action: "add",
                payload: newUser
              })
            });

            setCurrentUser(newUser);
            if (newUser.role === "Siswa" || newUser.role === "Pengajar")
              setActiveTab("lms");
            if (newUser.role === "Admin" || newUser.role === "Admin Super" || newUser.role === "Admin Biasa") setActiveTab("admin");
            if (newUser.role === "VVIP") setActiveTab("vvip");
          } else {
            alert(
              "Akses Ditolak: Akun Anda belum terdaftar di sistem. Silakan mendaftar dan menunggu persetujuan (approval) oleh Admin atau Sensei.",
            );
          }
        }
      } catch (error) {
        console.error("Redirect sign-in error:", error);
      }
    };

    checkRedirect();
  }, []);

  useEffect(() => {
    if (currentUser && !isLoadingState) {
      // Guard: If users state is empty or initializing, NEVER wipe user session!
      if (!systemState.users || systemState.users.length === 0) {
        return;
      }

      const updatedUser = systemState.users.find(
        (u) =>
          (u.username && currentUser.username && u.username.toLowerCase() === currentUser.username.toLowerCase()) ||
          (u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase())
      );

      if (updatedUser) {
        if (updatedUser.status === "Suspended") {
          setCurrentUser(null);
          alert(
            "Akses Ditolak: Akun Anda telah disuspend oleh Admin atau Direktur.",
          );
          setActiveTab("frontend");
          return;
        }

        if (
          updatedUser.role !== currentUser.role ||
          updatedUser.assignedClass !== currentUser.assignedClass ||
          updatedUser.studentId !== currentUser.studentId ||
          updatedUser.email !== currentUser.email ||
          updatedUser.name !== currentUser.name ||
          updatedUser.profilePicture !== currentUser.profilePicture ||
          updatedUser.status !== currentUser.status ||
          updatedUser.bankAccount !== currentUser.bankAccount ||
          updatedUser.faceRegistered !== currentUser.faceRegistered ||
          updatedUser.faceBiometricData !== currentUser.faceBiometricData
        ) {
          setCurrentUser(updatedUser);
        }
      } else {
        // Double check with server auth validation endpoint to prevent false session removal during cold starts
        fetch("/api/auth/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser.username, email: currentUser.email })
        })
          .then(res => res.json())
          .then(data => {
            if (data?.valid && data.user) {
              setCurrentUser(data.user);
            }
          })
          .catch(() => {});
      }
    }
  }, [systemState.users, currentUser, isLoadingState]);

  // Submit student enrollment online (Frontend Form)
  const handleRegisterSubmit = async (
    formData: any,
  ): Promise<RegisteredStudent | null> => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const body = await response.json();
        if (body.success) {
          // Sync server-to-client states immediately after registering
          await fetchState();
          return body.registered;
        }
      }
    } catch (e) {
      console.error("Enrollment sign up failed:", e);
    }
    return null;
  };

  // Perform state mutation commands on DB inside server.ts (Admin Action, Attendance logging...)
  const handleUpdateState = async (
    dataType: string,
    action: string,
    payload: any,
  ): Promise<boolean> => {
    try {
      // Send only what this device changed for classes/customization, so a stale
      // copy cannot revert other people's edits (see lib/classListDiff.ts).
      let wirePayload = payload;
      const baseClasses = systemState?.customization?.lmsClasses || systemState?.lmsClasses || [];
      if (dataType === "customization" && action === "update" && payload && typeof payload === "object" && !Array.isArray(payload)) {
        const partial: any = diffShallowObject(systemState?.customization || {}, payload, ["lmsClasses", "deletedLmsClassId", "renamedClass"]);
        if (payload.deletedLmsClassId) partial.deletedLmsClassId = payload.deletedLmsClassId;
        if (payload.renamedClass) partial.renamedClass = payload.renamedClass;
        if (Array.isArray(payload.lmsClasses)) partial.lmsClassesDiff = diffClassList(baseClasses, payload.lmsClasses);
        wirePayload = partial;
      } else if (dataType === "lmsClasses") {
        const classesList = Array.isArray(payload) ? payload : (payload?.lmsClasses || payload?.classes || [payload]);
        wirePayload = { lmsClassesDiff: diffClassList(baseClasses, classesList) };
      }
      const response = await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataType, action, payload: wirePayload, userRole: currentUser?.role, actingUserName: currentUser?.name }),
      });
      if (response.ok) {
        const resData = await response.json().catch(() => null);
        if ((dataType === "lmsLessons" || dataType === "lmsQuizzes") && (action || "").toLowerCase() !== "delete") {
          const savedItems = [resData?.item, ...(Array.isArray(resData?.items) ? resData.items : []), ...(Array.isArray(payload?.quizzes) ? payload.quizzes : []), payload];
          const savedAt = Date.now();
          savedItems.forEach((it: any) => { if (it && it.id) recentLocalItemIdsRef.current.set(it.id, savedAt); });
        }
        if (dataType === "activeStudents" || dataType === "registeredStudents") {
          const item = resData?.item || resData?.updated || resData?.activeStudent || payload;
          if (item) {
            setSystemState((prev: any) => {
              if (!prev) return prev;
              const actList = Array.isArray(prev.activeStudents) ? [...prev.activeStudents] : [];
              const regList = Array.isArray(prev.registeredStudents) ? [...prev.registeredStudents] : [];

              const actIdx = findRecordIndex(actList, { id: item.id, name: item.name });
              if (actIdx !== -1) {
                actList[actIdx] = { ...actList[actIdx], ...item };
              } else if (dataType === "activeStudents" && action === "add") {
                actList.push(item);
              }

              const regIdx = findRecordIndex(regList, { id: item.id, name: item.name });
              if (regIdx !== -1) {
                regList[regIdx] = { ...regList[regIdx], ...item };
              } else if (dataType === "registeredStudents" && action === "add") {
                regList.push(item);
              }

              return {
                ...prev,
                activeStudents: actList,
                registeredStudents: regList
              };
            });
          }
        }
        if (resData?.item && dataType === "chapterAssessments") {
          setSystemState((prev: any) => {
            if (!prev) return prev;
            const currentList = Array.isArray(prev.chapterAssessments) ? [...prev.chapterAssessments] : [];
            const item = resData.item;
            const idx = currentList.findIndex((c: any) => c.id === item.id || ((c.studentId || "").trim() === (item.studentId || "").trim() && Number(c.chapterNumber) === Number(item.chapterNumber) && (c.subject || "Bahasa Jepang").trim().toLowerCase() === (item.subject || "Bahasa Jepang").trim().toLowerCase() && (!item.lessonId || c.lessonId === item.lessonId)));
            if (idx !== -1) {
              currentList[idx] = item;
            } else {
              currentList.push(item);
            }
            return { ...prev, chapterAssessments: currentList };
          });
        }
        if (dataType === "lmsLessons") {
          setSystemState((prev: any) => {
            if (!prev) return prev;
            const currentList = Array.isArray(prev.lmsLessons) ? [...prev.lmsLessons] : [];
            if (action === "delete") {
              const targetId = payload?.id;
              return {
                ...prev,
                lmsLessons: currentList.filter((l: any) => l.id !== targetId)
              };
            }
            const item = resData?.item || payload;
            if (item && item.id) {
              const idx = currentList.findIndex((l: any) => l.id === item.id);
              if (idx !== -1) {
                currentList[idx] = { ...currentList[idx], ...item };
              } else {
                currentList.push(item);
              }
            }
            return { ...prev, lmsLessons: currentList };
          });
        }
        if (dataType === "lmsClasses") {
          const classesList = Array.isArray(payload) ? payload : (payload?.lmsClasses || payload?.classes || [payload]);
          setSystemState((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              lmsClasses: classesList,
              customization: {
                ...(prev.customization || {}),
                lmsClasses: classesList
              }
            };
          });
        }
        if (dataType === "lmsQuizzes") {
          setSystemState((prev: any) => {
            if (!prev) return prev;
            const currentList = Array.isArray(prev.lmsQuizzes) ? [...prev.lmsQuizzes] : [];
            const normAct = (action || "").toLowerCase();
            if (normAct === "batch_upsert" || normAct === "batch_save" || normAct === "save_batch") {
              const chNum = Number(payload?.chapterNumber || payload?.chapterId || resData?.chapterNumber || 1);
              const subj = payload?.subject || resData?.subject || "Bahasa Jepang";
              const subTitle = (payload?.subTitle ? String(payload.subTitle).trim() : (resData?.subTitle ? String(resData.subTitle).trim() : ""));
              const lessonId = (payload?.lessonId ? String(payload.lessonId).trim() : (resData?.lessonId ? String(resData.lessonId).trim() : ""));
              const items = Array.isArray(resData?.items) ? resData.items : (Array.isArray(payload?.quizzes) ? payload.quizzes : []);
              const otherQuizzes = currentList.filter((q: any) => {
                const qCh = Number(q.chapterNumber !== undefined ? q.chapterNumber : q.chapterId);
                const qSubj = q.subject || "Bahasa Jepang";
                if (qCh !== chNum || qSubj !== subj) return true;
                if (subTitle) {
                  return (q.subTitle || "").trim().toLowerCase() !== subTitle.toLowerCase();
                }
                if (lessonId) {
                  return (q.lessonId || "").trim() !== lessonId;
                }
                return false;
              });
              return { ...prev, lmsQuizzes: [...otherQuizzes, ...items] };
            }
            if (action === "delete") {
              const targetId = payload?.id;
              return {
                ...prev,
                lmsQuizzes: currentList.filter((q: any) => q.id !== targetId)
              };
            }
            const item = resData?.item || payload;
            if (item && item.id) {
              const idx = currentList.findIndex((q: any) => q.id === item.id);
              if (idx !== -1) {
                currentList[idx] = { ...currentList[idx], ...item };
              } else {
                currentList.push(item);
              }
            }
            return { ...prev, lmsQuizzes: currentList };
          });
        }
        if (dataType === "costConfig") {
          setSystemState((prev: any) => {
            if (!prev) return prev;
            return {
              ...prev,
              costConfig: {
                ...(prev?.costConfig || {}),
                ...(resData?.costConfig || payload || {})
              }
            };
          });
        }
        if (dataType === "customization") {
          setSystemState((prev: any) => {
            const nextCust = {
              ...(prev?.customization || {}),
              ...(payload || {}),
            };
            return {
              ...prev,
              customization: nextCust,
              ...(payload?.lmsClasses ? { lmsClasses: payload.lmsClasses } : {})
            };
          });
        }
        if (dataType === "galleries" || dataType === "gallery") {
          const newList = resData?.item?.data || (Array.isArray(payload) ? payload : (payload?.data || payload?.gallery || payload?.galleries || []));
          setSystemState((prev: any) => ({
            ...prev,
            galleries: newList,
            customization: {
              ...(prev?.customization || {}),
              gallery: newList,
            },
          }));
        }
        // Instantly refresh client state from server without delay
        fetchState(0, true).catch(() => {});
        return true;
      }
    } catch (err) {
      console.error("Error committing synchronized state:", err);
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setOriginalUser(null);
    setActiveTab("frontend");
    if (typeof window !== "undefined") {
      localStorage.removeItem("lpk_auth_session");
      localStorage.removeItem("lpk_original_session");
    }
  };

  const { isMobileDevice, isTablet, isLandscape } = useDeviceDimensions();
  const [preferredDisplayMode, setPreferredDisplayMode] = useState<"auto" | "web" | "mobile">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred_display_mode");
      if (saved === "web" || saved === "mobile") return saved;
    }
    return "auto";
  });

  const handleSetDisplayMode = (mode: "auto" | "web" | "mobile") => {
    setPreferredDisplayMode(mode);
    if (typeof window !== "undefined") {
      if (mode === "auto") {
        localStorage.removeItem("preferred_display_mode");
      } else {
        localStorage.setItem("preferred_display_mode", mode);
      }
    }
  };

  const isMobile = preferredDisplayMode === "mobile" 
    ? true 
    : preferredDisplayMode === "web" 
      ? false 
      : isMobileDevice;

  const isMainTab = activeTab && [
    "kalender",
    "lms",
    "jobs",
    "sensei_dashboard",
    "tagihan",
    "registration",
    "eksplorasi",
    "chat"
  ].includes(activeTab);

  
  const [isResetRoute, setIsResetRoute] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('token=')) {
      setIsResetRoute(true);
    }
  }, []);

  useEffect(() => {
    let rawIcon = systemState?.customization?.faviconUrl || systemState?.customization?.logoUrl || "/favicon.png";
    if (typeof rawIcon === "string" && (rawIcon.includes("1792028427128_favicon.png") || rawIcon.includes("1788528497434_7bd439c1"))) {
      rawIcon = "/favicon.png";
    }
    if (rawIcon) {
      // Update all standard icon links
      const iconSelectors = [
        "link[rel='icon']",
        "link[rel='shortcut icon']",
        "link[rel='apple-touch-icon']",
        "link[rel='apple-touch-icon-precomposed']",
        "#app-favicon",
        "#app-apple-icon"
      ];

      iconSelectors.forEach(sel => {
        const el = document.querySelector(sel) as HTMLLinkElement | null;
        if (el) {
          el.href = rawIcon;
        }
      });

      // Remove any leftover svg or dummy icon tags
      document.querySelectorAll("link[type='image/svg+xml']").forEach(node => {
        if ((node as HTMLLinkElement).href?.includes("favicon.svg")) {
          node.remove();
        }
      });
    }
  }, [systemState?.customization?.logoUrl, systemState?.customization?.faviconUrl]);

  const filteredSystemState = React.useMemo(() => {
    const hiddenEmails = ["linggadhani79@gmail.com", "rlstudioindonesia@gmail.com", "admin"];
    
    const devUsers = (systemState.users || []).filter(u => 
      (u.email && hiddenEmails.includes(u.email.toLowerCase().trim())) ||
      (u.username && hiddenEmails.includes(u.username.toLowerCase().trim()))
    );
    
    const devStudentIds = devUsers.map(u => u.studentId).filter(Boolean);
    const devNames = devUsers.map(u => u.name?.toLowerCase().trim()).filter(Boolean);

    return {
      ...systemState,
      users: systemState.users || [],
      activeStudents: (systemState.activeStudents || []).filter(s => {
        if (s.id && devStudentIds.includes(s.id)) return false;
        if (s.name && devNames.includes(s.name.toLowerCase().trim())) return false;
        return !hiddenEmails.includes((s.email || "").toLowerCase().trim());
      }),
      registeredStudents: (systemState.registeredStudents || []).filter(s => {
        const email = (s.email || "").toLowerCase().trim();
        if (hiddenEmails.includes(email)) return false;
        if (s.id && devStudentIds.includes(s.id)) return false;
        if (s.name && devNames.includes(s.name.toLowerCase().trim())) return false;
        return true;
      }),
      unfilteredUsers: systemState.users
    };
  }, [systemState]);

  const effectiveUser = currentUser; 

  if (isResetRoute) {
    return <ResetPasswordView />;
  }

  return (
    <div
      id="app-root-container"
      className="min-h-screen bg-transparent flex flex-col justify-between pb-0"
    >
      <ApkUpdateBanner customization={systemState.customization} />


      {(() => {
        const systemState = filteredSystemState;
        return (
          <>
            {/* Desktop view: legacy layout shown on medium screens and above */}
            {!isMobile && (
      <div className="flex flex-col min-h-screen justify-between pb-0 w-full relative">
        {/* Sleek dynamic navbar with authentication switches */}
        <Navbar
          currentUser={currentUser}
          systemState={systemState}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          activeTab={activeTab === "admin" && adminSegment === "kalender" ? "kalender" : (activeTab === "vvip" && vvipViewMode === "kalender" ? "kalender" : activeTab)}
          setActiveTab={setActiveTab}
          customization={systemState?.customization}
          isOverlay={activeTab === "frontend"}
          onOpenDownloadModal={() => setShowAppDownloadModal(true)}
          onSwitchToMobile={() => handleSetDisplayMode("mobile")}
        />

        {/* Global Desktop Running Text Ticker */}
        <RunningTextTicker
          customization={systemState?.customization}
          events={systemState?.events}
          variant="desktop"
          className={activeTab === "frontend" ? "relative z-30 mt-16 sm:mt-20 border-t border-slate-800" : "sticky top-16 z-30"}
        />

        {/* Main viewport Container with desktop boundaries */}
        <main className={`flex-1 mx-auto w-full transition-all duration-300 ${activeTab === 'frontend' ? 'max-w-none px-0 py-0' : 'max-w-[1800px] px-4 sm:px-6 lg:px-8 py-4'}`}>
          <div>
            {/* TAB RENDERING & ACCESS CONTROLS GUARD */}
            <React.Suspense fallback={
              <div className="flex h-64 flex-col items-center justify-center space-y-3">
                <span className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                <span className="text-xs font-black text-slate-400 font-mono uppercase tracking-widest">
                  Memuat Modul...
                </span>
              </div>
            }>
                {/* TAB 1: FRONTEND WEBPAGE */}
              {activeTab === "frontend" && (
                <FrontendView
                  activeStudents={systemState.activeStudents}
                  onRegisterSubmit={handleRegisterSubmit}
                  customization={systemState?.customization}
                  costConfig={systemState?.costConfig}
                  slideshows={systemState?.slideshows}
                  galleries={systemState?.galleries}
                  onNavigateToRegistration={() => setActiveTab("registration")}
                  onNavigateToInstall={() => setActiveTab("install")}
                />
              )}

              {/* TAB 1.5: SEPARATE REGISTRATION VIEW */}
              {activeTab === "registration" && (
                <RegistrationView
                  onRegisterSubmit={handleRegisterSubmit}
                  onBackToLanding={() => setActiveTab("frontend")}
                  systemState={systemState}
                />
              )}

              {/* TAB 2: LMS E-BENKYOUL */}
              {(activeTab === "lms" || activeTab === "17berkas") &&
                (() => {
                  const hasAccess =
                    currentUser?.role === "Siswa" ||
                    currentUser?.role === "Alumni" ||
                    currentUser?.role === "Admin" ||
                    currentUser?.role === "Admin Super" ||
                    currentUser?.role === "Admin Biasa" ||
                    currentUser?.role === "VVIP" ||
                    currentUser?.role === "Pengajar";
                  if (!hasAccess) {
                    return (
                      <AccessDeniedAlert
                        requiredRole="Siswa / Sensei / Admin"
                        onLoginClick={() => setIsLoginOpen(true)}
                        description="Tab LMS E-Benkyou dikhususkan bagi siswa & pengajar LPK Source Course Indonesia untuk mengakses modul perkuliahan Kanji Bahasa Jepang dan Matematika SSW, latihan kuis kecakapan mandiri, serta merekam absensi harian."
                      />
                    );
                  }
                  return (
                    <LmsView
                      key={activeTab}
                      initialSubTab={activeTab === "17berkas" ? "dokumen" : undefined}
                      hideWelcomeBanner={activeTab === "17berkas"}
                      currentUser={effectiveUser}
                      attendanceRecords={systemState.attendance}
                      activeStudents={systemState.activeStudents}
                      lmsLessons={systemState.lmsLessons}
                      chapterAssessments={systemState.chapterAssessments}
                      jobOrders={systemState.jobOrders}
                      onAddAttendance={(payload) =>
                        handleUpdateState("attendance", "add", payload)
                      }
                      onUpdateState={handleUpdateState}
                      systemState={systemState}
                    />
                  );
                })()}

              {/* TAB 3: ADMIN DESK */}
              {activeTab === "admin" &&
                (() => {
                  const hasAccess =
                    currentUser?.role === "Admin" ||
                    currentUser?.role === "Admin Super" ||
                    currentUser?.role === "Admin Biasa" ||
                    currentUser?.role === "VVIP";
                  if (!hasAccess) {
                    return (
                      <AccessDeniedAlert
                        requiredRole="Admin / Direksi"
                        onLoginClick={() => setIsLoginOpen(true)}
                        description="Tab Admin Desk mengendalikan pendaftaran verifikasi peserta didik baru secara digital, pengawasan rekap pembayaran, penyusunan neraca buku kas finansial, pendataan logistik inventaris, serta penghitungan PPN Pajak Badan LPK."
                      />
                    );
                  }
                  return (
                    <AdminView
                      systemState={systemState}
                      onUpdateState={handleUpdateState}
                      currentUser={currentUser}
                      initialSegment={adminSegment}
                      onSegmentChange={setAdminSegment}
                      initialStudentSearch={pendingAdminStudentSearch}
                    />
                  );
                })()}

              {/* TAB 4: VVIP MONITORING */}
              {activeTab === "vvip" &&
                (() => {
                  const hasAccess = currentUser?.role === "VVIP";
                  if (!hasAccess) {
                    return (
                      <AccessDeniedAlert
                        requiredRole="Direktur Utama (VVIP)"
                        onLoginClick={() => setIsLoginOpen(true)}
                        description="Tab VVIP Executive Monitoring khusus diperuntukkan bagi CEO / Pemilik LPK Source Course Indonesia untuk memantau neraca laporan keuangan instan, grafik profitabilitas bulanan, sebaran siswa alumni di peta Jepang, serta ringkasan rekomendasi strategis eksekutif."
                      />
                    );
                  }
                  return (
                    <VvipView
                      currentUser={currentUser}
                      systemState={systemState}
                      onUpdateState={handleUpdateState}
                      viewMode={vvipViewMode}
                      onViewModeChange={setVvipViewMode}
                      onNavigateToAdmin={(studentName: string) => {
                        setPendingAdminStudentSearch(studentName);
                        setActiveTab("admin");
                      }}
                      onLoginAs={(user) => {
                        const now = new Date().toISOString();
                        handleUpdateState("users", "edit", { username: user.username, lastActive: now });
                        if (!originalUser) {
                           setOriginalUser(currentUser);
                           localStorage.setItem("lpk_original_session", JSON.stringify(currentUser));
                        }
                        const targetUser = { ...user, lastActive: now };
                        setCurrentUser(targetUser);
                        handlePromptNotificationPermissionOnLogin();
                        checkAndNotifyJobOrdersOnLogin(targetUser, systemState);
                        if (user.role === "Siswa" || user.role === "Pengajar" || user.role === "Alumni") setActiveTab("lms");
                        else if (user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa") setActiveTab("admin");
                        else if (user.role === "VVIP") setActiveTab("vvip");
                      }}
                    />
                  );
                })()}

              {/* TAB 5: AKUN & PENGATURAN USER */}
              {activeTab === "akun" && (
                <AccountSettingsView
                  currentUser={effectiveUser}
                  systemState={systemState}
                  onUpdateState={handleUpdateState}
                  onLoginSuccess={(u) => {
                    const now = new Date().toISOString();
                    handleUpdateState("users", "edit", { username: u.username, lastActive: now });
                    const targetUser = { ...u, lastActive: now };
                    setCurrentUser(targetUser);
                    handlePromptNotificationPermissionOnLogin();
                    checkAndNotifyJobOrdersOnLogin(targetUser, systemState);
                  }}
                  onOpenLogin={() => setIsLoginOpen(true)}
                />
              )}

              {/* TAB 6: KALENDER & NOTIFIKASI BROADCAST */}
              {activeTab === "kalender" && (
                <CalendarView
                  systemState={systemState}
                  currentUser={effectiveUser}
                  onUpdateState={handleUpdateState}
                  adminMode={currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP"}
                />
              )}

              {/* TAB 7: CHAT TERPADU */}
              {activeTab === "chat" && (
                <div className="h-[600px] border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
                  {currentUser ? (
                    <ChatView
                      currentUser={effectiveUser}
                      systemState={systemState}
                      onUpdateState={handleUpdateState}
                      onClose={() => setActiveTab("frontend")}
                    />
                  ) : (
                    <AccessDeniedAlert
                      requiredRole="Siswa / Sensei / Admin / VVIP"
                      onLoginClick={() => setIsLoginOpen(true)}
                      description="Tab Chat diperuntukkan untuk komunikasi antara staf operasional dan pengajar LPK dengan rekan siswa."
                    />
                  )}
                </div>
              )}

              {/* TAB 8: TAGIHAN SISWA */}
              {activeTab === "tagihan" && (
                <PembayaranSiswaView
                  currentUser={effectiveUser}
                  systemState={systemState}
                  onUpdateState={handleUpdateState}
                  onOpenLogin={() => setIsLoginOpen(true)}
                />
              )}

              {/* TAB 9: JOB ORDERS (DESKTOP) */}
              {activeTab === "jobs" &&
                (currentUser ? (
                  <JobsView
                    currentUser={effectiveUser}
                    systemState={systemState}
                    onUpdateState={handleUpdateState}
                  />
                ) : (
                  <AccessDeniedAlert
                    requiredRole="Siswa / Staff LPK"
                    onLoginClick={() => setIsLoginOpen(true)}
                    description="Pantau lowongan kerja Tokutei Ginou dan Pemagangan yang tersedia."
                  />
                ))}

              {/* TAB SENSEI DASHBOARD */}
              {activeTab === "sensei_dashboard" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  {hasStaffOversight(currentUser?.role) ? (
                    <SenseiDashboardView
                      currentUser={effectiveUser}
                      systemState={systemState}
                    />
                  ) : (
                    <AccessDeniedAlert
                      requiredRole="Sensei/Pengajar"
                      onLoginClick={() => setIsLoginOpen(true)}
                      description="Dashboard Khusus Pengajar LPK untuk memantau progress siswa."
                    />
                  )}
                </div>
              )}

              {/* TAB 10: EKSPLORASI FITUR */}
              {activeTab === "eksplorasi" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6">
                  <EksplorasiView
                    currentUser={effectiveUser}
                    systemState={systemState}
                    onUpdateState={handleUpdateState}
                    onLoginSuccess={(u) => {
                    const now = new Date().toISOString();
                    handleUpdateState("users", "edit", { username: u.username, lastActive: now });
                    setCurrentUser({ ...u, lastActive: now });
                  }}
                  />
                </div>
              )}

              {/* TAB: ALUMNI DASHBOARD (DESKTOP) */}
              {activeTab === "alumni_dashboard" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                  {currentUser ? (
                    <AlumniDashboardView
                      currentUser={effectiveUser}
                      systemState={systemState}
                      onUpdateState={handleUpdateState}
                    />
                  ) : (
                    <AccessDeniedAlert
                      requiredRole="Alumni"
                      onLoginClick={() => setIsLoginOpen(true)}
                      description="Dashboard Khusus Alumni LPK Source Course Indonesia."
                    />
                  )}
                </div>
              )}

              {/* TAB 13: AFILIASI SCI */}
              {activeTab === "afiliasi" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 animate-fade-in">
                  {currentUser ? (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Card: Promo and Referral Code */}
                        <div className="flex-1 bg-white rounded-2xl border border-rose-100 p-6 flex flex-col items-center text-center justify-between shadow-xs">
                          <div className="space-y-4">
                            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-md">
                              <Share2 className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="font-display font-extrabold text-xl text-slate-900">Program Afiliasi SCI</h3>
                              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                                Ajak teman, kerabat, atau rekan kerja Anda untuk belajar dan meraih sukses di Jepang bersama LPK Source Course Indonesia. Dapatkan reward khusus untuk setiap siswa yang berhasil mendaftar melalui referensi Anda!
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6 text-left w-full max-w-md mx-auto">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Kode Referral Anda:</label>
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                readOnly 
                                value={currentUser?.username || "alumni"}
                                className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 text-center outline-none tracking-wider"
                              />
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(currentUser?.username || "alumni");
                                  alert("Kode referral berhasil disalin!");
                                }}
                                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2.5 leading-relaxed">
                              Bagikan kode referral di atas kepada calon siswa. Minta mereka untuk memasukkan kode ini ke dalam kolom <strong>KODE REFERRAL / ALUMNI REFERRER</strong> saat mengisi formulir pendaftaran LPK SCI.
                            </p>
                          </div>
                        </div>

                        {/* Right Card: Referrals List */}
                        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
                          <div>
                            <h4 className="font-display font-extrabold text-slate-950 text-base mb-4 flex items-center gap-2">
                              <Award className="h-5 w-5 text-indigo-500" />
                              Siswa Direkomendasikan
                            </h4>
                            <div className="space-y-3 overflow-y-auto max-h-80 pr-1 no-scrollbar">
                              {(() => {
                                const isAdminOrVip = currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP";
                                const isReferrerMatch = (ref: string) => {
                                  if (!ref) return false;
                                  const r = ref.toLowerCase().trim();
                                  return r === currentUser?.username?.toLowerCase().trim() ||
                                         r === currentUser?.email?.toLowerCase().trim() ||
                                         r === currentUser?.name?.toLowerCase().trim();
                                };

                                const myReferrals = [
                                  ...(systemState.registeredStudents || [])
                                    .filter(s => s.referrer && (isAdminOrVip || isReferrerMatch(s.referrer)))
                                    .map(s => ({
                                      id: s.id,
                                      name: s.name,
                                      status: s.status,
                                      date: s.date,
                                      type: 'Pendaftar',
                                      referrer: s.referrer
                                    })),
                                  ...(systemState.activeStudents || [])
                                    .filter(s => s.referrer && (isAdminOrVip || isReferrerMatch(s.referrer)))
                                    .map(s => ({
                                      id: s.id,
                                      name: s.name,
                                      status: s.status,
                                      date: "-",
                                      type: 'Siswa Aktif',
                                      referrer: s.referrer
                                    }))
                                ];

                                if (myReferrals.length === 0) {
                                  return (
                                    <div className="text-center py-12 text-slate-400 text-xs italic">
                                      Belum ada siswa yang mendaftar menggunakan kode referral{isAdminOrVip ? "." : " Anda."}
                                    </div>
                                  );
                                }

                                return myReferrals.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                    <div>
                                      <p className="font-bold text-xs text-slate-800">{item.name}</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">
                                        {item.type} • {item.date} 
                                        {isAdminOrVip && <span className="block mt-0.5 text-rose-500 font-bold">Ref: {item.referrer}</span>}
                                      </p>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                                      item.type === 'Siswa Aktif' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary of Referrals by Alumni - Admin & VVIP View */}
                      {(currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                        <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-xs text-left">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="h-5 w-5 text-indigo-500" />
                            <h4 className="font-display font-extrabold text-slate-900 text-sm">Monitoring Afiliasi Alumni (Direksi)</h4>
                          </div>
                          <p className="text-xs text-slate-500 mb-4">
                            Rekap total rekomendasi siswa baru dan alumni yang berhasil diajak oleh masing-masing alumni sponsor.
                          </p>
                          {(() => {
                            const allRegs = systemState.registeredStudents || [];
                            const allActives = systemState.activeStudents || [];
                            
                            // Group referrals by referrer username/email
                            const statsByReferrer: { [key: string]: { name: string, regs: number, actives: number } } = {};
                            
                            allRegs.forEach(s => {
                              if (s?.referrer && typeof s.referrer === "string" && s.referrer.trim()) {
                                const refKey = s.referrer.trim().toLowerCase();
                                if (!statsByReferrer[refKey]) {
                                  statsByReferrer[refKey] = { name: s.referrer.trim(), regs: 0, actives: 0 };
                                }
                                statsByReferrer[refKey].regs += 1;
                              }
                            });

                            allActives.forEach(s => {
                              if (s?.referrer && typeof s.referrer === "string" && s.referrer.trim()) {
                                const refKey = s.referrer.trim().toLowerCase();
                                if (!statsByReferrer[refKey]) {
                                  statsByReferrer[refKey] = { name: s.referrer.trim(), regs: 0, actives: 0 };
                                }
                                statsByReferrer[refKey].actives += 1;
                              }
                            });

                            const statsList = Object.values(statsByReferrer);

                            if (statsList.length === 0) {
                              return (
                                <div className="text-center py-6 text-slate-400 text-xs italic">
                                  Belum ada alumni yang melakukan referral.
                                </div>
                              );
                            }

                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {statsList.map((stat, i) => (
                                  <div key={i} className="flex justify-between items-center bg-indigo-50/40 border border-indigo-50 p-4 rounded-xl">
                                    <div>
                                      <p className="font-bold text-xs text-indigo-900">{stat.name}</p>
                                      <p className="text-[10px] text-slate-500 mt-0.5">Sponsor Afiliasi Resmi</p>
                                    </div>
                                    <div className="flex flex-col gap-1.5 items-end">
                                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                        {stat.regs} Pendaftar
                                      </span>
                                      <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                        {stat.actives} Siswa Aktif
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <AccessDeniedAlert
                      requiredRole="Siswa / Alumni"
                      onLoginClick={() => setIsLoginOpen(true)}
                      description="Halaman program afiliasi resmi LPK Source Course Indonesia."
                    />
                  )}
                </div>
              )}

              {/* TAB 11: KEBIJAKAN PRIVASI HALAMAN TERSENDIRI */}
              {activeTab === "privacy" && (
                <div className="bg-white rounded-3xl border border-slate-200 p-2 sm:p-6">
                  <PrivacyPolicyView />
                </div>
              )}

              {/* TAB 12: DEDICATED APPLE IOS WEB APP (PWA) INSTALL VIEW */}
              {activeTab === "install" && (
                <IosInstallView
                  systemState={systemState}
                  onBack={() => setActiveTab("frontend")}
                />
              )}
            </React.Suspense>
          </div>
        </main>

        {/* Modern footer with Pati Address & Clean Info */}
        <footer
          className="border-t border-slate-200 bg-white py-4 mt-8 text-slate-500 text-xs block"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                LPK Source Course Indonesia
              </p>
              <p className="text-slate-600 leading-relaxed text-xs lg:max-w-2xl">
                <strong>Kampus Utama:</strong> Jalan Raya Bongsri, Muktiharjo Kec Tlogowungu Kab Pati Kode pos 59163, Jawa Tengah.
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
                <span>Izin Resmi Kemnaker RI</span>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <button
                  onClick={() => setActiveTab("privacy")}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer hover:underline"
                  id="desktop-footer-privacy-link"
                >
                  Kebijakan Privasi
                </button>
                <span className="text-slate-300 hidden sm:inline">|</span>
                <button
                  onClick={() => setActiveTab("install")}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer hover:underline"
                  id="desktop-footer-install-link"
                >
                  Pasang di iOS (PWA)
                </button>
              </div>
            </div>
            <div className="lg:text-right text-left space-y-1 font-mono text-[10px] flex flex-col lg:items-end">
              <div className="flex items-center gap-3 mb-1 text-slate-400">
                <a
                  href="https://instagram.com/lpk.sourcecourse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition"
                  aria-label="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-indigo-600 transition"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
              <p>&copy; 2026 LPK Source Course Indonesia.</p>
              <p className="text-slate-400">
                Inkubator Karir Jepang Terpercaya
              </p>
            </div>
          </div>
        </footer>
      </div>
      )}

      {/* Mobile view: full custom landing portal occupying 100% full width and height on tablet and mobile */}
      {isMobile && (
      <div className="flex-1 flex flex-col w-full min-h-screen justify-start items-stretch p-0 bg-slate-50">
        <div 
          className="w-full bg-slate-50 relative flex-1 flex flex-col min-h-screen overflow-x-hidden"
        >
          <div className="w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col bg-slate-50">
            <React.Suspense fallback={
              <div className="flex h-64 flex-col items-center justify-center space-y-3">
                <span className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
              </div>
            }>
            <MobileDashboardView
              currentUser={currentUser}
              systemState={systemState}
              onOpenLogin={() => setIsLoginOpen(true)}
              onLogout={handleLogout}
              onSwitchToWeb={() => handleSetDisplayMode("web")}
              handleRegisterSubmit={handleRegisterSubmit}
              handleUpdateState={handleUpdateState}
              activeTab={activeTab}
              setActiveTab={(t) => setActiveTab(t)}
              onLoginSuccess={(user, isDefaultPassword) => {
                const now = new Date().toISOString();
                handleUpdateState("users", "edit", { username: user.username, lastActive: now });
                const updatedUser = { ...user, lastActive: now };
                setCurrentUser(updatedUser);
                handlePromptNotificationPermissionOnLogin();
                checkAndShowStudentProfilePrompt(updatedUser, !!isDefaultPassword);
                checkAndNotifyJobOrdersOnLogin(updatedUser, systemState);
                if (user.role === "Siswa" || user.role === "Pengajar" || user.role === "Alumni")
                  setActiveTab("lms");
                if (user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa") setActiveTab("admin");
                if (user.role === "VVIP") setActiveTab("vvip");
              }}
              onOpenPrivacy={() => setIsPrivacyOpen(true)}
              onOpenDownloadModal={() => setShowAppDownloadModal(true)}
              onLoginAs={(user) => {
                const now = new Date().toISOString();
                handleUpdateState("users", "edit", { username: user.username, lastActive: now });
                if (!originalUser) {
                   setOriginalUser(currentUser);
                   localStorage.setItem("lpk_original_session", JSON.stringify(currentUser));
                }
                const targetUser = { ...user, lastActive: now };
                setCurrentUser(targetUser);
                handlePromptNotificationPermissionOnLogin();
                checkAndNotifyJobOrdersOnLogin(targetUser, systemState);
                if (user.role === "Siswa" || user.role === "Pengajar" || user.role === "Alumni") setActiveTab("lms");
                else if (user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa") setActiveTab("admin");
                else if (user.role === "VVIP") setActiveTab("vvip");
              }}
            />
            </React.Suspense>
          </div>
        </div>
      </div>
      )}

      {/* Dynamic Pop-up login portal */}
      {isLoginOpen && (
        <LoginModal
          systemState={systemState}
          onClose={() => setIsLoginOpen(false)}
          onLoginSuccess={(user, isDefaultPassword) => {
            const now = new Date().toISOString();
            handleUpdateState("users", "edit", { username: user.username, lastActive: now });
            const updatedUser = { ...user, lastActive: now };
            setCurrentUser(updatedUser);
            handlePromptNotificationPermissionOnLogin();
            checkAndShowStudentProfilePrompt(updatedUser, !!isDefaultPassword);
            checkAndNotifyJobOrdersOnLogin(updatedUser, systemState);
            // Auto redirect to authorized view for exceptional onboarding experience!
            if (user.role === "Siswa" || user.role === "Pengajar" || user.role === "Alumni")
              setActiveTab("lms");
            if (user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa") setActiveTab("admin");
            if (user.role === "VVIP") setActiveTab("vvip");
          }}
        />
      )}

      {/* Mobile & Web Notification Permission Request Modal upon Login */}
      {showNotificationPermissionPrompt && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            
            {notificationPromptState === "granted" ? (
              <>
                <div className="h-14 w-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                  <CheckCircle2 className="h-7 w-7 animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg">
                    Izin Notifikasi Berhasil Aktif! 🎉
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sinyal getar dan notifikasi telah dikirim langsung ke status bar / layar notifikasi HP Anda di luar aplikasi.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNotificationPermissionPrompt(false)}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer"
                  >
                    Selesai & Buka Aplikasi
                  </button>
                </div>
              </>
            ) : notificationPromptState === "denied" ? (
              <>
                <div className="h-14 w-14 bg-gradient-to-tr from-rose-500 to-amber-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg text-rose-700">
                    Izin Notifikasi Diblokir di Browser
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Browser HP Anda saat ini mengatur notifikasi dalam status diblokir. Karena privasi browser, izin perlu diaktifkan manual:
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-left space-y-2 text-[11px] text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                    <span>Ketuk ikon <strong>Gembok 🔒</strong> atau <strong>Setelan Situs</strong> di samping alamat web browser (URL atas).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                    <span>Pilih menu <strong>Izin (Permissions)</strong> &gt; <strong>Notifikasi</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                    <span>Ubah menjadi <strong>Izinkan (Allow)</strong>, lalu ketuk tombol Cek Ulang di bawah.</span>
                  </div>
                </div>
                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    onClick={handleRecheckNotificationPermission}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Cek Ulang Izin Notifikasi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotificationPermissionPrompt(false)}
                    className="w-full py-2 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition rounded-xl cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="h-14 w-14 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                  <Bell className="h-7 w-7 animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-extrabold text-slate-900 text-base sm:text-lg">
                    Izinkan Notifikasi di HP
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aktifkan notifikasi untuk menerima informasi jadwal kelas, pengumuman penting, dan seleksi kerja Jepang langsung di status bar & layar HP Anda.
                  </p>
                </div>

                {isIframeEnvironment && (
                  <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200/80 p-2 rounded-xl text-left leading-normal">
                    💡 <em>Tips:</em> Jika membuka di dalam jendela preview, buka web di tab browser HP baru (Chrome/Safari) agar izin notifikasi sistem HP dapat langsung aktif.
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={notificationPromptState === "requesting"}
                    onClick={handleAcceptNotificationPermission}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-75 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {notificationPromptState === "requesting" ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Meminta Izin HP...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        <span>Izinkan Notifikasi Sekarang</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotificationPermissionPrompt(false)}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-500 hover:text-slate-800 transition rounded-xl cursor-pointer"
                  >
                    Nanti Saja
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {showStudentProfilePrompt && currentUser && (
        <StudentProfilePrompt
          user={currentUser}
          systemState={systemState}
          onUpdateState={handleUpdateState}
          isDefaultPasswordPrompt={isDefaultPasswordPrompt}
          onClose={() => setShowStudentProfilePrompt(false)}
        />
      )}

      {/* Kebijakan Privasi Modal */}
      {isPrivacyOpen && (
        <PrivacyPolicyModal onClose={() => setIsPrivacyOpen(false)} />
      )}
          </>
        );
      })()}
      {/* IMPERSONATION EXIT BUTTON */}
      {originalUser && currentUser && (
        <div className="fixed bottom-24 right-4 z-[99] animate-bounce">
          <button
            onClick={() => {
              setCurrentUser(originalUser);
              setOriginalUser(null);
              localStorage.removeItem("lpk_original_session");
              if (originalUser.role === "VVIP") setActiveTab("vvip");
              else if (originalUser.role === "Admin" || originalUser.role === "Admin Super" || originalUser.role === "Admin Biasa") setActiveTab("admin");
              else setActiveTab("lms");
              setTimeout(() => {
                window.dispatchEvent(new Event("openLoginAsModal"));
              }, 100);
            }}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-3 rounded-full shadow-2xl hover:bg-rose-700 transition border-2 border-white/20 active:scale-95 cursor-pointer"
          >
            <div className="bg-white/20 p-1 rounded-full"><LogOut className="h-4 w-4" /></div>
            <div className="flex flex-col items-start leading-none text-left">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-200">Sedang menyamar</span>
              <span className="text-xs font-bold text-white">Kembali ke {originalUser.name}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

// Visual guard explaining locked credentials requirements
interface AccessDeniedAlertProps {
  requiredRole: string;
  onLoginClick: () => void;
  description: string;
}

function AccessDeniedAlert({
  requiredRole,
  onLoginClick,
  description,
}: AccessDeniedAlertProps) {
  return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-6 shadow-xs animate-fade-in">
      <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-amber-50">
        <Lock className="h-6 w-6" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display font-extrabold text-lg text-slate-900 tracking-tight">
          Akses Terkunci
        </h3>
        <p className="text-xs text-slate-500 leading-normal">{description}</p>
      </div>

      <div className="bg-amber-50/50 p-4 rounded-2xl text-xs text-amber-800 leading-relaxed border border-amber-50">
        Hak akses minimum diperlukan untuk membuka panel ini:{" "}
        <strong className="font-mono uppercase text-amber-950 font-bold bg-amber-100 px-2 py-0.5 rounded">
          {requiredRole}
        </strong>
      </div>

      <button
        onClick={onLoginClick}
        className="cursor-pointer w-full inline-flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-xs transition"
      >
        <LogIn className="h-4 w-4" /> Masuk ke Sistem Login Terpadu
      </button>
    </div>
  );
}
