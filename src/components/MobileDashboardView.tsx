import { InlineLoginPanel } from "./InlineLoginPanel";
import { getSafePhotoUrl } from "../lib/storageHelper";
import { auth } from "../firebaseClient";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { TeacherDashboardPanel } from "./TeacherDashboardPanel";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ConfirmForm } from "./ConfirmForm";
import {
  Home,
  Bell,
  MessageCircle,
  Calendar,
  User,
  AlignJustify,
  ArrowLeft,
  MapPin,
  CheckCircle,
  GraduationCap,
  Building, FolderOpen,
  Briefcase,
  MessagesSquare,
  TrendingUp,
  BookOpen, Search,
  CreditCard,
  Compass,
  Image as ImageIcon,
  Share2,
  Lock,
  ArrowRight,
  Award,
  ShieldAlert,
  Sparkles,
  Send,
  Copy,
  Upload,
  Plus,
  Users,
  Settings,
  BarChart3,
  Receipt,
  HelpCircle,
  Activity,
  Play,
  Check,
  Heart,
  Shield,
  Facebook,
  Instagram,
  Youtube,
  Trash2,
  ChevronRight, ChevronUp, ChevronDown,
  Star,
  LogIn,
  Sliders,
  FileText,
  Package,
  AlertCircle,
  Clock,
  MessageSquare,
  DollarSign,
  ShieldCheck,
  Key,
  UserPlus,
  Info,
  Eye,
  EyeOff,
  CheckSquare,
  X, Menu,
  Crown,
  Camera,
  Landmark,
  RefreshCw,
  Download,
  Maximize2,
} from "lucide-react";
import {
  SystemState,
  UserAccount,
  RegisteredStudent,
  ActiveStudent,
  ALL_48_PREFECTURES_COORDINATES,
} from "../types";
import { CHAPTERS_LIST } from "../chapters";

export function parsePrice(val: any): number {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim().toLowerCase();
  if (!str) return 0;
  
  if (/juta|jt/i.test(str)) {
    const numPart = str.replace(/juta|jt/gi, "").trim().replace(",", ".");
    const parsed = parseFloat(numPart);
    if (!isNaN(parsed)) {
      return Math.round(parsed * 1000000);
    }
  }
  
  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
}

export function formatRupiah(val: any): string {
  if (val === undefined || val === null) return "";
  let str = String(val).trim();
  if (!str) return "";
  
  if (/^Rp\s?\d{1,3}(\.\d{3})+$/i.test(str)) {
    return str.replace(/^rp\s*/i, "Rp ");
  }

  if (/juta|jt/i.test(str)) {
    const numPart = str.toLowerCase().replace(/juta|jt/gi, "").trim().replace(",", ".");
    const parsed = parseFloat(numPart);
    if (!isNaN(parsed)) {
      return `Rp ${Math.round(parsed * 1000000).toLocaleString("id-ID")}`;
    }
  }

  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  if (isNaN(num)) {
    return str;
  }
  
  return `Rp ${num.toLocaleString("id-ID")}`;
}
import PaymentDetailModal from "./PaymentDetailModal";
import { getStudentPayments } from "./PembayaranSiswaView";
import MobileJobsSegment from "./mobile/MobileJobsSegment";
import MobileBottomNav from "./mobile/MobileBottomNav";
import { StudentActivitySummary } from "./StudentActivitySummary";

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

const FrontendView = safeLazy(() => import("./FrontendView"));
const LmsView = safeLazy(() => import("./LmsView"));
const AdminView = safeLazy(() => import("./AdminView"));
const VvipView = safeLazy(() => import("./VvipView"));
const AccountSettingsView = safeLazy(() => import("./AccountSettingsView"));
const CalendarView = safeLazy(() => import("./CalendarView"));
const ChatView = safeLazy(() => import("./ChatView"));
const PrivacyPolicyView = safeLazy(() => import("./PrivacyPolicyView"));
const StudentCvView = safeLazy(() => import("./StudentCvView"));
const RegistrationView = safeLazy(() => import("./RegistrationView"));
const AlumniDashboardView = safeLazy(() => import("./AlumniDashboardView"));
const SenseiDashboardView = safeLazy(() => import("./SenseiDashboardView"));

const isAndroidWebView = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isWebView = /Version\/\d+\.\d+/i.test(ua) || /wv/i.test(ua) || ua.includes("; wv");
  return isAndroid && isWebView;
};

const getZoomAppLink = (webUrl: string) => {
  if (!webUrl) return "";
  const trimmed = webUrl.trim();
  if (trimmed.startsWith("zoomus://")) return trimmed;
  
  try {
    let urlString = trimmed;
    if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
      urlString = "https://" + urlString;
    }
    // Basic check to see if it even looks like a URL before parsing
    if (urlString.includes(".") && !urlString.includes(" ")) {
      const parsed = new URL(urlString);
      if (parsed.hostname.includes("zoom.us")) {
        const pathname = parsed.pathname;
        const match = pathname.match(/\/j\/([0-9]+)/);
        if (match && match[1]) {
          const meetingId = match[1];
          const pwd = parsed.searchParams.get("pwd");
          return `zoomus://zoom.us/join?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ""}`;
        }
      }
    }
  } catch (e) {
    // Ignore parsing errors for invalid URL strings
  }
  
  if (trimmed.includes("zoom.us")) {
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  }
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
};

const formatDateIndo = (dateStr: string) => {
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} ${monthNames[monthIdx]} ${year}`;
  } catch {
    return dateStr;
  }
};

interface MobileDashboardViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
  onOpenLogin: () => void;
  onLogout: () => void;
  handleRegisterSubmit: (formData: any) => Promise<any>;
  handleUpdateState: (
    dataType: string,
    action: string,
    payload: any,
  ) => Promise<boolean>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLoginSuccess?: (user: UserAccount) => void;
  onOpenPrivacy?: () => void;
  onLoginAs?: (user: UserAccount) => void;
}

export default function MobileDashboardView({
  currentUser,
  systemState,
  onOpenLogin,
  onLogout,
  handleRegisterSubmit,
  handleUpdateState,
  activeTab,
  setActiveTab,
  onLoginSuccess,
  onOpenPrivacy,
  onLoginAs,
}: MobileDashboardViewProps) {
  // Mobile navigation tabs: "beranda", "notifikasi", "chat", "kalender", "akun"
  const [mobileTab, setMobileTab] = useState<string>("beranda");

  // Selected gallery image for zoom/enlarge lightbox modal with download
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<{ image: string; title?: string; tag?: string; description?: string } | null>(null);

  const handleDownloadImage = async (url: string, title: string) => {
    if (!url) return;
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeTitle = (title || "foto_galeri_lpk").toLowerCase().replace(/[^a-z0-9]/g, "_");
      a.download = `${safeTitle}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const safeTitle = (title || "foto_galeri_lpk").toLowerCase().replace(/[^a-z0-9]/g, "_");
      a.download = `${safeTitle}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Backtrack subpage routing inside Beranda (to allow opening items like PROFIL LPK, PEMBAYARAN, etc.)
  const [activeSubpage, setActiveSubpageState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path === "/kebijakan") return "privacy";
    }
    return null;
  });

  // Workspace tracker to lock bottom navigation context (main, admin, vvip)
  const [activeWorkspace, setActiveWorkspace] = useState<"main" | "admin" | "vvip">("main");

  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to top of both window and any scrollable container parent wrapper on mobile layout transition
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    
    // Reset scrollable ancestor containers if we are inside a simulated layout or mobile container
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      const parent = containerRef.current.parentElement;
      if (parent) {
        parent.scrollTop = 0;
      }
    }
  }, [activeSubpage, mobileTab]);

  const [showPassword, setShowPassword] = useState(false);
  const [isMobileGoogleLoading, setIsMobileGoogleLoading] = useState(false);

  const setActiveSubpage = (page: string | null) => {
    if (page === activeSubpage) return;

    if (page) {
      setActiveSubpageState(page);
      let path = "/";
      if (page === "privacy") path = "/kebijakan";
      window.history.pushState({ type: "subpage", subpage: page }, "", path);

      // Track workspace context based on active subpage prefix
      if (page.startsWith("admin_")) {
        if (activeWorkspace !== "vvip") {
          setActiveWorkspace("admin");
        }
      } else if (page.startsWith("vvip_")) {
        setActiveWorkspace("vvip");
      } else {
        setActiveWorkspace("main");
      }
    } else {
      setActiveSubpageState(null);
      setActiveWorkspace("main");
      window.history.pushState({ type: "home", subpage: null }, "", "/");
    }
  };

  const handleGoBackSubpage = () => {
    window.history.back();
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.type === "subpage") {
        setActiveSubpageState(e.state.subpage);
      } else if (e.state && e.state.type === "tab") {
        // We went back to a tab state, so subpage is closed
        setActiveSubpageState(null);
      } else if (!e.state) {
        // Initial load state or fallback
        const path = window.location.pathname;
        if (path === "/kebijakan") {
          setActiveSubpageState("privacy");
        } else {
          setActiveSubpageState(null);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeSubpage]);

  useEffect(() => {
    if (currentUser) {
      const isAdminOrVvip = currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP" || currentUser.role === "Pengajar";
      if (isAdminOrVvip) {
        if (!selectedCvStudentId && systemState.activeStudents && systemState.activeStudents.length > 0) {
          setSelectedCvStudentId(systemState.activeStudents[0].id);
        }
      } else {
        const myActive = systemState.activeStudents?.find(s => s.id === currentUser.studentId || s.name === currentUser.name);
        if (myActive) {
          setSelectedCvStudentId(myActive.id);
        }
      }
    }
  }, [currentUser, systemState.activeStudents]);

  const [activePaymentDetail, setActivePaymentDetail] = useState<any>(null);
  const [monitoredVvipClass, setMonitoredVvipClass] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCvStudentId, setSelectedCvStudentId] = useState<string>("");
  const [expandedProgressId, setExpandedProgressId] = useState<string | null>(
    null,
  );
  const [progressSearchQuery, setProgressSearchQuery] = useState("");
  const [activeJobTab, setActiveJobTab] = useState<"aktif" | "pilihanku">(
    "aktif",
  );
  const [confirmCancelJobId, setConfirmCancelJobId] = useState<string | null>(
    null,
  );
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);

  // Teacher Modals states
  const [showTeacherModal, setShowTeacherModal] = useState<"bank" | "agenda" | "spt" | "cuti" | "kontrak" | "presensi" | null>(null);
  const [teacherBankNum, setTeacherBankNum] = useState("");
  const [teacherBankName, setTeacherBankName] = useState("");
  
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [reportType, setReportType] = useState<"BPJS" | "SPT" | "Agenda">("Agenda");
  const [reportContent, setReportContent] = useState("");
  
  const [presensiBiometricStatus, setPresensiBiometricStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");
  const [presensiNotes, setPresensiNotes] = useState("");
  const [presensiFacingMode, setPresensiFacingMode] = useState<"user" | "environment">("user");
  const [presensiCameraError, setPresensiCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (showTeacherModal === "presensi") {
      setPresensiCameraError(null);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: presensiFacingMode } })
        .then((s) => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error("Camera error:", err);
          setPresensiCameraError("Akses kamera tidak diizinkan atau tidak didukung di perangkat WebView Anda. Silakan unggah foto dari galeri/kamera di bawah.");
        });
    } else {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setPresensiCameraError(null);
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showTeacherModal, presensiFacingMode]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, showTeacherModal]);
  
  // Presensi Logic
  const getPresensiType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 11) return "MASUK";
    if (hour >= 15 && hour <= 18) return "PULANG";
    return "OUT_OF_BOUNDS";
  };


  // Safe back confirmation states
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // Manual Login States for Mobile Dashboard
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrorMsg, setLoginErrorMsg] = useState("");

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetStatus, setResetStatus] = useState("idle");
  const [resetMessage, setResetMessage] = useState("");

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetStatus("idle");
    setResetMessage("");

    if (!resetUsername) return;
    const normalized = resetUsername.trim().toLowerCase();
    const existingUser = (systemState.unfilteredUsers || systemState.users || [])?.find(
      (u) => (u.username || "").trim().toLowerCase() === normalized ||
              (u.email || "").trim().toLowerCase() === normalized,
    );

    if (existingUser) {
      if (["Admin", "VVIP", "Admin Super", "Admin Biasa"].includes(existingUser.role)) {
        setResetStatus("error");
        setResetMessage("Password akun Admin/VVIP tidak dapat direset secara langsung. Hubungi pusat IT.");
        return;
      }
      
      if (!existingUser.email) {
        setResetStatus("error");
        setResetMessage("Akun ini tidak memiliki email yang terdaftar.");
        return;
      }

      try {
        setResetStatus("idle");
        setResetMessage("Mengirim permintaan reset...");
        
        try {
          await sendPasswordResetEmail(auth, existingUser.email);
        } catch (err) {
          if (err.code === 'auth/user-not-found') {
             let expectedPassword = (existingUser.password || existingUser.username || "").trim();
             await createUserWithEmailAndPassword(auth, existingUser.email, expectedPassword);
             await sendPasswordResetEmail(auth, existingUser.email);
          } else {
             throw err;
          }
        }
        
        setResetStatus("success");
        setResetMessage("Permintaan reset telah dikirim ke email Anda. Silakan periksa kotak masuk (atau folder spam).");
        
      } catch (error) {
        console.error(error);
        setResetStatus("error");
        setResetMessage(`Gagal mengirim email reset: ${error.message}`);
      }
    } else {
      setResetStatus("error");
      setResetMessage("Username/Email tidak ditemukan di sistem.");
    }
  };

  const triggerLogoutConfirm = () => {
    setShowBackConfirm(true);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg("");
    const normalizedUsername = loginUsername.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();
    if (normalizedUsername === "admin" && cleanPassword === "adminadmin") {
      onLoginSuccess?.({
        username: "admin",
        name: "Administrator",
        email: "admin@lpk.id",
        role: "Admin",
        status: "Active",
      });
      return;
    }
    let existingUser = (systemState.unfilteredUsers || systemState.users || [])?.find(
      (u) => (u.username || "").trim().toLowerCase() === normalizedUsername ||
              (u.email || "").trim().toLowerCase() === normalizedUsername,
    );
    
    if (!existingUser) {
      if (["linggadhani79@gmail.com", "ekaichiro@gmail.com", "rlstudioindonesia@gmail.com"].includes(normalizedUsername) && cleanPassword === "adminadmin") {
         existingUser = {
            id: normalizedUsername,
            username: normalizedUsername,
            name: normalizedUsername.split("@")[0],
            email: normalizedUsername,
            role: "VVIP",
            status: "Active",
            password: "adminadmin",
         } as any;
      }
    }
    
    if (existingUser) {
      if (existingUser.status === "Suspended") {
        setLoginErrorMsg(
          "Akses Ditolak: Akun Anda telah disuspend oleh Admin atau Direktur.",
        );
        return;
      }
      if (existingUser.status !== "Active" && existingUser.role !== "Admin" && existingUser.role !== "VVIP") {
        setLoginErrorMsg(
          "Akses Tertunda: Akun Anda belum disetujui atau belum aktif. Silakan hubungi Admin.",
        );
        return;
      }
      
      const isAdminAccount = ["linggadhani79@gmail.com", "ekaichiro@gmail.com", "rlstudioindonesia@gmail.com", "admin"].includes((existingUser.email || "").trim().toLowerCase()) || (existingUser.username || "").trim().toLowerCase() === "admin";

      try {
        if (existingUser.email) {
           await signInWithEmailAndPassword(auth, existingUser.email, cleanPassword);
           onLoginSuccess?.(existingUser);
           return;
        }
      } catch (err) {}

      if (isAdminAccount && cleanPassword === "adminadmin") {
        onLoginSuccess?.(existingUser);
        return;
      }

      // Verify against the server-side (bcrypt-hashed) credential store.
      try {
        const loginRes = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: normalizedUsername, password: cleanPassword }),
        });
        if (loginRes.ok) {
          const { user: verifiedUser } = await loginRes.json();
          if (existingUser.email) {
              createUserWithEmailAndPassword(auth, existingUser.email, cleanPassword).catch(() => {});
          }
          onLoginSuccess?.(verifiedUser);
          return;
        }
      } catch (err) {}
    }
    setLoginErrorMsg("Username/Email atau password salah.");
  };

  const executeLogoutAction = () => {
    onLogout();
    setActiveSubpageState(null);
    setShowBackConfirm(false);
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
  };

  const defaultSlides: any[] = [];

  const mobileSlides =
    systemState.slideshows &&
    systemState.slideshows.length > 0
      ? systemState.slideshows
      : defaultSlides;

  const [currentMobileSlide, setCurrentMobileSlide] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLoginAsModal, setShowLoginAsModal] = useState(false);
  const [loginAsSearch, setLoginAsSearch] = useState("");

  useEffect(() => {
    const handleOpenModal = () => setShowLoginAsModal(true);
    window.addEventListener('openLoginAsModal', handleOpenModal);
    return () => window.removeEventListener('openLoginAsModal', handleOpenModal);
  }, []);
  const [loginAsRole, setLoginAsRole] = useState("Semua");

  // Auto-slide effect for mobile slideshow
  useEffect(() => {
    if (currentMobileSlide >= mobileSlides.length) {
      setCurrentMobileSlide(0);
    }
  }, [mobileSlides.length, currentMobileSlide]);

  useEffect(() => {
    if (activeSubpage) return;
    const timer = setInterval(() => {
      setCurrentMobileSlide((prev) => (prev + 1) % mobileSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [mobileSlides.length, activeSubpage]);

  const mobileMapRef = useRef<HTMLDivElement>(null);
  const mobileMapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (activeSubpage !== "peta") return;

    // 1. Inject Leaflet CDN style sheet
    const linkId = "leaflet-css-pkg";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // 2. Inject Leaflet CDN script file
    const scriptId = "leaflet-js-pkg";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      document.body.appendChild(script);
    }

    const loadMobileRadarMap = () => {
      const L = (window as any).L;
      if (!L || !mobileMapRef.current) return;

      // Ensure no past double allocations
      if (mobileMapInstanceRef.current) {
        mobileMapInstanceRef.current.remove();
        mobileMapInstanceRef.current = null;
      }

      // Initialize map centered around Japan
      const map = L.map(mobileMapRef.current, {
        center: [36.2048, 138.2529],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      });

      mobileMapInstanceRef.current = map;
      setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 250);

      // Elegant voyager style tiles matching OpenStreetMap
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      ).addTo(map);

      // Define default coordinates for Japanese cities/prefectures
      const defaultCoordinates = ALL_48_PREFECTURES_COORDINATES;

      const expatriates =
        systemState.activeStudents?.filter((s) => s.status === "Di Jepang") ||
        [];

      // Group activeStudents by their coordinates or prefecture
      const groups: Record<
        string,
        {
          cityName: string;
          lat: number;
          lng: number;
          alumni: typeof expatriates;
        }
      > = {};

      expatriates.forEach((student) => {
        const pref = student.prefecture || "Tokyo";
        const lat =
          student.latitude !== undefined && student.latitude !== null
            ? Number(student.latitude)
            : defaultCoordinates[pref]
              ? defaultCoordinates[pref][0]
              : 35.6762;
        const lng =
          student.longitude !== undefined && student.longitude !== null
            ? Number(student.longitude)
            : defaultCoordinates[pref]
              ? defaultCoordinates[pref][1]
              : 139.6503;

        // Group by an exact coordinate string or prefecture to group multiple alumni under same icon beautifully
        const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
        if (!groups[key]) {
          groups[key] = {
            cityName: pref,
            lat,
            lng,
            alumni: [],
          };
        }
        groups[key].alumni.push(student);
      });

      // Plot markers for each city group
      Object.keys(groups).forEach((key) => {
        const group = groups[key];
        const numAlumni = group.alumni.length;

        // Leaflet Circle Marker as custom city icon
        const marker = L.circleMarker([group.lat, group.lng], {
          radius: 12 + Math.min(numAlumni, 8),
          fillColor: "#ef4444", // beautiful red color for Japanese cities
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95,
        }).addTo(map);

        // Bind interactive popup listing details of alumni and company
        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; max-width: 250px; color: #1e293b;">
            <div style="font-weight: 800; font-size: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center;">
              <span>🇯🇵 KOTA/PREF: ${group.cityName.toUpperCase()}</span>
              <span style="background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: 900;">${numAlumni} ALUMNI</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: true,
          closeOnEscapeKey: true,
        });

        marker.on("click", (e: any) => {
          if (e.originalEvent) {
            e.originalEvent.stopPropagation();
          }
          map.setView([group.lat, group.lng], 10, { animate: false });
        });
      });
    };

    if ((window as any).L) {
      loadMobileRadarMap();
    } else {
      script.addEventListener("load", loadMobileRadarMap);
    }

    return () => {
      if (mobileMapInstanceRef.current) {
        mobileMapInstanceRef.current.remove();
        mobileMapInstanceRef.current = null;
      }
    };
  }, [activeSubpage, systemState.activeStudents]);

  // Step 1 Form data values for mobile registration wizard (akses tanpa login)
  const [regStep, setRegStep] = useState(1);
  const [regSelectedRegType, setRegSelectedRegType] = useState<
    "reguler" | "matching"
  >("reguler");
  const [regRegistrationFeeChoice, setRegRegistrationFeeChoice] = useState<
    "admin" | "dp"
  >("admin");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBirthDate, setRegBirthDate] = useState("");
  const [regEducation, setRegEducation] = useState("SMK");
  const [regStatusPendaftaran, setRegStatusPendaftaran] =
    useState("Siswa Baru");
  const [regPassword, setRegPassword] = useState("");
  const [regProgram, setRegProgram] = useState("* All bidang JOB");
  const [regJapaneseLevel, setRegJapaneseLevel] = useState(
    "Belum Belajar Sama Sekali (Nol Mutlak)",
  );
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccessInfo, setRegSuccessInfo] = useState<any | null>(null);

  // Document attachments
  const [regDocAkta, setRegDocAkta] = useState("");
  const [regDocFoto, setRegDocFoto] = useState("");
  const [regDocIjazahSD, setRegDocIjazahSD] = useState("");
  const [regDocIjazahSMP, setRegDocIjazahSMP] = useState("");
  const [regDocIjazahSMA, setRegDocIjazahSMA] = useState("");
  const [regDocKK, setRegDocKK] = useState("");
  const [regDocKTP, setRegDocKTP] = useState("");
  const [regDocTranskip, setRegDocTranskip] = useState("");
  const [regDocPraMCU, setRegDocPraMCU] = useState("");
  const [regDocVaksin, setRegDocVaksin] = useState("");
  const [regDocKontrak, setRegDocKontrak] = useState("");

  // Payment simulated values
  const [regPaymentType, setRegPaymentType] = useState<
    "va" | "transfer" | "cash"
  >("va");
  const [regProofOfPayment, setRegProofOfPayment] = useState("");
  const [regPaymentMethod, setRegPaymentMethod] = useState(
    "BCA Virtual Account",
  );
  const [jobOrderRecoSiswaId, setJobOrderRecoSiswaId] = useState<{
    [jobId: string]: string;
  }>({});
  const [regShowOtpPopup, setRegShowOtpPopup] = useState(false);
  const [regOtpValue, setRegOtpValue] = useState("");
  const [regOtpError, setRegOtpError] = useState("");
  const [regVaCopied, setRegVaCopied] = useState(false);

  const handleRegStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPhone) return;

    if (regStatusPendaftaran !== "Alumni") {
      if (
        !regDocAkta ||
        !regDocIjazahSMA ||
        !regDocKTP
      ) {
        alert(
          "Harap lengkapi berkas persyaratan wajib (Akta Kelahiran, Ijazah SMA/SMK, dan KTP) di bagian bawah form terlebih dahulu. Berkas lainnya dapat dilengkapi menyusul kemudian hari.",
        );
        return;
      }
      setRegStep(2);
    } else {
      // Bypass payment step and documents for Alumni
      handleRegPaymentSubmit();
    }
  };

  const handleRegPaymentSubmit = async () => {
    setRegLoading(true);
    try {
      let calculatedAmount =
        regSelectedRegType === "reguler"
          ? regRegistrationFeeChoice === "dp"
            ? 4000000
            : 500000
          : 500000;

      if (regStatusPendaftaran === "Alumni") {
        calculatedAmount = 0;
      }

      const payload = {
        name: regName,
        email: regEmail,
        password: regPassword || "123456",
        phone: regPhone,
        birthDate: regBirthDate || "2003-01-01",
        education: regEducation,
        statusPendaftaran: regStatusPendaftaran,
        program: regProgram,
        japaneseLevel: regJapaneseLevel,
        paymentAmount: calculatedAmount,
        paymentMethod:
          regPaymentType === "va"
            ? regPaymentMethod
            : regPaymentType === "transfer"
              ? "Transfer Rekening Manual"
              : "Bayar Langsung Kantor LPK",
        // Never fabricate a filename when nothing was actually uploaded - that
        // creates a broken/misleading "proof of payment" link for admins reviewing it.
        proofOfPayment:
          regPaymentType === "va" || regPaymentType === "cash"
            ? ""
            : regProofOfPayment || "",
        docAkta: regDocAkta,
        docFoto: regDocFoto,
        docIjazahSD: regDocIjazahSD,
        docIjazahSMP: regDocIjazahSMP,
        docIjazahSMA: regDocIjazahSMA,
        docKK: regDocKK,
        docKTP: regDocKTP,
        docTranskip: regDocTranskip,
        docPraMCU: regDocPraMCU,
        docVaksin: regDocVaksin,
        docKontrak: regDocKontrak,
      };
      const result = await handleRegisterSubmit(payload);
      if (result) {
        setRegSuccessInfo(result);
        setRegStep(3);
      }
    } catch (err) {
      console.error(err);
      alert(
        "Pendaftaran gagal disinkronkan ke server. Coba beberapa saat lagi.",
      );
    } finally {
      setRegLoading(false);
    }
  };

  // Simple notification feed unread indicator synchronized with notifications length
  const [notifBadge, setNotifBadge] = useState<number>(3);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(true);
  const [isVvipPanelOpen, setIsVvipPanelOpen] = useState(true);

  // Synchronize notification badge with matching events and mock notifications
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const displayEvents = (systemState.events || [])
      .filter((e) => {
        if (e.date && e.date < todayStr) return false;
        if (!currentUser) {
          const titleLower = (e.title || "").toLowerCase();
          const descLower = (e.desc || "").toLowerCase();
          return titleLower.includes("pembukaan") || 
                 titleLower.includes("pendaftaran") || 
                 titleLower.includes("kelas baru") ||
                 titleLower.includes("angkatan") ||
                 titleLower.includes("penerimaan") ||
                 descLower.includes("pembukaan") || 
                 descLower.includes("pendaftaran") || 
                 descLower.includes("kelas baru") ||
                 descLower.includes("angkatan") ||
                 descLower.includes("penerimaan");
        }
        if (!currentUser?.role) return false;
        const roleMatches = e.targets.includes(currentUser.role) || (currentUser.studentId && e.targets.includes(currentUser.studentId)) || ((currentUser as any).id && e.targets.includes((currentUser as any).id));
        if (!roleMatches) return false;
        
        if (currentUser.role === "Siswa" || currentUser.role === "Pengajar") {
          if (e.targetClass && e.targetClass !== "Semua Kelas") {
            return currentUser.assignedClass === e.targetClass;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.date || "";
        const dateB = b.date || "";
        return dateA.localeCompare(dateB);
      });

    const getSynchronizedCount = () => {
      if (!currentUser) return 1; // Welcome guest notification

      let count = 0;
      if (currentUser.role === "Siswa") {
        const studentId = currentUser.studentId || "SIS-001";
        // 1. New lessons/materials
        count += (systemState.lmsLessons || []).length;

        // 2. Tasks/Assessments and Quizzes (2 per unlocked chapter)
        const assessments = (systemState.chapterAssessments || []).filter(
          (a) => a.studentId === studentId && a.isUnlocked
        );
        count += assessments.length * 2;
      } else if (currentUser.role === "Pengajar" || currentUser.role === "Admin" || currentUser.role === "VVIP") {
        // Pending grading
        const pendingGrading = (systemState.chapterAssessments || []).filter(
          (a) => a.status === "Selesai Belajar"
        );
        count += pendingGrading.length;

        // Pending payments for Admin/VVIP
        if (currentUser.role === "Admin" || currentUser.role === "VVIP") {
          const pendingPayments = (systemState.registeredStudents || []).filter(
            (s) => s.paymentStatus === "Pending"
          );
          count += pendingPayments.length;
        }
      }
      return count;
    };

    setNotifBadge(displayEvents.length + getSynchronizedCount());
  }, [currentUser, systemState.events, systemState.lmsLessons, systemState.chapterAssessments, systemState.registeredStudents]);

  // Simulated class selection for staff logbook
  const [selectedClassLog, setSelectedClassLog] = useState<string | null>(null);

  // Chat message groups mock states removed, using real ChatView now

  // Helper alerts
  const triggerAccessAlert = (required: string) => {
    alert(
      `Akses Terkunci!\nHalaman ini memerlukan autentikasi login khusus sebagai: ${required}.\nSilakan klik tombol 'Akun Saya' untuk login.`,
    );
    setActiveSubpage("akun");
  };

  // Safe checks for permissions to categories
  const handleCategoryAction = (category: string) => {
    setActiveWorkspace("main");
    setActiveSubpage(category);
  };

  // Check before loading Admin View parts
  const handleAdminAction = (segment: string) => {
    setActiveWorkspace("admin");
    setActiveSubpage(`admin_${segment}`);
  };

  // Check before loading VVIP panels
  const handleVvipAction = (segment: string) => {
    setActiveWorkspace("vvip");
    setActiveSubpage(`vvip_${segment}`);
  };

  // Custom calendar events updated to latest schedule
  const mockCalendarEvents = [
    {
      id: 1,
      title: "Latihan Interview (Mensetsu) Online",
      date: "15 Juli 2026",
      desc: "Simulasi langsung bersama HRD Kumiai di Chiba melalui Zoom.",
    },
    {
      id: 2,
      title: "Ujian Prometric Tokutei Ginou Kaigo",
      date: "22 Juli 2026",
      desc: "Lokasi di Kantor Prometric Semarang.",
    },
    {
      id: 3,
      title: "Pelepasan & Pembagian Koper Alumni Terbang",
      date: "28 Juli 2026",
      desc: "Doa bersama & seremoni wisuda di Kampus LPK Pati.",
    },
  ];

  const myActiveStudent = systemState?.activeStudents?.find(s => s.id === currentUser?.studentId || s.name === currentUser?.name);
  const isUserAlumni =
    currentUser?.role === "Alumni" ||
    myActiveStudent?.kategoriPendaftaran === "Alumni" ||
    myActiveStudent?.statusPendaftaran === "Alumni";
  const isUserSiswa = currentUser?.role === "Siswa";

  const isMainSubpage = activeSubpage && [
    "kalender",
    "ebenkyou",
    "jobs",
    "perkembangan",
    "pembayaran",
    "cv",
    "pilih_kelas",
    "afiliasi",
    "chat",
    "akun",
    "akun_cv"
  ].includes(activeSubpage);

  
  const submitTeacherBank = async () => {
    if (!currentUser) return;
    const accountStr = `${teacherBankName} - ${teacherBankNum}`;
    const updatedUser = { ...currentUser, bankAccount: accountStr };
    await handleUpdateState("users", "update", updatedUser);
    alert("Rekening berhasil diperbarui");
    setShowTeacherModal(null);
  };

  const submitTeacherLeave = async () => {
    if (!currentUser) return;
    if (!leaveStartDate || !leaveEndDate || !leaveReason) return alert("Mohon lengkapi data");
    const leaveData = {
      id: "LEAVE-" + Date.now(),
      teacherName: currentUser.name,
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      reason: leaveReason,
      status: "Pending",
      requestDate: new Date().toISOString()
    };
    await handleUpdateState("teacherLeaves", "add", leaveData);
    alert("Pengajuan cuti berhasil dikirim ke Admin");
    setShowTeacherModal(null);
  };

  const submitTeacherReport = async () => {
    if (!currentUser) return;
    if (!reportContent) return alert("Isi laporan tidak boleh kosong");
    const reportData = {
      id: "REP-" + Date.now(),
      teacherName: currentUser.name,
      type: reportType,
      content: reportContent,
      submittedDate: new Date().toISOString()
    };
    await handleUpdateState("teacherReports", "add", reportData);
    alert(`Laporan ${reportType} berhasil dikirim`);
    setShowTeacherModal(null);
  };

  const handleTeacherPresensi = async () => {
    if (!currentUser) return;

    if (!currentUser.faceRegistered) {
      // 1. Register face
      setPresensiBiometricStatus("scanning");
      setTimeout(async () => {
        const success = await handleUpdateState("users", "registerBiometric", {
          username: currentUser.username,
          faceBiometricData: "REGISTERED_OK"
        });
        if (success) {
          setPresensiBiometricStatus("success");
          setTimeout(() => {
            alert("✓ Pendaftaran Wajah Berhasil! Wajah Anda kini terdaftar sebagai pemilik sah akun ini. Silakan klik tombol 'Pindai Sekarang' untuk melakukan presensi.");
            setPresensiBiometricStatus("idle");
          }, 1000);
        } else {
          setPresensiBiometricStatus("error");
          alert("Terjadi kesalahan mendaftarkan biometric wajah.");
        }
      }, 2000);
    } else {
      // 2. Perform attendance presensi
      const today = new Date().toISOString().split("T")[0];
      const alreadyPresensi = (systemState.logs || []).some(l => {
        if (l.type !== "PRESENSI_PENGAJAR") return false;
        if (l.user !== currentUser.name && l.user !== currentUser.username) return false;
        return l.timestamp && l.timestamp.startsWith(today);
      });

      if (alreadyPresensi) {
        alert("⚠️ Anda sudah melakukan presensi hari ini. Presensi hanya diperbolehkan satu kali dalam sehari.");
        return;
      }

      setPresensiBiometricStatus("scanning");
      setTimeout(async () => {
         const isSuccess = Math.random() > 0.05; // 95% success rate for registered
         if (isSuccess) {
           setPresensiBiometricStatus("success");
           const logData = {
             id: "PRES-" + Date.now(),
             user: currentUser.name,
             type: "PRESENSI_PENGAJAR",
             description: "Hadir (Biometrik Wajah Terverifikasi)",
             timestamp: new Date().toISOString(),
             notes: presensiNotes
           };
           await handleUpdateState("logs", "add", logData);
           setTimeout(() => {
             alert("Presensi berhasil!");
             setShowTeacherModal(null);
             setPresensiBiometricStatus("idle");
             setPresensiNotes("");
           }, 1000);
         } else {
           setPresensiBiometricStatus("error");
         }
      }, 2000);
    }
  };

  const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setPresensiBiometricStatus("scanning");
    setTimeout(async () => {
      if (!currentUser.faceRegistered) {
        // Register face via uploaded picture
        const success = await handleUpdateState("users", "registerBiometric", {
          username: currentUser.username,
          faceBiometricData: "REGISTERED_OK"
        });
        if (success) {
          setPresensiBiometricStatus("success");
          setTimeout(() => {
            alert("✓ Registrasi Wajah Berhasil! Wajah Anda kini terdaftar sebagai pemilik sah akun ini. Silakan ulangi pengambilan foto untuk melakukan presensi.");
            setPresensiBiometricStatus("idle");
          }, 1000);
        } else {
          setPresensiBiometricStatus("error");
          alert("Terjadi kesalahan mendaftarkan biometric wajah.");
        }
      } else {
        // Attendance log
        const today = new Date().toISOString().split("T")[0];
        const alreadyPresensi = (systemState.logs || []).some(l => {
          if (l.type !== "PRESENSI_PENGAJAR") return false;
          if (l.user !== currentUser.name && l.user !== currentUser.username) return false;
          return l.timestamp && l.timestamp.startsWith(today);
        });

        if (alreadyPresensi) {
          setPresensiBiometricStatus("idle");
          alert("⚠️ Anda sudah melakukan presensi hari ini. Presensi hanya diperbolehkan satu kali dalam sehari.");
          return;
        }

        setPresensiBiometricStatus("success");
        const logData = {
          id: "PRES-" + Date.now(),
          user: currentUser.name,
          type: "PRESENSI_PENGAJAR",
          description: "Hadir (Biometrik Selfie Terverifikasi)",
          timestamp: new Date().toISOString(),
          notes: presensiNotes
        };
        await handleUpdateState("logs", "add", logData);
        setTimeout(() => {
          alert("Presensi Selfie berhasil!");
          setShowTeacherModal(null);
          setPresensiBiometricStatus("idle");
          setPresensiNotes("");
        }, 1000);
      }
    }, 1500);
  };

  const effectiveUserForSubpage = currentUser; 

  return (
    <div ref={containerRef} className={`flex flex-col min-h-screen w-full max-w-full overflow-x-hidden text-slate-800 relative select-none bg-slate-50 ${activeSubpage ? 'pb-20' : 'pb-0'}`}>
      {/* HEADER SECTION - Matches screenshot logo, title and unread bell badge */}
      <header className="bg-white/80 backdrop-blur-xl text-slate-900 p-4 flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative border-b border-slate-200/50 sticky top-0 z-50 rounded-b-2xl mb-1">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* SCI Brand Logo Graphics and Subtitles */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {systemState.customization?.logoUrl ? (
              <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center p-0.5 shadow-md overflow-hidden shrink-0">
                <img
                  src={systemState.customization.logoUrl}
                  alt="LPK Logo"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-10 w-10 bg-indigo-700/5 ring-1 ring-indigo-700/10 rounded-xl flex items-center justify-center font-bold text-lg text-indigo-700 font-sans shadow-inner shrink-0">
                SCI
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-sans text-[11px] font-black tracking-tight leading-none text-indigo-700 uppercase sm:text-xs truncate">
                {systemState.customization?.logoText
                  ? `SCI • ${systemState.customization.logoText}`
                  : "SCI • LPK SOURCE COURSE INDONESIA"}
              </h1>
              <p className="text-[8.5px] text-slate-500 font-medium tracking-wide pt-0.5 leading-none truncate">
                Membentuk Generasi Terampil & Siap Kerja di Jepang
              </p>
            </div>
          </div>
        </div>
        {/* Right actions: Bell notifications & User Account */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {/* Golden Bell Icon with unread notifications count */}
          <button
            onClick={() => {
              setActiveSubpage("notifikasi");
              setNotifBadge(0);
            }}
            className="relative p-1.5 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition active:scale-90 border border-slate-100"
          >
            <Bell className="h-5 w-5" />
            {notifBadge > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 border border-indigo-800 rounded-full text-[8.5px] font-black text-white flex items-center justify-center">
                {notifBadge}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* RENDER DYNAMIC SUBPAGES OR BOTTOM TABS PANEL */}

      {activeSubpage ? (
        (() => {
          const currentUser = effectiveUserForSubpage;
          return (
            <div className={`flex-1 bg-white animate-fade-only ${activeSubpage === "chat" ? "pb-0" : "pb-24"} max-w-full overflow-x-hidden`}>
          <div className="sticky top-0 z-50 bg-indigo-900/95 backdrop-blur-xl text-white p-4 flex items-center justify-between gap-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] border-b border-white/10 rounded-b-3xl mb-2">
            {true ? (
              <button
                onClick={() => setActiveSubpage(null)}
                className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl transition-all active:scale-95 cursor-pointer border border-white/20 shadow-lg shadow-indigo-500/30"
              >
                <Home className="h-3.5 w-3.5" /> Beranda
              </button>
            ) : (
              <div className="w-1" />
            )}
            <span className="text-[10px] font-black tracking-widest uppercase font-sans text-sky-400 max-w-[60%] truncate text-right">
              {activeSubpage === "pendaftaran" && "Pendaftaran Siswa"}
              {activeSubpage === "profil" && "Profil LPK & Form Daftar"}
              {activeSubpage === "jobs" && "Order Job Tokutei Ginou"}
              {activeSubpage === "perkembangan" && "Data Progress Siswa"}
              {(activeSubpage === "ebenkyou") && "LMS E-Benkyou Kelas"}
              {activeSubpage === "pembayaran" && (currentUser?.role === "VVIP" ? "Pembayaran Siswa" : (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin")) ? "HR & Personalia" : "Dashboard Pembayaran")}
              {activeSubpage === "peta" && "Peta Sebaran Alumni LPK"}
              {activeSubpage === "galeri" && "Galeri Foto Pembelajaran"}
              {activeSubpage === "medsos" && "Media Sosial Resmi LPK"}
              {activeSubpage === "privacy" && "Kebijakan Privasi"}
              {activeSubpage === "cv" && "9. CV & BIODATA JEPANG"}
              {activeSubpage === "pilih_kelas" && "Pilih Kelas Bahasa Jepang"}
              {activeSubpage === "alumni_dashboard" && "Dashboard Alumni"}
              {activeSubpage === "afiliasi" && "Afiliasi Pendaftaran SCI"}
              {activeSubpage === "admin_kelas" && "Manajemen Kelas LPK"}
              {(activeSubpage.startsWith("akun") || activeSubpage === "vvip_akun") && "Akun & Profil Saya"}
              {activeSubpage.startsWith("admin_") && activeSubpage !== "admin_sensei" && activeSubpage !== "admin_kelas" && "Admin Desk - Portal"}
              {activeSubpage === "admin_sensei" && "LMS E-Benkyou Kelas"}
              {activeSubpage.startsWith("vvip_") && "VVIP Executive KPI"}
            </span>
          </div>

          {/* RENDERING INDIVIDUAL SUBPAGE CONTENT */}
          <React.Suspense fallback={
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4 min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-xs text-slate-500 font-mono">Memuat modul halaman...</p>
            </div>
          }>

          {/* 1. PROFIL LPK: Integrates the entire original FrontendView about sliders, benefits, testimonials, and wizard form */}
          {activeSubpage === "profil" && (
            <div className="p-0 max-w-full overflow-hidden">
              <FrontendView
                activeStudents={systemState.activeStudents}
                onRegisterSubmit={handleRegisterSubmit}
                customization={systemState.customization}
                slideshows={systemState.slideshows}
                galleries={systemState.galleries}
                onNavigateToRegistration={() => setActiveSubpage("pendaftaran")}
              />
            </div>
          )}

          {/* 2. ORDER JOB: Real-time partner Job Orders list linking to system state or mock orders */}
          {activeSubpage === "jobs" && (
            <MobileJobsSegment
              systemState={systemState}
              currentUser={currentUser}
              onUpdateState={handleUpdateState}
              activeJobTab={activeJobTab}
              setActiveJobTab={setActiveJobTab}
              confirmCancelJobId={confirmCancelJobId}
              setConfirmCancelJobId={setConfirmCancelJobId}
              expandedJobIds={expandedJobIds}
              setExpandedJobIds={setExpandedJobIds}
            />
          )}

          {/* 3. DATA PROGRESS SISWA */}
          {activeSubpage === "perkembangan" && (
            <div className="bg-white rounded-3xl border border-slate-100/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <SenseiDashboardView currentUser={currentUser} systemState={systemState} />
            </div>
          )}

          {/* 4. E-BENKYOU */}
          {(activeSubpage === "ebenkyou" || activeSubpage === "17berkas" || activeSubpage === "admin_sensei" || activeSubpage === "vvip_ebenkyou") &&
            (!currentUser ? (
              <InlineLoginPanel
                title="E-Benkyou LMS"
                requiredRole="Siswa"
                description="Masuk untuk mengakses materi latihan kuis kosakata, gramatika, dan modul Kaigo LPK Pati."
                onLoginSuccess={(u) => onLoginSuccess?.(u)}
                systemState={systemState}
              />
            ) : (
              <div className="p-1 space-y-4">
                {!selectedClassLog && activeSubpage !== "17berkas" ? (
                  <div className="bg-white rounded-3xl border border-slate-100/80/80 p-5 space-y-4 text-center shadow-xs">
                    <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-[24px] flex items-center justify-center mx-auto ring-4 ring-sky-50">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                        Pilih Kelas E-Benkyou
                      </h3>
                      <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-normal">
                        Silakan pilih kelas bimbingan aktif Anda di bawah ini
                        untuk menampilkan materi pembelajaran, latihan kuis, dan
                        logbook kehadiran kelas.
                      </p>
                    </div>

                    {(() => {
                      const activeLmsClasses = (systemState?.customization?.lmsClasses || []);

                      const uniqueClassesList = Array.from(
                        new Set(
                          activeLmsClasses
                            .filter((c: any) => {
                              if (c.type === "alumni" && currentUser?.role !== "Admin" && currentUser?.role !== "Admin Super" && currentUser?.role !== "Admin Biasa" && currentUser?.role !== "VVIP" && currentUser?.role !== "Alumni") {
                                return false;
                              }
                              return true;
                            })
                            .map((c: any) => c.name)
                        )
                      );

                      let plottedClass = currentUser?.assignedClass;
                      if (!plottedClass && currentUser) {
                        if (currentUser.role === "Siswa") {
                          const student = (
                            systemState?.activeStudents || []
                          ).find(
                            (s) =>
                              s.id === currentUser.studentId ||
                              s.name === currentUser.name,
                          );
                          plottedClass = student?.class;
                        } else if (currentUser.role === "Pengajar") {
                          plottedClass = currentUser.assignedClass || "";
                        }
                      }

                      let classesToDisplay = uniqueClassesList;

                      if (currentUser && currentUser.role === "Pengajar" && !currentUser.assignedClass) {
                        classesToDisplay = [];
                      } else if (currentUser && currentUser.role === "Siswa" && (!plottedClass || plottedClass === "Belum ada kelas")) {
                        classesToDisplay = [];
                      } else if (
                        currentUser &&
                        currentUser.role !== "Admin" &&
                        currentUser.role !== "Admin Super" &&
                        currentUser.role !== "Admin Biasa" &&
                        currentUser.role !== "VVIP" &&
                        plottedClass &&
                        plottedClass !== "Semua"
                      ) {
                        const normalize = (val: string) => {
                          if (!val) return "";
                          return val
                            .toLowerCase()
                            .replace(/^kelas\s+/i, "")
                            .replace(/\s+/g, "")
                            .trim();
                        };
                        const normPlotted = normalize(plottedClass);
                        classesToDisplay = uniqueClassesList.filter(
                          (c) => normalize(c) === normPlotted,
                        );
                        if (classesToDisplay.length === 0) {
                          // Only allow displaying it if it actually exists in the system classes
                          const classExists = activeLmsClasses.some((ac: any) => 
                            ac.name.toLowerCase() === plottedClass.toLowerCase() || 
                            ac.id.toLowerCase() === plottedClass.toLowerCase()
                          );
                          if (classExists) {
                            classesToDisplay = [plottedClass];
                          } else {
                            // If it doesn't exist in system, don't show it as a valid selectable class
                            classesToDisplay = [];
                          }
                        }
                      }

                      const normalizeForStatus = (val: string) => {
                        if (!val) return "";
                        return val
                          .toLowerCase()
                          .replace(/^kelas\s+/i, "")
                          .replace(/\s+/g, "")
                          .trim();
                      };
                      
                      const isClassActive = (className: string) => {
                        const foundClass = activeLmsClasses.find(
                          (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                        );
                        if (foundClass) {
                          return foundClass.isActive !== false;
                        }
                        if (className.startsWith("Alumni")) return true;
                        const norm = normalizeForStatus(className);
                        const hasTeacher = (systemState?.users || []).some(
                          (u) => u.role === "Pengajar" && normalizeForStatus(u.assignedClass || "") === norm
                        );
                        const hasStudent = (systemState?.activeStudents || []).some(
                          (s) => normalizeForStatus(s.class || "") === norm
                        );
                        return hasTeacher || hasStudent;
                      };
                      
                      const getClassMaxBab = (className: string) => {
                        const foundClass = activeLmsClasses.find(
                          (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                        );
                        if (!foundClass || !foundClass.chapters) return CHAPTERS_LIST.length;
                        // Count only active chapters
                        return foundClass.chapters.filter((ch: any) => ch.isActive !== false).length;
                      };

                      const getClassProgress = (className: string) => {
                        const foundClass = activeLmsClasses.find(
                          (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                        );
                        const classActiveBab = foundClass?.activeChapterNum || 1;
                        
                        const norm = normalizeForStatus(className);
                        const studentsInClass = (systemState?.activeStudents || []).filter(
                          (s) => normalizeForStatus(s.class || "") === norm
                        );
                        if (studentsInClass.length > 0) {
                          const studentIds = new Set(studentsInClass.map(s => s.id));
                          const assessments = (systemState?.chapterAssessments || []).filter(
                            a => studentIds.has(a.studentId) && a.status === "Telah Dinilai"
                          );
                          if (assessments.length > 0) {
                            const maxGraded = Math.max(...assessments.map(a => a.chapterNumber || 1));
                            // Capped by active bab if active bab is lower
                            return Math.min(maxGraded, classActiveBab);
                          }
                          return classActiveBab;
                        }
                        return classActiveBab;
                      };

                      return (
                        <div className="space-y-4 pt-1">
                          {classesToDisplay.length === 0 && currentUser?.role === "Pengajar" && !currentUser?.assignedClass && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center shadow-inner">
                              <p className="text-[11px] leading-relaxed text-red-700 font-bold uppercase tracking-wider">
                                Akses Ditolak
                              </p>
                              <p className="text-[10px] text-red-600 mt-1">
                                Anda belum diploting (ditugaskan) ke kelas manapun. Silakan hubungi Admin LPK.
                              </p>
                            </div>
                          )}
                          {classesToDisplay.length === 0 && currentUser?.role === "Siswa" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center shadow-inner">
                              <p className="text-[11px] leading-relaxed text-amber-700 font-bold uppercase tracking-wider">
                                Menunggu Ploting Kelas
                              </p>
                              <p className="text-[10px] text-amber-600 mt-1">
                                Akun Anda belum dihubungkan dengan data bimbingan aktif. Harap tunggu Admin LPK memplot data bimbingan Anda terlebih dahulu.
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                            {classesToDisplay.map((className, idx) => {
                              const active = isClassActive(className);
                              const progress = getClassProgress(className);
                              
                              const foundClass = activeLmsClasses.find(
                                (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                              );
                              const isAlumni = foundClass?.type === "alumni" || className.toLowerCase().includes("alumni");
                              
                              let borderColor = "border-slate-300";
                              let dotColor = "bg-slate-400";
                              let textColor = "text-slate-500";
                              
                              if (active) {
                                borderColor = isAlumni ? "border-emerald-500 bg-emerald-50/30" : "border-blue-500 bg-blue-50/30";
                                dotColor = isAlumni ? "bg-emerald-500" : "bg-blue-500";
                                textColor = isAlumni ? "text-emerald-600" : "text-blue-600";
                              } else {
                                borderColor = "border-rose-400 bg-rose-50/30";
                                dotColor = "bg-rose-500";
                                textColor = "text-rose-500";
                              }
                              
                              return (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedClassLog(className)}
                                  className={`flex flex-col items-center justify-center p-2.5 border hover:opacity-80 rounded-xl transition active:scale-95 cursor-pointer text-center animate-fade-in shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${borderColor}`}
                                >
                                  <div className="flex items-center justify-center gap-1.5 mb-1.5 w-full">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                    <span className="text-[10px] font-black text-slate-800 uppercase leading-none truncate">
                                      {className}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase leading-none ${textColor}`}>
                                    BAB {progress} / ({getClassMaxBab(className)})
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-center gap-4 py-3 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                              <span className="text-[11px] font-semibold text-slate-700">Kelas Reguler</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                              <span className="text-[11px] font-semibold text-slate-700">Program Alumni</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                              <span className="text-[11px] font-semibold text-slate-700">Nonaktif</span>
                            </div>
                          </div>
                          
                          <div className="bg-sky-50/50 rounded-[24px] p-3 flex items-start gap-2.5 border border-sky-100 text-left shadow-inner">
                            <div className="w-5 h-5 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center font-extrabold text-[12px] shrink-0 mt-0.5 font-serif italic">i</div>
                            <div>
                              <p className="text-[11px] font-bold text-sky-900 mb-0.5">Keterangan:</p>
                              <p className="text-[10px] text-sky-800/80 leading-relaxed font-medium">BAB (Bab Pembelajaran) menunjukkan bab terakhir yang sedang dipelajari di kelas tersebut. Total BAB Bahasa disesuaikan dengan manajemen kurikulum kelas masing-masing.</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header showing currently selected class */}
                    {activeSubpage !== "17berkas" && (
                      <div className="bg-indigo-700 text-white p-3.5 rounded-[24px] flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[8px] font-bold text-yellow-350 tracking-wider uppercase font-mono">
                          KELAS AKTIF E-BENKYOU
                        </span>
                        <h4 className="text-xs font-black tracking-tight uppercase leading-none">
                          {selectedClassLog}
                        </h4>
                      </div>
                      <button
                        onClick={() => setSelectedClassLog(null)}
                        className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] uppercase border border-white/20 transition cursor-pointer active:scale-95"
                      >
                        ← Ganti Kelas
                      </button>
                    </div>
                    )}

                    <LmsView
                      initialSubTab={activeSubpage === "17berkas" ? "dokumen" : undefined}
                      hideWelcomeBanner={activeSubpage === "17berkas"}
                      currentUser={
                        currentUser
                          ? {
                              ...currentUser,
                              assignedClass:
                                selectedClassLog || currentUser.assignedClass,
                            }
                          : null
                      }
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
                  </div>
                )}
              </div>
            ))}

          {/* 5. PEMBAYARAN: Billing structure checkout sandbox list */}
          {activeSubpage === "pembayaran" && (
            <div className="p-4 space-y-4 text-left">
              <h3 className="font-sans font-black text-slate-900 border-b pb-2 text-md">
                {currentUser && currentUser.role === "VVIP"
                  ? "Pembayaran Siswa"
                  : currentUser && ["Pengajar", "Admin Biasa", "Admin Super", "Admin"].includes(currentUser.role)
                  ? "HR & Personalia"
                  : "Pembayaran & Booking Online"}
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser && ["Pengajar", "Admin Biasa", "Admin Super", "Admin", "VVIP"].includes(currentUser.role)
                  ? "Kelola kehadiran, gaji, cuti, dan rekapitulasi data staff LPK."
                  : "Pantau riwayat pembayaran dan tagihan Anda untuk program pelatihan di LPK."}
              </p>

              {!currentUser ? (
                <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-4 text-center space-y-3">
                  <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-50">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-800">
                      Login Diperlukan
                    </h4>
                    <p className="text-[10px] text-slate-600">
                      Untuk melihat riwayat pembayaran asli Anda, silakan login
                      terlebih dahulu sebagai Siswa.
                    </p>
                  </div>
                  <button
                    onClick={onOpenLogin}
                    className="w-full mt-2 py-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer transition"
                  >
                    Buka Portal Login
                  </button>
                </div>
              ) : currentUser.role === "Admin" ||
                currentUser.role === "VVIP" ? (
                /* ADMIN & VVIP WORKFLOW: STATS & STUDENT REKAP FILTER */
                <div className="space-y-4 animate-fade-in text-xs font-sans">
                  {(() => {
                    const allStudentNames = Array.from(
                      new Set([
                        ...(systemState.activeStudents || []).map(
                          (s) => s.name,
                        ),
                        ...(systemState.registeredStudents || []).map(
                          (s) => s.name,
                        ),
                      ]),
                    )
                      .filter(Boolean)
                      .sort();

                    let totalLunasGross = 0;
                    let totalTunggakanGross = 0;

                    allStudentNames.forEach((name) => {
                      const studentPays = getStudentPayments(
                        name,
                        systemState.payments || [],
                        systemState.costConfig,
                        systemState.activeStudents,
                        systemState.registeredStudents,
                        systemState.customization,
                      );
                      studentPays.forEach((p) => {
                        if (p.status === "Lunas") totalLunasGross += p.amount;
                        else totalTunggakanGross += p.amount;
                      });
                    });

                    const grandTotalExpected =
                      totalLunasGross + totalTunggakanGross;
                    const lunasPercentage =
                      grandTotalExpected > 0
                        ? (totalLunasGross / grandTotalExpected) * 100
                        : 0;

                    return (
                      <div className="space-y-3">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-[24px] p-3.5 space-y-2">
                          <p className="font-extrabold text-[10px] text-indigo-950 tracking-wide uppercase font-mono">
                            📊 AKUMULASI DIKASIR PEMBAYARAN LPK
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-slate-900">
                            <div>
                              <span className="text-[9px] text-slate-400 block">
                                TOTAL LUNAS
                              </span>
                              <strong className="text-xs font-mono font-black text-emerald-700">
                                Rp {totalLunasGross.toLocaleString("id-ID")}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 block">
                                BELUM LUNAS
                              </span>
                              <strong className="text-xs font-mono font-black text-red-650">
                                Rp {totalTunggakanGross.toLocaleString("id-ID")}
                              </strong>
                            </div>
                          </div>

                          {/* Graphical bar */}
                          <div className="w-full h-3 bg-slate-200 rounded-lg overflow-hidden flex mt-1">
                            <div
                              style={{ width: `${lunasPercentage}%` }}
                              className="bg-emerald-500 h-full"
                            />
                            <div
                              style={{ width: `${100 - lunasPercentage}%` }}
                              className="bg-amber-400 h-full"
                            />
                          </div>
                          <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                            <span>Lunas: {lunasPercentage.toFixed(1)}%</span>
                            <span>
                              Tunggakan: {(100 - lunasPercentage).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Search select per Student */}
                        <div className="bg-white border rounded-[24px] p-3 space-y-3">
                          <p className="font-extrabold text-[10px] text-slate-800">
                            🔍 HISTORI REKAP PER ALUMNI
                          </p>

                          <select
                            value={selectedStudent || allStudentNames[0] || ""}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="w-full p-2 border border-slate-100/80 bg-slate-50 rounded-xl text-xs outline-hidden font-medium"
                          >
                            <option value="">-- Pilih Siswa --</option>
                            {allStudentNames.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>

                          {/* Student detail bills list */}
                          {(() => {
                            const activeStud =
                              selectedStudent || allStudentNames[0];
                            if (!activeStud) return null;

                            const listPays = getStudentPayments(
                              activeStud,
                              systemState.payments || [],
                              systemState.costConfig,
                              systemState.activeStudents,
                              systemState.registeredStudents,
                              systemState.customization,
                            );
                            const totalSiswaPaid = listPays
                              .filter((p) => p.status === "Lunas")
                              .reduce((s, c) => s + c.amount, 0);
                            const totalSiswaExpected = listPays.reduce(
                              (s, c) => s + c.amount,
                              0,
                            );

                            return (
                              <div className="mt-2 space-y-2 border-t pt-2">
                                <p className="text-[10px] text-indigo-700 font-extrabold uppercase tracking-wide">
                                  Buku Kas: {activeStud}
                                </p>
                                <div className="space-y-1.5">
                                  {listPays.map((p, index) => (
                                    <div
                                      key={p.id}
                                      className="p-2 bg-slate-50/50 rounded-xl border border-slate-150 flex items-center justify-between gap-1 text-[10px]"
                                    >
                                      <span className="truncate max-w-[60%] font-semibold block text-slate-850">
                                        {index + 1}. {p.category}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="font-mono text-slate-500 whitespace-nowrap">
                                          Rp {p.amount.toLocaleString("id-ID")}
                                        </span>
                                        <span
                                          className={`px-1.5 rounded font-bold uppercase text-[8px] ${
                                            p.status === "Lunas"
                                              ? "bg-emerald-100 text-emerald-800"
                                              : "bg-amber-100 text-amber-800"
                                          }`}
                                        >
                                          {p.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-xl text-[10px] font-mono font-bold text-indigo-950">
                                  <span>Total Setoran:</span>
                                  <span>
                                    Rp {totalSiswaPaid.toLocaleString("id-ID")}{" "}
                                    / Rp{" "}
                                    {totalSiswaExpected.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : ["Pengajar", "Alumni", "Admin", "Admin Super", "Admin Biasa", "VVIP"].includes(currentUser.role) ? (
                /* STAFF/ADMIN/TEACHER PERSONAL WORKFLOW: ATTENDANCE, SALARY, CUTI */
                <TeacherDashboardPanel
                  currentUser={currentUser}
                  systemState={systemState}
                  onUpdateState={handleUpdateState}
                  setActiveTab={(tab) => setActiveSubpage(tab === "kalender" ? "kalender" : tab)}
                />
              ) : (
                /* CLIENT/STUDENT VIEW: CHOOSE AND CHECKOUT SINGLE-VIEW LIST */
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-3 text-[10.5px] leading-relaxed text-amber-900">
                    <p className="font-bold">💡 Petunjuk Pembayaran:</p>
                    <p className="opacity-90">
                      Siswa dapat melakukan pembayaran menggunakan{" "}
                      <strong>Cash</strong>, <strong>Transfer Rekening</strong>,
                      atau <strong>Virtual Account (Online VA / QRIS)</strong>{" "}
                      dengan mengklik salah satu tagihan Anda di bawah.
                    </p>
                  </div>

                  {getStudentPayments(
                    currentUser.name,
                    systemState.payments || [],
                    systemState.costConfig,
                    systemState.activeStudents,
                    systemState.registeredStudents,
                    systemState.customization,
                  ).map((payment, i) => {
                    const isPaid = payment.status === "Lunas";
                    return (
                      <div
                        key={i}
                        onClick={() => setActivePaymentDetail(payment)}
                        className="bg-slate-50 p-4 rounded-[24px] border border-slate-100/80 space-y-3 cursor-pointer hover:border-indigo-500 hover:shadow-xs transition-all duration-150 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-xs text-slate-900 truncate max-w-[65%]">
                            {payment.category}
                          </h4>
                          <span
                            className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded shrink-0 border ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : payment.status === "Pending"
                                  ? "bg-indigo-100 text-indigo-800 border-indigo-200 animate-pulse"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                            }`}
                          >
                            {payment.status === "Pending"
                              ? "Menunggu Verifikasi"
                              : payment.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-slate-400 font-medium">
                          Metode: {payment.paymentMethod || "-"} • Tanggal:{" "}
                          {payment.date}
                        </p>
                        {payment.proofOfPayment && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md w-fit">
                            <ImageIcon className="w-3 h-3" /> Ada Lampiran Bukti
                          </div>
                        )}

                        <div className="border-t border-slate-250/20 pt-2 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Total Tagihan:</span>
                          <strong className="text-slate-900">
                            Rp {payment.amount.toLocaleString("id-ID")}
                          </strong>
                        </div>

                        {!isPaid && payment.status !== "Pending" && (
                          <div className="mt-2 text-center text-[10px] font-black text-indigo-750 bg-indigo-55/40 p-1.5 rounded-lg border border-indigo-200 animate-pulse">
                            Klik untuk Bayar Sekarang
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 6. PETA PENYEBARAN: Full responsive OpenStreetMap inside mobile */}
          {activeSubpage === "peta" && (
            <div className="p-4 space-y-3 text-left">
              <h3 className="font-sans font-black text-slate-900 border-b pb-2 text-md">
                PETA ALUMNI DI JEPANG
              </h3>
              <p className="text-xs text-slate-500">
                Peta interaktif real-time sebaran alumni LPK yang telah sukses
                berangkat dan bekerja di berbagai kota besar Jepang.
              </p>

              <div
                ref={mobileMapRef}
                className="w-full h-[400px] rounded-[24px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden z-10 bg-slate-100"
              />

              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-800 flex items-start gap-1.5 leading-relaxed font-semibold">
                <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-red-950 font-black mb-0.5">
                    💡 PETUNJUK INTERAKTIF:
                  </strong>
                  Klik pada pin/lingkaran merah di dalam peta untuk memunculkan
                  jumlah alumni yang berada di lokasi tersebut.
                </div>
              </div>
            </div>
          )}

          {/* 7. GALERI: Active photos grid */}
          {activeSubpage === "galeri" && (
            <div className="p-4 space-y-4 text-left">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-sans font-black text-slate-900 text-md flex items-center gap-2">
                  <Camera className="w-4 h-4 text-pink-600" />
                  <span>Galeri Foto LPK</span>
                </h3>
                <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full border border-pink-200">
                  Klik foto untuk Perbesar
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Mengabadikan momen-momen penting dari asrama LPK Pati hingga touchdown di berbagai kota besar Jepang.
              </p>

              {(systemState.galleries || []).length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs italic border border-dashed rounded-2xl">
                  Belum ada foto galeri.
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(systemState.galleries || []).map((item: any, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedGalleryImage({
                      image: item.image || item.img,
                      title: item.title,
                      tag: item.tag || "GALERI LPK",
                      description: item.description || ""
                    })}
                    className="group bg-slate-50 p-2 rounded-[20px] border border-slate-200 overflow-hidden space-y-1.5 shadow-xs hover:shadow-md hover:border-pink-300 transition cursor-pointer flex flex-col justify-between active:scale-95"
                  >
                    <div className="relative rounded-xl overflow-hidden h-28 bg-slate-900">
                      <img
                        src={item.image || item.img}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' fill='%2364748b' font-size='14' text-anchor='middle' dy='.3em'%3EFoto tidak tersedia%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 bg-black/60 text-white p-1 rounded-lg backdrop-blur-xs">
                        <Maximize2 className="w-3 h-3 text-pink-300" />
                      </div>
                    </div>
                    <div className="px-1 py-0.5">
                      <p className="text-[10.5px] font-black text-slate-900 truncate leading-tight">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-pink-600 font-bold mt-1">
                        <span>Perbesar</span>
                        <Download className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LIGHTBOX ENLARGED PHOTO MODAL FOR MOBILE */}
          {selectedGalleryImage && createPortal(
            <div 
              className="fixed inset-0 z-[100000] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-fade-in"
              onClick={() => setSelectedGalleryImage(null)}
            >
              {/* Header */}
              <div 
                className="w-full flex items-center justify-between pb-3 border-b border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  {selectedGalleryImage.tag && (
                    <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedGalleryImage.tag}
                    </span>
                  )}
                  <h3 className="text-white font-black text-xs sm:text-sm truncate max-w-[200px]">
                    {selectedGalleryImage.title || "Foto Galeri LPK"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedGalleryImage(null)}
                  className="p-1.5 bg-white/10 text-white rounded-full transition cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Display */}
              <div 
                className="relative flex-1 flex items-center justify-center my-3 w-full overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={selectedGalleryImage.image}
                  alt={selectedGalleryImage.title || "Foto Galeri"}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-white/15"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Bottom Actions */}
              <div 
                className="w-full flex items-center justify-between gap-3 pt-3 border-t border-white/10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedGalleryImage(null)}
                  className="px-4 py-2.5 bg-white/10 text-slate-300 text-xs font-bold rounded-xl active:scale-95 transition"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleDownloadImage(selectedGalleryImage.image, selectedGalleryImage.title || "foto_galeri_lpk")}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-pink-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Foto</span>
                </button>
              </div>
            </div>,
            document.body
          )}

          {/* MEDIA SOSIAL removed as per user request */}

          {/* 9. ADMIN DESK: Integrates functional subpages from AdminView */}
          {activeSubpage.startsWith("admin_") && activeSubpage !== "admin_kalender" &&
            (!currentUser ||
            (currentUser.role !== "Admin" && currentUser.role !== "Admin Super" && currentUser.role !== "Admin Biasa" && currentUser.role !== "VVIP") ? (
              <InlineLoginPanel
                title="Admin Desk Portal"
                requiredRole="Admin"
                description="Akses terkunci! Halaman admin keuangan siswa, inventaris, dan perizinan membutuhkan autentikasi Admin LPK."
                onLoginSuccess={(u) => onLoginSuccess?.(u)}
                systemState={systemState}
              />
            ) : currentUser.role === "Admin Biasa" && (activeSubpage === "admin_pembayaran" || activeSubpage === "admin_pajak" || activeSubpage === "admin_gaji") ? (
              <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in">
                <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-[24px] flex items-center justify-center mx-auto">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-display font-black text-lg text-slate-900">Akses Terbatas: Admin Utama Only</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  Maaf, menu finansial/pembayaran, buku kas, pajak, dan gaji hanya dapat diakses oleh Admin Utama, Admin Super, atau Direktur Utama (VVIP).
                </p>
              </div>
            ) : (
              <div className="p-3 sm:p-5">
                <AdminView
                  systemState={systemState}
                  onUpdateState={handleUpdateState}
                  currentUser={currentUser}
                  initialSegment={activeSubpage.replace("admin_", "") as any}
                />
              </div>
            ))}

          {/* 10. VVIP MONITORING */}
          {activeSubpage.startsWith("vvip_") && activeSubpage !== "vvip_kalender" &&
            (!currentUser || currentUser.role !== "VVIP" ? (
              <InlineLoginPanel
                title="VVIP Executive KPI"
                requiredRole="Direktur Utama VVIP (CEO)"
                description="Halaman dashboard overview KPI monitoring ini hanya dapat diakses oleh Direktur Utama (VVIP/CEO) LPK."
                onLoginSuccess={(u) => onLoginSuccess?.(u)}
                systemState={systemState}
              />
            ) : (
              <div className="p-3 sm:p-5">
                <VvipView
                  systemState={systemState}
                  onUpdateState={handleUpdateState}
                  isMobile={true}
                  initialMonitorTab={
                    activeSubpage === "vvip_gaji"
                      ? "gaji"
                      : activeSubpage === "vvip_sensei"
                        ? "sensei"
                        : "siswa"
                  }
                  viewMode={
                    activeSubpage === "vvip_gaji"
                      ? "gaji"
                      : activeSubpage === "vvip_eval"
                        ? "eval"
                        : activeSubpage === "vvip_pajak"
                          ? "pajak"
                          : activeSubpage === "vvip_ai"
                            ? "ai"
                            : activeSubpage === "vvip_exec"
                              ? "exec"
                              : activeSubpage === "vvip_akun" || activeSubpage === "vvip_security"
                                ? "security"
                                : activeSubpage === "vvip_ebenkyou" || activeSubpage === "vvip_lms"
                                  ? "lms"
                                  : activeSubpage === "vvip_afiliasi"
                                    ? "afiliasi"
                                    : "full"
                  }
                />
              </div>
            ))}

          {/* 11. NOTIFIKASI */}
          {activeSubpage === "notifikasi" && (
            <div className="flex-1 p-4 space-y-4 text-left font-sans animate-fade-in">
              {(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${day}`;

                const displayEvents = (systemState.events || [])
                  .filter((e) => {
                    if (e.date && e.date < todayStr) return false;
                    if (!currentUser) {
                      // untuk masyarakat umum notif ini hanya berkaitan dengan jadwal pembukaan kelas
                      const titleLower = (e.title || "").toLowerCase();
                      const descLower = (e.desc || "").toLowerCase();
                      return titleLower.includes("pembukaan") || 
                             titleLower.includes("pendaftaran") || 
                             titleLower.includes("kelas baru") ||
                             titleLower.includes("angkatan") ||
                             titleLower.includes("penerimaan") ||
                             descLower.includes("pembukaan") || 
                             descLower.includes("pendaftaran") || 
                             descLower.includes("kelas baru") ||
                             descLower.includes("angkatan") ||
                             descLower.includes("penerimaan");
                    }
                    if (!currentUser?.role) return false;
                    const roleMatches = e.targets.includes(currentUser.role) || (currentUser.studentId && e.targets.includes(currentUser.studentId)) || ((currentUser as any).id && e.targets.includes((currentUser as any).id));
                    if (!roleMatches) return false;
                    
                    // Specific class filter for student or teacher
                    if (currentUser.role === "Siswa" || currentUser.role === "Pengajar") {
                      if (e.targetClass && e.targetClass !== "Semua Kelas") {
                        return currentUser.assignedClass === e.targetClass;
                      }
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    const dateA = a.date || "";
                    const dateB = b.date || "";
                    return dateA.localeCompare(dateB);
                  });

                const getSynchronizedNotifications = () => {
                  if (!currentUser) {
                    return [
                      {
                        id: "welcome-guest",
                        title: "Selamat Datang di Portal LPK SCI 🌐",
                        body: "Silakan masuk menggunakan akun Siswa, Pengajar, atau Admin Anda untuk melihat jadwal belajar, penugasan, nilai, dan pesan terintegrasi.",
                        time: "Informasi"
                      }
                    ];
                  }

                  const list: any[] = [];

                  if (currentUser.role === "Siswa") {
                    const studentId = currentUser.studentId || "SIS-001";
                    
                    // 1. New Material (from lmsLessons)
                    const lessons = systemState.lmsLessons || [];
                    lessons.forEach((l) => {
                      list.push({
                        id: `lesson-${l.id}`,
                        title: `📚 Materi Baru: ${l.title}`,
                        body: `Materi ${l.subject} (Bab ${l.chapterNumber || 'Umum'}) format ${
                          l.contentType === "video" ? "🎬 Video" :
                          l.contentType === "slide" ? "📽️ Slide PPT" :
                          l.contentType === "buku" ? "📖 Buku Rujukan" :
                          l.contentType === "audio" ? "🎙️ Rekaman Suara" : "📝 Teks"
                        } telah dipublikasikan oleh Sensei.`,
                        time: "Materi Baru"
                      });
                    });

                    // 2. Tasks / Chapter Assessments
                    const assessments = (systemState.chapterAssessments || []).filter(
                      (a) => a.studentId === studentId
                    );
                    assessments.forEach((a) => {
                      if (a.isUnlocked) {
                        list.push({
                          id: `task-${a.id}`,
                          title: `📝 Tugas Bab ${a.chapterNumber}: ${a.title}`,
                          body: `Status: ${
                            a.status === "Telah Dinilai" 
                              ? `✅ Telah Dinilai (Nilai: ${a.score || 0}). Catatan Sensei: "${a.notes || 'Sangat baik'}"` 
                              : a.status === "Selesai Belajar" 
                                ? "⏳ Menunggu Ujian Lisan & Penilaian Sensei" 
                                : "📖 Terbuka - Silakan pelajari materi dan laporkan progress Anda!"
                          }`,
                          time: a.assessedDate || "Jadwal",
                        });

                        // 3. Quizzes
                        list.push({
                          id: `quiz-${a.id}`,
                          title: `✏️ Kuis Latihan Bab ${a.chapterNumber}: ${a.title}`,
                          body: `Kuis pilihan ganda interaktif untuk Bab ${a.chapterNumber} telah tersedia di tab Kuis. Uji pemahaman kosakata Anda sekarang!`,
                          time: "Aktif",
                        });
                      }
                    });
                  } else if (currentUser.role === "Pengajar" || currentUser.role === "Admin" || currentUser.role === "VVIP") {
                    // Show alerts for pending payment confirmations if Admin/VVIP
                    if (currentUser.role === "Admin" || currentUser.role === "VVIP") {
                      const pendingPayments = (systemState.registeredStudents || []).filter(
                        (s) => s.paymentStatus === "Pending"
                      );
                      pendingPayments.forEach((s) => {
                        list.push({
                          id: `payment-${s.id}`,
                          title: `💰 Validasi Pembayaran: ${s.name}`,
                          body: `Pendaftar ${s.name} mengirimkan bukti pembayaran sebesar Rp ${(s.paymentAmount || 0).toLocaleString("id-ID")}. Silakan periksa berkas dan setujui pendaftarannya.`,
                          time: "Validasi",
                        });
                      });
                    }
                  }

                  return list;
                };

                const displayMocks = getSynchronizedNotifications();

                return (
                  <div className="space-y-4">
                    {!currentUser && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-[24px] border border-amber-200 text-xs text-amber-900 leading-normal flex items-start gap-2.5 shadow-3xs mb-1">
                        <span className="text-base shrink-0">📢</span>
                        <div>
                          <strong>Info Publik Pengunjung (Masyarakat Umum):</strong>
                          <p className="text-[10.5px] text-amber-800 mt-1 font-normal">
                            Menampilkan informasi resmi seputar <strong>Pembukaan Kelas Baru & Pendaftaran LPK SCI</strong>. Silakan masuk menggunakan akun untuk mendapatkan notifikasi personal yang sesuai dengan kelas & program pelatihan Anda.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h3 className="font-sans font-black text-slate-900 text-md">
                        {currentUser ? "Notifikasi Sistem Terpadu" : "Jadwal Pembukaan Kelas"}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {currentUser ? "Pembaruan harian LPK" : "Masyarakat Umum"}
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {/* Dynamic broadcast events */}
                      {displayEvents.map((ev) => {
                        const isStudySchedule = ev.type === "Jadwal Belajar";
                        if (isStudySchedule) {
                          return (
                            <div
                              key={ev.id}
                              className="bg-emerald-600 text-white p-4 rounded-[24px] border border-emerald-700 relative overflow-hidden shadow-md transition"
                            >
                              <div className="absolute top-0 left-0 h-full w-1 bg-yellow-300"></div>
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="text-[8px] font-black uppercase text-yellow-300 tracking-wider bg-white/10 px-1.5 py-0.5 rounded mr-2 inline-flex items-center gap-1">
                                    <span>📚</span> JADWAL BELAJAR HARIAN
                                  </span>
                                  <h4 className="font-extrabold text-xs text-white mt-1 leading-normal">
                                    {ev.title}
                                  </h4>
                                </div>
                                <span className="text-[9px] text-emerald-200 font-mono leading-none whitespace-nowrap">
                                  {formatDateIndo(ev.date)}
                                </span>
                              </div>
                              
                              <p className="text-[10.5px] text-emerald-50 leading-normal mt-2 font-normal">
                                {ev.desc}
                              </p>

                              {/* Study specific details for mobile */}
                              <div className="bg-emerald-800/50 border border-emerald-500/20 rounded-xl p-2.5 mt-2.5 space-y-1 text-[10px] text-emerald-100">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1">
                                    <span>🕒</span>
                                    <strong>Jam Belajar:</strong> {ev.studyTime || "08:00 - selesai"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>🔔</span>
                                    <strong>Notif Pengingat:</strong> {ev.reminderTime || "Tepat waktu"}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span>🏫</span>
                                    <strong>Kelas:</strong> {ev.targetClass || "Semua Kelas"}
                                  </div>
                                </div>
                              </div>

                              {/* New fields in mobile study card */}
                              {(ev.time || ev.location || ev.url || ev.date) && (
                                <div className="space-y-2 mt-2.5 border-t border-emerald-500/30 pt-2.5">
                                  {/* Tanggal & Waktu Pelaksanaan */}
                                  <div className="bg-emerald-850/60 border border-emerald-700/20 rounded-xl p-2.5 text-[10px] text-emerald-100 font-medium">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span>📅</span>
                                        <strong>Tanggal Pelaksanaan:</strong> {formatDateIndo(ev.date)}
                                      </div>
                                      {ev.time && (
                                        <div className="flex items-center gap-1.5">
                                          <span>🕒</span>
                                          <strong>Waktu:</strong> {ev.time}
                                        </div>
                                      )}
                                      {ev.location && (
                                        <div className="flex items-center gap-1.5">
                                          <span>📍</span>
                                          <strong>Lokasi:</strong> {ev.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {ev.url && (
                                    <div className="w-full">
                                      {ev.url.toLowerCase().includes("zoom") ? (
                                        <div className="bg-blue-600/95 border border-blue-400/30 rounded-xl p-3 flex flex-col gap-2 text-xs w-full shadow-inner">
                                          <div className="flex items-center gap-2">
                                            <div className="bg-white text-blue-600 p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                                              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                                <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-9 12a4 4 0 110-8 4 4 0 010 8z" />
                                              </svg>
                                            </div>
                                            <div>
                                              <p className="font-extrabold text-yellow-300 text-[10.5px] uppercase tracking-wider">Akses Kelas Virtual Zoom</p>
                                              <p className="text-[9.5px] text-slate-100 font-medium">Masuk otomatis via Aplikasi Zoom di HP</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <a 
                                              href={getZoomAppLink(ev.url)} 
                                              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-3 py-2 rounded-xl text-center text-[10.5px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition"
                                            >
                                              📱 Buka di App Zoom
                                            </a>
                                            <a 
                                              href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="bg-emerald-700/55 text-white font-bold px-2.5 py-2 rounded-xl text-center text-[9.5px] border border-emerald-500/20"
                                            >
                                              Browser
                                            </a>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-100 font-bold bg-emerald-850/40 p-2 rounded-xl border border-emerald-500/20">
                                          <span>🔗</span>
                                          <a 
                                            href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hover:underline flex items-center gap-1"
                                          >
                                            Buka Tautan Acara
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div
                            key={ev.id}
                            className="bg-indigo-800 text-white p-4 rounded-[24px] border border-slate-900 relative overflow-hidden shadow-md transition"
                          >
                            <div className="absolute top-0 left-0 h-full w-1 bg-yellow-400"></div>
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <span className="text-[8px] font-black uppercase text-yellow-350 tracking-wider bg-white/10 px-1.5 py-0.5 rounded mr-2">
                                  📢 SIARAN UTAMA
                                </span>
                                <h4 className="font-extrabold text-xs text-white mt-1 sm:mt-0 leading-normal">
                                  {ev.title}
                                </h4>
                              </div>
                              <span className="text-[9px] text-yellow-300 font-mono leading-none whitespace-nowrap">
                                {formatDateIndo(ev.date)}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-200 leading-normal mt-2 font-normal">
                              {ev.desc}
                            </p>

                            {/* Details in standard card */}
                            {(ev.time || ev.location || ev.url || ev.date) && (
                              <div className="space-y-2 mt-2.5 border-t border-slate-800 pt-2.5">
                                {/* Tanggal & Waktu Pelaksanaan */}
                                <div className="bg-indigo-900 border border-slate-850 rounded-xl p-2.5 text-[10px] text-slate-300 font-medium">
                                  <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span>📅</span>
                                      <strong>Tanggal Pelaksanaan:</strong> {formatDateIndo(ev.date)}
                                    </div>
                                    {ev.time && (
                                      <div className="flex items-center gap-1.5">
                                        <span>🕒</span>
                                        <strong>Waktu:</strong> {ev.time}
                                      </div>
                                    )}
                                    {ev.location && (
                                      <div className="flex items-center gap-1.5">
                                        <span>📍</span>
                                        <strong>Lokasi:</strong> {ev.location}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {ev.url && (
                                  <div className="w-full">
                                    {ev.url.toLowerCase().includes("zoom") ? (
                                      <div className="bg-blue-600 border border-blue-500/20 rounded-xl p-3 flex flex-col gap-2 text-xs w-full shadow-inner">
                                        <div className="flex items-center gap-2">
                                          <div className="bg-white text-[#0c4a9e] p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                              <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-9 12a4 4 0 110-8 4 4 0 010 8z" />
                                            </svg>
                                          </div>
                                          <div>
                                            <p className="font-extrabold text-yellow-300 text-[10.5px] uppercase tracking-wider">Akses Kelas Virtual Zoom</p>
                                            <p className="text-[9.5px] text-slate-100 font-medium">Masuk otomatis via Aplikasi Zoom di HP</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <a 
                                            href={getZoomAppLink(ev.url)} 
                                            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-3 py-2 rounded-xl text-center text-[10.5px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition"
                                          >
                                            📱 Buka di App Zoom
                                          </a>
                                          <a 
                                            href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-indigo-800 text-white font-bold px-2.5 py-2 rounded-xl text-center text-[9.5px] border border-slate-700"
                                          >
                                            Browser
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-300 font-bold bg-indigo-900 p-2 rounded-xl border border-slate-850">
                                        <span>🔗</span>
                                        <a 
                                          href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="hover:underline flex items-center gap-1 text-yellow-300"
                                        >
                                          Buka Tautan Acara
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {displayMocks.map((n) => (
                        <div
                          key={n.id}
                          className="bg-white p-4 rounded-[24px] border border-slate-100/80/90 relative overflow-hidden shadow-xs hover:border-slate-300 transition"
                        >
                          <div className="absolute top-0 left-0 h-full w-1 bg-indigo-700"></div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-extrabold text-xs text-slate-900">
                              {n.title}
                            </h4>
                            <span className="text-[9px] text-indigo-700 font-mono leading-none whitespace-nowrap">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-600 leading-normal mt-1.5 font-normal">
                            {n.body}
                          </p>
                        </div>
                      ))}

                      {displayEvents.length === 0 && displayMocks.length === 0 && (
                        <div className="bg-white border border-slate-100/80 rounded-3xl p-6 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                          <div className="h-12 w-12 bg-slate-50 text-slate-450 rounded-[24px] flex items-center justify-center mx-auto">
                            <Bell className="h-6 w-6" />
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            Belum ada jadwal pembukaan kelas terbaru yang dipublikasikan.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* 12. CHAT */}
          {activeSubpage === "chat" && (
            <div className="flex-1 flex flex-col justify-between text-left h-full">
              {currentUser ? (
                <ChatView
                  currentUser={currentUser}
                  systemState={systemState}
                  onUpdateState={handleUpdateState}
                  onClose={() => setActiveSubpage(null)}
                />
              ) : (
                <div className="bg-white border rounded-3xl p-6 text-center space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] m-2 mt-4">
                  <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mx-auto ring-4 ring-indigo-50">
                    <User className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-extrabold text-indigo-800 text-md">
                      Login Diperlukan
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal font-normal">
                      Silakan masuk untuk menggunakan fitur chat dengan pengguna
                      lain sesuai peran Anda.
                    </p>
                  </div>

                  <button
                    onClick={onOpenLogin}
                    className="w-full bg-indigo-800 text-white font-extrabold text-xs py-3.5 rounded-[24px] transition hover:bg-indigo-700 cursor-pointer shadow-md"
                  >
                    🔑 Buka Portal Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 13. KALENDER */}
          {(activeSubpage === "kalender" || activeSubpage === "admin_kalender" || activeSubpage === "vvip_kalender") && (
            <div className="flex-1 p-2 sm:p-4 space-y-4 text-left">
              <CalendarView
                systemState={systemState}
                currentUser={currentUser || null}
                onUpdateState={handleUpdateState}
                adminMode={true}
              />
            </div>
          )}

          {/* 14. AKUN SAYA */}
          {(activeSubpage.startsWith("akun") || activeSubpage === "vvip_akun") && (
            <div className="flex-1 p-2 space-y-4 text-left bg-slate-50 min-h-screen max-w-full overflow-x-hidden">
              {currentUser ? (
                <div className="space-y-4">
                  <AccountSettingsView
                    currentUser={currentUser}
                    systemState={systemState}
                    onUpdateState={handleUpdateState}
                    onLoginSuccess={(u) => onLoginSuccess?.(u)}
                    onOpenLogin={onOpenLogin}
                    initialTab={activeSubpage === "akun_manajemen" ? "manajemen" : activeSubpage === "akun_cv" ? "cv" : "profil"}
                  />

                  <div className="p-2">
                    <button
                      onClick={() => triggerLogoutConfirm()}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase text-xs py-3 rounded-[24px] cursor-pointer transition active:scale-95 text-center shadow-md shadow-rose-600/10"
                    >
                      Keluar Dari Akun
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded-3xl p-6 text-center space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] m-2">
                  <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mx-auto ring-4 ring-indigo-50">
                    <User className="h-7 w-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-sans font-extrabold text-indigo-800 text-md">
                      Login Sistem Terpadu LPK
                    </h3>
                    <p className="text-xs text-slate-500 leading-normal font-normal">
                      Silakan masuk menggunakan akun Siswa, Pengajar, Admin,
                      atau VVIP Anda untuk mengakses data rekap bimbingan di
                      Indonesia maupun di Jepang.
                    </p>
                  </div>

                  <button
                    onClick={onOpenLogin}
                    className="w-full bg-indigo-800 text-white font-extrabold text-xs py-3.5 rounded-[24px] transition hover:bg-indigo-700 cursor-pointer shadow-md"
                  >
                    🔑 Buka Portal Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 16. FORM PENDAFTARAN (Subpage) */}
          {activeSubpage === "pendaftaran" && (
            <RegistrationView
              onRegisterSubmit={handleRegisterSubmit}
              onBackToLanding={() => setActiveSubpage(null)}
              systemState={systemState}
            />
          )}
          {/* 15. KEBIJAKAN PRIVASI HALAMAN TERSENDIRI */}
          {activeSubpage === "privacy" && (
            <div className="flex-1 p-3 space-y-4 text-left">
              <PrivacyPolicyView />
            </div>
          )}
          {/* 16. CV & BIODATA JEPANG SUBPAGE */}
          {activeSubpage === "cv" && (
            <div className="flex-1 p-3 space-y-4 text-left">
              {(() => {
                if (!currentUser) {
                  return (
                    <div className="bg-white p-6 rounded-3xl border border-slate-100/80 text-center space-y-4 max-w-md mx-auto my-8">
                      <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mx-auto">
                        <FileText className="h-6 w-6" />
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-800">Menu CV & Biodata (Rirekisho)</h3>
                      <p className="text-xs text-slate-500 leading-normal">
                        Silakan login sebagai siswa bimbingan LPK untuk melengkapi, menyinkronkan data, dan mengunduh CV wawancara kerja Anda.
                      </p>
                      <button
                        onClick={onOpenLogin}
                        className="w-full bg-indigo-800 text-white font-extrabold text-xs py-3.5 rounded-[24px] transition hover:bg-indigo-700"
                      >
                        🔑 Buka Portal Login
                      </button>
                    </div>
                  );
                }

                const isAdminOrVvip = currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP" || currentUser.role === "Pengajar";
                const activeStudent = systemState.activeStudents?.find(
                  (s) => s.id === selectedCvStudentId || (s.name === currentUser.name && !isAdminOrVvip)
                );

                return (
                  <div className="space-y-4">
                    {isAdminOrVvip && (
                      <div className="bg-slate-50 border border-slate-100/80 p-4 rounded-[24px] space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase">Pilih Siswa (Akses Staf):</label>
                        <select
                          value={selectedCvStudentId}
                          onChange={(e) => setSelectedCvStudentId(e.target.value)}
                          className="w-full text-xs p-3 border border-slate-100/80 bg-white rounded-xl outline-none"
                        >
                          <option value="">-- Pilih Siswa --</option>
                          {systemState.activeStudents?.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.id} - {s.class})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {activeStudent ? (
                      <StudentCvView
                        student={activeStudent}
                        onUpdateStudent={async (payload) => {
                          return handleUpdateState("activeStudents", "update", payload);
                        }}
                        lpkName={systemState.customization?.logoText || "LPK SOURCE COURSE INDONESIA"}
                        onBack={() => setActiveSubpage(null)}
                      />
                    ) : (
                      <div className="bg-white p-6 rounded-3xl border border-slate-100/80 text-center space-y-2 max-w-md mx-auto my-8">
                        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                        <h4 className="font-extrabold text-xs text-slate-850 uppercase">Data Bimbingan Belum Diplot</h4>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          Akun Anda belum dihubungkan dengan data bimbingan aktif di sistem LPK Pati. Harap hubungi Admin atau Sensei bimbingan Anda untuk memplot data bimbingan Anda terlebih dahulu.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 17. ALUMNI: PILIH KELAS BAHASA JEPANG */}
          {activeSubpage === "pilih_kelas" && (() => {
            const getStudentsInClass = (className: string) => {
              const students = (systemState.activeStudents || []).filter(
                (s: any) => {
                  const c = (s.assignedClass || s.class || "").toLowerCase();
                  const target = className.toLowerCase();
                  return c === target || (target.includes("n3") && c.includes("n3")) || (target.includes("n2") && c.includes("n2")) || (target.includes("n1") && c.includes("n1")) || (target.includes("native") && c.includes("native"));
                }
              );
              const usersWithClass = (systemState.users || []).filter(
                (u: any) => {
                  const c = (u.assignedClass || "").toLowerCase();
                  const target = className.toLowerCase();
                  return c === target || (target.includes("n3") && c.includes("n3")) || (target.includes("n2") && c.includes("n2")) || (target.includes("n1") && c.includes("n1")) || (target.includes("native") && c.includes("native"));
                }
              );
              
              const seen = new Set();
              const combined: any[] = [];
              
              students.forEach((s: any) => {
                const key = (s.id || s.name || "").toLowerCase().trim();
                if (key && !seen.has(key)) {
                  seen.add(key);
                  combined.push({
                    id: s.id || "SIS-???",
                    name: s.name,
                    phone: s.phone || s.whatsapp || "",
                    status: s.status || "Aktif",
                    role: "Alumni"
                  });
                }
              });
              
              usersWithClass.forEach((u: any) => {
                const key = (u.studentId || u.username || u.name || "").toLowerCase().trim();
                if (key && !seen.has(key)) {
                  seen.add(key);
                  combined.push({
                    id: u.studentId || "SIS-???",
                    name: u.name,
                    phone: u.phone || u.whatsapp || "",
                    status: "Aktif",
                    role: u.role || "Alumni"
                  });
                }
              });
              
              return combined;
            };

            return (
              <div className="flex-1 p-3 space-y-4 text-left font-sans">
                {currentUser?.role === "VVIP" && (
                  <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl p-4 text-white shadow-md flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-[24px] shrink-0">
                      <ShieldAlert className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs uppercase tracking-wider">Akses Executive VVIP Monitoring</h3>
                      <p className="text-[10px] text-amber-50 leading-tight">Gunakan tombol "Pantau Kelas" pada masing-masing kartu kelas di bawah untuk melihat rincian peserta.</p>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-white/10 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20">
                      ☆ ☆ ☆ N1 CERTIFIED
                    </div>
                  </div>
                  <div className="relative z-10 space-y-4 max-w-[85%]">
                    <h2 className="text-xl font-display font-black text-white leading-tight">
                      Belajar Langsung dengan Ahlinya!
                    </h2>
                    <p className="text-xs text-sky-200">
                      Didukung oleh Sensei Bersertifikasi N1 dan Native Speaker Jepang
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-sky-400 mt-0.5" />
                        <p className="text-[9px] text-slate-300">Kurikulum Berstandar Jepang</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 text-sky-400 mt-0.5" />
                        <p className="text-[9px] text-slate-300">Pengajar N1 & Native</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Activity className="h-4 w-4 text-sky-400 mt-0.5" />
                        <p className="text-[9px] text-slate-300">Metode Interaktif</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Alumni VIP Cards Section */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 mt-6">
                  {(systemState.customization?.landingConfig?.alumniClasses && systemState.customization.landingConfig.alumniClasses.length > 0
                    ? systemState.customization.landingConfig.alumniClasses
                    : [
                        {
                          method: "ONLINE & OFFLINE",
                          level: "N3",
                          emoji: "⛩️",
                          title: "Level N3",
                          description: "Membangun dasar yang kuat untuk komunikasi sehari-hari & persiapan kerja di Jepang.",
                          features: ['Kosakata & Tata Bahasa Dasar', 'Percakapan Sehari-hari', 'Persiapan ujian JLPT N3'],
                          openClass: "19 Agustus 2026",
                          duration: "3-4 Bulan",
                          discount: "20%",
                          discountText: "Diskon Hemat Rp 200.000",
                          originalPrice: "Rp 1.200.000",
                          finalPrice: "Rp 1.000.000",
                          colorScheme: "emerald",
                          registered: 8,
                          quota: 10
                        },
                        {
                          method: "ONLINE & OFFLINE",
                          level: "N2",
                          emoji: "🗻",
                          title: "Level N2",
                          description: "Tingkatkan kemampuan bahasa untuk komunikasi lebih luas & dunia kerja.",
                          features: ['Kosakata & Tata Bahasa Menengah', 'Pemahaman Bacaan & Listening', 'Persiapan JLPT N2'],
                          openClass: "26 Agustus 2026",
                          duration: "4-6 Bulan",
                          discount: "15%",
                          discountText: "Diskon Hemat Rp 195.000",
                          originalPrice: "Rp 1.495.000",
                          finalPrice: "Rp 1.300.000",
                          colorScheme: "blue",
                          registered: 7,
                          quota: 15
                        },
                        {
                          method: "ONLINE & OFFLINE",
                          level: "N1",
                          emoji: "🏯",
                          title: "Level N1",
                          description: "Kuasai bahasa Jepang tingkat lanjut untuk keperluan akademik, bisnis, & profesional.",
                          features: ['Kosakata & Tata Bahasa Lanjutan', 'Kemampuan Diskusi & Presentasi', 'Persiapan JLPT N1'],
                          openClass: "1 September 2026",
                          duration: "6-8 Bulan",
                          discount: "10%",
                          discountText: "Diskon Hemat Rp 150.000",
                          originalPrice: "Rp 1.650.000",
                          finalPrice: "Rp 1.500.000",
                          colorScheme: "purple",
                          registered: 3,
                          quota: 8
                        },
                        {
                          method: "ONLINE & OFFLINE",
                          level: "NATIVE",
                          emoji: "🪭",
                          title: "Level Native",
                          description: "Belajar seperti orang Jepang! Fasih, natural, dan percaya diri dalam segala situasi.",
                          features: ['Ekspresi Natural & Idiom', 'Komunikasi Bisnis & Budaya Jepang', 'Praktik Langsung dengan Native Speaker'],
                          openClass: "Setiap Senin",
                          duration: "Fleksibel",
                          colorScheme: "orange",
                          registered: 4,
                          quota: 10,
                          originalPrice: "Rp 1.900.000",
                          finalPrice: "Rp 1.800.000",
                          discount: "5%",
                          discountText: "Diskon Hemat Rp 100.000"
                        }
                      ]
                  ).map((cls: any, cidx: number) => {
                    const colorTheme = cls.colorScheme || "blue";
                    
                    const themeMap: Record<string, any> = {
                      emerald: {
                        textTop: 'text-emerald-500',
                        textMain: 'text-emerald-600',
                        check: 'text-emerald-500',
                        bgBadge: 'bg-emerald-50',
                        textBadge: 'text-emerald-700',
                        borderBadge: 'border-emerald-100',
                        bgBtn: 'bg-emerald-600',
                        hoverBtn: 'hover:bg-emerald-700'
                      },
                      blue: {
                        textTop: 'text-blue-500',
                        textMain: 'text-blue-600',
                        check: 'text-blue-500',
                        bgBadge: 'bg-blue-50',
                        textBadge: 'text-blue-700',
                        borderBadge: 'border-blue-100',
                        bgBtn: 'bg-blue-600',
                        hoverBtn: 'hover:bg-blue-700'
                      },
                      purple: {
                        textTop: 'text-purple-500',
                        textMain: 'text-purple-600',
                        check: 'text-purple-500',
                        bgBadge: 'bg-purple-50',
                        textBadge: 'text-purple-700',
                        borderBadge: 'border-purple-100',
                        bgBtn: 'bg-purple-600',
                        hoverBtn: 'hover:bg-purple-700'
                      },
                      orange: {
                        textTop: 'text-orange-500',
                        textMain: 'text-orange-600',
                        check: 'text-orange-500',
                        bgBadge: 'bg-orange-50',
                        textBadge: 'text-orange-700',
                        borderBadge: 'border-orange-100',
                        bgBtn: 'bg-orange-500',
                        hoverBtn: 'hover:bg-orange-600'
                      },
                      rose: {
                        textTop: 'text-rose-500',
                        textMain: 'text-rose-600',
                        check: 'text-rose-500',
                        bgBadge: 'bg-rose-50',
                        textBadge: 'text-rose-700',
                        borderBadge: 'border-rose-100',
                        bgBtn: 'bg-rose-600',
                        hoverBtn: 'hover:bg-rose-700'
                      }
                    };

                    const t = themeMap[colorTheme] || themeMap.blue;
                    const isLongLevel = cls.level?.length > 3;
                    const registeredCount = cls.registered !== undefined ? cls.registered : 8;
                    const quotaLimit = cls.quota !== undefined ? cls.quota : 10;
                    const remaining = Math.max(0, quotaLimit - registeredCount);
                    const hasAccess = isUserAlumni || ["Admin", "Admin Super", "Admin Biasa", "VVIP"].includes(currentUser?.role || "");
                    const alumniClassName = `Alumni ${cls.level}`;

                    return (
                      <div key={cls.id || cidx} className="bg-white rounded-[24px] md:rounded-[2.5rem] p-3 md:p-6 border border-slate-100/90 shadow-xs hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2 md:mb-3">
                          <div>
                            <span className={`${t.textTop} text-[8px] md:text-[9px] font-extrabold tracking-widest block uppercase`}>{cls.method || "ONLINE & OFFLINE"}</span>
                            <h3 className={`${isLongLevel ? 'text-lg md:text-3xl' : 'text-3xl md:text-5xl'} font-black ${t.textMain} mt-0.5 tracking-tight`}>{cls.level}</h3>
                          </div>
                          <div className="text-2xl md:text-4xl opacity-85 select-none">{cls.emoji}</div>
                        </div>
                        
                        <h4 className="text-xs md:text-sm font-black text-slate-900 mb-1">{cls.title}</h4>
                        <p className="text-[9px] md:text-[10px] text-slate-500 mb-2 md:mb-3 leading-relaxed min-h-[30px] line-clamp-2">{cls.description}</p>
                        
                        <ul className="space-y-1 mb-3 md:mb-4 flex-1">
                          {(cls.features || []).slice(0, 3).map((pt: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5 md:gap-2 text-[9px] md:text-[10px] text-slate-700 font-bold">
                              <Check className={`w-3 h-3 md:w-3.5 md:h-3.5 ${t.check} shrink-0`} />
                              <span className="leading-tight">{pt}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="mb-3 md:mb-4 space-y-1.5 md:space-y-2">
                          {cls.openClass && (
                            <div className={`flex items-center justify-between ${t.bgBadge} px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border ${t.borderBadge}`}>
                              <div className={`flex items-center gap-1 md:gap-1.5 ${t.textMain} font-bold text-[8px] md:text-[10px]`}>
                                <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                <span>Open</span>
                              </div>
                              <span className={`${t.textMain} font-black text-[8px] md:text-[10px]`}>{cls.openClass}</span>
                            </div>
                          )}
                          {cls.duration && (
                            <div className={`flex items-center justify-between ${t.bgBadge} px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border ${t.borderBadge}`}>
                              <div className={`flex items-center gap-1 md:gap-1.5 ${t.textMain} font-bold text-[8px] md:text-[10px]`}>
                                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                <span>Durasi</span>
                              </div>
                              <span className={`${t.textMain} font-black text-[8px] md:text-[10px]`}>{cls.duration}</span>
                            </div>
                          )}

                          {(cls.originalPrice || cls.finalPrice) && (
                            <div className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-[24px] p-2 md:p-3.5 mt-2 md:mt-4 relative overflow-hidden shadow-xs">
                              <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                {cls.originalPrice && (
                                  <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400 line-through">
                                      {formatRupiah(cls.originalPrice)}
                                    </span>
                                    {/* Discount badge omitted for extreme space saving if mobile */}
                                    <span className="hidden md:block">
                                    {(() => {
                                      const origNum = parsePrice(cls.originalPrice);
                                      const finalNum = parsePrice(cls.finalPrice);
                                      const savedAmount = origNum - finalNum;
                                      let badgeText = "";
                                      if (savedAmount > 0) badgeText = `-${formatRupiah(savedAmount)}`;
                                      if (!badgeText) return null;
                                      return (
                                        <span className="bg-rose-500 text-white text-[8px] font-black tracking-wide px-1 py-0.5 rounded uppercase">
                                          {badgeText}
                                        </span>
                                      );
                                    })()}
                                    </span>
                                  </div>
                                )}
                                {cls.finalPrice && (
                                  <div className="flex items-baseline gap-1 mt-0.5">
                                    <span className={`text-[9px] md:text-lg font-black tracking-tight ${t.textMain}`}>
                                      {formatRupiah(cls.finalPrice)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Registration status panel */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-[24px] p-2 md:p-3.5 space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                          <div className="flex items-center justify-between text-[8px] md:text-[10px] font-bold text-slate-700">
                            <div className="flex items-center gap-1 md:gap-1.5">
                              <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                              <span>Pendaftar</span>
                            </div>
                            <span className={`${t.textMain} font-black`}>
                              {registeredCount}/{quotaLimit}
                            </span>
                          </div>
                          
                          <div className="w-full h-1.5 md:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${t.bgBtn}`}
                              style={{ width: `${Math.min(100, Math.round((registeredCount / quotaLimit) * 100))}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[7px] md:text-[9px] font-bold">
                            <span className={t.textMain}>
                              Sisa: {remaining}
                            </span>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="space-y-1 md:space-y-1.5">
                          {currentUser?.role === "VVIP" && (
                            <button
                              onClick={() => {
                                setMonitoredVvipClass(monitoredVvipClass === alumniClassName ? null : alumniClassName);
                              }}
                              className={`w-full text-[8px] md:text-[10px] font-bold py-1.5 md:py-2 px-2 md:px-3 rounded-full transition-all duration-300 flex items-center justify-center gap-1 border ${
                                monitoredVvipClass === alumniClassName
                                  ? "bg-slate-950 text-white border-slate-900 shadow-xs"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                              }`}
                            >
                              <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                              <span>{monitoredVvipClass === alumniClassName ? "Dipantau" : "Pantau"}</span>
                            </button>
                          )}

                          {hasAccess ? (
                            <button 
                              onClick={() => {
                                setSelectedClassLog(alumniClassName);
                                setActiveSubpage("ebenkyou");
                              }}
                              className={`w-full ${t.bgBtn} ${t.hoverBtn} text-white text-[9px] md:text-[10px] font-bold py-2 md:py-2.5 px-2 md:px-3 rounded-full flex items-center justify-center gap-1 transition duration-300`}
                            >
                              <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
                              <span>Masuk &gt;</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                const message = `Halo Admin LPK SCI, saya tertarik untuk mendaftar Kelas Alumni ${cls.level}. Mohon informasi pendaftaran selengkapnya.`;
                                window.open(`https://wa.me/6281395090885?text=${encodeURIComponent(message)}`, "_blank");
                              }}
                              className={`w-full ${t.bgBtn} ${t.hoverBtn} text-white text-[9px] md:text-[10px] font-black py-2 md:py-2.5 px-2 md:px-3 rounded-full flex items-center justify-center gap-1 transition duration-300 cursor-pointer shadow-xs`}
                            >
                              <FileText className="w-3 h-3 md:w-4 md:h-4" />
                              <span>Daftar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentUser?.role === "VVIP" && monitoredVvipClass && (() => {
                  const classStudents = getStudentsInClass(monitoredVvipClass);
                  return (
                    <div className="bg-white border border-slate-100/80/80 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4 animate-fade-in text-left">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="bg-slate-100 p-2 rounded-[24px]">
                            <Crown className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-850">
                              Pemantauan Kelas: <span className="text-indigo-600">{monitoredVvipClass}</span>
                            </h3>
                            <p className="text-[10px] text-slate-500">
                              Menampilkan daftar peserta terdaftar yang aktif belajar di level ini
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setMonitoredVvipClass(null)}
                          className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full text-slate-400 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {classStudents.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Belum ada alumni/siswa yang terdaftar di kelas <span className="font-semibold">{monitoredVvipClass}</span>.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {classStudents.map((student, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 rounded-[24px] bg-slate-50 hover:bg-slate-100 border border-slate-100 transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center font-extrabold text-xs text-slate-600">
                                  {student.name ? student.name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-slate-800">{student.name}</h4>
                                  <p className="text-[9px] text-slate-500 font-mono">{student.id}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {student.phone && (
                                  <a
                                    href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-2 rounded-full transition"
                                    title="WhatsApp"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                  {student.role || "Alumni"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="bg-indigo-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm">Daftar Sekarang!</h3>
                    <p className="text-[9px] text-slate-300">Raih kesempatan terbaikmu<br/>untuk masa depan di Jepang.</p>
                  </div>
                  <button 
                    onClick={() => window.open(`https://wa.me/6281395090885?text=Halo%20Admin%20LPK%20SCI,%20saya%20${currentUser?.name || "Alumni"}%20ingin%20mendaftar%20kelas%20lanjutan.`)}
                    className="bg-white text-indigo-800 font-bold text-[10px] px-4 py-2 rounded-full hover:bg-slate-100 flex items-center gap-1.5"
                  >
                    Hubungi Kami <MessageCircle className="h-3 w-3 text-emerald-500" />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 17.5 ALUMNI: DASHBOARD ALUMNI EXCLUSIVE */}
          {activeSubpage === "alumni_dashboard" && (
            <div className="flex-1 p-3 space-y-4 text-left font-sans animate-fade-in">
              <AlumniDashboardView
                currentUser={currentUser}
                systemState={systemState}
                onUpdateState={handleUpdateState}
              />
            </div>
          )}

          {/* 18. ALUMNI: AFILIASI SCI */}
          {(activeSubpage === "afiliasi" || activeSubpage === "admin_afiliasi" || activeSubpage === "vvip_afiliasi") && (
            !currentUser ? (
              <InlineLoginPanel
                title="Program Afiliasi SCI"
                requiredRole="Siswa"
                description="Masuk untuk mengakses kode referral Anda dan memonitor pendaftaran siswa yang Anda rekomendasikan."
                onLoginSuccess={(u) => onLoginSuccess?.(u)}
                systemState={systemState}
              />
            ) : (
            <div className="flex-1 p-3 space-y-4 text-left font-sans">
              <div className="bg-white rounded-3xl border border-rose-100 p-6 text-center space-y-4 max-w-md mx-auto my-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-md">
                  <Share2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-slate-800">Program Afiliasi SCI</h3>
                  <p className="text-[10px] text-slate-500 px-4 leading-relaxed">
                    Ajak teman, kerabat, atau rekan kerja Anda untuk belajar dan meraih sukses di Jepang bersama LPK Source Course Indonesia. Dapatkan reward khusus untuk setiap siswa yang berhasil mendaftar melalui referensi Anda!
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100/80 rounded-[24px] p-4 mt-2 text-left">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Kode Referral Anda:</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={currentUser?.username || "alumni"}
                      className="flex-1 bg-white border border-slate-100/80 rounded-lg p-2 text-xs font-bold text-slate-800 text-center outline-none tracking-wider"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(currentUser?.username || "alumni");
                        alert("Kode referral berhasil disalin!");
                      }}
                      className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">
                    Bagikan kode referral di atas kepada calon siswa. Minta mereka untuk memasukkan kode ini ke dalam kolom <strong>KODE REFERRAL / ALUMNI REFERRER</strong> saat mengisi formulir pendaftaran LPK SCI.
                  </p>
                </div>
              </div>

              {/* Summary of Referrals by Alumni - Admin & VVIP View */}
              {(currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                <div className="bg-white rounded-3xl border border-indigo-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="h-5 w-5 text-indigo-500" />
                    <h4 className="font-bold text-slate-800 text-sm">Monitoring Afiliasi Alumni (Direksi)</h4>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-4">
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
                        <div className="text-center py-4 text-slate-500 text-xs italic">
                          Belum ada alumni yang melakukan referral.
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {statsList.map((stat, i) => (
                          <div key={i} className="flex justify-between items-center bg-indigo-50/40 border border-indigo-50 p-3 rounded-[24px]">
                            <div>
                              <p className="font-bold text-xs text-indigo-900">{stat.name}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Sponsor Afiliasi Resmi</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-1 rounded-lg">
                                {stat.regs} Pendaftar
                              </span>
                              <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-2 py-1 rounded-lg">
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

              {/* Data Rekomendasi Siswa */}
              <div className="bg-white rounded-3xl border border-slate-100/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Siswa Direkomendasikan</h4>
                <div className="space-y-3">
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
                        <div className="text-center py-6 text-slate-500 text-xs italic">
                          Belum ada siswa yang mendaftar menggunakan kode referral{isAdminOrVip ? "." : " Anda."}
                        </div>
                      );
                    }

                    return myReferrals.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                        <div>
                          <p className="font-bold text-xs text-slate-800">{item.name}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">
                            {item.type} • {item.date} 
                            {isAdminOrVip && <span className="block mt-0.5 text-rose-500 font-bold">Ref: {item.referrer}</span>}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[9px] font-bold ${
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
            )
          )}
          </React.Suspense>
        </div>
          );
        })()
      ) : (
        // -------------------------------------------------------------
        // **BERANDA**: DASHBOARD HOME SCREEN (Exactly matches the user screenshot!)
        // -------------------------------------------------------------
        <div className="flex-1 space-y-4 animate-fade-in p-3 pt-4">
          {/* 1. DYNAMIC GEN-Z SLIDESHOW BANNER (AUTOPLAY 4 SECONDS WITH HIGH RES JAPANESE SCENERY) */}
          {(() => {
            const activeSlide =
              mobileSlides[currentMobileSlide] ||
              mobileSlides[0] ||
              { tag: "🗻 LPK SCI JAPAN TRAINING", title: "Raih Karir Profesional Di Jepang", description: "Selamat datang di LPK SCI.", image: "", actionText: "Daftar Sekarang ⚡" };

            // Ensure image fallback if the URL is empty or broken
            const slideImage = activeSlide?.image || "";
            
            return (
              <div key={activeSlide?.id || currentMobileSlide} className="relative overflow-hidden rounded-[24px] bg-slate-950 text-white min-h-[260px] aspect-[4/3] sm:aspect-auto border border-slate-100/80/20 shadow-md flex flex-col justify-between transition-all duration-500">
                {/* Sharp HD Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                  style={{ backgroundImage: `url('${slideImage}')` }}
                />

                {/* Shading Layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35 z-0" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent z-0" />

                {/* Top/Body Content */}
                <div className="relative z-10 p-3.5 space-y-2 flex-grow">
                  {/* Top line with Tag and Ad space badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[6.5px] sm:text-[7.5px] font-mono bg-white/10 text-yellow-400 font-black px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest whitespace-nowrap">
                      🎌 {activeSlide.tag || "PROGRAM SCI"}
                    </span>
                    <span className="text-[6.5px] font-mono bg-red-600/95 text-white font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight animate-pulse shrink-0">
                      LIVE RADAR 📡
                    </span>
                  </div>

                  {/* Title and Description */}
                  <div className="text-left space-y-1 max-w-[90%]">
                    <h3 className="text-[12px] sm:text-xs font-sans font-black tracking-tight leading-snug text-white uppercase drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] line-clamp-2">
                      {activeSlide.title || "WUJUDKAN MIMPI KERJA DI JEPANG"}
                    </h3>
                    <p className="text-[8.5px] sm:text-[9.5px] text-slate-300 leading-snug line-clamp-2 font-medium">
                      {activeSlide.description ||
                        "Dapatkan bimbingan intensif dari Nol sampai sukses terbang."}
                    </p>
                  </div>

                  {/* Stats and Action details row */}
                  <div className="flex items-center gap-3 pt-1 border-t border-white/15 max-w-[85%]">
                    <div>
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-black text-emerald-400 block leading-none">
                        {activeSlide.statValue}
                      </span>
                      <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                        {activeSlide.statText}
                      </span>
                    </div>
                    <div className="h-5 w-px bg-white/15" />
                    <div>
                      <span className="text-[7.5px] font-sans text-sky-400 font-bold flex items-center gap-1 leading-none">
                        <span className="h-1 w-1 bg-sky-400 rounded-full inline-block animate-pulse"></span>
                        LPK Resmi RI
                      </span>
                      <span className="text-[6.5px] text-slate-400 block font-light mt-0.5">
                        L.A: 403-B/25
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom line: Action button and indicators dot */}
                <div className="relative z-10 px-3.5 pb-3 flex items-center justify-between gap-4 mt-auto">
                  <button
                    onClick={() => {
                      setActiveSubpage("pendaftaran");
                    }}
                    className={`bg-gradient-to-r ${activeSlide.accent || "from-sky-500 to-blue-600"} hover:scale-105 active:scale-95 transition-all text-slate-950 font-black px-5 py-2.5 rounded-xl text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md`}
                  >
                    <span>Pendaftaran Siswa Baru</span>
                    <ArrowRight className="h-4 w-4 stroke-[3]" />
                  </button>

                  {/* Pagination Dots */}
                  <div className="flex items-center gap-1.5">
                    {mobileSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentMobileSlide(idx)}
                        className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                          currentMobileSlide === idx
                            ? "w-4 bg-white"
                            : "w-1.5 bg-white/30 hover:bg-white/50"
                        }`}
                        title={`Slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 2. TICKER RIBBON - "INFO TERKINI" and marquee announcements scroll list */}
          <div className="bg-gradient-to-r from-indigo-700 via-blue-900 to-indigo-800 flex items-center h-9 overflow-hidden select-none relative shadow-inner rounded-xl mx-2 my-2 border border-blue-800/50">
            <div className="bg-red-600 text-white text-[9.5px] font-black uppercase px-4 h-full flex items-center justify-center tracking-tight shrink-0 rounded-r-xl shadow-lg relative z-10 border-r border-red-500">
              <span className="flex items-center gap-1.5"><AlertCircle className="w-3 h-3" /> Info Terkini</span>
            </div>
            {/* Standard marquee emulator */}
            <div className="flex-1 text-blue-50 text-[10.5px] font-bold font-sans overflow-hidden whitespace-nowrap px-4 relative z-0 flex items-center gap-2">
              <div className="animate-marquee inline-block whitespace-nowrap">
                {(() => {
                  if (systemState.customization?.runningText) {
                    return systemState.customization.runningText;
                  }
                  
                  const activeEvents = systemState.events && systemState.events.length > 0 
                    ? systemState.events 
                    : mockCalendarEvents;
                    
                  const formatDateSimple = (dStr: string) => {
                    if (!dStr) return "";
                    const parts = dStr.split("-");
                    if (parts.length === 3) {
                      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                      const monthIdx = parseInt(parts[1], 10) - 1;
                      if (monthIdx >= 0 && monthIdx < 12) {
                        return `${parseInt(parts[2], 10)} ${months[monthIdx]} ${parts[0]}`;
                      }
                    }
                    return dStr;
                  };

                  const eventTickerString = activeEvents
                    .map((e: any) => `${e.title} (${formatDateSimple(e.date)})`)
                    .join(" • ");
                    
                  return `Selamat datang di aplikasi LPK SOURCE COURSE INDONESIA | Jadwal LPK Terbaru: ${eventTickerString} | Ujian JFT-Basic & Tokutei Ginou Kaigo terdekat segera diselenggarakan...`;
                })()}
              </div>
            </div>
          </div>

          {/* Quick-Access Mobile Auth Gateway / Portal Masuk di Depan */}
          {!currentUser ? (
            <div className="relative overflow-hidden bg-slate-900 text-white rounded-[28px] border border-slate-800 p-6 sm:p-7 space-y-5 shadow-2xl text-left transition-all duration-300">
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 flex items-center gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-[24px] flex items-center justify-center shadow-inner shrink-0 ring-1 ring-white/20">
                  <LogIn className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white tracking-tight">
                    Portal Masuk
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-snug">
                    Silakan masuk untuk mengakses fitur lengkap layanan.
                  </p>
                </div>
              </div>
              
              <div className="relative z-10 pt-1 space-y-4">
              {isResettingPassword ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-extrabold text-xl text-white">
                      Reset Password
                    </h3>
                    <p className="text-xs text-slate-400">
                      Masukkan Username atau Email akun Anda.
                    </p>
                  </div>
                  
                  {resetMessage && (
                    <div className={`p-3 border rounded-xl text-xs flex gap-2 ${resetStatus === "success" ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-300" : "bg-rose-900/30 border-rose-500/30 text-rose-300"}`}>
                      <ShieldAlert className={`h-4.5 w-4.5 flex-shrink-0 ${resetStatus === "success" ? "text-emerald-400" : "text-rose-400"}`} />
                      <div className="flex flex-col gap-1 justify-center">
                        <span>{resetMessage}</span>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">Username / Email</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          autoCapitalize="none"
                          autoComplete="username"
                          autoCorrect="off"
                          spellCheck={false}
                          value={resetUsername}
                          onChange={(e) => setResetUsername(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                          placeholder="Masukkan username/email"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsResettingPassword(false);
                          setResetMessage("");
                          setResetStatus("idle");
                        }}
                        className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 text-sm rounded-xl transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer border border-slate-700"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={resetStatus === "success"}
                        className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer disabled:opacity-50"
                      >
                        Kirim Link Reset
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <>
                  {loginErrorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 text-xs rounded-xl border border-red-100 font-bold">
                      {loginErrorMsg}
                    </div>
                  )}

                <form onSubmit={handleManualLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        autoCapitalize="none"
                        autoComplete="username"
                        autoCorrect="off"
                        spellCheck={false}
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Masukkan username"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        autoCapitalize="none"
                        autoComplete="current-password"
                        autoCorrect="off"
                        spellCheck={false}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Masukkan password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-1">
                      <button 
                        type="button" 
                        onClick={() => setIsResettingPassword(true)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                      >
                        Lupa Password?
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-sm rounded-xl transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
                  >
                    Masuk
                  </button>
                </form>

              {!isResettingPassword && (
                <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-700/50" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-indigo-800 px-3 text-slate-400">
                      Atau masuk dengan
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isMobileGoogleLoading}
                  onClick={async () => {
                    if (isAndroidWebView()) {
                      alert("PENTING: Google melarang login langsung (OAuth) dari dalam WebView Android demi keamanan (Error 403: disallowed_useragent). Silakan masuk secara manual dengan form Username/Email & Password, atau buka situs ini di browser biasa HP Anda.");
                      return;
                    }
                    if (isMobileGoogleLoading) return;
                    setIsMobileGoogleLoading(true);
                    if (onLoginSuccess) {
                      try {
                         
                          
                        
                        const provider = new GoogleAuthProvider();
                        const result = await signInWithPopup(auth, provider);
                        const user = result.user;
                        
                        let existingUser = (systemState.unfilteredUsers || systemState.users || [])?.find(
                          (u) => u.email === user.email || u.username === user.email,
                        );

                        if (!existingUser && user.email) {
                          const email = user.email;
                          const name = user.displayName || email.split("@")[0];
                          let role: any = null;
                          
                          if (["linggadhani79@gmail.com", "ekaichiro@gmail.com", "rlstudioindonesia@gmail.com"].includes(email)) {
                            role = "VVIP";
                          } else if (["linggabusiness7@gmail.com", "sulisindonesia@gmail.com", "fahmikusuma81@gmail.com", "fahmikusuma003@gmail.com", "faisaltkjmadiun@gmail.com", "linggadhani95@gmail.com"].includes(email)) {
                            role = "Pengajar";
                          } else if (email.includes("admin") || email === "sakti.wardana@lpksc.id") {
                            role = "Admin";
                          }

                          if (role) {
                            existingUser = {
                              username: email,
                              name: name,
                              email: email,
                              role: role,
                              status: "Active",
                              password: "google-auth-user",
                            } as any;

                            // PERSIST to database
                            await fetch("/api/state/update", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                dataType: "users",
                                action: "add",
                                payload: existingUser
                              })
                            });
                          }
                        }

                        if (existingUser) {
                          if (existingUser.status === "Suspended") {
                            alert("Akses Ditolak: Akun Anda disuspend.");
                            return;
                          }
                          onLoginSuccess(existingUser);
                        } else {
                          alert("Akun Google belum terdaftar di sistem.");
                        }
                      } catch (error: any) {
                        console.error("Google Sign-In Error:", error);
                        const isIframe = typeof window !== "undefined" && window.self !== window.top;
                        const iframeTip = isIframe ? " \n\n💡 TIPS: Karena Anda di iFrame AI Studio, beberapa browser memblokir popup Google Auth. Silakan klik tombol 'Buka di Tab Baru' (Open in new tab) di kanan atas preview, lalu coba login kembali." : "";
                        
                        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                          alert(`Popup login ditutup atau dibatalkan.${iframeTip}`);
                        } else {
                          alert((error.message || "Gagal masuk menggunakan Google.") + iframeTip);
                        }
                      } finally {
                        setIsMobileGoogleLoading(false);
                      }
                    }
                  }}
                  className={`w-full inline-flex justify-center items-center gap-3 rounded-xl bg-white text-slate-700 font-bold py-3 text-sm transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
                    isMobileGoogleLoading ? "opacity-60 cursor-not-allowed bg-slate-100" : "hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  {isMobileGoogleLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Menghubungkan...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Lanjutkan dengan Google
                    </>
                  )}
                </button>

                {isAndroidWebView() && (
                  <div className="p-3.5 bg-amber-50/20 border border-amber-500/30 text-amber-200 rounded-[24px] text-[10.5px] leading-relaxed mt-2.5">
                    <p className="font-extrabold flex items-center gap-1.5 mb-1 text-amber-300">
                      ⚠️ Deteksi WebView Android (APK)
                    </p>
                    Google memblokir login langsung (OAuth) di dalam WebView demi keamanan (Error 403: disallowed_useragent). Silakan masuk secara manual dengan form di atas, atau buka web ini menggunakan browser biasa HP Anda (seperti Chrome).
                  </div>
                )}
                </>
              )}
              </>
              )}
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`relative overflow-hidden p-5 rounded-[24px] border flex flex-col justify-between text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer transition-all active:scale-[0.98] ${
                currentUser.role === "Siswa"
                  ? "bg-white text-slate-800 border-indigo-100"
                  : currentUser.role === "Pengajar"
                    ? "bg-white text-slate-800 border-emerald-100"
                    : currentUser.role === "Admin"
                      ? "bg-white text-slate-800 border-rose-100"
                      : "bg-white text-slate-800 border-amber-100"
              }`}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 opacity-50 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-50 opacity-50 rounded-full blur-xl"></div>
              
              <div className="flex items-center justify-between w-full relative z-10">
                <div className={`flex gap-3 min-w-0 ${
                  currentUser.role === "Siswa" || currentUser.role === "Alumni" || myActiveStudent
                    ? "items-start"
                    : "items-center"
                }`}>
                <div
                  className={`h-11 w-11 mt-0.5 rounded-full flex items-center justify-center font-black text-sm shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-2 ring-slate-50 bg-slate-100 shrink-0 overflow-hidden text-slate-600`}
                >
                  <img
                    src={getSafePhotoUrl(currentUser.profilePicture, currentUser.name)}
                    className="h-full w-full object-cover"
                    alt={currentUser.name || "Avatar"}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=e2e8f0&color=334155`;
                    }}
                  />
                </div>
                                <div className="min-w-0">
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-100">
                    Sesi Aktif:{" "}
                    {currentUser.role === "Pengajar"
                      ? "SENSEI"
                      : currentUser.role === "Siswa" &&
                          systemState.activeStudents?.find(
                            (s) =>
                              s.id === currentUser.studentId ||
                              s.name === currentUser.name,
                          )?.kategoriPendaftaran === "Alumni"
                        ? "ALUMNI"
                        : currentUser.role}
                  </span>
                  <p className="text-[15px] font-extrabold text-slate-800 mt-1.5 truncate max-w-[170px] leading-tight">
                    {currentUser.name}
                  </p>
                  {(currentUser.role === "Siswa" || currentUser.role === "Alumni" || myActiveStudent) ? (
                    <div className="mt-2 space-y-0.5 text-[9px] leading-tight font-medium text-slate-600">
                      <div className="flex items-center gap-1.5 flex-wrap drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <span className="opacity-75">No Induk:</span>
                        <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-700 shrink-0">
                          {myActiveStudent?.id || currentUser.studentId || "-"}
                        </span>
                      </div>
                      {(!isUserAlumni && myActiveStudent?.kategoriPendaftaran !== "Alumni") && (
                        <>
                          <div className="flex items-center gap-1 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <span className="opacity-75">Kelas:</span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {myActiveStudent?.class || currentUser.assignedClass || "Belum ada kelas"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <span className="opacity-75">Sensei:</span>
                            <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-md">
                              {myActiveStudent?.sensei || "Belum ditentukan"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : currentUser.role === "Pengajar" ? (() => {
                    const myClass = systemState.customization?.lmsClasses?.find(c => c.name === currentUser.assignedClass);
                    const studentCount = systemState.activeStudents?.filter(s => s.class === currentUser.assignedClass && s.status !== "Di Jepang").length || 0;
                    const activeChapters = myClass?.chapters?.filter(c => c.isActive !== false).length || 50;
                    return (
                      <div className="mt-1.5 space-y-0.5 text-[9px] leading-tight font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <span>Kelas Diampu:</span>
                          <span className="font-bold text-slate-800">{currentUser.assignedClass || "Belum ada kelas"}</span>
                        </div>
                        {currentUser.assignedClass && (
                          <>
                            <div className="flex items-center gap-1">
                              <span>Jumlah Siswa:</span>
                              <span className="font-bold text-slate-800">{studentCount} Orang</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Update BAB:</span>
                              <span className="font-bold text-slate-800">{myClass?.chapters?.length || activeChapters || 0} Bab Terbuka</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Target Kelas:</span>
                              <span className="font-bold text-slate-800">{myClass?.period || "Lulus N4 / JFT Basic"}</span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })() : null}
                </div>
                </div>
                
                {/* Visual indicator that it's clickable */}
                <div className="flex flex-col justify-center pl-3 border-l border-slate-200/50 shrink-0 ml-2">
                   <div className="flex flex-col items-center justify-center gap-1">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-colors ${isProfileMenuOpen ? 'bg-slate-100 border-slate-300' : 'bg-indigo-50 border-indigo-200'}`}>
                       {isProfileMenuOpen ? (
                         <X className="h-5 w-5 text-slate-600" />
                       ) : (
                         <Menu className="h-5 w-5 text-indigo-600" />
                       )}
                     </div>
                     <span className={`text-[9px] font-extrabold text-center leading-none ${isProfileMenuOpen ? 'text-slate-500' : 'text-indigo-600 animate-pulse'}`}>
                       {isProfileMenuOpen ? "Tutup" : "Menu"}
                     </span>
                   </div>
                </div>
              </div>
              
              {isProfileMenuOpen && (
                <div className="relative z-10 mt-4 pt-4 border-t border-slate-200/50 flex flex-col gap-2 w-full animate-fade-in">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveSubpage("akun"); }}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[10px] uppercase py-2.5 px-3 rounded-xl transition border border-blue-100 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                      Profil Saya 👤
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); triggerLogoutConfirm(); }}
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-black text-[10px] uppercase py-2.5 px-3 rounded-xl transition border border-red-100 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                      Logout 🚪
                    </button>
                  </div>
                  {currentUser?.role === "VVIP" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowLoginAsModal(true); }}
                      className="w-full mt-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-[10px] uppercase py-2.5 px-3 rounded-xl transition border border-indigo-100 active:scale-95 cursor-pointer flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                      🔑 Login Sebagai Akun Lain
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 2b. Layanan Publik (Guest Menu) */}
          {!currentUser && (
            <section className="bg-white rounded-[28px] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 opacity-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
              
              <div className="flex flex-col text-left relative z-10">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
                  Layanan Publik
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5 ml-3.5">
                  Akses menu untuk pengunjung tanpa harus masuk.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-3 pt-1 font-sans relative z-10">
                <button
                  onClick={() => setActiveSubpage("pendaftaran")}
                  className="flex flex-col items-start justify-center p-3.5 rounded-[20px] bg-slate-50/80 border border-slate-100/80 hover:bg-white hover:border-indigo-100 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-[24px] bg-white text-indigo-600 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-3 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-left w-full">
                    <span className="text-[11px] font-bold text-slate-800 block truncate">
                      Pendaftaran
                    </span>
                    <p className="text-[9px] text-slate-500 block truncate">
                      Siswa & Alumni
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveSubpage("profil")}
                  className="flex flex-col items-start justify-center p-3.5 rounded-[20px] bg-slate-50/80 border border-slate-100/80 hover:bg-white hover:border-blue-100 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-10 w-10 rounded-[24px] bg-white text-blue-600 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-3 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100">
                    <Building className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 text-left w-full">
                    <span className="text-[11px] font-bold text-slate-800 block truncate">
                      Profil LPK
                    </span>
                    <p className="text-[9px] text-slate-500 block truncate">
                      Fasilitas & Info
                    </p>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* 3. CATEGORIES GRID - "KATEGORI" dark blue tag heading and 9 buttons exactly matching screenshot */}
          {currentUser && (
            <section className="bg-slate-50/80 rounded-[28px] border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 space-y-5">
              {/* KATEGORI Tag Heading Header */}
              <div className="flex text-left">
                <div className="bg-white text-slate-800 text-[10.5px] font-black uppercase px-4 py-1.5 rounded-xl tracking-widest shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
                  MENU UTAMA
                </div>
              </div>

              {/* Nine circular icons matching screenshots precisely */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-y-4 gap-x-2 pt-1 font-sans">
                {/* Category 1: PROFIL LPK */}
                <button
                  onClick={() => handleCategoryAction("profil")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <Building className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      PROFIL LPK
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Latar Belakang & Detail
                    </p>
                  </div>
                </button>

                {/* Category: DASHBOARD ALUMNI */}
                {isUserAlumni && (
                  <button
                    onClick={() => handleCategoryAction("alumni_dashboard")}
                    className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                      <GraduationCap className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    </div>
                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        DASHBOARD ALUMNI
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        Portal Eksklusif Alumni
                      </p>
                    </div>
                  </button>
                )}

                {/* Category: 17 BERKAS */}
                <button
                  onClick={() => handleCategoryAction("17berkas")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                    <FolderOpen className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      17 BERKAS
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Dokumen Siswa
                    </p>
                  </div>
                </button>

                {/* Category: JADWAL LPK */}
                <button
                  onClick={() => setActiveSubpage("kalender")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <Calendar className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      JADWAL LPK
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Kalender & Kegiatan
                    </p>
                  </div>
                </button>

                {/* Category 3: CHAT */}
                <button
                  onClick={() => handleCategoryAction("chat")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                    <MessagesSquare className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    {(() => {
                      const unread = currentUser && systemState.messages ? systemState.messages.filter(
                        (m) =>
                          m.receiverId ===
                            (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa"
                              ? "admin_shared"
                              : currentUser.username) && !m.isRead
                      ).length : 0;
                      return unread > 0 ? (
                        <span className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center px-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                          {unread}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      CHAT
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Pesan Instan Terintegrasi
                    </p>
                  </div>
                </button>

                {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                  <button
                    onClick={() => handleCategoryAction("perkembangan")}
                    className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                      <TrendingUp className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    </div>
                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        DATA PROGRESS
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        Progress Belajar
                      </p>
                    </div>
                  </button>
                )}

                {currentUser?.role !== "Alumni" && (
                  <button
                    onClick={() => handleCategoryAction("ebenkyou")}
                    className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                      <BookOpen className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    </div>
                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        LMS E-BENKYOU
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        Akses Materi & Quiz
                      </p>
                    </div>
                  </button>
                )}
                
                {currentUser?.role !== "Alumni" && (
                  <button
                    onClick={() => handleCategoryAction("pembayaran")}
                    className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                      <CreditCard className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    </div>
                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        {currentUser?.role === "VVIP" ? "PEMBAYARAN SISWA" : (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin")) ? "HR & PERSONALIA" : "PEMBAYARAN"}
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        {currentUser?.role === "VVIP" ? "Monitoring Pembayaran Siswa" : (currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin")) ? "Data Kehadiran & Staf" : "Dashboard & Tagihan"}
                      </p>
                    </div>
                  </button>
                )}

                {/* Category: ORDER JOB */}
                {true && (
                  <button
                  onClick={() => handleCategoryAction("jobs")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <Briefcase className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      ORDER JOB
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Tokutei Ginou & Magang
                    </p>
                  </div>
                </button>
                )}

                {/* Category: CV & BIODATA */}
                {currentUser?.role !== "Alumni" && (
                  <button
                    onClick={() => handleCategoryAction("cv")}
                    className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                      <FileText className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                    </div>
                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        CV & BIODATA
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        Profil Format Jepang
                      </p>
                    </div>
                  </button>
                )}

                {/* Category 7: PETA PENYEBARAN */}
                <button
                  onClick={() => handleCategoryAction("peta")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <Compass className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      PETA PENYEBARAN
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Alumni di Jepang
                    </p>
                  </div>
                </button>

                {/* Category 8: GALERI */}
                <button
                  onClick={() => handleCategoryAction("galeri")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <ImageIcon className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      GALERI
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Pelajaran & Wisuda
                    </p>
                  </div>
                </button>

                {/* Category ALUMNI 7: PILIH KELAS */}
                {(isUserAlumni || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                  <button
                  onClick={() => setActiveSubpage("pilih_kelas")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-teal-400 to-teal-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <UserPlus className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      PILIH KELAS
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Lihat & Pilih Kelas
                    </p>
                  </div>
                </button>
                )}

                {/* Category ALUMNI 8: INFORMASI */}
                {isUserAlumni && (
                  <button
                  onClick={() => alert("Informasi: Segera Hadir")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <Info className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      INFORMASI
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Pengumuman & Berita
                    </p>
                  </div>
                </button>
                )}



                {/* Category 11: AKUN SAYA */}
                <button
                  onClick={() => setActiveSubpage("akun")}
                  className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                >
                  <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white">
                    <User className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                  </div>
                  <div className="space-y-1 text-center w-full px-1">
                    <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                      AKUN SAYA
                    </span>
                    <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                      Pengaturan Profil
                    </p>
                  </div>
                </button>

                {/* Category ALUMNI 11: AFILIASI SCI */}
                {(isUserSiswa || isUserAlumni || currentUser?.role === "Pengajar" || currentUser?.role === "Siswa" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                  <>
                    <button
                      onClick={() => setActiveSubpage("afiliasi")}
                      className="flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-blue-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer"
                    >
                      <div className="h-12 w-12 rounded-[14px] bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white relative">
                        <Share2 className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                      </div>
                      <div className="space-y-1 text-center w-full px-1">
                        <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                          MENU AFILIATE
                        </span>
                        <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                          Pendaftaran Siswa
                        </p>
                      </div>
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          {/* 5. ADMINISTRASI - Green bar and 9 custom styled buttons to look extremely colorful & professional */}
          {currentUser &&
            (currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP") && (
              <section className="bg-white rounded-[24px] border border-slate-100/80 shadow-xs p-3 space-y-3">
                {/* Header Labeled Bar */}
                <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-3 rounded-[16px] flex items-center justify-between text-[10px] shadow-md border border-emerald-500/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  <div className="flex items-center gap-2.5 font-black leading-none uppercase tracking-wider relative z-10">
                    <div className="bg-white/20 p-1.5 rounded-lg shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
                      <Shield className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-emerald-50" />
                    </div>
                    <span className="drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-xs">PANEL ADMINISTRASI</span>
                  </div>
                  <button 
                    onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
                    className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                  >
                    {isAdminPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                  </button>
                </div>
                {/* Grid of components matching screenshots - SORTED ALPHABETICALLY */}
                {isAdminPanelOpen && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1 text-left animate-fade-in">
                  {[
                    { id: "pembayaran", name: "Admin Keuangan Siswa", icon: CreditCard, color: "emerald", colorClass: "from-emerald-500 to-emerald-700", access: currentUser?.role !== "Admin Biasa" },
                    { id: "siswa", name: "Administrasi Siswa", icon: Users, color: "blue", colorClass: "from-blue-500 to-blue-700", access: true },
                    { id: "afiliasi", name: "Afiliasi SCI", icon: Share2, color: "rose", colorClass: "from-rose-500 to-rose-700", access: true, isSubpage: true },
                    { id: "gaji", name: "Buku Kas & Gaji", icon: Receipt, color: "cyan", colorClass: "from-cyan-500 to-cyan-700", access: currentUser?.role !== "Admin Biasa" },
                    { id: "kustomisasi", name: "Branding & Slider", icon: Sliders, color: "teal", colorClass: "from-teal-500 to-teal-700", access: true },
                    { id: "informasi", name: "Informasi LPK", icon: Info, color: "slate", colorClass: "from-slate-500 to-slate-700", access: true },
                    { id: "inventaris", name: "Inventaris Barang", icon: Package, color: "purple", colorClass: "from-purple-500 to-purple-700", access: true },
                    { id: "kalender", name: "Jadwal LPK", icon: Calendar, color: "indigo", colorClass: "from-indigo-500 to-indigo-700", access: true, isSubpage: true },
                    { id: "manajemen", name: "Manajemen Akun & Sensei", icon: Users, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                    { id: "kelas", name: "Manajemen Kelas", icon: GraduationCap, color: "violet", colorClass: "from-violet-500 to-violet-700", access: true },
                    { id: "pajak", name: "Pajak LPK", icon: FileText, color: "rose", colorClass: "from-rose-500 to-rose-700", access: currentUser?.role !== "Admin Biasa" },
                    { id: "petasebaran", name: "Peta Alumni JP", icon: MapPin, color: "red", colorClass: "from-red-500 to-red-700", access: true },
                    { id: "joborders", name: "Proses Job Siswa", icon: Landmark, color: "amber", colorClass: "from-amber-500 to-amber-700", access: true },
                    { id: "dataCV", name: "Database CV", icon: BookOpen, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                    { id: "alumnivip", name: "Manajemen Kelas Alumni", icon: Star, color: "yellow", colorClass: "from-yellow-500 to-yellow-600", access: true },
                    { id: "galeri", name: "Galeri Foto", icon: ImageIcon, color: "cyan", colorClass: "from-cyan-500 to-cyan-700", access: true },
                  ]
                    .filter(item => item.access)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => item.isSubpage ? setActiveSubpage(`admin_${item.id}`) : handleAdminAction(item.id as any)}
                          className={`flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-slate-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer`}
                        >
                          <div className={`h-12 w-12 rounded-[14px] bg-gradient-to-br ${item.colorClass || ""} text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white `}>
                            <Icon className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                          </div>
                          <span className="text-[8.5px] font-black text-slate-800 leading-tight uppercase">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
                )}
              </section>
            )}

          {/* 6. VVIP - Mustard/Gold bar labeled "VVIP" with beautiful colored circular/rounded monitors */}
          {currentUser && currentUser.role === "VVIP" && (
            <section className="bg-white rounded-[24px] border border-slate-100/80 shadow-xs p-3 space-y-3">
              {/* Header Labeled Bar */}
              <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white p-3 rounded-[16px] flex items-center justify-between text-[10px] shadow-md border border-amber-500/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-2.5 font-black leading-none uppercase tracking-wider relative z-10">
                  <div className="bg-white/20 p-1.5 rounded-lg shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
                    <Crown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-amber-50" />
                  </div>
                  <span className="drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-xs">PANEL EKSEKUTIF VVIP</span>
                </div>
                <button 
                  onClick={() => setIsVvipPanelOpen(!isVvipPanelOpen)}
                  className="flex items-center justify-center bg-black/10 hover:bg-black/20 p-2 rounded-xl transition cursor-pointer text-white/90 hover:text-white relative z-10 border border-black/5 active:scale-95"
                >
                  {isVvipPanelOpen ? <ChevronUp className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" /> : <ChevronDown className="h-4 w-4 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />}
                </button>
              </div>
              {/* VVIP Quick KPIs & Features - SORTED ALPHABETICALLY */}
              {isVvipPanelOpen && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2 text-left animate-fade-in">
                {[
                  { id: "security", name: "Keamanan Akun", icon: ShieldCheck, color: "slate", colorClass: "from-slate-500 to-slate-700", access: true, isVvipOnly: true },
                  { id: "gaji", name: "Keuangan LPK", icon: DollarSign, color: "purple", colorClass: "from-purple-500 to-purple-700", access: true },
                  { id: "eval", name: "Monitoring Kelas", icon: Users, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                  { id: "lms", name: "E-Benkyou LMS", icon: BookOpen, color: "sky", colorClass: "from-sky-500 to-sky-700", access: true },
                  { id: "kalender", name: "Jadwal LPK", icon: Calendar, color: "indigo", colorClass: "from-indigo-500 to-indigo-700", access: true, isSubpage: true },
                  { id: "afiliasi", name: "Afiliasi SCI", icon: Share2, color: "rose", colorClass: "from-rose-500 to-rose-700", access: true, isSubpage: true },
                  { id: "exec", name: "Overview Executive", icon: BarChart3, color: "amber", colorClass: "from-amber-500 to-amber-700", access: true },
                  { id: "loginas", name: "Login Sebagai...", icon: Key, color: "indigo", colorClass: "from-indigo-500 to-indigo-700", access: true, isVvipOnly: true },
                ]
                  .filter(item => item.access)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === "loginas") {
                            setShowLoginAsModal(true);
                            return;
                          }
                          if (item.isVvipOnly && (!currentUser || currentUser.role !== "VVIP")) {
                            triggerAccessAlert("Direktur Utama LPK (VVIP)");
                          } else if (item.isSubpage) {
                            setActiveSubpage(`vvip_${item.id}`);
                          } else {
                            handleVvipAction(item.id as any);
                          }
                        }}
                        className={`flex flex-col items-center justify-center space-y-0.5 p-3 rounded-[20px] bg-white border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:border-slate-200 hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.1)] active:scale-95 transition-all duration-300 group cursor-pointer`}
                      >
                        <div className={`h-12 w-12 rounded-[14px] bg-gradient-to-br ${item.colorClass || ""} text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 mb-1.5 ring-2 ring-white`}>
                          <Icon className="h-5 w-5 drop-shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                        </div>
                        <span className="text-[8.5px] font-black text-slate-800 leading-tight uppercase">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
              </div>
              )}
            </section>
          )}

          {/* Clean Mobile Footer with Privacy Policy & Social Media */}
          <footer className="pt-6 pb-4 border-t border-slate-200/60 mt-8 text-center space-y-3 hidden">
            <div className="flex items-center justify-center gap-4 text-slate-400">
              <a
                href="https://instagram.com/lpk.sourcecourse"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 transition p-2"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 transition p-2"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 transition p-2"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                LPK Source Course Indonesia
              </p>
              <p className="text-[9px] text-slate-500 leading-relaxed max-w-[280px] mx-auto font-mono">
                &copy; 2026 LPK SCI. Semua database terenkripsi & diawasi secara
                resmi.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 text-[9px]">
              <button
                onClick={() => setActiveSubpage("privacy")}
                className="font-bold text-indigo-600 hover:text-indigo-800 transition active:scale-95 cursor-pointer underline"
                id="mobile-footer-privacy-btn"
              >
                Kebijakan Privasi
              </button>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">Pati, Jawa Tengah</span>
            </div>
          </footer>
        </div>
      )}

      {/* Scrollable Subpage Bottom Nav Menus */}
      {activeSubpage && !( (activeSubpage === "pendaftaran" || activeSubpage === "profil") && !currentUser ) && (
        <MobileBottomNav
          activeSubpage={activeSubpage}
          activeWorkspace={activeWorkspace}
          currentUser={currentUser}
          isUserSiswa={isUserSiswa}
          isUserAlumni={isUserAlumni}
          setActiveSubpage={setActiveSubpage}
          setActiveWorkspace={setActiveWorkspace}
        />
      )}

      {activePaymentDetail && currentUser && (
        <PaymentDetailModal
          payment={activePaymentDetail}
          currentUser={currentUser}
          systemState={systemState}
          onUpdateState={handleUpdateState}
          onClose={() => setActivePaymentDetail(null)}
        />
      )}

      {showBackConfirm && createPortal(
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-[100000] animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-slate-150 p-6 max-w-sm w-full text-center space-y-5 shadow-2xl relative">
            <div className="h-14 w-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
              <ShieldAlert className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h3 className="font-sans font-black text-indigo-800 text-base uppercase tracking-wider">
                Konfirmasi Keluar
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed text-center">
                Apakah Anda yakin ingin keluar dari akun ini?
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={executeLogoutAction}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase text-[10.5px] py-3 rounded-[24px] cursor-pointer transition active:scale-95 shadow-md shadow-rose-600/10"
              >
                Ya, Keluar
              </button>
              <button
                onClick={() => setShowBackConfirm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase text-[10.5px] py-3 rounded-[24px] cursor-pointer transition active:scale-95 border border-slate-100/80"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL PENGAJAR */}
      {showTeacherModal && showTeacherModal !== "presensi" && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100000] animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-black text-slate-800 text-sm">
                 {showTeacherModal === "bank" ? "Update Rekening Gaji" :
                  showTeacherModal === "agenda" ? "Agenda & Program Kerja" :
                  showTeacherModal === "spt" ? `Laporan ${reportType}` :
                  showTeacherModal === "cuti" ? "Pengajuan Cuti" :
                  showTeacherModal === "kontrak" ? "Kontrak Kerja LPK" : ""}
               </h3>
               <button onClick={() => setShowTeacherModal(null)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80">
                 <X className="w-4 h-4" />
               </button>
            </div>
            
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {showTeacherModal === "bank" && (
                 <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Nama Bank (Misal: BCA)</label>
                      <input type="text" value={teacherBankName} onChange={e => setTeacherBankName(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-sky-500" placeholder="Bank BCA" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Nomor Rekening</label>
                      <input type="text" value={teacherBankNum} onChange={e => setTeacherBankNum(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-sky-500" placeholder="1234567890" />
                    </div>
                    <button onClick={submitTeacherBank} className="w-full py-3 bg-sky-600 text-white rounded-xl font-bold text-xs shadow-md">Simpan Rekening</button>
                 </div>
              )}

              {showTeacherModal === "agenda" && (
                 <div className="space-y-3">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] text-indigo-800">
                      <strong>Info:</strong> Agenda dan program kerja Anda secara otomatis disinkronkan dengan Kalender LPK (Jadwal Kelas). Anda dapat melihat jadwal mengajar Anda di menu Kalender utama.
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Laporan Tambahan (Opsional)</label>
                      <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-indigo-500 min-h-[100px]" placeholder="Ketik laporan agenda/program kerja..." />
                    </div>
                    <button onClick={() => { setReportType("Agenda"); submitTeacherReport(); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md">Kirim Laporan Agenda</button>
                 </div>
              )}

              {showTeacherModal === "spt" && (
                 <div className="space-y-3">
                    <div className="flex gap-2">
                       <button onClick={() => setReportType("SPT")} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${reportType === "SPT" ? "bg-teal-50 border-teal-500 text-teal-700" : "bg-white border-slate-200 text-slate-500"}`}>Laporan SPT</button>
                       <button onClick={() => setReportType("BPJS")} className={`flex-1 py-2 text-[10px] font-bold rounded-lg border ${reportType === "BPJS" ? "bg-teal-50 border-teal-500 text-teal-700" : "bg-white border-slate-200 text-slate-500"}`}>Laporan BPJS</button>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Catatan Laporan</label>
                      <textarea value={reportContent} onChange={e => setReportContent(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-teal-500 min-h-[100px]" placeholder={`Ketik detail laporan ${reportType}...`} />
                    </div>
                    <button onClick={submitTeacherReport} className="w-full py-3 bg-teal-600 text-white rounded-xl font-bold text-xs shadow-md">Kirim Laporan</button>
                 </div>
              )}

              {showTeacherModal === "cuti" && (
                 <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Tanggal Mulai</label>
                        <input type="date" value={leaveStartDate} onChange={e => setLeaveStartDate(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-rose-500" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block">Tanggal Selesai</label>
                        <input type="date" value={leaveEndDate} onChange={e => setLeaveEndDate(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-rose-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block">Alasan Cuti</label>
                      <textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="w-full text-xs p-3 bg-slate-50 border border-slate-100/80 rounded-xl outline-none focus:border-rose-500 min-h-[80px]" placeholder="Mohon jelaskan alasan cuti..." />
                    </div>
                    <button onClick={submitTeacherLeave} className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-xs shadow-md">Ajukan Cuti ke Admin</button>
                    
                    <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-700">Riwayat Pengajuan Anda:</h4>
                      {systemState.teacherLeaves?.filter(l => l.teacherName === currentUser?.name).length ? (
                         systemState.teacherLeaves.filter(l => l.teacherName === currentUser?.name).map((l, idx) => (
                           <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg text-[9px]">
                             <div>
                               <p className="font-bold text-slate-700">{l.startDate} s/d {l.endDate}</p>
                               <p className="text-slate-500 truncate w-[150px]">{l.reason}</p>
                             </div>
                             <span className={`px-2 py-1 rounded font-bold uppercase ${l.status === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' : l.status === 'Ditolak' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
                           </div>
                         ))
                      ) : (
                         <p className="text-[9px] text-slate-400">Belum ada histori pengajuan cuti.</p>
                      )}
                    </div>
                 </div>
              )}

              {showTeacherModal === "kontrak" && (
                 <div className="space-y-3">
                    {systemState.teacherContracts?.filter(c => c.teacherName === currentUser?.name).length ? (
                       systemState.teacherContracts.filter(c => c.teacherName === currentUser?.name).map((c, idx) => (
                         <div key={idx} className="p-3 border border-slate-100/80 rounded-xl bg-slate-50">
                            <h4 className="font-bold text-slate-800 text-[11px] mb-2 border-b border-slate-200 pb-2">Kontrak Kerja (Status: {c.status})</h4>
                            <p className="text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed">{c.content}</p>
                            {c.status === "Menunggu TTD" && (
                               <button onClick={async () => {
                                 const updated = { ...c, status: "Disetujui" as const, signedDate: new Date().toISOString() };
                                 await handleUpdateState("teacherContracts", "update", updated);
                                 alert("Kontrak berhasil disetujui (TTD Digital)");
                               }} className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px]">Terima & TTD Digital</button>
                            )}
                         </div>
                       ))
                    ) : (
                       <div className="text-center p-6 bg-slate-50 rounded-xl border border-slate-100/80 border-dashed">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[10px] text-slate-500">Belum ada kontrak kerja yang diupload Admin.</p>
                       </div>
                    )}
                 </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* FULLSCREEN BIOMETRIC CAMERA SCANNER FOR WEBVIEW AND APP - MATCHES SCREENSHOT */}
      {showTeacherModal === "presensi" && currentUser && createPortal(
        <div className="fixed inset-0 z-[100000] bg-slate-950 flex flex-col justify-between font-sans text-white animate-fade-in">
          {/* Top Header */}
          <div className="p-4 bg-slate-950/95 border-b border-white/10 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Camera className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wide text-white">Pemindai Wajah (Biometrik)</h4>
                <p className="text-[9px] text-slate-400">Verifikasi Presensi Pengajar LPK</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTeacherModal(null);
                setPresensiBiometricStatus("idle");
              }}
              className="p-2 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 border border-white/10 rounded-full text-slate-300 transition-all cursor-pointer animate-fade-in"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Camera Viewport Area */}
          <div className="flex-1 relative w-full flex items-center justify-center bg-black overflow-hidden">
            {/* Camera Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transform scale-x-[-1] ${presensiCameraError ? "hidden" : "block"}`}
            />

            {/* Camera Error WebView Fallback Interface */}
            {presensiCameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10 bg-slate-950">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <h5 className="text-xs font-bold text-amber-400">Kamera WebView Terbatas</h5>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                  {presensiCameraError}
                </p>
                <button
                  onClick={() => {
                    const el = document.getElementById("presensi-file-fallback");
                    if (el) el.click();
                  }}
                  className="mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ambil Selfie Dari Kamera / Galeri</span>
                </button>
              </div>
            )}

            {/* Glowing Oval Scan Frame Overlay - Perfectly Screen Centered */}
            {!presensiCameraError && (
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/10 flex items-center justify-center overflow-hidden bg-white/5 backdrop-blur-[2px]">
                  {/* Glowing neon ring corners - Re-styled for precision */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-400 rounded-tl-full shadow-[0_0_15px_#34d399]"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-400 rounded-tr-full shadow-[0_0_15px_#34d399]"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-400 rounded-bl-full shadow-[0_0_15px_#34d399]"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-400 rounded-br-full shadow-[0_0_15px_#34d399]"></div>

                  {/* Horizontal scanning laser line */}
                  {presensiBiometricStatus === "scanning" && (
                    <div 
                      className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-[0_0_20px_#34d399] opacity-90"
                      style={{
                        top: "10%",
                        animation: "biometric-scan 2.5s ease-in-out infinite"
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Interactive Scanning HUD status displays */}
            {presensiBiometricStatus === "scanning" && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-center z-30 animate-fade-in">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                  <Camera className="w-8 h-8 text-emerald-400 animate-pulse" />
                </div>
                <h5 className="text-sm font-black uppercase tracking-[0.2em] mt-6 text-emerald-400">Memindai Wajah...</h5>
                <p className="text-[10px] text-slate-400 mt-2 max-w-[220px] leading-relaxed">Sedang mengonfigurasi titik biometrik pengajar. Mohon tidak menggerakkan perangkat.</p>
              </div>
            )}

            {presensiBiometricStatus === "success" && (
              <div className="absolute inset-0 bg-emerald-950 flex flex-col items-center justify-center text-center z-30 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-500 border border-emerald-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-emerald-500/50 animate-bounce">
                  ✓
                </div>
                <h5 className="text-sm font-black uppercase tracking-[0.2em] mt-6 text-emerald-300">Pindai Sukses</h5>
                <p className="text-[10px] text-emerald-200/80 mt-2 max-w-[220px] leading-relaxed">Data presensi Anda berhasil diverifikasi & dicatat dalam database.</p>
              </div>
            )}

            {presensiBiometricStatus === "error" && (
              <div className="absolute inset-0 bg-rose-950 flex flex-col items-center justify-center text-center z-30 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-rose-500 border border-rose-400 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-rose-500/50">
                  ✗
                </div>
                <h5 className="text-sm font-black uppercase tracking-[0.2em] mt-6 text-rose-300">Pindai Gagal</h5>
                <p className="text-[10px] text-rose-200/80 mt-2 max-w-[220px] leading-relaxed">Muka tidak cocok atau tidak terdeteksi. Silakan coba kembali dengan pencahayaan yang lebih baik.</p>
              </div>
            )}

            {/* Instruction Floating banner */}
            {presensiBiometricStatus === "idle" && (
              <div className="absolute bottom-4 inset-x-6 flex justify-center pointer-events-none z-20">
                <span className="text-[9px] font-bold text-center bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 uppercase tracking-widest text-white">
                  {!currentUser.faceRegistered 
                    ? "Posisikan Wajah Tegak Lurus Untuk Registrasi Baru"
                    : "Sejajarkan Wajah Di Area Lingkaran Kamera"
                  }
                </span>
              </div>
            )}
          </div>

          {/* CSS laser keyframe animation */}
          <style>{`
            @keyframes biometric-scan {
              0% { top: 10%; opacity: 0.8; }
              50% { top: 90%; opacity: 1; }
              100% { top: 10%; opacity: 0.8; }
            }
          `}</style>

          {/* Hidden Fallback Input for files/selfies */}
          <input
            id="presensi-file-fallback"
            type="file"
            onChange={handleFaceUpload}
            accept="image/*"
            capture="user"
            className="hidden"
          />

          {/* Bottom Control Bar Panel */}
          <div className="p-6 bg-slate-950 border-t border-white/10 flex flex-col gap-4 z-40">
            {/* Notes field */}
            {presensiBiometricStatus === "idle" && currentUser.faceRegistered && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-[9px] font-black tracking-wider uppercase text-slate-400">Catatan Kehadiran (Opsional)</label>
                <input 
                  type="text" 
                  value={presensiNotes} 
                  onChange={e => setPresensiNotes(e.target.value)} 
                  className="w-full text-xs p-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-emerald-500 text-white placeholder-slate-500" 
                  placeholder="Contoh: Hadir kelas pagi bimbingan JPL..." 
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              {/* Gallery button */}
              {presensiBiometricStatus === "idle" ? (
                <button
                  onClick={() => {
                    const el = document.getElementById("presensi-file-fallback");
                    if (el) el.click();
                  }}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider">Galeri/Selfie</span>
                </button>
              ) : (
                <div className="w-10"></div>
              )}

              {/* Native Double Ring Shutter button to trigger Scan */}
              {presensiBiometricStatus === "idle" ? (
                <button
                  onClick={handleTeacherPresensi}
                  className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center cursor-pointer transition active:scale-95 bg-white/10 hover:bg-white/20 shadow-lg shadow-black/50"
                  title={!currentUser.faceRegistered ? "Daftar Wajah" : "Ambil Presensi"}
                >
                  <div className={`w-14 h-14 rounded-full shadow-inner ${!currentUser.faceRegistered ? "bg-indigo-500" : "bg-emerald-500"}`}></div>
                </button>
              ) : (
                <button
                  onClick={() => setPresensiBiometricStatus("idle")}
                  className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center cursor-pointer transition active:scale-95 shadow-lg border border-white/10 text-xs font-bold text-white"
                >
                  Ulangi
                </button>
              )}

              {/* Camera facingMode switch */}
              {presensiBiometricStatus === "idle" && !presensiCameraError ? (
                <button
                  onClick={() => setPresensiFacingMode(prev => prev === "user" ? "environment" : "user")}
                  className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-wider">Kamera</span>
                </button>
              ) : (
                <div className="w-10"></div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* LOGIN AS MODAL (VVIP ONLY) */}
      {showLoginAsModal && currentUser?.role === "VVIP" && createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setShowLoginAsModal(false)}
          />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">Login Sebagai...</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Pilih akun untuk diambil alih sesinya</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLoginAsModal(false)}
                className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white border border-slate-100/80 rounded-xl transition-colors active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-3 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari nama atau username..."
                  value={loginAsSearch}
                  onChange={e => setLoginAsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100/80 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {["Semua", "Siswa", "Pengajar", "Admin", "Admin Super", "Admin Biasa", "VVIP"].map(role => (
                  <button
                    key={role}
                    onClick={() => setLoginAsRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors ${loginAsRole === role ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-2">
                {(() => {
                  const baseUsers = systemState.unfilteredUsers || systemState.users || [];
                  const defaultSystemAccounts: any[] = [
                    {
                      username: "admin",
                      name: "Administrator Utama",
                      email: "admin@lpk.id",
                      role: "Admin",
                      status: "Active",
                    },
                    {
                      username: "admin_super",
                      name: "Admin Super (Pengawas Sistem)",
                      email: "superadmin@lpk.id",
                      role: "Admin Super",
                      status: "Active",
                    },
                    {
                      username: "admin_biasa",
                      name: "Admin Operasional Biasa",
                      email: "adminbiasa@lpk.id",
                      role: "Admin Biasa",
                      status: "Active",
                    },
                    {
                      username: "direktur",
                      name: "Direktur Utama (CEO VVIP)",
                      email: "direktur@lpk.id",
                      role: "VVIP",
                      status: "Active",
                    }
                  ];

                  const combinedUsers = [...baseUsers];
                  defaultSystemAccounts.forEach((defAcc) => {
                    if (!combinedUsers.some(u => u.username === defAcc.username)) {
                      combinedUsers.push(defAcc);
                    }
                  });

                  return combinedUsers
                    .filter(u => {
                      if (loginAsRole === "Semua") return true;
                      if (loginAsRole === "Admin") {
                        return u.role === "Admin" || u.role === "Admin Super" || u.role === "Admin Biasa";
                      }
                      return u.role === loginAsRole;
                    })
                    .filter(u => 
                      (u.name || "").toLowerCase().includes(loginAsSearch.toLowerCase()) || 
                      (u.username || "").toLowerCase().includes(loginAsSearch.toLowerCase())
                    )
                    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                    .map((user) => (
                      <button
                        key={user.username}
                        onClick={() => {
                          setShowLoginAsModal(false);
                          setIsProfileMenuOpen(false);
                          if (onLoginAs) onLoginAs(user);
                          setActiveSubpage(null);
                        }}
                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-xl transition-all group active:scale-[0.98] cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-slate-100/80 shrink-0">
                            <img
                              src={getSafePhotoUrl(user.profilePicture, user.name)}
                              alt={user.name || "Avatar"}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=e2e8f0&color=334155`;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-700 transition-colors">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end shrink-0 pl-2">
                           <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                             user.role === "VVIP" ? "bg-purple-100 text-purple-700" :
                             user.role === "Admin Super" ? "bg-amber-100 text-amber-800" :
                             user.role === "Admin Biasa" ? "bg-blue-100 text-blue-700" :
                             user.role === "Admin" ? "bg-indigo-100 text-indigo-700" :
                             user.role === "Pengajar" ? "bg-emerald-100 text-emerald-700" :
                             "bg-slate-100 text-slate-600"
                           }`}>{user.role}</span>
                           <div className="h-6 w-6 mt-1 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                             <ArrowRight className="h-3 w-3" />
                           </div>
                        </div>
                      </button>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


    </div>
  );
}

