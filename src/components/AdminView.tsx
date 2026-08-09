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
import { uploadFileToFirebase, getEmbeddablePdfUrl, getSafePhotoUrl } from "../lib/storageHelper";
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
    const logoUrl = systemState?.customization?.logoUrl;
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
        className={`hidden sm:flex shrink-0 ${isMenuMinimized ? "w-16" : "w-56"} transition-all duration-300 ease-in-out sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-1`}
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="bg-gradient-to-b from-indigo-50/90 via-slate-100/80 to-blue-50/90 p-1.5 sm:p-2 rounded-2xl border border-indigo-100 flex flex-col gap-1 w-full shadow-sm shadow-indigo-100/40">
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
        {activeSegment === "siswa" && (
          <div className="space-y-6 sm:space-y-8 animate-fade-in">
            <div className="flex flex-col 2xl:flex-row gap-4 justify-between items-stretch 2xl:items-center bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full overflow-hidden">
              {/* Menu icon tabs to separate Siswa Aktif, Siswa Baru, and Alumni */}
              <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/40 overflow-x-auto custom-scrollbar max-w-full w-full 2xl:w-auto shrink-0">
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
                    {systemState.activeStudents.filter(s => !["Lulus", "Di Jepang"].includes(s.status) && isStudentRoleOnly(s)).length}
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
                  <Sparkles className="h-4 w-4" />
                  <span>Siswa Baru</span>
                  <div className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "baru" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {(systemState.registeredStudents || []).filter(s => s.status !== "Disetujui" && isStudentRoleOnly(s)).length}
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
                    {systemState.activeStudents.filter(s => ["Lulus", "Di Jepang"].includes(s.status) && isStudentRoleOnly(s)).length}
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
                  onClick={checkSyncStatus}
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
                          {new Date(0, i).toLocaleString("id-ID", {
                            month: "long",
                          })}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto shrink-0"
                    >
                      <option value="All">Semua Tahun</option>
                      {["2021", "2022", "2023", "2024", "2025", "2026", "2027"].map(
                        (y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ),
                      )}
                    </select>

                    {siswaTab === "aktif" && (
                      <select
                        value={filterClass}
                        onChange={(e) => {
                          setFilterClass(e.target.value);
                          setSiswaPage(1);
                        }}
                        className="bg-white border border-slate-200/60 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto shrink-0"
                      >
                        <option value="All">Semua Kelas</option>
                        <option value="Belum Diplot">Belum Diplot</option>
                        {systemState.customization?.lmsClasses?.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    )}

                    <select
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setSiswaPage(1);
                      }}
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

            {/* Statistik & Filter Kelas: full-width scrollable table */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-white/10 group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

              <div className="relative z-10 space-y-4 sm:space-y-6 w-full">
                {/* Header & Page Switcher Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h4 className="font-display font-black text-white text-base sm:text-lg flex items-center gap-2 sm:gap-3 mb-1">
                      <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
                      <span>
                        {statCardMode === "kelas"
                          ? "Statistik & Filter Kelas"
                          : `Statistik Status Process ${filterClass !== "All" ? `(Kelas ${filterClass})` : "Semua Siswa"}`}
                      </span>
                    </h4>
                    <p className="text-slate-400 text-[10px] sm:text-[11px] font-medium leading-relaxed max-w-lg">
                      {statCardMode === "kelas"
                        ? "Geser tabel ke samping di layar kecil. Klik baris kelas untuk memfilter siswa di tabel bawah."
                        : `Menampilkan jumlah siswa per tahap status progres ${filterClass !== "All" ? `khusus untuk Kelas ${filterClass}` : "seluruh kelas"}. Klik baris status untuk memfilter.`}
                    </p>
                  </div>

                  {/* Interactive Flip / Tab Switcher Controls */}
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
                      {filterClass !== "All" && (
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

                {/* Insight Sektor Sukses - compact full-width banner (moved out of the side rail) */}
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

                {/* Page Content View - Page 1: Kelas Table (horizontally scrollable) */}
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
                        systemState.activeStudents
                          .filter((s: any) => {
                            const validClasses = systemState.customization?.lmsClasses || [];
                            return s.class && validClasses.some((c: any) => c.name === s.class);
                          })
                          .map((s: any) => s.class)
                      )
                    )
                      .sort()
                      .map((className, idx) => {
                        const classStudents = systemState.activeStudents.filter(
                          (o: any) => o.class === className && isStudentRoleOnly(o)
                        );
                        if (classStudents.length === 0) return null;

                        const isSelected = siswaTab === "aktif" && filterClass === className;

                        // Breakdown stats per class
                        const belajarCount = classStudents.filter((s: any) => s.status === "Belajar").length;
                        const jobCount = classStudents.filter((s: any) => s.status === "On Proges Job").length;
                        const jftCount = classStudents.filter((s: any) => s.status === "On Progres JFT/JLPT/SSW").length;
                        const diklatCount = classStudents.filter((s: any) => s.status === "Diklat SO").length;
                        const jepangCount = classStudents.filter((s: any) => s.status === "Di Jepang" || s.status === "Lulus").length;

                        const colors = [
                          "text-blue-400",
                          "text-sky-400",
                          "text-indigo-400",
                          "text-purple-400",
                          "text-pink-400",
                          "text-rose-400",
                          "text-orange-400",
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
                              if (siswaTab === "aktif" && filterClass === className) {
                                setFilterClass("All");
                              } else {
                                setSiswaTab("aktif");
                                setFilterClass(className);
                              }
                              setSiswaPage(1);
                              const tableElem = document.getElementById("tabel-siswa-section");
                              if (tableElem) {
                                tableElem.scrollIntoView({ behavior: "smooth" });
                              }
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

                    {systemState.activeStudents.filter(
                      (o: any) => o.status === "Di Jepang" && isStudentRoleOnly(o)
                    ).length > 0 && (() => {
                      const isSelected = siswaTab === "alumni";
                      const alumniStudents = systemState.activeStudents.filter((o: any) => o.status === "Di Jepang" && isStudentRoleOnly(o));
                      return (
                        <tr
                          onClick={() => {
                            if (siswaTab === "alumni") {
                              setSiswaTab("aktif");
                              setFilterClass("All");
                            } else {
                              setSiswaTab("alumni");
                              setFilterClass("All");
                            }
                            setSiswaPage(1);
                            const tableElem = document.getElementById("tabel-siswa-section");
                            if (tableElem) {
                              tableElem.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          title="Klik untuk memfilter daftar alumni di Jepang"
                          className={`cursor-pointer transition-colors group ${
                            isSelected ? "bg-emerald-600/30" : "bg-emerald-400/5 hover:bg-emerald-400/15"
                          }`}
                        >
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                            <span className="text-emerald-400 font-black uppercase tracking-wide text-[11px]">
                              Alumni (Di Jepang)
                            </span>
                            {isSelected && (
                              <span className="ml-2 text-[8px] font-black bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                                ✓ Filter
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-black text-emerald-400 text-sm">
                            {alumniStudents.length}
                          </td>
                          <td className="px-3 py-3 text-emerald-300 text-[9px] font-bold" colSpan={5}>
                            🇯🇵 {alumniStudents.length} Bekerja di Jepang
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400/80 group-hover:text-emerald-300 transition-colors whitespace-nowrap">
                              {isSelected ? "Reset" : "Lihat"}
                              <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </td>
                        </tr>
                      );
                    })()}
                    </tbody>
                  </table>
                  </div>
                )}

                {/* Page Content View - Page 2: Status & Lokasi Table */}
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
                      { id: "Belajar", label: "1. Belajar", icon: "🇮🇩", color: "text-blue-400", border: "border-blue-400/30", bg: "bg-blue-500/10" },
                      { id: "On Proges Job", label: "2. On Proges Job", icon: "💼", color: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-500/10" },
                      { id: "On Progres JFT/JLPT/SSW", label: "3. On Progres JFT", icon: "📋", color: "text-sky-400", border: "border-sky-400/30", bg: "bg-sky-500/10" },
                      { id: "Diklat SO", label: "4. Diklat SO", icon: "📘", color: "text-indigo-400", border: "border-indigo-400/30", bg: "bg-indigo-500/10" },
                      { id: "Lulus", label: "5. Lulus", icon: "🎓", color: "text-purple-400", border: "border-purple-400/30", bg: "bg-purple-500/10" },
                      { id: "Di Jepang", label: "6. Di Jepang", icon: "🇯🇵", color: "text-emerald-400", border: "border-emerald-400/30", bg: "bg-emerald-500/10" },
                      { id: "Dikeluarkan", label: "7. Dikeluarkan", icon: "❌", color: "text-rose-400", border: "border-rose-400/30", bg: "bg-rose-500/10" },
                    ].map((st) => {
                      const isSelected = filterStatus === st.id;
                      const count = (systemState.activeStudents || []).filter((s: any) => {
                        if (!isStudentRoleOnly(s)) return false;
                        if (filterClass !== "All") {
                          if (filterClass === "Belum Diplot" && s.class) return false;
                          if (filterClass !== "Belum Diplot" && s.class !== filterClass) return false;
                        }
                        return s.status === st.id;
                      }).length;

                      return (
                        <tr
                          key={st.id}
                          onClick={() => {
                            if (filterStatus === st.id) {
                              setFilterStatus("All");
                            } else {
                              setFilterStatus(st.id);
                            }
                            setSiswaPage(1);
                            const tableElem = document.getElementById("tabel-siswa-section");
                            if (tableElem) {
                              tableElem.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          title={`Klik untuk memfilter status ${st.label}`}
                          className={`cursor-pointer transition-colors group ${
                            isSelected ? "bg-indigo-600/30" : "hover:bg-white/5"
                          }`}
                        >
                          <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                            <span className={`${st.color} font-black uppercase tracking-wide text-[11px] flex items-center gap-1.5`}>
                              <span>{st.icon}</span>
                              <span>{st.label}</span>
                              {isSelected && (
                                <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                                  ✓ Filter
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-black text-sm text-white">
                            {count}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 group-hover:text-indigo-300 transition-colors whitespace-nowrap">
                              {isSelected ? "Reset" : "Filter"}
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

            <div id="tabel-siswa-section" className="flex flex-col space-y-4 scroll-mt-6">
              {/* Search Bar Input */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari siswa berdasarkan nama, ID, email, nomor HP, atau program..."
                    value={siswaSearch}
                    onChange={(e) => {
                      setSiswaSearch(e.target.value);
                      setSiswaPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-2xs"
                    id="input-cari-siswa"
                  />
                  {siswaSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setSiswaSearch("");
                        setSiswaPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {siswaSearch && (
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0 px-1">
                    <span>Hasil:</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-black">
                      {filteredSiswaItems.length} Siswa
                    </span>
                  </div>
                )}
              </div>

              {(filterClass !== "All" || filterStatus !== "All" || siswaTab === "alumni" || siswaSearch) && (
                <div className="bg-gradient-to-r from-indigo-500/10 via-blue-500/5 to-slate-100 border border-indigo-200/80 rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 shadow-xs animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Filter className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                        <span>Filter Terpilih</span>
                        <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded text-[9px]">Aktif</span>
                      </div>
                      <div className="text-xs sm:text-sm font-black text-slate-800 flex items-center flex-wrap gap-2">
                        <span>{siswaTab === "alumni" ? "Alumni (Di Jepang)" : filterClass !== "All" ? `Kelas ${filterClass}` : "Semua Kelas"}</span>
                        {filterStatus !== "All" && (
                          <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                            Status: {filterStatus}
                          </span>
                        )}
                        {siswaSearch && (
                          <span className="bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                            Pencarian: "{siswaSearch}"
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-500">
                          ({filteredSiswaItems.length} Siswa)
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSiswaTab("aktif");
                      setFilterClass("All");
                      setFilterStatus("All");
                      setSiswaSearch("");
                      setSiswaPage(1);
                    }}
                    className="bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs"
                  >
                    <X className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600" />
                    <span>Reset Filter</span>
                  </button>
                </div>
              )}
              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs">
                {siswaTab === "baru" ? (
                  <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight animate-fade-in">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight">
                          ID & Tanggal
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight">
                          Calon Siswa
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight">
                          Rincian Program & HP
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight">
                          Kualifikasi Target / Level
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight text-center">
                          Pembayaran / Bukti
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight text-center">
                          Status
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight text-center">
                          Verifikasi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedSiswaItems
                        .map((student) => (
                          <tr
                            key={`${student.id}-${student.name}`}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="md:p-4 p-1.5 py-2 font-mono text-slate-600">
                              <div>{student.id}</div>
                              <div className="text-[9px] text-slate-400">
                                {student.timestamp ? new Date(student.timestamp).toLocaleString("id-ID", {dateStyle: "medium", timeStyle: "short"}) : student.date}
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-slate-900">
                                  {student.name}
                                </div>
                              </div>
                              <div className="text-slate-500 font-mono text-[9px] mt-0.5">
                                {student.email}
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2">
                              <div className="font-semibold text-slate-800">
                                {student.program}
                              </div>
                              <div className="text-[9px] text-blue-600 font-mono">
                                WA: {student.phone}
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2">
                              <div className="flex flex-col gap-1 max-w-[190px]">
                                <span className="font-sans font-bold text-slate-800 text-[10px] leading-tight">
                                  {student.japaneseLevel}
                                </span>
                                {student.japaneseLevel.includes("KKNI Level 4") || student.japaneseLevel.includes("KKNI 4") || student.japaneseLevel.includes("N4") || student.japaneseLevel.includes("N3") ? (
                                  <span className="inline-flex w-fit items-center bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    Instruktur Utama (KKNI 4)
                                  </span>
                                ) : student.japaneseLevel.includes("KKNI Level 3") || student.japaneseLevel.includes("KKNI 3") || student.japaneseLevel.includes("N5") || student.japaneseLevel.toLowerCase().includes("asrama") || student.japaneseLevel.toLowerCase().includes("junior") ? (
                                  <span className="inline-flex w-fit items-center bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    Junior / Asrama (KKNI 3)
                                  </span>
                                ) : student.japaneseLevel.includes(
                                    "Native Speaker",
                                  ) ? (
                                  <span className="inline-flex w-fit items-center bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    Native Speaker Sensei
                                  </span>
                                ) : (
                                  <span className="inline-flex w-fit items-center bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                    Pembinaan Karakter Awal
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2">
                              <div className="flex flex-col items-center justify-center gap-1.5 text-center">
                                <span className="font-mono text-slate-800 font-bold text-[11px] leading-none">
                                  {student.paymentAmount ? `Rp ${student.paymentAmount.toLocaleString("id-ID")}` : "Rp 0"}
                                </span>
                                <span className="text-[8.5px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded max-w-[120px] truncate leading-none" title={student.paymentMethod || "Transfer"}>
                                  {student.paymentMethod || "Transfer Manual"}
                                </span>
                                
                                <div className="mt-0.5">
                                  <span
                                    className={`font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-wide border leading-none ${
                                      student.paymentStatus === "Lunas"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : student.paymentStatus === "Ditolak"
                                          ? "bg-rose-50 text-rose-700 border-rose-200"
                                          : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse-once"
                                    }`}
                                  >
                                    {student.paymentStatus || "Pending"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2 text-center">
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded-full text-[9px] uppercase ${
                                  student.status === "Disetujui"
                                    ? "bg-emerald-50 text-emerald-700 animate-pulse-once"
                                    : student.status === "Berkas Valid"
                                      ? "bg-blue-50 text-blue-700"
                                    : student.status === "Ditolak"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-amber-100 text-amber-800 animate-pulse"
                                }`}
                              >
                                {student.status}
                              </span>
                            </td>
                            <td className="md:p-4 p-1.5 py-2">
                              {student.status === "Pending" ? (
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                  <span className="text-[9px] text-amber-600 font-bold italic">Pengecekan Berkas</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => setVerifyingDocsStudent(student)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 tracking-wider text-[9px] uppercase transition cursor-pointer"
                                      id={`btn-approve-berkas-tabbaru-${student.id}`}
                                    >
                                      Verifikasi Berkas
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Tolak Pendaftar"
                                      confirmMessage={`Tolak dan hapus data ${student.name}?`}
                                      onConfirmClick={() => handleReject(student)}
                                      className="bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 font-bold px-2 py-1 rounded-lg text-[9px] uppercase transition cursor-pointer"
                                      id={`btn-reject-tabbaru-${student.id}`}
                                    >
                                      Tolak
                                    </ConfirmButton>
                                  </div>
                                </div>
                              ) : student.status === "Berkas Valid" ? (
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                  <span className="text-[9px] text-emerald-600 font-bold italic">Cek Pembayaran</span>
                                  <button
                                    onClick={() => setVerifyingDocsStudent(student)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 tracking-wider text-[9px] uppercase transition cursor-pointer"
                                    id={`btn-approve-tabbaru-${student.id}`}
                                  >
                                    Lanjutkan Cek Pembayaran
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center items-center gap-1.5 text-slate-400 italic text-[10px]">
                                  <span>Selesai</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => startAdminEditReg(student.id)}
                                      className="inline-flex items-center justify-center p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                                      title="Lihat / Edit Data"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Hapus Data"
                                      confirmMessage={`Hapus data pendaftaran ${student.name} permanen?`}
                                      onConfirmClick={() => onUpdateState("registeredStudents", "delete", { id: student.id })}
                                      className="inline-flex items-center justify-center p-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded transition-colors cursor-pointer"
                                      title="Hapus Data"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </ConfirmButton>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : siswaTab === "rekap" ? (
                  <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight animate-fade-in">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black">
                          NO INDUK & NAMA SISWA
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black">
                          KELAS & BATCH
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center">
                          PRESENSI (%)
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center">
                          SKOR AKHIR
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center">
                          PROGRES
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(systemState.activeStudents || [])
                        .filter((s) => isStudentRoleOnly(s))
                        .map((s) => {
                          const attRecords = (systemState.attendance || []).filter(a => a.studentId === s.id);
                          const attPercent = attRecords.length > 0 ? (attRecords.filter(a => a.status === "Hadir").length / attRecords.length) * 100 : 0;
                          const scoresArr = Object.values(s.scores || {});
                          const lastScore = scoresArr.length > 0 ? scoresArr[scoresArr.length - 1] : s.japaneseScore || 0;
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="md:p-4 p-1.5 py-2">
                                <div className="font-mono font-bold text-slate-400 text-[9px]">{s.id}</div>
                                <div className="font-bold text-slate-900">{s.name}</div>
                              </td>
                              <td className="md:p-4 p-1.5 py-2">
                                <div className={`font-bold ${isAlumniClass(s.class) ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150 w-max" : "text-blue-700"}`}>
                                  {s.class || "Belum Diplot"}
                                </div>
                                <div className="text-[10px] text-slate-500">{s.batch}</div>
                              </td>
                              <td className="md:p-4 p-1.5 py-2 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`font-black text-xs ${attPercent >= 80 ? "text-emerald-600" : attPercent >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                                    {attPercent.toFixed(1)}%
                                  </span>
                                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${attPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${attPercent}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="md:p-4 p-1.5 py-2 text-center">
                                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">{lastScore}</span>
                              </td>
                              <td className="md:p-4 p-1.5 py-2 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-500">{s.currentChapter || 1} / 50</span>
                                  <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${((s.currentChapter || 1) / 50) * 100}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight animate-fade-in">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black">
                          NO INDUK SISWA
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black">
                          IDENTITAS SISWA
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center">
                          NAMA KELAS & SENSEI PENGAMPU
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black">
                          STATUS & TAHUN LULUS
                        </th>
                        <th className="md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center">
                          AKSI
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedSiswaItems
                        ?.map((s) => (
                          <tr key={s.id}>
                            <td className="md:p-4 p-1.5 py-2 font-mono font-bold text-slate-600">
                              {s.id}
                            </td>
                            <td className="md:p-4 p-1.5 py-2">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getSafePhotoUrl(s.profilePicture || (s as any).docFoto || systemState.registeredStudents?.find(r => r.id === s.id || (r.email && r.email === (s as any).email))?.docFoto, s.name)}
                                  className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
                                  alt={s.name || "Avatar"}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Siswa')}&background=e2e8f0&color=334155`;
                                  }}
                                />
                                <div>
                                  <div className="font-bold text-slate-900">
                                    {s.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {s.batch}
                                  </div>
                                  <div className="mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setViewingCvStudentId(s.id)}
                                      className="px-2 py-0.5 bg-violet-50 border border-violet-100 text-violet-700 hover:bg-violet-100 rounded-md text-[9.5px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
                                    >
                                      <FileText className="h-3 w-3 shrink-0" />
                                      <span>CV Jepang</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2 text-center align-middle">
                                <div className="flex flex-col gap-2 items-center justify-center">
                                  <select
                                    value={s.class || ""}
                                    onChange={async (e) => {
                                      await onUpdateState(
                                        "activeStudents",
                                        "update_status",
                                        {
                                          id: s.id,
                                          class: e.target.value,
                                        },
                                      );
                                    }}
                                    className={`px-1.5 py-1 rounded font-bold text-[10px] outline-none border border-transparent cursor-pointer text-center font-sans tracking-wide w-full max-w-[170px] ${
                                      isAlumniClass(s.class)
                                        ? "bg-emerald-50 text-emerald-700 hover:border-emerald-300"
                                        : "bg-blue-50 text-blue-700 hover:border-blue-300"
                                    }`}
                                  >
                                    <option value="">Belum ada kelas</option>
                                    {s.class && !(systemState.customization?.lmsClasses || []).some(c => c.name === s.class) && (
                                      <option value={s.class || ""}>{s.class} (Nonaktif/Hapus)</option>
                                    )}
                                    <optgroup label="Kelas E-Benkyou">
                                      {systemState?.customization?.lmsClasses && systemState.customization.lmsClasses.length > 0 ? (
                                        systemState.customization.lmsClasses.map(cls => (
                                          <option key={cls.id} value={cls.name}>{cls.name}</option>
                                        ))
                                      ) : (
                                        <option value="" disabled>Belum ada data kelas</option>
                                      )}
                                    </optgroup>
                                  </select>
                                  {(() => {
                                    const senseiUser = systemState.users?.find(
                                      (u) => u.role === "Pengajar" && (u.assignedClass || "").toLowerCase() === (s.class || "").toLowerCase()
                                    );
                                    const displaySensei = senseiUser?.name || s.sensei || "Belum ada sensei";
                                    return (
                                      <div className="bg-emerald-50/50 text-emerald-700 px-2 py-1 rounded font-bold text-[10px] text-center w-full max-w-[170px] border border-emerald-100">
                                        👨‍🏫 {displaySensei}
                                      </div>
                                    );
                                  })()}
                                  
                                </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-3 min-w-[220px]">
                              <div className="space-y-1.5">
                                <select
                                  value={s.status}
                                  onChange={async (e) => {
                                    const val = e.target.value as any;
                                    const isToAlumni = ["Lulus", "Di Jepang"].includes(val);
                                    await onUpdateState(
                                      "activeStudents",
                                      "update_status",
                                      {
                                        id: s.id,
                                        status: val,
                                        prefecture:
                                          val === "Di Jepang"
                                            ? s.prefecture || "Tokyo"
                                            : "",
                                        class: s.class,
                                        sensei: s.sensei,
                                      },
                                    );
                                  }}
                                  className={`text-[10px] font-black border rounded px-2 py-1 w-full outline-none cursor-pointer tracking-wider ${
                                    s.status === "Dikeluarkan"
                                      ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                                      : s.status === "Di Jepang"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : s.status === "Lulus"
                                        ? "bg-indigo-50 text-indigo-800 border-indigo-300 animate-pulse-once"
                                        : s.status === "On Proges Job"
                                          ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                                          : s.status === "On Progres JFT/JLPT/SSW"
                                            ? "bg-teal-50 text-teal-800 border-teal-300"
                                            : s.status === "Diklat SO"
                                              ? "bg-purple-50 text-purple-800 border-purple-300"
                                              : "bg-blue-50 text-blue-800 border-blue-300"
                                  }`}
                                >
                                  <option value="Belajar">🇮🇩 1. BELAJAR</option>
                                  <option value="On Proges Job">
                                    💼 2. ON PROGES JOB
                                  </option>
                                  <option value="On Progres JFT/JLPT/SSW">
                                    📋 3. ON PROGRES JFT/JLPT/SSW
                                  </option>
                                  <option value="Diklat SO">
                                    📘 4. DIKLAT SO
                                  </option>
                                  <option value="Lulus">🎓 5. LULUS</option>
                                  <option value="Di Jepang">
                                    🇯🇵 6. DI JEPANG
                                  </option>
                                  <option value="Dikeluarkan">
                                    ❌ 7. DIKELUARKAN
                                  </option>
                                </select>
  
                                {s.status === "Di Jepang" && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-mono text-slate-500 shrink-0 font-bold">
                                      Prefektur Kerja:
                                    </span>
                                    <select
                                      value={s.prefecture || "Tokyo"}
                                      onChange={async (e) => {
                                        await onUpdateState(
                                          "activeStudents",
                                          "update_status",
                                          {
                                            id: s.id,
                                            status: "Di Jepang",
                                            prefecture: e.target.value,
                                          },
                                        );
                                      }}
                                      className="text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full outline-none cursor-pointer"
                                    >
                                      <option value="Tokyo">
                                        Tokyo (Ibu Kota)
                                      </option>
                                      {JAPAN_PREFECTURES.filter(
                                        (p) => p !== "Tokyo",
                                      ).map((pref) => (
                                        <option key={pref} value={pref}>
                                          {pref}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                {["Lulus", "Di Jepang"].includes(s.status) && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-mono text-indigo-600 shrink-0 font-black">
                                      Tahun Lulus:
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="YYYY"
                                      value={s.graduationYear || ""}
                                      onChange={async (e) => {
                                        await onUpdateState(
                                          "activeStudents",
                                          "update_status",
                                          {
                                            id: s.id,
                                            graduationYear: e.target.value,
                                          },
                                        );
                                      }}
                                      className="text-[10px] font-black text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full outline-none focus:border-indigo-400"
                                    />
                                  </div>
                                )}
                                <input
                                  type="text"
                                  placeholder="Keterangan: mitra SO/TSK, lokasi kerja..."
                                  value={s.keterangan || ""}
                                  onChange={async (e) => {
                                    await onUpdateState(
                                      "activeStudents",
                                      "update_status",
                                      {
                                        id: s.id,
                                        keterangan: e.target.value,
                                      },
                                    );
                                  }}
                                  title="Nama mitra SO/TSK & lokasi kerja siswa"
                                  className="text-[10px] font-medium text-slate-600 bg-white border border-dashed border-slate-250 rounded px-1.5 py-0.5 w-full outline-none focus:border-indigo-400 focus:border-solid placeholder:text-slate-400 placeholder:italic"
                                />
                              </div>
                            </td>
                            <td className="md:p-4 p-1.5 py-2 text-center align-middle">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => startAdminEditReg(s.id)}
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer shadow-xs font-bold text-xs active:scale-95 shrink-0"
                                  title="Edit Data Lengkap Siswa"
                                  id={`btn-edit-siswa-${s.id}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Data Siswa"
                                  confirmMessage={`Hapus data siswa ${s.name} permanen?`}
                                  onConfirmClick={() => onUpdateState("activeStudents", "delete", { id: s.id })}
                                  className="inline-flex items-center justify-center p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200 shadow-xs"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </ConfirmButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Mobile Card Layout - Shown on Mobile */}
              <div className="block md:hidden md:col-span-1 space-y-3">
                {siswaTab === "baru" ? (
                  <div className="space-y-4 animate-fade-in">
                    {paginatedSiswaItems
                      ?.map((student) => (
                        <div
                          key={`${student.id}-${student.name}`}
                          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 text-left"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {student.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {student.timestamp ? new Date(student.timestamp).toLocaleString("id-ID", {dateStyle: "medium", timeStyle: "short"}) : student.date}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-sm text-slate-900">
                                {student.name}
                              </div>
                            </div>
                            <div className="text-slate-500 text-[10px] font-mono">
                              {student.email}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                            <div>
                              <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                Program LPK
                              </span>
                              <span className="font-semibold text-slate-800 leading-tight block mt-0.5">
                                {student.program}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                Nomor WhatsApp
                              </span>
                              <span className="font-mono text-blue-600 font-bold block mt-0.5">
                                WA: {student.phone}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                              Kualifikasi Target / Level
                            </span>
                            <div className="font-semibold text-slate-800 text-[11px] leading-snug">
                              {student.japaneseLevel}
                            </div>
                            <div className="pt-1">
                              {student.japaneseLevel.includes("KKNI Level 4") ||
                              student.japaneseLevel.includes("KKNI 4") ||
                              student.japaneseLevel.includes("N4") ||
                              student.japaneseLevel.includes("N3") ? (
                                <span className="inline-flex items-center bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                  Instruktur Utama (KKNI 4)
                                </span>
                              ) : student.japaneseLevel.includes("KKNI Level 3") ||
                                student.japaneseLevel.includes("KKNI 3") ||
                                student.japaneseLevel.includes("N5") ||
                                student.japaneseLevel.toLowerCase().includes("asrama") ||
                                student.japaneseLevel.toLowerCase().includes("junior") ? (
                                <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                  Junior / Asrama (KKNI 3)
                                </span>
                              ) : student.japaneseLevel.includes("Native Speaker") ? (
                                <span className="inline-flex items-center bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                  Native Speaker Sensei
                                </span>
                              ) : (
                                <span className="inline-flex items-center bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                                  Pembinaan Karakter Awal
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Mobile Payment details & approval */}
                          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                                Pembayaran
                              </span>
                              <span className="font-mono text-slate-800 font-bold text-[11px]">
                                {student.paymentAmount ? `Rp ${student.paymentAmount.toLocaleString("id-ID")}` : "Rp 0"}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-600">
                              <span>Metode:</span>
                              <span className="font-semibold">{student.paymentMethod || "Transfer Manual"}</span>
                            </div>

                            <div className="flex justify-between items-center">
                              <span>Status Bayar:</span>
                              <span
                                className={`font-semibold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide border leading-none ${
                                  student.paymentStatus === "Lunas"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : student.paymentStatus === "Ditolak"
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-100 text-amber-800 border-amber-200"
                                }`}
                              >
                                {student.paymentStatus || "Pending"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div>
                              <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                                Status
                              </span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded-full text-[9px] uppercase ${
                                  student.status === "Disetujui"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : student.status === "Berkas Valid"
                                      ? "bg-blue-50 text-blue-700"
                                    : student.status === "Ditolak"
                                      ? "bg-rose-50 text-rose-700"
                                      : "bg-amber-100 text-amber-800 animate-pulse"
                                }`}
                              >
                                {student.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {student.status === "Pending" ? (
                                <div className="flex flex-col items-end gap-1.5 w-full">
                                  <span className="text-[10px] text-amber-600 font-bold italic w-full text-right">Pengecekan Berkas</span>
                                  <div className="flex items-center gap-1.5 w-full justify-end">
                                    <button
                                      onClick={() => setVerifyingDocsStudent(student)}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 tracking-tight text-[10px] uppercase transition cursor-pointer shadow-xs active:scale-95"
                                      id={`btn-approve-berkas-mob-tabbaru-${student.id}`}
                                    >
                                      Verifikasi Berkas
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Tolak Pendaftar"
                                      confirmMessage={`Tolak dan hapus data ${student.name}?`}
                                      onConfirmClick={() => handleReject(student)}
                                      className="bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase transition cursor-pointer active:scale-95"
                                      id={`btn-reject-mob-tabbaru-${student.id}`}
                                    >
                                      Tolak
                                    </ConfirmButton>
                                  </div>
                                </div>
                              ) : student.status === "Berkas Valid" ? (
                                <div className="flex flex-col items-end gap-1.5 w-full">
                                  <span className="text-[10px] text-emerald-600 font-bold italic w-full text-right">Cek Pembayaran</span>
                                  <button
                                    onClick={() => setVerifyingDocsStudent(student)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 tracking-tight text-[10px] uppercase transition cursor-pointer shadow-xs active:scale-95"
                                    id={`btn-approve-mob-tabbaru-${student.id}`}
                                  >
                                    Lanjutkan Cek Pembayaran
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[10px] text-slate-400 italic">Selesai</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => startAdminEditReg(student.id)}
                                      className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
                                      title="Lihat / Edit Data"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Hapus Data"
                                      confirmMessage={`Hapus data pendaftaran ${student.name} permanen?`}
                                      onConfirmClick={() => onUpdateState("registeredStudents", "delete", { id: student.id })}
                                      className="inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-xl transition-colors cursor-pointer"
                                      title="Hapus Data"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </ConfirmButton>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : siswaTab === "rekap" ? (
                  <div className="space-y-4 animate-fade-in">
                    {systemState.activeStudents
                      ?.filter((s) => isStudentRoleOnly(s))
                      ?.map((s) => {
                        const attRecords = (systemState.attendance || []).filter(a => a.studentId === s.id);
                        const attPercent = attRecords.length > 0 ? (attRecords.filter(a => a.status === "Hadir").length / attRecords.length) * 100 : 0;
                        const scoresArr = Object.values(s.scores || {});
                        const lastScore = scoresArr.length > 0 ? scoresArr[scoresArr.length - 1] : s.japaneseScore || 0;
                        return (
                          <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 text-left">
                            <div className="flex justify-between items-start">
                              <div className="max-w-[70%]">
                                <div className="text-[9px] font-mono font-bold text-slate-400 mb-0.5">{s.id}</div>
                                <div className="font-black text-slate-900 text-sm leading-tight break-words">{s.name}</div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-sm border ${
                                isAlumniClass(s.class)
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                  : "bg-blue-50 text-blue-700 border-blue-100"
                              }`}>
                                {s.class || "Belum Diplot"}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                              <div>
                                <span className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Statistik Presensi</span>
                                <div className="flex items-center gap-2.5">
                                  <span className={`font-black text-xs shrink-0 ${attPercent >= 80 ? "text-emerald-600" : attPercent >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                                    {attPercent.toFixed(0)}%
                                  </span>
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                      className={`h-full transition-all duration-500 ${attPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"}`} 
                                      style={{ width: `${attPercent}%` }} 
                                    />
                                  </div>
                                </div>
                              </div>
                              <div>
                                <span className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Skor Kuis Terakhir</span>
                                <div className="flex items-baseline gap-1">
                                  <span className="font-black text-sm text-slate-800">{lastScore}</span>
                                  <span className="text-[9px] text-slate-400 font-bold">Poin</span>
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100">
                              <span className="block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Pencapaian Modul</span>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-slate-600 shrink-0">{s.currentChapter || 1} / 50</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700" 
                                    style={{ width: `${((s.currentChapter || 1) / 50) * 100}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    {paginatedSiswaItems
                      ?.map((s) => (
                        <div
                          key={s.id}
                          className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-3.5 text-left"
                        >
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {s.id}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {s.batch}
                            </span>
                          </div>
                          <div className="flex items-start gap-3">
                            <img
                              src={getSafePhotoUrl(s.profilePicture || (s as any).docFoto || systemState.registeredStudents?.find(r => r.id === s.id || (r.email && r.email === (s as any).email))?.docFoto, s.name)}
                              className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
                              alt={s.name || "Avatar"}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name || 'Siswa')}&background=e2e8f0&color=334155`;
                              }}
                            />
                            <div className="space-y-1.5 pt-0.5 w-full overflow-hidden">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {s.name}
                              </div>
                              <div className="grid grid-cols-3 gap-1.5 w-full">
                                <button
                                  type="button"
                                  onClick={() => startAdminEditReg(s.id)}
                                  className="w-full justify-center px-1.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
                                  title="Edit Data Lengkap & Foto Siswa"
                                >
                                  <Edit className="h-3 w-3 shrink-0" /> <span className="truncate">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setViewingCvStudentId(s.id)}
                                  className="w-full justify-center px-1.5 py-1.5 bg-violet-50/80 border border-violet-100 text-violet-700 hover:bg-violet-100 hover:text-violet-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
                                >
                                  <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">CV Jepang</span>
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Data Siswa"
                                  confirmMessage={`Hapus data siswa ${s.name} permanen?`}
                                  onConfirmClick={() => onUpdateState("activeStudents", "delete", { id: s.id })}
                                  className="w-full justify-center px-1.5 py-1.5 bg-rose-50/80 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-95"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="h-3 w-3 shrink-0" /> <span className="truncate">Hapus</span>
                                </ConfirmButton>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                              <>
                                <div>
                                  <span className="block text-[8px] uppercase font-bold text-slate-400">
                                    Kelas
                                  </span>
                                  <select
                                    value={s.class || ""}
                                    onChange={async (e) => {
                                      await onUpdateState(
                                        "activeStudents",
                                        "update_status",
                                        {
                                          id: s.id,
                                          class: e.target.value,
                                        },
                                      );
                                    }}
                                    className={`mt-0.5 px-1.5 py-1 rounded font-bold text-[9.5px] outline-none border border-transparent cursor-pointer w-full ${
                                      isAlumniClass(s.class)
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-blue-50 text-blue-700"
                                    }`}
                                  >
                                    <option value="">Belum ada kelas</option>
                                    {s.class && !(systemState.customization?.lmsClasses || []).some(c => c.name === s.class) && (
                                      <option value={s.class || ""}>{s.class} (Nonaktif/Hapus)</option>
                                    )}
                                    <optgroup label="Kelas E-Benkyou">
                                      {systemState?.customization?.lmsClasses && systemState.customization.lmsClasses.length > 0 ? (
                                        systemState.customization.lmsClasses.map(cls => (
                                          <option key={cls.id} value={cls.name}>{cls.name}</option>
                                        ))
                                      ) : (
                                        <option value="" disabled>Belum ada data kelas</option>
                                      )}
                                    </optgroup>
                                  </select>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase font-bold text-slate-400">
                                    Sensei
                                  </span>
                                  {(() => {
                                    const senseiUser = systemState.users?.find(
                                      (u) => u.role === "Pengajar" && (u.assignedClass || "").toLowerCase() === (s.class || "").toLowerCase()
                                    );
                                    const displaySensei = senseiUser?.name || s.sensei || "Belum ada sensei";
                                    return (
                                      <div className="mt-0.5 bg-emerald-50/50 text-emerald-700 px-1.5 py-1 rounded font-bold text-[9.5px] border border-emerald-100 w-full truncate">
                                        👨‍🏫 {displaySensei}
                                      </div>
                                    );
                                  })()}
                                </div>
                                
                              </>
                            <div>
                              <span className="block text-[8px] uppercase font-bold text-slate-400">
                                Status & Lokasi
                              </span>
                              <select
                                value={s.status}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  const isToAlumni = ["Lulus", "Di Jepang"].includes(val);
                                  await onUpdateState(
                                    "activeStudents",
                                    "update_status",
                                    {
                                      id: s.id,
                                      status: val,
                                      prefecture:
                                        val === "Di Jepang"
                                          ? s.prefecture || "Tokyo"
                                          : "",
                                      class: s.class,
                                      sensei: s.sensei,
                                    },
                                  );
                                }}
                                className={`mt-0.5 text-[9.5px] font-black border rounded px-1.5 py-1 w-full outline-none cursor-pointer tracking-wider ${
                                  s.status === "Dikeluarkan"
                                    ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold"
                                    : s.status === "Di Jepang"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                      : s.status === "Lulus"
                                        ? "bg-indigo-50 text-indigo-800 border-indigo-300 shadow-sm"
                                        : s.status === "On Proges Job"
                                          ? "bg-cyan-50 text-cyan-800 border-cyan-300"
                                          : s.status === "On Progres JFT/JLPT/SSW"
                                            ? "bg-teal-50 text-teal-800 border-teal-300"
                                            : s.status === "Diklat SO"
                                              ? "bg-purple-50 text-purple-800 border-purple-300"
                                              : "bg-blue-50 text-blue-800 border-blue-300"
                                }`}
                              >
                                <option value="Belajar">🇮🇩 1. BELAJAR</option>
                                <option value="On Proges Job">
                                  💼 2. ON PROGES JOB
                                </option>
                                <option value="On Progres JFT/JLPT/SSW">
                                  📋 3. ON PROGRES JFT/JLPT/SSW
                                </option>
                                <option value="Diklat SO">📘 4. DIKLAT SO</option>
                                <option value="Lulus">🎓 5. LULUS</option>
                                <option value="Di Jepang">🇯🇵 6. DI JEPANG</option>
                                <option value="Dikeluarkan">❌ 7. DIKELUARKAN</option>
                              </select>
                            </div>
                          </div>

                          {s.status === "Di Jepang" && (
                            <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-150">
                              <span className="text-[9px] font-mono text-slate-500 shrink-0 font-bold">
                                Prefektur:
                              </span>
                              <select
                                value={s.prefecture || "Tokyo"}
                                onChange={async (e) => {
                                  await onUpdateState(
                                    "activeStudents",
                                    "update_status",
                                    {
                                      id: s.id,
                                      status: "Di Jepang",
                                      prefecture: e.target.value,
                                    },
                                  );
                                }}
                                className="text-[9.5px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full outline-none cursor-pointer"
                              >
                                <option value="Tokyo">Tokyo (Ibu Kota)</option>
                                {JAPAN_PREFECTURES.filter((p) => p !== "Tokyo").map(
                                  (pref) => (
                                    <option key={pref} value={pref}>
                                      {pref}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                          )}
                          <input
                            type="text"
                            placeholder="Keterangan: mitra SO/TSK, lokasi kerja..."
                            value={s.keterangan || ""}
                            onChange={async (e) => {
                              await onUpdateState(
                                "activeStudents",
                                "update_status",
                                {
                                  id: s.id,
                                  keterangan: e.target.value,
                                },
                              );
                            }}
                            title="Nama mitra SO/TSK & lokasi kerja siswa"
                            className="text-[9.5px] font-medium text-slate-600 bg-white border border-dashed border-slate-250 rounded px-1.5 py-1 w-full outline-none focus:border-indigo-400 focus:border-solid placeholder:text-slate-400 placeholder:italic"
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Pagination Controls */}
              {siswaTab !== "rekap" && siswaTab !== "sensei" && siswaTotalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-2xl shadow-sm mt-4">
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Menampilkan <span className="font-medium">{((siswaPage - 1) * siswaItemsPerPage) + 1}</span> hingga <span className="font-medium">{Math.min(siswaPage * siswaItemsPerPage, filteredSiswaItems.length)}</span> dari <span className="font-medium">{filteredSiswaItems.length}</span> hasil
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setSiswaPage(p => Math.max(1, p - 1))}
                          disabled={siswaPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        {Array.from({ length: siswaTotalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSiswaPage(i + 1)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              siswaPage === i + 1 
                                ? "z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0"
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                        <button
                          onClick={() => setSiswaPage(p => Math.min(siswaTotalPages, p + 1))}
                          disabled={siswaPage === siswaTotalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                  
                  {/* Mobile Pagination */}
                  <div className="flex flex-1 justify-between sm:hidden items-center">
                    <button
                      onClick={() => setSiswaPage(p => Math.max(1, p - 1))}
                      disabled={siswaPage === 1}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <span className="text-xs text-slate-500 font-medium">Hal {siswaPage} / {siswaTotalPages}</span>
                    <button
                      onClick={() => setSiswaPage(p => Math.min(siswaTotalPages, p + 1))}
                      disabled={siswaPage === siswaTotalPages}
                      className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2.5 DATA CV KANDIDAT */}
        {activeSegment === "dataCV" && (
          <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="font-display font-black text-xl text-slate-800">
                Data CV & Biodata Jepang
              </h2>
              {viewingCvStudentId && (
                <button
                  onClick={() => setViewingCvStudentId(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition flex items-center gap-2 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar
                </button>
              )}
            </div>
            
            {!viewingCvStudentId ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...(systemState.activeStudents || [])].sort(sortStudentsByDateDesc).map(student => (
                    <div key={`${student.id}-${student.name}`} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={getSafePhotoUrl(student.profilePicture || (student as any).docFoto || systemState.registeredStudents?.find(r => r.id === student.id || (r.email && r.email === (student as any).email))?.docFoto, student.name)}
                          alt={student.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Siswa')}&background=e2e8f0&color=334155`;
                          }}
                        />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{student.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">NIM: {student.id}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setViewingCvStudentId(student.id)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1.5"
                      >
                        <BookOpen className="h-3 w-3" /> Buka CV
                      </button>
                    </div>
                  ))}
                  {systemState.activeStudents.length === 0 && (
                    <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                      Belum ada siswa aktif.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-2 sm:p-4 print:p-0 print:border-0 print:bg-transparent shadow-sm">
                {(() => {
                  const student = systemState.activeStudents.find(s => s.id === viewingCvStudentId);
                  if (!student) return <div className="p-8 text-center">Siswa tidak ditemukan</div>;
                  return (
                    <StudentCvView
                      student={student}
                      onUpdateStudent={async (updatedStudent) => {
                        const newStudents = systemState.activeStudents.map(s => 
                          s.id === updatedStudent.id ? updatedStudent : s
                        );
                        await onUpdateState("activeStudents", "update", updatedStudent);
                        return true;
                      }}
                    />
                  );
                })()}
              </div>
            )}

          </div>
        )}

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
        {activeSegment === "inventaris" && (
          <div className="space-y-6">
            {/* Rekapitulasi Keseluruhan Inventaris */}
            {(() => {
              const items = systemState.inventory || [];
              const totalUnique = items.length;
              const totalUnits = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              const baikCount = items.filter(i => i.condition === "Baik").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              const perluServisCount = items.filter(i => i.condition === "Perlu Servis").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              const rusakCount = items.filter(i => i.condition === "Rusak").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
              const uniqueLocations = new Set(items.map(i => i.location).filter(Boolean)).size;

              return (
                <div className="bg-indigo-900/5 p-5 rounded-2xl border border-slate-200 shadow-inner space-y-4 animate-fade-in text-left">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-900 text-white rounded-lg">
                      <Package className="h-4 w-4" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-indigo-900">Rekap Keseluruhan Inventaris</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Informasi konsolidasi aset, logistik, dan kondisi fisik LPK secara real-time</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                    {/* Card 1 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aset Unik</span>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-slate-800">{totalUnique}</span>
                        <span className="text-[10px] font-bold text-slate-500">Kategori</span>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kuantitas</span>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-blue-600">{totalUnits}</span>
                        <span className="text-[10px] font-bold text-slate-500">Unit (Pcs)</span>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Baik
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-emerald-600">{baikCount}</span>
                        <span className="text-[10px] font-bold text-emerald-500">Pcs</span>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Perlu Servis
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-amber-600">{perluServisCount}</span>
                        <span className="text-[10px] font-bold text-amber-500">Pcs</span>
                      </div>
                    </div>

                    {/* Card 5 */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left col-span-2 md:col-span-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        📍 Distribusi Area
                      </span>
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-xl font-black text-indigo-600">{uniqueLocations}</span>
                        <span className="text-[10px] font-bold text-slate-500">Lokasi</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateInventoryModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" /> Registrasi Inventaris Baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsManageInventoryAreasModalOpen(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2.5 px-4 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  <MapPin className="h-4 w-4 text-indigo-600" /> Edit & Tambah Area Penempatan
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-semibold text-[11px]">Filter Area:</span>
                <select
                  value={inventoryAreaFilter}
                  onChange={(e) => setInventoryAreaFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Area ({systemState.inventory?.length || 0} barang)</option>
                  {getAvailableInventoryAreas().map(area => {
                    const count = (systemState.inventory || []).filter(i => i.location === area).length;
                    return (
                      <option key={area} value={area}>{area} ({count} barang)</option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Inventory checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verifikasi Logistik & Inventaris LPK
                </span>
              </div>

              {/* Desktop Table - Hidden on Mobile */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs">
                <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                      <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black">
                        KODE ASET
                      </th>
                      <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black">
                        NAMA BARANG
                      </th>
                      <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center">
                        JUMLAH
                      </th>
                      <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black">
                        LOKASI
                      </th>
                      <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center">
                        KONDISI
                      </th>
                      <th className="md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {systemState.inventory
                      .filter(item => inventoryAreaFilter === "ALL" || item.location === inventoryAreaFilter)
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="md:p-3 p-1.5 py-2 font-mono text-[9px] text-slate-400">
                            {item.code}
                          </td>
                          <td className="md:p-3 p-1.5 py-2 font-bold text-slate-900">
                            {item.itemName}
                          </td>
                          <td className="md:p-3 p-1.5 py-2 font-semibold text-slate-700 text-center">
                            {item.amount} Pcs
                          </td>
                          <td className="md:p-3 p-1.5 py-2 text-slate-600 font-medium">
                            📍 {item.location}
                          </td>
                          <td className="md:p-3 p-1.5 py-2 text-center">
                            <span
                              className={`font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase ${
                                item.condition === "Baik"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : item.condition === "Perlu Servis"
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.condition}
                            </span>
                          </td>
                          <td className="md:p-3 p-1.5 py-2 text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingInventoryItem(item);
                                setEditInvName(item.itemName);
                                setEditInvAmount(String(item.amount));
                                setEditInvCondition(item.condition);
                                setEditInvLoc(item.location || "Kantor Utama Manajemen");
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                              title="Edit Inventaris"
                            >
                              <Edit className="h-3.5 w-3.5" /> Edit
                            </button>
                            <ConfirmButton
                              confirmTitle="Hapus Inventaris"
                              confirmMessage={`Hapus barang ${item.itemName} dari daftar aset?`}
                              onConfirmClick={() => handleInventoryDelete(item)}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Hapus
                            </ConfirmButton>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Shown on Mobile */}
              <div className="block md:hidden space-y-2.5">
                {systemState.inventory
                  .filter(item => inventoryAreaFilter === "ALL" || item.location === inventoryAreaFilter)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 text-left animate-fade-in relative"
                    >
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="font-mono text-[9px] text-indigo-900 bg-blue-50 font-bold px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[8.5px] uppercase ${
                            item.condition === "Baik"
                              ? "bg-emerald-50 text-emerald-800"
                              : item.condition === "Perlu Servis"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {item.itemName}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-0.5 font-medium">
                            📍 {item.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-slate-800 bg-blue-50/50 border px-2 py-0.5 rounded-lg">
                            {item.amount} Pcs
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end items-center border-t pt-1.5 mt-1 gap-2">
                        <button
                          onClick={() => {
                            setEditingInventoryItem(item);
                            setEditInvName(item.itemName);
                            setEditInvAmount(String(item.amount));
                            setEditInvCondition(item.condition);
                            setEditInvLoc(item.location || "Kantor Utama Manajemen");
                          }}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded-md hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </button>
                        <ConfirmButton
                          confirmTitle="Hapus Inventaris"
                          confirmMessage={`Hapus barang ${item.itemName} dari daftar aset?`}
                          onConfirmClick={() => handleInventoryDelete(item)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus
                        </ConfirmButton>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. PAJAK & KEUANGAN CORPORATE */}
        {activeSegment === "pajak" && currentUser?.role !== "Admin Biasa" && (() => {
          const taxes = systemState.taxes || [];

          // Compute months with transactions from cashLedger and payments that are not yet saved
          const recommendedMonths = (() => {
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
              const inLedgerExists = ledger.some(
                (l) => l.inAmount === p.amount && l.date === p.date
              );
              if (!inLedgerExists) {
                monthlyData[key].in += p.amount || 0;
              }
            });

            const savedTaxMonths = taxes.map((t: any) => t.monthString);
            
            return Object.keys(monthlyData)
              .filter(m => !savedTaxMonths.includes(m))
              .map(key => ({
                monthString: key,
                totalRevenue: monthlyData[key].in,
                totalExpenses: monthlyData[key].out
              }));
          })();

          const handleQuickImport = (rec: { monthString: string; totalRevenue: number; totalExpenses: number }) => {
            setTaxMonth(rec.monthString);
            setTaxRev(String(rec.totalRevenue));
            setTaxExp(String(rec.totalExpenses));
            setTaxRate("0.11");
            setTaxStatus("Draft");
            setTaxNotes(`Diimpor otomatis dari buku kas bulan ${rec.monthString}`);
            setIsCreateTaxModalOpen(true);
          };

          const downloadFile = (base64Data: string, filename: string) => {
            const link = document.createElement("a");
            link.href = base64Data;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          const handleTriggerEdit = (tax: TaxRecord) => {
            setEditingTaxId(tax.id);
            setTaxMonth(tax.monthString);
            setTaxRev(String(tax.totalRevenue));
            setTaxExp(String(tax.totalExpenses));
            setTaxRate(String(tax.taxRate || 0.11));
            setTaxStatus(tax.status);
            setTaxNotes(tax.notes || "");
            setTaxSptFile(tax.sptFile || "");
            setTaxFinancialReportFile(tax.financialReportFile || "");
            setIsEditTaxModalOpen(true);
          };

          return (
            <div className="space-y-6">
              {/* Header section with buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">
                    Pelaporan Pajak LPK & Keuangan Corporate
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                    Kelola pelaporan SPT Badan, Pajak PPN 11%, upload laporan keuangan bulanan, serta unggah dokumen bukti lapor resmi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetTaxForm();
                    setIsCreateTaxModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="h-4 w-4" /> Tambah Rekor Pajak Baru
                </button>
              </div>

              {/* Quick Import Suggestions from Cash Ledger & Student Payments */}
              {recommendedMonths.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4.5 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>💡 REKOMENDASI IMPOR BULAN (Terdeteksi dari Kas & Invoice)</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-amber-700 leading-relaxed">
                    Kami mendeteksi aktivitas keuangan pada bulan-bulan berikut di buku kas, namun rekor pajaknya belum dibuat. Klik untuk otomatis mengisi form:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recommendedMonths.map((rec) => (
                      <button
                        key={rec.monthString}
                        onClick={() => handleQuickImport(rec)}
                        className="bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold px-2.5 py-1 rounded-lg text-[10.5px] transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="h-3 w-3" /> {rec.monthString} (Omset: Rp {rec.totalRevenue.toLocaleString("id-ID")})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tax ledger list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                    Buku Kas & Pajak Terdaftar ({taxes.length} Rekor)
                  </span>
                </div>

                {taxes.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed rounded-3xl p-10 text-center space-y-2">
                    <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">Belum Ada Rekor Pelaporan Pajak</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Gunakan tombol "Tambah Rekor Pajak Baru" atau klik rekomendasi di atas untuk mencatat SPT dan PPN badan usaha.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table - Hidden on Mobile */}
                    <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs">
                      <table className="w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
                            <th className="p-3 uppercase text-slate-600 font-black">MASA PAJAK</th>
                            <th className="p-3 uppercase text-slate-600 font-black">OMSET / OPERASIONAL</th>
                            <th className="p-3 uppercase text-slate-600 font-black">TARIF PAJAK & TOTAL</th>
                            <th className="p-3 uppercase text-slate-600 font-black">DOKUMEN KEUANGAN</th>
                            <th className="p-3 uppercase text-slate-600 font-black">BUKTI SPT</th>
                            <th className="p-3 uppercase text-slate-600 font-black">STATUS</th>
                            <th className="p-3 uppercase text-slate-600 font-black text-right">AKSI</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {taxes.map((item) => {
                            const ratePercent = (item.taxRate || 0.11) * 100;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-900">
                                  <div>{item.monthString}</div>
                                  {item.notes && (
                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5 italic max-w-[150px] truncate" title={item.notes}>
                                      "{item.notes}"
                                    </div>
                                    )}
                                </td>
                                <td className="p-3 space-y-0.5">
                                  <div className="font-mono text-emerald-700 font-medium">
                                    In: Rp {item.totalRevenue.toLocaleString("id-ID")}
                                  </div>
                                  <div className="font-mono text-rose-700 text-[11px]">
                                    Out: Rp {item.totalExpenses.toLocaleString("id-ID")}
                                  </div>
                                </td>
                                <td className="p-3 font-mono">
                                  <div className="text-slate-500 text-[10px]">{ratePercent}% Tarif PPN</div>
                                  <div className="font-bold text-blue-800">
                                    Rp {item.taxAmount.toLocaleString("id-ID")}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {item.financialReportFile ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => triggerPreview(item.financialReportFile!, `Lap_Keu_${item.monthString.replace(/\s+/g, '_')}`)}
                                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1"
                                      >
                                        <Eye className="h-3 w-3" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadFile(item.financialReportFile!, `Lap_Keu_${item.monthString.replace(/\s+/g, '_')}.pdf`)}
                                        className="text-slate-400 hover:text-slate-600 p-1"
                                        title="Download"
                                      >
                                        <Upload className="h-3 w-3 rotate-180" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">Belum unggah</span>
                                    )}
                                </td>
                                <td className="p-3">
                                  {item.sptFile ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => triggerPreview(item.sptFile!, `Bukti_SPT_${item.monthString.replace(/\s+/g, '_')}`)}
                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1"
                                      >
                                        <Eye className="h-3 w-3" /> Preview
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => downloadFile(item.sptFile!, `Bukti_SPT_${item.monthString.replace(/\s+/g, '_')}.pdf`)}
                                        className="text-slate-400 hover:text-slate-600 p-1"
                                        title="Download"
                                      >
                                        <Upload className="h-3 w-3 rotate-180" />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[10px]">Belum unggah</span>
                                    )}
                                </td>
                                <td className="p-3">
                                  {item.status === "Final/Dilaporkan" ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[9px] uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                                      ✓ Telah Lapor
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[9px] uppercase bg-amber-50 px-2 py-0.5 rounded-full">
                                      Draft/Belum
                                    </span>
                                    )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {item.status !== "Final/Dilaporkan" && (
                                      <button
                                        type="button"
                                        onClick={() => handleTaxReportAction(item)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition cursor-pointer"
                                      >
                                        Lapor (e-SPT)
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleTriggerEdit(item)}
                                      className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50/50 rounded-md hover:bg-blue-50 transition cursor-pointer"
                                      title="Edit Rekor"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Hapus Rekor Pajak"
                                      confirmMessage={`Hapus rekor pelaporan keuangan pajak untuk ${item.monthString}?`}
                                      onConfirmClick={() => handleTaxDelete(item)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </ConfirmButton>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards - Shown on Mobile */}
                    <div className="block md:hidden space-y-2.5">
                      {taxes.map((item) => {
                        const ratePercent = (item.taxRate || 0.11) * 100;
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 text-left animate-fade-in relative"
                          >
                            <div className="flex items-center justify-between border-b pb-1.5">
                              <div>
                                <span className="font-bold text-xs text-slate-900">{item.monthString}</span>
                                {item.notes && <p className="text-[9px] text-slate-400 italic mt-0.5">"{item.notes}"</p>}
                              </div>
                              {item.status === "Final/Dilaporkan" ? (
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[8.5px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                  ✓ Telah Lapor
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleTaxReportAction(item)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wide transition cursor-pointer"
                                >
                                  Lapor
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10.5px] pt-1 leading-snug">
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Omset Masuk</span>
                                <strong className="text-emerald-700 text-[10px] font-mono font-semibold">
                                  Rp {item.totalRevenue.toLocaleString("id-ID")}
                                </strong>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Operasional</span>
                                <strong className="text-rose-700 text-[10px] font-mono font-semibold">
                                  Rp {item.totalExpenses.toLocaleString("id-ID")}
                                </strong>
                              </div>
                            </div>

                            <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg text-xs font-mono border">
                              <span className="text-slate-500 text-[8.5px] font-bold">ESTIMASI TARIF {ratePercent}%</span>
                              <strong className="text-indigo-900">
                                Rp {item.taxAmount.toLocaleString("id-ID")}
                              </strong>
                            </div>

                            {/* Mobile Document Accessors */}
                            <div className="flex flex-wrap gap-2 pt-1 border-t">
                              {item.financialReportFile ? (
                                <button
                                  type="button"
                                  onClick={() => triggerPreview(item.financialReportFile!, `Lap_Keu_${item.monthString}`)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition"
                                >
                                  📄 Lap. Keuangan
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-400 italic">No Lap. Keu</span>
                              )}

                              {item.sptFile ? (
                                <button
                                  type="button"
                                  onClick={() => triggerPreview(item.sptFile!, `SPT_${item.monthString}`)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition"
                                >
                                  📥 Bukti SPT
                                </button>
                              ) : (
                                <span className="text-[9px] text-slate-400 italic">No Bukti SPT</span>
                              )}
                            </div>

                            {/* Mobile action row */}
                            <div className="flex justify-end gap-2 pt-1.5 border-t">
                              <button
                                type="button"
                                onClick={() => handleTriggerEdit(item)}
                                className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50/50 rounded-md text-[10px] font-bold flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" /> Edit
                              </button>
                              <ConfirmButton
                                confirmTitle="Hapus Pajak"
                                confirmMessage={`Hapus rekor pajak ${item.monthString}?`}
                                onConfirmClick={() => handleTaxDelete(item)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition flex items-center gap-1 text-[10px]"
                              >
                                <Trash2 className="h-3 w-3" /> Hapus
                              </ConfirmButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* JOB ORDERS MANAGEMENT SYSTEM PANEL */}
        {activeSegment === "joborders" && (
          <div className="space-y-6 animate-fade-in text-slate-800">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4.5 sm:p-6 md:p-8 rounded-3xl shadow-md space-y-2">
              <div className="flex items-center gap-2">
                <Landmark className="h-6 w-6 text-indigo-200" />
                <h3 className="text-lg font-black tracking-tight uppercase">
                  Manajemen Job Order & Rekomendasi Kerja Jepang
                </h3>
              </div>
              <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                Hubungkan para alumni LPK Pati yang sudah dinyatakan{" "}
                <strong>Lulus</strong> dengan pihak agency pendamping (PT Mitra)
                di Tokyo, Osaka, Kyoto & Prefektur Jepang lainnya. Berikan
                rekomendasi kerja langsung secara real-time yang akan muncul
                pada Dashboard LMS Siswa.
              </p>
            </div>
            
            <StudentActivitySummary systemState={systemState} />
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  Daftar Job Order Aktif
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                  Kelola kuota, status rekrutmen, dan rekomendasikan alumni berstatus 'Lulus'.
                </p>
              </div>
              <button
                onClick={() => setIsCreateJobOrderModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-sm w-full sm:w-auto justify-center cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Buat Job Order Baru
              </button>
            </div>

            <div className="text-left bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                {!systemState.jobOrders || systemState.jobOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic text-xs border border-dashed rounded-2xl bg-slate-50">
                    Belum ada data lowongan kerja Jepang / Job Order mitra yang
                    dilaporkan.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {systemState.jobOrders.map((job) => {
                      // Filter active students available for recommendation
                      const recommendableStudents =
                        systemState.activeStudents.filter((st) => {
                          // Check if they are locked in another active job (locked if they are recommended, showed interest, or approved)
                          const lockedInOtherJob = systemState.jobOrders.some(
                            (otherJob) =>
                              otherJob.id !== job.id &&
                              (otherJob.recommendations?.includes(st.id) ||
                                otherJob.interestedStudents?.includes(st.id) ||
                                otherJob.approvedApplicants?.includes(st.id)) &&
                              otherJob.applicantDocuments?.[st.id]?.stage !==
                                "Ditolak",
                          );

                          // Check if they are already in the current job
                          const alreadyInThisJob =
                            job.recommendations?.includes(st.id) ||
                            job.interestedStudents?.includes(st.id) ||
                            job.approvedApplicants?.includes(st.id);

                          return !lockedInOtherJob && !alreadyInThisJob;
                        });

                      const isExpanded = expandedJobIds.includes(job.id);

                      return (
                        <div
                          key={job.id}
                          className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-200 transition space-y-4 text-left"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-205 pb-2.5">
                            <div className="space-y-0.5 text-left">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold bg-indigo-100 text-indigo-800">
                                  {job.noReg}
                                </span>
                                <button
                                  onClick={() => toggleJobExpansion(job.id)}
                                  className="bg-white border border-slate-200 text-slate-500 rounded p-0.5 shadow-sm active:scale-95 transition"
                                >
                                  {isExpanded ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                </button>
                              </div>
                              <h4 className="font-extrabold text-xs text-slate-900">
                                {job.occupation}
                              </h4>
                              <p className="text-[10px] text-slate-600 font-bold">
                                {job.partnerName}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                📍 {job.location}
                              </p>
                            </div>
                            <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onUpdateState(
                                      "jobOrders",
                                      "toggle_status",
                                      { id: job.id },
                                    );
                                  }}
                                  className={`px-2 py-1 text-[8.5px] font-black rounded-lg uppercase tracking-tight transition cursor-pointer ${
                                    job.status === "Aktif"
                                      ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                  }`}
                                >
                                  ●{" "}
                                  {job.status === "Aktif"
                                    ? "Aktif / Buka"
                                    : "Tutup / Terpenuhi"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingJobOrder(job);
                                  }}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition cursor-pointer border border-amber-200 text-[10px] font-bold"
                                  title="Edit Job Order"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Job Order"
                                  confirmMessage={`Hapus lowongan ${job.occupation} di ${job.partnerName}?`}
                                  onConfirmClick={() => onUpdateState("jobOrders", "delete", { id: job.id })}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-100 text-[10px] font-bold"
                                  title="Hapus Job Order"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus</span>
                                </ConfirmButton>
                              </div>
                              <span className="font-semibold text-[10px] text-blue-700 font-mono">
                                {job.contractDuration} Kontrak
                              </span>
                            </div>
                          </div>

                          {!isExpanded && (
                            <div className="text-[10px] text-slate-400 font-medium italic">
                              Detail pekerjaan disembunyikan. Klik tombol
                              dropdown di atas untuk melihat dan mengelola
                              proses seleksi.
                            </div>
                          )}

                          {isExpanded && (
                            <>
                              {/* Financial and Overtime Details */}
                              <div className="grid grid-cols-3 gap-2 text-[10px] text-left">
                                <div className="bg-white p-2 rounded-xl border border-slate-200">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                    Gaji Pokok
                                  </span>
                                  <span className="font-black text-slate-800">
                                    {job.salary}
                                  </span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-slate-200">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                    Lembur
                                  </span>
                                  <span className="font-semibold text-slate-750">
                                    {job.overtime || "TIDAK"}
                                  </span>
                                </div>
                                <div className="bg-white p-2 rounded-xl border border-slate-200">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                    Tunjangan
                                  </span>
                                  <span
                                    className="font-medium text-slate-600 truncate block"
                                    title={job.allowance}
                                  >
                                    {job.allowance || "Fasilitas lengkap"}
                                  </span>
                                </div>
                              </div>

                              {/* Demography & Recruit Target */}
                              <div className="grid grid-cols-3 gap-2 text-[10px] text-left text-slate-700">
                                <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide block">
                                    Gender
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.gender || "LAKI-LAKI / PEREMPUAN"}
                                  </span>
                                </div>
                                <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide block">
                                    Persyaratan Usia
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.ageRequirement || "18-30 tahun"}
                                  </span>
                                </div>
                                <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                  <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide block">
                                    Dibutuhkan
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.recruitCount || "6 siswa"}
                                  </span>
                                </div>
                              </div>

                              {job.jobDescription && (
                                <div className="bg-slate-100/60 p-2.5 rounded-xl border border-slate-200 text-[10px]">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                                    Deskripsi Pekerjaan
                                  </span>
                                  <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                    {job.jobDescription}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-4 gap-2 text-[10px] text-left">
                                <div className="bg-slate-100 p-2 rounded-xl">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                    TB Minimal
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.tbRequirement || "-"}
                                  </span>
                                </div>
                                <div className="bg-slate-100 p-2 rounded-xl">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                    BB Proporsional
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.bbRequirement || "-"}
                                  </span>
                                </div>
                                <div className="bg-slate-100 p-2 rounded-xl">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                    Pelaksanaan
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.interviewExecution || "-"}
                                  </span>
                                </div>
                                <div className="bg-slate-100 p-2 rounded-xl">
                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                    Tanggal/Bulan
                                  </span>
                                  <span className="font-bold text-slate-800">
                                    {job.interviewDate || "-"}
                                  </span>
                                </div>
                              </div>

                              {/* Minimum Standard Competency Scores */}
                              <div className="bg-[#f0f4f8] p-2.5 rounded-xl border border-indigo-100 text-[10.5px]">
                                <span className="text-[8.5px] font-extrabold text-blue-800 uppercase tracking-wider block mb-1">
                                  Kriteria Komparasi Kelayakan
                                </span>
                                <div className="grid grid-cols-5 gap-1 text-center text-slate-700">
                                  <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                      B. JEPANG
                                    </span>
                                    <span className="font-black text-indigo-700 text-[9.5px]">
                                      {job.minJapaneseScore || "BAB 15"}
                                    </span>
                                  </div>
                                  <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                      ABSENSI
                                    </span>
                                    <span className="font-black text-indigo-700 text-[9.5px]">
                                      {job.minAttendanceScore || "80"}%
                                    </span>
                                  </div>
                                  <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                      NILAI 5S
                                    </span>
                                    <span className="font-black text-indigo-700 text-[9.5px]">
                                      {job.minFiveSScore || "80"}
                                    </span>
                                  </div>
                                  <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                      MTK SSW
                                    </span>
                                    <span className="font-black text-indigo-700 text-[9.5px]">
                                      {job.minMathScore || "90"}
                                    </span>
                                  </div>
                                  <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                    <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                      ETIKA LPK
                                    </span>
                                    <span className="font-black text-indigo-700 text-[9.5px]">
                                      {job.minEthicsScore || "80"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Recommendation Module */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 text-left font-sans">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                  <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wide">
                                    🎓 REKOMENDASI SISWA
                                  </span>
                                  <span className="text-[9px] font-bold text-indigo-600 font-mono">
                                    {(job.recommendations || []).length}{" "}
                                    Direkomendasikan
                                  </span>
                                </div>

                                {/* Quick Add Recommendation Dropdown & Button */}
                                <div className="flex gap-1.5">
                                  <select
                                    value={recoSiswaId[job.id] || ""}
                                    onChange={(e) =>
                                      setRecoSiswaId((prev) => ({
                                        ...prev,
                                        [job.id]: e.target.value,
                                      }))
                                    }
                                    className="text-[10px] font-bold text-slate-750 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full outline-none"
                                  >
                                    <option value="">
                                      -- Pilih Siswa (Semua Status) --
                                    </option>
                                    {recommendableStudents.length === 0 ? (
                                      <option disabled value="">
                                        Tidak ada siswa tersedia (Semua
                                        terkunci)
                                      </option>
                                    ) : (
                                      recommendableStudents.map((st) => (
                                        <option key={st.id} value={st.id}>
                                          {st.name} ({st.id})
                                        </option>
                                      ))
                                    )}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const stId = recoSiswaId[job.id];
                                      if (!stId) {
                                        alert(
                                          "Silakan pilih siswa terlebih dahulu!",
                                        );
                                        return;
                                      }
                                      await onUpdateState(
                                        "jobOrders",
                                        "recommend",
                                        {
                                          jobOrderId: job.id,
                                          studentId: stId,
                                        },
                                      );
                                      // Clear selection
                                      setRecoSiswaId((prev) => ({
                                        ...prev,
                                        [job.id]: "",
                                      }));
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-wide shrink-0 transition cursor-pointer"
                                  >
                                    Rekomendasikan ⚡
                                  </button>
                                </div>

                                {/* Currently Recommended Trainees List */}
                                {!job.recommendations ||
                                job.recommendations.length === 0 ? (
                                  <p className="text-[9px] text-slate-400 italic">
                                    Belum ada lulusan yang ditugaskan ke Job
                                    Order ini.
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {job.recommendations.map((stId) => {
                                      const stObj =
                                        systemState.activeStudents.find(
                                          (s) => s.id === stId,
                                        );
                                      if (!stObj) return null;
                                      return (
                                        <div
                                          key={stId}
                                          className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-150 px-2 py-0.5 rounded-md font-sans text-[9px] font-bold"
                                        >
                                          <span>
                                            🎓 {stObj.name} ({stObj.id})
                                          </span>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await onUpdateState(
                                                "jobOrders",
                                                "remove_recommendation",
                                                {
                                                  jobOrderId: job.id,
                                                  studentId: stId,
                                                },
                                              );
                                            }}
                                            className="text-rose-600 font-extrabold text-[10px] hover:text-rose-800 px-0.5 cursor-pointer ml-1"
                                            title="Batalkan rekomendasi"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  )}
                              </div>

                              {/* Global Schedule Configuration Panel */}
                              <JobScheduleConfigPanel job={job} onUpdateState={onUpdateState} />
                              
                              {/* Unified Panel for Applicant Process & Schedule */}
                              <div className="bg-white p-3 mt-1.5 rounded-xl border border-slate-200 text-left space-y-2">
                                <h5 className="text-[10px] font-black text-indigo-800 uppercase tracking-wider flex items-center justify-between">
                                  <span>📝 Monitoring Proses & Jadwal Seleksi</span>
                                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                    {(job.interestedStudents || []).length} Siswa
                                  </span>
                                </h5>
                                {job.interestedStudents && job.interestedStudents.length > 0 ? (
                                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                    {job.interestedStudents.map((stId) => {
                                      const stData = systemState.activeStudents.find((s) => s.id === stId);
                                      if (!stData) return null;
                                      const docs = job.applicantDocuments?.[stId] || {};
                                      return (
                                        <div key={stId} className="bg-indigo-50/40 p-2.5 border border-indigo-150 rounded-lg text-[9.5px] space-y-2">
                                          <div className="flex justify-between items-center font-bold">
                                            <div className="flex items-center gap-2">
                                              <img
                                                src={getSafePhotoUrl(stData.profilePicture || (stData as any).docFoto, stData.name)}
                                                alt={stData.name}
                                                referrerPolicy="no-referrer"
                                                className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                                onError={(e) => {
                                                  e.currentTarget.onerror = null;
                                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(stData.name || 'Siswa')}&background=e2e8f0&color=334155`;
                                                }}
                                              />
                                              <span className="text-slate-800">{stData.name}</span>
                                            </div>
                                            <span className="text-slate-450 font-mono text-[8px]">{stData.id} • {stData.batch}</span>
                                          </div>
                                          <div className="bg-white p-2 rounded-md border border-indigo-100 space-y-2">
                                            <div className="flex items-center gap-2">
                                              <label className="text-[9px] font-bold text-slate-500 w-12 shrink-0">TAHAPAN:</label>
                                              <select
                                                defaultValue={docs.stage || "Tertarik"}
                                                onChange={async (e) => {
                                                  const newVal = e.target.value;
                                                  await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                    jobOrderId: job.id,
                                                    studentId: stId,
                                                    documents: { ...docs, stage: newVal },
                                                  });
                                                  if (newVal === "Lolos Akhir") {
                                                    await onUpdateState("activeStudents", "edit", {
                                                      id: stId,
                                                      status: "Di Jepang",
                                                      prefecture: job.location,
                                                      company: job.partnerName,
                                                    });
                                                  }
                                                }}
                                                className="flex-1 text-[9px] p-1 border border-slate-200 rounded bg-slate-50 font-bold"
                                                style={{
                                                  color:
                                                    docs.stage === "Lolos Akhir" ? "#059669" : 
                                                    docs.stage === "Interview" ? "#4f46e5" : 
                                                    docs.stage === "Seleksi Awal" ? "#b45309" : 
                                                    docs.stage === "Ditolak" ? "#e11d48" : "#475569",
                                                }}
                                              >
                                                <option value="Tertarik">1. Tertarik (Berkas Diterima)</option>
                                                <option value="Seleksi Awal">2. Lolos ke Seleksi Awal</option>
                                                <option value="Interview">3. Lolos ke Interview User</option>
                                                <option value="Lolos Akhir">4. Lolos Akhir (Matched) 🎉</option>
                                                <option value="Ditolak">❌ Ditolak / Gagal</option>
                                              </select>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <label className="text-[9px] font-bold text-slate-500 w-12 shrink-0">JADWAL:</label>
                                              <input
                                                type="text"
                                                placeholder="Contoh: 15 Juli 2026 pukul 10:00 WIB"
                                                defaultValue={docs.scheduleDate || ""}
                                                onBlur={async (e) => {
                                                  await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                    jobOrderId: job.id,
                                                    studentId: stId,
                                                    documents: { ...docs, scheduleDate: e.target.value },
                                                  });
                                                }}
                                                className="flex-1 text-[9px] p-1 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                                              />
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <label className="text-[9px] font-bold text-slate-500 w-12 shrink-0">CATATAN:</label>
                                              <input
                                                type="text"
                                                placeholder="Arahan / Catatan Proses..."
                                                defaultValue={docs.notes || ""}
                                                onBlur={async (e) => {
                                                  await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                    jobOrderId: job.id,
                                                    studentId: stId,
                                                    documents: { ...docs, notes: e.target.value },
                                                  });
                                                }}
                                                className="flex-1 text-[9px] p-1 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-slate-400 italic">
                                    Belum ada siswa yang mendaftar / tertarik pada job order ini.
                                  </p>
                                  )}
                              </div>

                              {/* Panel 3: Siswa Ditolak (Riwayat) */}
                              {(() => {
                                const rejectedStudents = [
                                  ...(job.interestedStudents || []),
                                  ...(job.approvedApplicants || []),
                                ].filter((stId, index, self) => {
                                  // unique student ids that are rejected
                                  if (self.indexOf(stId) !== index)
                                    return false;
                                  return (
                                    job.applicantDocuments?.[stId]?.stage ===
                                    "Ditolak"
                                  );
                                });

                                if (rejectedStudents.length === 0) return null;

                                return (
                                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200 text-left space-y-2 mt-3">
                                    <h5 className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex justify-between items-center">
                                      <span>
                                        ❌ Riwayat Penolakan (Ditolak / Gagal)
                                      </span>
                                      <span className="bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                        {rejectedStudents.length}
                                      </span>
                                    </h5>
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                      {rejectedStudents.map((stId) => {
                                        const stData =
                                          systemState.activeStudents.find(
                                            (s) => s.id === stId,
                                          );
                                        if (!stData) return null;
                                        const notes =
                                          job.applicantDocuments?.[stId]
                                            ?.notes ||
                                          "Tidak ada catatan historis.";

                                        return (
                                          <div
                                            key={stId}
                                            className="bg-white p-2 border border-rose-100 rounded-lg flex flex-col gap-1 text-[10px]"
                                          >
                                            <div className="flex items-center justify-between">
                                              <p className="font-extrabold text-slate-800">
                                                {stData.name}
                                              </p>
                                              <div className="flex items-center gap-2">
                                                <p className="text-[8px] font-mono text-slate-400">
                                                  {stData.id}
                                                </p>
                                                {/* Provide ability to UNDO status back to Tertarik for admin if needed */}
                                                <ConfirmButton
                                                  type="button"
                                                  confirmTitle="Kembalikan Tahap"
                                                  confirmMessage={`Kembalikan ${stData.name} ke tahap Tertarik?`}
                                                  onConfirmClick={async () => {
                                                    await onUpdateState(
                                                      "jobOrders",
                                                      "submit_applicant_documents",
                                                      {
                                                        jobOrderId: job.id,
                                                        studentId: stId,
                                                        documents: {
                                                          ...job
                                                            .applicantDocuments?.[
                                                            stId
                                                          ],
                                                          stage: "Tertarik",
                                                        },
                                                      },
                                                    );
                                                  }}
                                                  className="text-indigo-600 hover:text-indigo-800 text-[8px] font-bold uppercase underline cursor-pointer"
                                                >
                                                  Undo
                                                </ConfirmButton>
                                              </div>
                                            </div>
                                            <p className="text-rose-700 italic text-[9px] bg-rose-50 p-1.5 rounded">
                                              {notes}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>
        )}

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

        {activeSegment === "alumnivip" && (
          <div className="space-y-8 animate-fade-in text-slate-800">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 text-left">
                <span className="bg-white/20 text-white border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  ADMIN KELAS ALUMNI
                </span>
                <h3 className="font-display font-black text-2xl">
                  Manajemen Kelas Alumni
                </h3>
                <p className="text-sm font-medium text-amber-50 max-w-xl">
                  Atur daftar kelas bahasa Jepang, durasi, dan metode pembelajaran untuk Manajemen Kelas Alumni yang tampil di halaman depan.
                </p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-center border border-white/20">
                <Star className="h-10 w-10 text-white animate-pulse" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
              {/* Header Texts */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Teks Header VIP Alumni</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tagline Atas</label>
                    <input type="text" value={custLandingConfig.alumniPackageTagline || "Home / Pilih Kelas"} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniPackageTagline: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Judul Utama</label>
                    <input type="text" value={custLandingConfig.alumniPackageTitle || "Pilih Kelas Bahasa Jepang"} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniPackageTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Banner Judul</label>
                    <input type="text" value={custLandingConfig.alumniPackageBannerTitle || "Belajar Langsung dengan Ahlinya!"} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniPackageBannerTitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Banner Subjudul</label>
                    <textarea value={custLandingConfig.alumniPackageBannerSubtitle || "Didukung oleh Sensei Bersertifikasi N1 dan Native Speaker Jepang"} onChange={(e) => setCustLandingConfig({...custLandingConfig, alumniPackageBannerSubtitle: e.target.value})} className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" rows={2} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">Daftar Kelas</h4>
                    {/* Alumni Classes Editor */}
                    <div className="space-y-2 ">
                      <label className="text-xs font-bold text-slate-700 block">Daftar Kelas Alumni</label>
                      <div className="space-y-3">
                        {custLandingConfig.alumniClasses?.map((cls: any, idx: number) => {
                          const clsId = cls.id || String(idx);
                          const isExpanded = expandedAlumniClassIds.includes(clsId);
                          return (
                          <div key={clsId} className="border border-slate-200 rounded-xl bg-white relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
                            {/* Indicator */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                            
                            {/* Header (Always Visible) */}
                            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedAlumniClassIds(prev => prev.includes(clsId) ? prev.filter(i => i !== clsId) : [...prev, clsId])}>
                              <div className="flex items-center gap-3 pl-2">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                  <span className="text-xl">{cls.emoji || "⛩️"}</span>
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-800 text-sm">{cls.title || `Kelas Alumni ${idx + 1}`}</h5>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">{cls.level || "Level"}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">{cls.method || "Metode"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <ConfirmButton 
                                  type="button" 
                                  confirmTitle="Hapus Kelas Alumni"
                                  confirmMessage="Yakin ingin menghapus kelas ini?"
                                  onConfirmClick={() => {
                                    const newItems = custLandingConfig.alumniClasses.filter((_: any, i: number) => i !== idx);
                                    setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                  }} 
                                  className="text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 p-2 rounded-lg text-xs font-bold transition border border-slate-200 hover:border-rose-200 shadow-sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </ConfirmButton>
                                <div className={`w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600 border-indigo-200' : ''}`}>
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </div>
                            </div>

                            {/* Body (Collapsible) */}
                            {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                                <div className="md:col-span-4 space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metode</label>
                                    <input type="text" value={cls.method || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, method: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Online & Offline" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level</label>
                                    <input type="text" value={cls.level || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, level: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 uppercase transition shadow-sm font-medium" placeholder="N3" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Warna/Tema</label>
                                    <select value={cls.colorScheme || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, colorScheme: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden cursor-pointer focus:border-indigo-500 transition shadow-sm font-medium">
                                      <option value="emerald">Emerald (Hijau)</option>
                                      <option value="blue">Blue (Biru)</option>
                                      <option value="purple">Purple (Ungu)</option>
                                      <option value="orange">Orange (Oranye)</option>
                                      <option value="rose">Rose (Merah Muda)</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="md:col-span-8 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul Kelas</label>
                                      <input type="text" value={cls.title || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, title: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Level N3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Emoji & Durasi</label>
                                      <div className="flex gap-2">
                                        <input type="text" value={cls.emoji || ""} onChange={(e) => {
                                          const newItems = [...custLandingConfig.alumniClasses];
                                          newItems[idx] = { ...cls, emoji: e.target.value };
                                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                        }} className="w-16 text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm text-center font-medium" placeholder="⛩️" />
                                        <input type="text" value={cls.duration || ""} onChange={(e) => {
                                          const newItems = [...custLandingConfig.alumniClasses];
                                          newItems[idx] = { ...cls, duration: e.target.value };
                                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                        }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Durasi: 3-4 Bulan" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Pendaftar (Registered)</label>
                                      <input type="number" value={cls.registered ?? 0} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, registered: Number(e.target.value) };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="8" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kuota Kelas (Quota Limit)</label>
                                      <input type="number" value={cls.quota ?? 10} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, quota: Number(e.target.value) };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="10" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Open Class</label>
                                      <input type="text" value={cls.openClass || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, openClass: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Contoh: 19 Agustus 2026" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Persentase Diskon (Opsional)</label>
                                      <input type="text" value={cls.discount || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, discount: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Contoh: 20%" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teks Diskon</label>
                                      <input type="text" value={cls.discountText || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, discountText: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Contoh: Hemat 200.000" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Harga Coret (Asli)</label>
                                      <input type="text" value={cls.originalPrice || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, originalPrice: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} onBlur={(e) => {
                                        const formatted = formatRupiah(e.target.value);
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, originalPrice: formatted };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Rp 1.200.000" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Harga Akhir</label>
                                      <input type="text" value={cls.finalPrice || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, finalPrice: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} onBlur={(e) => {
                                        const formatted = formatRupiah(e.target.value);
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, finalPrice: formatted };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Rp 1.000.000" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
                                    <textarea value={cls.description || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, description: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fitur (Pisahkan dengan koma)</label>
                                    <textarea value={(cls.features || []).join(', ')} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, features: e.target.value.split(',').map((f: string) => f.trim()).filter(Boolean) };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" rows={2} placeholder="Kosakata & Tata Bahasa Dasar, Percakapan Sehari-hari" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-start mt-4">
                        <button type="button" onClick={() => {
                          const newItem = {
                            id: "al_" + Date.now(),
                            method: "Online & Offline",
                            level: "N4",
                            emoji: "⛩️",
                            title: "Level N4",
                            description: "Deskripsi program alumni.",
                            features: ["Fitur 1", "Fitur 2"],
                            duration: "Durasi: 3 Bulan",
                            colorScheme: "emerald",
                            registered: 0,
                            quota: 10
                          };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: [...(custLandingConfig.alumniClasses || []), newItem] });
                          setExpandedAlumniClassIds([...expandedAlumniClassIds, newItem.id]);
                        }} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm border border-indigo-700">
                          <Plus className="h-4 w-4" /> Tambah Manajemen Kelas Alumni
                        </button>
                      </div>
                    </div>
                  </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <ConfirmForm
                  confirmTitle="Simpan Manajemen Kelas Alumni"
                  confirmMessage="Menerapkan perubahan pada Kelas Alumni ke beranda publik secara instan?"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const currentLmsClasses = systemState?.customization?.lmsClasses || systemState?.lmsClasses || [];
                    const updatedLmsClasses = [...currentLmsClasses];

                    (custLandingConfig.alumniClasses || []).forEach((cls: any) => {
                      const className = `Kelas Alumni ${cls.title || "VIP"}`;
                      const existingIndex = updatedLmsClasses.findIndex(
                        (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                      );

                      if (existingIndex === -1) {
                        updatedLmsClasses.push({
                          id: className,
                          name: className,
                          isActive: true,
                          type: "alumni",
                          method: cls.method || "Offline",
                          period: cls.duration || "Juni 2026",
                          chapters: CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 }))
                        });
                      } else {
                        updatedLmsClasses[existingIndex] = {
                          ...updatedLmsClasses[existingIndex],
                          type: "alumni",
                          method: cls.method || updatedLmsClasses[existingIndex].method || "Offline",
                          period: cls.duration || updatedLmsClasses[existingIndex].period || "Juni 2026",
                        };
                      }
                    });

                    const ok = await onUpdateState("customization", "update", {
                      ...systemState?.customization,
                      landingConfig: custLandingConfig,
                      lmsClasses: updatedLmsClasses,
                    });
                    if (ok) {
                      setLandingSaveSuccess(true);
                      setTimeout(() => setLandingSaveSuccess(false), 3000);
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" /> 
                    {landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Perubahan"}
                  </button>
                </ConfirmForm>
              </div>
            </div>
            </div>
        )}

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
        {activeSegment === "petasebaran" && (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                <MapPin className="h-6 w-6 text-red-600" />
                DATA PETA SEBARAN ALUMNI LPK
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan form di bawah ini untuk memasukkan atau memperbarui
                sebaran geografis alumni LPK yang bekerja di Jepang agar muncul
                secara real-time di OpenStreetMap.
              </p>
            </div>

            {/* New Map Data Button */}
            <div className="w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative z-10 mb-6">
              <div ref={adminMapRef} className="w-full h-full z-10 relative"></div>
            </div>

            <div className="w-full flex justify-start">
              <button
                type="button"
                onClick={() => setIsCreateMapModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" /> Input Data Sebaran Alumni
              </button>
            </div>

            <div className="space-y-4">
              {(() => {
                const allSebaranAlumni = (systemState.activeStudents || [])
                  .filter((s) => s.status === "Di Jepang")
                  .filter((student) => {
                    if (!selectedMapPref) return true;
                    return (
                      student.prefecture === selectedMapPref ||
                      student.city === selectedMapPref
                    );
                  });

                const sebaranPerPage = 10;
                const totalSebaranPages = Math.max(1, Math.ceil(allSebaranAlumni.length / sebaranPerPage));
                const currentSebaranPage = Math.min(sebaranPage, totalSebaranPages);
                const paginatedSebaran = allSebaranAlumni.slice(
                  (currentSebaranPage - 1) * sebaranPerPage,
                  currentSebaranPage * sebaranPerPage
                );

                return (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-450 font-mono block">
                        📋 Daftar Sebaran Alumni Terdaftar {selectedMapPref ? `di ${selectedMapPref}` : ""} (
                        {allSebaranAlumni.length} Orang)
                      </span>
                      {selectedMapPref && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMapPref(null);
                            setSebaranPage(1);
                            if (adminMapInstanceRef.current) {
                              adminMapInstanceRef.current.setView([36.2048, 138.2529], 5);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold py-1 px-2.5 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer border border-red-100 flex items-center gap-1 shadow-xs"
                        >
                          ❌ Bersihkan Filter ({selectedMapPref})
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                Nama Alumni
                              </th>
                              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase font-bold text-center">
                                Wilayah Jepang
                              </th>
                              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                Instansi / Perusahaan
                              </th>
                              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                Koordinat (Lat, Lng)
                              </th>
                              <th className="p-3 text-[10px] font-bold text-slate-500 uppercase text-right">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {paginatedSebaran.map((student) => (
                              <tr
                                key={`${student.id}-${student.name}`}
                                className="hover:bg-slate-50/50 transition"
                              >
                                <td className="p-3">
                                  <p className="font-extrabold text-slate-900">
                                    {student.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-semibold font-sans">
                                    {student.batch} {student.graduationYear ? `| Lulus ${student.graduationYear}` : ""}
                                  </p>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">
                                    🇯🇵 {student.prefecture || "Tokyo"}
                                  </span>
                                  {student.city && (
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                      {student.city}
                                    </p>
                                  )}
                                </td>
                                <td className="p-3">
                                  <p className="font-semibold text-slate-800">
                                    {student.company || "-"}
                                  </p>
                                </td>
                                <td className="p-3 font-mono text-[10px] text-slate-500">
                                  {student.latitude !== undefined && student.latitude !== null &&
                                  student.longitude !== undefined && student.longitude !== null ? (
                                    <span>
                                      {Number(student.latitude).toFixed(4)},{" "}
                                      {Number(student.longitude).toFixed(4)}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300 italic">
                                      Belum di-set
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsCreateMapModalOpen(true);
                                        setMapIsEditing(student.id);
                                        setMapStudentId(student.id);
                                        setMapStudentName(student.name);
                                        setMapPrefecture(
                                          student.prefecture || "Tokyo",
                                        );
                                        setMapCity(student.city || "");
                                        setMapCompany(student.company || "");
                                        setMapLatitude(
                                          student.latitude != null ? String(student.latitude) : "",
                                        );
                                        setMapLongitude(
                                          student.longitude != null ? String(student.longitude) : "",
                                        );
                                        setMapGraduationYear(student.graduationYear || "");
                                      }}
                                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition cursor-pointer"
                                    >
                                      Edit Lokasi
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Hapus Data Sebaran"
                                      confirmMessage={`Hapus data alumni ${student.name} dari sistem?`}
                                      onConfirmClick={() => onUpdateState("activeStudents", "delete", { id: student.id })}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition cursor-pointer"
                                      title="Hapus Data"
                                    >
                                      Hapus
                                    </ConfirmButton>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {allSebaranAlumni.length === 0 && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="p-8 text-center text-slate-400 font-mono text-xs"
                                >
                                  Belum ada data alumni di Jepang dari LPK.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {totalSebaranPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-slate-600">
                                Menampilkan <span className="font-bold text-slate-800">{((currentSebaranPage - 1) * sebaranPerPage) + 1}</span> hingga <span className="font-bold text-slate-800">{Math.min(currentSebaranPage * sebaranPerPage, allSebaranAlumni.length)}</span> dari <span className="font-bold text-slate-800">{allSebaranAlumni.length}</span> alumni
                              </p>
                            </div>
                            <div>
                              <nav className="isolate inline-flex -space-x-px rounded-xl shadow-2xs overflow-hidden border border-slate-200 bg-white" aria-label="Pagination">
                                <button
                                  type="button"
                                  onClick={() => setSebaranPage(p => Math.max(1, p - 1))}
                                  disabled={currentSebaranPage === 1}
                                  className="relative inline-flex items-center px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </button>
                                {Array.from({ length: totalSebaranPages }).map((_, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setSebaranPage(i + 1)}
                                    className={`relative inline-flex items-center px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                                      currentSebaranPage === i + 1
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setSebaranPage(p => Math.min(totalSebaranPages, p + 1))}
                                  disabled={currentSebaranPage === totalSebaranPages}
                                  className="relative inline-flex items-center px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </nav>
                            </div>
                          </div>

                          {/* Mobile Pagination */}
                          <div className="flex flex-1 justify-between sm:hidden items-center">
                            <button
                              type="button"
                              onClick={() => setSebaranPage(p => Math.max(1, p - 1))}
                              disabled={currentSebaranPage === 1}
                              className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                            >
                              Sebelumnya
                            </button>
                            <span className="text-xs text-slate-600 font-bold">
                              {currentSebaranPage} / {totalSebaranPages}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSebaranPage(p => Math.min(totalSebaranPages, p + 1))}
                              disabled={currentSebaranPage === totalSebaranPages}
                              className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                            >
                              Selanjutnya
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* DATA AFILIASI & REKOMENDASI SISWA */}
        {activeSegment === "afiliasi" && (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                <Share2 className="h-6 w-6 text-rose-500" />
                Data Afiliasi & Rekomendasi Alumni
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Sistem monitoring rujukan pendaftaran. Pantau kontribusi alumni dalam mendatangkan siswa baru secara real-time.
              </p>
            </div>

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
                r.username.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
                r.realName.toLowerCase().includes(affiliateSearch.toLowerCase())
              );

              // Filter students to show
              let displayedStudents = allReferred;
              if (selectedReferrer !== "all") {
                displayedStudents = displayedStudents.filter(s => s.referrer === selectedReferrer);
              }
              if (affiliateSearch) {
                displayedStudents = displayedStudents.filter(s => 
                  s.name.toLowerCase().includes(affiliateSearch.toLowerCase()) || 
                  s.referrer.toLowerCase().includes(affiliateSearch.toLowerCase())
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
                    <div className="bg-rose-50 border border-rose-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-rose-600 border border-rose-100">
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider">Total Referral</p>
                        <p className="text-xl font-black text-slate-800 leading-tight">{totalReferrals} Siswa</p>
                      </div>
                    </div>

                    <div className="bg-teal-50 border border-teal-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-teal-600 border border-teal-100">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider">Siswa Dilatih</p>
                        <p className="text-xl font-black text-slate-800 leading-tight">{activeReferrals} Siswa</p>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-amber-600 border border-amber-100">
                        <Plus className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Pendaftar Baru</p>
                        <p className="text-xl font-black text-slate-800 leading-tight">{registeredReferrals} Calon</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                      <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-purple-600 border border-purple-100">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">Alumni Mereferensi</p>
                        <p className="text-xl font-black text-slate-800 leading-tight">{totalAlumniCount} Alumni</p>
                      </div>
                    </div>
                  </div>

                  {/* Filter and search controls */}
                  <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    <div className="relative flex-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Cari nama siswa atau username alumni..."
                        value={affiliateSearch}
                        onChange={(e) => setAffiliateSearch(e.target.value)}
                        className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all font-sans"
                      />
                    </div>
                    
                    <div className="flex gap-2 shrink-0">
                      {selectedReferrer !== "all" && (
                        <button
                          type="button"
                          onClick={() => setSelectedReferrer("all")}
                          className="bg-rose-100 hover:bg-rose-200/80 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 animate-fade-in"
                        >
                          <Filter className="h-3.5 w-3.5" />
                          <span>Filter: {referrerMap[selectedReferrer]?.realName} (X)</span>
                        </button>
                      )}
                      
                      {(affiliateSearch || selectedReferrer !== "all") && (
                        <button
                          type="button"
                          onClick={() => {
                            setAffiliateSearch("");
                            setSelectedReferrer("all");
                          }}
                          className="bg-slate-200 hover:bg-slate-300/80 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Split Dashboard Sections */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: Alumni Leaderboard & Selection */}
                    <div className="lg:col-span-5 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10.5px] font-black text-slate-450 uppercase tracking-widest font-mono">
                          Daftar Alumni Mereferensikan ({filteredReferrers.length})
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {filteredReferrers.length === 0 ? (
                          <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl text-center text-slate-400 text-xs italic">
                            Tidak ada alumni yang sesuai kata kunci pencarian.
                          </div>
                        ) : (
                          filteredReferrers.map((alumnus) => {
                            const isCurrentSelected = selectedReferrer === alumnus.username;
                            return (
                              <div
                                key={alumnus.username}
                                onClick={() => setSelectedReferrer(isCurrentSelected ? "all" : alumnus.username)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                  isCurrentSelected
                                    ? "bg-rose-50/70 border-rose-350 shadow-xs ring-2 ring-rose-100"
                                    : "bg-white hover:bg-slate-50/70 border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1">
                                    <p className="font-sans font-extrabold text-slate-855 text-xs flex items-center gap-1.5">
                                      <span>👩‍🎓</span> {alumnus.realName}
                                    </p>
                                    <p className="font-mono text-[9.5px] text-slate-400 font-bold block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded max-w-fit leading-none">
                                      Ref Code: {alumnus.username}
                                    </p>
                                  </div>
                                  
                                  <div className="text-right">
                                    <span className="text-xs font-black font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                      {alumnus.total} Siswa
                                    </span>
                                  </div>
                                </div>

                                {/* Custom mini progress bar of active/registered */}
                                <div className="mt-3.5 space-y-1">
                                  <div className="flex justify-between text-[8.5px] text-slate-400 font-bold">
                                    <span>Aktif: {alumnus.activeCount}</span>
                                    <span>Pendaftar: {alumnus.registeredCount}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-teal-500 h-full transition-all duration-350" 
                                      style={{ width: `${(alumnus.activeCount / alumnus.total) * 100}%` }}
                                    />
                                    <div 
                                      className="bg-amber-400 h-full transition-all duration-350" 
                                      style={{ width: `${(alumnus.registeredCount / alumnus.total) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Referred Students Detail list */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10.5px] font-black text-slate-450 uppercase tracking-widest font-mono">
                          {selectedReferrer === "all" 
                            ? `Seluruh Siswa Hasil Rujukan (${displayedStudents.length})` 
                            : `Siswa Dirujuk oleh ${referrerMap[selectedReferrer]?.realName} (${displayedStudents.length})`}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-black tracking-wider text-[9.5px]">
                              <tr>
                                <th className="px-4 py-3">Nama Siswa</th>
                                <th className="px-4 py-3">Referral Dari</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Rincian</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {displayedStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">
                                    Belum ada data pendaftar untuk kriteria ini.
                                  </td>
                                </tr>
                              ) : (
                                displayedStudents.map((student, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                                    <td className="px-4 py-3.5">
                                      <p className="font-extrabold text-slate-800 text-[11px] font-sans">{student.name}</p>
                                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                                    </td>
                                    
                                    <td className="px-4 py-3.5">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReferrer(student.referrer)}
                                        className="text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-1 rounded-lg border border-rose-100/50 transition text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>👤 {referrerMap[student.referrer]?.realName || student.referrer}</span>
                                      </button>
                                    </td>

                                    <td className="px-4 py-3.5">
                                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                        student.type === 'active' 
                                          ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                      }`}>
                                        {student.type === 'active' ? 'Siswa Aktif' : 'Pendaftaran'}
                                      </span>
                                    </td>

                                    <td className="px-4 py-3.5">
                                      <span className="font-medium text-slate-600 block text-[10.5px]">
                                        {student.status}
                                      </span>
                                      {student.date !== "-" && (
                                        <span className="text-[9px] text-slate-400 block font-mono">
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
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {activeSegment === "informasi" && (
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                <Bell className="h-6 w-6 text-yellow-500" />
                BROADCAST INFORMASI LPK
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Atur teks berjalan (marquee) yang akan tampil di halaman Beranda utama untuk semua pengguna.
              </p>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 max-w-2xl">
              <label className="text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block">
                Teks Berjalan (Marquee)
              </label>
              <textarea
                value={custRunningText || ""}
                onChange={(e) => setCustRunningText(e.target.value)}
                className="w-full text-sm rounded-xl border border-slate-200 p-4 outline-none focus:border-indigo-500 transition min-h-[120px] bg-white shadow-inner text-slate-800"
                placeholder="Masukkan info terkini yang akan berjalan di layar utama..."
              />
              <div className="text-xs text-slate-500 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-lg">💡</span> 
                  Gunakan simbol | (garis vertikal) untuk memisahkan pengumuman.
                </div>
                
                <ConfirmForm
                  confirmTitle="Simpan Teks Berjalan"
                  confirmMessage="Menerapkan teks berjalan baru ini ke beranda publik secara instan?"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const ok = await onUpdateState("customization", "update", {
                      runningText: custRunningText
                    });
                    if (ok) {
                      setRunningTextSaveSuccess(true);
                      setTimeout(() => setRunningTextSaveSuccess(false), 3000);
                    }
                  }}
                >
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="h-4 w-4" /> 
                    {runningTextSaveSuccess ? "Berhasil Disimpan!" : "Simpan Teks Berjalan"}
                  </button>
                </ConfirmForm>
              </div>
            </div>
          </div>
        )}

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
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminRegData.name || 'Siswa')}&background=e2e8f0&color=334155`;
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