/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ConfirmButton } from "./ConfirmButton";
import { getSafePhotoUrl, createSvgAvatar } from "../lib/storageHelper";
import { calculateAge } from "../lib/dateUtils";
import { computeFinancialMetrics, computeMonthlyExpenseBreakdown } from "../lib/financeCalculations";
import { isGradedAssessment } from "../lib/scoreAveraging";
import { formatPayrollPeriodLabel, getCurrentPayrollPeriodKey, isTimestampInPayrollPeriod } from "../lib/staffAttendancePeriod";
import { downloadStaffAttendanceDetailPdf } from "../lib/attendanceReportPdf";
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
import VvipFullEvalSegment from "./vvip/VvipFullEvalSegment";
import VvipSecuritySegment from "./vvip/VvipSecuritySegment";
import VvipAfiliasiSegment from "./vvip/VvipAfiliasiSegment";
import VvipGajiSegment from "./vvip/VvipGajiSegment";
import VvipGajiSummarySegment from "./vvip/VvipGajiSummarySegment";
import VvipExecSegment from "./vvip/VvipExecSegment";
import VvipKalenderSegment from "./vvip/VvipKalenderSegment";

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
  const [hrAttendancePeriod, setHrAttendancePeriod] = useState<string>(getCurrentPayrollPeriodKey());
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

  const financialMetrics = useMemo(
    () => computeFinancialMetrics(systemState.payments, systemState.cashLedger),
    [systemState.payments, systemState.cashLedger],
  );

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

  const monthlyExpenseBreakdown = useMemo(
    () => computeMonthlyExpenseBreakdown(systemState.cashLedger),
    [systemState.cashLedger],
  );

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
        <VvipExecSegment currentViewMode={currentViewMode} inJapanCount={inJapanCount} setCurrentViewMode={setCurrentViewMode} setMonitorTab={setMonitorTab} setSelectedClassTab={setSelectedClassTab} setShowLoginAsModal={setShowLoginAsModal} studyingCount={studyingCount} systemState={systemState} totalLunasRevenue={totalLunasRevenue} />
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
        <VvipGajiSummarySegment COLORS={COLORS} STATUS_COLORS={STATUS_COLORS} activeStudents={activeStudents} currentViewMode={currentViewMode} financialData={financialData} prefectureDataForChart={prefectureDataForChart} studentStatusDataForChart={studentStatusDataForChart} />
      )}

      {currentViewMode === "gaji" && (
        <VvipGajiSegment financialMetrics={financialMetrics} handleDeletePayment={handleDeletePayment} isReadOnly={isReadOnly} monthlyExpenseBreakdown={monthlyExpenseBreakdown} paidPayments={paidPayments} renderGajiSection={renderGajiSection} setEditingPayment={setEditingPayment} />
      )}

      {/* VVIP SECURITY AUDIT: SECURITY VIEW MODE */}
      {currentViewMode === "security" && (
        <VvipSecuritySegment activeUserMenu={activeUserMenu} auditDateFilter={auditDateFilter} auditSearchQuery={auditSearchQuery} auditTypeFilter={auditTypeFilter} auditUserFilter={auditUserFilter} handleDeleteUser={handleDeleteUser} handleUpdateUserStatus={handleUpdateUserStatus} securityFilter={securityFilter} setActiveUserMenu={setActiveUserMenu} setAuditDateFilter={setAuditDateFilter} setAuditSearchQuery={setAuditSearchQuery} setAuditTypeFilter={setAuditTypeFilter} setAuditUserFilter={setAuditUserFilter} setSecurityFilter={setSecurityFilter} systemState={systemState} />
      )}

      {/* VVIP PARTNER & AFFILIATE MONITORING: STANDALONE MODE */}
      {currentViewMode === "afiliasi" && (
        <VvipAfiliasiSegment affiliateSearch={affiliateSearch} isMobile={isMobile} selectedReferrer={selectedReferrer} setAffiliateSearch={setAffiliateSearch} setSelectedReferrer={setSelectedReferrer} systemState={systemState} />
      )}

      {currentViewMode === "kalender" && (
        <VvipKalenderSegment currentUser={currentUser} onUpdateState={onUpdateState} systemState={systemState} />
      )}

      {(currentViewMode === "full" || currentViewMode === "eval") && (
        <VvipFullEvalSegment activeStudents={activeStudents} classFilter={classFilter} classTabs={classTabs} filterMonth={filterMonth} filterStatus={filterStatus} filterYear={filterYear} getClassMaxBab={getClassMaxBab} hrAttendancePeriod={hrAttendancePeriod} isReadOnly={isReadOnly} lmsClassFilter={lmsClassFilter} monitorTab={monitorTab} officeEnforce={officeEnforce} officeLat={officeLat} officeLon={officeLon} officeRadius={officeRadius} onNavigateToAdmin={onNavigateToAdmin} onUpdateState={onUpdateState} selectedClassTab={selectedClassTab} setClassFilter={setClassFilter} setCurrentViewMode={setCurrentViewMode} setFilterMonth={setFilterMonth} setFilterStatus={setFilterStatus} setFilterYear={setFilterYear} setHrAttendancePeriod={setHrAttendancePeriod} setLmsClassFilter={setLmsClassFilter} setMonitorTab={setMonitorTab} setOfficeLat={setOfficeLat} setOfficeLon={setOfficeLon} setOfficeRadius={setOfficeRadius} setSelectedClassTab={setSelectedClassTab} setSelectedHrAttendanceStaff={setSelectedHrAttendanceStaff} setSelectedSenseiDetail={setSelectedSenseiDetail} setSelectedStudentDetail={setSelectedStudentDetail} setSiswaPage={setSiswaPage} setSiswaTab={setSiswaTab} setStatCardMode={setStatCardMode} setStudentListMode={setStudentListMode} setStudentSearch={setStudentSearch} siswaPage={siswaPage} siswaTab={siswaTab} startVvipEditReg={startVvipEditReg} statCardMode={statCardMode} studentListMode={studentListMode} studentSearch={studentSearch} systemState={systemState} />
      )}

      {/* HR ATTENDANCE DETAIL MODAL */}
      {selectedHrAttendanceStaff && (() => {
        const staff = selectedHrAttendanceStaff;
        const staffLogs = (systemState.logs || [])
          .filter(l => l.type === "PRESENSI_PENGAJAR" && (l.user === staff.name || l.user === staff.username) && isTimestampInPayrollPeriod(l.timestamp || l.time, hrAttendancePeriod))
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

        const handleDownloadDetailPdf = () => {
          downloadStaffAttendanceDetailPdf(
            staff.name,
            staff.username,
            formatPayrollPeriodLabel(hrAttendancePeriod),
            staffLogs.map((log) => {
              const ts = log.timestamp || log.time;
              const dateObj = ts ? new Date(ts) : null;
              return {
                dateLabel: dateObj ? dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-",
                timeLabel: dateObj ? dateObj.toLocaleTimeString("id-ID") : "-",
                status: getPunctuality(log) || "-",
                description: log.description || "Hadir",
                location: log.location || "-",
              };
            }),
          );
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
                    @{staff.username} · {staffLogs.length} Log Presensi · Periode {formatPayrollPeriodLabel(hrAttendancePeriod)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadDetailPdf}
                    className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Unduh PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedHrAttendanceStaff(null)}
                    className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <span className="text-xl font-bold">×</span>
                  </button>
                </div>
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

          // Only chapters actually graded count toward the average - an
          // ungraded chapter (coerced to a 0 score above for table display)
          // must not drag the average down as if the student failed it.
          const gradedAssessments = actualAssessments.filter(isGradedAssessment);
          const avgScore =
            gradedAssessments.length > 0
              ? gradedAssessments.reduce((sum, item) => sum + (item.score || 0), 0) / gradedAssessments.length
              : 0;

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