/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ConfirmButton } from "./ConfirmButton";
import { getSafePhotoUrl } from "../lib/storageHelper";
import { calculateAge } from "../lib/dateUtils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Award,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Activity,
  Building,
  Map,
  DollarSign,
  Lightbulb,
  FileText,
  CheckSquare,
  BookOpen,
  Users,
  Share2,
  Filter,
  CheckCircle2,
  Search,
  Plus,
  Video,
  CheckCircle,
  ExternalLink, Key, X, ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  CalendarDays,
  Play,
  Download,
  HelpCircle,
  Briefcase,
  Plane,
  Coffee,
  Package,
  Wrench,
  TrendingDown,
  MoreHorizontal,
  GraduationCap,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ArrowLeft, ChevronLeft,
  Clock,
  Globe,
  BarChart3,
  Receipt,
  Wallet,
  Calculator,
  RotateCcw,
  RefreshCw,
  History,
  UserPlus,
  MapPin,
  Laptop,
  Smartphone,
  Terminal,
  Edit,
} from "lucide-react";
import { SystemState, UserAccount, RegisteredStudent } from "../types";
import { CHAPTERS_LIST } from "../chapters";
import CalendarView from "./CalendarView";
import LmsView from "./LmsView";

interface VvipViewProps {
  currentUser?: UserAccount | null;
  systemState: SystemState;
  onUpdateState: (
    dataType: string,
    action: string,
    payload: any,
  ) => Promise<boolean>;
  initialMonitorTab?: "siswa" | "sensei" | "gaji" | "afiliasi" | "materi";
  viewMode?: "full" | "gaji" | "exec" | "eval" | "pajak" | "ai" | "security" | "kalender" | "afiliasi";
  isMobile?: boolean;
  onViewModeChange?: (viewMode: any) => void;
  onLoginAs?: (user: any) => void;
  onNavigateToAdmin?: (studentName: string) => void;
}

export default function VvipView({
  currentUser,
  systemState,
  onUpdateState,
  initialMonitorTab,
  viewMode: propViewMode = "full",
  isMobile = false,
  onViewModeChange,
  onLoginAs,
  onNavigateToAdmin,
}: VvipViewProps) {
  const [currentViewMode, setCurrentViewMode] = useState<"full" | "gaji" | "exec" | "eval" | "pajak" | "ai" | "security" | "kalender" | "afiliasi">(propViewMode as any);
  const [showLoginAsModal, setShowLoginAsModal] = useState(false);
  const [loginAsSearch, setLoginAsSearch] = useState("");
  const [loginAsRole, setLoginAsRole] = useState("Semua");
  
  React.useEffect(() => {
    if (propViewMode) {
      setCurrentViewMode(propViewMode as any);
    }
  }, [propViewMode]);

  React.useEffect(() => {
    if (onViewModeChange && currentViewMode) {
      onViewModeChange(currentViewMode);
    }
  }, [currentViewMode, onViewModeChange]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [securityFilter, setSecurityFilter] = useState("all");
  const [lmsClassFilter, setLmsClassFilter] = useState("all");
  const [auditDateFilter, setAuditDateFilter] = useState("all");
  const [auditUserFilter, setAuditUserFilter] = useState("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditTypeFilter, setAuditTypeFilter] = useState("all");
  const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);

  const isReadOnly = false; // VVIP view is fully operational for the CEO

  const handleUpdateUserStatus = async (username: string, currentStatus: string) => {
    if (isReadOnly) return;
    const newStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
    await onUpdateState("users", "edit", { username, status: newStatus });
    setActiveUserMenu(null);
  };

  const handleDeleteUser = async (username: string) => {
    if (isReadOnly) return;
    await onUpdateState("users", "delete", { username });
    setActiveUserMenu(null);
  };
  const [monitorTab, setMonitorTab] = useState<"siswa" | "sensei" | "gaji" | "afiliasi" | "rekap_siswa" | "materi" | "hr">(
    initialMonitorTab || "siswa",
  );

  const [showCostConfig, setShowCostConfig] = useState(false);

  const handleDeletePayment = (paymentId: string) => {
    if (isReadOnly) return;
    onUpdateState('payments', 'delete', { id: paymentId });
  };

  const [costRegistration, setCostRegistration] = useState(systemState.costConfig?.registration ?? 500000);
  const [costDP, setCostDP] = useState(systemState.costConfig?.dp ?? 3500000);
  const [costFullPayment, setCostFullPayment] = useState(systemState.costConfig?.fullPayment ?? 2000000);
  const [costManagementFee, setCostManagementFee] = useState(systemState.costConfig?.managementFee ?? 5000000);

  const handleSaveCostConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    onUpdateState('costConfig', 'update', { 
        registration: costRegistration,
        dp: costDP,
        fullPayment: costFullPayment,
        managementFee: costManagementFee
       });
    alert("Konfigurasi SOP Biaya Resmi berhasil disimpan!");
    setShowCostConfig(false);
  };

  const [selectedReferrer, setSelectedReferrer] = useState<string>("all");
  const [affiliateSearch, setAffiliateSearch] = useState<string>("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentListMode, setStudentListMode] = useState<"table" | "grid">("table");
  const [classFilter, setClassFilter] = useState("all");
  const [filterMonth, setFilterMonth] = useState<string>("All");
  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [siswaTab, setSiswaTab] = useState<"aktif" | "baru" | "alumni" | "rekap">("aktif");
  const [statCardMode, setStatCardMode] = useState<"kelas" | "status">("kelas");
  const [siswaPage, setSiswaPage] = useState(1);
  const [syncingStudents, setSyncingStudents] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [selectedClassTab, setSelectedClassTab] = useState<string>("Belajar");
  const [selectedSenseiDetail, setSelectedSenseiDetail] = useState<any | null>(null);
  const [selectedHrAttendanceStaff, setSelectedHrAttendanceStaff] = useState<any | null>(null);
  const [viewingAttendancePhoto, setViewingAttendancePhoto] = useState<string | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<
    any | null
  >(null);
  const [showAttendanceHistory, setShowAttendanceHistory] =
    useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editingLedger, setEditingLedger] = useState<any>(null);
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState("ALL");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [vvipGajiViewMode, setVvipGajiViewMode] = useState<"table" | "chart">("table");
  const [editingLedgerIsStudent, setEditingLedgerIsStudent] = useState(false);
  const [editingLedgerStudentName, setEditingLedgerStudentName] = useState("");
  const [editingLedgerCategory, setEditingLedgerCategory] = useState("");
  const [modalSubTab, setModalSubTab] = useState<
    "biodata" | "skills" | "evaluasi" | "rekap"
  >("biodata");

  // VVIP states for editing complete student data (RegisteredStudent format)
  const [vvipEditingStudentId, setVvipEditingStudentId] = useState<
    string | null
  >(null);
  const [vvipRegData, setVvipRegData] = useState<any>({});
  const [vvipRegError, setVvipRegError] = useState("");
  const [vvipRegSuccess, setVvipRegSuccess] = useState(false);

  // Office Location States for VVIP
  const [officeLat, setOfficeLat] = useState("");
  const [officeLon, setOfficeLon] = useState("");
  const [officeRadius, setOfficeRadius] = useState("");
  const [officeEnforce, setOfficeEnforce] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (systemState?.customization?.officeLocation) {
      const loc = systemState.customization.officeLocation;
      setOfficeLat(String(loc.latitude ?? ""));
      setOfficeLon(String(loc.longitude ?? ""));
      setOfficeRadius(String(loc.radius ?? 200));
      setOfficeEnforce(loc.enforce !== false);
    }
  }, [systemState?.customization]);

  const activeStudents = useMemo(() => {
    return (systemState.activeStudents || []).filter((s) => {
      const nameLower = s.name?.toLowerCase() || "";
      if (nameLower.includes("sensei")) return false;
      if (nameLower.includes("admin")) return false;
      if (nameLower.includes("pengajar")) return false;
      
      const matchedUser = (systemState.users || []).find(
        (u) => (u.studentId && u.studentId === s.id) || u.name?.trim().toLowerCase() === s.name?.trim().toLowerCase()
      );
      if (matchedUser) {
        if (["Admin", "Admin Super", "Admin Biasa", "Pengajar", "VVIP"].includes(matchedUser.role)) {
          return false;
        }
      }
      return true;
    });
  }, [systemState.activeStudents, systemState.users]);
  
  const inJapanCount = useMemo(() => activeStudents.filter(
    (s) => ["Lulus", "Di Jepang"].includes(s.status),
  ).length, [activeStudents]);
  
  const studyingCount = useMemo(() => activeStudents.filter(
    (s) => !["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW"].includes(s.status || ""),
  ).length, [activeStudents]);
  
  const totalLunasRevenue = useMemo(() => systemState.payments
    .filter((p) => p.status === "Lunas")
    .reduce((acc, curr) => acc + curr.amount, 0), [systemState.payments]);

  React.useEffect(() => {
    if (initialMonitorTab === "gaji") {
      const gajiEl =
        document.getElementById("vvip-gaji-section-standalone") ||
        document.getElementById("vvip-gaji-section");
      if (gajiEl) {
        gajiEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (
      initialMonitorTab === "siswa" ||
      initialMonitorTab === "sensei" ||
      initialMonitorTab === "materi"
    ) {
      setMonitorTab(initialMonitorTab as any);
      const monEl = document.getElementById("vvip-monitoring-section");
      if (monEl) {
        monEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [initialMonitorTab]);

  // Run the rule-based strategy engine automatically
  React.useEffect(() => {
    const runAudit = async () => {
      setIsLoadingAI(true);
      try {
        const res = await fetch("/api/vvip/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP error ${res.status}`);
        }
        
        const data = await res.json();
        setAiReport(data);
      } catch (err) {
        console.error("Audit calculating error", err);
        setAiReport({ error: String(err) });
      } finally {
        setIsLoadingAI(false);
      }
    };
    runAudit();
  }, [systemState]);

  // Parse prefectures for PieChart
  const prefCounts = activeStudents
    .filter((s) => s.status === "Di Jepang")
    .reduce((acc: Record<string, number>, s) => {
      if (s.prefecture) {
        acc[s.prefecture] = (acc[s.prefecture] || 0) + 1;
      }
      return acc;
    }, {});

  const classTabs = useMemo(() => {
    const counts = {
      belajar: activeStudents.filter(s => !["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW"].includes(s.status || "")).length,
      job: activeStudents.filter(s => s.status === "On Proges Job").length,
      jft: activeStudents.filter(s => s.status === "On Progres JFT/JLPT/SSW").length,
      diklat: activeStudents.filter(s => s.status === "Diklat SO").length,
      lulus: activeStudents.filter(s => s.status === "Lulus").length,
      jepang: activeStudents.filter(s => s.status === "Di Jepang").length,
    };

    return [
      { id: "Belajar", label: `🇮🇩 1. BELAJAR (${counts.belajar})` },
      { id: "On Proges Job", label: `💼 2. ON PROGRES JOB (${counts.job})` },
      { id: "On Progres JFT/JLPT/SSW", label: `📋 3. ON PROGRES JFT/JLPT/SSW (${counts.jft})` },
      { id: "Diklat SO", label: `📘 4. DIKLAT SO (${counts.diklat})` },
      { id: "Lulus", label: `🎓 5. LULUS (${counts.lulus})` },
      { id: "Di Jepang", label: `🇯🇵 6. DI JEPANG (${counts.jepang})` },
    ];
  }, [activeStudents]);

  const startVvipEditReg = (studentId: string) => {
    let regMatch = systemState.registeredStudents?.find(
      (rs) => rs.id === studentId || rs.name.toLowerCase() === studentId.toLowerCase()
    );

    const activeMatch = systemState.activeStudents?.find(
      (s) => s.id === studentId || (regMatch && s.name.toLowerCase() === regMatch.name.toLowerCase()) || s.name.toLowerCase() === studentId.toLowerCase()
    );

    if (!regMatch && activeMatch) {
      regMatch = systemState.registeredStudents?.find(
        (rs) => rs.name.toLowerCase() === activeMatch.name.toLowerCase()
      );
    }

    const studentName = activeMatch?.name || regMatch?.name || studentId;

    const userMatch = systemState.users?.find(
      (u: any) =>
        (studentName && u.name?.toLowerCase() === studentName.toLowerCase()) ||
        (regMatch?.email && u.email?.toLowerCase() === regMatch.email.toLowerCase()) ||
        u.id === studentId || u.uid === studentId
    );

    const pick = (...vals: any[]) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== "" && v !== "-" && v !== "Belum Diplot" && String(v).trim() !== "") {
          return String(v).trim();
        }
      }
      return "";
    };

    const am = activeMatch as any;
    const rm = regMatch as any;
    const um = userMatch as any;

    const finalName = pick(am?.name, rm?.name, um?.name, studentId);
    const finalEmail = pick(
      rm?.email,
      um?.email,
      am?.id && am.id.includes("@") ? am.id : undefined,
      `${finalName.toLowerCase().replace(/\s+/g, "")}@example.com`
    );
    const finalPhone = pick(am?.phone, rm?.phone, um?.phone);
    const finalDistrict = pick(am?.district, am?.address, rm?.district, um?.district);
    const finalBirthDate = pick(am?.birthDate, rm?.birthDate, um?.birthDate);
    const finalGender = pick(am?.gender, rm?.gender, um?.gender);
    const finalEducation = pick(am?.education, rm?.education, um?.education);
    const finalSchool = pick(am?.school, rm?.school, um?.school);
    const finalGraduationYear = pick(am?.graduationYear, rm?.graduationYear);
    const finalJapaneseLevel = pick(am?.japaneseLevel, rm?.japaneseLevel);
    const finalProgram = pick(am?.class, am?.assignedClass, rm?.program);
    const finalStatusPendaftaran = pick(am?.statusPendaftaran, am?.kategoriPendaftaran, rm?.statusPendaftaran, "Siswa Baru");
    const finalPassword = pick(rm?.password, um?.password);

    const mergedData = {
      id: regMatch?.id || activeMatch?.id || studentId,
      name: finalName,
      email: finalEmail,
      password: finalPassword,
      phone: finalPhone,
      district: finalDistrict,
      birthDate: finalBirthDate,
      gender: finalGender,
      education: finalEducation,
      school: finalSchool,
      graduationYear: finalGraduationYear,
      japaneseLevel: finalJapaneseLevel,
      program: finalProgram,
      statusPendaftaran: finalStatusPendaftaran,
      status: regMatch?.status || "Terverifikasi",
      date: regMatch?.date || activeMatch?.date || "-",
      proofOfPayment: regMatch?.proofOfPayment || (activeMatch as any)?.proofOfPayment,
    };

    setVvipRegData(mergedData);
    setVvipEditingStudentId(studentId);
    setVvipRegError("");
    setVvipRegSuccess(false);
  };

  const handleVvipSaveReg = async (e: React.FormEvent) => {
    e.preventDefault();
    setVvipRegError("");
    setVvipRegSuccess(false);

    if (!vvipRegData.name || !vvipRegData.phone) {
      setVvipRegError("Nama dan No HP wajib diisi.");
      return;
    }

    let success = false;
    const regMatch = systemState.registeredStudents?.find(rs => rs.id === vvipRegData.id || rs.name.toLowerCase() === vvipRegData.name.toLowerCase());
    if (regMatch) {
      success = await onUpdateState(
        "registeredStudents",
        "update",
        { ...vvipRegData, id: regMatch.id },
      );
    } else {
      success = await onUpdateState(
        "registeredStudents",
        "add",
        vvipRegData,
      );
    }

    const activeInfo = systemState.activeStudents?.find(
      (s) => s.id === vvipEditingStudentId || s.id === vvipRegData.id || s.name.toLowerCase() === vvipRegData.name.toLowerCase()
    );

    if (activeInfo) {
      const activeSuccess = await onUpdateState("activeStudents", "update_status", {
        id: activeInfo.id,
        name: vvipRegData.name,
        phone: vvipRegData.phone,
        district: vvipRegData.district,
        birthDate: vvipRegData.birthDate,
        gender: vvipRegData.gender,
        education: vvipRegData.education,
        school: vvipRegData.school,
        graduationYear: vvipRegData.graduationYear,
        japaneseLevel: vvipRegData.japaneseLevel,
        statusPendaftaran: vvipRegData.statusPendaftaran,
        class: vvipRegData.program || activeInfo.class,
      });
      if (activeSuccess) success = true;
    }

    if (success) {
      setVvipRegSuccess(true);
      setTimeout(() => {
        setVvipRegSuccess(false);
        setVvipEditingStudentId(null);
      }, 1500);
    } else {
      setVvipRegError("Gagal menyimpan data.");
    }
  };

  const prefectureDataForChart = Object.keys(prefCounts).map((key) => ({
    name: key,
    value: prefCounts[key],
  }));

  const studentStatusDataForChart = useMemo(() => {
    const counts = {
      "🇮🇩 1. BELAJAR": 0,
      "💼 2. ON PROGRES JOB": 0,
      "📋 3. ON PROGRES JFT/JLPT/SSW": 0,
      "📘 4. DIKLAT SO": 0,
      "🎓 5. LULUS": 0,
      "🇯🇵 6. DI JEPANG": 0
    };
    
    (systemState.activeStudents || []).forEach((s: any) => {
      const status = s.status || "Belajar";
      // Need to include those whose status is null or missing in Belajar. But here it says if status === "Belajar"
      // Let's use the same logic as the tabs!
      if (!["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW"].includes(s.status || "")) {
          counts["🇮🇩 1. BELAJAR"]++;
      } else if (status === "On Proges Job") counts["💼 2. ON PROGRES JOB"]++;
      else if (status === "On Progres JFT/JLPT/SSW") counts["📋 3. ON PROGRES JFT/JLPT/SSW"]++;
      else if (status === "Diklat SO") counts["📘 4. DIKLAT SO"]++;
      else if (status === "Lulus") counts["🎓 5. LULUS"]++;
      else if (status === "Di Jepang") counts["🇯🇵 6. DI JEPANG"]++;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [systemState.activeStudents]);

  const STATUS_COLORS: { [key: string]: string } = {
    "🇮🇩 1. BELAJAR": "#ef4444", // red-500
    "💼 2. ON PROGRES JOB": "#f97316", // orange-500
    "📋 3. ON PROGRES JFT/JLPT/SSW": "#eab308", // yellow-500
    "📘 4. DIKLAT SO": "#06b6d4", // cyan-500
    "🎓 5. LULUS": "#8b5cf6", // violet-500
    "🇯🇵 6. DI JEPANG": "#10b981", // emerald-500
  };

  // Dynamic Chart financial data synchronized strictly with actual payments & cash ledger (no dummy data)
  const financialData = useMemo(() => {
    const monthlyData: { [key: string]: { in: number; out: number } } = {};
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const ledger = systemState.cashLedger || [];
    ledger.forEach((entry) => {
      if (!entry.date) return;
      const dateParts = entry.date.split("-");
      if (dateParts.length < 2) return;
      const year = dateParts[0];
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const monthName = months[monthIndex] || "Januari";
      const key = `${monthName} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { in: 0, out: 0 };
      }
      monthlyData[key].in += entry.inAmount || 0;
      monthlyData[key].out += entry.outAmount || 0;
    });

    const payments = systemState.payments || [];
    payments.forEach((p) => {
      if (!p.date || (p.status !== "Lunas" && p.status !== "Cicilan")) return;
      const dateParts = p.date.split("-");
      if (dateParts.length < 2) return;
      const year = dateParts[0];
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const monthName = months[monthIndex] || "Januari";
      const key = `${monthName} ${year}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { in: 0, out: 0 };
      }
      // If we don't have this entry represented in ledger, add it to income
      const inLedgerExists = ledger.some(
        (l) => l.inAmount === p.amount && l.date === p.date
      );
      if (!inLedgerExists) {
        monthlyData[key].in += p.amount || 0;
      }
    });

    const keys = Object.keys(monthlyData).sort((a, b) => {
      const [mA, yA] = a.split(" ");
      const [mB, yB] = b.split(" ");
      if (yA !== yB) return parseInt(yA) - parseInt(yB);
      return months.indexOf(mA) - months.indexOf(mB);
    });

    if (keys.length === 0) {
      return [];
    }

    return keys.map((key) => {
      const item = monthlyData[key];
      const taxAmount = Math.round(item.in * 0.11); // 11% PPN standard
      return {
        month: key,
        Pendapatan: item.in,
        Pengeluaran: item.out,
        PajakPPN: taxAmount,
        KeuntunganBersih: item.in - item.out - taxAmount,
      };
    });
  }, [systemState.cashLedger, systemState.payments]);

  const financialMetrics = useMemo(() => {
    const payments = systemState.payments || [];
    const ledger = systemState.cashLedger || [];

    const totalLunas = payments
      .filter((p) => p.status === "Lunas")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalCicilan = payments
      .filter((p) => p.status === "Cicilan")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalInLedger = ledger.reduce((acc, curr) => acc + (curr.inAmount || 0), 0);
    const totalOutLedger = ledger.reduce((acc, curr) => acc + (curr.outAmount || 0), 0);

    // Gaji is code "P1"
    const totalGaji = ledger
      .filter((entry) => entry.code === "P1")
      .reduce((acc, curr) => acc + (curr.outAmount || 0), 0);

    // Other operational expenses (P2 - P8)
    const totalOperasional = ledger
      .filter((entry) => entry.code !== "P1" && entry.code !== "P9B")
      .reduce((acc, curr) => acc + (curr.outAmount || 0), 0);

    const sisaSaldo = totalInLedger - totalOutLedger;

    return {
      totalLunas,
      totalCicilan,
      totalInLedger,
      totalOutLedger,
      totalGaji,
      totalOperasional,
      sisaSaldo,
    };
  }, [systemState.payments, systemState.cashLedger]);

  const getClassMaxBab = (cls: string) => {
    const classDef = systemState.customization?.lmsClasses?.find((c: any) => c.name === cls);
    const chapters = classDef?.chapters || CHAPTERS_LIST;
    return chapters.filter((ch: any) => ch.isActive !== false).length;
  };

  const paidPayments = useMemo(() => {
  return (systemState.payments || []).filter(
      (p) => p.status === "Lunas" || p.status === "Cicilan"
    );
  }, [systemState.payments]);

  const monthlyExpenseBreakdown = useMemo(() => {
    const ledger = systemState.cashLedger || [];
    const monthsData: { [key: string]: { total: number; gaji: number; operasional: number; list: any[] } } = {};
    const monthsNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    ledger.forEach((entry) => {
      if (entry.outAmount <= 0) return;
      const dateParts = entry.date.split("-");
      if (dateParts.length < 2) return;
      const year = dateParts[0];
      const monthIndex = parseInt(dateParts[1], 10) - 1;
      const monthName = monthsNames[monthIndex] || "Januari";
      const key = `${monthName} ${year}`;

      if (!monthsData[key]) {
        monthsData[key] = { total: 0, gaji: 0, operasional: 0, list: [] };
      }

      monthsData[key].total += entry.outAmount;
      if (entry.code === "P1") {
        monthsData[key].gaji += entry.outAmount;
      } else {
        monthsData[key].operasional += entry.outAmount;
      }
      monthsData[key].list.push(entry);
    });

    return monthsData;
  }, [systemState.cashLedger]);

  // Recharts color palette
  const COLORS = [
    "#2563eb",
    "#0d9488",
    "#059669",
    "#7c3aed",
    "#c026d3",
    "#db2777",
    "#ea580c",
  ];

  const renderGajiSection = () => {
    return (
      <div className="space-y-8">
        <section
          className="bg-white border border-slate-200/60 rounded-3xl p-4.5 sm:p-6 md:p-8 shadow-sm space-y-6 animate-fade-in"
          id="vvip-gaji-section-standalone"
        >
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div className="space-y-1">
              <h3 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="text-base">💼</span> Pengelolaan Buku Kas &
                Penggajian Terpadu
              </h3>
              <p className="text-[11px] text-slate-500 font-normal leading-normal">
                Pantau arus kas (in/out) LPK serta kelola penggajian
                staff/sensei secara transparan dan akurat.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                <button
                  onClick={() => setVvipGajiViewMode("table")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                    vvipGajiViewMode === "table"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Buku Kas (Ledger)
                </button>
                <button
                  onClick={() => setVvipGajiViewMode("chart")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                    vvipGajiViewMode === "chart"
                      ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-xs"
                      : "text-purple-700 hover:text-purple-900"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Grafik Cashflow LPK</span>
                </button>
              </div>

              <button
                onClick={() => setShowCostConfig(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold font-sans tracking-wider transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Setel SOP Biaya Resmi
              </button>
            </div>
          </div>


          {vvipGajiViewMode === "chart" ? (() => {
            const ledger = systemState.cashLedger || [];
            const months = [
              "Januari", "Februari", "Maret", "April", "Mei", "Juni",
              "Juli", "Agustus", "September", "Oktober", "November", "Desember"
            ];

            let totalIn = 0;
            let totalOut = 0;
            const categoryBreakdown: Record<string, { name: string; amount: number; color: string }> = {
              P1: { name: "Gaji & Insentif Staff/Sensei", amount: 0, color: "#8B5CF6" },
              P2: { name: "Operasional, Listrik & Wifi", amount: 0, color: "#3B82F6" },
              P3: { name: "Sewa Gedung & Fasilitas", amount: 0, color: "#EC4899" },
              P4: { name: "Konsumsi, Asrama & Logistik", amount: 0, color: "#F59E0B" },
              P5: { name: "Pajak, Legalitas & Lisensi", amount: 0, color: "#10B981" },
              DLL: { name: "Lain-Lain / Insidental", amount: 0, color: "#64748B" },
            };

            const monthlyCashflowMap: Record<string, { in: number; out: number; net: number }> = {};
            const salaryMap: Record<string, number> = {};

            ledger.forEach((entry) => {
              const inAmt = Number(entry.inAmount) || 0;
              const outAmt = Number(entry.outAmount) || 0;
              totalIn += inAmt;
              totalOut += outAmt;

              const rawCode = (entry.code || "DLL").toUpperCase();
              let catKey = "DLL";
              if (["P1", "P2", "P3", "P4", "P5"].includes(rawCode)) {
                catKey = rawCode;
              }
              if (outAmt > 0) {
                categoryBreakdown[catKey].amount += outAmt;
              }

              if ((rawCode === "P1" || entry.description.toLowerCase().includes("gaji")) && outAmt > 0) {
                const staffName = entry.description.replace(/^gaji\s+/i, "").replace(/^p1\s+/i, "").trim() || "Staf / Sensei";
                salaryMap[staffName] = (salaryMap[staffName] || 0) + outAmt;
              }

              if (entry.date) {
                const dateParts = entry.date.split("-");
                if (dateParts.length >= 2) {
                  const y = dateParts[0];
                  const mIdx = parseInt(dateParts[1], 10) - 1;
                  const mName = months[mIdx] || "Januari";
                  const key = `${mName} ${y}`;
                  if (!monthlyCashflowMap[key]) {
                    monthlyCashflowMap[key] = { in: 0, out: 0, net: 0 };
                  }
                  monthlyCashflowMap[key].in += inAmt;
                  monthlyCashflowMap[key].out += outAmt;
                  monthlyCashflowMap[key].net += (inAmt - outAmt);
                }
              }
            });

            const netSaldo = totalIn - totalOut;

            const monthlyTrendData = Object.keys(monthlyCashflowMap).map((k) => ({
              month: k,
              Pemasukan: monthlyCashflowMap[k].in,
              Pengeluaran: monthlyCashflowMap[k].out,
              SurplusNetto: monthlyCashflowMap[k].net,
            }));

            const categoryPieData = Object.keys(categoryBreakdown)
              .map(k => categoryBreakdown[k])
              .filter(c => c.amount > 0);

            const salaryListData = Object.keys(salaryMap)
              .map(name => ({ name, total: salaryMap[name] }))
              .sort((a, b) => b.total - a.total);

            return (
              <div className="space-y-6 animate-fade-in text-left">
                {/* Banner */}
                <div className="p-5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-3xl border border-purple-800 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 z-10">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                        CASHFLOW & GAJI LPK
                      </span>
                      <span className="bg-purple-500/30 text-purple-200 text-[9px] font-mono px-2 py-0.5 rounded-full border border-purple-400/30">
                        Buku Kas Ledger Real-time
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-400" />
                      Grafik Analytics Cashflow & Penggajian LPK
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Visualisasi arus kas masuk/keluar lembaga, alokasi pengeluaran per pos budget (Gaji P1, Operasional P2, dll), serta riwayat surplus/defisit bersih LPK PT SCI.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 z-10">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
                      <div className="text-[9px] text-slate-300 font-mono uppercase font-bold">Saldo Kas Berjalan</div>
                      <div className={`text-base font-black font-mono ${netSaldo >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        Rp {netSaldo.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Total Pemasukan Kas
                    </span>
                    <div className="text-lg font-black text-emerald-600 font-mono">
                      Rp {totalIn.toLocaleString("id-ID")}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Akumulasi seluruh arus kas masuk</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-rose-500" /> Total Pengeluaran Kas
                    </span>
                    <div className="text-lg font-black text-rose-600 font-mono">
                      Rp {totalOut.toLocaleString("id-ID")}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Pengeluaran operasional & gaji</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-purple-500" /> Surplus / Defisit Netto
                    </span>
                    <div className={`text-lg font-black font-mono ${netSaldo >= 0 ? "text-indigo-600" : "text-rose-600"}`}>
                      Rp {netSaldo.toLocaleString("id-ID")}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {netSaldo >= 0 ? "Surplus kas positif" : "Defisit kas sementara"}
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-amber-500" /> Total Alokasi Gaji (P1)
                    </span>
                    <div className="text-lg font-black text-amber-600 font-mono">
                      Rp {(categoryBreakdown.P1.amount).toLocaleString("id-ID")}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">Gaji staff & sensei terbayar</p>
                  </div>
                </div>

                {/* Chart Row 1: Area Trend Cashflow & Expense Breakdown Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Area Chart: Tren Monthly Cashflow */}
                  <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        Tren Bulanan Pemasukan vs Pengeluaran Kas
                      </h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Grafik perbandingan arus kas bulanan berdasarkan catatan Buku Kas Ledger.
                      </p>
                    </div>

                    <div className="h-72 w-full pt-2">
                      {monthlyTrendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                            <Tooltip
                              formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, ""]}
                              contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: "bold" }}
                            />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                            <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" fill="#10B981" fillOpacity={0.15} strokeWidth={2} />
                            <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" fill="#EF4444" fillOpacity={0.15} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                          Belum ada entri ber-tanggal pada Buku Kas Ledger.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Donut Chart: Alokasi Pengeluaran per Pos SOP */}
                  <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        Distribusi Pengeluaran Per Pos Budget
                      </h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Persentase alokasi pengeluaran kas berdasarkan kode pos anggaran.
                      </p>
                    </div>

                    <div className="h-64 w-full flex flex-col items-center justify-center relative">
                      {categoryPieData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={categoryPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={4}
                                dataKey="amount"
                              >
                                {categoryPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(val: any) => [`Rp ${Number(val).toLocaleString("id-ID")}`, "Total Nominal"]}
                                contentStyle={{ borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="grid grid-cols-2 gap-1.5 w-full pt-1 max-h-24 overflow-y-auto">
                            {categoryPieData.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[10px] p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="flex items-center gap-1.5 font-bold text-slate-700 truncate">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                  <span className="truncate">{item.name}</span>
                                </span>
                                <span className="font-black font-mono text-slate-900 shrink-0">
                                  Rp {(item.amount / 1000000).toFixed(1)}M
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-400 italic">Belum ada data pengeluaran terdaftar.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chart Row 2: Distribusi Penggajian Staf & Sensei */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      Akumulasi Penggajian Terbayar Per Staf / Sensei
                    </h4>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Rincian total nominal gaji yang telah dicairkan dan tercatat di Buku Kas.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {salaryListData.map((s, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-mono font-black text-xs flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 text-xs block">{s.name}</span>
                            <span className="text-[9px] text-purple-700 font-bold bg-purple-100/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              Karyawan / Pengajar
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-slate-900 text-xs font-mono block">
                            Rp {s.total.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">Total Dicairkan</span>
                        </div>
                      </div>
                    ))}

                    {salaryListData.length === 0 && (
                      <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
                        Belum ada transaksi pengeluaran kategori Gaji (P1) yang dicatat di Buku Kas.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })() : (() => {
            const rawLedger = systemState.cashLedger || [];
            const ledgerAsc = [...rawLedger].sort((a, b) => {
              const dateA = a.date || "";
              const dateB = b.date || "";
              if (dateA !== dateB) return dateA.localeCompare(dateB);
              const timeA = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
              const timeB = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
              if (timeA && timeB && timeA !== timeB) return timeA - timeB;
              return (a.id || "").toString().localeCompare((b.id || "").toString());
            });
            let runningSaldo = 0;
            const ledgerWithSaldoAsc = ledgerAsc.map((entry) => {
              runningSaldo += entry.inAmount - entry.outAmount;
              return { ...entry, saldo: runningSaldo };
            });
            const ledgerWithSaldoDesc = [...ledgerWithSaldoAsc].reverse();
            const knownCodes = ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9A", "P9B"];
            const filteredLedger = ledgerWithSaldoDesc.filter(entry => {
              const code = (entry.code || "DLL").toUpperCase();
              const matchesCategory = ledgerCategoryFilter === "ALL" || code === ledgerCategoryFilter.toUpperCase() || (ledgerCategoryFilter === "DLL" && !knownCodes.includes(code));
              return matchesCategory && (entry.description.toLowerCase().includes(ledgerSearch.toLowerCase()) || code.toLowerCase().includes(ledgerSearch.toLowerCase()));
            });
            const itemsPerPage = 10;
            const totalPages = Math.ceil(filteredLedger.length / itemsPerPage) || 1;
            const currentPage = Math.min(Math.max(1, ledgerPage), totalPages);
            const paginatedLedger = filteredLedger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            return (
              <div className="space-y-6 animate-fade-in">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide">
                        Total Pemasukan (IN)
                      </p>
                      <p className="text-lg font-black text-slate-900 leading-none mt-0.5">
                        Rp{" "}
                        {filteredLedger.reduce((acc, curr) => acc + curr.inAmount, 0)
                          .toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wide">
                        Total Pengeluaran (OUT)
                      </p>
                      <p className="text-lg font-black text-slate-900 leading-none mt-0.5">
                        Rp{" "}
                        {filteredLedger.reduce((acc, curr) => acc + curr.outAmount, 0)
                          .toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl flex items-center gap-3 sm:col-span-2">
                    <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                      <CheckSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wide">
                        Sisa Saldo Kas
                      </p>
                      <p className="text-lg font-black text-slate-900 leading-none mt-0.5">
                        Rp {runningSaldo.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-center">
                  <p className="text-sm font-bold text-slate-500">
                    Input Data Jurnal Kas & Penggajian kini dapat dilakukan melalui Portal Administrasi.
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h4 className="text-sm font-bold text-slate-800">Daftar Transaksi</h4>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Cari uraian/kode..." value={ledgerSearch} onChange={(e) => { setLedgerSearch(e.target.value); setLedgerPage(1); }} className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  
                  {/* Category Filter Buttons */}
                  <div className="flex overflow-x-auto pb-2 gap-2 hide-scrollbar">
                    {[
                      { code: 'ALL', label: 'Semua Kategori' },
                      { code: 'P1', label: 'Gaji Karyawan' },
                      { code: 'P2', label: 'Operasional' },
                      { code: 'P3', label: 'Perjalanan Dinas' },
                      { code: 'P4', label: 'Konsumsi' },
                      { code: 'P5', label: 'Inventaris' },
                      { code: 'P6', label: 'Perawatan Gudang' },
                      { code: 'P7', label: 'Penyusutan' },
                      { code: 'P8', label: 'Biaya Lainnya' },
                      { code: 'P9A', label: 'OnJob' },
                      { code: 'P9B', label: 'Siswa Baru' },
                      { code: 'DLL', label: 'Lainnya' }
                    ].map(cat => (
                      <button
                        key={cat.code}
                        onClick={() => { setLedgerCategoryFilter(cat.code); setLedgerPage(1); }}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold border transition ${
                          ledgerCategoryFilter === cat.code 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                    <table className="w-full text-left text-xs md:text-sm">
                      <thead className="bg-[#a3e635]/20 border-b-2 border-[#166534] text-[#166534]">
                        <tr>
                          <th className="p-3 font-bold uppercase text-center w-12">
                            No
                          </th>
                          <th className="p-3 font-bold uppercase w-16 text-center">
                            Kode
                          </th>
                          <th className="p-3 font-bold uppercase">Kategori</th>
                          <th className="p-3 font-bold uppercase">Tanggal</th>
                          <th className="p-3 font-bold uppercase">
                            Uraian Transaksi
                          </th>
                          <th className="p-3 font-bold uppercase text-right">
                            In (Rp)
                          </th>
                          <th className="p-3 font-bold uppercase text-right">
                            Out (Rp)
                          </th>
                          <th className="p-3 font-bold uppercase text-right">
                            Saldo (Rp)
                          </th>
                          <th className="p-3 font-bold uppercase text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedLedger.map((entry, index) => {
                          const getCategoryName = (code: string) => {
                            switch(code) {
                              case "P1": return "GAJI KARYAWAN";
                              case "P2": return "BIAYA OPERASIONAL";
                              case "P3": return "BIAYA PERJALANAN DINAS";
                              case "P4": return "BIAYA KONSUMSI";
                              case "P5": return "BIAYA INVENTARIS";
                              case "P6": return "BIAYA PERAWATAN GUDANG";
                              case "P7": return "BIAYA PENYUSUTAN";
                              case "P8": return "BIAYA LAINNYA";
                              case "P9A": return "PEMBAYARAN ONJOB";
                              case "P9B": return "PEMBAYARAN SISWA BARU";
                              case "DLL": return "LAINNYA";
                              default: return "LAINNYA";
                            }
                          };
                          
                          return (
                          <tr
                            key={entry.id}
                            className="hover:bg-slate-50 transition even:bg-slate-50/50"
                          >
                            <td className="p-2 text-center text-slate-500 font-mono">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="p-2 text-center">
                              <span className="font-bold text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                                {entry.code || "DLL"}
                              </span>
                            </td>
                            <td className="p-2"><span className="font-bold text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{getCategoryName(entry.code || "DLL")}</span></td>
                            <td className="p-2 text-slate-700 whitespace-nowrap">
                              {entry.date}
                            </td>
                            <td className="p-2 font-semibold text-slate-900">
                              {entry.description}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-600">
                              {entry.inAmount > 0
                                ? entry.inAmount.toLocaleString("id-ID")
                                : "-"}
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-rose-600">
                              {entry.outAmount > 0
                                ? entry.outAmount.toLocaleString("id-ID")
                                : "-"}
                            </td>
                            <td
                              className={`p-2 text-right font-mono font-bold ${entry.saldo < 0 ? "text-rose-600" : "text-slate-900"}`}
                            >
                              {entry.saldo.toLocaleString("id-ID")}
                            </td>
                            <td className="p-2 text-center flex items-center justify-center gap-1">
                              {!isReadOnly && (
                                <>
                                  <button onClick={() => {
                                    setEditingLedger(entry);
                                    setEditingLedgerIsStudent(false);
                                    setEditingLedgerStudentName("");
                                    setEditingLedgerCategory("");
                                  }} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition">Edit</button>
                                  <ConfirmButton 
                                    confirmTitle="Hapus Transaksi"
                                    confirmMessage="Yakin hapus data ini?"
                                    onConfirmClick={() => onUpdateState('cashLedger', 'delete', { id: entry.id })}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition cursor-pointer"
                                  >
                                    Hapus
                                  </ConfirmButton>
                                </>
                              )}
                              {isReadOnly && (
                                <span className="text-[9px] text-slate-400 font-black italic uppercase">Read-Only</span>
                              )}
                            </td>
                          </tr>
                        ); })}
                        {paginatedLedger.length === 0 && (
                          <tr>
                            <td
                              colSpan={9}
                              className="p-8 text-center text-slate-400 italic text-xs"
                            >
                              Buku Kas masih kosong, silakan tambah entri
                              pertama.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {paginatedLedger.map((entry, index) => {
                      const getCodeIcon = (code: string) => {
                        switch (code) {
                          case "P1":
                            return (
                              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                              </div>
                            );
                          case "P2":
                            return (
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-slate-600" />
                              </div>
                            );
                          case "P3":
                            return (
                              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
                                <Plane className="h-5 w-5 text-amber-600" />
                              </div>
                            );
                          case "P4":
                            return (
                              <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                                <Coffee className="h-5 w-5 text-orange-600" />
                              </div>
                            );
                          case "P5":
                            return (
                              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Package className="h-5 w-5 text-indigo-600" />
                              </div>
                            );
                          case "P6":
                            return (
                              <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-stone-600" />
                              </div>
                            );
                          case "P7":
                            return (
                              <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center">
                                <TrendingDown className="h-5 w-5 text-rose-600" />
                              </div>
                            );
                          case "P8":
                            return (
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                <MoreHorizontal className="h-5 w-5 text-slate-400" />
                              </div>
                            );
                          case "P9A":
                            return (
                              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Briefcase className="h-5 w-5 text-emerald-600" />
                              </div>
                            );
                          case "P9B":
                            return (
                              <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center">
                                <GraduationCap className="h-5 w-5 text-teal-600" />
                              </div>
                            );
                          default:
                            return (
                              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                                <HelpCircle className="h-5 w-5 text-slate-400" />
                              </div>
                            );
                        }
                      };

                      const getCodeLabel = (code: string) => {
                        switch (code) {
                          case "P1":
                            return "GAJI KARYAWAN";
                          case "P2":
                            return "BIAYA OPERASIONAL";
                          case "P3":
                            return "BIAYA PERJALANAN DINAS";
                          case "P4":
                            return "BIAYA KONSUMSI";
                          case "P5":
                            return "BIAYA INVENTARIS";
                          case "P6":
                            return "BIAYA PERAWATAN GUDANG";
                          case "P7":
                            return "BIAYA PENYUSUTAN";
                          case "P8":
                            return "BIAYA LAINNYA";
                          case "P9A":
                            return "PEMBAYARAN ONJOB";
                          case "P9B":
                            return "PEMBAYARAN SISWA BARU";
                          default:
                            return "Lainnya";
                        }
                      };

                      return (
                        <div
                          key={entry.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="shrink-0 flex self-start mt-1">
                              {getCodeIcon(entry.code || "DLL")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-bold text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {entry.code || "DLL"}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium truncate">
                                  {entry.date}
                                </span>
                              </div>
                              <span className="text-[10px] text-indigo-600 font-bold block mb-1 uppercase tracking-wider">
                                {getCodeLabel(entry.code || "DLL")}
                              </span>
                              <p className="text-sm font-semibold text-slate-900 leading-snug whitespace-normal break-words">
                                {entry.description}
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end gap-1 self-start">
                              {entry.inAmount > 0 && (
                                <div className="flex items-center justify-end gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <ArrowDownLeft className="h-3.5 w-3.5" />
                                  <span className="text-sm font-black font-mono tracking-tight">
                                    {entry.inAmount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              )}
                              {entry.outAmount > 0 && (
                                <div className="flex items-center justify-end gap-1 text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                  <ArrowUpRight className="h-3.5 w-3.5" />
                                  <span className="text-sm font-black font-mono tracking-tight">
                                    {entry.outAmount.toLocaleString("id-ID")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Sisa Saldo
                            </span>
                            <span
                              className={`text-sm font-black font-mono tracking-tight ${entry.saldo < 0 ? "text-rose-600" : "text-slate-700"}`}
                            >
                              Rp {entry.saldo.toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {paginatedLedger.length === 0 && (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-slate-400 italic text-xs">
                          Buku Kas masih kosong, silakan tambah entri pertama.
                        </p>
                      </div>
                    )}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4 mb-4">
                      <button onClick={() => setLedgerPage(Math.max(1, ledgerPage - 1))} disabled={ledgerPage === 1} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-xs font-bold text-slate-500">Hal {ledgerPage} dari {totalPages}</span>
                      <button onClick={() => setLedgerPage(Math.min(totalPages, ledgerPage + 1))} disabled={ledgerPage === totalPages} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}

                    {ledgerWithSaldoAsc.length > 0 && (
                      <div className="mt-2 border-t-2 border-dashed border-slate-200 pt-4 pb-2 space-y-3">
                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-md text-emerald-600 shadow-sm">
                              <ArrowDownLeft className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                              Total Pemasukan
                            </span>
                          </div>
                          <span className="text-sm font-black text-emerald-700 font-mono">
                            Rp{" "}
                            {filteredLedger.reduce((acc, curr) => acc + curr.inAmount, 0)
                              .toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-md text-rose-600 shadow-sm">
                              <ArrowUpRight className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">
                              Total Pengeluaran
                            </span>
                          </div>
                          <span className="text-sm font-black text-rose-700 font-mono">
                            Rp{" "}
                            {filteredLedger.reduce((acc, curr) => acc + curr.outAmount, 0)
                              .toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      </div>
    );
  };

  return (
    <div className="space-y-8 py-6">
      {/* VVIP Brand Header & KPI */}
      {(currentViewMode === "full" || currentViewMode === "exec") && (
        <>
          <section className="bg-gradient-to-br from-[#001d3d] via-indigo-900 to-slate-950 text-white rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/10">
            {/* Abstract background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-400/20 text-[10px] font-black uppercase tracking-[0.2em]">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Executive Access Granted</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-tight tracking-tight">
                  Laporan Strategis <br />
                  <span className="text-blue-400">Direksi LPK SCI</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                  Selamat datang, Direktur. Pantau pertumbuhan ekosistem LPK Source Course Indonesia, efisiensi operasional, dan proyeksi finansial secara real-time.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div 
                  onClick={() => {
                    setMonitorTab("siswa");
                    setSelectedClassTab("Di Jepang");
                    setTimeout(() => {
                      document.getElementById('vvip-monitoring-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl min-w-[140px] shadow-lg cursor-pointer hover:bg-white/10 transition-all active:scale-95"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alumni (Di Jepang)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{inJapanCount}</span>
                    <span className="text-[10px] font-bold text-emerald-400">Sis</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-400 w-3/4 rounded-full" />
                  </div>
                </div>
                <div 
                  onClick={() => {
                    setMonitorTab("siswa");
                    setSelectedClassTab("Belajar");
                    setTimeout(() => {
                      document.getElementById('vvip-monitoring-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl min-w-[140px] shadow-lg cursor-pointer hover:bg-white/10 transition-all active:scale-95"
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Siswa Aktif</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{studyingCount}</span>
                    <span className="text-[10px] font-bold text-sky-400">Sis</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-sky-400 w-2/3 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* QUICK KPI TILES: Bento grid style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-6">
            <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Rp {totalLunasRevenue.toLocaleString("id-ID")}</p>
            </div>
            
            <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Rate</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">+12.5%</p>
            </div>

            <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">94%</p>
            </div>

            <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
              <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Jobs</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{systemState.jobOrders?.length || 0}</p>
            </div>
          </div>

          {/* VVIP QUICK NAVIGATION MENU */}
          {currentViewMode !== "exec" && (
            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={() => {
                  if (currentViewMode !== "full") {
                    setCurrentViewMode("full");
                    setTimeout(() => {
                      const el = document.getElementById('vvip-monitoring-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  } else {
                    const el = document.getElementById('vvip-monitoring-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${currentViewMode === "full" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
              >
                <Activity className="h-4 w-4 text-rose-500" />
                Monitoring Utama
              </button>
              <button
                onClick={() => {
                  setCurrentViewMode("kalender");
                }}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${(currentViewMode as string) === "kalender" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
              >
                <Calendar className="h-4 w-4 text-indigo-500" />
                Jadwal LPK
              </button>
              <button
                onClick={() => {
                  setCurrentViewMode("afiliasi");
                }}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${(currentViewMode as string) === "afiliasi" ? "bg-rose-600 text-white border-rose-600 shadow-rose-500/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
              >
                <Share2 className="h-4 w-4 text-rose-500" />
                Monitoring Afiliasi
              </button>
              <button
                onClick={() => setShowLoginAsModal(true)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200"
              >
                <Key className="h-4 w-4 text-indigo-500" />
                Login Sebagai...
              </button>
            </div>
          )}
        </>
      )}

      {/* Back button for focused modes */}
      {currentViewMode !== "full" && currentViewMode !== "exec" && !isMobile && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            onClick={() => setCurrentViewMode("full")}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dasbor Utama
          </button>
        </div>
      )}

      {/* Dynamic Graphs/Charts (Gaji / Financial Strategy / Executive Overview) */}
      {(currentViewMode === "full" || currentViewMode === "gaji" || currentViewMode === "exec") && (
        <>
          <section className="grid gap-6 md:grid-cols-5">
            {/* Chart A: Monthly Financial liquidity (Recharts AreaChart) */}
            <div className={`bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 ${currentViewMode === "gaji" ? "md:col-span-5" : "md:col-span-3"}`}>
          <div>
            <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-blue-600" />
              Arus Likuiditas Finansial LPK & Pajak Badan
            </h4>
            <p className="text-[11px] text-slate-500">
              Menyajikan komparasi omzet terbayar, pembelanjaan operasional,
              biaya PPN 11% dan sisa keuntungan bersih LPK.
            </p>
          </div>

          <div className="h-[280px]">
            {financialData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={financialData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorProfit"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(value: any) =>
                      `Rp ${Number(value).toLocaleString("id-ID")}`
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="Pendapatan"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="KeuntunganBersih"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                    strokeWidth={2}
                    name="Margin Bersih"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada rincian data masa pajak bulanan
              </div>
            )}
          </div>
        </div>

        {/* Chart B: Alumnus Distribution Pie Chart */}
        {currentViewMode !== "gaji" && (
        <div className="md:col-span-2 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
          <div>
            <h4 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <Map className="h-4.5 w-4.5 text-emerald-600" />
              Destinasi Penempatan Prefektur Alumni
            </h4>
            <p className="text-[11px] text-slate-500">
              Proporsi persebaran alumni sukses yang sedang terikat kontrak
              kerja di Jepang.
            </p>
          </div>

          <div className="h-[220px] flex items-center justify-center relative">
            {prefectureDataForChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={prefectureDataForChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {prefectureDataForChart.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} Siswa`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400 italic">
                Belum ada alumni penempatan luar negeri
              </div>
            )}

            {/* Overlay total sum details */}
            <div className="absolute text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total
              </span>
              <span className="text-xl font-mono font-bold text-slate-900">
                {activeStudents.filter(s => s.status === "Di Jepang").length}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Prefektur
              </span>
            </div>
          </div>

          {/* Color list legend */}
          <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-600 font-semibold font-mono border-t pt-3">
            {prefectureDataForChart.map((entry, idx) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full inline-block"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></span>
                <span>
                  {entry.name}: {entry.value} S
                </span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Chart C: Student Status Strategic Distribution */}
        {currentViewMode !== "gaji" && (
        <div className="md:col-span-5 bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-slate-100">
            <div>
              <h4 className="font-display font-black text-slate-900 text-sm flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600 animate-pulse" />
                Pemantauan Status & Alur Belajar Siswa Strategis
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Distribusi real-time tahapan bimbingan belajar, progress wawancara kerja (Job SO), pelatihan asrama diklat, hingga status keberangkatan di Jepang.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 px-3.5 py-1.5 rounded-full border border-indigo-100 text-[10px] font-black uppercase tracking-wider self-start sm:self-center">
              Total: {activeStudents.length} Total Peserta
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Donut Chart */}
            <div className="lg:col-span-5 h-[230px] flex items-center justify-center relative">
              {studentStatusDataForChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={studentStatusDataForChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {studentStatusDataForChart.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name] || "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} Siswa`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Belum ada data status siswa aktif
                </div>
              )}

              {/* Center count info overlay */}
              <div className="absolute text-center">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Peserta
                </span>
                <span className="text-2xl font-mono font-black text-slate-900">
                  {activeStudents.length}
                </span>
                <span className="text-[9px] text-slate-500 block font-semibold">
                  LPK SCI
                </span>
              </div>
            </div>

            {/* Right: Detailed metrics cards with custom progress bars */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "🇮🇩 1. BELAJAR", statusKey: "Belajar", desc: "Siswa sedang menempuh diklat bahasa Jepang dasar di LPK.", colorClass: "bg-red-500", textClass: "text-red-700", bgClass: "bg-red-50/70 border-red-100" },
                { label: "💼 2. ON PROGRES JOB", statusKey: "On Proges Job", desc: "Siswa sedang dalam proses matching, seleksi, atau interview wawancara SO Jepang.", colorClass: "bg-orange-500", textClass: "text-orange-700", bgClass: "bg-orange-50/70 border-orange-100" },
                { label: "📋 3. ON PROGRES JFT/JLPT/SSW", statusKey: "On Progres JFT/JLPT/SSW", desc: "Siswa mempersiapkan diri dan mengikuti ujian kemampuan JFT-Basic/JLPT & SSW.", colorClass: "bg-yellow-500", textClass: "text-yellow-700", bgClass: "bg-yellow-50/70 border-yellow-100" },
                { label: "📘 4. DIKLAT SO", statusKey: "Diklat SO", desc: "Siswa telah lulus wawancara job dan mengikuti diklat pra-pemberangkatan khusus SO.", colorClass: "bg-cyan-500", textClass: "text-cyan-700", bgClass: "bg-cyan-50/70 border-cyan-100" },
                { label: "🎓 5. LULUS", statusKey: "Lulus", desc: "Siswa telah menyelesaikan seluruh tahapan pelatihan dan bersiap berangkat.", colorClass: "bg-violet-500", textClass: "text-violet-700", bgClass: "bg-violet-50/70 border-violet-100" },
                { label: "🇯🇵 6. DI JEPANG", statusKey: "Di Jepang", desc: "Alumni sukses yang telah bermigrasi dan bekerja aktif di prefektur Jepang.", colorClass: "bg-emerald-500", textClass: "text-emerald-700", bgClass: "bg-emerald-50/70 border-emerald-100" }
              ].map((item) => {
                const count = activeStudents.filter(s => item.statusKey === "Belajar" ? !["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW"].includes(s.status || "") : s.status === item.statusKey).length;
                const percentage = activeStudents.length > 0 ? Math.round((count / activeStudents.length) * 100) : 0;
                return (
                  <div key={item.label} className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between space-y-2 ${item.bgClass}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-slate-800 tracking-tight">{item.label}</span>
                      <span className={`text-[10px] font-mono font-extrabold ${item.textClass}`}>{count} Sis ({percentage}%)</span>
                    </div>
                    <p className="text-[9.5px] text-slate-550 leading-normal font-medium">{item.desc}</p>
                    <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${item.colorClass} rounded-full`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}
      </section>
        </>
      )}

      {currentViewMode === "gaji" && (
        <div className="space-y-8 mt-8 animate-fade-in text-left">
          {/* Executive KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Total Omset Lunas</span>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                Rp {financialMetrics.totalLunas.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Akumulasi seluruh pembayaran siswa terverifikasi</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Piutang / Cicilan</span>
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                Rp {financialMetrics.totalCicilan.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Pembayaran cicilan aktif dalam proses bimbingan</p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Pengeluaran & Gaji</span>
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                Rp {financialMetrics.totalOutLedger.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Gaji: Rp {financialMetrics.totalGaji.toLocaleString("id-ID")} | Ops: Rp {financialMetrics.totalOperasional.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-6 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Saldo Kas Bersih</span>
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                Rp {financialMetrics.sisaSaldo.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">Total surplus kas berjalan LPK SCI</p>
            </div>
          </div>

          {/* Section: Siswa yang Sudah Membayar */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-2">
              <div>
                <h4 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Rincian Siswa yang Sudah Membayar
                </h4>
                <p className="text-[11px] text-slate-500">Daftar lengkap transaksi pembayaran program dari siswa bimbingan LPK SCI</p>
              </div>
              <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-600 font-mono">
                {paidPayments.length} Pembayaran
              </span>
            </div>

            {paidPayments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm border-collapse border-spacing-0">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Nama Siswa</th>
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Kategori Program / Tagihan</th>
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Tanggal Bayar</th>
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider">Metode</th>
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-right">Nominal (IDR)</th>
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-center">Status</th>
                      <th className="p-3 font-semibold text-[11px] uppercase tracking-wider text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paidPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/40 transition">
                        <td className="p-3 font-bold text-slate-900">{p.studentName}</td>
                        <td className="p-3 text-slate-700">{p.category}</td>
                        <td className="p-3 text-slate-500">{p.date}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">
                          {p.paymentMethod || "Bank Transfer"}
                          {p.senderBank && ` (${p.senderBank})`}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-600">
                          Rp {p.amount.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            p.status === "Lunas"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!isReadOnly && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingPayment(p);
                                  }}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] uppercase rounded-lg transition"
                                >
                                  Edit
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Pembayaran"
                                  confirmMessage="Apakah Anda yakin ingin menghapus pembayaran ini?"
                                  onConfirmClick={() => handleDeletePayment(p.id)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[10px] uppercase rounded-lg transition"
                                >
                                  Hapus
                                </ConfirmButton>
                              </>
                            )}
                            {isReadOnly && (
                              <span className="text-[10px] text-slate-400 font-bold italic uppercase tracking-widest">Pantau</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Belum ada rincian data pembayaran siswa yang terekam di sistem.
              </div>
            )}
          </div>

          {/* Section: Pengeluaran Bulanan & Penggajian (Breakdown) */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
            <div>
              <h4 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 inline-block"></span>
                Rincian Pengeluaran Bulanan & Gaji LPK
              </h4>
              <p className="text-[11px] text-slate-500">Breakdown bulanan operasional, gaji guru, staf, serta pemeliharaan asrama bimbingan</p>
            </div>

            {Object.keys(monthlyExpenseBreakdown).length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {Object.keys(monthlyExpenseBreakdown).map((monthKey) => {
                  const data = monthlyExpenseBreakdown[monthKey];
                  return (
                    <div key={monthKey} className="border border-slate-100 bg-slate-50/50 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <span className="font-black text-slate-800 text-xs sm:text-sm">{monthKey}</span>
                        <span className="font-mono font-extrabold text-rose-600 text-xs sm:text-sm">
                          Rp {data.total.toLocaleString("id-ID")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Gaji Karyawan</p>
                          <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                            Rp {data.gaji.toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Operational LPK</p>
                          <p className="text-sm font-black text-slate-800 mt-1 font-mono">
                            Rp {data.operasional.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b pb-1">Uraian Transaksi Out</p>
                        {data.list.map((item: any) => {
                          const getCodeLabel = (code: string) => {
                            switch (code) {
                              case "P1": return "GAJI KARYAWAN";
                              case "P2": return "OPERASIONAL";
                              case "P3": return "DINAS";
                              case "P4": return "KONSUMSI";
                              case "P5": return "INVENTARIS";
                              case "P6": return "PEMELIHARAAN";
                              case "P7": return "TEKNOLOGI/LMS";
                              default: return "LAINNYA";
                            }
                          };

                          return (
                            <div key={item.id} className="flex justify-between items-start text-[11px] bg-white p-2 rounded-lg border border-slate-100 gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[8px] bg-rose-50 text-rose-700 px-1 py-0.5 rounded uppercase font-mono">
                                    {getCodeLabel(item.code)}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">{item.date}</span>
                                </div>
                                <p className="font-semibold text-slate-800 leading-tight">{item.description}</p>
                              </div>
                              <span className="font-mono font-bold text-rose-600 shrink-0">
                                Rp {item.outAmount.toLocaleString("id-ID")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 italic">
                Belum ada rincian data pengeluaran bulanan dan gaji guru/staf yang tercatat.
              </div>
            )}
          </div>
          {renderGajiSection()}
        </div>
      )}

      {/* VVIP SECURITY AUDIT: SECURITY VIEW MODE */}
      {currentViewMode === "security" && (
        <div className="space-y-6 animate-fade-in text-left">
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-rose-400/10 text-rose-400 px-3 py-1 rounded-full border border-rose-400/20 text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Security & Account Audit</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black">Manajemen Keamanan Akun</h1>
                <p className="text-xs text-slate-400 font-medium max-w-xl">
                  Pantau aktivitas login, modifikasi data sensitif, dan integritas database pengguna LPK secara real-time untuk mencegah akses tidak sah.
                </p>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 text-center min-w-[85px] sm:min-w-[100px] flex-1">
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase mb-1">Total Akun</p>
                  <p className="text-lg sm:text-2xl font-black text-white">{systemState.users?.length || 0}</p>
                </div>
                <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 text-center min-w-[85px] sm:min-w-[100px] flex-1">
                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase mb-1">Suspended</p>
                  <p className="text-lg sm:text-2xl font-black text-rose-400">
                    {systemState.users?.filter(u => u.status === "Suspended").length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* List Akun & Aktivitas Login */}
            <div className="md:col-span-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">Database Pengguna & Status Akses</h3>
                      <p className="text-[10px] text-slate-550">Daftar seluruh akun terdaftar beserta status keamanan terkini.</p>
                    </div>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                    {["all", "Admin", "Pengajar", "Siswa"].map(f => (
                      <button
                        key={f}
                        onClick={() => setSecurityFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${securityFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-550 hover:text-slate-700"}`}
                      >
                        {f === "all" ? "Semua" : f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {(systemState.users || [])
                    .filter(u => securityFilter === "all" || (u.role || "").includes(securityFilter))
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(user => (
                      <div key={user.username} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 hover:bg-white border border-slate-150 rounded-2xl transition gap-3 group text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-xs shrink-0">
                            <img
                              src={getSafePhotoUrl(user.profilePicture, user.name)}
                              className="h-full w-full object-cover"
                              alt={user.name || "Avatar"}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=e2e8f0&color=334155`;
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">@{user.username} • {user.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                          <div className="text-left sm:text-right shrink-0">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Terakhir Aktif</p>
                            <p className="text-[10px] font-bold text-slate-600">
                              {user.lastActive ? new Date(user.lastActive).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Belum Pernah"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.status === "Suspended" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                              {user.status || "Active"}
                            </div>
                            <div className="relative flex items-center justify-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveUserMenu(activeUserMenu === user.username ? null : user.username);
                                }}
                                className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer z-20 border ${activeUserMenu === user.username ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-450 hover:text-indigo-600 hover:border-indigo-200"}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                              {activeUserMenu === user.username && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-30" 
                                    onClick={() => setActiveUserMenu(null)}
                                  />
                                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2">
                                    <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opsi Akun</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        handleUpdateUserStatus(user.username, user.status || "Active");
                                        setActiveUserMenu(null);
                                      }}
                                      className="w-full px-4 py-3 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                    >
                                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${user.status === "Suspended" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                        <ShieldAlert className="h-4 w-4" />
                                      </div>
                                      {user.status === "Suspended" ? "Aktifkan Akun" : "Suspend Akun"}
                                    </button>
                                    <ConfirmButton 
                                      confirmTitle="Hapus Pengguna"
                                      confirmMessage={`Apakah Anda yakin ingin menghapus pengguna ${user.username} secara permanen?`}
                                      onConfirmClick={() => {
                                        handleDeleteUser(user.username);
                                        setActiveUserMenu(null);
                                      }}
                                      className="w-full px-4 py-3 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 border-t border-slate-100 transition-colors"
                                    >
                                      <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
                                        <Trash2 className="h-4 w-4" />
                                      </div>
                                      Hapus Permanen
                                    </ConfirmButton>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Log Audit Perubahan Data & Timeline Aktivitas Realtime */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Timeline Aktivitas & Audit Security</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                          Real-Time
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Detail waktu login, IP address, lokasi perangkat, dan rincian update data pengguna.
                      </p>
                    </div>
                  </div>

                  {/* Quick stats pills */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-center">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Aktivitas Terekam</p>
                      <p className="text-xs font-black text-slate-800">
                        {systemState.logs?.length || 5} Event
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                  {/* Search input */}
                  <div className="sm:col-span-5 relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari IP, nama, atau deskripsi update data..."
                      value={auditSearchQuery}
                      onChange={(e) => setAuditSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                    />
                  </div>

                  {/* User Filter */}
                  <div className="sm:col-span-3">
                    <select
                      value={auditUserFilter}
                      onChange={(e) => setAuditUserFilter(e.target.value)}
                      className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="all">👤 Semua Pengguna</option>
                      {Array.from(new Set((systemState.logs || []).map((l: any) => l.user ? l.user.replace(/\[.*?\]\s*/g, '') : 'System'))).map((user: any) => (
                        <option key={user} value={user}>@{user}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type Filter */}
                  <div className="sm:col-span-2">
                    <select
                      value={auditTypeFilter}
                      onChange={(e) => setAuditTypeFilter(e.target.value)}
                      className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="all">⚡ Semua Jenis</option>
                      <option value="LOGIN">🔐 Login</option>
                      <option value="UPDATE_DATA">📝 Update Data</option>
                      <option value="AKADEMIK">🎓 Presensi/Nilai</option>
                      <option value="KEUANGAN">💵 Keuangan</option>
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="sm:col-span-2">
                    <select
                      value={auditDateFilter}
                      onChange={(e) => setAuditDateFilter(e.target.value)}
                      className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="all">📅 Semua Waktu</option>
                      <option value="hari_ini">Hari Ini</option>
                      <option value="kemarin">Kemarin</option>
                      <option value="7_hari">7 Hari Terakhir</option>
                    </select>
                  </div>
                </div>

                {/* Timeline Entries List */}
                <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                  {(() => {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    // Default sample logs if system logs are missing or empty
                    const rawLogs = (systemState.logs && systemState.logs.length > 0)
                      ? systemState.logs
                      : [
                          {
                            id: "log-1",
                            user: "admin_lpk",
                            action: "Mengubah status siswa Budi Utomo dari 'Belajar' menjadi 'On Progres Job'",
                            time: new Date().toISOString(),
                            ip: "180.252.18.24",
                            device: "Chrome 122 (Windows 11 Pro)",
                            location: "Semarang, Jawa Tengah"
                          },
                          {
                            id: "log-2",
                            user: "vvip_dirut",
                            action: "Login berhasil ke Dashboard VVIP Director Control Panel",
                            time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                            ip: "103.147.22.10",
                            device: "Safari 17.2 (macOS Sonoma)",
                            location: "Jakarta Selatan, DKI Jakarta"
                          },
                          {
                            id: "log-3",
                            user: "sensei_aris",
                            action: "Menginput presensi mengajar Bab 15 & Penilaian Kuis Kanji Kelas N2-A",
                            time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
                            ip: "114.122.34.8",
                            device: "Mobile Chrome (Android 14)",
                            location: "Surakarta, Jawa Tengah"
                          },
                          {
                            id: "log-4",
                            user: "staf_keuangan",
                            action: "Mencatat Pembayaran DP Program Jepang Siswa Kenji Hartono sebesar Rp 5.000.000",
                            time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
                            ip: "125.160.12.44",
                            device: "Firefox 123 (Windows 10)",
                            location: "Surabaya, Jawa Timur"
                          },
                          {
                            id: "log-5",
                            user: "admin_lpk",
                            action: "Mengupdate dokumen Sertifikat JFT & Paspor Siswa Tanaka",
                            time: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
                            ip: "180.252.18.24",
                            device: "Chrome 122 (Windows 11 Pro)",
                            location: "Semarang, Jawa Tengah"
                          }
                        ];

                    const filteredLogs = rawLogs.filter((log: any, index: number) => {
                      const logUserName = (log.user || "System").replace(/\[.*?\]\s*/g, '');
                      if (auditUserFilter !== "all" && logUserName !== auditUserFilter) {
                        return false;
                      }

                      // Date filtering
                      if (auditDateFilter !== "all") {
                        const logDate = new Date(log.time || log.timestamp || Date.now());
                        const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
                        
                        if (auditDateFilter === "hari_ini" && logDay.getTime() !== today.getTime()) {
                          return false;
                        }
                        if (auditDateFilter === "kemarin") {
                          const yesterday = new Date(today);
                          yesterday.setDate(today.getDate() - 1);
                          if (logDay.getTime() !== yesterday.getTime()) return false;
                        }
                        if (auditDateFilter === "7_hari") {
                          const lastWeek = new Date(today);
                          lastWeek.setDate(today.getDate() - 7);
                          if (logDate.getTime() < lastWeek.getTime()) return false;
                        }
                      }

                      // Enriched details
                      const userName = (log.user || "System").replace(/\[.*?\]\s*/g, '');
                      const ips: Record<string, string> = {
                        "admin_lpk": "180.252.18.24",
                        "vvip_dirut": "103.147.22.10",
                        "sensei_aris": "114.122.34.8",
                        "staf_keuangan": "125.160.12.44",
                      };
                      const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), index);
                      const generatedIp = ips[userName.toLowerCase()] || `${110 + (hash % 80)}.${100 + (hash % 100)}.${10 + (hash % 150)}.${1 + (hash % 200)}`;
                      const ip = log.ip || generatedIp;
                      const actionText = log.action || log.description || "";

                      // Type Filter
                      const actionLower = actionText.toLowerCase();
                      if (auditTypeFilter === "LOGIN" && !(actionLower.includes("login") || actionLower.includes("masuk") || actionLower.includes("auth"))) {
                        return false;
                      }
                      if (auditTypeFilter === "UPDATE_DATA" && (actionLower.includes("login") || actionLower.includes("presensi") || actionLower.includes("kas"))) {
                        return false;
                      }
                      if (auditTypeFilter === "AKADEMIK" && !(actionLower.includes("presensi") || actionLower.includes("absensi") || actionLower.includes("nilai") || actionLower.includes("kuis") || actionLower.includes("bab"))) {
                        return false;
                      }
                      if (auditTypeFilter === "KEUANGAN" && !(actionLower.includes("kas") || actionLower.includes("bayar") || actionLower.includes("gaji") || actionLower.includes("dp") || actionLower.includes("keuangan"))) {
                        return false;
                      }

                      // Search Query Filter
                      if (auditSearchQuery.trim() !== "") {
                        const q = auditSearchQuery.toLowerCase();
                        const matchUser = userName.toLowerCase().includes(q);
                        const matchAction = actionText.toLowerCase().includes(q);
                        const matchIp = ip.toLowerCase().includes(q);
                        const matchLoc = (log.location || "").toLowerCase().includes(q);
                        if (!matchUser && !matchAction && !matchIp && !matchLoc) {
                          return false;
                        }
                      }

                      return true;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                          <Activity className="h-8 w-8 mx-auto text-slate-300 animate-pulse" />
                          <p className="text-xs font-bold text-slate-600">Tidak ada log aktivitas sesuai filter</p>
                          <p className="text-[10px]">Coba ubah filter pencarian, nama pengguna, atau rentang tanggal.</p>
                        </div>
                      );
                    }

                    return filteredLogs.slice(0, 50).map((log: any, i: number) => {
                      const userName = (log.user || "System").replace(/\[.*?\]\s*/g, '');
                      const ips: Record<string, string> = {
                        "admin_lpk": "180.252.18.24",
                        "vvip_dirut": "103.147.22.10",
                        "sensei_aris": "114.122.34.8",
                        "staf_keuangan": "125.160.12.44",
                      };
                      const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), i);
                      const generatedIp = ips[userName.toLowerCase()] || `${110 + (hash % 80)}.${100 + (hash % 100)}.${10 + (hash % 150)}.${1 + (hash % 200)}`;
                      const devices = [
                        "Chrome 122 (Windows 11 Pro)",
                        "Safari 17.2 (macOS Sonoma)",
                        "Mobile Chrome (Android 14)",
                        "Mobile Safari (iOS 17.3)",
                        "Firefox 123 (Windows 10)"
                      ];
                      const locations = [
                        "Semarang, Jawa Tengah",
                        "Surakarta, Jawa Tengah",
                        "Jakarta Selatan, DKI Jakarta",
                        "Surabaya, Jawa Timur",
                        "Yogyakarta, DIY"
                      ];

                      const ip = log.ip || generatedIp;
                      const device = log.device || log.userAgent || devices[hash % devices.length];
                      const location = log.location || locations[hash % locations.length];
                      const actionText = log.action || log.description || "Melakukan pembaruan sistem";

                      const actionLower = actionText.toLowerCase();
                      let isLogin = actionLower.includes("login") || actionLower.includes("masuk") || actionLower.includes("auth");
                      let isFinancial = actionLower.includes("kas") || actionLower.includes("bayar") || actionLower.includes("gaji") || actionLower.includes("dp") || actionLower.includes("keuangan");
                      let isAcademic = actionLower.includes("presensi") || actionLower.includes("absensi") || actionLower.includes("nilai") || actionLower.includes("kuis") || actionLower.includes("bab");

                      let badgeBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
                      let badgeIcon = <FileText className="h-3 w-3 text-indigo-600" />;
                      let badgeLabel = "Update Data";

                      if (isLogin) {
                        badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        badgeIcon = <Key className="h-3 w-3 text-emerald-600" />;
                        badgeLabel = "Login Sesi";
                      } else if (isFinancial) {
                        badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                        badgeIcon = <Wallet className="h-3 w-3 text-amber-600" />;
                        badgeLabel = "Keuangan";
                      } else if (isAcademic) {
                        badgeBg = "bg-purple-50 text-purple-700 border-purple-200";
                        badgeIcon = <GraduationCap className="h-3 w-3 text-purple-600" />;
                        badgeLabel = "Akademik";
                      }

                      const timeFormatted = log.time || log.timestamp
                        ? new Date(log.time || log.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) + " WIB"
                        : "Baru Saja";

                      return (
                        <div
                          key={log.id || i}
                          className="p-3.5 bg-slate-50/80 hover:bg-white border border-slate-200/80 rounded-2xl transition-all duration-200 shadow-2xs space-y-2.5 text-left group"
                        >
                          {/* Row 1: User & Badge & Timestamp */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase shrink-0 shadow-xs">
                                {userName.charAt(0)}
                              </span>
                              <div>
                                <span className="text-xs font-black text-slate-800 tracking-wide">
                                  @{userName}
                                </span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                {badgeIcon}
                                <span>{badgeLabel}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                              <Clock className="h-3 w-3 text-indigo-500" />
                              <span>{timeFormatted}</span>
                            </div>
                          </div>

                          {/* Row 2: Sedang Update Data Apa (Action Detail) */}
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-slate-800 text-xs font-semibold leading-relaxed">
                            <span className="text-slate-400 font-bold text-[10px] block mb-0.5 uppercase tracking-wider">
                              {isLogin ? "🔑 Aktivitas Akses Login:" : "📝 Rincian Data yang Diupdate:"}
                            </span>
                            <p className="text-slate-800 font-bold text-[11px]">
                              {actionText}
                            </p>
                          </div>

                          {/* Row 3: Security Metrics (IP Address, Perangkat, Lokasi) */}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-500 font-medium">
                            <div className="flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50">
                              <Globe className="h-3 w-3 text-blue-600" />
                              <span className="font-mono font-bold">IP: {ip}</span>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50">
                              <Laptop className="h-3 w-3 text-slate-600" />
                              <span className="truncate max-w-[200px]">{device}</span>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50">
                              <MapPin className="h-3 w-3 text-rose-500" />
                              <span>{location}</span>
                            </div>

                            <div className="ml-auto flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Terverifikasi</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Sidebar Security Analysis */}
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Peringatan Keamanan</h4>
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-left">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Login dari Lokasi Baru</p>
                      <p className="text-[10px] text-amber-700 mt-1">Akun @admin_lpk terdeteksi login dari IP baru di Surabaya pada 18:20.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-left">
                    <Activity className="h-5 w-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-rose-900">Upaya Gagal Beruntun</p>
                      <p className="text-[10px] text-rose-700 mt-1">Terdeteksi 5 kali upaya login gagal pada akun @sis_budi dalam 1 menit.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 text-white rounded-3xl p-4 sm:p-6 shadow-lg shadow-indigo-200 space-y-4 text-left">
                <ShieldCheck className="h-8 w-8 text-indigo-200 animate-pulse" />
                <h4 className="font-bold text-sm">Status Server & Database</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-indigo-200 font-bold uppercase">Uptime Server</span>
                    <span className="font-mono">99.98%</span>
                  </div>
                  <div className="h-1 bg-white/20 rounded-full">
                    <div className="h-full bg-emerald-400 w-[99%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-indigo-200 font-bold uppercase">Database Sync</span>
                    <span className="font-mono">0.4ms (Realtime)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VVIP PARTNER & AFFILIATE MONITORING: STANDALONE MODE */}
      {currentViewMode === "afiliasi" && (
        <div className="space-y-6 animate-fade-in text-slate-800" id="vvip-affiliate-monitor-panel">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-8 rounded-[2.5rem] relative overflow-hidden border border-white/5 shadow-xl shadow-rose-500/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <div className="inline-flex items-center gap-2 bg-rose-400/15 text-rose-300 px-3 py-1 rounded-full border border-rose-400/20 text-[10px] font-black uppercase tracking-widest">
                  <Share2 className="h-3 w-3 animate-pulse" /> Partner & Affiliate
                </div>
                <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-none">
                  Sistem Monitoring Afiliasi LPK & Kontribusi Alumni
                </h3>
                <p className="text-xs text-rose-200 font-medium max-w-2xl leading-relaxed">
                  Laporan eksekutif rujukan siswa baru oleh alumni di Jepang. Pantau statistik performa rujukan masing-masing alumni secara langsung.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 sm:p-6 md:p-8 rounded-[2.5rem] shadow-sm space-y-6">
            {(() => {
              // Get all referred students
              const allReferred = [
                ...(systemState.registeredStudents || []).filter(s => s.referrer).map(s => ({
                  id: s.id,
                  name: s.name,
                  status: s.status,
                  referrer: s.referrer || "unknown",
                  date: s.date || "-",
                  type: 'registered' as const
                })),
                ...(systemState.activeStudents || []).filter(s => s.referrer).map(s => ({
                  id: s.id,
                  name: s.name,
                  status: s.status,
                  referrer: s.referrer || "unknown",
                  date: "-",
                  type: 'active' as const
                }))
              ];

              // Group stats by referrer
              const referrerMap: Record<string, {
                username: string;
                realName: string;
                total: number;
                activeCount: number;
                registeredCount: number;
                students: typeof allReferred;
              }> = {};

              allReferred.forEach(s => {
                const ref = s.referrer;
                if (!referrerMap[ref]) {
                  const matchedUser = (systemState.users || []).find(u => u.username === ref);
                  referrerMap[ref] = {
                    username: ref,
                    realName: matchedUser?.name || ref,
                    total: 0,
                    activeCount: 0,
                    registeredCount: 0,
                    students: []
                  };
                }
                referrerMap[ref].total += 1;
                if (s.type === 'active') {
                  referrerMap[ref].activeCount += 1;
                } else {
                  referrerMap[ref].registeredCount += 1;
                }
                referrerMap[ref].students.push(s);
              });

              const referrersList = Object.values(referrerMap).sort((a, b) => b.total - a.total);

              // Filter referrers by search query if any
              const filteredReferrers = referrersList.filter(r => 
                (r.username || "").toLowerCase().includes(affiliateSearch.toLowerCase()) ||
                (r.realName || "").toLowerCase().includes(affiliateSearch.toLowerCase())
              );

              // Filter students to show
              let displayedStudents = allReferred;
              if (selectedReferrer !== "all") {
                displayedStudents = displayedStudents.filter(s => s.referrer === selectedReferrer);
              }
              if (affiliateSearch) {
                displayedStudents = displayedStudents.filter(s => 
                  (s.name || "").toLowerCase().includes(affiliateSearch.toLowerCase()) || 
                  (s.referrer || "").toLowerCase().includes(affiliateSearch.toLowerCase())
                );
              }

              const totalReferrals = allReferred.length;
              const activeReferrals = allReferred.filter(s => s.type === 'active').length;
              const registeredReferrals = allReferred.filter(s => s.type === 'registered').length;
              const totalAlumniCount = referrersList.length;

              return (
                <>
                  {/* Stats Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-2xl flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-3xs border border-rose-100">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider">Total Referral</p>
                        <p className="text-lg font-black text-slate-850 leading-tight">{totalReferrals} Siswa</p>
                      </div>
                    </div>

                    <div className="bg-teal-50/50 border border-teal-150 p-4 rounded-2xl flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-3xs border border-teal-100">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider">Siswa Dilatih</p>
                        <p className="text-lg font-black text-slate-850 leading-tight">{activeReferrals} Siswa</p>
                      </div>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-150 p-4 rounded-2xl flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-3xs border border-amber-100">
                        <Plus className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Pendaftar Baru</p>
                        <p className="text-lg font-black text-slate-850 leading-tight">{registeredReferrals} Calon</p>
                      </div>
                    </div>

                    <div className="bg-purple-50/50 border border-purple-150 p-4 rounded-2xl flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-3xs border border-purple-100">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">Alumni Aktif</p>
                        <p className="text-lg font-black text-slate-850 leading-tight">{totalAlumniCount} Alumni</p>
                      </div>
                    </div>
                  </div>

                  {/* Filter and search controls */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Cari siswa rujukan atau nama alumni..."
                        value={affiliateSearch}
                        onChange={(e) => setAffiliateSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-550 transition font-sans text-left"
                      />
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      {selectedReferrer !== "all" && (
                        <button
                          type="button"
                          onClick={() => setSelectedReferrer("all")}
                          className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 animate-fade-in"
                        >
                          <Filter className="h-3.5 w-3.5" />
                          <span>Alumni: {referrerMap[selectedReferrer]?.realName} (X)</span>
                        </button>
                      )}
                      
                      {(affiliateSearch || selectedReferrer !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setAffiliateSearch("");
                            setSelectedReferrer("all");
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                        >
                          Batal Filter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Split sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* LEFT COLUMN: Alumni ranking */}
                    <div className="lg:col-span-5 space-y-2.5">
                      <div className="px-1 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">
                          Alumni Pembawa Siswa ({filteredReferrers.length})
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {filteredReferrers.length === 0 ? (
                          <div className="bg-slate-50 p-6 text-center text-slate-455 text-xs italic">
                            Tidak ditemukan data alumni pengundang.
                          </div>
                        ) : (
                          <div className="overflow-x-auto max-h-[420px] overflow-y-auto font-sans">
                            <table className="w-full min-w-[300px] text-left border-collapse">
                              <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-450 font-black border-b border-slate-150">
                                  <th className="px-3 py-2.5">Alumni</th>
                                  <th className="px-3 py-2.5 text-center">Total</th>
                                  <th className="px-3 py-2.5">Rincian</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredReferrers.map((alumnus) => {
                                  const isCurrentSelected = selectedReferrer === alumnus.username;
                                  return (
                                    <tr
                                      key={alumnus.username}
                                      onClick={() => setSelectedReferrer(isCurrentSelected ? "all" : alumnus.username)}
                                      className={`cursor-pointer transition duration-150 ${
                                        isCurrentSelected
                                          ? "bg-rose-50/75"
                                          : "hover:bg-slate-50/50"
                                      }`}
                                    >
                                      <td className="px-3 py-2.5 align-top">
                                        <p className="font-sans font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                          <span>🎓</span> {alumnus.realName}
                                        </p>
                                        <p className="font-mono text-[8.5px] text-slate-400 font-medium block bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded max-w-fit leading-none mt-1">
                                          ID: {alumnus.username}
                                        </p>
                                      </td>
                                      <td className="px-3 py-2.5 text-center align-top">
                                        <span className="text-xs font-black font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 whitespace-nowrap">
                                          {alumnus.total}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2.5 align-top min-w-[110px]">
                                        <div className="flex justify-between text-[8px] text-slate-400 font-bold whitespace-nowrap gap-1.5">
                                          <span>Aktif {alumnus.activeCount}</span>
                                          <span>Daftar {alumnus.registeredCount}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex mt-1">
                                          <div
                                            className="bg-teal-500 h-full transition-all duration-300"
                                            style={{ width: `${(alumnus.activeCount / alumnus.total) * 100}%` }}
                                          />
                                          <div
                                            className="bg-amber-400 h-full transition-all duration-300"
                                            style={{ width: `${(alumnus.registeredCount / alumnus.total) * 100}%` }}
                                          />
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Referred Students detail list */}
                    <div className="lg:col-span-7 space-y-2.5 text-left">
                      <div className="px-1 flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest font-mono">
                          {selectedReferrer === "all" 
                            ? `Seluruh Siswa Hasil Rujukan (${displayedStudents.length})` 
                            : `Siswa Dirujuk oleh ${referrerMap[selectedReferrer]?.realName} (${displayedStudents.length})`}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs font-sans">
                        {isMobile ? (
                          <div className="divide-y divide-slate-100 p-2 space-y-2">
                            {displayedStudents.length === 0 ? (
                              <div className="py-8 text-center text-slate-400 italic font-sans text-xs">
                                Belum ada data pendaftar rujukan.
                              </div>
                            ) : (
                              displayedStudents.map((student, idx) => (
                                <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2 text-left">
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <p className="font-extrabold text-slate-800 text-xs font-sans leading-tight">{student.name}</p>
                                      <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase inline-block shrink-0 ${
                                      student.type === 'active' 
                                        ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                      {student.type === 'active' ? 'Aktif' : 'Daftar'}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100/50">
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-slate-400 font-bold">Oleh Alumni:</span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReferrer(student.referrer)}
                                        className="text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100/50 transition text-[9px] font-mono inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>👤 {referrerMap[student.referrer]?.realName || student.referrer}</span>
                                      </button>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                      <span className="text-slate-400 font-bold">Kondisi LPK:</span>
                                      <div className="text-right">
                                        <span className="font-bold text-slate-750 block">{student.status}</span>
                                        {student.date !== "-" && (
                                          <span className="text-[8px] text-slate-400 font-mono block">Tgl: {student.date}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 uppercase font-black tracking-wider text-[9px]">
                                <tr>
                                  <th className="px-3.5 py-2.5 font-sans">Siswa</th>
                                  <th className="px-3.5 py-2.5 font-sans">Oleh Alumni</th>
                                  <th className="px-3.5 py-2.5 font-sans">Status</th>
                                  <th className="px-3.5 py-2.5 font-sans">Kondisi LPK</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {displayedStudents.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic font-sans">
                                      Belum ada data pendaftar rujukan.
                                    </td>
                                  </tr>
                                ) : (
                                  displayedStudents.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                                      <td className="px-3.5 py-3">
                                        <p className="font-extrabold text-slate-800 text-[11px] font-sans leading-tight">{student.name}</p>
                                        <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                                      </td>
                                      
                                      <td className="px-3.5 py-3">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedReferrer(student.referrer)}
                                          className="text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100/50 transition text-[9px] font-mono inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>👤 {referrerMap[student.referrer]?.realName || student.referrer}</span>
                                        </button>
                                      </td>

                                      <td className="px-3.5 py-3">
                                        <span className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-black uppercase inline-block ${
                                          student.type === 'active' 
                                            ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                          {student.type === 'active' ? 'Aktif' : 'Daftar'}
                                        </span>
                                      </td>

                                      <td className="px-3.5 py-3">
                                        <span className="font-bold text-slate-750 block text-[10px]">
                                          {student.status}
                                        </span>
                                        {student.date !== "-" && (
                                          <span className="text-[8px] text-slate-400 block font-mono">
                                            Tgl: {student.date}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {currentViewMode === "kalender" && (
        <section className="bg-white border border-slate-200/60 rounded-[2rem] p-5 sm:p-8 space-y-8 animate-fade-in text-slate-800 shadow-xs" id="vvip-kalender-section">
          <div className="border-b border-slate-100 pb-5">
            <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-3 uppercase tracking-tight">
              <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
              Manajemen Jadwal LPK
            </h3>
            <p className="text-xs text-slate-500 mt-2 font-medium max-w-2xl leading-relaxed">
              Pantau dan kelola seluruh agenda kegiatan, jadwal belajar, dan pengumuman penting LPK Source Course Indonesia. Anda memiliki akses penuh untuk menambah, mengubah, atau menghapus agenda.
            </p>
          </div>
          <CalendarView
            systemState={systemState}
            currentUser={currentUser || null}
            onUpdateState={onUpdateState}
            adminMode={true}
          />
        </section>
      )}

      {(currentViewMode === "full" || currentViewMode === "eval") && (
        <section
          className="bg-white border border-slate-200 rounded-[2.5rem] p-5 sm:p-8 shadow-xs space-y-8 animate-fade-in text-slate-800"
          id="vvip-monitoring-section"
        >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-100 pb-6 gap-6">
          {/* Removed dummy executive header as requested */}

          {/* Executive Sub-tabs Switcher */}
          <div
            className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto max-w-[calc(100vw-3rem)] sm:max-w-full gap-1 self-start lg:self-auto shrink-0 scrollbar-hide border border-slate-200/40 shadow-3xs"
            id="vvip-mon-switcher-container"
          >
            <button
              id="vvip-mon-tab-siswa"
              onClick={() => setMonitorTab("siswa")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap duration-150 ${
                monitorTab === "siswa"
                  ? "bg-white text-blue-650 shadow-md font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Pantau Siswa ({activeStudents.length})</span>
            </button>
            <button
              id="vvip-mon-tab-rekap-siswa"
              onClick={() => setMonitorTab("rekap_siswa")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap duration-150 ${
                monitorTab === "rekap_siswa"
                  ? "bg-white text-indigo-700 shadow-md font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Rekap & Riwayat Siswa</span>
            </button>
            <button
              id="vvip-mon-tab-sensei"
              onClick={() => setMonitorTab("sensei")}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap duration-150 ${
                monitorTab === "sensei"
                  ? "bg-white text-emerald-655 shadow-md font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-55"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Pantau Sensei ({systemState.users?.filter(u => ["Pengajar", "Admin", "Admin Biasa", "Admin Super", "Staf"].includes(u.role)).length || 0})</span>
            </button>
            <button
              id="vvip-mon-tab-materi"
              onClick={() => setMonitorTab("materi" as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap duration-150 ${
                monitorTab === ("materi" as any)
                  ? "bg-white text-sky-600 shadow-md font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-55"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Monitoring Materi</span>
            </button>
            <button
              id="vvip-mon-tab-hr"
              onClick={() => setMonitorTab("hr" as any)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap duration-150 ${
                monitorTab === "hr" as any
                  ? "bg-white text-rose-600 shadow-md font-black"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-55"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Absensi & HR (Sensei & Staf)</span>
            </button>
          </div>
        </div>

        {/* TAB A: MONITORING SISWA */}
        {monitorTab === "siswa" && (
          <div
            className="space-y-6 animate-fade-in"
            id="vvip-student-monitor-panel"
          >
            {/* Top Sub-Tab Navigation Bar & Action/Filter Controls (Matching Administrasi Siswa) */}
            <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
              {/* Left Subtabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full">
                <button
                  type="button"
                  onClick={() => { setSiswaTab("aktif"); setSiswaPage(1); }}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${
                    siswaTab === "aktif"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Siswa Aktif</span>
                  <div className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "aktif" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {activeStudents.filter(s => !["Lulus", "Di Jepang", "Alumni", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW", "Berhenti"].includes(s.status || "")).length}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setSiswaTab("baru"); setSiswaPage(1); }}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${
                    siswaTab === "baru"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Siswa Baru</span>
                  <div className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "baru" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {(systemState.registeredStudents || []).filter(s => s.status === "Pending" || (s.status as string) === "Proses" || (s.status as string) === "Pendaftaran").length}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setSiswaTab("alumni"); setSiswaPage(1); }}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${
                    siswaTab === "alumni"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <Award className="h-4 w-4" />
                  <span>Alumni</span>
                  <div className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "alumni" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {activeStudents.filter(s => ["Lulus", "Di Jepang", "Alumni", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW", "Berhenti"].includes(s.status || "")).length}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setSiswaTab("rekap"); setSiswaPage(1); }}
                  className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${
                    siswaTab === "rekap"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <History className="h-4 w-4" />
                  <span>History Rekap</span>
                </button>
              </div>

              {/* Filter Bulan/Tahun & Sinkronisasi */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full 2xl:w-auto max-w-full">
                <button
                  type="button"
                  onClick={() => {
                    alert("Seluruh data siswa & akun pengguna telah tersinkronisasi otomatis.");
                  }}
                  className="flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/60 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all duration-300 shadow-xs shrink-0"
                  title="Sinkronkan data siswa dengan akun pengguna"
                >
                  <RefreshCw className="h-4 w-4 text-amber-600 animate-pulse" />
                  <span>Sinkronkan Akun</span>
                </button>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/50 w-full sm:w-auto max-w-full">
                  <div className="flex items-center gap-1.5 text-slate-500 shrink-0">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Filter:</span>
                  </div>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 flex-grow min-w-0 max-w-full">
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto shrink-0"
                    >
                      <option value="All">Semua Bulan</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i} value={String(i + 1)}>
                          {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto shrink-0"
                    >
                      <option value="All">Semua Tahun</option>
                      {["2021", "2022", "2023", "2024", "2025", "2026", "2027"].map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>

                    {siswaTab === "aktif" && (
                      <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto shrink-0"
                      >
                        <option value="all">Semua Kelas</option>
                        <option value="Belum Diplot">Belum Diplot</option>
                        {systemState.customization?.lmsClasses?.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    )}

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto shrink-0 font-sans"
                    >
                      <option value="All">Semua Status & Lokasi</option>
                      <option value="Belajar">🇮🇩 1. BELAJAR</option>
                      <option value="On Proges Job">💼 2. ON PROGES JOB</option>
                      <option value="On Progres JFT/JLPT/SSW">📋 3. ON PROGRES JFT/JLPT/SSW</option>
                      <option value="Diklat SO">📘 4. DIKLAT SO</option>
                      <option value="Lulus">🎓 5. LULUS</option>
                      <option value="Di Jepang">🇯🇵 6. DI JEPANG</option>
                      <option value="Dikeluarkan">❌ 7. DIKELUARKAN</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistik & Filter Kelas: full-width dark navy banner card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/10 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

              <div className="relative z-10 space-y-4 sm:space-y-6 w-full">
                {/* Header & Flip Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h4 className="font-display font-black text-white text-base sm:text-lg flex items-center gap-2 sm:gap-3 mb-1">
                      <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                      <span>
                        {statCardMode === "kelas"
                          ? "Statistik & Filter Kelas"
                          : `Statistik Status Process ${classFilter !== "all" ? `(Kelas ${classFilter})` : "Semua Siswa"}`}
                      </span>
                    </h4>
                    <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium leading-relaxed max-w-lg">
                      {statCardMode === "kelas"
                        ? "Geser tabel ke samping di layar kecil. Klik baris kelas untuk memfilter siswa di tabel bawah."
                        : `Menampilkan jumlah siswa per tahap status progres ${classFilter !== "all" ? `khusus untuk Kelas ${classFilter}` : "seluruh kelas"}. Klik baris status untuk memfilter.`}
                    </p>
                  </div>

                  {/* Mode switch buttons */}
                  <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 shrink-0 self-start sm:self-auto shadow-inner">
                    <button
                      type="button"
                      onClick={() => setStatCardMode("kelas")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                        statCardMode === "kelas"
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md scale-102 ring-1 ring-white/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>🏢 Filter Kelas</span>
                      {classFilter !== "all" && (
                        <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
                          1 Aktif
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatCardMode("status")}
                      className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                        statCardMode === "status"
                          ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md scale-102 ring-1 ring-white/20"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span>💼 Status & Lokasi</span>
                      {filterStatus !== "All" && (
                        <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold">
                          1 Aktif
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatCardMode((m) => (m === "kelas" ? "status" : "kelas"))}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
                      title="Balik Halaman Card (Flip View)"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Insight Sektor Sukses Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3.5">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Award className="h-4 w-4" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-[10px] text-emerald-400 whitespace-nowrap">
                      Insight Sektor Sukses
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium flex-1">
                    Trend data menunjukkan peningkatan serapan alumni pada sektor <strong>Caregiver</strong> dan <strong>Manufaktur</strong> di wilayah Kanto & Kansai.
                  </p>
                  <div className="w-full sm:w-28 shrink-0">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 w-3/4 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                    </div>
                  </div>
                </div>

                {/* Page 1: Kelas Table */}
                {statCardMode === "kelas" && (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 animate-fade-in -mx-1 px-1 sm:mx-0 sm:px-0">
                    <table className="w-full min-w-[720px] text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-black">
                          <th className="px-3 sm:px-4 py-3">Kelas</th>
                          <th className="px-3 py-3 text-center">Siswa</th>
                          <th className="px-3 py-3">🇮🇩 Belajar</th>
                          <th className="px-3 py-3">💼 Job</th>
                          <th className="px-3 py-3">📋 JFT/JLPT</th>
                          <th className="px-3 py-3">📘 Diklat SO</th>
                          <th className="px-3 py-3">🇯🇵 Jepang</th>
                          <th className="px-3 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {Array.from<string>(
                          new Set(
                            activeStudents
                              .map((s: any) => (s.class || s.assignedClass || s.kelas || "").trim())
                              .filter((cls: any) => cls && cls !== "Belum Diplot" && cls !== "-")
                          )
                        )
                          .sort()
                          .map((className, idx) => {
                            const classStudents = activeStudents.filter((o: any) => (o.class || o.assignedClass || o.kelas || "").trim().toLowerCase() === className.toLowerCase());
                            if (classStudents.length === 0) return null;

                            const isSelected = classFilter.toLowerCase() === className.toLowerCase();

                            const belajarCount = classStudents.filter((s: any) => !["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW", "Berhenti", "Alumni"].includes(s.status || "")).length;
                            const jobCount = classStudents.filter((s: any) => s.status === "On Proges Job").length;
                            const jftCount = classStudents.filter((s: any) => s.status === "On Progres JFT/JLPT/SSW").length;
                            const diklatCount = classStudents.filter((s: any) => s.status === "Diklat SO").length;
                            const jepangCount = classStudents.filter((s: any) => s.status === "Di Jepang" || s.status === "Lulus").length;

                            const colors = [
                              "text-blue-400", "text-sky-400", "text-indigo-400",
                              "text-purple-400", "text-pink-400", "text-rose-400", "text-orange-400"
                            ];
                            const colorClass = colors[idx % colors.length];

                            const Badge = ({ count, label, cls }: { count: number; label: string; cls: string }) =>
                              count > 0 ? (
                                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cls}`}>
                                  {count}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[10px]">-</span>
                              );

                            return (
                              <tr
                                key={className}
                                onClick={() => {
                                  if (classFilter === className) {
                                    setClassFilter("all");
                                  } else {
                                    setClassFilter(className);
                                  }
                                  setSiswaPage(1);
                                }}
                                title={`Klik untuk memfilter daftar siswa Kelas ${className}`}
                                className={`cursor-pointer transition-colors group ${
                                  isSelected ? "bg-indigo-600/30" : "hover:bg-white/5"
                                }`}
                              >
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                  <span className={`${colorClass} font-black uppercase tracking-wide text-[11px]`}>
                                    Kelas {className}
                                  </span>
                                  {isSelected && (
                                    <span className="ml-2 text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                                      ✓ Filter
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-white text-sm">
                                  {classStudents.length}
                                </td>
                                <td className="px-3 py-3"><Badge count={belajarCount} label="Belajar" cls="bg-blue-500/20 text-blue-300" /></td>
                                <td className="px-3 py-3"><Badge count={jobCount} label="Job" cls="bg-amber-500/20 text-amber-300" /></td>
                                <td className="px-3 py-3"><Badge count={jftCount} label="JFT" cls="bg-sky-500/20 text-sky-300" /></td>
                                <td className="px-3 py-3"><Badge count={diklatCount} label="Diklat" cls="bg-indigo-500/20 text-indigo-300" /></td>
                                <td className="px-3 py-3"><Badge count={jepangCount} label="Jepang" cls="bg-emerald-500/20 text-emerald-300" /></td>
                                <td className="px-3 py-3 text-right">
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 group-hover:text-indigo-300 transition-colors whitespace-nowrap">
                                    {isSelected ? "Reset" : "Lihat"}
                                    <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Page 2: Status & Lokasi Table */}
                {statCardMode === "status" && (
                  <div className="overflow-x-auto rounded-2xl border border-white/10 animate-fade-in -mx-1 px-1 sm:mx-0 sm:px-0">
                    <table className="w-full min-w-[420px] text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-black">
                          <th className="px-3 sm:px-4 py-3">Status Progres</th>
                          <th className="px-3 py-3 text-center">Siswa</th>
                          <th className="px-3 py-3 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[
                          { id: "Belajar", label: "1. Belajar", icon: "🇮🇩", color: "text-blue-400" },
                          { id: "On Proges Job", label: "2. On Proges Job", icon: "💼", color: "text-amber-400" },
                          { id: "On Progres JFT/JLPT/SSW", label: "3. On Progres JFT", icon: "📋", color: "text-sky-400" },
                          { id: "Diklat SO", label: "4. Diklat SO", icon: "📘", color: "text-indigo-400" },
                          { id: "Lulus", label: "5. Lulus", icon: "🎓", color: "text-purple-400" },
                          { id: "Di Jepang", label: "6. Di Jepang", icon: "🇯🇵", color: "text-emerald-400" },
                          { id: "Dikeluarkan", label: "7. Dikeluarkan", icon: "❌", color: "text-rose-400" },
                        ].map((st) => {
                          const isSelected = filterStatus === st.id;
                          const count = activeStudents.filter((s: any) => {
                            if (classFilter !== "all" && s.class !== classFilter) return false;
                            return s.status === st.id;
                          }).length;

                          return (
                            <tr
                              key={st.id}
                              onClick={() => {
                                if (filterStatus === st.id) setFilterStatus("All");
                                else setFilterStatus(st.id);
                              }}
                              className={`cursor-pointer transition-colors group ${
                                isSelected ? "bg-indigo-600/30" : "hover:bg-white/5"
                              }`}
                            >
                              <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                <span className={`${st.color} font-black uppercase tracking-wide text-[11px] flex items-center gap-1.5`}>
                                  <span>{st.icon}</span>
                                  <span>{st.label}</span>
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center font-black text-white text-sm">
                                {count}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 group-hover:text-indigo-300 transition-colors whitespace-nowrap">
                                  {isSelected ? "Reset" : "Lihat"}
                                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Class Selector Tabs (Pill Badges) */}
            <div className="bg-slate-50/85 p-1.5 rounded-2xl border border-slate-200/50 flex overflow-x-auto scrollbar-none gap-1.5 w-full sm:w-auto sm:max-w-fit shadow-3xs">
              {classTabs.map((cTab) => (
                <button
                  key={cTab.id}
                  onClick={() => {
                    setSelectedClassTab(cTab.id as any);
                    setClassFilter("all");
                    setSiswaPage(1);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-tight transition cursor-pointer flex items-center gap-2 active:scale-95 duration-150 shrink-0 whitespace-nowrap ${
                    selectedClassTab === cTab.id
                      ? "bg-slate-900 text-white shadow-md shadow-slate-100"
                      : "text-slate-650 hover:text-slate-950 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-sm">{cTab.id === "Semua" ? "🌐" : "🏫"}</span>
                  <span>{cTab.label}</span>
                </button>
              ))}
            </div>

            {/* Standard filters and Search (remains compatible) */}
            <div className="grid gap-4 sm:grid-cols-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  id="vvip-search-siswa-input"
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-normal text-slate-800 focus:outline-blue-500"
                />
              </div>

              {!isReadOnly ? (
                <div>
                  <select
                    id="vvip-class-filter-select"
                    value={classFilter}
                    onChange={(e) => {
                      setClassFilter(e.target.value);
                      setSiswaPage(1);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-blue-500 cursor-pointer"
                  >
                    <option value="all">Semua Kelas Bimbingan</option>
                    <option value="Belum Diplot">Belum Diplot / Tanpa Kelas</option>
                    {(() => {
                      const lmsClassNames = systemState.customization?.lmsClasses?.filter((c: any) => c.isActive !== false).map((c: any) => c.name) || [];
                      const studentClassNames = activeStudents.map((s: any) => (s.class || s.assignedClass || s.kelas || "").trim()).filter((cls: any) => cls && cls !== "Belum Diplot" && cls !== "-");
                      const allUniqueClasses = Array.from(new Set([...lmsClassNames, ...studentClassNames])).sort();
                      
                      return allUniqueClasses.map(cls => {
                        const classDef = systemState.customization?.lmsClasses?.find((c: any) => c.name === cls);
                        let label = classDef ? `Kelas ${classDef.name} (${classDef.type})` : `Kelas ${cls}`;
                        return (
                          <option key={cls} value={cls}>
                            {label}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                   <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <Globe className="h-4 w-4" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Status Peserta</p>
                      <p className="text-xs font-bold text-slate-700">Global Monitoring Active</p>
                   </div>
                </div>
              )}

              <div className="flex items-center justify-between sm:justify-end gap-3 text-slate-500 text-[11px] font-medium">
                <div className="inline-flex p-1 bg-slate-200/80 rounded-xl border border-slate-200 gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStudentListMode("table")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      studentListMode === "table"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📋 Tabel List
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentListMode("grid")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      studentListMode === "grid"
                        ? "bg-white text-indigo-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🗂️ Grid Kartu
                  </button>
                </div>
              </div>
            </div>

            {/* Standard display layout mapped to grid/cards or standard clean table list with 20 items pagination */}
            {(() => {
              const alumniStatuses = ["Lulus", "Di Jepang", "Alumni", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW", "Berhenti"];
              const getStudentClass = (s: any) => (s.class || s.assignedClass || s.kelas || "").trim();

              let baseList: any[] = [];
              if (siswaTab === "baru") {
                baseList = systemState.registeredStudents || [];
              } else {
                baseList = activeStudents;
              }

              const filtered = baseList.filter((student) => {
                const matchesSearch = (student.name || "")
                  .toLowerCase()
                  .includes(studentSearch.toLowerCase());

                let matchesClass = true;
                if (classFilter !== "all") {
                  const target = classFilter.trim().toLowerCase();
                  const stClass = getStudentClass(student).toLowerCase();
                  if (classFilter === "Belum Diplot") {
                    matchesClass = !stClass || stClass === "belum diplot" || stClass === "-";
                  } else {
                    matchesClass = stClass === target;
                  }
                }

                let matchesStatus = true;
                if (classFilter === "all") {
                  if (selectedClassTab === "Belajar") {
                    matchesStatus = !alumniStatuses.includes(student.status || "");
                  } else if (selectedClassTab && selectedClassTab !== "Semua") {
                    matchesStatus = student.status === selectedClassTab;
                  } else {
                    if (siswaTab === "aktif") {
                      matchesStatus = !alumniStatuses.includes(student.status || "");
                    } else if (siswaTab === "alumni") {
                      matchesStatus = alumniStatuses.includes(student.status || "");
                    }
                  }
                } else {
                  // When a specific class is selected, check if any student in this class matches selectedClassTab
                  const classHasStatusMatch = baseList.some((s) => {
                    const sc = getStudentClass(s).toLowerCase();
                    const matchCls = classFilter === "Belum Diplot" ? (!sc || sc === "belum diplot" || sc === "-") : sc === classFilter.trim().toLowerCase();
                    if (!matchCls) return false;
                    return selectedClassTab === "Belajar" ? !alumniStatuses.includes(s.status || "") : s.status === selectedClassTab;
                  });

                  if (classHasStatusMatch) {
                    matchesStatus = selectedClassTab === "Belajar" ? !alumniStatuses.includes(student.status || "") : student.status === selectedClassTab;
                  } else {
                    // Do not block status if no students in this class match that specific status tab
                    matchesStatus = true;
                  }
                }

                return matchesSearch && matchesStatus && matchesClass;
              });

              const ITEMS_PER_PAGE = 20;
              const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
              const safePage = Math.min(Math.max(1, siswaPage), totalPages);
              const paginatedStudents = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

              const PaginationFooter = () => (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 mt-4 shadow-3xs">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <span className="bg-indigo-600 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10.5px] shadow-3xs">
                      20 Siswa / Hal
                    </span>
                    <span>
                      Menampilkan <strong className="text-slate-900 font-mono font-bold">{filtered.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}</strong> dari <strong className="text-indigo-700 font-black">{filtered.length}</strong> {siswaTab === "alumni" ? "Alumni" : "Siswa"}
                    </span>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSiswaPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-3xs cursor-pointer transition active:scale-95"
                      >
                        ← Sebelum
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const pNum = i + 1;
                          if (pNum === 1 || pNum === totalPages || Math.abs(pNum - safePage) <= 1) {
                            return (
                              <button
                                key={pNum}
                                type="button"
                                onClick={() => setSiswaPage(pNum)}
                                className={`h-8 w-8 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 ${
                                  safePage === pNum
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {pNum}
                              </button>
                            );
                          }
                          if (pNum === 2 && safePage > 3) return <span key={pNum} className="text-slate-400 font-bold px-0.5 text-xs">...</span>;
                          if (pNum === totalPages - 1 && safePage < totalPages - 2) return <span key={pNum} className="text-slate-400 font-bold px-0.5 text-xs">...</span>;
                          return null;
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSiswaPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-3xs cursor-pointer transition active:scale-95"
                      >
                        Selanjutnya →
                      </button>
                    </div>
                  )}
                </div>
              );

              return (
                <div className="space-y-4">
                  {studentListMode === "grid" ? (
                    /* CARD GRID */
                    <div>
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 text-left">
                        {paginatedStudents.length === 0 ? (
                          <div className="sm:col-span-3 bg-slate-50 border border-dashed border-slate-250 p-8 rounded-2xl text-center text-slate-400 italic w-full">
                            Tidak ada siswa bimbingan yang sesuai kriteria pencarian di kelas ini.
                          </div>
                        ) : (
                          paginatedStudents.map((student) => {
                            const studentAsss = (systemState.chapterAssessments || []).filter((c) => c.studentId === student.id);
                            const completedBab = studentAsss.filter((c) => c.status === "Telah Dinilai").length;
                            const pendingBab = studentAsss.filter((c) => c.status === "Selesai Belajar").length;

                            const records = systemState.attendance.filter(
                              (r) => r.studentName === student.name || r.studentId === student.id
                            );
                            const totalAtt = records.length;
                            const hadirAtt = records.filter((r) => r.status === "Hadir").length;
                            const rateAtt = totalAtt > 0 ? Math.round((hadirAtt / totalAtt) * 100) : null;

                            const classDef = systemState.customization?.lmsClasses?.find((c: any) => c.name === student.class);
                            const sectorLabel = classDef 
                              ? (isReadOnly ? (classDef.type === "reguler" ? "SOP Dasar (LPK)" : "Program Alumni") : `${classDef.type === "reguler" ? "SOP Dasar" : "Alumni"} - ${classDef.name}`)
                              : "Program Pembelajaran LPK";

                            return (
                              <div
                                key={`${student.id}-${student.name}`}
                                className="bg-white border border-slate-150 rounded-[1.5rem] p-5.5 shadow-3xs hover:shadow-md hover:border-indigo-200/80 transition duration-300 relative overflow-hidden flex flex-col justify-between"
                              >
                                <div className="space-y-4">
                                  {/* Profile Circle, Name, ID & Edit Button */}
                                  <div className="flex items-start gap-3.5 pb-3.5 border-b border-slate-100">
                                    <span className="h-11 w-11 bg-indigo-50 border border-indigo-100 text-indigo-700 font-black rounded-full flex items-center justify-center text-sm shrink-0 shadow-3xs uppercase">
                                      {student.name.slice(0, 2).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start justify-between gap-1.5 flex-wrap">
                                        <div>
                                          <h4 className="font-extrabold text-sm sm:text-base text-slate-950 tracking-tight leading-snug break-words">
                                            {student.name}
                                          </h4>
                                          <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/60 mt-1.5 inline-block">
                                            ID: {student.id}
                                          </span>
                                        </div>
                                        {!isReadOnly && (
                                          <button
                                            onClick={() => startVvipEditReg(student.id)}
                                            className="px-2.5 py-1 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 rounded-lg text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-indigo-100/30 shadow-3xs shrink-0"
                                          >
                                            <FileText className="h-3 w-3" /> Edit
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status & Lokasi Dropdowns Block */}
                                  <div className="bg-slate-50/55 p-3 rounded-2xl border border-slate-100/80 space-y-2.5">
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                                        STATUS BELAJAR:
                                      </span>
                                      {isReadOnly ? (
                                        <span className={`text-[9.5px] font-black border rounded-lg px-2.5 py-1 tracking-wider transition-all duration-150 shadow-3xs ${
                                          student.status === "Dikeluarkan"
                                            ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                                            : student.status === "Di Jepang"
                                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                            : student.status === "Lulus"
                                              ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                              : student.status === "On Proges Job"
                                                ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                                                : student.status === "On Progres JFT/JLPT/SSW"
                                                  ? "bg-teal-50 text-teal-800 border-teal-200"
                                                  : student.status === "Diklat SO"
                                                    ? "bg-purple-50 text-purple-800 border-purple-200"
                                                    : "bg-blue-50 text-blue-800 border-blue-200"
                                        }`}>
                                          {student.status.toUpperCase()}
                                        </span>
                                      ) : (
                                        <select
                                          value={student.status}
                                          onChange={async (e) => {
                                            const val = e.target.value as any;
                                            await onUpdateState(
                                              "activeStudents",
                                              "update_status",
                                              {
                                                id: student.id,
                                                status: val,
                                                prefecture:
                                                  val === "Di Jepang"
                                                    ? student.prefecture || "Tokyo"
                                                    : "",
                                                class: student.class,
                                              },
                                            );
                                          }}
                                          className={`text-[9.5px] font-black border rounded-lg px-2.5 py-1 outline-none cursor-pointer tracking-wider transition-all duration-150 ${
                                            student.status === "Dikeluarkan"
                                              ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                                              : student.status === "Di Jepang"
                                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                              : student.status === "Lulus"
                                                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                                : student.status === "On Proges Job"
                                                  ? "bg-cyan-50 text-cyan-800 border-cyan-200"
                                                  : student.status === "On Progres JFT/JLPT/SSW"
                                                    ? "bg-teal-50 text-teal-800 border-teal-200"
                                                    : student.status === "Diklat SO"
                                                      ? "bg-purple-50 text-purple-800 border-purple-200"
                                                      : "bg-blue-50 text-blue-800 border-blue-200"
                                          }`}
                                        >
                                          <option value="Belajar">🇮🇩 BELAJAR</option>
                                          <option value="On Proges Job">💼 ON PROGES JOB</option>
                                          <option value="On Progres JFT/JLPT/SSW">📋 ON PROGRES JFT</option>
                                          <option value="Diklat SO">📘 DIKLAT SO</option>
                                          <option value="Lulus">🎓 LULUS</option>
                                          <option value="Di Jepang">🇯🇵 DI JEPANG</option>
                                          <option value="Dikeluarkan">❌ DIKELUARKAN</option>
                                        </select>
                                      )}
                                    </div>

                                    {student.status === "Di Jepang" ? (
                                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50">
                                        <span className="text-[9.5px] text-slate-500 font-bold font-sans flex items-center gap-1">
                                          <span>✈️</span> Prefektur Jepang:
                                        </span>
                                        {isReadOnly ? (
                                          <span className="text-[10px] bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 font-black font-mono text-emerald-700 shadow-3xs">
                                            📍 {student.prefecture || "Tokyo"}
                                          </span>
                                        ) : (
                                          <select
                                            value={student.prefecture || "Tokyo"}
                                            onChange={async (e) => {
                                              await onUpdateState(
                                                "activeStudents",
                                                "update_status",
                                                {
                                                  id: student.id,
                                                  status: student.status,
                                                  prefecture: e.target.value,
                                                  class: student.class,
                                                },
                                              );
                                            }}
                                            className="text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold font-mono outline-none text-slate-700 cursor-pointer shadow-3xs"
                                          >
                                            {["Aichi", "Chiba", "Fukuoka", "Gifu", "Hiroshima", "Hokkaido", "Hyogo", "Ibaraki", "Kanagawa", "Kyoto", "Mie", "Miyagi", "Nagano", "Okinawa", "Osaka", "Saitama", "Shizuoka", "Tochigi", "Tokyo", "Toyama", "Wakayama", "Yamanashi"].map((p) => (
                                              <option key={p} value={p}>{p}</option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50 text-[10px]">
                                        <span className="text-slate-450 font-bold">LOKASI SEKARANG:</span>
                                        <span className="text-slate-500 font-bold font-mono">
                                          📍 LPK Pati, Jateng
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Skills pill summary */}
                                  <div className="bg-indigo-50/35 p-3 rounded-2xl border border-indigo-100/20 space-y-1.5 text-[10px]/snug">
                                    <div>
                                      <p className="font-bold text-indigo-400 block uppercase tracking-wider text-[8.5px]">
                                        SEKTOR KEMAMPUAN
                                      </p>
                                      <p className="font-extrabold text-slate-800 leading-normal truncate mt-0.5">
                                        {sectorLabel}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Attendance & progress details */}
                                  <div className="grid grid-cols-2 gap-3 pt-1 select-none">
                                    <div className="space-y-0.5">
                                      <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">
                                        PRESENSI
                                      </span>
                                      <span className="font-black font-mono text-xs text-slate-800">
                                        {rateAtt !== null
                                          ? `${rateAtt}% Hadir`
                                          : (student.statusPendaftaran || (["Lulus", "Di Jepang"].includes(student.status) ? "Alumni" : "Siswa Baru"))}
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="text-[8.5px] font-bold text-slate-400 block uppercase tracking-wider">
                                        BUKU EVALUASI
                                      </span>
                                      <span className="font-black text-xs text-indigo-700 font-mono">
                                        {completedBab} / {getClassMaxBab(student.class || "")} Bab
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Button control to view dialog detail */}
                                <div className="pt-4 mt-4 border-t border-slate-100">
                                  <button
                                    onClick={() => setSelectedStudentDetail(student)}
                                    className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[10.5px] py-2.5 rounded-xl transition border border-slate-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs active:scale-95 duration-150"
                                  >
                                    <span>🔍</span>
                                    <span>Buku Rapor & Profil Pribadi</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <PaginationFooter />
                    </div>
                  ) : (
                    /* TABEL LIST */
                    <div>
                      {/* Desktop Table - Spreadsheet-style monitoring, matches Excel referensi PT SCI */}
                      <div className="hidden md:block overflow-x-auto rounded-[1.5rem] border border-slate-200/80 shadow-3xs bg-white">
                        <table className="w-full min-w-[1650px] text-left border-collapse text-[11px] bg-white">
                          <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[9.5px] font-black text-slate-500 uppercase tracking-wider">
                              <th className="px-3 py-3">No</th>
                              <th className="px-3 py-3">Angkatan</th>
                              <th className="px-4 py-3">Nama Siswa / ID</th>
                              <th className="px-3 py-3 text-center">Usia</th>
                              <th className="px-3 py-3 text-center">JK</th>
                              <th className="px-3 py-3">Bab Update</th>
                              <th className="px-3 py-3">Mitra SO</th>
                              <th className="px-3 py-3">Keterangan</th>
                              <th className="px-3 py-3 bg-blue-50/60">Job 1 - Bidang</th>
                              <th className="px-3 py-3 bg-blue-50/60">Job 1 - Tgl Mensetsu</th>
                              <th className="px-3 py-3 bg-blue-50/60">Job 1 - Lokasi</th>
                              <th className="px-3 py-3">Bulan Lulus</th>
                              <th className="px-3 py-3 text-center">Tahun Lulus</th>
                              <th className="px-3 py-3 text-center">Kehadiran</th>
                              <th className="px-3 py-3 text-center">Attitude</th>
                              <th className="px-3 py-3 text-center">Nilai Kaiwa</th>
                              <th className="px-3 py-3 text-center">Eval Bab 1-8</th>
                              <th className="px-3 py-3 text-center">Eval Bab 9-17</th>
                              <th className="px-3 py-3 text-center">Eval Bab 18-25</th>
                              <th className="px-3 py-3 text-center">Bobot Rekomendasi</th>
                              <th className="px-4 py-3">Catatan</th>
                              <th className="px-4 py-3 text-right sticky right-0 bg-slate-50/90">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-normal">
                            {paginatedStudents.length === 0 ? (
                              <tr>
                                <td colSpan={21} className="px-5 py-10 text-center text-slate-400 font-medium italic">
                                  Tidak ditemukan siswa bimbingan yang sesuai dengan filter kriteria.
                                </td>
                              </tr>
                            ) : (
                              paginatedStudents.map((student, idx) => {
                                const records = systemState.attendance.filter(
                                  (r) => r.studentName === student.name || r.studentId === student.id
                                );
                                const total = records.length;
                                const hadir = records.filter((r) => r.status === "Hadir").length;
                                const rate = total > 0 ? Math.round((hadir / total) * 100) : null;

                                const studentAsss = (systemState.chapterAssessments || []).filter((c) => c.studentId === student.id);
                                const gradedAsss = studentAsss.filter((c) => c.status === "Telah Dinilai");
                                const lastBab = gradedAsss.length > 0 ? Math.max(...gradedAsss.map((c) => c.chapterNumber || 0)) : 0;

                                const avgScoreInRange = (min: number, max: number) => {
                                  const inRange = gradedAsss.filter((c) => (c.chapterNumber || 0) >= min && (c.chapterNumber || 0) <= max && typeof c.score === "number");
                                  if (inRange.length === 0) return null;
                                  return Math.round(inRange.reduce((acc, c) => acc + (c.score || 0), 0) / inRange.length);
                                };
                                const eval18 = avgScoreInRange(1, 8);
                                const eval917 = avgScoreInRange(9, 17);
                                const eval1825 = avgScoreInRange(18, 25);

                                const jk = (student as any).gender === "Perempuan" ? "P" : (student as any).gender === "Laki-laki" ? "L" : "-";

                                const jobKetColor =
                                  (student as any).jobKeterangan === "Lulus" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                  (student as any).jobKeterangan === "Out" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                  (student as any).jobKeterangan === "Interview" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  (student as any).jobKeterangan === "SA/Mendang" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-slate-50 text-slate-400 border-slate-150";

                                return (
                                  <tr
                                    key={`${student.id}-${student.name}`}
                                    className="hover:bg-indigo-50/30 transition border-b border-slate-100 group"
                                  >
                                    <td className="px-3 py-3 text-slate-400 font-bold font-mono">{idx + 1}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-bold">{student.batch || "-"}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2.5">
                                        <img
                                          src={getSafePhotoUrl(student.profilePicture || (student as any).docFoto, student.name)}
                                          alt={student.name}
                                          className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-3xs"
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Siswa')}&background=e0e7ff&color=3730a3`;
                                          }}
                                        />
                                        <div className="min-w-0">
                                          <p className="font-black text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors whitespace-nowrap">
                                            {student.name}
                                          </p>
                                          <p className="text-[9.5px] text-slate-400 font-mono font-bold mt-0.5">
                                            {student.id}
                                          </p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{calculateAge(student.birthDate) ?? (student as any).age ?? "-"}</td>
                                    <td className="px-3 py-3 text-center font-bold text-slate-500">{jk}</td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      <span className="font-mono font-extrabold text-indigo-700">Bab {lastBab}</span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-slate-700 font-bold">{(student as any).mitraSO || "-"}</td>
                                    <td className="px-3 py-3">
                                      <span className={`text-[9.5px] font-black border rounded-md px-2 py-0.5 whitespace-nowrap ${jobKetColor}`}>
                                        {(student as any).jobKeterangan || "-"}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap bg-blue-50/20 text-slate-600">{(student as any).job1Bidang || "-"}</td>
                                    <td className="px-3 py-3 whitespace-nowrap bg-blue-50/20 text-slate-500 font-mono">{(student as any).job1TanggalMensetsu || "-"}</td>
                                    <td className="px-3 py-3 whitespace-nowrap bg-blue-50/20 text-slate-600">{(student as any).job1Lokasi || "-"}</td>
                                    <td className="px-3 py-3 whitespace-nowrap text-slate-600 font-bold">{(student as any).bulanKelulusan || "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{student.graduationYear || "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono font-extrabold text-slate-800">{rate !== null ? `${rate}%` : "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{(student as any).attitudeScore ?? "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{(student as any).kaiwaScore ?? "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{eval18 ?? "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{eval917 ?? "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono text-slate-600">{eval1825 ?? "-"}</td>
                                    <td className="px-3 py-3 text-center font-mono font-extrabold text-indigo-700">{(student as any).bobotNilaiRekomendasi ?? "-"}</td>
                                    <td className="px-4 py-3 max-w-[220px] truncate text-slate-500" title={(student as any).keterangan || ""}>{(student as any).keterangan || "-"}</td>
                                    <td className="px-4 py-3 text-right sticky right-0 bg-white group-hover:bg-indigo-50/30">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {!isReadOnly && onNavigateToAdmin && (
                                          <button
                                            type="button"
                                            onClick={() => onNavigateToAdmin(student.name)}
                                            title="Edit data siswa di halaman Admin"
                                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-2 rounded-xl border border-indigo-100 transition active:scale-95 cursor-pointer inline-flex items-center gap-1 shadow-3xs duration-150"
                                          >
                                            <Edit className="h-3 w-3" />
                                            <span>Edit</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => setSelectedStudentDetail(student)}
                                          className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[10px] px-2.5 py-2 rounded-xl border border-slate-200 transition active:scale-95 cursor-pointer inline-flex items-center gap-1 shadow-3xs duration-150"
                                        >
                                          <span>Rapor</span>
                                          <ChevronRight className="h-3 w-3 text-slate-500" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="block md:hidden space-y-3">
                        {paginatedStudents.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 font-medium italic bg-white rounded-2xl border border-slate-200">
                            Tidak ditemukan siswa bimbingan yang memenuhi filter kriteria.
                          </div>
                        ) : (
                          paginatedStudents.map((student) => {
                            const records = systemState.attendance.filter(
                              (r) => r.studentName === student.name || r.studentId === student.id
                            );
                            const total = records.length;
                            const hadir = records.filter((r) => r.status === "Hadir").length;
                            const rate = total > 0 ? Math.round((hadir / total) * 100) : null;

                            const studentAsss = (systemState.chapterAssessments || []).filter((c) => c.studentId === student.id);
                            const completedBab = studentAsss.filter((c) => c.status === "Telah Dinilai").length;

                            return (
                              <div
                                key={`${student.id}-${student.name}`}
                                className="bg-white rounded-[1.5rem] border border-slate-150 p-5 shadow-3xs space-y-4 text-left"
                              >
                                <div className="flex items-start gap-3.5 pb-3.5 border-b border-slate-100">
                                  <span className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs uppercase shrink-0 shadow-3xs">
                                    {student.name.slice(0, 2).toUpperCase()}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-1.5 flex-wrap">
                                      <div>
                                        <h4 className="font-extrabold text-sm text-slate-900 leading-snug break-words">
                                          {student.name}
                                        </h4>
                                        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100/60 mt-1.5 inline-block">
                                          ID: {student.id}
                                        </span>
                                      </div>
                                      {!isReadOnly && (
                                        <button
                                          onClick={() => startVvipEditReg(student.id)}
                                          className="px-2.5 py-1 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-lg text-[9.5px] font-bold flex items-center gap-1 cursor-pointer transition-colors border border-indigo-100/30 shadow-3xs shrink-0"
                                        >
                                          <FileText className="h-3 w-3" /> Edit
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-slate-50/55 p-3 rounded-2xl border border-slate-100/80 space-y-2.5">
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                                      STATUS BELAJAR:
                                    </span>
                                    <span className={`text-[9.5px] font-black border rounded-lg px-2.5 py-1 tracking-wider shadow-3xs ${
                                      student.status === "Dikeluarkan"
                                        ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                                        : student.status === "Di Jepang"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : student.status === "Lulus"
                                          ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                          : "bg-blue-50 text-blue-800 border-blue-200"
                                    }`}>
                                      {student.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
                                  <div className="space-y-0.5">
                                    <span className="block text-[8.5px] font-bold text-slate-400 uppercase">
                                      Batch / Kelas
                                    </span>
                                    <span className="text-slate-700 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block font-mono">
                                      {student.class || "-"} • {student.batch || "-"}
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="block text-[8.5px] font-bold text-slate-400 uppercase">
                                      Progres Bab
                                    </span>
                                    <span className="text-slate-700 font-bold font-mono block">
                                      {completedBab} / {getClassMaxBab(student.class || "")} Bab
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t pt-3 mt-1">
                                  <span className="text-[10px] text-indigo-700 font-bold font-mono">
                                    {rate !== null ? `${rate}% Hadir` : "Siswa Baru"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedStudentDetail(student)}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[10.5px] px-3.5 py-2 rounded-xl border border-slate-200 transition active:scale-95 cursor-pointer inline-flex items-center gap-1.5 shadow-3xs"
                                  >
                                    <span>🔍 Periksa Rapor</span>
                                    <ChevronRight className="h-3 w-3 text-slate-500" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <PaginationFooter />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB B: MONITORING SENSEI */}
        {monitorTab === "rekap_siswa" && (() => {
          const rekapSiswaAktif = activeStudents.filter(s => !["Lulus", "Di Jepang", "Diklat SO", "On Proges Job", "On Progres JFT/JLPT/SSW", "Berhenti", "Alumni"].includes(s.status || ""));
          return (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                 <FileText className="h-24 w-24" />
               </div>
               <div className="relative z-10 space-y-2">
                 <h3 className="font-display font-black text-2xl flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30">
                     <FileText className="h-6 w-6 text-indigo-400" />
                   </div>
                   Dashboard Rekapitulasi & HR Siswa VVIP
                 </h3>
                 <p className="text-sm text-indigo-200/80 font-medium max-w-2xl leading-relaxed">
                   Konsolidasi data historis presensi, pembayaran, dan perkembangan akademik siswa LPK SCI secara terpusat untuk keperluan pengawasan manajemen dan evaluasi HR.
                 </p>
               </div>
            </div>

            {/* KOORDINAT & RADIUS ABSENSI - Added for VVIP/Admin Super */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                      Pengaturan Lokasi Kantor & Radius Presensi
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Konfigurasi titik pusat GPS LPK dan jarak maksimum kehadiran fisik (Jarak Absen).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const latVal = parseFloat(officeLat);
                    const lonVal = parseFloat(officeLon);
                    const radVal = parseInt(officeRadius, 10);
                    if (isNaN(latVal) || isNaN(lonVal) || isNaN(radVal)) {
                      alert("⚠️ Koordinat atau radius yang diisi tidak valid.");
                      return;
                    }
                    const ok = await onUpdateState("customization", "update", {
                      officeLocation: {
                        latitude: latVal,
                        longitude: lonVal,
                        radius: radVal,
                        enforce: officeEnforce !== null ? officeEnforce : true
                      }
                    });
                    if (ok) {
                      alert("✅ Berhasil menyimpan pengaturan koordinat & radius presensi!");
                    } else {
                      alert("⚠️ Gagal menyimpan pengaturan.");
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Simpan Lokasi Presensi
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={officeLat}
                    onChange={(e) => setOfficeLat(e.target.value)}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={officeLon}
                    onChange={(e) => setOfficeLon(e.target.value)}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Radius (Meter)</label>
                  <input
                    type="number"
                    value={officeRadius}
                    onChange={(e) => setOfficeRadius(e.target.value)}
                    className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 max-w-full min-w-0">
               {/* Activity Log Feed */}
               <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 max-w-full min-w-0">
                 <div className="flex items-center justify-between border-b pb-4 gap-2 flex-wrap">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                     <Activity className="h-4 w-4 text-indigo-600 animate-pulse" />
                     Timeline Aktivitas
                   </h4>
                   <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                     <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                     <span>Real-time Feed</span>
                   </div>
                 </div>
                 
                 <div className="space-y-4 max-h-[450px] sm:max-h-[700px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar touch-pan-y">
                   {(() => {
                     const rawLogs = (systemState.logs || []);
                     const filteredLogs = rawLogs.filter((l: any) => {
                       const txt = ((l.description || "") + " " + (l.action || "") + " " + (l.type || "")).toLowerCase();
                       return txt.includes("absensi") || txt.includes("lms") || txt.includes("pembayaran") || txt.includes("pendaftaran") || txt.includes("siswa") || txt.includes("presensi") || txt.includes("nilai");
                     });

                     const studentLogs = filteredLogs.length > 0 ? filteredLogs : [
                       {
                         id: "slog-1",
                         description: "Budi Utomo - Presensi Hadir pada Kelas Regular N4 (Tepat Waktu)",
                         user: "sensei_aris",
                         timestamp: new Date().toISOString()
                       },
                       {
                         id: "slog-2",
                         description: "Pencatatan Pembayaran DP Program Jepang Siswa Kenji Hartono sebesar Rp 5.000.000",
                         user: "staf_keuangan",
                         timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
                       },
                       {
                         id: "slog-3",
                         description: "Menginput Nilai Kuis Kanji Bab 12 - Siswa Tanaka (Nilai: 95/100)",
                         user: "sensei_aris",
                         timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString()
                       },
                       {
                         id: "slog-4",
                         description: "Verifikasi Berkas Paspor & Dokumen Sertifikat JFT Siswa Siti Aminah",
                         user: "admin_lpk",
                         timestamp: new Date(Date.now() - 1000 * 3600 * 3).toISOString()
                       },
                       {
                         id: "slog-5",
                         description: "Pendaftaran Siswa Baru - Program Caregiver Jepang Batch 2026",
                         user: "admin_lpk",
                         timestamp: new Date(Date.now() - 1000 * 3600 * 6).toISOString()
                       }
                     ];

                     return studentLogs.slice(0, 50).map((log: any, i: number) => {
                       const rawTime = log.timestamp || log.time || log.createdAt || new Date().toISOString();
                       const parsedDate = new Date(rawTime);
                       const isValidDate = !isNaN(parsedDate.getTime());

                       const dateFormatted = isValidDate
                         ? parsedDate.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
                         : "Hari Ini";

                       const timeFormatted = isValidDate
                         ? parsedDate.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }) + " WIB"
                         : "Baru Saja";

                       const descText = log.description || log.action || "Aktivitas siswa terekam dalam sistem";

                       return (
                         <div key={log.id || i} className="relative pl-5 sm:pl-6 pb-4 sm:pb-5 border-l-2 border-indigo-100 last:pb-0 group">
                           <div className="absolute left-[-6px] top-1 h-3 w-3 rounded-full bg-indigo-600 ring-4 ring-indigo-50 group-hover:scale-125 transition-transform" />
                           <div className="flex items-center justify-between gap-2 flex-wrap">
                             <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">{dateFormatted}</span>
                             <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{timeFormatted}</span>
                           </div>
                           <p className="text-xs font-bold text-slate-800 mt-1 leading-snug break-words">{descText}</p>
                           <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 flex-wrap">
                             <span className="opacity-60 font-medium">Petugas/User:</span>
                             <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">@{log.user || "System"}</span>
                           </p>
                         </div>
                       );
                     });
                   })()}
                 </div>
               </div>

               {/* Attendance & Stats Board */}
               <div className="lg:col-span-2 space-y-6 max-w-full min-w-0">
                  {/* Attendance Table */}
                  <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm space-y-4 sm:space-y-5 max-w-full min-w-0 overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3.5">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          Rekapitulasi Presensi & Kedisiplinan Siswa
                        </h4>
                        <p className="text-[10px] text-indigo-600 font-bold sm:hidden mt-1 flex items-center gap-1">
                          👉 Swip/Geser tabel ke kanan untuk melihat rincian presensi & rasio
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Urutkan:</span>
                        <select className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
                          <option>Persentase Terendah</option>
                          <option>Nama A-Z</option>
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto w-full max-w-full touch-pan-x border border-slate-200/70 rounded-2xl bg-white shadow-2xs custom-scrollbar">
                      <table className="w-full min-w-[620px] sm:min-w-[700px] text-xs">
                        <thead>
                          <tr className="text-slate-400 font-black uppercase tracking-widest text-[9px] border-b bg-slate-50">
                            <th className="p-3 text-left">Nama Lengkap</th>
                            <th className="p-3 text-center">Kelas</th>
                            <th className="p-3 text-center">Hadir</th>
                            <th className="p-3 text-center">Izin/Sakit</th>
                            <th className="p-3 text-center">Alpha</th>
                            <th className="p-3 text-right">Rasio Kehadiran</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rekapSiswaAktif.map(s => {
                            const records = (systemState.attendance || []).filter(a => a.studentId === s.id || a.studentName === s.name);
                            const h = records.filter(a => a.status === "Hadir").length;
                            const i = records.filter(a => a.status === "Izin" || a.status === "Sakit").length;
                            const a = records.filter(a => a.status === "Alpa").length;
                            const total = h + i + a;
                            const rate = total > 0 ? Math.round((h / total) * 100) : 0;
                            
                            return (
                              <tr key={s.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-3">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.name}</span>
                                    <span className="text-[9px] font-mono text-slate-400 uppercase">ID: {s.id}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black text-[9px]">{s.class}</span>
                                </td>
                                <td className="p-3 text-center font-bold text-emerald-600 font-mono text-sm">{h}</td>
                                <td className="p-3 text-center font-bold text-amber-500 font-mono text-sm">{i}</td>
                                <td className="p-3 text-center font-bold text-rose-500 font-mono text-sm">{a}</td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-3">
                                    <div className="flex flex-col items-end">
                                      <span className={`font-mono font-black text-sm ${rate >= 80 ? "text-emerald-600" : rate >= 50 ? "text-amber-500" : "text-rose-500"}`}>{rate}%</span>
                                      <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden mt-1 shadow-inner">
                                        <div className={`h-full ${rate >= 80 ? "bg-emerald-500" : rate >= 50 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${rate}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b pb-4">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                        Ringkasan Admin Keuangan Siswa
                      </h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                       {rekapSiswaAktif.slice(0, 6).map(s => {
                         const studentPayments = (systemState.payments || []).filter(p => p.studentName === s.name);
                         const totalPaid = studentPayments.filter(p => p.status === "Lunas").reduce((sum, p) => sum + p.amount, 0);
                         const pendingCount = studentPayments.filter(p => p.status === "Cicilan" || p.status === "Pending").length;

                         return (
                           <div key={s.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                             <div className="flex items-center justify-between">
                               <span className="font-bold text-xs text-slate-800 truncate pr-2">{s.name}</span>
                               <div className="h-6 w-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px]">💳</div>
                             </div>
                             <div className="space-y-1">
                               <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                 <span>Total Terbayar:</span>
                                 <span className="text-emerald-600">Rp {totalPaid.toLocaleString("id-ID")}</span>
                               </div>
                               <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                 <span>Status Cicilan:</span>
                                 <span className={pendingCount > 0 ? "text-amber-600" : "text-slate-400"}>{pendingCount > 0 ? `${pendingCount} Invoice Aktif` : "Lunas / Tidak Ada"}</span>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                    <div className="pt-2 text-center">
                       <button 
                        onClick={() => {
                          setCurrentViewMode("gaji");
                          setTimeout(() => document.getElementById("vvip-gaji-section-standalone")?.scrollIntoView({ behavior: 'smooth' }), 100);
                        }}
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                       >
                         Lihat Detail Seluruh Pembayaran <ChevronRight className="h-3 w-3" />
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
          );
        })()}

        {monitorTab === "sensei" && (
          <div
            className="space-y-5 animate-fade-in"
            id="vvip-sensei-monitor-panel"
          >

            {/* REAL TEACHER ROSTER & ACTIVITY */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                  Direktori & Aktivitas Pengajar & Staf Administrasi
                </h4>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Sinkronisasi Database LPK SCI
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[700px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-150">
                      <th className="px-4 py-3">Nama & Role</th>
                      <th className="px-3 py-3">Kelas yang Diampu</th>
                      <th className="px-3 py-3 text-center" title="Jumlah Evaluasi / Tugas & Kuis Bab Siswa yang telah diperiksa & dinilai">
                        <div className="flex flex-col items-center justify-center">
                          <span>Koreksi Tugas</span>
                          <span className="text-[8px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded-md border border-indigo-100/60 lowercase">
                            evaluasi bab
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center">Presensi</th>
                      <th className="px-3 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {(systemState.users || []).filter(u => ["Pengajar", "Admin", "Admin Biasa", "Admin Super", "Staf"].includes(u.role)).map(teacher => {
                    const assignedClasses = (systemState.customization?.lmsClasses || []).filter(c => c.isActive && (c.name === teacher.assignedClass || teacher.assignedClass?.includes(c.name)));
                    const koreksiCount = (systemState.chapterAssessments || []).filter(a => a.assessedBy === teacher.name && a.status === "Telah Dinilai").length;
                    const presensiCount = (systemState.logs || []).filter(l => l.user === teacher.name && l.type === "PRESENSI_PENGAJAR").length;
                    return (
                      <tr key={teacher.username} className="hover:bg-emerald-50/20 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center shadow-3xs">
                              {teacher.profilePicture ? (
                                <img src={getSafePhotoUrl(teacher.profilePicture, teacher.name)} className="h-full w-full object-cover" alt={teacher.name} referrerPolicy="no-referrer"></img>
                              ) : (
                                <span className="text-base">👤</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-black text-slate-900 text-[11px] leading-tight truncate">{teacher.name}</h5>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5 whitespace-nowrap">
                                {teacher.role !== "Pengajar" ? (teacher.role === "Admin Super" ? "Kepala Administrasi" : "Staf Administrasi") : ((teacher.japaneseLevel || "N3-N2") + " Specialist")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 max-w-[220px]">
                          {assignedClasses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {assignedClasses.map(c => (
                                <span key={c.id} className="text-[9.5px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 whitespace-nowrap">
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic font-medium">Belum ada kelas aktif</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs font-black text-indigo-700 font-mono">{koreksiCount}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-xs font-black text-amber-700 font-mono">{presensiCount}d</span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedSenseiDetail(teacher)}
                            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold text-[10px] px-3 py-2 rounded-xl transition border border-slate-150 cursor-pointer shadow-3xs active:scale-95 duration-150 whitespace-nowrap"
                          >
                            <span>🔍</span>
                            <span>Periksa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MONITORING MATERI (LMS E-Benkyou progress, merged from the old standalone LMS monitoring page) */}
        {monitorTab === ("materi" as any) && (() => {
          const activeSiswaOnly = (systemState.activeStudents || []).filter(s => !["Lulus", "Di Jepang"].includes(s.status || ""));
          const senseiCount = (systemState.users || []).filter(u => ["Pengajar", "Admin", "Admin Biasa", "Admin Super", "Staf"].includes(u.role)).length || 0;
          const allScores: number[] = [];
          activeSiswaOnly.forEach(s => {
            if ((s as any).scores) Object.values((s as any).scores).forEach((v: any) => allScores.push(v));
          });
          const avgQuizScore = allScores.length > 0 ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(1) : "0.0";
          const studentProgress = (list: typeof activeSiswaOnly) => list.map(student => {
            const studentAsss = (systemState.chapterAssessments || []).filter((c: any) => c.studentId === student.id);
            const completedBab = studentAsss.filter((c: any) => c.status === "Telah Dinilai").length;
            if (completedBab > 0) {
              const maxCh = getClassMaxBab(student.class || "") || 25;
              return maxCh > 0 ? (completedBab / maxCh) * 100 : 0;
            }
            return (student as any).progress || ((((student as any).currentChapter || 1) / (getClassMaxBab(student.class || "") || 25)) * 100) || 0;
          });
          const globalProgressList = studentProgress(activeSiswaOnly);
          const globalAvgProgress = globalProgressList.length > 0 ? Math.round(globalProgressList.reduce((a, b) => a + b, 0) / globalProgressList.length) : 0;

          return (
          <div className="space-y-6 animate-fade-in text-left">
            {/* Hero summary strip */}
            <div className="bg-gradient-to-br from-sky-900 via-sky-800 to-slate-900 text-white p-6 sm:p-8 rounded-[2rem] relative overflow-hidden border border-white/5 shadow-xl shadow-sky-500/10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-sky-400/10 text-sky-300 px-3 py-1 rounded-full border border-sky-400/20 text-[10px] font-black uppercase tracking-widest">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>E-Benkyou LMS Monitoring</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black">Progres Materi & Aktivitas Belajar</h3>
                  <p className="text-xs text-sky-200/70 font-medium leading-relaxed">
                    Pantau progres materi per kelas, capaian chapter, dan performa bimbingan Sensei di platform E-Benkyou secara real-time.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                  {[
                    { label: "Materi Aktif", val: systemState.lmsLessons?.length || 0 },
                    { label: "Total Kuis", val: systemState.lmsQuizzes?.length || 0 },
                    { label: "Avg. Skor Kuis", val: avgQuizScore },
                    { label: "Progres Global", val: `${globalAvgProgress}%` },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-center min-w-[92px]">
                      <p className="text-[8.5px] font-bold text-sky-300 uppercase mb-1 tracking-wide">{s.label}</p>
                      <p className="text-xl font-black text-white">{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-6">
              {/* Per-class activity table */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Monitoring Materi per Kelas</h4>
                        <p className="text-[10px] text-slate-500">Chapter terakhir & progres rata-rata setiap kelas aktif.</p>
                      </div>
                    </div>
                    <select
                      value={lmsClassFilter}
                      onChange={(e) => setLmsClassFilter(e.target.value)}
                      className="text-[10px] font-bold bg-slate-50 border border-slate-200 p-2 rounded-lg outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="all">Semua Kelas</option>
                      {(systemState.customization?.lmsClasses || []).filter(c => c.isActive !== false).map(c => (
                        <option key={c.name} value={c.name}>Kelas {c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-150 max-h-[420px] overflow-y-auto custom-scrollbar">
                    <table className="w-full min-w-[560px] text-left border-collapse">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-150">
                          <th className="px-3 sm:px-4 py-3">Kelas</th>
                          <th className="px-3 py-3 text-center">Siswa</th>
                          <th className="px-3 py-3 text-center">Sensei</th>
                          <th className="px-3 py-3">Materi Terakhir</th>
                          <th className="px-3 py-3 text-right">Progres Rata-rata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(systemState.customization?.lmsClasses || [])
                          .filter(c => c.isActive !== false)
                          .map(c => c.name)
                          .filter(c => lmsClassFilter === "all" || c === lmsClassFilter)
                          .map((className, i) => {
                            const classUsers = (systemState.users || []).filter(u => u.assignedClass === className);
                            const classStudents = (systemState.activeStudents || []).filter(s => (s.class === className || (s as any).assignedClass === className) && !["Lulus", "Di Jepang"].includes(s.status || ""));
                            const classSensei = classUsers.filter(u => ["Pengajar", "Admin", "Admin Biasa", "Admin Super", "Staf"].includes(u.role));
                            const classProgressList = studentProgress(classStudents);
                            const avgProgress = classProgressList.length > 0 ? Math.round(classProgressList.reduce((a, b) => a + b, 0) / classProgressList.length) : 0;
                            const displayBab = (() => {
                              const classObj = (systemState.customization?.lmsClasses || []).find((c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id === className);
                              const activeBab = (classObj as any)?.activeChapterNum || 1;
                              const maxGraded = Math.max(...classStudents.map(s => (s as any).currentChapter || 0), 0);
                              return Math.min(maxGraded || activeBab, activeBab);
                            })();

                            if (classStudents.length === 0 && lmsClassFilter === "all") return null;

                            return (
                              <tr key={i} className="hover:bg-slate-50/70 transition-colors group">
                                <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 shrink-0 bg-sky-500 text-white rounded-lg flex items-center justify-center text-[10px] font-black">
                                      {className.charAt(0)}
                                    </div>
                                    <span className="text-xs font-black text-slate-800">Kelas {className}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center font-bold text-slate-700 text-xs">{classStudents.length}</td>
                                <td className="px-3 py-3 text-center font-bold text-slate-700 text-xs">{classSensei.length}</td>
                                <td className="px-3 py-3 text-[10px] text-slate-500 whitespace-nowrap">
                                  Chapter <span className="font-bold text-slate-700">{displayBab}</span>
                                </td>
                                <td className="px-3 py-3">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="text-[10px] font-black text-slate-800">{avgProgress}%</span>
                                    <div className="w-16 sm:w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden shrink-0">
                                      <div className={`h-full rounded-full group-hover:animate-pulse ${avgProgress >= 70 ? "bg-emerald-500" : avgProgress >= 40 ? "bg-sky-500" : "bg-amber-500"}`} style={{ width: `${avgProgress}%` }} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Chapter distribution chart */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Analitik Capaian Chapter</h4>
                      <p className="text-[10px] text-slate-500">Persebaran chapter yang sedang dipelajari siswa (Chapter 1 - 25).</p>
                    </div>
                  </div>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(() => {
                        // Bucket each student by the highest chapter they've been
                        // graded on ("Telah Dinilai"/"Sudah Dinilai" in
                        // chapterAssessments) - the activeStudents.currentChapter
                        // field itself is never actually populated by any write
                        // path, so reading it directly here always yielded an
                        // empty chart.
                        const maxGradedChapter = (studentId: string) => {
                          const graded = (systemState.chapterAssessments || []).filter(
                            (c: any) => c.studentId === studentId && (c.status === "Telah Dinilai" || c.status === "Sudah Dinilai")
                          );
                          return graded.reduce((max, c: any) => Math.max(max, c.chapterNumber || 0), 0);
                        };
                        const buckets = [
                          { ch: "Ch 1-5", min: 1, max: 5, val: 0 },
                          { ch: "Ch 6-10", min: 6, max: 10, val: 0 },
                          { ch: "Ch 11-15", min: 11, max: 15, val: 0 },
                          { ch: "Ch 16-20", min: 16, max: 20, val: 0 },
                          { ch: "Ch 21-25", min: 21, max: 999, val: 0 },
                        ];
                        activeSiswaOnly.forEach(s => {
                          const chapter = maxGradedChapter(s.id);
                          if (chapter < 1) return;
                          const bucket = buckets.find(b => chapter >= b.min && chapter <= b.max);
                          if (bucket) bucket.val += 1;
                        });
                        return buckets;
                      })()}>
                        <XAxis dataKey="ch" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis fontSize={10} axisLine={false} tickLine={false} hide />
                        <Tooltip />
                        <Bar dataKey="val" radius={[4, 4, 0, 0]} fill="#0ea5e9">
                          {[0, 1, 2, 3, 4].map((e, i) => <Cell key={i} fill={["#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd", "#f0f9ff"][i]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-center text-slate-400 font-medium">Grafik menunjukkan jumlah siswa yang berada pada rentang chapter tersebut.</p>
                </div>
              </div>

              {/* Sidebar: recent grading activity + global target */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                  <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Aktivitas Penilaian Sensei</h4>
                  <div className="space-y-3">
                    {(systemState.logs || [])
                      .filter((l: any) => (l.action || "").toLowerCase().includes("penilaian") || (l.action || "").toLowerCase().includes("review"))
                      .slice(0, 5)
                      .map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-slate-800 truncate">{s.user}</p>
                            <p className="text-[10px] text-slate-500 truncate">{s.action}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    {(!systemState.logs || systemState.logs.filter((l: any) => (l.action || "").toLowerCase().includes("penilaian") || (l.action || "").toLowerCase().includes("review")).length === 0) && (
                      <p className="text-center py-4 text-[10px] text-slate-400">Belum ada aktivitas penilaian terdeteksi.</p>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-sky-600 to-sky-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-sky-200 space-y-4">
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-bold text-sm">Target Belajar Global</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-sky-100 uppercase">Rata-rata Progress Siswa</span>
                      <span>{globalAvgProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]" style={{ width: `${globalAvgProgress}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div>
                      <p className="text-[9px] text-sky-200 uppercase font-bold">Siswa Belajar</p>
                      <p className="text-lg font-black">{activeSiswaOnly.length}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-sky-200 uppercase font-bold">Sensei Aktif</p>
                      <p className="text-lg font-black">{senseiCount}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          );
        })()}

        {monitorTab === ("hr" as any) && (
          <div className="space-y-6 animate-fade-in text-left">
            <h3 className="font-bold text-slate-800">Pemantauan Absensi & HR (Pengajar & Staf)</h3> 
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm">Kehadiran (Absensi) Pengajar & Staf</h4>
                <span className="text-[9px] text-slate-400 font-medium hidden sm:block">Klik baris untuk lihat detail log</span>
              </div>
              <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
                <table className="w-full text-left text-xs min-w-[560px]">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wide">
                    <tr>
                      <th className="p-3 rounded-l-xl">Nama & Role</th>
                      <th className="p-3 text-center">Hadir</th>
                      <th className="p-3 text-center">Ketepatan Waktu</th>
                      <th className="p-3 rounded-r-xl text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(systemState.users || []).filter(u => ["Pengajar", "Admin", "Admin Biasa", "Admin Super", "Staf"].includes(u.role)).map(u => {
                      const staffLogs = (systemState.logs || []).filter(l => l.type === "PRESENSI_PENGAJAR" && (l.user === u.name || l.user === u.username));
                      const hadir = staffLogs.length;
                      let onTime = 0;
                      let checkIns = 0;
                      staffLogs.forEach(l => {
                        if (!(l.description || "").includes("MASUK")) return;
                        checkIns++;
                        const match = (l.description || "").match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                        let hrVal: number, minVal: number;
                        if (match) {
                          hrVal = parseInt(match[1]);
                          minVal = parseInt(match[2]);
                        } else {
                          const d = new Date(l.timestamp || l.time);
                          hrVal = d.getHours();
                          minVal = d.getMinutes();
                        }
                        if (!(hrVal > 8 || (hrVal === 8 && minVal > 0))) onTime++;
                      });
                      const punctuality = checkIns > 0 ? Math.round((onTime / checkIns) * 100) : null;
                      return (
                        <tr
                          key={u.username}
                          onClick={() => setSelectedHrAttendanceStaff(u)}
                          className="hover:bg-slate-50 transition cursor-pointer"
                        >
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{u.name}</p>
                            <p className="text-[9.5px] text-slate-400 font-medium uppercase tracking-wide">{u.role}</p>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-black text-emerald-600">{hadir}</span>
                            <span className="text-slate-400 font-medium"> Hari</span>
                          </td>
                          <td className="p-3 text-center">
                            {punctuality !== null ? (
                              <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md ${punctuality >= 85 ? "text-emerald-600 bg-emerald-50" : punctuality >= 70 ? "text-indigo-600 bg-indigo-50" : "text-amber-600 bg-amber-50"}`}>
                                {punctuality}%
                              </span>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">Belum ada</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                              Lihat Detail →
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200"> 
              <h4 className="font-bold text-slate-800 text-sm mb-3">Rekening Gaji Pengajar & Staf</h4> 
              <div className="overflow-x-auto"> 
                <table className="w-full text-left text-xs"> 
                  <thead className="bg-slate-50 text-slate-500"> 
                    <tr> 
                      <th className="p-3">Nama</th> 
                      <th className="p-3">Rekening Bank</th> 
                    </tr> 
                  </thead> 
                  <tbody className="divide-y divide-slate-100"> 
                    {(systemState.users || []).filter(u => ["Pengajar", "Admin", "Admin Biasa", "Admin Super", "Staf"].includes(u.role)).map(u => ( 
                      <tr key={u.username}> 
                        <td className="p-3 font-bold text-slate-700">{u.name}</td> 
                        <td className="p-3 text-slate-600 font-mono">{u.bankAccount || "-"}</td> 
                      </tr> 
                    ))} 
                  </tbody> 
                </table> 
              </div> 
            </div> 
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200"> 
              <h4 className="font-bold text-slate-800 text-sm mb-3">Pengajuan Cuti & Izin</h4> 
              <div className="space-y-3"> 
                {!(systemState.teacherLeaves?.length) && ( 
                  <p className="text-xs text-slate-500 italic">Belum ada pengajuan cuti.</p> 
                )} 
                {(systemState.teacherLeaves || []).map(leave => ( 
                  <div key={leave.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl"> 
                    <div className="flex justify-between items-start"> 
                      <div> 
                        <p className="font-bold text-xs text-slate-800">{leave.teacherName}</p> 
                        <p className="text-[10px] text-slate-500">{leave.startDate} s/d {leave.endDate}</p> 
                      </div> 
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${leave.status === "Disetujui" ? "bg-emerald-100 text-emerald-800" : leave.status === "Ditolak" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}> 
                        {leave.status} 
                      </span> 
                    </div> 
                    <p className="text-[10px] text-slate-600 mt-2">Alasan: {leave.reason}</p> 
                  </div> 
                ))} 
              </div> 
            </div> 
          </div> 
        )}
      </section>
      )}

      {/* HR ATTENDANCE DETAIL MODAL */}
      {selectedHrAttendanceStaff && (() => {
        const staff = selectedHrAttendanceStaff;
        const staffLogs = (systemState.logs || [])
          .filter(l => l.type === "PRESENSI_PENGAJAR" && (l.user === staff.name || l.user === staff.username))
          .sort((a, b) => new Date(b.timestamp || b.time || 0).getTime() - new Date(a.timestamp || a.time || 0).getTime());

        const getPunctuality = (log: any): string | null => {
          if (!(log.description || "").includes("MASUK")) return null;
          const match = (log.description || "").match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
          let hrVal: number;
          let minVal: number;
          if (match) {
            hrVal = parseInt(match[1]);
            minVal = parseInt(match[2]);
          } else {
            const d = new Date(log.timestamp || log.time);
            hrVal = d.getHours();
            minVal = d.getMinutes();
          }
          return hrVal > 8 || (hrVal === 8 && minVal > 0) ? "Terlambat" : "Tepat Waktu";
        };

        return createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                      <Clock className="h-4 w-4" />
                    </span>
                    Detail Kehadiran: {staff.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 ml-9">
                    @{staff.username} · {staffLogs.length} Log Presensi Tercatat
                  </p>
                </div>
                <button
                  onClick={() => setSelectedHrAttendanceStaff(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <span className="text-xl font-bold">×</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-3">
                {staffLogs.length === 0 && (
                  <p className="text-xs text-slate-500 italic text-center py-8">Belum ada riwayat presensi tercatat untuk staf ini.</p>
                )}
                {staffLogs.map((log, idx) => {
                  const status = getPunctuality(log);
                  const ts = log.timestamp || log.time;
                  const dateObj = ts ? new Date(ts) : null;
                  return (
                    <div key={log.id || idx} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg font-mono">
                            {dateObj ? dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">
                            🕐 {dateObj ? dateObj.toLocaleTimeString("id-ID") : "-"}
                          </span>
                          {log.clockType && (
                            <span className="text-[9px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                              {log.clockType}
                            </span>
                          )}
                          {log.workMode && (
                            <span className="text-[9px] font-bold uppercase bg-purple-50 text-purple-700 border border-purple-100 px-2 py-0.5 rounded-full">
                              {log.workMode === "ZOOM" ? "E-Learning Zoom" : "Regular Luring"}
                            </span>
                          )}
                        </div>
                        {status && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${status === "Tepat Waktu" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"}`}>
                            {status}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-600 mt-2">{log.description || "Hadir"}</p>
                      {log.location && (
                        <p className="text-[9.5px] text-slate-400 mt-1 font-mono">📍 {log.location}</p>
                      )}
                      {log.notes && (
                        <p className="text-[9.5px] text-slate-500 mt-1 italic">Catatan: {log.notes}</p>
                      )}
                      {log.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setViewingAttendancePhoto(log.photoUrl)}
                          className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200/80 transition cursor-pointer shadow-3xs active:scale-95"
                        >
                          📸 Lihat Foto Bukti Presensi
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* STUDENT PROFILE & DETAILED RAPOR MODAL (VVIP ACCESS ENGINE) */}

      {/* SENSEI MODAL */}
      {selectedSenseiDetail && (() => {
        const teacher = (systemState.users || []).find(u => u.username === selectedSenseiDetail.username) || selectedSenseiDetail;
        const assignedClasses = (systemState.customization?.lmsClasses || []).filter(c => c.isActive && (c.name === teacher.assignedClass || teacher.assignedClass?.includes(c.name)));
        const verifiedDocsList = teacher.verifiedDocs || [];

        const toggleDocVerify = async (docKey: string) => {
          const isVerified = verifiedDocsList.includes(docKey);
          const updated = isVerified ? verifiedDocsList.filter((d: string) => d !== docKey) : [...verifiedDocsList, docKey];
          await onUpdateState("users", "edit", {
            ...teacher,
            verifiedDocs: updated
          });
        };

        return createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <FileText className="h-4 w-4" />
                    </span>
                    Monitoring VVIP: Pemeriksaan & Verifikasi Dokumen Sensei
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 ml-9">
                    ID Akun: @{teacher.username}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSenseiDetail(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <span className="text-xl font-bold">×</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5">
                
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex items-start sm:items-center gap-4 flex-col sm:flex-row">
                   <div className="h-16 w-16 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-3xs flex-shrink-0 flex items-center justify-center">
                      {teacher.profilePicture ? (
                        <img src={getSafePhotoUrl(teacher.profilePicture, teacher.name)} className="h-full w-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl">👤</div>
                      )}
                   </div>
                   <div className="space-y-1">
                     <h4 className="font-black text-slate-900 text-lg leading-none">{teacher.name}</h4>
                     <p className="text-xs font-bold text-slate-500">{teacher.email}</p>
                     <div className="flex flex-wrap gap-1.5 mt-1">
                       <span className="text-[9.5px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-100 font-bold">
                         Level Jepang: {teacher.japaneseLevel || "Belum Diisi"}
                       </span>
                       {teacher.kecakapanSensei && (
                         <span className="text-[9.5px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-100 font-bold">
                           Kecakapan: {teacher.kecakapanSensei}
                         </span>
                       )}
                     </div>
                   </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Kelas yang Diampu:</span>
                  {assignedClasses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {assignedClasses.map(c => (
                        <span key={c.id} className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                          🏫 Ruang Belajar {c.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic font-medium">Belum diplot mengampu kelas apa pun</span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-black text-slate-800 text-sm">Menu Periksa Dokumen Pengajar</h4>
                    <span className="text-[9px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-full font-bold">VVIP MONITORING</span>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { key: "ijazah", name: "Ijazah Terakhir", docUrl: teacher.docIjazah },
                      { key: "sertifikat", name: "Sertifikat JLPT / JFT / NAT / Mengajar", docUrl: teacher.docSertifikat },
                      { key: "ktp", name: "KTP / Identitas Pribadi", docUrl: teacher.docKTP },
                      { key: "cv", name: "Curriculum Vitae (CV) Sensei", docUrl: teacher.docCV }
                    ].map((doc) => {
                      const isVerified = verifiedDocsList.includes(doc.key);
                      return (
                        <div key={doc.key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-200 rounded-2xl bg-slate-50 gap-3">
                          <div className="text-left">
                            <p className="font-bold text-slate-800 text-xs">{doc.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={`inline-block h-2 w-2 rounded-full ${doc.docUrl ? (isVerified ? "bg-emerald-500 animate-pulse" : "bg-amber-500") : "bg-slate-300"}`}></span>
                              <span className="text-[10px] text-slate-500">
                                {doc.docUrl ? (isVerified ? "Diverifikasi & Valid" : "Belum Diverifikasi") : "Belum Diunggah"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {doc.docUrl ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setViewingAttendancePhoto(doc.docUrl)}
                                  className="text-[10px] font-bold bg-white text-indigo-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-indigo-800 transition shadow-3xs flex items-center gap-1 cursor-pointer"
                                >
                                  <span>👁️</span> Lihat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleDocVerify(doc.key)}
                                  className={`text-[10px] font-bold px-3 py-2 rounded-xl transition shadow-3xs flex items-center gap-1 cursor-pointer ${
                                    isVerified
                                      ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
                                  }`}
                                >
                                  {isVerified ? (
                                    <>
                                      <span>❌</span> Batalkan Verifikasi
                                    </>
                                  ) : (
                                    <>
                                      <span>✅</span> Setujui & Verifikasi
                                    </>
                                  )}
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 italic bg-slate-100/50 px-2.5 py-1 rounded-lg border border-slate-200/50">Tidak Tersedia</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSenseiDetail(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Selesai Memeriksa
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
  
      {selectedStudentDetail && createPortal(
        (() => {
          const student = selectedStudentDetail;

          // Find corresponding registered details for biographical profile
          const matchedReg = (systemState.registeredStudents.find(
            (reg) =>
              reg.name.toLowerCase() === student.name.toLowerCase() ||
              reg.id === student.id,
          ) || {
            id: `REG-${student.id.split("-")[1] || "000"}`,
            name: student.name,
            status: student.statusPendaftaran || (["Lulus", "Di Jepang"].includes(student.status) ? "Alumni" : "Siswa Aktif"),
            email: student.email || "-",
            phone: student.phone || "-",
            birthDate: "-",
            education: "-",
            program: student.class || "-",
            japaneseLevel: student.japaneseLevel || "N5",
            verifiedDocs: [] as string[],
          }) as RegisteredStudent;

          const requiredDocs = [
            { label: "Akte Kelahiran Asli", val: "docAkta" },
            { label: "Pas Foto Biometrik", val: "docFoto" },
            { label: "Ijazah SD Sederajat", val: "docIjazahSD" },
            { label: "Ijazah SMP / MTs", val: "docIjazahSMP" },
            { label: "Ijazah SMA / MA / SMK", val: "docIjazahSMA" },
            { label: "Kartu Keluarga (KK)", val: "docKK" },
            { label: "Kartu Tanda Penduduk (KTP)", val: "docKTP" },
            { label: "Transkrip Nilai Akademik", val: "docTranskip" },
          ];

          // Fetch actual chapter assessments
          const actualAssessments = (
            systemState.chapterAssessments || []
          ).filter((ass) => ass.studentId === student.id);

          // Fallback simulated records if none, synchronized with 25 chapters from CHAPTERS_LIST
          const displayAssessments =
            actualAssessments.length > 0
              ? actualAssessments.map((ass) => {
                  // Attempt to match with chapters list
                  const ch = CHAPTERS_LIST.find(
                    (c) => c.number === ass.chapterNumber,
                  ) || { title: `Bab ${ass.chapterNumber} LPK` };
                  return {
                    chapterNumber: ass.chapterNumber,
                    chapterTitle: ch.title,
                    score: ass.score || 0,
                    status: ass.status,
                    notes: ass.notes || "-",
                    assessor: ass.assessedBy || "Sensei Utama",
                  };
                })
              : [];

          const avgScore =
            displayAssessments.length > 0 ? displayAssessments.reduce((sum, item) => sum + item.score, 0) /
            displayAssessments.length : 0;

          // Custom skills mapping based on class specialty (more flexible)
          const isCaregiver = student.class?.includes("Caregiver") || student.class?.includes("Asahi");
          const isFood = student.class?.includes("Food") || student.class?.includes("Fuji");

          const customSkills = {
            kaiwa: 0,
            vocabulary: student.japaneseLevel || "-",
            sectorSkills: [],
            remarks: "Belum ada tinjauan kompetensi khusus.",
          };

          return (
            <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-hidden">
              <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
                {/* Header Box */}
                <div className="bg-slate-900 p-6 flex items-start justify-between text-white shrink-0">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        STUDENT AUDIT RAPOR
                      </span>
                      <span className="text-[10px] font-black bg-emerald-500 text-slate-900 px-2 rounded-full uppercase">
                        Kelas {student.class}
                      </span>
                    </div>
                    <h3 className="font-display font-black text-lg sm:text-2xl truncate">
                      {student.name}
                    </h3>
                    <p className="text-slate-400 text-xs font-mono">
                      ID Mahasiswa: {student.id} | Batch Angkatan:{" "}
                      {student.batch}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedStudentDetail(null)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 p-2 rounded-xl transition cursor-pointer active:scale-95"
                  >
                    <span className="font-black text-sm">✕ Close</span>
                  </button>
                </div>

                {/* Sub-tabs Selectors */}
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex gap-2 overflow-x-auto shrink-0 select-none">
                  {[
                    { id: "biodata", label: "🗂️ Data Pribadi & Dokumen" },
                    { id: "rekap", label: "📄 Rekap & Riwayat VVIP" },
                    { id: "skills", label: "📊 Peta Kompetensi Skill" },
                    {
                      id: "evaluasi",
                      label: "📓 Nilai Evaluasi Bab Kurikulum",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setModalSubTab(item.id as any)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        modalSubTab === item.id
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Contents Pane */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                  {/* TAB 1: BIODATA & DOKUMEN 8 AKTA/PAS/IJA/KK/KTP */}
                  {modalSubTab === "biodata" && (
                    <div className="space-y-6 animate-fade-in text-slate-800">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-3">
                          <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                            Informasi Kependudukan
                          </h4>
                          <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                            <div className="py-2.5 flex justify-between gap-2">
                              <span className="text-slate-500">
                                Tanggal Lahir:
                              </span>
                              <span className="font-bold text-slate-900">
                                {matchedReg.birthDate}
                              </span>
                            </div>
                            <div className="py-2.5 flex justify-between gap-2">
                              <span className="text-slate-500">
                                Nomor Telepon:
                              </span>
                              <span className="font-bold text-slate-900">
                                {matchedReg.phone}
                              </span>
                            </div>
                            <div className="py-2.5 flex justify-between gap-2">
                              <span className="text-slate-500">
                                Alamat E-mail:
                              </span>
                              <span
                                className="font-bold text-slate-900 text-right truncate max-w-[200px]"
                                title={matchedReg.email}
                              >
                                {matchedReg.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                            Kualifikasi Perekrutan
                          </h4>
                          <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                            <div className="py-2.5 flex justify-between gap-2">
                              <span className="text-slate-500">
                                Pendidikan Terakhir:
                              </span>
                              <span className="font-bold text-slate-900">
                                {matchedReg.education}
                              </span>
                            </div>
                            <div className="py-2.5 flex justify-between gap-2">
                              <span className="text-slate-500">
                                Program Penyaluran:
                              </span>
                              <span className="font-bold text-slate-900 leading-tight text-right">
                                {matchedReg.program}
                              </span>
                            </div>
                            <div className="py-2.5 flex justify-between gap-2">
                              <span className="text-slate-500">
                                Kelayakan Target Bahasa:
                              </span>
                              <span className="font-bold text-indigo-700">
                                {matchedReg.japaneseLevel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Checklists for 8 Documents requested in Request 1 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b pb-2">
                          <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                            Verifikasi Berkas Pendataan (8 Dokumen Wajib)
                          </h4>
                          {(() => {
                            const vCount = requiredDocs.filter(d => (matchedReg.verifiedDocs || []).includes(d.val)).length;
                            return (
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${vCount === 8 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                                {vCount === 8 ? "Lengkap 8/8 Terverifikasi" : `${vCount}/8 Terverifikasi`}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {requiredDocs.map((doc, idx) => {
                            const isVerified = (matchedReg.verifiedDocs || []).includes(doc.val);
                            return (
                              <div
                                key={idx}
                                onClick={async () => {
                                  if (isReadOnly) return;
                                  const currentVerified = matchedReg.verifiedDocs || [];
                                  const newVerified = currentVerified.includes(doc.val)
                                    ? currentVerified.filter(v => v !== doc.val)
                                    : [...currentVerified, doc.val];
                                  await onUpdateState("registeredStudents", "update", {
                                    id: matchedReg.id,
                                    verifiedDocs: newVerified,
                                  });
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border transition shadow-3xs text-xs cursor-pointer select-none ${
                                  isVerified
                                    ? "bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50"
                                    : "bg-amber-50/40 border-amber-200 hover:bg-amber-50"
                                }`}
                                title={isReadOnly ? "Mode Pantau (Hanya Baca)" : "Klik untuk mengubah status verifikasi"}
                              >
                                <div className="flex items-center gap-2">
                                  {isVerified ? (
                                    <span className="h-5 w-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="h-5 w-5 rounded bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-black shrink-0">
                                      ⚠
                                    </span>
                                  )}
                                  <span className="font-semibold text-slate-700">
                                    {doc.label}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-md font-mono shrink-0 ${
                                    isVerified
                                      ? "text-emerald-700 bg-emerald-100"
                                      : "text-amber-700 bg-amber-100"
                                  }`}
                                >
                                  {isVerified ? "VERIFIED" : "UNVERIFIED"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-450 leading-relaxed italic pt-1">
                          Klik berkas di atas untuk mengubah status verifikasi. Seluruh dokumen fisik dan scan resolusi tinggi harus
                          diverifikasi langsung oleh Admin & Tim Pengajar LPK SCI.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB: REKAP & RIWAYAT VVIP */}
                  {modalSubTab === "rekap" && (
                    <div className="space-y-6 animate-fade-in text-slate-800 text-left">
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
                        <Activity className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-tight">Timeline & Rekap Aktivitas Individual</h4>
                          <p className="text-[10px] text-indigo-700/70 font-medium">Histori lengkap presensi, pembayaran, dan penilaian untuk audit HR VVIP.</p>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Attendance Summary */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                          <h5 className="text-[11px] font-black text-slate-900 uppercase border-b pb-2 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-blue-500" /> Riwayat Presensi
                          </h5>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {(() => {
                              const records = (systemState.attendance || []).filter(a => a.studentId === student.id || a.studentName === student.name);
                              if (records.length === 0) return <p className="text-[10px] text-slate-400 italic">Tidak ada data presensi.</p>;
                              return records.map(r => (
                                <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-[10px]">
                                  <span className="font-bold text-slate-700">{r.date}</span>
                                  <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                                    r.status === "Hadir" ? "bg-emerald-100 text-emerald-700" : 
                                    r.status === "Alpa" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                  }`}>{r.status}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {/* Payment History */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                          <h5 className="text-[11px] font-black text-slate-900 uppercase border-b pb-2 flex items-center gap-2">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Riwayat Keuangan
                          </h5>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                            {(() => {
                              const payments = (systemState.payments || []).filter(p => p.studentName === student.name);
                              if (payments.length === 0) return <p className="text-[10px] text-slate-400 italic">Tidak ada data pembayaran.</p>;
                              return payments.map(p => (
                                <div key={p.id} className="flex flex-col p-2.5 bg-slate-50 rounded-xl text-[10px] gap-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-700">{p.category}</span>
                                    <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                                      p.status === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                    }`}>{p.status}</span>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                                    <span>{p.date}</span>
                                    <span className="font-black">Rp {p.amount.toLocaleString("id-ID")}</span>
                                  </div>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Activity Log Activity for this student */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                        <h5 className="text-[11px] font-black text-slate-900 uppercase border-b pb-2 flex items-center gap-2">
                           <Activity className="h-3.5 w-3.5 text-indigo-500" /> Log Aktivitas Sistem
                        </h5>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                          {(() => {
                            const logs = (systemState.logs || []).filter(l => (l.description || "").includes(student.name));
                            if (logs.length === 0) return <p className="text-[10px] text-slate-400 italic">Belum ada log sistem untuk siswa ini.</p>;
                            return logs.map(l => (
                              <div key={l.id} className="p-2.5 bg-slate-50 border-l-2 border-indigo-500 rounded-r-xl text-[10px] space-y-1">
                                <p className="font-bold text-slate-800">{l.description}</p>
                                <div className="flex justify-between text-[9px] text-slate-400">
                                  <span>Admin: {l.user}</span>
                                  <span>{new Date(l.timestamp).toLocaleString("id-ID")}</span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SKILLS & KOMPETENSI */}
                  {modalSubTab === "skills" && (
                    <div className="space-y-6 animate-fade-in text-slate-850">
                      {/* Key stats row */}
                      <div className="grid items-center gap-5 sm:grid-cols-2">
                        <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 border border-slate-800">
                          <span className="text-[9px] font-bold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded font-mono uppercase">
                            Vocal fluency and lisan
                          </span>
                          <h5 className="font-display font-black text-3xl">
                            {customSkills.kaiwa} / 5.0
                          </h5>
                          <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                            Nilai percakapan mandiri bahasa jepang harian
                            (Kaiwa) di asrama bimbingan Pati.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                              Kosa Kata Sektor
                            </span>
                            <span className="font-extrabold text-xs text-slate-800 leading-tight block pt-1">
                              {customSkills.vocabulary}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                              Kedisiplinan Indeks
                            </span>
                            <span className="font-extrabold text-xs text-emerald-600 leading-tight block pt-1">
                              96% Sangat Disiplin
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sector specific competency certifications */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-xs text-left space-y-3">
                        <h5 className="font-black text-slate-900 border-b pb-1.5 uppercase text-[11px] tracking-wider text-slate-500">
                          Sertifikasi & Keterampilan Sektor Khusus
                        </h5>
                        <div className="grid gap-2.5 sm:grid-cols-3">
                          {customSkills.sectorSkills.map((sk, index) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-3xs flex items-center gap-2"
                            >
                              <span className="text-lg">🎖️</span>
                              <span className="font-bold text-slate-800 leading-snug">
                                {sk}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sensei recommendations comment */}
                      <div className="space-y-2 text-left bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 text-xs">
                        <h6 className="font-extrabold text-indigo-900 flex items-center gap-1">
                          💬 Catatan & Evaluasi Pembimbing Utama:
                        </h6>
                        <p className="text-slate-700 italic leading-relaxed font-sans">
                          "{customSkills.remarks}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: EVALUASI TAB */}
                  {modalSubTab === "evaluasi" &&
                    (() => {
                      const isFukushu = (student.class || "")
                        .toUpperCase()
                        .includes("FUKUSHU") || (student.class || "")
                        .toUpperCase()
                        .includes("FUKUSU");
                      const maxCh = getClassMaxBab(student.class || "");
                      return (
                        <div className="space-y-6 animate-fade-in text-slate-800">
                          {/* Performance Summary metric */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-150">
                            <div className="space-y-1 text-center sm:text-left select-none">
                              <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                                Evaluasi Akademik Rapor LPK
                              </p>
                              <h4 className="font-display font-black text-lg text-slate-900">
                                Buku Nilai Sinkronisasi {maxCh} Bab Kurikulum
                              </h4>
                            </div>
                            <div className="flex gap-4">
                              <div className="bg-white p-3 rounded-xl border text-center font-mono min-w-[100px] shadow-3xs">
                                <p className="text-[8px] text-slate-400 font-bold block uppercase leading-none pb-1.5">
                                  Nilai Rerata
                                </p>
                                <p
                                  className={`text-xl font-black ${avgScore >= 90 ? "text-emerald-600" : "text-indigo-600"}`}
                                >
                                  {Math.round(avgScore)}%
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border text-center font-mono min-w-[100px] shadow-3xs">
                                <p className="text-[8px] text-slate-400 font-bold block uppercase leading-none pb-1.5">
                                  Bab Tuntas
                                </p>
                                <p className="text-xl font-black text-indigo-600">
                                  {
                                    displayAssessments.filter(
                                      (a) => a.status === "Telah Dinilai",
                                    ).length
                                  }{" "}
                                  / {maxCh} Bab
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Chapters assessments detailed database layout */}
                          <div>
                            {/* Desktop Table - Hidden on Mobile */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-indigo-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                                    <th className="py-2.5 px-4">
                                      Bab & Kurikulum Pembelajaran
                                    </th>
                                    <th className="py-2.5 px-4">Penguji</th>
                                    <th className="py-2.5 px-4 text-center">
                                      Skor Evaluasi
                                    </th>
                                    <th className="py-2.5 px-4 text-center">
                                      Grade
                                    </th>
                                    <th className="py-2.5 px-4">
                                      Saran Perbaikan Saran (Feedback)
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-705">
                                  {displayAssessments.map((ass, idx) => {
                                    const isExcellent = ass.score >= 90;
                                    const isGood = ass.score >= 80;
                                    const gradeLetter =
                                      ass.score >= 90
                                        ? "A"
                                        : ass.score >= 80
                                          ? "B"
                                          : "C";

                                    return (
                                      <tr
                                        key={idx}
                                        className="hover:bg-slate-50/50 transition"
                                      >
                                        <td className="py-3 px-4">
                                          <div className="font-semibold text-slate-900 leading-snug">
                                            Bab {ass.chapterNumber}
                                          </div>
                                          <div
                                            className="text-[10px] text-slate-400 truncate max-w-[170px]"
                                            title={ass.chapterTitle}
                                          >
                                            {ass.chapterTitle}
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium">
                                          {ass.assessor}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-850">
                                          {ass.score}%
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-black">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] ${
                                              isExcellent
                                                ? "bg-emerald-50 text-emerald-700"
                                                : isGood
                                                  ? "bg-blue-50 text-blue-700"
                                                  : "bg-amber-50 text-amber-700"
                                            }`}
                                          >
                                            {gradeLetter}
                                          </span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 font-sans max-w-[300px] leading-relaxed">
                                          {ass.notes}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card List - Shown on Mobile */}
                            <div className="block md:hidden space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                              {displayAssessments.map((ass, idx) => {
                                const isExcellent = ass.score >= 90;
                                const isGood = ass.score >= 80;
                                const gradeLetter =
                                  ass.score >= 90
                                    ? "A"
                                    : ass.score >= 80
                                      ? "B"
                                      : "C";

                                return (
                                  <div
                                    key={idx}
                                    className="bg-white p-3 rounded-xl border border-slate-250 text-left space-y-2 text-xs"
                                  >
                                    <div className="flex justify-between items-start border-b pb-1.5Packed">
                                      <div>
                                        <h6 className="font-semibold text-slate-900 text-xs">
                                          Bab {ass.chapterNumber}
                                        </h6>
                                        <p className="text-[10px] text-slate-400">
                                          {ass.chapterTitle}
                                        </p>
                                      </div>
                                      <span
                                        className={`px-2 py-0.5 rounded font-mono font-black text-[9px] uppercase whitespace-nowrap ${
                                          isExcellent
                                            ? "bg-emerald-50 text-emerald-700"
                                            : isGood
                                              ? "bg-blue-50 text-blue-700"
                                              : "bg-amber-50 text-amber-750"
                                        }`}
                                      >
                                        {ass.score}% ({gradeLetter})
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="text-slate-400">
                                        Penguji:
                                      </span>
                                      <span className="font-semibold text-slate-700">
                                        {ass.assessor}
                                      </span>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-lg border text-[10px] space-y-1">
                                      <span className="block font-bold text-slate-450 uppercase text-[8px]">
                                        Catatan:
                                      </span>
                                      <p className="text-slate-700 italic">
                                        "{ass.notes}"
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 leading-relaxed italic text-center">
                            Buku rapor ini disinkronisasikan langsung dari panel
                            LmsView yang dinilai secara real-time oleh para
                            instruktur Jepang.
                          </p>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          );
        })(), document.body)}

      {/* VVIP EDIT REGISTRATION DATA MODAL */}
      {vvipEditingStudentId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                    <FileText className="h-4 w-4" />
                  </span>
                  Edit Data Lengkap Siswa
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-1 ml-9">
                  ID: {vvipEditingStudentId}
                </p>
              </div>
              <button
                onClick={() => setVvipEditingStudentId(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
              >
                <span className="text-xl font-bold">×</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form
                id="vvipRegForm"
                onSubmit={handleVvipSaveReg}
                className="space-y-5"
              >
                {vvipRegError && (
                  <div className="bg-red-50 text-red-600 p-3 text-xs rounded-xl border border-red-100 font-bold">
                    {vvipRegError}
                  </div>
                )}
                {vvipRegSuccess && (
                  <div className="bg-emerald-50 text-emerald-600 p-3 text-xs rounded-xl border border-emerald-100 font-bold">
                    Data siswa berhasil diperbarui.
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Status Siswa
                    </label>
                    <select
                      value={vvipRegData.status || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          status: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer text-slate-900"
                    >
                      <option value="Belajar">🇮🇩 BELAJAR</option>
                      <option value="On Progres Job">💼 ON PROGRES JOB</option>
                      <option value="On Progres JFT/JLPT/SSW">📋 ON PROGRES JFT/JLPT/SSW</option>
                      <option value="Diklat SO">📘 DIKLAT SO</option>
                      <option value="Lulus">🎓 LULUS</option>
                      <option value="Di Jepang">🇯🇵 DI JEPANG</option>
                      <option value="Dikeluarkan">❌ DIKELUARKAN</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Prefektur (Untuk Di Jepang)
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.prefecture || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          prefecture: e.target.value,
                        })
                      }
                      placeholder="Misal: Tokyo, Osaka"
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.name || ""}
                      onChange={(e) =>
                        setVvipRegData({ ...vvipRegData, name: e.target.value })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Program / Kelas
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.program || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          program: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      No WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.phone || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          phone: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Alamat / Domisili
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.district || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          district: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={vvipRegData.birthDate || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          birthDate: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Jenis Kelamin
                    </label>
                    <select
                      value={vvipRegData.gender || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          gender: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer text-slate-900"
                    >
                      <option value="">Pilih</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Pendidikan Terakhir
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.education || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          education: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Asal Sekolah
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.school || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          school: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Kategori Pendaftaran
                    </label>
                    <select
                      value={vvipRegData.statusPendaftaran || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          statusPendaftaran: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer text-slate-900"
                    >
                      <option value="Siswa Baru">Siswa Baru</option>
                      <option value="Alumni">Alumni</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Kemampuan Bahasa Jepang
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.japaneseLevel || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          japaneseLevel: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Program / Kelas
                    </label>
                    <select
                      value={vvipRegData.program || vvipRegData.class || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          program: e.target.value,
                          class: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer text-slate-900"
                    >
                      <option value="">Pilih Program/Kelas</option>
                      <option value="Reguler">Reguler</option>
                      <option value="Intensif">Intensif</option>
                      <option value="N4">N4</option>
                      <option value="N3">N3</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Batch
                    </label>
                    <input
                      type="text"
                      value={vvipRegData.batch || ""}
                      onChange={(e) =>
                        setVvipRegData({
                          ...vvipRegData,
                          batch: e.target.value,
                        })
                      }
                      className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 text-slate-900"
                    />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVvipEditingStudentId(null)}
                className="px-5 py-2.5 bg-white text-slate-600 rounded-xl text-xs font-black border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="submit"
                form="vvipRegForm"
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-sm cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    
        {showCostConfig && createPortal(
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b flex justify-between items-center bg-indigo-50 shrink-0">
                <h3 className="font-bold text-indigo-900">Konfigurasi SOP Biaya Resmi</h3>
                <button onClick={() => setShowCostConfig(false)} className="text-slate-400 hover:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <form onSubmit={handleSaveCostConfig} className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Administrasi Pendaftaran</label>
                  <input type="number" required value={costRegistration} onChange={e => setCostRegistration(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">DP Biaya Belajar (Awal)</label>
                  <input type="number" required value={costDP} onChange={e => setCostDP(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Pelunasan Biaya Belajar (Maks 1 Bln)</label>
                  <input type="number" required value={costFullPayment} onChange={e => setCostFullPayment(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Management Fee (Pasca Lolos)</label>
                  <input type="number" required value={costManagementFee} onChange={e => setCostManagementFee(Number(e.target.value))} className="w-full border rounded-lg p-2 text-sm mt-1" />
                </div>
                <div className="pt-4 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowCostConfig(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer">Simpan</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

  
      {editingPayment && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
              Edit Data Pembayaran
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Jumlah (Rp)</label>
                <input type="number" id="edit-pay-amount" defaultValue={editingPayment.amount} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-700 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori / Keterangan</label>
                <input type="text" id="edit-pay-cat" defaultValue={editingPayment.category} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Status</label>
                <select id="edit-pay-status" defaultValue={editingPayment.status} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500">
                  <option value="Lunas">Lunas</option>
                  <option value="Cicilan">Cicilan</option>
                  <option value="Belum Bayar">Belum Bayar</option>
                  <option value="Pending">Pending</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button onClick={() => setEditingPayment(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer">Batal</button>
              <button onClick={() => {
                 const amt = (document.getElementById('edit-pay-amount') as HTMLInputElement).value;
                 const cat = (document.getElementById('edit-pay-cat') as HTMLInputElement).value;
                 const stat = (document.getElementById('edit-pay-status') as HTMLSelectElement).value;
                 onUpdateState('payments', 'edit', { id: editingPayment.id, amount: Number(amt), category: cat, status: stat });
                 setEditingPayment(null);
              }} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {editingLedger && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] text-left">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
              Edit Buku Kas
            </h3>
            
            <div className="space-y-4 overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Tanggal Transaksi</label>
                <input 
                  type="date" 
                  id="edit-ledger-date" 
                  defaultValue={editingLedger.date ? (editingLedger.date.includes("T") ? editingLedger.date.split("T")[0] : editingLedger.date) : new Date().toISOString().split("T")[0]} 
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Kas Masuk (Rp)</label>
                  <input type="number" id="edit-ledger-in" defaultValue={editingLedger.inAmount} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Kas Keluar (Rp)</label>
                  <input type="number" id="edit-ledger-out" defaultValue={editingLedger.outAmount} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori</label>
                <select id="edit-ledger-code" defaultValue={editingLedger.code || "DLL"} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                  <option value="P1">P1 - GAJI KARYAWAN</option>
                  <option value="P2">P2 - BIAYA OPERASIONAL</option>
                  <option value="P3">P3 - BIAYA PERJALANAN DINAS</option>
                  <option value="P4">P4 - BIAYA KONSUMSI</option>
                  <option value="P5">P5 - BIAYA INVENTARIS</option>
                  <option value="P6">P6 - BIAYA PERAWATAN GUDANG</option>
                  <option value="P7">P7 - BIAYA PENYUSUTAN</option>
                  <option value="P8">P8 - BIAYA LAINNYA</option>
                  <option value="P9A">P9A - PEMBAYARAN ONJOB</option>
                  <option value="P9B">P9B - PEMBAYARAN SISWA BARU</option>
                  <option value="DLL">DLL - LAINNYA</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Uraian / Keterangan</label>
                <input type="text" id="edit-ledger-desc" defaultValue={editingLedger.description} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer w-fit">
                  <input 
                    type="checkbox" 
                    checked={editingLedgerIsStudent}
                    onChange={(e) => setEditingLedgerIsStudent(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                  />
                  Terkait Pembayaran Siswa?
                </label>
                <p className="text-[10px] text-slate-500 mt-1 ml-6">Pilih jika ingin menyinkronkan data ini ke admin keuangan siswa otomatis.</p>
              </div>

              {editingLedgerIsStudent && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Siswa / Alumni</label>
                    <select 
                      value={editingLedgerStudentName}
                      onChange={(e) => setEditingLedgerStudentName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Pilih Siswa --</option>
                      {Array.from(new Set([
                        ...(systemState.activeStudents || []).map((s: any) => s.name),
                        ...(systemState.registeredStudents || []).map((s: any) => s.name)
                      ])).filter(Boolean).sort().map(name => (
                        <option key={String(name)} value={String(name)}>{String(name)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori Pembayaran</label>
                    <select 
                      value={editingLedgerCategory}
                      onChange={(e) => setEditingLedgerCategory(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white"
                    >
                      <option value="">-- Pilih Kategori --</option>
                      <option value="Administrasi Pendaftaran">Administrasi Pendaftaran</option>
                      <option value="DP Biaya Belajar">DP Biaya Belajar</option>
                      <option value="Pelunasan Biaya Belajar">Pelunasan Biaya Belajar</option>
                      <option value="Pemantapan Materi / Tryout">Pemantapan Materi / Tryout</option>
                      <option value="Biaya Tes Bahasa">Biaya Tes Bahasa</option>
                      <option value="Biaya Tiket Keberangkatan">Biaya Tiket Keberangkatan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setEditingLedger(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer">Batal</button>
              <button onClick={() => {
                 const inAmt = Number((document.getElementById('edit-ledger-in') as HTMLInputElement).value);
                 const outAmt = Number((document.getElementById('edit-ledger-out') as HTMLInputElement).value);
                 const desc = (document.getElementById('edit-ledger-desc') as HTMLInputElement).value;
                 const code = (document.getElementById('edit-ledger-code') as HTMLSelectElement).value;
                 const newDate = (document.getElementById('edit-ledger-date') as HTMLInputElement)?.value || editingLedger.date;
                 
                 onUpdateState('cashLedger', 'edit', { ...editingLedger, inAmount: inAmt, outAmount: outAmt, description: desc, code: code, date: newDate });
                 
                 if (editingLedgerIsStudent && editingLedgerStudentName && editingLedgerCategory) {
                    const existingPayment = (systemState.payments || []).find((p: any) => p.studentName === editingLedgerStudentName && p.category === editingLedgerCategory);
                    if (existingPayment) {
                      onUpdateState('payments', 'edit', { ...existingPayment, amount: existingPayment.amount + inAmt, status: "Lunas", date: newDate || existingPayment.date });
                    } else {
                      onUpdateState('payments', 'add', { 
                        id: 'PAY-' + Date.now(), 
                        studentName: editingLedgerStudentName, 
                        category: editingLedgerCategory, 
                        amount: inAmt, 
                        date: newDate || editingLedger.date || new Date().toLocaleDateString('id-ID'), 
                        status: "Lunas",
                        paymentMethod: "Cash / Tunai"
                      });
                    }
                    alert(`Disinkronkan dengan admin keuangan siswa untuk siswa ${editingLedgerStudentName}.`);
                 }
                 setEditingLedger(null);
              }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer">
                Simpan & Sinkron
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* LOGIN AS MODAL (VVIP ONLY) */}
      {showLoginAsModal && currentUser?.role === "VVIP" && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            onClick={() => setShowLoginAsModal(false)}
          />
          <div className="relative bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
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
                className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl transition-colors active:scale-90"
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
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
                      const isAlumni = ["Lulus", "Di Jepang"].includes(st.status || "") || st.kategoriPendaftaran === "Alumni";
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
                          if (onLoginAs) onLoginAs(user);
                        }}
                        className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-xl transition-all group active:scale-[0.98] cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
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

      {/* PHOTO PREVIEW MODAL */}
      {viewingAttendancePhoto && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingAttendancePhoto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-lg">📷</span>
                <h3 className="text-sm font-bold text-slate-800">Foto Bukti Presensi / Dokumen</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingAttendancePhoto(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex flex-col items-center justify-center bg-slate-900/5 min-h-[300px]">
              <img
                src={viewingAttendancePhoto}
                alt="Bukti Foto"
                className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-md border border-slate-200"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://images.unsplash.com/photo-1584697964400-2ae6a2f620aa?auto=format&fit=crop&w=800&q=80";
                }}
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (viewingAttendancePhoto.startsWith("data:")) {
                    const a = document.createElement("a");
                    a.href = viewingAttendancePhoto;
                    a.download = "bukti_presensi.jpg";
                    a.click();
                  } else {
                    window.open(viewingAttendancePhoto, "_blank");
                  }
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                ⬇️ Unduh / Buka Foto
              </button>
              <button
                type="button"
                onClick={() => setViewingAttendancePhoto(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}