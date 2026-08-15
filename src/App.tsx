/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { auth } from "./firebaseClient";
import { getRedirectResult } from "firebase/auth";
import React, { useState, useEffect, useRef } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 1024px)").matches
      : false
  );

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

import Navbar from "./components/Navbar";
import { SystemState, UserAccount, RegisteredStudent } from "./types";
import {
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
} from "lucide-react";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import LoginModal from "./components/LoginModal";
import StudentProfilePrompt from "./components/StudentProfilePrompt";
import ResetPasswordView from "./components/ResetPasswordView";
import PembayaranSiswaView from "./components/PembayaranSiswaView";
import JobsView from "./components/JobsView";
import EksplorasiView from "./components/EksplorasiView";

function safeLazy<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return React.lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      console.warn("Retrying dynamic module import failure:", error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return await factory();
      } catch (retryError) {
        const key = "chunk_failed_reload";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "true");
          window.location.reload();
        }
        throw retryError;
      }
    }
  });
}

const FrontendView = safeLazy(() => import("./components/FrontendView"));
const LmsView = safeLazy(() => import("./components/LmsView"));
const AdminView = safeLazy(() => import("./components/AdminView"));
const VvipView = safeLazy(() => import("./components/VvipView"));
const AccountSettingsView = safeLazy(() => import("./components/AccountSettingsView"));
const CalendarView = safeLazy(() => import("./components/CalendarView"));
const ChatView = safeLazy(() => import("./components/ChatView"));
const RegistrationView = safeLazy(() => import("./components/RegistrationView"));
const PrivacyPolicyView = safeLazy(() => import("./components/PrivacyPolicyView"));
const AlumniDashboardView = safeLazy(() => import("./components/AlumniDashboardView"));
const SenseiDashboardView = safeLazy(() => import("./components/SenseiDashboardView"));
const IosInstallView = safeLazy(() => import("./components/IosInstallView"));
// The mobile app shell is a very large component (dashboard, admin/VVIP panels,
// chat, calendar, LMS, CV editor, etc.) - lazy-loading it keeps the initial
// bundle small for every first-time mobile visitor, not just logged-in ones.
// It already renders inside a <React.Suspense> boundary at its call site below.
const MobileDashboardView = safeLazy(() => import("./components/MobileDashboardView"));

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
    // Parse referral code on mount and save to localStorage
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get("ref") || params.get("referral") || params.get("code");
      if (refCode) {
        localStorage.setItem("lpk_referral_code", refCode);
      }
    }
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

  // Synchronized Full-Stack State
  const [systemState, setSystemState] = useState<SystemState>({
    registeredStudents: [],
    activeStudents: [],
    attendance: [],
    payments: [],
    inventory: [],
    taxes: [],
    users: [],
    lmsLessons: [],
    chapterAssessments: [],
  });

  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);

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

      isMissingBirthDate = !existingBirthDate || existingBirthDate === "-" || existingBirthDate.trim() === "";
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
    }
  }, [currentUser?.username, isLoadingState]);

  // Load backend state on initialization with automatic retries for cold starts
  const isFetchingStateRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchState = async (retryCount = 0) => {
    if (isFetchingStateRef.current && retryCount === 0) return;
    isFetchingStateRef.current = true;
    try {
      const response = await fetch("/api/state");
      if (response.ok) {
        const data = await response.json();
        const hasStudents = Array.isArray(data?.activeStudents) && data.activeStudents.length > 0;
        const hasUsers = Array.isArray(data?.users) && data.users.length > 3;
        const isServerReady = data?._isReady !== false;

        setSystemState((prevState) => {
          if (!data) return prevState;
          const safeData: any = { ...data };
          const arrayKeys = [
            "activeStudents", "registeredStudents", "users", "attendance",
            "payments", "inventory", "taxes", "events", "jobOrders",
            "lmsLessons", "lmsQuizzes", "lmsComments", "chapterAssessments",
            "messages", "logs", "salaries", "cashLedger", "teacherLeaves",
            "teacherReports", "teacherContracts", "lmsClasses"
          ];
          arrayKeys.forEach((key) => {
            const prevArr = prevState[key as keyof typeof prevState];
            if ((!safeData[key] || safeData[key].length === 0) && Array.isArray(prevArr) && prevArr.length > 0) {
              safeData[key] = prevArr;
            }
          });
          return safeData;
        });
        lastFetchTimeRef.current = Date.now();
        setIsLoadingState(false);

        // If server indicated it was not yet ready or returned empty dataset during cold start, retry in 1.5s
        if ((!isServerReady || (!hasStudents && !hasUsers)) && retryCount < 10) {
          setTimeout(() => fetchState(retryCount + 1), 1500);
        }
      } else {
        if (retryCount < 5) {
          setTimeout(() => fetchState(retryCount + 1), (retryCount + 1) * 1500);
        } else {
          setIsLoadingState(false);
        }
      }
    } catch (error) {
      if (retryCount < 4) {
        setTimeout(() => fetchState(retryCount + 1), (retryCount + 1) * 1500);
      } else {
        if (error instanceof TypeError && error.message === "Failed to fetch") {
          console.warn("Polling state: server temporarily unreachable, retrying in background...");
        } else {
          console.error("Unable to connect to synchronized server database:", error);
        }
        setIsLoadingState(false);
      }
    } finally {
      isFetchingStateRef.current = false;
    }
  };

  useEffect(() => {
    fetchState();

    // Refresh state periodically. /api/state currently returns the full
    // synchronized dataset (several MB, since uploaded photos/documents are
    // embedded as base64 rather than living in Storage) - every open tab
    // re-downloading and re-serializing that on a tight interval directly
    // drives up Cloud Run CPU-time and egress cost. Widening the interval to
    // 60s, and skipping the tick entirely while the tab is in the background,
    // cuts that recurring cost substantially; focus/visibility/online
    // listeners below still refetch immediately when the tab becomes active.
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchState();
      }
    }, 60000);

    const triggerDebouncedFetch = () => {
      const now = Date.now();
      // Only fetch on focus if at least 10 seconds have passed since last fetch
      if (now - lastFetchTimeRef.current > 10000) {
        fetchState();
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

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", triggerDebouncedFetch);
      window.removeEventListener("online", triggerDebouncedFetch);
      window.removeEventListener("pageshow", triggerDebouncedFetch);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
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
      const response = await fetch("/api/state/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataType, action, payload, userRole: currentUser?.role, actingUserName: currentUser?.name }),
      });
      if (response.ok) {
        const resData = await response.json().catch(() => null);
        // Refresh client database silently in the background
        fetchState().catch(() => {});
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

  const isMobile = useIsMobile();

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
    const rawIcon = systemState?.customization?.faviconUrl || systemState?.customization?.logoUrl || "/logo.png";
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
    const hiddenEmails = ["linggadhani79@gmail.com", "rlstudioindonesia@gmail.com", "linggadhani95@gmail.com", "admin"];
    
    const devUsers = (systemState.users || []).filter(u => 
      (u.email && hiddenEmails.includes(u.email.toLowerCase().trim())) ||
      (u.username && hiddenEmails.includes(u.username.toLowerCase().trim()))
    );
    
    const devStudentIds = devUsers.map(u => u.studentId).filter(Boolean);
    const devNames = devUsers.map(u => u.name?.toLowerCase().trim()).filter(Boolean);

    return {
      ...systemState,
      users: (systemState.users || []).filter(u => {
        const email = (u.email || u.username || "").toLowerCase().trim();
        return !hiddenEmails.includes(email);
      }),
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
                  const hasAccess = currentUser?.role === "VVIP" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super";
                  if (!hasAccess) {
                    return (
                      <AccessDeniedAlert
                        requiredRole="Direktur Utama (VVIP)"
                        onLoginClick={() => setIsLoginOpen(true)}
                        description="Tab VVIP Executive Monitoring khusus diperuntukkan bagi CEO / Pemilik LPK Source Course Indonesia untuk memantau neraca laporan keuangan instan, grafik profitabilitas bulanan, sebaran siswa alumni di peta Jepang, serta konsultasi program model cerdas Gemini AI."
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
                        setCurrentUser({ ...user, lastActive: now });
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
                    setCurrentUser({ ...u, lastActive: now });
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
                  {currentUser ? (
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
                              if (s.referrer) {
                                const refKey = s.referrer.trim().toLowerCase();
                                if (!statsByReferrer[refKey]) {
                                  statsByReferrer[refKey] = { name: s.referrer, regs: 0, actives: 0 };
                                }
                                statsByReferrer[refKey].regs += 1;
                              }
                            });

                            allActives.forEach(s => {
                              if (s.referrer) {
                                const refKey = s.referrer.trim().toLowerCase();
                                if (!statsByReferrer[refKey]) {
                                  statsByReferrer[refKey] = { name: s.referrer, regs: 0, actives: 0 };
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

      {/* Mobile view: full custom landing portal as requested */}
      {isMobile && (
      <div className="flex-1 flex flex-col w-full bg-slate-100/80 sm:p-8 justify-center items-center">
        <div 
          className="w-full bg-slate-50 relative flex-1 flex flex-col max-w-[414px] sm:max-h-[896px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden sm:rounded-[3rem] sm:border-[8px] sm:border-white ring-1 ring-slate-200/50"
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

              handleRegisterSubmit={handleRegisterSubmit}
              handleUpdateState={handleUpdateState}
              activeTab={activeTab}
              setActiveTab={(t) => setActiveTab(t)}
              onLoginSuccess={(user, isDefaultPassword) => {
                const now = new Date().toISOString();
                handleUpdateState("users", "edit", { username: user.username, lastActive: now });
                const updatedUser = { ...user, lastActive: now };
                setCurrentUser(updatedUser);
                checkAndShowStudentProfilePrompt(updatedUser, !!isDefaultPassword);
                if (user.role === "Siswa" || user.role === "Pengajar")
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
                setCurrentUser({ ...user, lastActive: now });
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
            checkAndShowStudentProfilePrompt(updatedUser, !!isDefaultPassword);
            // Auto redirect to authorized view for exceptional onboarding experience!
            if (user.role === "Siswa" || user.role === "Pengajar")
              setActiveTab("lms");
            if (user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa") setActiveTab("admin");
            if (user.role === "VVIP") setActiveTab("vvip");
          }}
        />
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
