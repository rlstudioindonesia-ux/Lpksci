/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  CheckCircle2,
  XCircle,
  DollarSign,
  Package,
  FileText,
  Plus,
  Trash2,
  History,
  CreditCard,
  ChevronRight,
  Calculator,
  Check,
  Edit,
  AlertCircle,
  ShoppingBag,
  Sliders,
  Palette,
  Settings,
  GraduationCap,
  Award,
  BookOpen,
  Globe,
  Anchor,
  Compass,
  Sparkles,
  Heart,
  Landmark,
  Image,
  MapPin,
  Camera,
  X,
  Menu,
  ChevronLeft,
  Bell,
  Upload,
  Eye,
  EyeOff,
  Receipt,
  CheckSquare,
  LayoutTemplate,
  ShieldCheck,
  Share2,
  Search,
  Filter,
  Calendar,
  Loader2, LoaderCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw, Star,
  LayoutDashboard, Wallet, ChevronDown,
  BarChart3, PieChart as LucidePieChart, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import { uploadFileToFirebase, getEmbeddablePdfUrl, getSafePhotoUrl, createSvgAvatar } from "../lib/storageHelper";
import {
  SystemState,
  RegisteredStudent,
  ActiveStudent,
  PaymentRecord,
  InventoryItem,
  TaxRecord,
  JAPAN_PREFECTURES,
  UserAccount,
  ALL_48_PREFECTURES_COORDINATES,
} from "../types";
import { ConfirmForm } from "./ConfirmForm";
import { StudentActivitySummary } from "./StudentActivitySummary";
import { ConfirmButton } from "./ConfirmButton";
import StudentCvView from "./StudentCvView";
import AdminKelasSegment from "./admin/AdminKelasSegment";
import AdminDataCvSegment from "./admin/AdminDataCvSegment";
import AdminPetaSebaranSegment from "./admin/AdminPetaSebaranSegment";
import AdminAfiliasiSegment from "./admin/AdminAfiliasiSegment";
import AdminInformasiSegment from "./admin/AdminInformasiSegment";
import AdminAlumniVipSegment from "./admin/AdminAlumniVipSegment";
import AdminInventarisSegment from "./admin/AdminInventarisSegment";
import AdminPajakSegment from "./admin/AdminPajakSegment";
import AdminJobOrdersSegment from "./admin/AdminJobOrdersSegment";
import AdminSiswaSegment from "./admin/AdminSiswaSegment";
import AdminGaleriSegment from "./admin/AdminGaleriSegment";
import CalendarView from "./CalendarView";
import AccountSettingsView from "./AccountSettingsView";
import { StudentDocsManager } from "./admin/StudentDocsManager";
import { JobScheduleConfigPanel } from "./admin/JobScheduleConfigPanel";
import { CHAPTERS_LIST } from "../chapters";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PembayaranSiswaView, { getStudentPayments } from "./PembayaranSiswaView";

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

const resizeImage = (
  file: File,
  maxWidth: number,
  maxHeight: number,
  callback: (str: string) => void,
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new window.Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        callback(e.target?.result as string);
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

interface AdminViewProps { systemState: any; currentUser: any; onUpdateState: any; initialSegment?: any; onSegmentChange?: (segment: any) => void; initialStudentSearch?: string; }
export const sortStudentsByDateDesc = (a: any, b: any) => {
  const idA = parseInt((a.id || "").replace(/\D/g, "") || "0");
  const idB = parseInt((b.id || "").replace(/\D/g, "") || "0");
  if (idA !== idB) return idB - idA;
  
  const getSortValue = (s: any) => {
    if (s.timestamp) return new Date(s.timestamp).getTime() || 0;
    if (s.date && s.date.split('-').length === 3) return new Date(s.date).getTime() || 0;
    return 0;
  };
  return getSortValue(b) - getSortValue(a);
};

export default function AdminView({
  systemState,
  currentUser,
  onUpdateState,
  initialSegment,
  onSegmentChange,
  initialStudentSearch,
}: AdminViewProps) {
  const [activeSegment, setActiveSegment] = useState<
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
    | "alumnivip"
    | null
  >(
    initialSegment ||
      (typeof window !== "undefined" && window.innerWidth < 768
        ? null
        : "siswa"),
  );

  const [showCostConfig, setShowCostConfig] = useState(false);

  const isAlumniClass = (className: string) => {
    if (!className) return false;
    if (className.toLowerCase().includes("alumni")) return true;
    const foundClass = (systemState?.customization?.lmsClasses || []).find(
      (c: any) => c.name?.toLowerCase() === className.toLowerCase()
    );
    return foundClass?.type === "alumni";
  };

  const handlePrintInvoiceSummary = async (paySummary: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(24);
    doc.setTextColor(50, 50, 50);
    doc.text("INVOICE", pageWidth - 15, 20, { align: "right" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`# ${new Date().getTime().toString().slice(-6)}`, pageWidth - 15, 28, { align: "right" });

    // Logo / Company Name
    let currentY = 20;
    const logoUrl = systemState?.customization?.logoUrl || "/logo.png";
    if (logoUrl) {
      try {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = logoUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          const ratio = img.width / img.height;
          const height = 12;
          const width = height * ratio;
          doc.addImage(dataUrl, "PNG", 15, 12, width, height);
          currentY = 30; // Push text down
        } else {
           doc.setFontSize(18);
           doc.setTextColor(30, 64, 175);
           doc.text(systemState?.customization?.logoText || "LPK SCI", 15, 20);
        }
      } catch (e) {
        doc.setFontSize(18);
        doc.setTextColor(30, 64, 175);
        doc.text(systemState?.customization?.logoText || "LPK SCI", 15, 20);
      }
    } else {
      doc.setFontSize(18);
      doc.setTextColor(30, 64, 175);
      doc.text(systemState?.customization?.logoText || "LPK SCI", 15, 20);
    }
    
    // Address
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Jalan Raya Bongsri, Muktiharjo Kec Tlogowungu", 15, currentY + 8);
    doc.text("Kab Pati Kode pos 59163, Jawa Tengah", 15, currentY + 13);
    
    // Dates
    doc.text("Tanggal:", pageWidth - 55, 45);
    doc.text(new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth - 15, 45, { align: "right" });
    
    // Student Info
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Pembayaran kepada:", 15, 50);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(paySummary.studentName, 15, 56);
    doc.setFont("helvetica", "normal");
    
    // Total Tagihan Banner
    doc.setFillColor(245, 245, 245);
    doc.rect(pageWidth - 80, 52, 65, 10, "F");
    doc.setFontSize(10);
    doc.text("Sisa Tagihan:", pageWidth - 75, 59);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${paySummary.totalPending.toLocaleString("id-ID")}`, pageWidth - 18, 59, { align: "right" });
    doc.setFont("helvetica", "normal");

    // Table
    const tableData = [
      ["Summary Tagihan LPK", paySummary.receiptsCount.toString(), `Rp ${(paySummary.totalPaid + paySummary.totalPending).toLocaleString("id-ID")}`, `Rp ${(paySummary.totalPaid + paySummary.totalPending).toLocaleString("id-ID")}`],
      ["Sudah Dibayar (Lunas)", "", "", `- Rp ${paySummary.totalPaid.toLocaleString("id-ID")}`]
    ];

    autoTable(doc, {
      startY: 75,
      head: [['Keterangan Tagihan', 'Total TRX', 'Biaya', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      foot: [['', '', 'Total Sisa:', `Rp ${paySummary.totalPending.toLocaleString("id-ID")}`]],
      footStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: 'bold', halign: 'right' }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Ketentuan:", 15, finalY + 20);
    doc.setTextColor(50, 50, 50);
    doc.text("Pembayaran dilakukan melalui transfer bank di nomor rekening berikut:", 15, finalY + 26);
    // Print accounts if available
    if (systemState?.customization?.paymentAccounts?.length > 0) {
        let yOffset = finalY + 32;
        systemState.customization.paymentAccounts.forEach((acc: any) => {
            doc.text(`A.N ${acc.holderName} BANK ${acc.bankName}_${acc.accountNumber}`, 15, yOffset);
            yOffset += 6;
        });
    } else {
        doc.text("Silakan hubungi admin LPK untuk informasi rekening bank resmi.", 15, finalY + 32);
    }
    
    doc.save(`Invoice_${paySummary.studentName.replace(/\s+/g, "_")}.pdf`);
  };

  const handleSendInvoiceNotification = async (paySummary: any) => {
    const studentUser = systemState.users?.find((u) => u.name === paySummary.studentName);
    if (studentUser) {
      await onUpdateState("messages", "send", {
        senderId: currentUser.username,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        receiverId: studentUser.username,
        text: `Invoice tagihan Anda telah diperbarui. Silakan cek portal pembayaran Anda. Total Lunas: Rp ${paySummary.totalPaid.toLocaleString("id-ID")}, Sisa Tagihan Tertunda: Rp ${paySummary.totalPending.toLocaleString("id-ID")}.`,
        timestamp: new Date().toISOString(),
        isRead: false,
      });
      alert(`Notifikasi tagihan berhasil dikirim ke siswa ${paySummary.studentName}.`);
    } else {
      alert(`Gagal mengirim notifikasi: Akun untuk siswa ${paySummary.studentName} belum terdaftar di sistem.`);
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    onUpdateState('payments', 'delete', { id: paymentId });
  };

  const [costRegistration, setCostRegistration] = useState(systemState.costConfig?.registration ?? 500000);
  const [costDP, setCostDP] = useState(systemState.costConfig?.dp ?? 3500000);
  const [costFullPayment, setCostFullPayment] = useState(systemState.costConfig?.fullPayment ?? 2000000);
  const [costManagementFee, setCostManagementFee] = useState(systemState.costConfig?.managementFee ?? 5000000);

  const handleSaveCostConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateState('costConfig', 'update', { 
        registration: costRegistration,
        dp: costDP,
        fullPayment: costFullPayment,
        managementFee: costManagementFee
       });
    alert("Konfigurasi SOP Biaya Resmi berhasil disimpan!");
    setShowCostConfig(false);
  };


  React.useEffect(() => {
    if (initialSegment) {
      setActiveSegment(initialSegment);
    }
  }, [initialSegment]);

  React.useEffect(() => {
    if (initialStudentSearch) {
      setActiveSegment("siswa");
      setSiswaTab("aktif");
      setSiswaSearch(initialStudentSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStudentSearch]);

  React.useEffect(() => {
    if (onSegmentChange && activeSegment) {
      onSegmentChange(activeSegment);
    }
    // Auto scroll to top of screen on segment change to prevent layout position jumps
    if (typeof window !== "undefined" && activeSegment) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSegment, onSegmentChange]);

  // State to track expanded documents accordion per student ID
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [verifyingDocsStudent, setVerifyingDocsStudent] = useState<any>(null);
  const [selectedClassToPlot, setSelectedClassToPlot] = useState("");
  const [viewingCvStudentId, setViewingCvStudentId] = useState<string | null>(null);

  // States for Admin Menu
  const [isMenuMinimized, setIsMenuMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateJobOrderModalOpen, setIsCreateJobOrderModalOpen] = useState(false);
  const [editingJobOrder, setEditingJobOrder] = useState<any | null>(null);
  const [isCreateInventoryModalOpen, setIsCreateInventoryModalOpen] = useState(false);
  const [isCreateTaxModalOpen, setIsCreateTaxModalOpen] = useState(false);
  const [isCreateMapModalOpen, setIsCreateMapModalOpen] = useState(false);

  // Custom Chapters State for Class Management
  const [selectedClassForChapters, setSelectedClassForChapters] = useState<any | null>(null);
  const [newChapterNumber, setNewChapterNumber] = useState<number>(1);
  const [newChapterTitle, setNewChapterTitle] = useState<string>("");
  const [newChapterJapaneseTitle, setNewChapterJapaneseTitle] = useState<string>("");
  const [newChapterDesc, setNewChapterDesc] = useState<string>("");
  const [editingChapterNumber, setEditingChapterNumber] = useState<number | null>(null);
  const [activeChapterTab, setActiveChapterTab] = useState<"list" | "form">("list");

  // Job Order creation parameters states
  const [jobPartnerName, setJobPartnerName] = useState("");
  const [jobNoReg, setJobNoReg] = useState("");
  const [jobOccupation, setJobOccupation] = useState("");
  const [jobType, setJobType] = useState("Tokutei ginou");
  const [jobLocation, setJobLocation] = useState("");
  const [activeKeuanganFeature, setActiveKeuanganFeature] = useState<string | null>('riwayat-dana');
  const [jobSalary, setJobSalary] = useState("");
  const [jobOvertime, setJobOvertime] = useState("");
  const [jobAllowance, setJobAllowance] = useState("");
  const [jobContractDuration, setJobContractDuration] = useState("");
  const [jobTbReq, setJobTbReq] = useState("");
  const [jobBbReq, setJobBbReq] = useState("");
  const [jobIntvExec, setJobIntvExec] = useState("");
  const [jobIntvDate, setJobIntvDate] = useState("");
  const [jobGender, setJobGender] = useState("");
  const [jobAgeRequirement, setJobAgeRequirement] = useState("");
  const [jobRecruitCount, setJobRecruitCount] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobMinJapaneseScore, setJobMinJapaneseScore] = useState("");
  const [jobMinAttendanceScore, setJobMinAttendanceScore] = useState("");
  const [jobMinFiveSScore, setJobMinFiveSScore] = useState("");
  const [jobMinMathScore, setJobMinMathScore] = useState("");
  const [jobMinEthicsScore, setJobMinEthicsScore] = useState("");
  const [jobScheduleRegistration, setJobScheduleRegistration] = useState("");
  const [jobScheduleDocumentSelection, setJobScheduleDocumentSelection] = useState("");
  const [jobScheduleAnnouncement, setJobScheduleAnnouncement] = useState("");
  const [jobScheduleMcu, setJobScheduleMcu] = useState("");

  // Recommendations management local states
  const [recoSiswaId, setRecoSiswaId] = useState<Record<string, string>>({}); // Job ID -> Student ID select values
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const [viewingDocUrl, setViewingDocUrl] = useState<{url: string, title?: string} | null>(null);
  const [docZoom, setDocZoom] = useState<number>(1);
  const [docRotation, setDocRotation] = useState<number>(0);

  React.useEffect(() => {
    setDocZoom(1);
    setDocRotation(0);
  }, [viewingDocUrl]);

  const isStudentRoleOnly = (s: any) => {
    const nameLower = (s.name || "").toLowerCase();
    if (nameLower.includes("sensei") || nameLower.includes("admin") || nameLower.includes("pengajar")) {
      return false;
    }
    const user = systemState.users?.find((u: any) => 
      (u.studentId && u.studentId === s.id) || 
      (u.name && u.name.trim().toLowerCase() === s.name.trim().toLowerCase())
    );
    if (user && ["Admin", "Pengajar", "Admin Biasa", "Admin Super", "VVIP"].includes(user.role)) {
      return false;
    }
    return true;
  };

  const [siswaTab, setSiswaTab] = useState<"aktif" | "baru" | "alumni" | "rekap" | "sensei">("aktif");
  const [siswaPage, setSiswaPage] = useState(1);
  const [siswaSearch, setSiswaSearch] = useState("");
  const [syncingStudents, setSyncingStudents] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [outOfSyncActive, setOutOfSyncActive] = useState<any[]>([]);
  const [outOfSyncRegistered, setOutOfSyncRegistered] = useState<any[]>([]);

  const checkSyncStatus = () => {
    const allUsers = systemState.unfilteredUsers || systemState.users || [];
    
    // Find active students with no matching user account
    const ghostActive = (systemState.activeStudents || []).filter(student => {
      const hasUser = allUsers.some(u => 
        (u.studentId && u.studentId === student.id) ||
        (u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase()) ||
        (u.email && student.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
        (u.username && student.email && u.username.trim().toLowerCase() === student.email.trim().toLowerCase())
      );
      return !hasUser;
    });

    // Find approved registered students with no matching user account
    const ghostRegistered = (systemState.registeredStudents || []).filter(student => {
      if (student.status !== "Disetujui") return false;
      const hasUser = allUsers.some(u => 
        (u.studentId && u.studentId === student.id) ||
        (u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase()) ||
        (u.email && student.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase()) ||
        (u.username && student.email && u.username.trim().toLowerCase() === student.email.trim().toLowerCase())
      );
      return !hasUser;
    });

    setOutOfSyncActive(ghostActive);
    setOutOfSyncRegistered(ghostRegistered);
    setShowSyncModal(true);
  };

  const handleSyncStudents = async () => {
    setSyncingStudents(true);
    let successCount = 0;
    try {
      // Delete ghost active students
      for (const student of outOfSyncActive) {
        const ok = await onUpdateState("activeStudents", "delete", { id: student.id });
        if (ok) successCount++;
      }
      // Delete ghost registered students
      for (const student of outOfSyncRegistered) {
        const ok = await onUpdateState("registeredStudents", "delete", { id: student.id });
        if (ok) successCount++;
      }
      alert(`Sinkronisasi selesai! Berhasil menghapus ${successCount} data siswa yang akunnya sudah tidak ada di database.`);
      setShowSyncModal(false);
    } catch (error) {
      console.error("Error synchronizing students:", error);
      alert("Terjadi kesalahan saat melakukan sinkronisasi.");
    } finally {
      setSyncingStudents(false);
    }
  };

  // Affiliate / Referral dashboard local states
  const [selectedReferrer, setSelectedReferrer] = useState<string>("all");
  const [affiliateSearch, setAffiliateSearch] = useState<string>("");

  const toggleDocExpand = (id: string) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const [verifyingPayment, setVerifyingPayment] = useState<PaymentRecord | null>(null);
  // Local state variables for branding and slideshow customization
  const [payStudent, setPayStudent] = useState("");
  const [searchPayStudent, setSearchPayStudent] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payCategory, setPayCategory] = useState("SPP Bulanan");
  const [payMethod, setPayMethod] = useState("Transfer");
  const [payStatus, setPayStatus] = useState("Menunggu");
  // Local state variables for branding and slideshow customization
  const [custLogoText, setCustLogoText] = useState("");
  const [custLogoIcon, setCustLogoIcon] = useState("");
  const [custThemeColor, setCustThemeColor] = useState("");
  const [custLogoUrl, setCustLogoUrl] = useState("");
  const [custFaviconUrl, setCustFaviconUrl] = useState("");
  const [custSlides, setCustSlides] = useState<any[]>([]);
  const [custGallery, setCustGallery] = useState<any[]>([]);
  const [custLandingConfig, setCustLandingConfig] = useState<any>({});
  const [oppUploadStatus, setOppUploadStatus] = useState<Record<number, 'loading'|'success'>>({});
  const [galleryUploadStatus, setGalleryUploadStatus] = useState<Record<number, 'loading'|'success'>>({});
  const [sliderUploadStatus, setSliderUploadStatus] = useState<Record<number, 'loading'|'success'>>({});
  const [custRunningText, setCustRunningText] = useState("");
  const [officeLat, setOfficeLat] = useState("");
  const [officeLon, setOfficeLon] = useState("");
  const [officeRadius, setOfficeRadius] = useState("");
  const [officeEnforce, setOfficeEnforce] = useState<boolean | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [slideSaveSuccess, setSlideSaveSuccess] = useState(false);
  const [landingSaveSuccess, setLandingSaveSuccess] = useState(false);
  const [runningTextSaveSuccess, setRunningTextSaveSuccess] = useState(false);
  const [custLatestApkVersion, setCustLatestApkVersion] = useState("");
  const [custApkUpdateNotes, setCustApkUpdateNotes] = useState("");
  const [custPlayStoreUrl, setCustPlayStoreUrl] = useState("");
  const [apkUpdateSaveSuccess, setApkUpdateSaveSuccess] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState<number | null>(null);
  React.useEffect(() => {
    if (systemState?.customization) {
      setCustLogoText(
        (prev) =>
          prev || systemState.customization?.logoText || "LPK Source Course",
      );
      setCustLogoIcon(
        (prev) =>
          prev || systemState.customization?.logoIcon || "GraduationCap",
      );
      setCustThemeColor(
        (prev) => prev || systemState.customization?.themeColor || "blue",
      );
      setCustLogoUrl(
        (prev) => prev || systemState.customization?.logoUrl || "",
      );
      setCustFaviconUrl(
        (prev) => prev || systemState.customization?.faviconUrl || "",
      );
      setCustSlides((prev) => {
        // Only update from systemState if local state is empty
        // We avoid overwriting while user is actively in the admin panel to prevent data loss during sync
        if (prev.length === 0) {
          return systemState.slideshows || [];
        }
        return prev;
      });
      setCustGallery((prev) => {
        if (prev.length > 0) return prev;
        return systemState.galleries || [];
      });
      setCustRunningText(
        (prev) => prev || systemState.customization?.runningText || "",
      );
      setCustLatestApkVersion(
        (prev) => prev || (systemState.customization as any)?.latestApkVersion || "",
      );
      setCustApkUpdateNotes(
        (prev) => prev || (systemState.customization as any)?.apkUpdateNotes || "",
      );
      setCustPlayStoreUrl(
        (prev) => prev || (systemState.customization as any)?.playStoreUrl || "",
      );
      setCustLandingConfig((prev: any) => {
        if (systemState.customization?.landingConfig && !prev?._loadedFromDb) {
           const dbConfig = { ...systemState.customization.landingConfig, _loadedFromDb: true };
           if (!dbConfig.opportunityImages) dbConfig.opportunityImages = [];
           if (!dbConfig.alumniClasses) dbConfig.alumniClasses = [];
           if (!dbConfig.programs) dbConfig.programs = [];
           if (!dbConfig.testimonials) dbConfig.testimonials = [];
           if (!dbConfig.perks) dbConfig.perks = [];
           return dbConfig;
        }
        const hasPrev = prev && Object.keys(prev).length > 0;
        const config = (hasPrev ? prev : systemState.customization?.landingConfig) || {
          ecosystemTitle: "Ekosistem Pendidikan & Penyaluran Karir",
          ecosystemSubtitle: "Selamat bergabung di portal resmi LPK SCI. Kami menghadirkan platform belajar terpadu untuk mendampingi langkah sukses Anda menuju Jepang.",
          perks: [],
          alumniTitle: "Kisah Sukses Alumni",
          alumniSubtitle: "Testimoni alumni kami yang telah sukses bekerja di Jepang.",
          testimonials: [],
          programsTitle: "Program Pelatihan",
          programsSubtitle: "Pilih jalur karir yang sesuai dengan minat dan keahlian Anda.",
          programs: []
        };

        if (!config.opportunityImages) {
          config.opportunityImages = [];
        }
        
        // Ensure Alumni VIP defaults are present if undefined
        if (!config.alumniPackageTagline) config.alumniPackageTagline = "Home / Pilih Kelas";
        if (!config.alumniPackageTitle) config.alumniPackageTitle = "Pilih Kelas Bahasa Jepang";
        if (!config.alumniPackageBannerTitle) config.alumniPackageBannerTitle = "Belajar Langsung dengan Ahlinya!";
        if (!config.alumniPackageBannerSubtitle) config.alumniPackageBannerSubtitle = "Didukung oleh Sensei Bersertifikasi N1 dan Native Speaker Jepang";
        
        if (!config.alumniClasses || config.alumniClasses.length === 0) {
          config.alumniClasses = [
            {
              id: "al_default_1",
              method: "Online & Offline",
              level: "N3",
              emoji: "⛩️",
              title: "Level N3",
              description: "Membangun dasar yang kuat untuk komunikasi sehari-hari & persiapan kerja di Jepang.",
              features: ['Kosakata & Tata Bahasa Dasar', 'Percakapan Sehari-hari', 'Persiapan ujian JLPT N3'],
              duration: "3-4 Bulan",
              colorScheme: "emerald",
              registered: 8,
              quota: 10,
              openClass: "19 Agustus 2026",
              discount: "20%",
              discountText: "Diskon Hemat Rp 200.000",
              originalPrice: "Rp 1.200.000",
              finalPrice: "Rp 1.000.000"
            },
            {
              id: "al_default_2",
              method: "Online & Offline",
              level: "N2",
              emoji: "🗻",
              title: "Level N2",
              description: "Tingkatkan kemampuan bahasa untuk komunikasi lebih luas & dunia kerja.",
              features: ['Kosakata & Tata Bahasa Menengah', 'Pemahaman Bacaan & Listening', 'Persiapan JLPT N2'],
              duration: "4-6 Bulan",
              colorScheme: "blue",
              registered: 7,
              quota: 15,
              openClass: "26 Agustus 2026",
              discount: "15%",
              discountText: "Diskon Hemat Rp 195.000",
              originalPrice: "Rp 1.495.000",
              finalPrice: "Rp 1.300.000"
            },
            {
              id: "al_default_3",
              method: "Online & Offline",
              level: "N1",
              emoji: "🏯",
              title: "Level N1",
              description: "Kuasai bahasa Jepang tingkat lanjut untuk keperluan akademik, bisnis, & profesional.",
              features: ['Kosakata & Tata Bahasa Lanjutan', 'Kemampuan Diskusi & Presentasi', 'Persiapan JLPT N1'],
              duration: "6-8 Bulan",
              colorScheme: "purple",
              registered: 3,
              quota: 8,
              openClass: "1 September 2026",
              discount: "10%",
              discountText: "Diskon Hemat Rp 150.000",
              originalPrice: "Rp 1.650.000",
              finalPrice: "Rp 1.500.000"
            },
            {
              id: "al_default_4",
              method: "Online & Offline",
              level: "NATIVE",
              emoji: "🪭",
              title: "Level Native",
              description: "Belajar seperti orang Jepang! Fasih, natural, dan percaya diri dalam segala situasi.",
              features: ['Ekspresi Natural & Idiom', 'Komunikasi Bisnis & Budaya Jepang', 'Praktik Langsung dengan Native Speaker'],
              duration: "Fleksibel",
              colorScheme: "orange",
              registered: 4,
              quota: 10,
              openClass: "Setiap Senin",
              discount: "5%",
              discountText: "Diskon Hemat Rp 100.000",
              originalPrice: "Rp 1.900.000",
              finalPrice: "Rp 1.800.000"
            }
          ];
        }
        return config;
      });

      // No hardcoded coordinate default: an unconfigured office location must fail
      // safe (geofencing off) rather than silently enforcing an arbitrary city.
      const loc = systemState.customization?.officeLocation || { latitude: "", longitude: "", radius: 200, enforce: false };
      setOfficeLat(prev => prev || String(loc.latitude ?? ""));
      setOfficeLon(prev => prev || String(loc.longitude ?? ""));
      setOfficeRadius(prev => prev || String(loc.radius ?? 200));
      setOfficeEnforce(prev => prev !== null ? prev : (loc.enforce === true));
    }
  }, [systemState?.customization]);

  const [custLogoDragActive, setCustLogoDragActive] = useState(false);
  const [custFaviconDragActive, setCustFaviconDragActive] = useState(false);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileToFirebase(file, "customization").then(url => setCustLogoUrl(url)).catch(err => { console.error(err); alert("Gagal upload logo"); });
    }
  };

  const handleLogoDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCustLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setCustLogoDragActive(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustLogoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        uploadFileToFirebase(file, "customization").then(url => setCustLogoUrl(url)).catch(err => { console.error(err); alert("Gagal upload logo"); });
      }
    }
  };

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileToFirebase(file, "customization").then(url => setCustFaviconUrl(url)).catch(err => { console.error(err); alert("Gagal upload favicon"); });
    }
  };

  const handleFaviconDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCustFaviconDragActive(true);
    } else if (e.type === "dragleave") {
      setCustFaviconDragActive(false);
    }
  };

  const handleFaviconDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustFaviconDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        uploadFileToFirebase(file, "customization").then(url => setCustFaviconUrl(url)).catch(err => { console.error(err); alert("Gagal upload favicon"); });
      }
    }
  };

  const handleSaveCustomization = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const ok = await onUpdateState("customization", "update", {
      logoText: custLogoText,
      logoIcon: custLogoIcon,
      themeColor: custThemeColor,
      logoUrl: custLogoUrl,
      faviconUrl: custFaviconUrl,
    });
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };
  // Local Form state for Inventory adding
  const adminMapRef = React.useRef<HTMLDivElement>(null);
  const adminMapInstanceRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (activeSegment !== "petasebaran") return;

    const linkId = "leaflet-css-pkg-admin";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
    const scriptId = "leaflet-js-pkg-admin";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      document.body.appendChild(script);
    }

    const loadAdminRadarMap = () => {
      const L = (window as any).L;
      if (!L || !adminMapRef.current) return;

      if (adminMapInstanceRef.current) {
        adminMapInstanceRef.current.remove();
        adminMapInstanceRef.current = null;
      }

      const map = L.map(adminMapRef.current, {
        center: [36.2048, 138.2529],
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      adminMapInstanceRef.current = map;
      setTimeout(() => { try { if (map && map._container) map.invalidateSize(); } catch (e) {} }, 250);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      ).addTo(map);

      const defaultCoordinates = ALL_48_PREFECTURES_COORDINATES;
      const expatriates =
        systemState.activeStudents?.filter((s) => s.status === "Di Jepang") ||
        [];

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

      Object.keys(groups).forEach((key) => {
        const group = groups[key];
        const numAlumni = group.alumni.length;
        const marker = L.circleMarker([group.lat, group.lng], {
          radius: 12 + Math.min(numAlumni, 8),
          fillColor: "#ef4444",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95,
        }).addTo(map);

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
          setSelectedMapPref(group.cityName);
          map.setView([group.lat, group.lng], 10, { animate: false });
        });
      });

      map.on("click", () => {
        setSelectedMapPref(null);
      });
    };

    if ((window as any).L) {
      loadAdminRadarMap();
    } else {
      script.addEventListener("load", loadAdminRadarMap);
    }

    return () => {
      if (adminMapInstanceRef.current) {
        adminMapInstanceRef.current.remove();
        adminMapInstanceRef.current = null;
      }
    };
  }, [activeSegment, systemState.activeStudents]);

  const [invName, setInvName] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invCondition, setInvCondition] = useState<
    "Baik" | "Rusak" | "Perlu Servis"
  >("Baik");
  const [invLoc, setInvLoc] = useState<string>("Kantor Utama Manajemen");
  const [inventoryAreaFilter, setInventoryAreaFilter] = useState<string>("ALL");

  // Inventory Area Management State
  const [isManageInventoryAreasModalOpen, setIsManageInventoryAreasModalOpen] = useState(false);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState("");
  const [editingAreaOldName, setEditingAreaOldName] = useState<string | null>(null);
  const [editingAreaNewName, setEditingAreaNewName] = useState("");

  // Edit Inventory Item State
  const [editingInventoryItem, setEditingInventoryItem] = useState<any | null>(null);
  const [editInvName, setEditInvName] = useState("");
  const [editInvAmount, setEditInvAmount] = useState("");
  const [editInvCondition, setEditInvCondition] = useState<"Baik" | "Rusak" | "Perlu Servis">("Baik");
  const [editInvLoc, setEditInvLoc] = useState("");

  const getAvailableInventoryAreas = (): string[] => {
    const defaultAreas = [
      "Kantor Utama Manajemen",
      "Rumah Asrama Putra",
      "Rumah Asrama Putri",
    ];
    const lmsClassesAreas = (systemState.customization?.lmsClasses || []).map(
      (cls: any) => `Ruang Belajar ${cls.name}`
    );
    const customAreas = systemState.customization?.inventoryAreas || [];
    const existingItemLocations = (systemState.inventory || [])
      .map((item: any) => item.location)
      .filter(Boolean);

    const allSet = new Set<string>([
      ...defaultAreas,
      ...lmsClassesAreas,
      ...customAreas,
      ...existingItemLocations,
    ]);
    return Array.from(allSet);
  };

  const handleAddNewArea = async (areaName: string) => {
    const trimmed = areaName.trim();
    if (!trimmed) return;
    const currentAreas = systemState.customization?.inventoryAreas || [];
    if (!currentAreas.includes(trimmed)) {
      const updatedAreas = [...currentAreas, trimmed];
      await onUpdateState("customization", "update", {
        inventoryAreas: updatedAreas,
      });
    }
    setInvLoc(trimmed);
    if (editingInventoryItem) {
      setEditInvLoc(trimmed);
    }
    setNewAreaInput("");
    setIsAddAreaModalOpen(false);
  };

  const handleRenameArea = async (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew || oldName === trimmedNew) return;

    const currentAreas = systemState.customization?.inventoryAreas || [];
    let updatedAreas = currentAreas.map(a => a === oldName ? trimmedNew : a);
    if (!updatedAreas.includes(trimmedNew)) {
      updatedAreas.push(trimmedNew);
    }
    await onUpdateState("customization", "update", { inventoryAreas: updatedAreas });

    const itemsToUpdate = (systemState.inventory || []).filter(item => item.location === oldName);
    for (const item of itemsToUpdate) {
      await onUpdateState("inventory", "edit", {
        ...item,
        location: trimmedNew
      });
    }

    if (invLoc === oldName) setInvLoc(trimmedNew);
    if (editInvLoc === oldName) setEditInvLoc(trimmedNew);
    setEditingAreaOldName(null);
    setEditingAreaNewName("");
  };

  const handleDeleteArea = async (areaToDelete: string) => {
    const currentAreas = systemState.customization?.inventoryAreas || [];
    const updatedAreas = currentAreas.filter(a => a !== areaToDelete);
    await onUpdateState("customization", "update", { inventoryAreas: updatedAreas });
  };

  const handleSaveEditInventory = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editingInventoryItem || !editInvName || !editInvAmount) return;
    const ok = await onUpdateState("inventory", "edit", {
      id: editingInventoryItem.id,
      itemName: editInvName,
      amount: Number(editInvAmount),
      condition: editInvCondition,
      location: editInvLoc,
    });
    if (ok) {
      setEditingInventoryItem(null);
    }
  };

  // Local Form state for Tax adding & editing
  const [taxMonth, setTaxMonth] = useState("");
  const [taxRev, setTaxRev] = useState("");
  const [taxExp, setTaxExp] = useState("");
  const [taxRate, setTaxRate] = useState("0.11");
  const [taxStatus, setTaxStatus] = useState<"Draft" | "Final/Dilaporkan">("Draft");
  const [taxNotes, setTaxNotes] = useState("");
  const [taxSptFile, setTaxSptFile] = useState("");
  const [taxFinancialReportFile, setTaxFinancialReportFile] = useState("");
  const [isEditTaxModalOpen, setIsEditTaxModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editingLedger, setEditingLedger] = useState<any | null>(null);
  const [editingLedgerIsStudent, setEditingLedgerIsStudent] = useState(false);
  const [editingLedgerStudentName, setEditingLedgerStudentName] = useState("");
  const [editingLedgerCategory, setEditingLedgerCategory] = useState("");
  const [previewTaxFile, setPreviewTaxFile] = useState<string | null>(null);
  const [previewTaxFileName, setPreviewTaxFileName] = useState("");

  // Local state for salary tracking
  const [salarySubTab, setSalarySubTab] = useState<"buku_kas" | "penggajian" | "hr" | "grafik_cashflow">("buku_kas");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState("ALL");

  useEffect(() => {
    if (currentUser?.role === "Admin Biasa") {
      setSalarySubTab("hr");
    }
  }, [currentUser]);
  const [hrFilterMonth, setHrFilterMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedStaffForQuickPay, setSelectedStaffForQuickPay] = useState<string | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState<string>("4500000");
  const [quickPayNotes, setQuickPayNotes] = useState<string>("");
  const [salMonth, setSalMonth] = useState("");
  const [salAmount, setSalAmount] = useState("");
  const [salStaffName, setSalStaffName] = useState("");
  const [salRole, setSalRole] = useState("Pengajar");
  const [salStatus, setSalStatus] = useState<"Lunas" | "Pending">("Pending");
  const [salPaymentDate, setSalPaymentDate] = useState("");
  const [salNotes, setSalNotes] = useState("");
  const [editingSalId, setEditingSalId] = useState<string | null>(null);

  // Local Form state for Peta Sebaran (Alumni Map)
  const [mapStudentId, setMapStudentId] = useState("");
  const [mapCity, setMapCity] = useState("");
  const [mapCompany, setMapCompany] = useState("");
  const [mapPrefecture, setMapPrefecture] = useState("Tokyo");
  const [mapLatitude, setMapLatitude] = useState("");
  const [mapLongitude, setMapLongitude] = useState("");
  const [mapGraduationYear, setMapGraduationYear] = useState("");
  const [mapStudentName, setMapStudentName] = useState("");
  const [mapBatch, setMapBatch] = useState("Angkatan 11");
  const [mapIsEditing, setMapIsEditing] = useState<string | null>(null);
  const [selectedMapPref, setSelectedMapPref] = useState<string | null>(null);
  const [sebaranPage, setSebaranPage] = useState(1);
  const [presetSearch, setPresetSearch] = useState("");

  // Local Form state for Account settings
  const [accBankName, setAccBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accHolder, setAccHolder] = useState("");
  const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);
  const [expandedAlumniClassIds, setExpandedAlumniClassIds] = useState<string[]>([]);

  // Filter States
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [statCardMode, setStatCardMode] = useState<"kelas" | "status">("kelas");

  // Admin states for editing complete student data (RegisteredStudent format)
  const [adminEditingStudentId, setAdminEditingStudentId] = useState<
    string | null
  >(null);
  const [adminRegData, setAdminRegData] = useState<any>({});
  const [showAdminRegPassword, setShowAdminRegPassword] = useState(false);
  const [adminRegError, setAdminRegError] = useState("");
  const [adminRegSuccess, setAdminRegSuccess] = useState(false);

  const filterByMonthYear = (dateStr: string | undefined) => {
    if (!dateStr) return true;
    if (filterMonth === "All" && filterYear === "All") return true;
    try {
      const d = new Date(dateStr);
      const isMonthMatch =
        filterMonth === "All" || (d.getMonth() + 1).toString() === filterMonth;
      const isYearMatch =
        filterYear === "All" || d.getFullYear().toString() === filterYear;
      return isMonthMatch && isYearMatch;
    } catch {
      return true;
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobIds((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId],
    );
  };

  const handleAddPaymentAccount = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!accBankName || !accNumber || !accHolder) return;

    const currentAccounts = systemState.customization?.paymentAccounts || [];

    const newAccounts = [
      ...currentAccounts,
      {
        bankName: accBankName,
        accountNumber: accNumber,
        holderName: accHolder,
      },
    ];

    await onUpdateState("customization", "update", {
      paymentAccounts: newAccounts,
    });
    setAccBankName("");
    setAccNumber("");
    setAccHolder("");
  };

  const startAdminEditReg = (studentId: string) => {
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

    const finalName = pick(am?.name, rm?.name, um?.name, um?.realName, um?.displayName, studentId);
    const finalEmail = pick(
      rm?.email,
      um?.email,
      am?.email,
      am?.id && am.id.includes("@") ? am.id : undefined,
      `${finalName.toLowerCase().replace(/\s+/g, "")}@example.com`
    );
    const finalPhone = pick(am?.phone, am?.noHp, am?.telepon, am?.whatsapp, rm?.phone, um?.phone, um?.noHp);
    const finalDistrict = pick(am?.district, am?.alamat, am?.domisili, am?.address, rm?.district, um?.district, um?.address);
    const finalBirthDate = pick(am?.birthDate, am?.tanggalLahir, am?.tglLahir, rm?.birthDate, um?.birthDate);
    const finalGender = pick(am?.gender, am?.jenisKelamin, rm?.gender, um?.gender);
    const finalEducation = pick(am?.education, am?.pendidikan, rm?.education, um?.education);
    const finalSchool = pick(am?.school, am?.asalSekolah, am?.sekolah, rm?.school, um?.school);
    const finalGraduationYear = pick(am?.graduationYear, am?.tahunLulus, rm?.graduationYear);
    const finalJapaneseLevel = pick(am?.japaneseLevel, am?.levelJepang, rm?.japaneseLevel);
    const finalProgram = pick(am?.class, am?.assignedClass, am?.program, rm?.program);
    const finalStatusPendaftaran = pick(am?.statusPendaftaran, am?.kategoriPendaftaran, rm?.statusPendaftaran, "Siswa Baru");
    const finalPassword = pick(rm?.password, um?.password);
    const finalProfilePicture = pick(am?.profilePicture, am?.docFoto, am?.foto, rm?.docFoto, rm?.profilePicture, um?.photoURL, um?.profilePicture);

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
      batch: am?.batch || "",
      proofOfPayment: regMatch?.proofOfPayment || (activeMatch as any)?.proofOfPayment,
      profilePicture: finalProfilePicture,
      docFoto: finalProfilePicture,
      mitraSO: am?.mitraSO || "",
      jobKeterangan: am?.jobKeterangan || "",
      job1Bidang: am?.job1Bidang || "",
      job1TanggalMensetsu: am?.job1TanggalMensetsu || "",
      job1Lokasi: am?.job1Lokasi || "",
      job2Bidang: am?.job2Bidang || "",
      job2TanggalMensetsu: am?.job2TanggalMensetsu || "",
      job2Lokasi: am?.job2Lokasi || "",
      bulanKelulusan: am?.bulanKelulusan || "",
      attitudeScore: am?.attitudeScore ?? "",
      kaiwaScore: am?.kaiwaScore ?? "",
      bobotNilaiRekomendasi: am?.bobotNilaiRekomendasi ?? "",
      keterangan: am?.keterangan || "",
    };

    setAdminRegData(mergedData);
    setAdminEditingStudentId(studentId);
    setAdminRegError("");
    setAdminRegSuccess(false);
  };

  const handleAdminSaveReg = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminRegError("");
    setAdminRegSuccess(false);

    if (!adminRegData.name || !adminRegData.phone) {
      setAdminRegError("Nama dan No HP wajib diisi.");
      return;
    }

    let success = false;
    
    // Update or add registered student record
    const regMatch = systemState.registeredStudents?.find(rs => rs.id === adminRegData.id || rs.name.toLowerCase() === adminRegData.name.toLowerCase());
    if (regMatch) {
      success = await onUpdateState(
        "registeredStudents",
        "update",
        { ...adminRegData, id: regMatch.id },
      );
    } else {
      success = await onUpdateState(
        "registeredStudents",
        "add",
        adminRegData,
      );
    }

    // Update active student if it exists
    const activeInfo = systemState.activeStudents?.find(
      (s) => s.id === adminEditingStudentId || s.id === adminRegData.id || s.name.toLowerCase() === adminRegData.name.toLowerCase()
    );

    if (activeInfo) {
      const activeSuccess = await onUpdateState("activeStudents", "update_status", {
        id: activeInfo.id,
        name: adminRegData.name,
        batch: adminRegData.batch,
        phone: adminRegData.phone,
        district: adminRegData.district,
        birthDate: adminRegData.birthDate,
        gender: adminRegData.gender,
        education: adminRegData.education,
        school: adminRegData.school,
        graduationYear: adminRegData.graduationYear,
        japaneseLevel: adminRegData.japaneseLevel,
        statusPendaftaran: adminRegData.statusPendaftaran,
        class: adminRegData.program || activeInfo.class,
        profilePicture: adminRegData.profilePicture || adminRegData.docFoto,
        docFoto: adminRegData.docFoto || adminRegData.profilePicture,
        keterangan: adminRegData.keterangan,
        mitraSO: adminRegData.mitraSO,
        jobKeterangan: adminRegData.jobKeterangan,
        job1Bidang: adminRegData.job1Bidang,
        job1TanggalMensetsu: adminRegData.job1TanggalMensetsu,
        job1Lokasi: adminRegData.job1Lokasi,
        job2Bidang: adminRegData.job2Bidang,
        job2TanggalMensetsu: adminRegData.job2TanggalMensetsu,
        job2Lokasi: adminRegData.job2Lokasi,
        bulanKelulusan: adminRegData.bulanKelulusan,
        attitudeScore: adminRegData.attitudeScore === "" ? null : adminRegData.attitudeScore,
        kaiwaScore: adminRegData.kaiwaScore === "" ? null : adminRegData.kaiwaScore,
        bobotNilaiRekomendasi: adminRegData.bobotNilaiRekomendasi === "" ? null : adminRegData.bobotNilaiRekomendasi,
      });
      if (activeSuccess) success = true;
    }

    if (success) {
      setAdminRegSuccess(true);
      setTimeout(() => {
        setAdminRegSuccess(false);
        setAdminEditingStudentId(null);
      }, 1500);
    } else {
      setAdminRegError("Gagal menyimpan data.");
    }
  };

  const handleRemovePaymentAccount = async (index: number) => {
    const currentAccounts = systemState.customization?.paymentAccounts || [];
    const newAccounts = [...currentAccounts];
    newAccounts.splice(index, 1);
    await onUpdateState("customization", "update", {
      paymentAccounts: newAccounts,
    });
  };

  const handleApprove = async (student: RegisteredStudent, assignedClass?: string) => {
    await onUpdateState("registeredStudents", "approve", { id: student.id, class: assignedClass });
  };

  const handleReject = async (student: RegisteredStudent) => {
    await onUpdateState("registeredStudents", "reject", { id: student.id });
  };

  const handleNewPaymentSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!payStudent || !payAmount) return;
    const ok = await onUpdateState("payments", "add", {
      studentName: payStudent,
      category: payCategory,
      amount: Number(payAmount),
      status: payStatus,
      paymentMethod: payMethod,
    });
    if (ok) {
      setPayStudent("");
      setPayAmount("");
    }
  };

  const handleTogglePaymentStatus = async (item: PaymentRecord) => {
    const nextStatus = item.status === "Lunas" ? "Cicilan" : "Lunas";
    await onUpdateState("payments", "status", {
      id: item.id,
      status: nextStatus,
    });
  };

  const handleNewInventorySubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!invName || !invAmount) return;
    const ok = await onUpdateState("inventory", "add", {
      itemName: invName,
      amount: Number(invAmount),
      condition: invCondition,
      location: invLoc,
    });
    if (ok) {
      setInvName("");
      setInvAmount("");
    }
  };

  const triggerPreview = (base64Data: string, filename: string) => {
    setPreviewTaxFile(base64Data);
    setPreviewTaxFileName(filename);
  };

  const resetTaxForm = () => {
    setTaxMonth("");
    setTaxRev("");
    setTaxExp("");
    setTaxRate("0.11");
    setTaxStatus("Draft");
    setTaxNotes("");
    setTaxSptFile("");
    setTaxFinancialReportFile("");
    setEditingTaxId(null);
  };

  const handleNewTaxSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!taxMonth || !taxRev) return;
    const ok = await onUpdateState("taxes", "add", {
      monthString: taxMonth,
      totalRevenue: Number(taxRev),
      totalExpenses: Number(taxExp) || 0,
      taxRate: Number(taxRate) || 0.11,
      status: taxStatus,
      notes: taxNotes,
      sptFile: taxSptFile,
      financialReportFile: taxFinancialReportFile,
    });
    if (ok) {
      resetTaxForm();
    }
  };

  const handleEditTaxSubmit = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!editingTaxId || !taxMonth || !taxRev) return;
    const ok = await onUpdateState("taxes", "edit", {
      id: editingTaxId,
      monthString: taxMonth,
      totalRevenue: Number(taxRev),
      totalExpenses: Number(taxExp) || 0,
      taxRate: Number(taxRate) || 0.11,
      status: taxStatus,
      notes: taxNotes,
      sptFile: taxSptFile,
      financialReportFile: taxFinancialReportFile,
    });
    if (ok) {
      setIsEditTaxModalOpen(false);
      resetTaxForm();
    }
  };

  const handleTaxDelete = async (item: TaxRecord) => {
    await onUpdateState("taxes", "delete", { id: item.id });
  };

  const handleTaxReportAction = async (item: TaxRecord) => {
    await onUpdateState("taxes", "report", { 
      id: item.id,
      monthString: item.monthString,
      totalRevenue: item.totalRevenue,
      totalExpenses: item.totalExpenses,
      sptFile: item.sptFile,
      financialReportFile: item.financialReportFile,
      notes: item.notes
    });
  };

  const handleInventoryDelete = async (item: InventoryItem) => {
    await onUpdateState("inventory", "delete", { id: item.id });
  };

  const filteredSiswaItems = (siswaTab === "baru"
    ? [...(systemState.registeredStudents || [])]
        .filter((s) => s.status !== "Disetujui" && filterByMonthYear(s.date) && isStudentRoleOnly(s))
        .sort(sortStudentsByDateDesc)
    : systemState.activeStudents
        ?.filter((s) => filterByMonthYear(s.date) && isStudentRoleOnly(s))
        ?.filter((s) => {
          const isAlumni = ["Lulus", "Di Jepang"].includes(s.status);

          if (filterStatus !== "All") {
            if (s.status !== filterStatus) return false;
          } else {
            if (siswaTab === "alumni" && !isAlumni) return false;
            if (siswaTab === "aktif" && isAlumni) return false;
          }
          
          if (filterClass !== "All") {
            if (filterClass === "Belum Diplot") {
              if (s.class) return false;
            } else if (s.class !== filterClass) {
              return false;
            }
          }
          return true;
        }) || []
  ).filter((s: any) => {
    if (!siswaSearch.trim()) return true;
    const query = siswaSearch.toLowerCase().trim();
    const nameMatch = (s.name || "").toLowerCase().includes(query);
    const idMatch = (s.id || "").toLowerCase().includes(query);
    const emailMatch = (s.email || "").toLowerCase().includes(query);
    const phoneMatch = (s.phone || "").toLowerCase().includes(query);
    const classMatch = (s.class || s.program || "").toLowerCase().includes(query);
    const districtMatch = (s.district || "").toLowerCase().includes(query);
    return nameMatch || idMatch || emailMatch || phoneMatch || classMatch || districtMatch;
  });

  const siswaItemsPerPage = 10;
  const siswaTotalPages = Math.max(1, Math.ceil(filteredSiswaItems.length / siswaItemsPerPage));
  const paginatedSiswaItems = filteredSiswaItems.slice((siswaPage - 1) * siswaItemsPerPage, siswaPage * siswaItemsPerPage);

  return (
    <div className="flex flex-row gap-3 sm:gap-6 py-4 sm:py-6 relative items-start">
      {/* Left Sidebar Menu (Minimizable) - Hidden on Mobile */}
      <div
        className={`hidden sm:flex shrink-0 ${isMenuMinimized ? "w-16" : "w-56"} transition-all duration-300 ease-in-out sticky top-0 max-h-screen overflow-y-auto`}
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="bg-gradient-to-b from-indigo-50/90 via-slate-100/80 to-blue-50/90 p-1.5 sm:p-2 rounded-r-2xl border-r border-y border-indigo-100 flex flex-col gap-1 w-full">
          <div className="flex items-center justify-between mb-2 px-1 sm:px-2 pt-1 border-b border-indigo-100/50 pb-1.5">
            {!isMenuMinimized && (
              <span className="font-black text-[10px] sm:text-xs text-indigo-700 uppercase tracking-wider truncate">
                Admin Menu
              </span>
            )}
            <button
              onClick={() => setIsMenuMinimized(!isMenuMinimized)}
              className="p-1 sm:p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 cursor-pointer ml-auto transition-colors"
            >
              {isMenuMinimized ? (
                <Menu className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
          {[
            { id: "siswa", name: "Administrasi Siswa", ic: Users },
            { id: "kelas", name: "Manajemen Kelas", ic: GraduationCap },
            { id: "kalender", name: "Jadwal LPK", ic: Calendar },
            { id: "dataCV", name: "Data CV", ic: BookOpen },
            { id: "joborders", name: "Job Order", ic: Landmark },
            { id: "pembayaran", name: currentUser?.role === "VVIP" ? "Pembayaran Siswa" : "HR & Personalia", ic: DollarSign },
            { id: "inventaris", name: "Inventaris", ic: Package },
            { id: "pajak", name: "Pajak & Keu", ic: FileText },
            { id: "gaji", name: "Buku Kas & Gaji", ic: Receipt },
            { id: "kustomisasi", name: "Branding", ic: Sliders },
            { id: "alumnivip", name: "Manajemen Kelas Alumni", ic: Star },
            { id: "galeri", name: "Galeri Foto", ic: Image },
            { id: "petasebaran", name: "Peta Alumni", ic: MapPin },
            { id: "afiliasi", name: "Data Afiliasi", ic: Share2 },
            { id: "informasi", name: "Informasi", ic: Bell },
            { id: "manajemen", name: "Manajemen Akun & Sensei", ic: Users },
          ].filter((tab) => {
            if (currentUser?.role === "Admin Biasa") {
              return tab.id !== "pembayaran" && tab.id !== "pajak";
            }
            return true;
          }).map((tab) => {
            const Icon = tab.ic;
            const isActive = activeSegment === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSegment(tab.id as any)}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-200 cursor-pointer group relative ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 text-white shadow-md shadow-indigo-200/50 translate-x-1"
                    : "text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                }`}
                title={isMenuMinimized ? tab.name : ""}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-indigo-500 group-hover:text-indigo-600 group-hover:scale-110 transition-transform"}`} />
                {!isMenuMinimized && (
                  <span className="text-[11px] sm:text-[13px] font-bold text-left truncate">
                    {tab.name}
                  </span>
                )}
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full -ml-1 sm:-ml-2 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 sm:space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Control Center</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {activeSegment ? (() => {
                const titles: Record<string, string> = {
                  siswa: "Administrasi Siswa",
                  kelas: "Manajemen Kelas",
                  kalender: "Jadwal LPK",
                  dataCV: "Data CV & Biodata",
                  joborders: "Job Order",
                  pembayaran: "Admin Keuangan Siswa",
                  inventaris: "Inventaris",
                  pajak: "Pajak & Keu",
                  gaji: "Buku Kas & Gaji",
                  kustomisasi: "Branding",
                  alumnivip: "Manajemen Kelas Alumni",
                  galeri: "Galeri Foto",
                  petasebaran: "Peta Alumni",
                  afiliasi: "Data Afiliasi",
                  informasi: "Informasi",
                  manajemen: "Manajemen Akun & Sensei",
                };
                return titles[activeSegment] || activeSegment.charAt(0).toUpperCase() + activeSegment.slice(1);
              })() : "Dashboard Overview"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Kelola ekosistem operasional LPK Source Course Indonesia secara terpadu. Verifikasi data, monitoring finansial, dan audit inventaris dalam satu panel kendali.
            </p>
          </div>
        </div>

        {/* Placeholder if none selected */}
        {!activeSegment && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center py-8 px-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-3 m-1">
              <div className="h-12 w-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm shadow-blue-100">
                <Sliders className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display font-black text-lg text-slate-800">
                  Admin Desk Portal
                </h4>
                <p className="text-xs text-slate-400 leading-normal max-w-[280px] mx-auto font-medium">
                  Silakan pilih modul administrasi di bawah ini untuk mengelola operasional LPK.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-1">
              {[
                { id: "siswa", name: "Adm Siswa", ic: Users, color: "blue" },
                { id: "kelas", name: "Manajemen Kelas", ic: GraduationCap, color: "indigo" },
                { id: "kalender", name: "Jadwal LPK", ic: Calendar, color: "emerald" },
                { id: "dataCV", name: "Database CV", ic: BookOpen, color: "sky" },
                { id: "joborders", name: "Job Order", ic: Landmark, color: "amber" },
                { id: "pembayaran", name: currentUser?.role === "VVIP" ? "Pembayaran Siswa" : "HR & Personalia", ic: DollarSign, color: "rose", restricted: true },
                { id: "inventaris", name: "Inventaris", ic: Package, color: "slate" },
                { id: "pajak", name: "Pajak & Keu", ic: FileText, color: "orange", restricted: true },
                { id: "gaji", name: "Buku Kas & Gaji", ic: Receipt, color: "violet", restricted: true },
                { id: "kustomisasi", name: "Branding", ic: Sliders, color: "pink" },
                { id: "alumnivip", name: "Manajemen Kelas Alumni", ic: Star, color: "yellow" },
                { id: "galeri", name: "Galeri Foto", ic: Image, color: "cyan" },
                { id: "petasebaran", name: "Peta Alumni", ic: MapPin, color: "teal" },
                { id: "afiliasi", name: "Data Afiliasi", ic: Share2, color: "blue" },
                { id: "informasi", name: "Informasi", ic: Bell, color: "red" },
                { id: "manajemen", name: "Manajemen Akun & Sensei", ic: Users, color: "slate" },
              ].filter((tab) => {
                if (currentUser?.role === "Admin Biasa" && tab.restricted) {
                  return false;
                }
                return true;
              }).map((tab) => {
                const Icon = tab.ic;
                const colors: any = {
                  blue: "bg-blue-50 text-blue-600 border-blue-100",
                  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
                  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
                  sky: "bg-sky-50 text-sky-600 border-sky-100",
                  amber: "bg-amber-50 text-amber-600 border-amber-100",
                  rose: "bg-rose-50 text-rose-600 border-rose-100",
                  slate: "bg-slate-50 text-slate-600 border-slate-100",
                  orange: "bg-orange-50 text-orange-600 border-orange-100",
                  violet: "bg-violet-50 text-violet-600 border-violet-100",
                  pink: "bg-pink-50 text-pink-600 border-pink-100",
                  yellow: "bg-yellow-50 text-yellow-600 border-yellow-100",
                  cyan: "bg-cyan-50 text-cyan-600 border-cyan-100",
                  teal: "bg-teal-50 text-teal-600 border-teal-100",
                  red: "bg-red-50 text-red-600 border-red-100",
                };
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSegment(tab.id as any)}
                    className="flex flex-col items-center justify-center gap-3 p-5 bg-white border border-slate-100 rounded-[2rem] hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group"
                  >
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${colors[tab.color] || colors.blue}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 text-center leading-tight">
                      {tab.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SISWA AKTIF */}
        {activeSegment === "siswa" && <AdminSiswaSegment checkSyncStatus={checkSyncStatus} filterClass={filterClass} filterMonth={filterMonth} filterStatus={filterStatus} filterYear={filterYear} filteredSiswaItems={filteredSiswaItems} handleReject={handleReject} isAlumniClass={isAlumniClass} isStudentRoleOnly={isStudentRoleOnly} onUpdateState={onUpdateState} paginatedSiswaItems={paginatedSiswaItems} setFilterClass={setFilterClass} setFilterMonth={setFilterMonth} setFilterStatus={setFilterStatus} setFilterYear={setFilterYear} setSiswaPage={setSiswaPage} setSiswaSearch={setSiswaSearch} setSiswaTab={setSiswaTab} setStatCardMode={setStatCardMode} setVerifyingDocsStudent={setVerifyingDocsStudent} setViewingCvStudentId={setViewingCvStudentId} siswaItemsPerPage={siswaItemsPerPage} siswaPage={siswaPage} siswaSearch={siswaSearch} siswaTab={siswaTab} siswaTotalPages={siswaTotalPages} startAdminEditReg={startAdminEditReg} statCardMode={statCardMode} systemState={systemState} />}

        {/* 2.5 DATA CV KANDIDAT */}
        {activeSegment === "dataCV" && <AdminDataCvSegment onUpdateState={onUpdateState} setViewingCvStudentId={setViewingCvStudentId} systemState={systemState} viewingCvStudentId={viewingCvStudentId} />}

        {/* 3. REKAPITULASI PEMBAYARAN SISWA */}
        {activeSegment === "pembayaran" && currentUser?.role !== "Admin Biasa" && (
          <PembayaranSiswaView
            currentUser={currentUser}
            systemState={systemState}
            onUpdateState={onUpdateState}
            onOpenLogin={() => {}}
          />
        )}

        {/* 4. INVENTARIS */}
        {activeSegment === "inventaris" && <AdminInventarisSegment getAvailableInventoryAreas={getAvailableInventoryAreas} handleInventoryDelete={handleInventoryDelete} inventoryAreaFilter={inventoryAreaFilter} setEditInvAmount={setEditInvAmount} setEditInvCondition={setEditInvCondition} setEditInvLoc={setEditInvLoc} setEditInvName={setEditInvName} setEditingInventoryItem={setEditingInventoryItem} setInventoryAreaFilter={setInventoryAreaFilter} setIsCreateInventoryModalOpen={setIsCreateInventoryModalOpen} setIsManageInventoryAreasModalOpen={setIsManageInventoryAreasModalOpen} systemState={systemState} />}

        {/* 5. PAJAK & KEUANGAN CORPORATE */}
        {activeSegment === "pajak" && currentUser?.role !== "Admin Biasa" && <AdminPajakSegment handleTaxDelete={handleTaxDelete} handleTaxReportAction={handleTaxReportAction} resetTaxForm={resetTaxForm} setEditingTaxId={setEditingTaxId} setIsCreateTaxModalOpen={setIsCreateTaxModalOpen} setIsEditTaxModalOpen={setIsEditTaxModalOpen} setTaxExp={setTaxExp} setTaxFinancialReportFile={setTaxFinancialReportFile} setTaxMonth={setTaxMonth} setTaxNotes={setTaxNotes} setTaxRate={setTaxRate} setTaxRev={setTaxRev} setTaxSptFile={setTaxSptFile} setTaxStatus={setTaxStatus} systemState={systemState} triggerPreview={triggerPreview} />}

        {/* JOB ORDERS MANAGEMENT SYSTEM PANEL */}
        {activeSegment === "joborders" && <AdminJobOrdersSegment expandedJobIds={expandedJobIds} onUpdateState={onUpdateState} recoSiswaId={recoSiswaId} setEditingJobOrder={setEditingJobOrder} setIsCreateJobOrderModalOpen={setIsCreateJobOrderModalOpen} setRecoSiswaId={setRecoSiswaId} systemState={systemState} toggleJobExpansion={toggleJobExpansion} />}

        {/* BUKU KAS & GAJI SEGMENT */}
        {activeSegment === "gaji" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div className="space-y-1 text-left">
                <h3 className="font-display font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <span className="text-base">💼</span> Pengelolaan Buku Kas &
                  Penggajian Terpadu
                </h3>
                <p className="text-[11px] text-slate-500 font-normal leading-normal">
                  {currentUser?.role === "Admin Biasa" 
                    ? "Kelola absensi harian dan rekapitulasi presensi pengajar/staf."
                    : "Catat arus kas (in/out) LPK serta kelola penggajian staff/sensei secara transparan dan akurat."}
                </p>
              </div>
              {currentUser?.role !== "Admin Biasa" && (
                <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-inner gap-1">
                  <button
                    onClick={() => setSalarySubTab("buku_kas")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                      salarySubTab === "buku_kas"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Buku Kas (Ledger)
                  </button>
                  <button
                    onClick={() => setSalarySubTab("penggajian")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                      salarySubTab === "penggajian"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Penggajian Staff
                  </button>
                  <button
                    onClick={() => setSalarySubTab("hr")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200 ${
                      salarySubTab === "hr"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    HR & Personalia
                  </button>
                  <button
                    onClick={() => setSalarySubTab("grafik_cashflow")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
                      salarySubTab === "grafik_cashflow"
                        ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-md scale-[1.02]"
                        : "bg-white/80 text-purple-700 hover:bg-white hover:text-purple-900 border border-purple-200/60"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Grafik Cashflow LPK</span>
                    <span className="text-[8px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-tight">SUPER & VVIP</span>
                  </button>
                </div>
              )}
            </div>

            {salarySubTab === "buku_kas" && currentUser?.role !== "Admin Biasa" && (() => {
              const rawLedger = systemState.cashLedger || [];
              const ledgerAsc = [...rawLedger].sort((a, b) => {
                const dateA = a.date || "";
                const dateB = b.date || "";
                if (dateA !== dateB) return dateA.localeCompare(dateB);
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
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
                <div className="space-y-6 animate-fade-in text-left">
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4" /> Input Jurnal Kas /
                      Penggajian
                    </h4>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);

                        const pInAmount = fd.get("inAmount")?.toString() || "0";
                        const pOutAmount = fd.get("outAmount")?.toString() || "0";
                        const isExpense = pInAmount === "0" && pOutAmount !== "0";

                        onUpdateState("cashLedger", "add", {
                          code: fd.get("code"),
                          date: fd.get("date"),
                          description: fd.get("description"),
                          inAmount: isExpense ? 0 : Number(pInAmount),
                          outAmount: isExpense ? Number(pOutAmount) : 0,
                          createdAt: new Date().toISOString(),
                        });

                        e.currentTarget.reset();
                      }}
                      className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
                    >
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Tanggal
                        </label>
                        <input
                          name="date"
                          type="date"
                          required
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                          defaultValue={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Kode Transaksi
                        </label>
                        <select
                          name="code"
                          required
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer"
                        >
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
                      <div className="space-y-1 lg:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Uraian / Keterangan
                        </label>
                        <input
                          name="description"
                          type="text"
                          required
                          placeholder="Cth: Gaji Satria Herlambang / Listrik Asrama"
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1 lg:col-span-1">
                        <label className="text-[10px] font-bold text-emerald-600 uppercase">
                          Pemasukan (IN)
                        </label>
                        <input
                          name="inAmount"
                          type="number"
                          defaultValue="0"
                          min="0"
                          placeholder="Rp"
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-1 lg:col-span-1">
                        <label className="text-[10px] font-bold text-rose-600 uppercase">
                          Pengeluaran (OUT)
                        </label>
                        <input
                          name="outAmount"
                          type="number"
                          defaultValue="0"
                          min="0"
                          placeholder="Rp"
                          className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2 lg:col-span-2">
                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 text-xs rounded-lg transition"
                        >
                          Catat Buku Kas
                        </button>
                      </div>
                    </form>
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
                  
                  <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-3">
                    <table className="w-full text-left text-xs md:text-sm">
                      <thead className="bg-[#a3e635]/20 border-b-2 border-[#166534] text-[#166534]">
                        <tr>
                          <th className="p-3 font-bold uppercase text-center w-12">No</th>
                          <th className="p-3 font-bold uppercase w-16 text-center">Kode</th>
                          <th className="p-3 font-bold uppercase">Kategori</th>
                          <th className="p-3 font-bold uppercase">Tanggal</th>
                          <th className="p-3 font-bold uppercase">Uraian Transaksi</th>
                          <th className="p-3 font-bold uppercase text-right">In (Rp)</th>
                          <th className="p-3 font-bold uppercase text-right">Out (Rp)</th>
                          <th className="p-3 font-bold uppercase text-right">Saldo (Rp)</th>
                          <th className="p-3 font-bold uppercase text-center">Aksi</th>
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
                          <tr key={entry.id} className="hover:bg-slate-50 transition even:bg-slate-50/50">
                            <td className="p-2 text-center text-slate-500 font-mono">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="p-2 text-center"><span className="font-bold text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">{entry.code || "DLL"}</span></td>
                            <td className="p-2"><span className="font-bold text-[9px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{getCategoryName(entry.code || "DLL")}</span></td>
                            <td className="p-2 text-slate-700 whitespace-nowrap">{entry.date}</td>
                            <td className="p-2 font-semibold text-slate-900">{entry.description}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-600">{entry.inAmount > 0 ? entry.inAmount.toLocaleString("id-ID") : "-"}</td>
                            <td className="p-2 text-right font-mono font-bold text-rose-600">{entry.outAmount > 0 ? entry.outAmount.toLocaleString("id-ID") : "-"}</td>
                            <td className={`p-2 text-right font-mono font-bold ${entry.saldo < 0 ? "text-rose-600" : "text-slate-900"}`}>{entry.saldo.toLocaleString("id-ID")}</td>
                            <td className="p-2 text-center flex items-center justify-center gap-1">
                              <button onClick={() => {
                                setEditingLedger(entry);
                                setEditingLedgerIsStudent(false);
                                setEditingLedgerStudentName("");
                                setEditingLedgerCategory("");
                              }} className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition">Edit</button>
                              <ConfirmButton 
                                confirmTitle="Hapus Buku Kas"
                                confirmMessage="Yakin hapus data transaksi ini?"
                                onConfirmClick={() => onUpdateState('cashLedger', 'delete', { id: entry.id })}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition"
                              >
                                Hapus
                              </ConfirmButton>
                            </td>
                          </tr>
                        ); })}
                        {paginatedLedger.length === 0 && (
                          <tr><td colSpan={9} className="p-8 text-center text-slate-400 italic text-xs">Buku Kas masih kosong.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      <button onClick={() => setLedgerPage(Math.max(1, ledgerPage - 1))} disabled={ledgerPage === 1} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"><ChevronLeft className="w-4 h-4" /></button>
                      <span className="text-xs font-bold text-slate-500">Hal {ledgerPage} dari {totalPages}</span>
                      <button onClick={() => setLedgerPage(Math.min(totalPages, ledgerPage + 1))} disabled={ledgerPage === totalPages} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold text-slate-700 transition"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}

                </div>
              );
            })()}

            {salarySubTab === "penggajian" && currentUser?.role !== "Admin Biasa" && (
              <div className="space-y-6 animate-fade-in text-left">
                <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-1.5">
                    <Receipt className="h-4 w-4" /> Input Penggajian Staff
                  </h4>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const payload = {
                        staffName: salStaffName,
                        role: salRole,
                        amount: Number(salAmount),
                        monthString: salMonth,
                        status: salStatus,
                        paymentDate: salPaymentDate,
                        notes: salNotes,
                      };
                      if (editingSalId) {
                        onUpdateState("salaries", "edit", { id: editingSalId, ...payload });
                        setEditingSalId(null);
                      } else {
                        onUpdateState("salaries", "add", payload);
                      }
                      setSalStaffName("");
                      setSalRole("Pengajar");
                      setSalAmount("");
                      setSalMonth("");
                      setSalStatus("Pending");
                      setSalPaymentDate("");
                      setSalNotes("");
                    }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Staff</label>
                      <input
                        required
                        type="text"
                        value={salStaffName}
                        onChange={(e) => setSalStaffName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Role</label>
                      <select
                        required
                        value={salRole}
                        onChange={(e) => setSalRole(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      >
                        <option value="Pengajar">Pengajar (Sensei)</option>
                        <option value="Admin">Admin Keuangan</option>
                        <option value="Admin Biasa">Admin Biasa</option>
                        <option value="Umum">Umum / Lainnya</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Bulan & Tahun</label>
                      <input
                        required
                        type="month"
                        value={salMonth}
                        onChange={(e) => setSalMonth(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nominal Gaji (Rp)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        value={salAmount}
                        onChange={(e) => setSalAmount(e.target.value)}
                        placeholder="Misal: 4500000"
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Bayar</label>
                      <input
                        type="date"
                        value={salPaymentDate}
                        onChange={(e) => setSalPaymentDate(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Status Pembayaran</label>
                      <select
                        required
                        value={salStatus}
                        onChange={(e) => setSalStatus(e.target.value as any)}
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none font-bold"
                      >
                        <option value="Pending">Pending (Belum Lunas)</option>
                        <option value="Lunas">Lunas (Telah Dibayarkan)</option>
                      </select>
                    </div>
                    <div className="space-y-1 lg:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan Tambahan</label>
                      <input
                        type="text"
                        value={salNotes}
                        onChange={(e) => setSalNotes(e.target.value)}
                        placeholder="Contoh: Pembayaran Gaji Pokok + Transport"
                        className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      />
                    </div>
                    <div className="space-y-1 text-right lg:col-span-1">
                      {editingSalId && (
                         <button
                           type="button"
                           onClick={() => {
                             setEditingSalId(null);
                             setSalStaffName("");
                             setSalRole("Pengajar");
                             setSalAmount("");
                             setSalMonth("");
                             setSalStatus("Pending");
                             setSalPaymentDate("");
                             setSalNotes("");
                           }}
                           className="bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold p-2 text-xs rounded-lg transition mr-2"
                         >
                           Batal
                         </button>
                      )}
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-4 text-xs rounded-lg transition"
                      >
                        {editingSalId ? "Simpan Perubahan" : "Simpan Data Gaji"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-6">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead className="bg-indigo-50 border-b-2 border-indigo-200 text-indigo-900">
                      <tr>
                        <th className="p-3 font-bold uppercase w-12 text-center">No</th>
                        <th className="p-3 font-bold uppercase">Nama / Jabatan</th>
                        <th className="p-3 font-bold uppercase text-center">Bulan</th>
                        <th className="p-3 font-bold uppercase text-right">Gaji (Rp)</th>
                        <th className="p-3 font-bold uppercase text-center">Status</th>
                        <th className="p-3 font-bold uppercase text-center">Tgl Bayar</th>
                        <th className="p-3 font-bold uppercase text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...(systemState.salaries || [])].sort((a, b) => {
                        const dateA = a.paymentDate || a.monthString || "";
                        const dateB = b.paymentDate || b.monthString || "";
                        if (dateA !== dateB) return dateB.localeCompare(dateA);
                        return (b.createdAt || b.id || "").toString().localeCompare((a.createdAt || a.id || "").toString());
                      }).map((sal, idx) => (
                        <tr key={sal.id} className="hover:bg-slate-50 transition">
                          <td className="p-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="p-2">
                            <div className="font-bold text-slate-800">{sal.staffName}</div>
                            <div className="text-[10px] text-slate-500 uppercase">{sal.role}</div>
                          </td>
                          <td className="p-2 text-center font-bold text-slate-700">
                            {sal.monthString}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-600">
                            {sal.amount.toLocaleString("id-ID")}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sal.status === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                              {sal.status}
                            </span>
                          </td>
                          <td className="p-2 text-center text-[10px] text-slate-500 font-mono">
                            {sal.paymentDate || "-"}
                          </td>
                          <td className="p-2 text-center flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingSalId(sal.id);
                                setSalStaffName(sal.staffName);
                                setSalRole(sal.role);
                                setSalAmount(sal.amount.toString());
                                setSalMonth(sal.monthString);
                                setSalStatus(sal.status);
                                setSalPaymentDate(sal.paymentDate || "");
                                setSalNotes(sal.notes || "");
                                setSalarySubTab("penggajian");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition"
                            >
                              Edit
                            </button>
                            <ConfirmButton
                              confirmTitle="Hapus Data Gaji"
                              confirmMessage="Yakin hapus data gaji ini?"
                              onConfirmClick={() => onUpdateState("salaries", "delete", { id: sal.id })}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition"
                            >
                              Hapus
                            </ConfirmButton>
                          </td>
                        </tr>
                      ))}
                      {(!systemState.salaries || systemState.salaries.length === 0) && (
                         <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic text-xs">Data penggajian masih kosong.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {salarySubTab === "hr" && (
              <div className="space-y-8 animate-fade-in text-slate-800 text-left">
                {/* 1. Monthly Filter & Header */}
                <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="text-left">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📅</span> Filter Rekapitulasi & Gaji Bulanan
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      Pilih bulan untuk melihat statistik presensi, ketepatan waktu, dan melakukan pembayaran gaji terintegrasi.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-slate-600 uppercase">Pilih Bulan:</label>
                    <input
                      type="month"
                      value={hrFilterMonth}
                      onChange={(e) => setHrFilterMonth(e.target.value)}
                      className="text-xs p-2 bg-white border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500 font-bold cursor-pointer"
                    />
                  </div>
                </div>

                {/* 2. Bento Grid Rekapitulasi Bulanan */}
                {(() => {
                  const indonesianMonths = [
                    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                  ];
                  const [yr, mn] = hrFilterMonth.split("-");
                  const monthIndex = parseInt(mn) - 1;
                  const indMonthName = indonesianMonths[monthIndex] || "";
                  const formattedMonthStr = `${indMonthName} ${yr}`;

                  const totalStaff = (systemState.users || []).filter(u => u.role === "Pengajar" || u.role === "Admin").length;
                  const totalMonthLogs = (systemState.logs || []).filter(l => 
                    l.type === "PRESENSI_PENGAJAR" && 
                    ((l.timestamp && l.timestamp.startsWith(hrFilterMonth)) || (l.time && l.time.startsWith(hrFilterMonth)))
                  ).length;

                  const totalPaidSalary = (systemState.salaries || [])
                    .filter(sal => (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr) && sal.status === "Lunas")
                    .reduce((sum, sal) => sum + sal.amount, 0);

                  const totalPendingSalary = (systemState.salaries || [])
                    .filter(sal => (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr) && sal.status === "Pending")
                    .reduce((sum, sal) => sum + sal.amount, 0);

                  let allOnTime = 0;
                  let allTotal = 0;
                  (systemState.logs || []).filter(l => l.type === "PRESENSI_PENGAJAR" && ((l.timestamp && l.timestamp.startsWith(hrFilterMonth)) || (l.time && l.time.startsWith(hrFilterMonth)))).forEach(log => {
                    if (log.description.includes("MASUK")) {
                      allTotal++;
                      const match = log.description.match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                      let isLate = false;
                      if (match) {
                        const hrVal = parseInt(match[1]);
                        const minVal = parseInt(match[2]);
                        if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                          isLate = true;
                        }
                      } else {
                        const d = new Date(log.timestamp);
                        const hrVal = d.getHours();
                        const minVal = d.getMinutes();
                        if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                          isLate = true;
                        }
                      }
                      if (!isLate) {
                        allOnTime++;
                      }
                    }
                  });
                  const avgPunctuality = allTotal > 0 ? Math.round((allOnTime / allTotal) * 100) : 100;

                  return (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Card 1: Total Staff */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">Total Staff / Pengajar</span>
                            <span className="text-xl">👥</span>
                          </div>
                          <div className="mt-3">
                            <h3 className="text-2xl font-black text-slate-900">{totalStaff} Orang</h3>
                            <p className="text-[9px] text-slate-500 mt-1 font-medium">Aktif mengajar & mengelola LPK</p>
                          </div>
                        </div>

                        {/* Card 2: Total Absensi */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">Kehadiran Staff ({indMonthName})</span>
                            <span className="text-xl">📝</span>
                          </div>
                          <div className="mt-3">
                            <h3 className="text-2xl font-black text-slate-900">{totalMonthLogs} Log</h3>
                            <p className="text-[9px] text-slate-500 mt-1 font-medium">Total tap/scan presensi masuk & pulang</p>
                          </div>
                        </div>

                        {/* Card 3: Ketepatan Waktu */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">Ketepatan Waktu ({indMonthName})</span>
                            <span className="text-xl">⏱️</span>
                          </div>
                          <div className="mt-3 text-left">
                            <h3 className={`text-2xl font-black ${avgPunctuality >= 85 ? "text-emerald-600" : avgPunctuality >= 70 ? "text-indigo-600" : "text-amber-600"}`}>
                              {avgPunctuality}%
                            </h3>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                              <div 
                                className={`h-1.5 rounded-full ${avgPunctuality >= 85 ? "bg-emerald-500" : avgPunctuality >= 70 ? "bg-indigo-500" : "bg-amber-500"}`}
                                style={{ width: `${avgPunctuality}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card 4: Gaji Terbayar */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-slate-400">Gaji Terbayar ({indMonthName})</span>
                            <span className="text-xl">💵</span>
                          </div>
                          <div className="mt-3">
                            <h3 className="text-xl font-black text-emerald-600">Rp {totalPaidSalary.toLocaleString("id-ID")}</h3>
                            {totalPendingSalary > 0 && (
                              <p className="text-[9px] text-rose-500 mt-1 font-bold">
                                ⚠️ Rp {totalPendingSalary.toLocaleString("id-ID")} Belum Lunas
                              </p>
                            )}
                            {totalPendingSalary === 0 && (
                              <p className="text-[9px] text-emerald-600 mt-1 font-medium">
                                ✓ Seluruh input gaji bulan ini lunas
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3. Main Attendance & Salary Sync Table */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3 text-left">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 uppercase">
                              💵 SINKRONISASI ABSENSI & PEMBAYARAN GAJI STAFF
                            </h4>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Rekapitulasi ketepatan waktu & pembayaran gaji otomatis disinkronkan ke Buku Kas (Buku Kas Ledger).
                            </p>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full self-start">
                            Bulan: {formattedMonthStr}
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                              <tr>
                                <th className="p-3 w-12 text-center">No</th>
                                <th className="p-3">Nama Staff / Role</th>
                                <th className="p-3 text-center">Absen Masuk ({indMonthName})</th>
                                <th className="p-3 text-center">Ketepatan Waktu</th>
                                <th className="p-3">Info Rekening</th>
                                <th className="p-3">Status Gaji ({indMonthName})</th>
                                <th className="p-3 text-center">Aksi Sinkronisasi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(systemState.users || [])
                                .filter(u => u.role === "Pengajar" || u.role === "Admin")
                                .map((u, idx) => {
                                  // Calculate staff logs
                                  const staffLogs = (systemState.logs || []).filter(l => 
                                    l.type === "PRESENSI_PENGAJAR" && 
                                    (l.user === u.name || l.user === u.username) && 
                                    ((l.timestamp && l.timestamp.startsWith(hrFilterMonth)) || (l.time && l.time.startsWith(hrFilterMonth)))
                                  );
                                  
                                  let checkIns = 0;
                                  let onTime = 0;
                                  let late = 0;
                                  
                                  staffLogs.forEach(l => {
                                    if (l.description.includes("MASUK")) {
                                      checkIns++;
                                      const match = l.description.match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                                      let isLate = false;
                                      if (match) {
                                        const hrVal = parseInt(match[1]);
                                        const minVal = parseInt(match[2]);
                                        if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                                          isLate = true;
                                        }
                                      } else {
                                        const d = new Date(l.timestamp);
                                        const hrVal = d.getHours();
                                        const minVal = d.getMinutes();
                                        if (hrVal > 8 || (hrVal === 8 && minVal > 0)) {
                                          isLate = true;
                                        }
                                      }
                                      if (isLate) {
                                        late++;
                                      } else {
                                        onTime++;
                                      }
                                    }
                                  });

                                  const punctualityRate = checkIns > 0 ? Math.round((onTime / checkIns) * 100) : 100;

                                  // Find salary record
                                  const salRecord = (systemState.salaries || []).find(sal => 
                                    sal.staffName === u.name && 
                                    (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr)
                                  );

                                  return (
                                    <React.Fragment key={u.username}>
                                      <tr className="hover:bg-slate-50 transition">
                                        <td className="p-3 text-center text-slate-400 font-mono font-bold">{idx + 1}</td>
                                        <td className="p-3">
                                          <div className="font-bold text-slate-800">{u.name}</div>
                                          <div className="text-[10px] text-indigo-600 font-extrabold uppercase mt-0.5">{u.role}</div>
                                        </td>
                                        <td className="p-3 text-center">
                                          <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                                            {checkIns} Hari Kerja
                                          </span>
                                        </td>
                                        <td className="p-3">
                                          {checkIns > 0 ? (
                                            <div className="flex flex-col items-center">
                                              <span className={`text-[11px] font-black ${punctualityRate >= 85 ? "text-emerald-600 bg-emerald-50 border border-emerald-100" : punctualityRate >= 70 ? "text-indigo-600 bg-indigo-50 border border-indigo-100" : "text-amber-600 bg-amber-50 border border-amber-100"} px-2 py-0.5 rounded-md`}>
                                                {punctualityRate}% Tepat Waktu
                                              </span>
                                              <span className="text-[9px] text-slate-400 mt-1">
                                                ({onTime} Tepat, {late} Terlambat)
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 italic text-[10px]">Belum ada absen</span>
                                          )}
                                        </td>
                                        <td className="p-3 font-mono text-[11px] text-slate-600">
                                          {u.bankAccount || "-"}
                                        </td>
                                        <td className="p-3">
                                          {salRecord ? (
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${salRecord.status === "Lunas" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"}`}>
                                                  {salRecord.status}
                                                </span>
                                                <span className="font-bold text-slate-800">
                                                  Rp {salRecord.amount.toLocaleString("id-ID")}
                                                </span>
                                              </div>
                                              {salRecord.paymentDate && (
                                                <div className="text-[9px] text-slate-400 font-mono">Paid: {salRecord.paymentDate}</div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200/60">
                                              Belum Diinput
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-3 text-center">
                                          {salRecord?.status === "Lunas" ? (
                                            <div className="flex items-center justify-center gap-1.5">
                                              <span className="text-emerald-600 font-black text-xs flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl">
                                                ✓ Sinkron Buku Kas
                                              </span>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => {
                                                setSelectedStaffForQuickPay(selectedStaffForQuickPay === u.username ? null : u.username);
                                                setQuickPayAmount(salRecord ? salRecord.amount.toString() : "4500000");
                                                setQuickPayNotes("");
                                              }}
                                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1 mx-auto shadow-sm"
                                            >
                                              <span>💵</span> {salRecord ? "Lunasi & Sinkron" : "Bayar Gaji"}
                                            </button>
                                          )}
                                        </td>
                                      </tr>

                                      {/* Quick Pay Inline Block */}
                                      {selectedStaffForQuickPay === u.username && (
                                        <tr>
                                          <td colSpan={7} className="bg-slate-50 p-4 border border-indigo-100/50">
                                            <div className="max-w-xl bg-white p-5 rounded-2xl border border-indigo-100 shadow-md space-y-4 text-left">
                                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                <h5 className="font-black text-xs text-indigo-950 flex items-center gap-1.5">
                                                  <span>💸</span> Form Pembayaran Gaji Terintegrasi Buku Kas
                                                </h5>
                                                <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold">
                                                  Bulan: {formattedMonthStr}
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                                <div>
                                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama Penerima</label>
                                                  <input 
                                                    type="text" 
                                                    disabled 
                                                    value={u.name} 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold outline-none"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nominal Pembayaran (Rp)</label>
                                                  <input 
                                                    type="number" 
                                                    value={quickPayAmount} 
                                                    onChange={(e) => setQuickPayAmount(e.target.value)}
                                                    placeholder="Cth: 4500000"
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-indigo-500"
                                                  />
                                                </div>
                                              </div>

                                              <div>
                                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Catatan Pengeluaran Kas (Uraian)</label>
                                                <input 
                                                  type="text" 
                                                  value={quickPayNotes} 
                                                  onChange={(e) => setQuickPayNotes(e.target.value)}
                                                  placeholder={`Cth: Pembayaran Gaji ${u.name} - ${formattedMonthStr}`}
                                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-indigo-500"
                                                />
                                              </div>

                                              <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-[10px] text-amber-800 font-medium leading-relaxed">
                                                ⚠️ <strong>Informasi Sinkronisasi:</strong> Menekan tombol konfirmasi akan langsung:
                                                <ul className="list-disc ml-4 mt-1 space-y-0.5">
                                                  <li>Mencatat penggajian lunas di database riwayat gaji staff.</li>
                                                  <li>Memasukkan pengeluaran otomatis (OUT) di <strong>Buku Kas (Ledger)</strong> dengan nominal Rp {Number(quickPayAmount || 0).toLocaleString("id-ID")} (Kode P1 - Gaji Karyawan).</li>
                                                </ul>
                                              </div>

                                              <div className="flex justify-end gap-2.5 pt-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedStaffForQuickPay(null)}
                                                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                                >
                                                  Batal
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    const amt = Number(quickPayAmount);
                                                    if (!amt || amt <= 0) {
                                                      alert("Harap masukkan nominal gaji yang valid!");
                                                      return;
                                                    }
                                                    
                                                    const notesVal = quickPayNotes || `Gaji Staff: ${u.name} (${formattedMonthStr})`;
                                                    
                                                    // Perform integrated save
                                                    const salPayload = {
                                                      staffName: u.name,
                                                      role: u.role,
                                                      amount: amt,
                                                      monthString: hrFilterMonth,
                                                      status: "Lunas" as const,
                                                      paymentDate: new Date().toISOString().split("T")[0],
                                                      notes: notesVal
                                                    };

                                                    const salOk = await onUpdateState("salaries", "add", salPayload);

                                                    if (salOk) {
                                                      // Buku Kas Ledger (cashLedger)
                                                      await onUpdateState("cashLedger", "add", {
                                                        code: "P1", // Gaji Karyawan
                                                        date: new Date().toISOString().split("T")[0],
                                                        description: `Gaji Staff: ${u.name} (${formattedMonthStr})`,
                                                        inAmount: 0,
                                                        outAmount: amt
                                                      });
                                                      
                                                      alert(`Sukses! Gaji ${u.name} sebesar Rp ${amt.toLocaleString("id-ID")} telah lunas dibayarkan dan otomatis disinkronkan ke Buku Kas (Ledger).`);
                                                      setSelectedStaffForQuickPay(null);
                                                    } else {
                                                      alert("Terjadi kesalahan saat menyimpan data gaji.");
                                                    }
                                                  }}
                                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-sm cursor-pointer"
                                                >
                                                  Konfirmasi & Sinkronkan Kas
                                                </button>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* 4. PENGAJUAN CUTI */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <span>🌴</span> Pengajuan Cuti Pengajar
                  </h3>
                  <div className="space-y-3">
                    {!(systemState.teacherLeaves?.length) && (
                      <p className="text-xs text-slate-500 italic text-left">Belum ada pengajuan cuti.</p>
                    )}
                    {(systemState.teacherLeaves || []).map(leave => (
                      <div key={leave.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                        <div className="text-left">
                          <p className="font-bold text-sm text-slate-800">{leave.teacherName}</p>
                          <p className="text-xs text-slate-500 mt-1">{leave.startDate} s/d {leave.endDate}</p>
                          <p className="text-[11px] text-slate-600 mt-2 p-2 bg-white rounded border border-slate-100">Alasan: {leave.reason}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${leave.status === "Disetujui" ? "bg-emerald-100 text-emerald-800" : leave.status === "Ditolak" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}>
                            {leave.status}
                          </span>
                          {leave.status === "Pending" && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => onUpdateState("teacherLeaves", "update", { id: leave.id, status: "Disetujui" })} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer">Setujui</button>
                              <button onClick={() => onUpdateState("teacherLeaves", "update", { id: leave.id, status: "Ditolak" })} className="px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 cursor-pointer">Tolak</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. KONTRAK KERJA */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                    <span>📄</span> Kontrak Kerja LPK (Upload/Update)
                  </h3>
                  <div className="space-y-4">
                    {(systemState.users || []).filter(u => u.role === "Pengajar").map(u => {
                      const contract = (systemState.teacherContracts || []).find(c => c.teacherName === u.name);
                      return (
                        <div key={u.username} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 text-left">
                          <div>
                            <p className="font-bold text-xs text-slate-800">{u.name}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Status Kontrak: {contract ? contract.status : "Belum Ada"}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => {
                              const url = prompt("Masukkan Link Google Drive / File URL PDF Kontrak Kerja untuk " + u.name + ":");
                              if (url) {
                                if (contract) {
                                  onUpdateState("teacherContracts", "update", { id: contract.id, content: url, status: "Menunggu TTD" });
                                } else {
                                  onUpdateState("teacherContracts", "add", { teacherName: u.name, content: url });
                                }
                              }
                            }} className="px-3 py-1.5 bg-sky-600 text-white text-[10px] font-bold rounded-lg hover:bg-sky-700 cursor-pointer">
                              {contract ? "Update Kontrak" : "Upload Kontrak"}
                            </button>
                            {contract && contract.content && (
                              <button onClick={() => window.open(contract.content, "_blank")} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 cursor-pointer">
                                Lihat
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {salarySubTab === "grafik_cashflow" && (() => {
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
                          <LucidePieChart className="w-4 h-4 text-indigo-600" />
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
                              <RePieChart>
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
                              </RePieChart>
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
            })()}
          </div>
        )}

        {activeSegment === "alumnivip" && <AdminAlumniVipSegment custLandingConfig={custLandingConfig} expandedAlumniClassIds={expandedAlumniClassIds} landingSaveSuccess={landingSaveSuccess} onUpdateState={onUpdateState} setCustLandingConfig={setCustLandingConfig} setExpandedAlumniClassIds={setExpandedAlumniClassIds} setLandingSaveSuccess={setLandingSaveSuccess} systemState={systemState} />}

        {activeSegment === "kustomisasi" && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  ADMIN BRANDING CONSOLE
                </span>
                <h3 className="text-xl font-black font-sans tracking-tight">
                  Kustomisasi Identitas & Slide Landing Page
                </h3>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Sesuaikan nama institusi LPK, lambang lencana, palet rona
                  tema, serta galeri gambar slideshow secara waktu nyata tanpa
                  melakukan kompilasi ulang (re-build).
                </p>
              </div>
              {saveSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-bounce">
                  <Check className="h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" />
                  <span>Berhasil Disinkronkan!</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
              {/* Left side: Customize logo, icons and themes */}
              <div className="lg:col-span-7 bg-white p-4.5 sm:p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-xs space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                    Logo & Tema Dasar
                  </h4>
                </div>

                <ConfirmForm
                  confirmTitle="Simpan Pengaturan Visual"
                  confirmMessage="Menerapkan kustomisasi ini secara publik (semua pendaftar langsung dapat melihatnya)?"
                  onSubmit={handleSaveCustomization}
                  className="space-y-6"
                >
                  {/* 1. Logo Text input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Nama LPK (Logo Utama)
                    </label>
                    <input
                      type="text"
                      required
                      value={custLogoText || ""}
                      onChange={(e) => setCustLogoText(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-indigo-500 focus:bg-white transition"
                      placeholder="Contoh: LPK Source Course"
                    />
                    <p className="text-[10px] text-slate-400 block pt-1">
                      Direkomendasikan menggunakan nama resmi LPK agar tampak
                      kredibel.
                    </p>
                  </div>

                  {/* 1.5. Logo Image Upload input */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>File Gambar Logo LPK (Upload Baru)</span>
                      {custLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setCustLogoUrl("")}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:underline transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus Logo Upload
                        </button>
                      )}
                    </label>

                    {/* Current Active Logo Status Banner */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="h-12 w-12 bg-white rounded-xl border border-slate-150 flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0">
                        {custLogoUrl ? (
                          <img
                            src={custLogoUrl}
                            alt="Custom Logo Preview"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center">
                            <Plus className="h-4 w-4" />
                            <span className="text-[7px] font-bold">
                              ICON MODE
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">
                          {custLogoUrl
                            ? "Menggunakan Logo Unggahan"
                            : "Menggunakan Icon Lencana Vektor"}
                        </p>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          {custLogoUrl
                            ? "Logo unggahan berformat gambar akan menggantikan lencana ikon di atas pada seluruh bagian aplikasi."
                            : "Pilih file gambar Anda di area drag-drop di bawah ini untuk mengganti ikon."}
                        </p>
                      </div>
                    </div>

                    {/* Drag-Drop Zone container */}
                    <div
                      onDragEnter={handleLogoDrag}
                      onDragLeave={handleLogoDrag}
                      onDragOver={handleLogoDrag}
                      onDrop={handleLogoDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        custLogoDragActive
                          ? "border-indigo-600 bg-indigo-50/40 text-indigo-950"
                          : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-500"
                      }`}
                    >
                      <input
                        type="file"
                        id="input-file-logo"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="space-y-1.5 pointer-events-none flex flex-col items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-[11px] font-bold text-slate-700">
                          Seret & Letakkan gambar di sini, atau{" "}
                          <span className="text-indigo-600 font-extrabold underline">
                            Cari File
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400">
                          Direkomendasikan format PNG transparan atau JPEG
                          (Maks. 2MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1.75. Favicon Upload input */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>File Gambar Favicon (Icon Tab Browser)</span>
                      {custFaviconUrl && (
                        <button
                          type="button"
                          onClick={() => setCustFaviconUrl("")}
                          className="text-[10px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:underline transition cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus Favicon Upload
                        </button>
                      )}
                    </label>

                    {/* Current Active Favicon Status Banner */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="h-10 w-10 bg-white rounded-xl border border-slate-150 flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0">
                        {custFaviconUrl ? (
                          <img
                            src={custFaviconUrl}
                            alt="Custom Favicon Preview"
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="text-slate-400 flex flex-col items-center">
                            <Plus className="h-4 w-4" />
                            <span className="text-[7px] font-bold">
                              DEF MODE
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[11px] font-bold text-slate-800 leading-snug">
                          {custFaviconUrl
                            ? "Menggunakan Favicon Unggahan"
                            : "Menggunakan Favicon Default LPK SCI"}
                        </p>
                        <p className="text-[9px] text-slate-400 leading-normal">
                          {custFaviconUrl
                            ? "Favicon kustom akan ditampilkan di tab browser pengguna Anda."
                            : "Pilih file gambar Anda (disarankan format square/PNG) untuk mengganti icon tab browser."}
                        </p>
                      </div>
                    </div>

                    {/* Drag-Drop Zone container for Favicon */}
                    <div
                      onDragEnter={handleFaviconDrag}
                      onDragLeave={handleFaviconDrag}
                      onDragOver={handleFaviconDrag}
                      onDrop={handleFaviconDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        custFaviconDragActive
                          ? "border-indigo-600 bg-indigo-50/40 text-indigo-950"
                          : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-500"
                      }`}
                    >
                      <input
                        type="file"
                        id="input-file-favicon"
                        accept="image/*"
                        onChange={handleFaviconFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      />
                      <div className="space-y-1.5 pointer-events-none flex flex-col items-center">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-[11px] font-bold text-slate-700">
                          Seret & Letakkan favicon di sini, atau{" "}
                          <span className="text-indigo-600 font-extrabold underline">
                            Cari File
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400">
                          Disarankan format PNG/ICO square, rasio 1:1 (Maks. 500KB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Logo Icon Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Lencana Lambang (Icon)
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {[
                        { name: "GraduationCap", ic: GraduationCap },
                        { name: "Award", ic: Award },
                        { name: "BookOpen", ic: BookOpen },
                        { name: "Globe", ic: Globe },
                        { name: "Anchor", ic: Anchor },
                        { name: "Compass", ic: Compass },
                        { name: "Sparkles", ic: Sparkles },
                        { name: "Heart", ic: Heart },
                        { name: "Landmark", ic: Landmark },
                      ].map((item) => {
                        const IconComponent = item.ic;
                        const isSelected = custLogoIcon === item.name;
                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => setCustLogoIcon(item.name)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-[10px] gap-1.5 ${
                              isSelected
                                ? "bg-slate-950 text-white border-slate-950 shadow-sm font-bold"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="truncate max-w-full text-[8px]">
                              {item.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Theme Color Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Palet Rona Tema Utama
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "blue",
                          label: "Midnight Blue",
                          bg: "bg-blue-600",
                        },
                        {
                          id: "indigo",
                          label: "Kyoto Indigo",
                          bg: "bg-indigo-600",
                        },
                        {
                          id: "rose",
                          label: "Osaka",
                          bg: "bg-rose-500",
                        },
                        {
                          id: "emerald",
                          label: "Teal Shizuoka",
                          bg: "bg-emerald-600",
                        },
                        {
                          id: "amber",
                          label: "Golden Fuji",
                          bg: "bg-amber-500",
                        },
                        {
                          id: "slate",
                          label: "Slate Washitsu",
                          bg: "bg-slate-600",
                        },
                      ].map((col) => {
                        const isSelected = custThemeColor === col.id;
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => setCustThemeColor(col.id)}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition text-left cursor-pointer text-xs ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span
                              className={`h-4 w-4 rounded-full shadow-inner ${col.bg}`}
                            ></span>
                            <span>{col.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Check className="h-4 w-4 stroke-[3]" /> Simpan Kustomisasi
                    Identitas
                  </button>
                </ConfirmForm>
              </div>

              {/* Right side: Realtime Preview Mockup Box */}
              <div className="lg:col-span-5 bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 sm:p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-widest">
                    LIVE LAYOUT PREVIEW
                  </span>
                  <h4 className="font-sans font-bold text-slate-800 text-sm">
                    Pratinjau Hasil Desain Navbar
                  </h4>
                </div>

                {/* Mock Navbar Item Representation */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-xl blur-xs opacity-40 bg-indigo-500 animate-pulse"></div>
                      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md">
                        {/* Dynamically render matching icon preview */}
                        {(() => {
                          const iconMap: {
                            [key: string]: React.ComponentType<any>;
                          } = {
                            GraduationCap,
                            Award,
                            BookOpen,
                            Globe,
                            Anchor,
                            Compass,
                            Sparkles,
                            Heart,
                            Landmark,
                          };
                          const IconToRender =
                            iconMap[custLogoIcon || "GraduationCap"] ||
                            GraduationCap;
                          return (
                            <IconToRender className="h-4.5 w-4.5 text-blue-400" />
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="font-sans text-xs font-black tracking-tight text-slate-900 block leading-none uppercase text-left">
                        {custLogoText || "LPK Source Course"}
                      </span>
                      <span className="text-[7.5px] font-sans font-bold text-slate-400 block tracking-wide uppercase pt-0.5 text-left">
                        DKP & Bahasa Jepang Resmi
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 text-[8px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      FRONTEND
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-white ${
                        {
                          blue: "bg-blue-600",
                          indigo: "bg-indigo-600",
                          rose: "bg-rose-500",
                          emerald: "bg-emerald-600",
                          amber: "bg-amber-500",
                          slate: "bg-slate-600",
                        }[custThemeColor || "blue"]
                      }`}
                    >
                      ACTIVE
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 text-[11px] leading-relaxed font-normal text-left">
                  <h5 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" /> Cara Kerja
                    Sinkronisasi
                  </h5>
                  Instalasi penyesuaian ini dijalankan secara instan. Ketika
                  Anda mengklik tombol "Simpan Kustomisasi", sistem akan
                  menyimpan status barunya ke memori server utama,
                  mendistribusikannya ke seluruh komponen situs web pendaftar
                  secara otomatis tanpa perlu mematikan container.
                </div>
              </div>
            </div>

            {/* KOORDINAT & RADIUS ABSENSI */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                      Pengaturan Lokasi Kantor & Radius Presensi (Admin / VVIP)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Konfigurasi titik pusat GPS LPK dan jarak maksimum kehadiran fisik (default: 200 meter).
                    </p>
                  </div>
                </div>
                {/* Save button for coordinates only */}
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
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Simpan Lokasi Presensi
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Latitude */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Garis Lintang (Latitude)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={officeLat || ""}
                        onChange={(e) => setOfficeLat(e.target.value)}
                        className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="Gunakan tombol Deteksi Koordinat di bawah"
                      />
                    </div>

                    {/* Longitude */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Garis Bujur (Longitude)
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={officeLon || ""}
                        onChange={(e) => setOfficeLon(e.target.value)}
                        className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition"
                        placeholder="Gunakan tombol Deteksi Koordinat di bawah"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Radius */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Radius Toleransi (Meter)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          value={officeRadius || ""}
                          onChange={(e) => setOfficeRadius(e.target.value)}
                          className="w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition"
                          placeholder="200"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400">
                          meter
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 block">
                        Jarak aman standar adalah 200 meter dari titik koordinat.
                      </p>
                    </div>

                    {/* Enforce */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Validasi Lokasi Aktif
                      </label>
                      <div className="flex items-center gap-2 py-2">
                        <input
                          type="checkbox"
                          checked={!!officeEnforce}
                          onChange={(e) => setOfficeEnforce(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-750">
                          Wajibkan presensi dari dalam radius kantor (Luring)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setOfficeLat(String(position.coords.latitude));
                              setOfficeLon(String(position.coords.longitude));
                              alert("📍 Koordinat lokasi Anda saat ini berhasil dideteksi dan diisi!");
                            },
                            (error) => {
                              alert(`⚠️ Gagal mendeteksi lokasi: ${error.message}`);
                            }
                          );
                        } else {
                          alert("⚠️ Browser Anda tidak mendukung pendeteksian lokasi GPS.");
                        }
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      📍 Deteksi Koordinat Saya Saat Ini
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                      📍 Status Koordinat Saat Ini
                    </span>
                    <div className="space-y-1 font-mono text-xs text-slate-700 font-bold">
                      <div>Lat: <span className="text-indigo-700">{officeLat || "Belum diatur"}</span></div>
                      <div>Lon: <span className="text-indigo-700">{officeLon || "Belum diatur"}</span></div>
                      <div>Radius: <span className="text-indigo-700">{officeRadius || "200"} m</span></div>
                      <div>Enforce: <span className="text-indigo-700">{officeEnforce ? "Aktif (Wajib)" : "Nonaktif"}</span></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                    Sistem akan menghitung jarak koordinat GPS smartphone pengajar ketika melakukan presensi secara real-time dan membandingkannya dengan koordinat ini. Jika jarak melebihi <strong>{officeRadius || "200"} meter</strong>, presensi akan otomatis ditolak oleh sistem.
                  </p>
                </div>
              </div>
            </div>

            {/* BELOW: Slideshow Editor Section */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-indigo-600" />
                  <h4 className="font-display font-bold text-slate-900 text-sm uppercase tracking-wide">
                    Galeri & Slideshow Foto Utama
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const existingIds = custSlides.filter(s => typeof s.id === 'number').map(s => s.id);
                    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
                    const newSlide = {
                      id: newId,
                      tag: "🌟 PROGRAM UNGGULAN BARU",
                      title:
                        "Daftar Sekarang Juga Untuk Angkatan Musim Panas 2026/2027",
                      description:
                        "Bimbingan terstruktur dan komprehensif bersama Sensei & Senpai berpengalaman di LPK kami.",
                      image:
                        "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80",
                      accent: "from-blue-500 through-indigo-500 to-purple-500",
                      glowColor: "shadow-indigo-500/25",
                      statValue: "100% Kontrak Kerja",
                      statText: "Siswa Terdaftar Berangkat",
                      actionText: "Daftar Sekarang 🚀",
                    };
                    setCustSlides(prev => [...(prev || []), newSlide]);
                    setSelectedSlideId(newId);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Slide Baru
                </button>
              </div>

              {custSlides.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  Tidak ada slide konfigurasional. Silakan klik "Tambah Slide
                  Baru".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  {custSlides.map((slide, sIdx) => {
                    const isEditing = selectedSlideId === slide.id;
                    return (
                      <div
                        key={slide.id}
                        className={`rounded-2xl border transition overflow-hidden flex flex-col justify-between ${
                          isEditing
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50/20"
                        }`}
                      >
                        {/* Image Preview Thumbnail */}
                        <div
                          className="relative h-28 w-full bg-slate-950 bg-cover bg-center"
                          style={{ backgroundImage: `url('${slide.image || "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80"}')` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
                          <div className="absolute bottom-2 left-2 right-2 text-left">
                            <span className="text-[8px] bg-slate-900/60 font-bold px-1.5 py-0.5 rounded-md text-slate-200 border border-slate-700/60 uppercase select-none inline-block w-max truncate max-w-full">
                              {slide.tag || "SLIDE"}
                            </span>
                            <span className="text-[10px] text-white font-extrabold truncate block mt-1 drop-shadow-sm leading-tight">
                              {slide.title || "No Title"}
                            </span>
                          </div>
                        </div>

                        {/* Info & Editing forms */}
                        <div className="p-3 text-xs text-left text-slate-600 flex-1 space-y-2">
                          {isEditing ? (
                            <div className="space-y-2 pt-1.5 text-left">
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                  Tag Badge
                                </label>
                                <input
                                  type="text"
                                  value={slide.tag || ""}
                                  onChange={(e) => {
                                    const updated = [...custSlides];
                                    updated[sIdx] = {
                                      ...updated[sIdx],
                                      tag: e.target.value,
                                    };
                                    setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                  }}
                                  className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                  Judul Slide
                                </label>
                                <input
                                  type="text"
                                  value={slide.title || ""}
                                  onChange={(e) => {
                                    const updated = [...custSlides];
                                    updated[sIdx] = {
                                      ...updated[sIdx],
                                      title: e.target.value,
                                    };
                                    setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                  }}
                                  className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                  Deskripsi Ringkas
                                </label>
                                <textarea
                                  value={slide.description || ""}
                                  onChange={(e) => {
                                    const updated = [...custSlides];
                                    updated[sIdx] = {
                                      ...updated[sIdx],
                                      description: e.target.value,
                                    };
                                    setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                  }}
                                  className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500 min-h-[45px] leading-snug"
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                  Tautan Gambar (URL/Unsplash) atau Upload Gambar
                                </label>
                                <div className="flex flex-col gap-1">
                                  <input
                                    type="text"
                                    value={slide.image || ""}
                                    placeholder="Tempel URL gambar di sini"
                                    onChange={(e) => {
                                      const updated = [...custSlides];
                                      updated[sIdx] = {
                                        ...updated[sIdx],
                                        image: e.target.value,
                                      };
                                      setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                    }}
                                    className="w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500 font-mono"
                                  />
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-bold text-slate-400">ATAU</span>
                                    <label className="relative text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition">
                                      Upload File
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            const file = e.target.files[0];
                                            setSliderUploadStatus(prev => ({ ...prev, [sIdx]: 'loading' }));
                                            uploadFileToFirebase(file, "customization").then(url => {
                                              const updated = [...custSlides];
                                              updated[sIdx] = {
                                                ...updated[sIdx],
                                                image: url,
                                              };
                                              setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                              onUpdateState("slideshows", "update", updated);
                                              setSliderUploadStatus(prev => ({ ...prev, [sIdx]: 'success' }));
                                              setTimeout(() => setSliderUploadStatus(prev => ({ ...prev, [sIdx]: undefined as any })), 3000);
                                            }).catch(err => { 
                                              console.error(err); 
                                              alert("Gagal upload slide"); 
                                              setSliderUploadStatus(prev => ({ ...prev, [sIdx]: undefined as any }));
                                            });
                                          }
                                        }}
                                      />
                                      {sliderUploadStatus[sIdx] === 'loading' && (
                                        <div className="absolute right-0 top-0 flex items-center gap-1 text-[8px] text-indigo-600 font-bold bg-white px-1 rounded-sm shadow-xs border border-indigo-200">
                                          <LoaderCircle className="w-2.5 h-2.5 animate-spin" /> Uploading...
                                        </div>
                                      )}
                                      {sliderUploadStatus[sIdx] === 'success' && (
                                        <div className="absolute right-0 top-0 flex items-center gap-1 text-[8px] text-emerald-600 font-bold bg-white px-1 rounded-sm shadow-xs border border-emerald-200">
                                          <Check className="w-2.5 h-2.5" /> OK
                                        </div>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                    Nilai Stat
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.statValue || ""}
                                    onChange={(e) => {
                                      const updated = [...custSlides];
                                      updated[sIdx] = {
                                        ...updated[sIdx],
                                        statValue: e.target.value,
                                      };
                                      setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      onUpdateState("slideshows", "update", updated);
                                    }}
                                    className="w-full text-[10px] p-1 border rounded-md bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                    Keterangan Stat
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.statText || ""}
                                    onChange={(e) => {
                                      const updated = [...custSlides];
                                      updated[sIdx] = {
                                        ...updated[sIdx],
                                        statText: e.target.value,
                                      };
                                      setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      onUpdateState("slideshows", "update", updated);
                                    }}
                                    className="w-full text-[10px] p-1 border rounded-md bg-white"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                    Teks Tombol
                                  </label>
                                  <input
                                    type="text"
                                    value={slide.actionText || ""}
                                    onChange={(e) => {
                                      const updated = [...custSlides];
                                      updated[sIdx] = {
                                        ...updated[sIdx],
                                        actionText: e.target.value,
                                      };
                                      setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      onUpdateState("slideshows", "update", updated);
                                    }}
                                    className="w-full text-[10px] p-1 border rounded-md bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-[8px] font-bold text-slate-500 block uppercase">
                                    Gradien Aksen
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="from-blue-500 through-indigo-500 to-purple-500"
                                    value={slide.accent || ""}
                                    onChange={(e) => {
                                      const updated = [...custSlides];
                                      updated[sIdx] = {
                                        ...updated[sIdx],
                                        accent: e.target.value,
                                      };
                                      setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                                      onUpdateState("slideshows", "update", updated);
                                    }}
                                    className="w-full text-[10px] p-1 border rounded-md bg-white font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 pt-1 text-left">
                              <p className="line-clamp-3 text-[11px] leading-snug">
                                {slide.description}
                              </p>
                              <div className="border-t border-slate-100 py-1 flex items-center justify-between text-[10px] font-mono select-none">
                                <span className="text-slate-400">Stat:</span>
                                <span className="text-slate-800 font-bold">
                                  {slide.statValue} / {slide.statText}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions footer */}
                        <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditing) {
                                setSelectedSlideId(null);
                              } else {
                                setSelectedSlideId(slide.id);
                              }
                            }}
                            className={`font-black text-[9px] px-2.5 py-1 rounded-md transition uppercase cursor-pointer ${
                              isEditing
                                ? "bg-slate-900 text-white"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            {isEditing ? "Selesai" : "Sunting"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = custSlides.filter(
                                (s) => s.id !== slide.id,
                              );
                              setCustSlides(updated); onUpdateState("slideshows", "update", updated);
                              onUpdateState("slideshows", "update", updated);
                              if (selectedSlideId === slide.id) {
                                setSelectedSlideId(null);
                              }
                            }}
                            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition"
                            title="Hapus Slide"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <ConfirmForm
                  confirmTitle="Simpan Slideshow"
                  confirmMessage="Menerapkan gambar dan teks slideshow ini ke beranda publik secara instan?"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await onUpdateState("slideshows", "update", custSlides);
                    if (ok) {
                      setSlideSaveSuccess(true);
                      setTimeout(() => setSlideSaveSuccess(false), 3000);
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" /> 
                    {slideSaveSuccess ? "Berhasil Disimpan!" : "Simpan Masukan Slideshow & Branding"}
                  </button>
                </ConfirmForm>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                    <LayoutTemplate className="h-6 w-6 text-indigo-600" />
                    Kustomisasi Konten Halaman Depan
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sesuaikan teks dan konten untuk bagian Ekosistem, Alumni, dan Program di halaman depan.
                  </p>
                </div>
              </div>
              
              {custLandingConfig && (
                <div className="space-y-8">
                  {/* Hero Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Ucapan Selamat Datang (Hero)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Judul Utama</label>
                        <input type="text" value={custLandingConfig.heroTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, heroTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Subjudul Utama</label>
                        <textarea value={custLandingConfig.heroSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, heroSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                      </div>
                    </div>
                  </div>

                  {/* Ekosistem Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Ekosistem (Gen-Z Perks)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Judul Ekosistem</label>
                        <input type="text" value={custLandingConfig.ecosystemTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, ecosystemTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Subjudul Ekosistem</label>
                        <textarea value={custLandingConfig.ecosystemSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, ecosystemSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                      </div>
                    </div>
                    
                    {/* Perks Items Editor */}
                    <div className="space-y-2 mt-4">
                      <label className="text-xs font-bold text-slate-700 block">Daftar Fitur Ekosistem</label>
                      <div className="space-y-3">
                        {custLandingConfig.perks?.map((perk: any, idx: number) => (
                          <div key={perk.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                            <div className="md:col-span-3 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Judul Fitur</label>
                              <input type="text" value={perk.title || ""} onChange={(e) => {
                                const newPerks = [...custLandingConfig.perks];
                                newPerks[idx] = { ...perk, title: e.target.value };
                                setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                              }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                            </div>
                            <div className="md:col-span-8 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Deskripsi Fitur</label>
                              <textarea value={perk.desc || ""} onChange={(e) => {
                                const newPerks = [...custLandingConfig.perks];
                                newPerks[idx] = { ...perk, desc: e.target.value };
                                setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                              }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" rows={2} />
                            </div>
                            <div className="md:col-span-1 flex items-end pb-1 justify-end">
                              <button type="button" onClick={() => {
                                const newPerks = custLandingConfig.perks.filter((_: any, i: number) => i !== idx);
                                setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                              }} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const newId = custLandingConfig.perks?.length > 0 ? Math.max(...custLandingConfig.perks.map((p: any) => p.id || 0)) + 1 : 1;
                          const newPerk = { id: newId, title: "Fitur Baru", desc: "Deskripsi", color: "blue" };
                          setCustLandingConfig({ ...custLandingConfig, perks: [...(custLandingConfig.perks || []), newPerk] });
                        }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                          <Plus className="h-3.5 w-3.5" /> Tambah Fitur
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Alumni Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Apa Kata Alumni</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Judul Testimoni</label>
                        <input type="text" value={custLandingConfig.alumniTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Subjudul Testimoni</label>
                        <textarea value={custLandingConfig.alumniSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                      </div>
                    </div>

                    {/* Testimonials Items Editor */}
                    <div className="space-y-2 mt-4">
                      <label className="text-xs font-bold text-slate-700 block">Daftar Testimoni</label>
                      <div className="space-y-3">
                        {custLandingConfig.testimonials?.map((testimonial: any, idx: number) => (
                          <div key={testimonial.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                            <div className="md:col-span-3 space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Nama Alumni</label>
                                <input type="text" value={testimonial.name} onChange={(e) => {
                                  const newItems = [...custLandingConfig.testimonials];
                                  newItems[idx] = { ...testimonial, name: e.target.value };
                                  setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                                }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Peran / Pekerjaan</label>
                                <input type="text" value={testimonial.role || ""} onChange={(e) => {
                                  const newItems = [...custLandingConfig.testimonials];
                                  newItems[idx] = { ...testimonial, role: e.target.value };
                                  setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                                }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                              </div>
                            </div>
                            <div className="md:col-span-8 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Isi Testimoni</label>
                              <textarea value={testimonial.content || ""} onChange={(e) => {
                                const newItems = [...custLandingConfig.testimonials];
                                newItems[idx] = { ...testimonial, content: e.target.value };
                                setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                              }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden h-full min-h-[4rem]" />
                            </div>
                            <div className="md:col-span-1 flex items-end pb-1 justify-end">
                              <button type="button" onClick={() => {
                                const newItems = custLandingConfig.testimonials.filter((_: any, i: number) => i !== idx);
                                setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                              }} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const newId = custLandingConfig.testimonials?.length > 0 ? Math.max(...custLandingConfig.testimonials.map((p: any) => p.id || 0)) + 1 : 1;
                          const newItem = { id: newId, name: "Nama Baru", role: "Peran Baru", content: "Isi testimoni" };
                          setCustLandingConfig({ ...custLandingConfig, testimonials: [...(custLandingConfig.testimonials || []), newItem] });
                        }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                          <Plus className="h-3.5 w-3.5" /> Tambah Testimoni
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Programs Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Program Pemagangan</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Judul Program</label>
                        <input type="text" value={custLandingConfig.programsTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, programsTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Subjudul Program</label>
                        <textarea value={custLandingConfig.programsSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, programsSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                      </div>
                    </div>

                    {/* Programs Items Editor */}
                    <div className="space-y-2 mt-4">
                      <label className="text-xs font-bold text-slate-700 block">Daftar Program</label>
                      <div className="space-y-3">
                        {custLandingConfig.programs?.map((program: any, idx: number) => (
                          <div key={program.id || idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative">
                            <div className="md:col-span-3 space-y-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Tag (Pita)</label>
                                <input type="text" value={program.tag || ""} onChange={(e) => {
                                  const newItems = [...custLandingConfig.programs];
                                  newItems[idx] = { ...program, tag: e.target.value };
                                  setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                                }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden uppercase" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">Judul Program</label>
                                <input type="text" value={program.title || ""} onChange={(e) => {
                                  const newItems = [...custLandingConfig.programs];
                                  newItems[idx] = { ...program, title: e.target.value };
                                  setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                                }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" />
                              </div>
                            </div>
                            <div className="md:col-span-8 space-y-1">
                              <label className="text-[10px] font-bold text-slate-500">Deskripsi Program</label>
                              <textarea value={program.desc || ""} onChange={(e) => {
                                const newItems = [...custLandingConfig.programs];
                                newItems[idx] = { ...program, desc: e.target.value };
                                setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                              }} className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden h-full min-h-[4rem]" />
                            </div>
                            <div className="md:col-span-1 flex items-end pb-1 justify-end">
                              <button type="button" onClick={() => {
                                const newItems = custLandingConfig.programs.filter((_: any, i: number) => i !== idx);
                                setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                              }} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const newId = custLandingConfig.programs?.length > 0 ? Math.max(...custLandingConfig.programs.map((p: any) => p.id || 0)) + 1 : 1;
                          const newItem = { id: newId, title: "Program Baru", desc: "Deskripsi", tag: "INFO" };
                          setCustLandingConfig({ ...custLandingConfig, programs: [...(custLandingConfig.programs || []), newItem] });
                        }} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                          <Plus className="h-3.5 w-3.5" /> Tambah Program
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Biaya Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Biaya & Transparansi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Judul Biaya</label>
                        <input type="text" value={custLandingConfig.biayaTitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, biayaTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Subjudul Biaya</label>
                        <textarea value={custLandingConfig.biayaSubtitle || ""} onChange={(e) => setCustLandingConfig({...custLandingConfig, biayaSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" rows={2} />
                      </div>
                    </div>
                  </div>



                  {/* Opportunity Images Section */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Bagian: Gambar Kesempatan (3 Foto Utama)</h4>
                    {custLandingConfig.opportunityImages && custLandingConfig.opportunityImages.length >= 3 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[0, 1, 2].map((idx) => (
                          <div key={idx} className="space-y-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block">Label Gambar {idx + 1}</label>
                              <input
                                type="text"
                                value={custLandingConfig.opportunityImages![idx].label || ""}
                                onChange={(e) => {
                                  const newImages = [...custLandingConfig.opportunityImages!];
                                  newImages[idx] = { ...newImages[idx], label: e.target.value };
                                  setCustLandingConfig({ ...custLandingConfig, opportunityImages: newImages });
                                }}
                                className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-700 block">Link Gambar (URL) atau Upload {idx + 1}</label>
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/..."
                                value={custLandingConfig.opportunityImages![idx].url || ""}
                                onChange={(e) => {
                                  const newImages = [...custLandingConfig.opportunityImages!];
                                  newImages[idx] = { ...newImages[idx], url: e.target.value };
                                  setCustLandingConfig({ ...custLandingConfig, opportunityImages: newImages });
                                }}
                                className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition mb-2"
                              />
                              <div className="relative">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      setOppUploadStatus(prev => ({ ...prev, [idx]: 'loading' }));
                                      uploadFileToFirebase(file, "customization").then(url => {
                                        const newImages = [...custLandingConfig.opportunityImages!];
                                        newImages[idx] = { ...newImages[idx], url: url };
                                        const updatedConfig = { ...custLandingConfig, opportunityImages: newImages };
                                        setCustLandingConfig(updatedConfig);
                                        // Auto-save when an image is successfully uploaded
                                        onUpdateState("customization", "update", { landingConfig: updatedConfig });
                                        setOppUploadStatus(prev => ({ ...prev, [idx]: 'success' }));
                                        setTimeout(() => setOppUploadStatus(prev => ({ ...prev, [idx]: undefined as any })), 3000);
                                      }).catch(err => { 
                                        console.error(err); 
                                        alert("Gagal upload gambar"); 
                                        setOppUploadStatus(prev => ({ ...prev, [idx]: undefined as any }));
                                      });
                                    }
                                  }}
                                  className="w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition"
                                />
                                {oppUploadStatus[idx] === 'loading' && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-white px-1">
                                    <LoaderCircle className="w-3 h-3 animate-spin" /> Uploading...
                                  </div>
                                )}
                                {oppUploadStatus[idx] === 'success' && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-white px-1">
                                    <Check className="w-3 h-3" /> Berhasil
                                  </div>
                                )}
                              </div>
                            </div>
                            {custLandingConfig.opportunityImages![idx].url && (
                              <div className="h-20 rounded border border-slate-200 bg-slate-100 overflow-hidden relative mt-2">
                                <img src={custLandingConfig.opportunityImages![idx].url} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <ConfirmForm
                  confirmTitle="Simpan Halaman Depan"
                  confirmMessage="Menerapkan teks ini ke beranda publik secara instan?"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await onUpdateState("customization", "update", {
                      landingConfig: custLandingConfig,
                    });
                    if (ok) {
                      setLandingSaveSuccess(true);
                      setTimeout(() => setLandingSaveSuccess(false), 3000);
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" /> 
                    {landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Halaman Depan"}
                  </button>
                </ConfirmForm>
              </div>
            </div>
          </div>
        )}

        {activeSegment === "galeri" && (
          <AdminGaleriSegment
            custGallery={custGallery}
            setCustGallery={setCustGallery}
            galleryUploadStatus={galleryUploadStatus}
            setGalleryUploadStatus={setGalleryUploadStatus}
            onUpdateState={onUpdateState}
          />
        )}
        {activeSegment === "petasebaran" && <AdminPetaSebaranSegment adminMapInstanceRef={adminMapInstanceRef} adminMapRef={adminMapRef} onUpdateState={onUpdateState} sebaranPage={sebaranPage} selectedMapPref={selectedMapPref} setIsCreateMapModalOpen={setIsCreateMapModalOpen} setMapCity={setMapCity} setMapCompany={setMapCompany} setMapGraduationYear={setMapGraduationYear} setMapIsEditing={setMapIsEditing} setMapLatitude={setMapLatitude} setMapLongitude={setMapLongitude} setMapPrefecture={setMapPrefecture} setMapStudentId={setMapStudentId} setMapStudentName={setMapStudentName} setSebaranPage={setSebaranPage} setSelectedMapPref={setSelectedMapPref} systemState={systemState} />}

        {/* DATA AFILIASI & REKOMENDASI SISWA */}
        {activeSegment === "afiliasi" && <AdminAfiliasiSegment affiliateSearch={affiliateSearch} selectedReferrer={selectedReferrer} setAffiliateSearch={setAffiliateSearch} setSelectedReferrer={setSelectedReferrer} systemState={systemState} />}

        {activeSegment === "informasi" && <AdminInformasiSegment apkUpdateSaveSuccess={apkUpdateSaveSuccess} custApkUpdateNotes={custApkUpdateNotes} custLatestApkVersion={custLatestApkVersion} custPlayStoreUrl={custPlayStoreUrl} custRunningText={custRunningText} onUpdateState={onUpdateState} runningTextSaveSuccess={runningTextSaveSuccess} setApkUpdateSaveSuccess={setApkUpdateSaveSuccess} setCustApkUpdateNotes={setCustApkUpdateNotes} setCustLatestApkVersion={setCustLatestApkVersion} setCustPlayStoreUrl={setCustPlayStoreUrl} setCustRunningText={setCustRunningText} setRunningTextSaveSuccess={setRunningTextSaveSuccess} />}

        {activeSegment === "kelas" && (
          <AdminKelasSegment
            systemState={systemState}
            onUpdateState={onUpdateState}
            selectedClassForChapters={selectedClassForChapters}
            setSelectedClassForChapters={setSelectedClassForChapters}
            activeChapterTab={activeChapterTab}
            setActiveChapterTab={setActiveChapterTab}
            newChapterNumber={newChapterNumber}
            setNewChapterNumber={setNewChapterNumber}
            newChapterTitle={newChapterTitle}
            setNewChapterTitle={setNewChapterTitle}
            newChapterJapaneseTitle={newChapterJapaneseTitle}
            setNewChapterJapaneseTitle={setNewChapterJapaneseTitle}
            newChapterDesc={newChapterDesc}
            setNewChapterDesc={setNewChapterDesc}
            editingChapterNumber={editingChapterNumber}
            setEditingChapterNumber={setEditingChapterNumber}
          />
        )}
        {activeSegment === "kalender" && (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs">
            <CalendarView
              systemState={systemState}
              currentUser={currentUser || null}
              onUpdateState={onUpdateState}
              adminMode={true}
            />
          </div>
        )}

        {activeSegment === "manajemen" && (
          <div className="w-full animate-fade-in text-slate-800">
            <AccountSettingsView
              currentUser={currentUser}
              systemState={systemState}
              onUpdateState={onUpdateState}
              onLoginSuccess={() => {}}
              onOpenLogin={() => {}}
              initialTab="manajemen"
            />
          </div>
        )}

        {/* INVENTORY CREATE MODAL */}
        {isCreateInventoryModalOpen && createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <ShoppingBag className="h-4 w-4" />
                    </span>
                    Registrasi Inventaris Baru
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateInventoryModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <ConfirmForm
                  confirmTitle="Tambah Inventaris"
                  confirmMessage="Tambahkan rincian inventaris aset lpk baru ini?"
                  onSubmit={async (e) => {
                    await handleNewInventorySubmit(e);
                    setIsCreateInventoryModalOpen(false);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-slate-700">
                        Nama Barang / Aset
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: AC Daikin 1.5 PK"
                        value={invName}
                        onChange={(e) => setInvName(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-slate-700">
                        Volume / Jumlah
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="Contoh: 10"
                        value={invAmount}
                        onChange={(e) => setInvAmount(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-slate-700">
                        Kondisi Saat Ini
                      </label>
                      <select
                        value={invCondition}
                        onChange={(e: any) => setInvCondition(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      >
                        <option value="Baik">Berfungsi Baik (Sehat)</option>
                        <option value="Perlu Servis">
                          Sedikit Rusak / Perlu Pemelihara
                        </option>
                        <option value="Rusak">Rusak Parah / Mati Total</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold block text-slate-700">
                          Penempatan Area
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsAddAreaModalOpen(true)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Area Baru
                        </button>
                      </div>
                      <select
                        value={invLoc}
                        onChange={(e: any) => {
                          if (e.target.value === "__ADD_NEW_AREA__") {
                            setIsAddAreaModalOpen(true);
                          } else {
                            setInvLoc(e.target.value);
                          }
                        }}
                        className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                      >
                        {getAvailableInventoryAreas().map((area) => (
                          <option key={area} value={area}>
                            {area}
                          </option>
                        ))}
                        <option value="__ADD_NEW_AREA__" className="font-bold text-indigo-600 bg-indigo-50">
                          ➕ + Tambah Area Baru...
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Daftarkan Alat
                    </button>
                  </div>
                </ConfirmForm>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 1: ADD NEW AREA DIALOG */}
        {isAddAreaModalOpen && createPortal(
          <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  Tambah Area Penempatan Baru
                </h3>
                <button
                  onClick={() => { setIsAddAreaModalOpen(false); setNewAreaInput(""); }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nama Area Penempatan (Lokasi)
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="Contoh: Gudang Logistik Lt. 2, Laboratorium Bahasa, Dapur LPK..."
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewArea(newAreaInput);
                    }
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 font-medium">
                  Area baru ini akan tersimpan dan langsung muncul di daftar lokasi penempatan inventaris.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsAddAreaModalOpen(false); setNewAreaInput(""); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!newAreaInput.trim()}
                  onClick={() => handleAddNewArea(newAreaInput)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" /> Simpan Area Baru
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: MANAGE INVENTORY AREAS */}
        {isManageInventoryAreasModalOpen && createPortal(
          <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <MapPin className="h-4 w-4" />
                    </span>
                    Kelola Area Penempatan Inventaris
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Tambah area lokasi baru, ubah nama area terdaftar, atau bersihkan area penempatan.
                  </p>
                </div>
                <button
                  onClick={() => setIsManageInventoryAreasModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto">
                {/* Quick Add Area Box */}
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-2">
                  <label className="text-xs font-bold text-indigo-900 block">
                    ➕ Tambah Area Penempatan Baru
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Contoh: Gudang Logistik Lt. 2, Laboratorium Bahasa..."
                      value={newAreaInput}
                      onChange={(e) => setNewAreaInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (newAreaInput.trim()) {
                            handleAddNewArea(newAreaInput);
                          }
                        }
                      }}
                      className="flex-1 text-xs rounded-xl border border-indigo-200 bg-white px-3 py-2 outline-none focus:border-indigo-500 font-medium"
                    />
                    <button
                      type="button"
                      disabled={!newAreaInput.trim()}
                      onClick={() => handleAddNewArea(newAreaInput)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tambah
                    </button>
                  </div>
                </div>

                {/* Existing Areas List */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Daftar Area Penempatan Saat Ini ({getAvailableInventoryAreas().length})
                  </label>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden">
                    {getAvailableInventoryAreas().map((area) => {
                      const itemCount = (systemState.inventory || []).filter(i => i.location === area).length;
                      const isEditingThis = editingAreaOldName === area;
                      const isCustom = (systemState.customization?.inventoryAreas || []).includes(area);

                      return (
                        <div key={area} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition">
                          {isEditingThis ? (
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={editingAreaNewName}
                                onChange={(e) => setEditingAreaNewName(e.target.value)}
                                autoFocus
                                className="flex-1 text-xs rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 font-medium outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleRenameArea(area, editingAreaNewName)}
                                className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingAreaOldName(null); setEditingAreaNewName(""); }}
                                className="bg-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-300 transition cursor-pointer"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                                  <MapPin className="h-3.5 w-3.5" />
                                </span>
                                <div className="truncate">
                                  <span className="text-xs font-bold text-slate-800 block truncate">
                                    {area}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {itemCount} barang ditempatkan
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAreaOldName(area);
                                    setEditingAreaNewName(area);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                  title="Ubah Nama Area"
                                >
                                  <Edit className="h-3.5 w-3.5 text-indigo-600" />
                                  <span className="text-[10px] hidden sm:inline">Edit</span>
                                </button>

                                {isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (itemCount > 0) {
                                        if (!confirm(`Area "${area}" masih berisi ${itemCount} barang. Yakin ingin menghapus area ini dari daftar lokasi?`)) {
                                          return;
                                        }
                                      }
                                      handleDeleteArea(area);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    title="Hapus Area"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsManageInventoryAreasModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-6 rounded-xl transition cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: EDIT INVENTORY ITEM */}
        {editingInventoryItem && createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </span>
                    Edit Data Inventaris Barang
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Kode: {editingInventoryItem.code}</p>
                </div>
                <button
                  onClick={() => setEditingInventoryItem(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditInventory} className="p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-xs font-semibold block text-slate-700">
                    Nama Barang / Aset
                  </label>
                  <input
                    type="text"
                    required
                    value={editInvName}
                    onChange={(e) => setEditInvName(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold block text-slate-700">
                      Volume / Jumlah (Pcs)
                    </label>
                    <input
                      type="number"
                      required
                      value={editInvAmount}
                      onChange={(e) => setEditInvAmount(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold block text-slate-700">
                      Kondisi Saat Ini
                    </label>
                    <select
                      value={editInvCondition}
                      onChange={(e: any) => setEditInvCondition(e.target.value)}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="Baik">Berfungsi Baik (Sehat)</option>
                      <option value="Perlu Servis">Sedikit Rusak / Perlu Pemeliharaan</option>
                      <option value="Rusak">Rusak Parah / Mati Total</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold block text-slate-700">
                      Penempatan Area
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddAreaModalOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" /> Area Baru
                    </button>
                  </div>
                  <select
                    value={editInvLoc}
                    onChange={(e: any) => {
                      if (e.target.value === "__ADD_NEW_AREA__") {
                        setIsAddAreaModalOpen(true);
                      } else {
                        setEditInvLoc(e.target.value);
                      }
                    }}
                    className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 font-medium"
                  >
                    {getAvailableInventoryAreas().map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                    <option value="__ADD_NEW_AREA__" className="font-bold text-indigo-600 bg-indigo-50">
                      ➕ + Tambah Area Baru...
                    </option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingInventoryItem(null)}
                    className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

                {/* MAP DATA CREATE MODAL */}
        {(isCreateMapModalOpen || mapIsEditing) && createPortal(
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-red-100 text-red-600 p-1.5 rounded-lg">
                      <MapPin className="h-4 w-4" />
                    </span>
                    {mapIsEditing ? "Edit Data Sebaran Alumni" : "Input Data Sebaran Alumni"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                      setIsCreateMapModalOpen(false);
                      setMapIsEditing(null);
                  }}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">

                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                  {mapIsEditing
                    ? `✏️ Mengedit Alumni ID: ${mapIsEditing}`
                    : "➕ Tambah / Perbarui Lokasi"}
                </span>

                {/* 1. Select student list dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Pilih Siswa / Alumni
                  </label>
                  <select
                    value={mapStudentId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMapStudentId(val);
                      if (val === "new" || val === "") {
                        setMapStudentName("");
                        setMapBatch("Angkatan 11");
                        setMapPrefecture("Tokyo");
                        setMapCity("");
                        setMapCompany("");
                        setMapLatitude("");
                        setMapLongitude("");
                      } else {
                        const found = systemState.activeStudents?.find(
                          (s) => s.id === val,
                        );
                        if (found) {
                          setMapStudentName(found.name);
                          setMapBatch(found.batch || "Angkatan 11");
                          setMapPrefecture(found.prefecture || "Tokyo");
                          setMapCity(found.city || "");
                          setMapCompany(found.company || "");
                          setMapLatitude(
                            found.latitude != null ? String(found.latitude) : "",
                          );
                          setMapLongitude(
                            found.longitude != null ? String(found.longitude) : "",
                          );
                          setMapGraduationYear(found.graduationYear || "");
                        }
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Hubungkan dengan Siswa Aktif --</option>
                    <option value="new">🆕 Alumni Baru / Tulis Manual</option>
                    {(systemState.activeStudents || [])
                      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                      .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.status} - {s.class})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Custom Name (enabled if manual or preset) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Nama Alumni / Siswa
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap alumni..."
                    value={mapStudentName}
                    onChange={(e) => setMapStudentName(e.target.value)}
                    disabled={mapStudentId !== "new" && mapStudentId !== ""}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Angkatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Angkatan 11, Angkatan 12..."
                    value={mapBatch}
                    onChange={(e) => setMapBatch(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 3. Preset Cepat Kota Jepang */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block">
                      📍 Preset Cepat Koordinat (48 Prefektur)
                    </label>
                    <input
                      type="text"
                      placeholder="Cari prefektur..."
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      className="text-[10px] px-2 py-1 border border-slate-200 rounded-lg bg-white max-w-[140px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                    {Object.keys(ALL_48_PREFECTURES_COORDINATES)
                      .filter((p) => p.toLowerCase().includes(presetSearch.toLowerCase()))
                      .map((pref) => {
                        const coords = ALL_48_PREFECTURES_COORDINATES[pref];
                        return (
                          <button
                            key={pref}
                            type="button"
                            onClick={() => {
                              setMapPrefecture(pref);
                              setMapCity(pref);
                              setMapLatitude(coords[0].toString());
                              setMapLongitude(coords[1].toString());
                            }}
                            className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-200 transition active:scale-95 cursor-pointer"
                          >
                            {pref}
                          </button>
                        );
                      })}
                  </div>
                </div>




                {/* 4. Prefecture Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Prefektur di Jepang
                  </label>
                  <select
                    value={mapPrefecture}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMapPrefecture(val);
                      if (ALL_48_PREFECTURES_COORDINATES[val]) {
                        setMapLatitude(ALL_48_PREFECTURES_COORDINATES[val][0].toString());
                        setMapLongitude(ALL_48_PREFECTURES_COORDINATES[val][1].toString());
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    {JAPAN_PREFECTURES.map((pref) => (
                      <option key={pref} value={pref}>
                        {pref}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 5. Specific City / Tempat Kerja */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Nama Kota / Area Spesifik
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Shinjuku, Yodogawa, Uji"
                    value={mapCity}
                    onChange={(e) => setMapCity(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 6. Company Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Pasangan Kerja / Perusahaan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Tokyo Luxury Care, Sanko Delica"
                    value={mapCompany}
                    onChange={(e) => setMapCompany(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 7. Latitude & Longitude in 2 cols */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">
                      Latitude (Lintang)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Contoh: 35.6895"
                      value={mapLatitude}
                      onChange={(e) => setMapLatitude(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">
                      Longitude (Bujur)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Contoh: 139.6917"
                      value={mapLongitude}
                      onChange={(e) => setMapLongitude(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Tahun Lulus
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 2024"
                    value={mapGraduationYear}
                    onChange={(e) => setMapGraduationYear(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="pt-2 flex gap-2">
                  {mapIsEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setMapIsEditing(null);
                        setIsCreateMapModalOpen(false);
                        setMapStudentId("");
                        setMapStudentName("");
                        setMapBatch("Angkatan 11");
                        setMapPrefecture("Tokyo");
                        setMapCity("");
                        setMapCompany("");
                        setMapLatitude("");
                        setMapLongitude("");
                        setMapGraduationYear("");
                      }}
                      className="w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold py-2.5 px-3 rounded-xl transition uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!mapStudentName) {
                        alert("Silakan masukkan nama alumni / siswa.");
                        return;
                      }

                      const latVal = mapLatitude && String(mapLatitude).trim() !== "" ? Number(mapLatitude) : null;
                      const lngVal = mapLongitude && String(mapLongitude).trim() !== "" ? Number(mapLongitude) : null;

                      // If existing student, update them, otherwise add a new activeStudent with "Di Jepang" status
                      if (mapStudentId && mapStudentId !== "new") {
                        const ok = await onUpdateState(
                          "activeStudents",
                          "update_status",
                          {
                            id: mapStudentId,
                            batch: mapBatch || "Angkatan 11",
                            status: "Di Jepang",
                            prefecture: mapPrefecture,
                            city: mapCity,
                            company: mapCompany,
                            graduationYear: mapGraduationYear,
                            latitude: latVal !== null && !isNaN(latVal) ? latVal : null,
                            longitude: lngVal !== null && !isNaN(lngVal) ? lngVal : null,
                          },
                        );
                        if (ok) {
                          alert("Lokasi alumni berhasil diperbarui!");
                        }
                      } else {
                        // Add new manual alumnus
                        const ok = await onUpdateState(
                          "activeStudents",
                          "add",
                          {
                            name: mapStudentName,
                            batch: mapBatch || "Angkatan 11",
                            class: "",
                            status: "Di Jepang",
                            prefecture: mapPrefecture,
                            city: mapCity,
                            company: mapCompany,
                            graduationYear: mapGraduationYear,
                            latitude: latVal !== null && !isNaN(latVal) ? latVal : null,
                            longitude: lngVal !== null && !isNaN(lngVal) ? lngVal : null,
                          },
                        );
                        if (ok) {
                          alert(
                            "Alumni baru berhasil ditambah ke peta sebaran!",
                          );
                        }
                      }

                      // Reset form
                      setMapIsEditing(null);
                      setIsCreateMapModalOpen(false);
                      setMapStudentId("");
                      setMapStudentName("");
                      setMapBatch("Angkatan 11");
                      setMapPrefecture("Tokyo");
                      setMapCity("");
                      setMapCompany("");
                      setMapLatitude("");
                      setMapLongitude("");
                    }}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-black py-2.5 px-3 rounded-xl transition uppercase tracking-wider shadow-xs cursor-pointer"
                  >
                    {mapIsEditing ? "Simpan Perubahan" : "Simpan Lokasi Alumni"}
                  </button>
                </div>
              
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* TAX CREATE MODAL */}
        {isCreateTaxModalOpen && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <FileText className="h-4 w-4" />
                    </span>
                    Rekor Bulan Keuangan
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateTaxModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <ConfirmForm
                  confirmTitle="Simpan Pajak/Jurnal Masuk"
                  confirmMessage="Simpan pembukuan bulan ini ke log pajak?"
                  onSubmit={async (e) => {
                    await handleNewTaxSubmit(e);
                    setIsCreateTaxModalOpen(false);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-slate-700">
                        Masa / Bulan Buku
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Juni 2026"
                        value={taxMonth}
                        onChange={(e) => setTaxMonth(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold block text-slate-700">
                          Omzet Pendapatan (Rupiah)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="Contoh: 120000000"
                          value={taxRev}
                          onChange={(e) => setTaxRev(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold block text-slate-700">
                          Beban Pengeluaran (Rupiah)
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="Contoh: 60000000"
                          value={taxExp}
                          onChange={(e) => setTaxExp(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-xl text-[11px] text-slate-600 border border-slate-200 mt-2">
                      Sistem pajak menghitung estimasi{" "}
                      <strong>Pajak PPN LPK sebesar 11%</strong> dari selisih
                      bersih pendapatan bulanan untuk pelaporan masa e-Faktur
                      Pajak Kemnaker.
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="h-4 w-4" /> Simpan Jurnal Masa
                    </button>
                  </div>
                </ConfirmForm>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* TAX EDIT MODAL */}
        {isEditTaxModalOpen && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                      <Edit className="h-4 w-4" />
                    </span>
                    Edit Rekor Pajak
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsEditTaxModalOpen(false);
                    resetTaxForm();
                  }}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <ConfirmForm
                  confirmTitle="Simpan Perubahan"
                  confirmMessage="Anda yakin ingin menyimpan perubahan pada rekor pajak ini?"
                  onSubmit={handleEditTaxSubmit}
                  className="space-y-4 text-xs"
                >
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-slate-700">
                        Masa / Bulan Buku
                      </label>
                      <input
                        type="text"
                        required
                        value={taxMonth}
                        onChange={(e) => setTaxMonth(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold block text-slate-700">
                          Omzet Pendapatan (Rupiah)
                        </label>
                        <input
                          type="number"
                          required
                          value={taxRev}
                          onChange={(e) => setTaxRev(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold block text-slate-700">
                          Beban Pengeluaran (Rupiah)
                        </label>
                        <input
                          type="number"
                          required
                          value={taxExp}
                          onChange={(e) => setTaxExp(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Edit className="h-4 w-4" /> Simpan Perubahan
                    </button>
                  </div>
                </ConfirmForm>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* PREVIEW DOCUMENT MODAL */}
        {previewTaxFile && createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Pratinjau: {previewTaxFileName}
                </h3>
                <button
                  onClick={() => {
                    setPreviewTaxFile(null);
                    setPreviewTaxFileName("");
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-100 p-4">
                <object
                  data={previewTaxFile}
                  type={previewTaxFile.startsWith("data:application/pdf") ? "application/pdf" : "image/jpeg"}
                  className="w-full h-full rounded-xl shadow-sm"
                >
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
                    <Eye className="h-10 w-10 text-slate-300" />
                    <p className="text-sm font-semibold">Tidak dapat menampilkan pratinjau</p>
                  </div>
                </object>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* JOB ORDER CREATE MODAL */}
        {isCreateJobOrderModalOpen && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <Plus className="h-4 w-4" />
                    </span>
                    Buat Job Order Baru
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Pastikan rincian gaji, tunjangan, dan overtime tertulis jelas demi transparansi.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateJobOrderModalOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <ConfirmForm
                  confirmTitle="Terbitkan Lowongan"
                  confirmMessage="Anda yakin ingin menerbitkan data Job Order baru ini?"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (
                      !jobPartnerName ||
                      !jobOccupation ||
                      !jobLocation ||
                      !jobSalary
                    ) {
                      alert("Harap isi semua kolom wajib!");
                      return;
                    }
                    const ok = await onUpdateState("jobOrders", "add", {
                      partnerName: jobPartnerName,
                      noReg: jobNoReg,
                      jobType: jobType,
                      occupation: jobOccupation,
                      location: jobLocation,
                      salary: jobSalary,
                      overtime: jobOvertime,
                      allowance: jobAllowance,
                      contractDuration: jobContractDuration || "3 Tahun",
                      tbRequirement: jobTbReq,
                      bbRequirement: jobBbReq,
                      interviewExecution: jobIntvExec,
                      interviewDate: jobIntvDate,
                      scheduleRegistration: jobScheduleRegistration,
                      scheduleDocumentSelection: jobScheduleDocumentSelection,
                      scheduleAnnouncement: jobScheduleAnnouncement,
                      scheduleMcu: jobScheduleMcu,
                      gender: jobGender,
                      ageRequirement: jobAgeRequirement,
                      recruitCount: jobRecruitCount,
                      jobDescription: jobDescription,
                      minJapaneseScore: jobMinJapaneseScore,
                      minAttendanceScore: jobMinAttendanceScore,
                      minFiveSScore: jobMinFiveSScore,
                      minMathScore: jobMinMathScore,
                      minEthicsScore: jobMinEthicsScore,
                    });
                    if (ok) {
                      setJobPartnerName("");
                      setJobNoReg("");
                      setJobOccupation("");
                      setJobType("Tokutei ginou");
                      setJobLocation("");
                      setJobSalary("");
                      setJobOvertime("");
                      setJobAllowance("");
                      setJobContractDuration("");
                      setJobTbReq("");
                      setJobBbReq("");
                      setJobIntvExec("");
                      setJobIntvDate("");
                      setJobScheduleRegistration("");
                      setJobScheduleDocumentSelection("");
                      setJobScheduleAnnouncement("");
                      setJobScheduleMcu("");
                      setJobGender("");
                      setJobAgeRequirement("");
                      setJobRecruitCount("");
                      setJobDescription("");
                      setJobMinJapaneseScore("");
                      setJobMinAttendanceScore("");
                      setJobMinFiveSScore("");
                      setJobMinMathScore("");
                      setJobMinEthicsScore("");
                      setIsCreateJobOrderModalOpen(false);
                      alert("Job Order sukses terdaftar di sistem!");
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 block">
                      PT Mitra / Agency Rekanan (Wajib)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: PT Fuji Tokutei Agency Tokyo"
                      value={jobPartnerName}
                      onChange={(e) => setJobPartnerName(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        No Registrasi (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: R-1234"
                        value={jobNoReg}
                        onChange={(e) => setJobNoReg(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        Jenis Visa / Program
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      >
                        <option value="Tokutei ginou">Tokutei ginou</option>
                        <option value="Ginou jisshusei">Ginou jisshusei</option>
                        <option value="Ryugakusei">Ryugakusei</option>
                        <option value="Engineering">Engineering</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        Bidang Pekerjaan (Wajib)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Pengolahan Makanan / Perawat Lansia"
                        value={jobOccupation}
                        onChange={(e) => setJobOccupation(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        Lokasi / Prefektur (Wajib)
                      </label>
                      <select
                        required
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      >
                        <option value="">-- Pilih Lokasi --</option>
                        {JAPAN_PREFECTURES.map((pref) => (
                          <option key={pref} value={pref}>
                            {pref}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 block">
                      Rincian Gaji (Wajib)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: ¥180,000 / Bulan (Take home pay)"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        Tunjangan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Asrama, Asuransi"
                        value={jobAllowance}
                        onChange={(e) => setJobAllowance(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold uppercase text-slate-500 block">
                        Estimasi Lembur
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: ~20 Jam / Bulan"
                        value={jobOvertime}
                        onChange={(e) => setJobOvertime(e.target.value)}
                        className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 block">
                      Durasi Kontrak
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 3 Tahun (Bisa diperpanjang)"
                      value={jobContractDuration}
                      onChange={(e) => setJobContractDuration(e.target.value)}
                      className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                    />
                  </div>

                  {/* JADWAL & PELAKSANAAN (SINKRON DENGAN SISWA) */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-indigo-50/30 space-y-4">
                    <label className="text-xs font-black uppercase text-indigo-700 block border-b border-indigo-100 pb-2">
                      Pengaturan Jadwal Proses (Sinkron LMS Siswa)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          1. Pendaftaran
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 1-10 Mei 2026"
                          value={jobScheduleRegistration}
                          onChange={(e) => setJobScheduleRegistration(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          2. Seleksi Dokumen
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 11-14 Mei 2026"
                          value={jobScheduleDocumentSelection}
                          onChange={(e) => setJobScheduleDocumentSelection(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          3. Pelaksanaan Interview
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Online (Zoom)"
                          value={jobIntvExec}
                          onChange={(e) => setJobIntvExec(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Jadwal Interview
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 15-20 Mei 2026"
                          value={jobIntvDate}
                          onChange={(e) => setJobIntvDate(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          4. Pengumuman Kelulusan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 25 Mei 2026"
                          value={jobScheduleAnnouncement}
                          onChange={(e) => setJobScheduleAnnouncement(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          5. Medical Check Up
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 26-30 Mei 2026"
                          value={jobScheduleMcu}
                          onChange={(e) => setJobScheduleMcu(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KUALIFIKASI FISIK & DEMOGRAFI */}
                  <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                    <label className="text-xs font-black uppercase text-slate-600 block border-b border-slate-200 pb-2">
                      Syarat Kualifikasi
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Gender
                        </label>
                        <select
                          value={jobGender}
                          onChange={(e) => setJobGender(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        >
                          <option value="">Bebas</option>
                          <option value="Laki-laki">Laki-laki Saja</option>
                          <option value="Perempuan">Perempuan Saja</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Usia Max
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 30"
                          value={jobAgeRequirement}
                          onChange={(e) => setJobAgeRequirement(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Min Tinggi (cm)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 160"
                          value={jobTbReq}
                          onChange={(e) => setJobTbReq(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Min Berat (kg)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 50"
                          value={jobBbReq}
                          onChange={(e) => setJobBbReq(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Min B. Jepang
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: BAB 15"
                          value={jobMinJapaneseScore}
                          onChange={(e) =>
                            setJobMinJapaneseScore(e.target.value)
                          }
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Min Absensi (%)
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 80"
                          value={jobMinAttendanceScore}
                          onChange={(e) =>
                            setJobMinAttendanceScore(e.target.value)
                          }
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Min Nilai 5S
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 80"
                          value={jobMinFiveSScore}
                          onChange={(e) => setJobMinFiveSScore(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">
                          Min Nilai MTK
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: 90"
                          value={jobMinMathScore}
                          onChange={(e) => setJobMinMathScore(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                        Min Nilai Etika
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 80"
                        value={jobMinEthicsScore}
                        onChange={(e) => setJobMinEthicsScore(e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black uppercase tracking-wider transition cursor-pointer shadow-sm mt-4"
                  >
                    Publish Job Order 🚀
                  </button>
                </ConfirmForm>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* JOB ORDER EDIT MODAL */}
        {editingJobOrder && (
          <EditJobOrderModal
            job={editingJobOrder}
            onClose={() => setEditingJobOrder(null)}
            onUpdateState={onUpdateState}
          />
        )}

        {/* ADMIN EDIT REGISTRATION DATA MODAL */}
        {adminEditingStudentId && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                      <FileText className="h-4 w-4" />
                    </span>
                    Edit Data Lengkap Siswa
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 ml-9">
                    ID: {adminEditingStudentId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(() => {
                    const activeStudentMatch = systemState.activeStudents.find(s => s.id === adminEditingStudentId);
                    const student = systemState.registeredStudents.find(s => s.id === adminEditingStudentId) || systemState.registeredStudents.find(s => s.name === activeStudentMatch?.name) || activeStudentMatch;
                    if (!student) return null;
                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminEditingStudentId(null);
                            setVerifyingDocsStudent(student);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                        >
                          <FileText className="h-4 w-4" /> Lihat Berkas
                        </button>
                        {(student as any).proofOfPayment ? (
                          <button
                            type="button"
                            onClick={() => setViewingReceiptUrl((student as any).proofOfPayment || "")}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider"
                          >
                            <Receipt className="h-4 w-4" /> Buka Penuh
                          </button>
                        ) : null}
                      </>
                    );
                  })()}
                  <button
                    onClick={() => setAdminEditingStudentId(null)}
                    className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto">
                <form
                  id="adminRegForm"
                  onSubmit={handleAdminSaveReg}
                  className="space-y-5"
                >
                  {adminRegError && (
                    <div className="bg-red-50 text-red-600 p-3 text-xs rounded-xl border border-red-100 font-bold">
                      {adminRegError}
                    </div>
                  )}
                  {adminRegSuccess && (
                    <div className="bg-emerald-50 text-emerald-600 p-3 text-xs rounded-xl border border-emerald-100 font-bold">
                      Data siswa berhasil diperbarui.
                    </div>
                  )}

                  {/* Photo Upload Section */}
                  <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={getSafePhotoUrl(adminRegData.profilePicture || adminRegData.docFoto, adminRegData.name)}
                        alt={adminRegData.name || "Foto Siswa"}
                        className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-xs bg-slate-200 shrink-0"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = createSvgAvatar(adminRegData.name || 'Siswa');
                        }}
                      />
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Foto Profil / Pas Foto</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Unggah foto terbaru siswa (PNG/JPG)</p>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs active:scale-95 shrink-0">
                      <Camera className="h-4 w-4" />
                      <span>Ganti Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const url = await uploadFileToFirebase(file, "profile_pictures");
                            setAdminRegData({
                              ...adminRegData,
                              profilePicture: url,
                              docFoto: url,
                            });
                          } catch (err) {
                            console.error(err);
                            alert("Gagal mengunggah foto profil");
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={adminRegData.name || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            name: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Program / Kelas
                      </label>
                      <input
                        type="text"
                        value={adminRegData.program || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            program: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Angkatan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Angkatan 11, Angkatan 12..."
                        value={adminRegData.batch || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            batch: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        No WhatsApp *
                      </label>
                      <input
                        type="text"
                        value={adminRegData.phone || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Alamat / Domisili
                      </label>
                      <input
                        type="text"
                        value={adminRegData.district || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            district: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={adminRegData.birthDate || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            birthDate: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Jenis Kelamin
                      </label>
                      <select
                        value={adminRegData.gender || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            gender: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer"
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
                        value={adminRegData.education || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            education: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Asal Sekolah
                      </label>
                      <input
                        type="text"
                        value={adminRegData.school || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            school: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Tahun Lulus
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 2024"
                        value={adminRegData.graduationYear || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            graduationYear: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Kemampuan Bahasa Jepang
                      </label>
                      <input
                        type="text"
                        value={adminRegData.japaneseLevel || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            japaneseLevel: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Status Pendaftaran
                      </label>
                      <select
                        value={adminRegData.statusPendaftaran || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            statusPendaftaran: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer"
                      >
                        <option value="Siswa Baru">Siswa Baru</option>
                        <option value="Alumni">Alumni (Gratis Biaya)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Email Pendaftaran *
                      </label>
                      <input
                        type="email"
                        value={adminRegData.email || ""}
                        onChange={(e) =>
                          setAdminRegData({
                            ...adminRegData,
                            email: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Kata Sandi / Password (Login)
                      </label>
                      <div className="relative">
                        <input
                          type={showAdminRegPassword ? "text" : "password"}
                          placeholder="Belum diatur (bawaan: 123456)"
                          value={adminRegData.password || ""}
                          onChange={(e) =>
                            setAdminRegData({
                              ...adminRegData,
                              password: e.target.value,
                            })
                          }
                          className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 pr-10 outline-none focus:border-indigo-500 transition bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminRegPassword(!showAdminRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showAdminRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* JOB MATCHING & EVALUASI - sesuai monitoring Excel */}
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                        <Landmark className="h-3.5 w-3.5" />
                      </span>
                      Job Matching & Evaluasi
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Mitra SO / TSK
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: OSSI/BREXA, LINK BALI"
                          value={adminRegData.mitraSO || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, mitraSO: e.target.value })}
                          className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Keterangan (Status Job Matching)
                        </label>
                        <select
                          value={adminRegData.jobKeterangan || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, jobKeterangan: e.target.value })}
                          className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer"
                        >
                          <option value="">-</option>
                          <option value="Lulus">Lulus</option>
                          <option value="Interview">Interview</option>
                          <option value="SA/Mendang">SA/Mendang</option>
                          <option value="Out">Out</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">List Job (1)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Bidang"
                          value={adminRegData.job1Bidang || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, job1Bidang: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Tanggal Mensetsu"
                          value={adminRegData.job1TanggalMensetsu || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, job1TanggalMensetsu: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Lokasi"
                          value={adminRegData.job1Lokasi || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, job1Lokasi: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-white"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-4 space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">List Job (2)</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Bidang"
                          value={adminRegData.job2Bidang || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, job2Bidang: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Tanggal Mensetsu"
                          value={adminRegData.job2TanggalMensetsu || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, job2TanggalMensetsu: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Lokasi"
                          value={adminRegData.job2Lokasi || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, job2Lokasi: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Bulan Kelulusan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Juni"
                          value={adminRegData.bulanKelulusan || ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, bulanKelulusan: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Attitude
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0-100"
                          value={adminRegData.attitudeScore ?? ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, attitudeScore: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Nilai Kaiwa
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0-100"
                          value={adminRegData.kaiwaScore ?? ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, kaiwaScore: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                          Bobot Rekomendasi
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          placeholder="0-100"
                          value={adminRegData.bobotNilaiRekomendasi ?? ""}
                          onChange={(e) => setAdminRegData({ ...adminRegData, bobotNilaiRekomendasi: e.target.value })}
                          className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        Catatan
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Catatan tambahan mengenai siswa..."
                        value={adminRegData.keterangan || ""}
                        onChange={(e) => setAdminRegData({ ...adminRegData, keterangan: e.target.value })}
                        className="w-full text-sm font-medium rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 resize-y"
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdminEditingStudentId(null)}
                  className="px-5 py-2.5 bg-white text-slate-600 rounded-xl text-xs font-black border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  form="adminRegForm"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-sm cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Receipt Image Viewer Modal */}
        {viewingReceiptUrl && (() => {
          const cleanReceiptUrl = viewingReceiptUrl.includes("|") ? viewingReceiptUrl.split("|")[1] : viewingReceiptUrl;
          return createPortal(
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
              <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h4 className="font-bold text-slate-800 text-sm">
                    Bukti Transfer Pembayaran
                  </h4>
                  <button
                    onClick={() => setViewingReceiptUrl(null)}
                    className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-y-auto w-full">
                  {!cleanReceiptUrl || (!cleanReceiptUrl.startsWith('http') && !cleanReceiptUrl.startsWith('data:')) ? (
                    <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm">
                      <div className="text-amber-500 text-3xl mb-2">⚠️</div>
                      <p className="text-sm font-bold text-slate-200">Tidak ada berkas bukti transfer</p>
                      <p className="text-xs text-slate-400 mt-1">Pendaftar belum mengunggah bukti transfer pembayaran.</p>
                    </div>
                  ) : cleanReceiptUrl.includes("application/pdf") || cleanReceiptUrl.toLowerCase().includes(".pdf") || (viewingReceiptUrl.includes("|") && viewingReceiptUrl.split("|")[0].toLowerCase().includes(".pdf")) ? (
                    <object
                      data={getEmbeddablePdfUrl(cleanReceiptUrl)}
                      type="application/pdf"
                      className="w-full h-[60vh] rounded-lg border border-slate-700 bg-white"
                    >
                      <iframe
                        src={getEmbeddablePdfUrl(cleanReceiptUrl)}
                        className="w-full h-full rounded-lg border-0 bg-white"
                        title="Bukti Transfer PDF"
                      />
                    </object>
                  ) : (
                    <img
                      src={cleanReceiptUrl}
                      alt="Bukti Transfer"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                    />
                  )}
                </div>
                <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                  <button
                    onClick={() => setViewingReceiptUrl(null)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Tutup Gambar
                  </button>
                </div>
              </div>
            </div>,
            document.body
          );
        })()}

        {/* Verifikasi Berkas Modal */}
        {verifyingDocsStudent && createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9990] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">
                      Verifikasi Berkas: {verifyingDocsStudent.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Periksa kelengkapan dokumen pendaftaran siswa.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setVerifyingDocsStudent(null);
                        startAdminEditReg(verifyingDocsStudent.id);
                      }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer border border-indigo-100"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Edit Biodata Siswa
                    </button>
                    {(() => {
                      const studentInfo = (systemState.registeredStudents.find(s => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find(s => s.name === verifyingDocsStudent.name) || verifyingDocsStudent);
                      if (studentInfo.proofOfPayment) {
                        return (
                          <button
                            type="button"
                            onClick={() => setViewingReceiptUrl(studentInfo.proofOfPayment || "")}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer border border-emerald-100"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Lihat Bukti Pembayaran
                          </button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <button
                  onClick={() => setVerifyingDocsStudent(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
                <StudentDocsManager 
                  student={(systemState.registeredStudents.find(s => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find(s => s.name === verifyingDocsStudent.name) || verifyingDocsStudent)} 
                  onUpdateState={onUpdateState} 
                  onViewDoc={(url, title) => setViewingDocUrl({url, title})} 
                />

                {(() => {
                  const student = (systemState.registeredStudents.find(s => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find(s => s.name === verifyingDocsStudent.name) || verifyingDocsStudent);
                  if (student.status === "Berkas Valid") {
                    return (
                      <div className="mt-8 bg-white border border-indigo-200 p-6 rounded-2xl shadow-sm animate-fade-in">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
                              💳 Verifikasi Bukti Pembayaran
                            </h3>
                            <p className="text-sm text-slate-600">
                              Berkas telah divalidasi. Langkah selanjutnya adalah memastikan bukti transfer/pembayaran pendaftaran sesuai.
                            </p>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Status Pembayaran:</span>
                                <span className={`font-black px-3 py-1 rounded-full text-xs uppercase tracking-wide border leading-none ${
                                    student.paymentStatus === "Lunas"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                                      : student.paymentStatus === "Ditolak"
                                        ? "bg-rose-100 text-rose-700 border-rose-300"
                                        : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse-once"
                                  }`}
                                >
                                  {student.paymentStatus || "Pending"}
                                </span>
                              </div>
                              
                              <div className="pt-2">
                                <span className="text-xs font-bold text-slate-500 uppercase block mb-2">Dokumen Bukti Transfer:</span>
                                {student.proofOfPayment ? (
                                  <div className="flex flex-col gap-2">

                                    <button
                                      type="button"
                                      onClick={() => setViewingReceiptUrl(student.proofOfPayment || "")}
                                      className="flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-xl transition cursor-pointer w-full justify-center border border-blue-200"
                                    >
                                      👁️ Buka / Lihat Bukti Bayar
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-sm text-rose-600 font-bold bg-rose-50 border border-rose-200 p-3 rounded-xl text-center">
                                    Belum ada bukti pembayaran yang diunggah
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 justify-center">
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdateState("registeredStudents", "update", {
                                  id: student.id,
                                  paymentStatus: "Lunas",
                                  paymentAmount: student.paymentAmount || 500000
                                });
                                

                              }}
                              className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black uppercase cursor-pointer transition flex items-center justify-center gap-2 shadow-sm"
                            >
                              <Check className="h-5 w-5" /> Sahkan (Lunas)
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdateState("registeredStudents", "update", {
                                  id: student.id,
                                  paymentStatus: "Ditolak"
                                });
                              }}
                              className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black uppercase cursor-pointer transition flex items-center justify-center gap-2 shadow-sm"
                            >
                              <X className="h-5 w-5" /> Tolak Bukti
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdateState("registeredStudents", "update", {
                                  id: student.id,
                                  paymentStatus: "Pending"
                                });
                              }}
                              className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-black uppercase cursor-pointer transition flex items-center justify-center gap-2 shadow-sm mt-2"
                            >
                              Reset Status
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
                <button
                  onClick={() => setVerifyingDocsStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
                {(() => {
                  const student = (systemState.registeredStudents.find(s => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find(s => s.name === verifyingDocsStudent.name) || verifyingDocsStudent);
                  if (student.status === "Pending") {
                    return (
                      <button
                        onClick={async () => {
                          await onUpdateState("registeredStudents", "update", { id: verifyingDocsStudent.id, status: "Berkas Valid" });
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="h-4 w-4" />
                        Approve Kelengkapan Berkas
                      </button>
                    );
                  }
                  if (student.status === "Berkas Valid" && student.paymentStatus === "Lunas") {
                    const lmsClasses = systemState?.customization?.lmsClasses || [];
                    const activeClasses = lmsClasses.filter((c: any) => c.isActive !== false);
                    const teachers = (systemState.users || []).filter(u => u.role === "Pengajar");
                    const assignedTeachers = teachers.filter(t => t.assignedClass === selectedClassToPlot);

                    return (
                      <div className="flex flex-col md:flex-row items-center gap-3 w-full justify-end bg-indigo-50/50 p-4 border-t border-indigo-100 rounded-b-3xl">
                        <div className="flex gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0">
                          <ConfirmButton
                            confirmTitle="Terima Pendaftar"
                            confirmMessage={`Anda yakin menyetujui ${student.name} sebagai siswa aktif? Mereka belum akan dimasukkan ke kelas manapun hingga Anda memplotnya.`}
                            onConfirmClick={async () => {
                              handleApprove(student, "");
                              setVerifyingDocsStudent(null);
                              setSelectedClassToPlot("");
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                            id={`btn-approve-modal-${student.id}`}
                          >
                            <Check className="h-4 w-4" />
                            Terima & Jadikan Siswa Aktif
                          </ConfirmButton>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Document Viewer Modal */}
        {viewingDocUrl && createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm">
                  {viewingDocUrl.title || "Lihat Dokumen"}
                </h4>
                <button
                  onClick={() => setViewingDocUrl(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[50vh] max-h-[75vh] overflow-y-auto gap-4">
                {!viewingDocUrl.url || (!viewingDocUrl.url.startsWith('http') && !viewingDocUrl.url.startsWith('data:')) ? (
                  <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm">
                    <div className="text-amber-500 text-3xl mb-2">⚠️</div>
                    <p className="text-sm font-bold text-slate-200">Berkas tidak tersedia</p>
                    <p className="text-xs text-slate-400 mt-1">Pendaftar belum mengunggah dokumen {viewingDocUrl.title || "ini"}.</p>
                  </div>
                ) : viewingDocUrl.url.includes("application/pdf") || viewingDocUrl.url.toLowerCase().includes(".pdf") ? (
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                      <p className="text-sm text-slate-300 font-bold mb-3 font-sans">
                        Dokumen ini adalah format PDF.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                          href={viewingDocUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Buka PDF di Tab Baru</span>
                        </a>
                        <a
                          href={viewingDocUrl.url}
                          download={viewingDocUrl.title ? `${viewingDocUrl.title}.pdf` : "dokumen.pdf"}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Unduh / Simpan PDF</span>
                        </a>
                      </div>
                    </div>
                    <object
                      data={getEmbeddablePdfUrl(viewingDocUrl.url)}
                      type="application/pdf"
                      className="w-full h-[50vh] bg-white rounded-lg shadow-md border border-slate-200"
                    >
                      <iframe
                        src={getEmbeddablePdfUrl(viewingDocUrl.url)}
                        title="PDF Viewer"
                        className="w-full h-full bg-white rounded-lg border-0"
                      />
                    </object>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center gap-4">
                    <div className="flex flex-wrap gap-3 justify-center items-center w-full">
                      {viewingDocUrl.url.startsWith('data:') && (
                        <a
                          href={viewingDocUrl.url}
                          download={viewingDocUrl.title ? `${viewingDocUrl.title}.jpg` : "gambar.jpg"}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Unduh / Simpan Gambar</span>
                        </a>
                      )}

                      {/* Zoom & Rotation Controls */}
                      <div className="flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 shadow-lg text-white">
                        <button
                          onClick={() => setDocZoom(prev => Math.max(0.5, prev - 0.25))}
                          disabled={docZoom <= 0.5}
                          className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition text-slate-300 hover:text-white cursor-pointer"
                          title="Perkecil (Zoom Out)"
                        >
                          <ZoomOut className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-mono font-bold select-none min-w-[40px] text-center text-slate-200">
                          {Math.round(docZoom * 100)}%
                        </span>
                        <button
                          onClick={() => setDocZoom(prev => Math.min(4, prev + 0.25))}
                          disabled={docZoom >= 4}
                          className="p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition text-slate-300 hover:text-white cursor-pointer"
                          title="Perbesar (Zoom In)"
                        >
                          <ZoomIn className="h-4 w-4" />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                        <button
                          onClick={() => setDocRotation(prev => (prev + 90) % 360)}
                          className="p-1 hover:bg-slate-700 rounded transition text-slate-300 hover:text-white cursor-pointer"
                          title="Putar 90° (Rotate)"
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                        <button
                          onClick={() => { setDocZoom(1); setDocRotation(0); }}
                          className="px-2 py-0.5 text-[10px] font-bold hover:bg-slate-700 rounded transition text-slate-300 hover:text-white cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800 min-h-[40vh] max-h-[60vh]">
                      <div className="transition-all duration-200 ease-out flex items-center justify-center" style={{ transform: `scale(${docZoom}) rotate(${docRotation}deg)` }}>
                        <img
                          src={viewingDocUrl.url}
                          alt="Dokumen"
                          referrerPolicy="no-referrer"
                          className="max-w-full max-h-[45vh] object-contain rounded-lg shadow-md"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
                <button
                  onClick={() => setViewingDocUrl(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Tutup Dokumen
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* CV Viewer Modal */}
        {viewingCvStudentId && activeSegment !== "dataCV" && createPortal(
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden">
            <div className="bg-white rounded-3xl max-w-[1200px] w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" /> CV & Biodata Jepang
                </h4>
                <button
                  onClick={() => setViewingCvStudentId(null)}
                  className="p-1.5 hover:bg-rose-100 hover:text-rose-600 rounded-full transition text-slate-500 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="overflow-y-auto flex-1 bg-slate-50">
                {(() => {
                  const student = systemState.activeStudents.find(s => s.id === viewingCvStudentId);
                  if (!student) return <div className="p-8 text-center text-slate-500">Student not found</div>;
                  return (
                    <StudentCvView
                      student={student}
                      onUpdateStudent={async (payload) => {
                        return await onUpdateState("activeStudents", "update", payload);
                      }}
                      lpkName={systemState.customization?.logoText || "LPK Source Course"}
                    />
                  );
                })()}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    
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
              <Edit className="w-5 h-5 text-indigo-600" />
              Edit Data Pembayaran
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Jumlah (Rp)</label>
                <input type="number" id="edit-pay-amount" defaultValue={editingPayment.amount} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Kategori / Keterangan</label>
                <input type="text" id="edit-pay-cat" defaultValue={editingPayment.category} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Status</label>
                <select id="edit-pay-status" defaultValue={editingPayment.status} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
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
                 onUpdateState('payments', 'edit', { id: editingPayment.id, studentName: editingPayment.studentName, amount: Number(amt), category: cat, status: stat });
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

      {showSyncModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-600 animate-spin" />
                <span>Sinkronisasi Database Siswa</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 hover:bg-rose-100 hover:text-rose-600 rounded-full transition text-slate-500 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-left">
              <p className="text-sm text-slate-600 leading-relaxed">
                Fitur ini mencocokkan data <strong>Siswa Aktif</strong> dan <strong>Siswa Baru</strong> dengan daftar <strong>Akun Pengguna</strong> aktif di database.
              </p>

              {outOfSyncActive.length === 0 && outOfSyncRegistered.length === 0 ? (
                <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">Semua Data Sinkron!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Tidak ditemukan adanya data "siswa hantu" (siswa aktif/baru yang akun penggunanya sudah didelete). Semua data Anda dalam kondisi bersih dan sinkron.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-amber-950">Ditemukan {outOfSyncActive.length + outOfSyncRegistered.length} Data Tidak Sinkron!</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        Terdapat data siswa aktif atau baru yang akun penggunanya (user account) telah didelete atau tidak ditemukan dalam database. Anda dapat menghapus data yatim ini agar sinkron kembali.
                      </p>
                    </div>
                  </div>

                  {outOfSyncActive.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Siswa Aktif Tanpa Akun ({outOfSyncActive.length}):</h5>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[150px] overflow-y-auto">
                        {outOfSyncActive.map(st => (
                          <div key={st.id} className="p-3 bg-slate-50/50 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{st.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{st.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {outOfSyncRegistered.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Pendaftaran Tanpa Akun ({outOfSyncRegistered.length}):</h5>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[150px] overflow-y-auto">
                        {outOfSyncRegistered.map(st => (
                          <div key={st.id} className="p-3 bg-slate-50/50 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">{st.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">Disetujui</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Tutup
              </button>
              {(outOfSyncActive.length > 0 || outOfSyncRegistered.length > 0) && (
                <button
                  type="button"
                  onClick={handleSyncStudents}
                  disabled={syncingStudents}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2"
                >
                  {syncingStudents ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Hapus & Sinkronkan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ============================================================================
// COMPONENT: EDIT JOB ORDER MODAL
// ============================================================================
interface EditJobOrderModalProps {
  job: any;
  onClose: () => void;
  onUpdateState: any;
}

function EditJobOrderModal({ job, onClose, onUpdateState }: EditJobOrderModalProps) {
  const [partnerName, setPartnerName] = useState(job.partnerName || "");
  const [noReg, setNoReg] = useState(job.noReg || "");
  const [jobType, setJobType] = useState(job.jobType || "Tokutei ginou");
  const [occupation, setOccupation] = useState(job.occupation || "");
  const [location, setLocation] = useState(job.location || "");
  const [salary, setSalary] = useState(job.salary || "");
  const [overtime, setOvertime] = useState(job.overtime || "");
  const [allowance, setAllowance] = useState(job.allowance || "");
  const [contractDuration, setContractDuration] = useState(job.contractDuration || "3 Tahun");
  const [tbRequirement, setTbRequirement] = useState(job.tbRequirement || "");
  const [bbRequirement, setBbRequirement] = useState(job.bbRequirement || "");
  const [interviewExecution, setInterviewExecution] = useState(job.interviewExecution || "");
  const [interviewDate, setInterviewDate] = useState(job.interviewDate || "");
  const [scheduleRegistration, setScheduleRegistration] = useState(job.scheduleRegistration || "");
  const [scheduleDocumentSelection, setScheduleDocumentSelection] = useState(job.scheduleDocumentSelection || "");
  const [scheduleAnnouncement, setScheduleAnnouncement] = useState(job.scheduleAnnouncement || "");
  const [scheduleMcu, setScheduleMcu] = useState(job.scheduleMcu || "");
  const [gender, setGender] = useState(job.gender || "");
  const [ageRequirement, setAgeRequirement] = useState(job.ageRequirement || "");
  const [recruitCount, setRecruitCount] = useState(job.recruitCount || "");
  const [jobDescription, setJobDescription] = useState(job.jobDescription || "");
  const [minJapaneseScore, setMinJapaneseScore] = useState(job.minJapaneseScore || "");
  const [minAttendanceScore, setMinAttendanceScore] = useState(job.minAttendanceScore || "");
  const [minFiveSScore, setMinFiveSScore] = useState(job.minFiveSScore || "");
  const [minMathScore, setMinMathScore] = useState(job.minMathScore || "");
  const [minEthicsScore, setMinEthicsScore] = useState(job.minEthicsScore || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !occupation || !location || !salary) {
      alert("Harap isi semua kolom wajib!");
      return;
    }
    setIsSaving(true);
    const ok = await onUpdateState("jobOrders", "edit", {
      id: job.id,
      updates: {
        partnerName,
        noReg,
        jobType,
        occupation,
        location,
        salary,
        overtime,
        allowance,
        contractDuration,
        tbRequirement,
        bbRequirement,
        interviewExecution,
        interviewDate,
        scheduleRegistration,
        scheduleDocumentSelection,
        scheduleAnnouncement,
        scheduleMcu,
        gender,
        ageRequirement,
        recruitCount,
        jobDescription,
        minJapaneseScore,
        minAttendanceScore,
        minFiveSScore,
        minMathScore,
        minEthicsScore,
      },
    });
    setIsSaving(false);
    if (ok) {
      alert("Job Order sukses diperbarui!");
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 p-1.5 rounded-lg">
                <Edit className="h-4 w-4" />
              </span>
              Edit Job Order
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Perbarui rincian lowongan kerja, jadwal proses, dan kualifikasi fisik siswa.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <ConfirmForm
            confirmTitle="Simpan Perubahan"
            confirmMessage="Anda yakin ingin menyimpan perubahan data Job Order ini?"
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 block">
                PT Mitra / Agency Rekanan (Wajib)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Fuji Tokutei Agency Tokyo"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  No Registrasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: R-1234"
                  value={noReg}
                  onChange={(e) => setNoReg(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Jenis Visa / Program
                </label>
                <select
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                >
                  <option value="Tokutei ginou">Tokutei ginou</option>
                  <option value="Ginou jisshusei">Ginou jisshusei</option>
                  <option value="Ryugakusei">Ryugakusei</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Bidang Pekerjaan (Wajib)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengolahan Makanan / Perawat Lansia"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Lokasi / Prefektur (Wajib)
                </label>
                <select
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                >
                  <option value="">-- Pilih Lokasi --</option>
                  {JAPAN_PREFECTURES.map((pref) => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 block">
                Rincian Gaji (Wajib)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: ¥180,000 / Bulan (Take home pay)"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Tunjangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Asrama, Asuransi"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Estimasi Lembur
                </label>
                <input
                  type="text"
                  placeholder="Contoh: ~20 Jam / Bulan"
                  value={overtime}
                  onChange={(e) => setOvertime(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Durasi Kontrak
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 3 Tahun (Bisa diperpanjang)"
                  value={contractDuration}
                  onChange={(e) => setContractDuration(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 block">
                  Jumlah Rekrutmen
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5 Orang"
                  value={recruitCount}
                  onChange={(e) => setRecruitCount(e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 block">
                Deskripsi Pekerjaan / Keterangan Lain
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan rincian deskripsi pekerjaan, jam kerja, atau catatan tambahan lainnya..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition resize-none"
              />
            </div>

            {/* JADWAL & PELAKSANAAN (SINKRON DENGAN SISWA) */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-indigo-50/30 space-y-4">
              <label className="text-xs font-black uppercase text-indigo-700 block border-b border-indigo-100 pb-2">
                Pengaturan Jadwal Proses (Sinkron LMS Siswa)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    1. Pendaftaran
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1-10 Mei 2026"
                    value={scheduleRegistration}
                    onChange={(e) => setScheduleRegistration(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    2. Seleksi Dokumen
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 11-14 Mei 2026"
                    value={scheduleDocumentSelection}
                    onChange={(e) => setScheduleDocumentSelection(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    3. Pelaksanaan Interview
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Online (Zoom)"
                    value={interviewExecution}
                    onChange={(e) => setInterviewExecution(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Jadwal Interview
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 15-20 Mei 2026"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    4. Pengumuman Kelulusan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 25 Mei 2026"
                    value={scheduleAnnouncement}
                    onChange={(e) => setScheduleAnnouncement(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    5. Medical Check Up
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 26-30 Mei 2026"
                    value={scheduleMcu}
                    onChange={(e) => setScheduleMcu(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* KUALIFIKASI FISIK & DEMOGRAFI */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4">
              <label className="text-xs font-black uppercase text-slate-600 block border-b border-slate-200 pb-2">
                Syarat Kualifikasi
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="">Bebas</option>
                    <option value="Laki-laki">Laki-laki Saja</option>
                    <option value="Perempuan">Perempuan Saja</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Usia Max
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 30"
                    value={ageRequirement}
                    onChange={(e) => setAgeRequirement(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Min Tinggi (cm)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 160"
                    value={tbRequirement}
                    onChange={(e) => setTbRequirement(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Min Berat (kg)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 50"
                    value={bbRequirement}
                    onChange={(e) => setBbRequirement(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Min B. Jepang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BAB 15"
                    value={minJapaneseScore}
                    onChange={(e) => setMinJapaneseScore(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Min Absensi (%)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 80"
                    value={minAttendanceScore}
                    onChange={(e) => setMinAttendanceScore(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Min Nilai 5S
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 80"
                    value={minFiveSScore}
                    onChange={(e) => setMinFiveSScore(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">
                    Min Nilai MTK
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 90"
                    value={minMathScore}
                    onChange={(e) => setMinMathScore(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 block">
                  Min Nilai Etika
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 80"
                  value={minEthicsScore}
                  onChange={(e) => setMinEthicsScore(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl text-sm font-black uppercase tracking-wider transition cursor-pointer shadow-sm mt-4 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan Perubahan...</span>
                </>
              ) : (
                <>
                  <span>Simpan Perubahan Job Order 💾</span>
                </>
              )}
            </button>
          </ConfirmForm>
        </div>
      </div>
    </div>,
    document.body
  );
}