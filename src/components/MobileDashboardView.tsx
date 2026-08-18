import { InlineLoginPanel } from "./InlineLoginPanel";
import { getSafePhotoUrl, createSvgAvatar } from "../lib/storageHelper";
import { isStudentAlumni } from "../lib/alumniStatus";
import { hasStaffOversight } from "../lib/permissions";
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
  Smartphone,
  Apple,
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
import MobileGaleriSubpage from "./mobile/MobileGaleriSubpage";
import MobileAfiliasiSubpage from "./mobile/MobileAfiliasiSubpage";
import MobilePembayaranSubpage from "./mobile/MobilePembayaranSubpage";
import MobileEbenkyouSubpage from "./mobile/MobileEbenkyouSubpage";
import MobileNotifikasiSubpage from "./mobile/MobileNotifikasiSubpage";
import MobilePilihKelasSubpage from "./mobile/MobilePilihKelasSubpage";
import MobileBerandaSubpage from "./mobile/MobileBerandaSubpage";
import MobileCvSubpage from "./mobile/MobileCvSubpage";
import MobilePetaSubpage from "./mobile/MobilePetaSubpage";
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

export const FrontendView = safeLazy(() => import("./FrontendView"));
export const LmsView = safeLazy(() => import("./LmsView"));
export const AdminView = safeLazy(() => import("./AdminView"));
export const VvipView = safeLazy(() => import("./VvipView"));
export const AccountSettingsView = safeLazy(() => import("./AccountSettingsView"));
export const CalendarView = safeLazy(() => import("./CalendarView"));
export const ChatView = safeLazy(() => import("./ChatView"));
export const PrivacyPolicyView = safeLazy(() => import("./PrivacyPolicyView"));
export const StudentCvView = safeLazy(() => import("./StudentCvView"));
export const RegistrationView = safeLazy(() => import("./RegistrationView"));
export const AlumniDashboardView = safeLazy(() => import("./AlumniDashboardView"));
export const SenseiDashboardView = safeLazy(() => import("./SenseiDashboardView"));
export const IosInstallView = safeLazy(() => import("./IosInstallView"));

export const isAndroidWebView = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isWebView = /Version\/\d+\.\d+/i.test(ua) || /wv/i.test(ua) || ua.includes("; wv");
  return isAndroid && isWebView;
};

// Siswa/Alumni yang masih login dengan password bawaan (default) perlu diminta menggantinya.
const isDefaultPasswordLogin = (user: UserAccount, plainPassword: string) =>
  (user.role === "Siswa" || user.role === "Alumni") && plainPassword === "123456";

export const getZoomAppLink = (webUrl: string) => {
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

export const formatDateIndo = (dateStr: string) => {
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
  onLoginSuccess?: (user: UserAccount, isDefaultPassword?: boolean) => void;
  onOpenPrivacy?: () => void;
  onLoginAs?: (user: UserAccount) => void;
  onOpenDownloadModal?: () => void;
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
  onOpenDownloadModal,
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

  // Tracks whether an active chat room (ChatView) is open, so the bottom nav
  // - which renders on top of it (higher z-index) - can be hidden while the
  // room's own input bar is pinned to the real viewport bottom.
  const [isChatRoomOpen, setIsChatRoomOpen] = useState(false);

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

    const normalizedUsername = loginUsername.trim();
    const cleanPassword = loginPassword.trim();

    if (!normalizedUsername || !cleanPassword) {
      setLoginErrorMsg("Username dan password wajib diisi.");
      return;
    }

    try {
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedUsername, password: cleanPassword }),
      });
      const data = await loginRes.json();
      if (loginRes.ok && data?.user) {
        const verifiedUser = data.user;
        if (verifiedUser.email) {
          createUserWithEmailAndPassword(auth, verifiedUser.email, cleanPassword).catch(() => {});
        }
        onLoginSuccess?.(verifiedUser, isDefaultPasswordLogin(verifiedUser, cleanPassword));
        return;
      } else {
        setLoginErrorMsg(data?.error || "Username/Email atau password salah.");
        return;
      }
    } catch (err) {
      setLoginErrorMsg("Gagal terhubung ke server. Silakan periksa koneksi internet Anda.");
    }
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

    // Unread chat messages count towards the badge too (mirrors ChatView's own
    // inbox id logic), so the bell stays in sync with real chat activity.
    const myChatId = currentUser
      ? (["Admin", "Admin Super", "Admin Biasa"].includes(currentUser.role) ? "admin_shared" : currentUser.username)
      : null;
    const unreadMessagesCount = myChatId
      ? (systemState.messages || []).filter((m) => m.receiverId === myChatId && !m.isRead).length
      : 0;

    setNotifBadge(displayEvents.length + getSynchronizedCount() + unreadMessagesCount);
  }, [currentUser, systemState.events, systemState.lmsLessons, systemState.chapterAssessments, systemState.registeredStudents, systemState.messages]);

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
  const isUserAlumni = currentUser?.role === "Alumni" || isStudentAlumni(myActiveStudent);
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

  const effectiveUserForSubpage = currentUser;

  return (
    <div ref={containerRef} className={`flex flex-col min-h-screen w-full max-w-full overflow-x-hidden text-slate-800 relative select-none bg-slate-50 ${activeSubpage ? 'pb-20' : 'pb-0'}`}>
      {/* HEADER SECTION - Matches screenshot logo, title and unread bell badge */}
      <header className="bg-white/80 backdrop-blur-xl text-slate-900 p-4 flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative border-b border-slate-200/50 sticky top-0 z-50 rounded-b-2xl mb-1">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* SCI Brand Logo Graphics and Subtitles */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center p-0.5 shadow-md overflow-hidden shrink-0 border border-slate-200/60">
              <img
                src={systemState.customization?.logoUrl || "/logo.png"}
                alt="LPK Logo"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
                onError={(e) => {
                  (e.currentTarget as any).src = "/logo.png";
                }}
              />
            </div>
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
        {/* Right actions: Pasang di iOS & Bell notifications & User Account */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {/* iOS Web App PWA Install Button */}
          <button
            onClick={() => {
              setActiveSubpage("install");
              if (setActiveTab) setActiveTab("install");
            }}
            className="relative p-1.5 bg-gradient-to-tr from-slate-900 to-slate-800 text-white rounded-full hover:bg-slate-700 transition active:scale-90 border border-slate-700 shadow-sm flex items-center justify-center cursor-pointer"
            title="Pasang Web App di Apple iOS (iPhone & iPad)"
            id="mobile-header-ios-install-btn"
          >
            <Apple className="h-4.5 w-4.5 fill-current text-white" />
          </button>

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
              {activeSubpage === "pembayaran" && ((currentUser?.role === "VVIP" || currentUser?.role?.startsWith("Admin")) ? "Pembayaran Siswa" : currentUser?.role === "Pengajar" ? "HR & Personalia" : "Dashboard Pembayaran")}
              {activeSubpage === "peta" && "Peta Sebaran Alumni LPK"}
              {activeSubpage === "galeri" && "Galeri Foto Pembelajaran"}
              {activeSubpage === "medsos" && "Media Sosial Resmi LPK"}
              {activeSubpage === "privacy" && "Kebijakan Privasi"}
              {activeSubpage === "install" && "Panduan Pasang PWA iOS"}
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
            hasStaffOversight(currentUser?.role) ? (
              <div className="bg-white rounded-3xl border border-slate-100/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <SenseiDashboardView currentUser={currentUser} systemState={systemState} />
              </div>
            ) : (
              <InlineLoginPanel
                title="Data Progress Siswa"
                requiredRole="Sensei/Pengajar"
                description="Dashboard Khusus Pengajar LPK untuk memantau progress siswa."
                onLoginSuccess={(u, isDefaultPassword) => onLoginSuccess?.(u, isDefaultPassword)}
                systemState={systemState}
              />
            )
          )}

          {/* 4. E-BENKYOU */}
          {(activeSubpage === "ebenkyou" || activeSubpage === "17berkas") && (
            <MobileEbenkyouSubpage activeSubpage={activeSubpage} currentUser={currentUser} handleUpdateState={handleUpdateState} onLoginSuccess={onLoginSuccess} selectedClassLog={selectedClassLog} setSelectedClassLog={setSelectedClassLog} systemState={systemState} />
          )}

          {/* 5. PEMBAYARAN: Billing structure checkout sandbox list */}
          {activeSubpage === "pembayaran" && (
            <MobilePembayaranSubpage currentUser={currentUser} handleUpdateState={handleUpdateState} onOpenLogin={onOpenLogin} selectedStudent={selectedStudent} setActivePaymentDetail={setActivePaymentDetail} setActiveSubpage={setActiveSubpage} setSelectedStudent={setSelectedStudent} systemState={systemState} />
          )}

          {/* 6. PETA PENYEBARAN: Full responsive OpenStreetMap inside mobile */}
          {activeSubpage === "peta" && (
            <MobilePetaSubpage mobileMapRef={mobileMapRef} />
          )}

          {/* 7. GALERI: Active photos grid */}
          {activeSubpage === "galeri" && (
            <MobileGaleriSubpage setSelectedGalleryImage={setSelectedGalleryImage} systemState={systemState} />
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
                onLoginSuccess={(u, isDefaultPassword) => onLoginSuccess?.(u, isDefaultPassword)}
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
                onLoginSuccess={(u, isDefaultPassword) => onLoginSuccess?.(u, isDefaultPassword)}
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
                        : activeSubpage === "vvip_ebenkyou" || activeSubpage === "vvip_lms"
                          ? "materi"
                          : "siswa"
                  }
                  viewMode={
                    activeSubpage === "vvip_gaji"
                      ? "gaji"
                      : activeSubpage === "vvip_eval" || activeSubpage === "vvip_ebenkyou" || activeSubpage === "vvip_lms"
                        ? "eval"
                        : activeSubpage === "vvip_pajak"
                          ? "pajak"
                          : activeSubpage === "vvip_ai"
                            ? "ai"
                            : activeSubpage === "vvip_exec"
                              ? "exec"
                              : activeSubpage === "vvip_akun" || activeSubpage === "vvip_security"
                                ? "security"
                                : activeSubpage === "vvip_afiliasi"
                                    ? "afiliasi"
                                    : "full"
                  }
                />
              </div>
            ))}

          {/* 11. NOTIFIKASI */}
          {activeSubpage === "notifikasi" && (
            <MobileNotifikasiSubpage currentUser={currentUser} systemState={systemState} />
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
                  onActiveRoomChange={setIsChatRoomOpen}
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
          {/* PANDUAN PASANG PWA IOS */}
          {activeSubpage === "install" && (
            <div className="flex-1 p-3 space-y-4 text-left">
              <IosInstallView
                systemState={systemState}
                onBack={() => setActiveSubpage(null)}
              />
            </div>
          )}
          {/* 16. CV & BIODATA JEPANG SUBPAGE */}
          {activeSubpage === "cv" && (
            <MobileCvSubpage currentUser={currentUser} handleUpdateState={handleUpdateState} onOpenLogin={onOpenLogin} selectedCvStudentId={selectedCvStudentId} setActiveSubpage={setActiveSubpage} setSelectedCvStudentId={setSelectedCvStudentId} systemState={systemState} />
          )}

          {/* 17. ALUMNI: PILIH KELAS BAHASA JEPANG */}
          {activeSubpage === "pilih_kelas" && (
            <MobilePilihKelasSubpage currentUser={currentUser} isUserAlumni={isUserAlumni} monitoredVvipClass={monitoredVvipClass} setActiveSubpage={setActiveSubpage} setMonitoredVvipClass={setMonitoredVvipClass} setSelectedClassLog={setSelectedClassLog} systemState={systemState} />
          )}

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
          {activeSubpage === "afiliasi" && (
            <MobileAfiliasiSubpage currentUser={currentUser} onLoginSuccess={onLoginSuccess} systemState={systemState} />
          )}
          </React.Suspense>
        </div>
          );
        })()
      ) : <MobileBerandaSubpage currentMobileSlide={currentMobileSlide} currentUser={currentUser} handleAdminAction={handleAdminAction} handleCategoryAction={handleCategoryAction} handleManualLogin={handleManualLogin} handleResetPasswordSubmit={handleResetPasswordSubmit} handleVvipAction={handleVvipAction} isAdminPanelOpen={isAdminPanelOpen} isMobileGoogleLoading={isMobileGoogleLoading} isProfileMenuOpen={isProfileMenuOpen} isResettingPassword={isResettingPassword} isUserAlumni={isUserAlumni} isUserSiswa={isUserSiswa} isVvipPanelOpen={isVvipPanelOpen} loginErrorMsg={loginErrorMsg} loginPassword={loginPassword} loginUsername={loginUsername} mobileSlides={mobileSlides} mockCalendarEvents={mockCalendarEvents} myActiveStudent={myActiveStudent} onLoginSuccess={onLoginSuccess} resetMessage={resetMessage} resetStatus={resetStatus} resetUsername={resetUsername} setActiveSubpage={setActiveSubpage} setCurrentMobileSlide={setCurrentMobileSlide} setIsAdminPanelOpen={setIsAdminPanelOpen} setIsMobileGoogleLoading={setIsMobileGoogleLoading} setIsProfileMenuOpen={setIsProfileMenuOpen} setIsResettingPassword={setIsResettingPassword} setIsVvipPanelOpen={setIsVvipPanelOpen} setLoginPassword={setLoginPassword} setLoginUsername={setLoginUsername} setResetMessage={setResetMessage} setResetStatus={setResetStatus} setResetUsername={setResetUsername} setShowLoginAsModal={setShowLoginAsModal} setShowPassword={setShowPassword} showPassword={showPassword} systemState={systemState} triggerAccessAlert={triggerAccessAlert} triggerLogoutConfirm={triggerLogoutConfirm} />}

      {/* Scrollable Subpage Bottom Nav Menus */}
      {activeSubpage && !( (activeSubpage === "pendaftaran" || activeSubpage === "profil") && !currentUser ) && !(activeSubpage === "chat" && isChatRoomOpen) && (
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

                  (systemState.activeStudents || []).forEach((st: any) => {
                    const uname = st.email?.trim() || st.id || st.nik;
                    if (uname && !combinedUsers.some(u => 
                      (u.username || "").toLowerCase() === uname.toLowerCase() ||
                      (u.email && st.email && u.email.toLowerCase() === st.email.toLowerCase()) ||
                      (u.studentId && st.id && u.studentId === st.id)
                    )) {
                      const isAlumni = isStudentAlumni(st);
                      combinedUsers.push({
                        username: uname,
                        name: st.name || "Siswa",
                        email: st.email || `${st.id || 'siswa'}@lpksci.com`,
                        role: isAlumni ? "Alumni" : "Siswa",
                        status: "Active",
                        studentId: st.id,
                        assignedClass: st.class || "",
                        profilePicture: st.profilePicture || "",
                      });
                    }
                  });

                  (systemState.registeredStudents || []).forEach((reg: any) => {
                    const uname = reg.email?.trim() || reg.id || reg.nik;
                    if (uname && !combinedUsers.some(u => 
                      (u.username || "").toLowerCase() === uname.toLowerCase() ||
                      (u.email && reg.email && u.email.toLowerCase() === reg.email.toLowerCase()) ||
                      (u.studentId && reg.id && u.studentId === reg.id)
                    )) {
                      combinedUsers.push({
                        username: uname,
                        name: reg.name || "Pendaftar",
                        email: reg.email || `${reg.id || 'reg'}@lpksci.com`,
                        role: "Siswa",
                        status: "Active",
                        studentId: reg.id,
                        assignedClass: "",
                        profilePicture: reg.docFoto || "",
                      });
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
                                e.currentTarget.src = createSvgAvatar(user.name || 'User');
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

