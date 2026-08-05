import { Fragment, jsx, jsxs } from "react/jsx-runtime";
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Users,
  CheckCircle2,
  DollarSign,
  Package,
  FileText,
  Plus,
  Trash2,
  History,
  Calculator,
  Check,
  Edit,
  AlertCircle,
  ShoppingBag,
  Sliders,
  Palette,
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
  Loader2,
  LoaderCircle,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  Star,
  ChevronDown
} from "lucide-react";
import { uploadFileToFirebase } from "../lib/storageHelper";
import {
  JAPAN_PREFECTURES,
  ALL_48_PREFECTURES_COORDINATES
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
import PembayaranSiswaView from "./PembayaranSiswaView";
export function parsePrice(val) {
  if (val === void 0 || val === null) return 0;
  let str = String(val).trim().toLowerCase();
  if (!str) return 0;
  if (/juta|jt/i.test(str)) {
    const numPart = str.replace(/juta|jt/gi, "").trim().replace(",", ".");
    const parsed = parseFloat(numPart);
    if (!isNaN(parsed)) {
      return Math.round(parsed * 1e6);
    }
  }
  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  return isNaN(num) ? 0 : num;
}
export function formatRupiah(val) {
  if (val === void 0 || val === null) return "";
  let str = String(val).trim();
  if (!str) return "";
  if (/^Rp\s?\d{1,3}(\.\d{3})+$/i.test(str)) {
    return str.replace(/^rp\s*/i, "Rp ");
  }
  if (/juta|jt/i.test(str)) {
    const numPart = str.toLowerCase().replace(/juta|jt/gi, "").trim().replace(",", ".");
    const parsed = parseFloat(numPart);
    if (!isNaN(parsed)) {
      return `Rp ${Math.round(parsed * 1e6).toLocaleString("id-ID")}`;
    }
  }
  const digits = str.replace(/\D/g, "");
  const num = parseInt(digits, 10);
  if (isNaN(num)) {
    return str;
  }
  return `Rp ${num.toLocaleString("id-ID")}`;
}
const resizeImage = (file, maxWidth, maxHeight, callback) => {
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
        callback(e.target?.result);
      }
    };
    img.src = e.target?.result;
  };
  reader.readAsDataURL(file);
};
export const sortStudentsByDateDesc = (a, b) => {
  const idA = parseInt((a.id || "").replace(/\D/g, "") || "0");
  const idB = parseInt((b.id || "").replace(/\D/g, "") || "0");
  if (idA !== idB) return idB - idA;
  const getSortValue = (s) => {
    if (s.timestamp) return new Date(s.timestamp).getTime() || 0;
    if (s.date && s.date.split("-").length === 3) return new Date(s.date).getTime() || 0;
    return 0;
  };
  return getSortValue(b) - getSortValue(a);
};
export default function AdminView({
  systemState,
  currentUser,
  onUpdateState,
  initialSegment,
  onSegmentChange
}) {
  const [activeSegment, setActiveSegment] = useState(
    initialSegment || (typeof window !== "undefined" && window.innerWidth < 768 ? null : "siswa")
  );
  const [showCostConfig, setShowCostConfig] = useState(false);
  const isAlumniClass = (className) => {
    if (!className) return false;
    if (className.toLowerCase().includes("alumni")) return true;
    const foundClass = (systemState?.customization?.lmsClasses || []).find(
      (c) => c.name?.toLowerCase() === className.toLowerCase()
    );
    return foundClass?.type === "alumni";
  };
  const handlePrintInvoiceSummary = async (paySummary) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(24);
    doc.setTextColor(50, 50, 50);
    doc.text("INVOICE", pageWidth - 15, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`# ${(/* @__PURE__ */ new Date()).getTime().toString().slice(-6)}`, pageWidth - 15, 28, { align: "right" });
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
          currentY = 30;
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
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Jalan Raya Bongsri, Muktiharjo Kec Tlogowungu", 15, currentY + 8);
    doc.text("Kab Pati Kode pos 59163, Jawa Tengah", 15, currentY + 13);
    doc.text("Tanggal:", pageWidth - 55, 45);
    doc.text((/* @__PURE__ */ new Date()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }), pageWidth - 15, 45, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Pembayaran kepada:", 15, 50);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text(paySummary.studentName, 15, 56);
    doc.setFont("helvetica", "normal");
    doc.setFillColor(245, 245, 245);
    doc.rect(pageWidth - 80, 52, 65, 10, "F");
    doc.setFontSize(10);
    doc.text("Sisa Tagihan:", pageWidth - 75, 59);
    doc.setFont("helvetica", "bold");
    doc.text(`Rp ${paySummary.totalPending.toLocaleString("id-ID")}`, pageWidth - 18, 59, { align: "right" });
    doc.setFont("helvetica", "normal");
    const tableData = [
      ["Summary Tagihan LPK", paySummary.receiptsCount.toString(), `Rp ${(paySummary.totalPaid + paySummary.totalPending).toLocaleString("id-ID")}`, `Rp ${(paySummary.totalPaid + paySummary.totalPending).toLocaleString("id-ID")}`],
      ["Sudah Dibayar (Lunas)", "", "", `- Rp ${paySummary.totalPaid.toLocaleString("id-ID")}`]
    ];
    autoTable(doc, {
      startY: 75,
      head: [["Keterangan Tagihan", "Total TRX", "Biaya", "Jumlah"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 40, halign: "right" }
      },
      foot: [["", "", "Total Sisa:", `Rp ${paySummary.totalPending.toLocaleString("id-ID")}`]],
      footStyles: { fillColor: [245, 245, 245], textColor: [50, 50, 50], fontStyle: "bold", halign: "right" }
    });
    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text("Ketentuan:", 15, finalY + 20);
    doc.setTextColor(50, 50, 50);
    doc.text("Pembayaran dilakukan melalui transfer bank di nomor rekening berikut:", 15, finalY + 26);
    if (systemState?.customization?.paymentAccounts?.length > 0) {
      let yOffset = finalY + 32;
      systemState.customization.paymentAccounts.forEach((acc) => {
        doc.text(`A.N ${acc.holderName} BANK ${acc.bankName}_${acc.accountNumber}`, 15, yOffset);
        yOffset += 6;
      });
    } else {
      doc.text("Silakan hubungi admin LPK untuk informasi rekening bank resmi.", 15, finalY + 32);
    }
    doc.save(`Invoice_${paySummary.studentName.replace(/\s+/g, "_")}.pdf`);
  };
  const handleSendInvoiceNotification = async (paySummary) => {
    const studentUser = systemState.users?.find((u) => u.name === paySummary.studentName);
    if (studentUser) {
      await onUpdateState("messages", "send", {
        senderId: currentUser.username,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        receiverId: studentUser.username,
        text: `Invoice tagihan Anda telah diperbarui. Silakan cek portal pembayaran Anda. Total Lunas: Rp ${paySummary.totalPaid.toLocaleString("id-ID")}, Sisa Tagihan Tertunda: Rp ${paySummary.totalPending.toLocaleString("id-ID")}.`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        isRead: false
      });
      alert(`Notifikasi tagihan berhasil dikirim ke siswa ${paySummary.studentName}.`);
    } else {
      alert(`Gagal mengirim notifikasi: Akun untuk siswa ${paySummary.studentName} belum terdaftar di sistem.`);
    }
  };
  const handleDeletePayment = (paymentId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus riwayat pembayaran ini?")) {
      onUpdateState("payments", "delete", { id: paymentId });
    }
  };
  const [costRegistration, setCostRegistration] = useState(systemState.costConfig?.registration ?? 5e5);
  const [costDP, setCostDP] = useState(systemState.costConfig?.dp ?? 35e5);
  const [costFullPayment, setCostFullPayment] = useState(systemState.costConfig?.fullPayment ?? 2e6);
  const [costManagementFee, setCostManagementFee] = useState(systemState.costConfig?.managementFee ?? 5e6);
  const handleSaveCostConfig = (e) => {
    e.preventDefault();
    onUpdateState("costConfig", "update", {
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
    if (onSegmentChange && activeSegment) {
      onSegmentChange(activeSegment);
    }
  }, [activeSegment, onSegmentChange]);
  const [expandedDocs, setExpandedDocs] = useState({});
  const [verifyingDocsStudent, setVerifyingDocsStudent] = useState(null);
  const [selectedClassToPlot, setSelectedClassToPlot] = useState("");
  const [viewingCvStudentId, setViewingCvStudentId] = useState(null);
  const [isMenuMinimized, setIsMenuMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateJobOrderModalOpen, setIsCreateJobOrderModalOpen] = useState(false);
  const [editingJobOrder, setEditingJobOrder] = useState(null);
  const [isCreateInventoryModalOpen, setIsCreateInventoryModalOpen] = useState(false);
  const [isCreateTaxModalOpen, setIsCreateTaxModalOpen] = useState(false);
  const [isCreateMapModalOpen, setIsCreateMapModalOpen] = useState(false);
  const [selectedClassForChapters, setSelectedClassForChapters] = useState(null);
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterJapaneseTitle, setNewChapterJapaneseTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");
  const [editingChapterNumber, setEditingChapterNumber] = useState(null);
  const [activeChapterTab, setActiveChapterTab] = useState("list");
  const [jobPartnerName, setJobPartnerName] = useState("");
  const [jobNoReg, setJobNoReg] = useState("");
  const [jobOccupation, setJobOccupation] = useState("");
  const [jobType, setJobType] = useState("Tokutei ginou");
  const [jobLocation, setJobLocation] = useState("");
  const [activeKeuanganFeature, setActiveKeuanganFeature] = useState("riwayat-dana");
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
  const [recoSiswaId, setRecoSiswaId] = useState({});
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState(null);
  const [viewingDocUrl, setViewingDocUrl] = useState(null);
  const [docZoom, setDocZoom] = useState(1);
  const [docRotation, setDocRotation] = useState(0);
  React.useEffect(() => {
    setDocZoom(1);
    setDocRotation(0);
  }, [viewingDocUrl]);
  const isStudentRoleOnly = (s) => {
    const nameLower = (s.name || "").toLowerCase();
    if (nameLower.includes("sensei") || nameLower.includes("admin") || nameLower.includes("pengajar")) {
      return false;
    }
    const user = systemState.users?.find(
      (u) => u.studentId && u.studentId === s.id || u.name && u.name.trim().toLowerCase() === s.name.trim().toLowerCase()
    );
    if (user && ["Admin", "Pengajar", "Admin Biasa", "Admin Super", "VVIP"].includes(user.role)) {
      return false;
    }
    return true;
  };
  const [siswaTab, setSiswaTab] = useState("aktif");
  const [syncingStudents, setSyncingStudents] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [outOfSyncActive, setOutOfSyncActive] = useState([]);
  const [outOfSyncRegistered, setOutOfSyncRegistered] = useState([]);
  const checkSyncStatus = () => {
    const allUsers = systemState.unfilteredUsers || systemState.users || [];
    const ghostActive = (systemState.activeStudents || []).filter((student) => {
      const hasUser = allUsers.some(
        (u) => u.studentId && u.studentId === student.id || u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase() || u.email && student.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase() || u.username && student.email && u.username.trim().toLowerCase() === student.email.trim().toLowerCase()
      );
      return !hasUser;
    });
    const ghostRegistered = (systemState.registeredStudents || []).filter((student) => {
      if (student.status !== "Disetujui") return false;
      const hasUser = allUsers.some(
        (u) => u.studentId && u.studentId === student.id || u.name && student.name && u.name.trim().toLowerCase() === student.name.trim().toLowerCase() || u.email && student.email && u.email.trim().toLowerCase() === student.email.trim().toLowerCase() || u.username && student.email && u.username.trim().toLowerCase() === student.email.trim().toLowerCase()
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
      for (const student of outOfSyncActive) {
        const ok = await onUpdateState("activeStudents", "delete", { id: student.id });
        if (ok) successCount++;
      }
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
  const [selectedReferrer, setSelectedReferrer] = useState("all");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const toggleDocExpand = (id) => {
    setExpandedDocs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  const [verifyingPayment, setVerifyingPayment] = useState(null);
  const [payStudent, setPayStudent] = useState("");
  const [searchPayStudent, setSearchPayStudent] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payCategory, setPayCategory] = useState("SPP Bulanan");
  const [payMethod, setPayMethod] = useState("Transfer");
  const [payStatus, setPayStatus] = useState("Menunggu");
  const [custLogoText, setCustLogoText] = useState("");
  const [custLogoIcon, setCustLogoIcon] = useState("");
  const [custThemeColor, setCustThemeColor] = useState("");
  const [custLogoUrl, setCustLogoUrl] = useState("");
  const [custFaviconUrl, setCustFaviconUrl] = useState("");
  const [custSlides, setCustSlides] = useState([]);
  const [custGallery, setCustGallery] = useState([]);
  const [custLandingConfig, setCustLandingConfig] = useState({});
  const [oppUploadStatus, setOppUploadStatus] = useState({});
  const [galleryUploadStatus, setGalleryUploadStatus] = useState({});
  const [sliderUploadStatus, setSliderUploadStatus] = useState({});
  const [custRunningText, setCustRunningText] = useState("");
  const [officeLat, setOfficeLat] = useState("");
  const [officeLon, setOfficeLon] = useState("");
  const [officeRadius, setOfficeRadius] = useState("");
  const [officeEnforce, setOfficeEnforce] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [slideSaveSuccess, setSlideSaveSuccess] = useState(false);
  const [landingSaveSuccess, setLandingSaveSuccess] = useState(false);
  const [runningTextSaveSuccess, setRunningTextSaveSuccess] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState(null);
  const [selectedGalleryId, setSelectedGalleryId] = useState(null);
  React.useEffect(() => {
    if (systemState?.customization) {
      setCustLogoText(
        (prev) => prev || systemState.customization?.logoText || "LPK Source Course"
      );
      setCustLogoIcon(
        (prev) => prev || systemState.customization?.logoIcon || "GraduationCap"
      );
      setCustThemeColor(
        (prev) => prev || systemState.customization?.themeColor || "blue"
      );
      setCustLogoUrl(
        (prev) => prev || systemState.customization?.logoUrl || ""
      );
      setCustFaviconUrl(
        (prev) => prev || systemState.customization?.faviconUrl || ""
      );
      setCustSlides((prev) => {
        if (prev.length === 0) {
          return systemState.slideshows || [];
        }
        return prev;
      });
      setCustGallery((prev) => {
        if (prev.length > 0) return prev;
        if (systemState.galleries && systemState.galleries.length > 0) return systemState.galleries;
        if (systemState.customization?.gallery && systemState.customization.gallery.length > 0) return systemState.customization.gallery;
        return [];
      });
      setCustRunningText(
        (prev) => prev || systemState.customization?.runningText || ""
      );
      setCustLandingConfig((prev) => {
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
              emoji: "\u26E9\uFE0F",
              title: "Level N3",
              description: "Membangun dasar yang kuat untuk komunikasi sehari-hari & persiapan kerja di Jepang.",
              features: ["Kosakata & Tata Bahasa Dasar", "Percakapan Sehari-hari", "Persiapan ujian JLPT N3"],
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
              emoji: "\u{1F5FB}",
              title: "Level N2",
              description: "Tingkatkan kemampuan bahasa untuk komunikasi lebih luas & dunia kerja.",
              features: ["Kosakata & Tata Bahasa Menengah", "Pemahaman Bacaan & Listening", "Persiapan JLPT N2"],
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
              emoji: "\u{1F3EF}",
              title: "Level N1",
              description: "Kuasai bahasa Jepang tingkat lanjut untuk keperluan akademik, bisnis, & profesional.",
              features: ["Kosakata & Tata Bahasa Lanjutan", "Kemampuan Diskusi & Presentasi", "Persiapan JLPT N1"],
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
              emoji: "\u{1FAAD}",
              title: "Level Native",
              description: "Belajar seperti orang Jepang! Fasih, natural, dan percaya diri dalam segala situasi.",
              features: ["Ekspresi Natural & Idiom", "Komunikasi Bisnis & Budaya Jepang", "Praktik Langsung dengan Native Speaker"],
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
      const loc = systemState.customization?.officeLocation || { latitude: -7.79558, longitude: 110.36949, radius: 200, enforce: true };
      setOfficeLat((prev) => prev || String(loc.latitude ?? -7.79558));
      setOfficeLon((prev) => prev || String(loc.longitude ?? 110.36949));
      setOfficeRadius((prev) => prev || String(loc.radius ?? 200));
      setOfficeEnforce((prev) => prev !== null ? prev : loc.enforce !== false);
    }
  }, [systemState?.customization]);
  const [custLogoDragActive, setCustLogoDragActive] = useState(false);
  const [custFaviconDragActive, setCustFaviconDragActive] = useState(false);
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileToFirebase(file, "customization").then((url) => setCustLogoUrl(url)).catch((err) => {
        console.error(err);
        alert("Gagal upload logo");
      });
    }
  };
  const handleLogoDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCustLogoDragActive(true);
    } else if (e.type === "dragleave") {
      setCustLogoDragActive(false);
    }
  };
  const handleLogoDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCustLogoDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        uploadFileToFirebase(file, "customization").then((url) => setCustLogoUrl(url)).catch((err) => {
          console.error(err);
          alert("Gagal upload logo");
        });
      }
    }
  };
  const handleFaviconFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFileToFirebase(file, "customization").then((url) => setCustFaviconUrl(url)).catch((err) => {
        console.error(err);
        alert("Gagal upload favicon");
      });
    }
  };
  const handleFaviconDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setCustFaviconDragActive(true);
    } else if (e.type === "dragleave") {
      setCustFaviconDragActive(false);
    }
  };
  const handleFaviconDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCustFaviconDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        uploadFileToFirebase(file, "customization").then((url) => setCustFaviconUrl(url)).catch((err) => {
          console.error(err);
          alert("Gagal upload favicon");
        });
      }
    }
  };
  const handleSaveCustomization = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const ok = await onUpdateState("customization", "update", {
      logoText: custLogoText,
      logoIcon: custLogoIcon,
      themeColor: custThemeColor,
      logoUrl: custLogoUrl,
      faviconUrl: custFaviconUrl
    });
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3e3);
    }
  };
  const adminMapRef = React.useRef(null);
  const adminMapInstanceRef = React.useRef(null);
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
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      document.body.appendChild(script);
    }
    const loadAdminRadarMap = () => {
      const L = window.L;
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
        attributionControl: false
      });
      adminMapInstanceRef.current = map;
      setTimeout(() => {
        try {
          if (map && map._container) map.invalidateSize();
        } catch (e) {
        }
      }, 250);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      ).addTo(map);
      const defaultCoordinates = ALL_48_PREFECTURES_COORDINATES;
      const expatriates = systemState.activeStudents?.filter((s) => s.status === "Di Jepang") || [];
      const groups = {};
      expatriates.forEach((student) => {
        const pref = student.prefecture || "Tokyo";
        const lat = student.latitude !== void 0 && student.latitude !== null ? Number(student.latitude) : defaultCoordinates[pref] ? defaultCoordinates[pref][0] : 35.6762;
        const lng = student.longitude !== void 0 && student.longitude !== null ? Number(student.longitude) : defaultCoordinates[pref] ? defaultCoordinates[pref][1] : 139.6503;
        const key = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
        if (!groups[key]) {
          groups[key] = {
            cityName: pref,
            lat,
            lng,
            alumni: []
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
          fillOpacity: 0.95
        }).addTo(map);
        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 11px; max-width: 250px; color: #1e293b;">
            <div style="font-weight: 800; font-size: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center;">
              <span>\u{1F1EF}\u{1F1F5} KOTA/PREF: ${group.cityName.toUpperCase()}</span>
              <span style="background-color: #ef4444; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 10px; font-weight: 900;">${numAlumni} ALUMNI</span>
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, {
          closeButton: true,
          closeOnEscapeKey: true
        });
        marker.on("click", (e) => {
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
    if (window.L) {
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
  const [invCondition, setInvCondition] = useState("Baik");
  const [invLoc, setInvLoc] = useState("Kantor");
  const [taxMonth, setTaxMonth] = useState("");
  const [taxRev, setTaxRev] = useState("");
  const [taxExp, setTaxExp] = useState("");
  const [taxRate, setTaxRate] = useState("0.11");
  const [taxStatus, setTaxStatus] = useState("Draft");
  const [taxNotes, setTaxNotes] = useState("");
  const [taxSptFile, setTaxSptFile] = useState("");
  const [taxFinancialReportFile, setTaxFinancialReportFile] = useState("");
  const [isEditTaxModalOpen, setIsEditTaxModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [previewTaxFile, setPreviewTaxFile] = useState(null);
  const [previewTaxFileName, setPreviewTaxFileName] = useState("");
  const [salarySubTab, setSalarySubTab] = useState("buku_kas");
  useEffect(() => {
    if (currentUser?.role === "Admin Biasa") {
      setSalarySubTab("hr");
    }
  }, [currentUser]);
  const [hrFilterMonth, setHrFilterMonth] = useState((/* @__PURE__ */ new Date()).toISOString().substring(0, 7));
  const [selectedStaffForQuickPay, setSelectedStaffForQuickPay] = useState(null);
  const [quickPayAmount, setQuickPayAmount] = useState("4500000");
  const [quickPayNotes, setQuickPayNotes] = useState("");
  const [salMonth, setSalMonth] = useState("");
  const [salAmount, setSalAmount] = useState("");
  const [salStaffName, setSalStaffName] = useState("");
  const [salRole, setSalRole] = useState("Pengajar");
  const [salStatus, setSalStatus] = useState("Pending");
  const [salPaymentDate, setSalPaymentDate] = useState("");
  const [salNotes, setSalNotes] = useState("");
  const [editingSalId, setEditingSalId] = useState(null);
  const [mapStudentId, setMapStudentId] = useState("");
  const [mapCity, setMapCity] = useState("");
  const [mapCompany, setMapCompany] = useState("");
  const [mapPrefecture, setMapPrefecture] = useState("Tokyo");
  const [mapLatitude, setMapLatitude] = useState("");
  const [mapLongitude, setMapLongitude] = useState("");
  const [mapGraduationYear, setMapGraduationYear] = useState("");
  const [mapStudentName, setMapStudentName] = useState("");
  const [mapBatch, setMapBatch] = useState("Angkatan 11");
  const [mapIsEditing, setMapIsEditing] = useState(null);
  const [selectedMapPref, setSelectedMapPref] = useState(null);
  const [presetSearch, setPresetSearch] = useState("");
  const [accBankName, setAccBankName] = useState("");
  const [accNumber, setAccNumber] = useState("");
  const [accHolder, setAccHolder] = useState("");
  const [expandedJobIds, setExpandedJobIds] = useState([]);
  const [expandedAlumniClassIds, setExpandedAlumniClassIds] = useState([]);
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [adminEditingStudentId, setAdminEditingStudentId] = useState(null);
  const [adminRegData, setAdminRegData] = useState({});
  const [showAdminRegPassword, setShowAdminRegPassword] = useState(false);
  const [adminRegError, setAdminRegError] = useState("");
  const [adminRegSuccess, setAdminRegSuccess] = useState(false);
  const filterByMonthYear = (dateStr) => {
    if (!dateStr) return true;
    if (filterMonth === "All" && filterYear === "All") return true;
    try {
      const d = new Date(dateStr);
      const isMonthMatch = filterMonth === "All" || (d.getMonth() + 1).toString() === filterMonth;
      const isYearMatch = filterYear === "All" || d.getFullYear().toString() === filterYear;
      return isMonthMatch && isYearMatch;
    } catch {
      return true;
    }
  };
  const toggleJobExpansion = (jobId) => {
    setExpandedJobIds(
      (prev) => prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };
  const handleAddPaymentAccount = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!accBankName || !accNumber || !accHolder) return;
    const currentAccounts = systemState.customization?.paymentAccounts || [
      {
        bankName: "BANK MANDIRI",
        accountNumber: "135-00-1928301-2",
        holderName: "LPK Source Course Indonesia"
      },
      {
        bankName: "BSI (BANK SYARIAH INDONESIA)",
        accountNumber: "712-345-678-9",
        holderName: "LPK Source Course Indo"
      }
    ];
    const newAccounts = [
      ...currentAccounts,
      {
        bankName: accBankName,
        accountNumber: accNumber,
        holderName: accHolder
      }
    ];
    await onUpdateState("customization", "update", {
      paymentAccounts: newAccounts
    });
    setAccBankName("");
    setAccNumber("");
    setAccHolder("");
  };
  const startAdminEditReg = (studentId) => {
    let regStudentInfo = systemState.registeredStudents?.find(
      (rs) => rs.id === studentId
    );
    if (!regStudentInfo) {
      const activeInfo = systemState.activeStudents?.find(
        (s) => s.id === studentId
      );
      if (activeInfo) {
        const matchByName = systemState.registeredStudents?.find(
          (rs) => rs.name === activeInfo.name
        );
        if (matchByName) {
          regStudentInfo = matchByName;
        } else {
          regStudentInfo = {
            id: activeInfo.id,
            name: activeInfo.name,
            email: `${activeInfo.name.toLowerCase().replace(/\s+/g, "")}@example.com`,
            phone: "-",
            district: "-",
            birthDate: "-",
            gender: "-",
            education: "-",
            school: "-",
            japaneseLevel: "-",
            graduationYear: activeInfo.graduationYear || "",
            program: activeInfo.class,
            status: "Terverifikasi",
            date: "-"
          };
        }
      }
    }
    if (regStudentInfo) {
      setAdminRegData({ ...regStudentInfo });
      setAdminEditingStudentId(studentId);
      setAdminRegError("");
      setAdminRegSuccess(false);
    }
  };
  const handleAdminSaveReg = async (e) => {
    e.preventDefault();
    setAdminRegError("");
    setAdminRegSuccess(false);
    if (!adminRegData.name || !adminRegData.phone) {
      setAdminRegError("Nama dan No HP wajib diisi.");
      return;
    }
    let success = false;
    const isRegistered = systemState.registeredStudents?.some((rs) => rs.id === adminRegData.id);
    if (isRegistered) {
      success = await onUpdateState(
        "registeredStudents",
        "update",
        adminRegData
      );
    }
    const activeInfo = systemState.activeStudents?.find(
      (s) => s.id === adminEditingStudentId || s.name === adminRegData.name
    );
    if (activeInfo) {
      const activeSuccess = await onUpdateState("activeStudents", "update_status", {
        id: activeInfo.id,
        name: adminRegData.name,
        phone: adminRegData.phone,
        graduationYear: adminRegData.graduationYear
      });
      if (activeSuccess) success = true;
    }
    if (success) {
      setAdminRegSuccess(true);
      setTimeout(() => {
        setAdminRegSuccess(false);
        setAdminEditingStudentId(null);
      }, 2e3);
    } else {
      setAdminRegError("Gagal menyimpan data.");
    }
  };
  const handleRemovePaymentAccount = async (index) => {
    const currentAccounts = systemState.customization?.paymentAccounts || [];
    const newAccounts = [...currentAccounts];
    newAccounts.splice(index, 1);
    await onUpdateState("customization", "update", {
      paymentAccounts: newAccounts
    });
  };
  const handleApprove = async (student, assignedClass) => {
    await onUpdateState("registeredStudents", "approve", { id: student.id, class: assignedClass });
  };
  const handleReject = async (student) => {
    await onUpdateState("registeredStudents", "reject", { id: student.id });
  };
  const handleNewPaymentSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!payStudent || !payAmount) return;
    const ok = await onUpdateState("payments", "add", {
      studentName: payStudent,
      category: payCategory,
      amount: Number(payAmount),
      status: payStatus,
      paymentMethod: payMethod
    });
    if (ok) {
      setPayStudent("");
      setPayAmount("");
    }
  };
  const handleTogglePaymentStatus = async (item) => {
    const nextStatus = item.status === "Lunas" ? "Cicilan" : "Lunas";
    await onUpdateState("payments", "status", {
      id: item.id,
      status: nextStatus
    });
  };
  const handleNewInventorySubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!invName || !invAmount) return;
    const ok = await onUpdateState("inventory", "add", {
      itemName: invName,
      amount: Number(invAmount),
      condition: invCondition,
      location: invLoc
    });
    if (ok) {
      setInvName("");
      setInvAmount("");
    }
  };
  const triggerPreview = (base64Data, filename) => {
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
  const handleNewTaxSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (!taxMonth || !taxRev) return;
    const ok = await onUpdateState("taxes", "add", {
      monthString: taxMonth,
      totalRevenue: Number(taxRev),
      totalExpenses: Number(taxExp) || 0,
      taxRate: Number(taxRate) || 0.11,
      status: taxStatus,
      notes: taxNotes,
      sptFile: taxSptFile,
      financialReportFile: taxFinancialReportFile
    });
    if (ok) {
      resetTaxForm();
    }
  };
  const handleEditTaxSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
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
      financialReportFile: taxFinancialReportFile
    });
    if (ok) {
      setIsEditTaxModalOpen(false);
      resetTaxForm();
    }
  };
  const handleTaxDelete = async (item) => {
    await onUpdateState("taxes", "delete", { id: item.id });
  };
  const handleTaxReportAction = async (item) => {
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
  const handleInventoryDelete = async (item) => {
    await onUpdateState("inventory", "delete", { id: item.id });
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-3 sm:gap-6 py-4 sm:py-6 relative items-start", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: `hidden sm:flex shrink-0 ${isMenuMinimized ? "w-16" : "w-40"} transition-all duration-300 ease-in-out sticky top-4`,
        children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-1.5 sm:p-2 rounded-2xl border border-slate-200 flex flex-col gap-1 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2 px-1 sm:px-2 pt-1", children: [
            !isMenuMinimized && /* @__PURE__ */ jsx("span", { className: "font-black text-[10px] sm:text-xs text-slate-500 uppercase truncate", children: "Admin Menu" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsMenuMinimized(!isMenuMinimized),
                className: "p-1 sm:p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 cursor-pointer ml-auto",
                children: isMenuMinimized ? /* @__PURE__ */ jsx(Menu, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
              }
            )
          ] }),
          [
            { id: "siswa", name: "Administrasi Siswa", ic: Users },
            { id: "kelas", name: "Manajemen Kelas", ic: GraduationCap },
            { id: "kalender", name: "Jadwal LPK", ic: Calendar },
            { id: "dataCV", name: "Data CV", ic: BookOpen },
            { id: "joborders", name: "Job Order", ic: Landmark },
            { id: "pembayaran", name: "Kas & Bayar", ic: DollarSign },
            { id: "inventaris", name: "Inventaris", ic: Package },
            { id: "pajak", name: "Pajak & Keu", ic: FileText },
            { id: "gaji", name: "Buku Kas & Gaji", ic: Receipt },
            { id: "kustomisasi", name: "Branding", ic: Sliders },
            { id: "alumnivip", name: "Manajemen Kelas Alumni", ic: Star },
            { id: "galeri", name: "Galeri Foto", ic: Image },
            { id: "petasebaran", name: "Peta Alumni", ic: MapPin },
            { id: "afiliasi", name: "Data Afiliasi", ic: Share2 },
            { id: "informasi", name: "Informasi", ic: Bell },
            { id: "manajemen", name: "Manajemen Akun & Sensei", ic: Users }
          ].filter((tab) => {
            if (currentUser?.role === "Admin Biasa") {
              return tab.id !== "pembayaran" && tab.id !== "pajak";
            }
            return true;
          }).map((tab) => {
            const Icon = tab.ic;
            return /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setActiveSegment(tab.id),
                className: `w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl transition-all duration-200 cursor-pointer group relative ${activeSegment === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-200 translate-x-1" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`,
                title: isMenuMinimized ? tab.name : "",
                children: [
                  /* @__PURE__ */ jsx(Icon, { className: `h-5 w-5 shrink-0 ${activeSegment === tab.id ? "text-white" : "text-slate-400 group-hover:text-slate-600"}` }),
                  !isMenuMinimized && /* @__PURE__ */ jsx("span", { className: "text-[11px] sm:text-[13px] font-bold text-left truncate", children: tab.name }),
                  activeSegment === tab.id && /* @__PURE__ */ jsx("div", { className: "absolute left-0 w-1 h-6 bg-white rounded-r-full -ml-1 sm:-ml-2" })
                ]
              },
              tab.id
            );
          })
        ] })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0 space-y-6 sm:space-y-8 pb-10", children: [
      /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100", children: [
          /* @__PURE__ */ jsx(ShieldCheck, { className: "h-3.5 w-3.5" }),
          /* @__PURE__ */ jsx("span", { children: "Admin Control Center" })
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight", children: activeSegment ? activeSegment.charAt(0).toUpperCase() + activeSegment.slice(1) : "Dashboard Overview" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl", children: "Kelola ekosistem operasional LPK Source Course Indonesia secara terpadu. Verifikasi data, monitoring finansial, dan audit inventaris dalam satu panel kendali." })
      ] }) }),
      !activeSegment && /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center py-8 px-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-3 m-1", children: [
          /* @__PURE__ */ jsx("div", { className: "h-12 w-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm shadow-blue-100", children: /* @__PURE__ */ jsx(Sliders, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-display font-black text-lg text-slate-800", children: "Admin Desk Portal" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 leading-normal max-w-[280px] mx-auto font-medium", children: "Silakan pilih modul administrasi di bawah ini untuk mengelola operasional LPK." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-1", children: [
          { id: "siswa", name: "Adm Siswa", ic: Users, color: "blue" },
          { id: "kelas", name: "Manajemen Kelas", ic: GraduationCap, color: "indigo" },
          { id: "kalender", name: "Jadwal LPK", ic: Calendar, color: "emerald" },
          { id: "dataCV", name: "Database CV", ic: BookOpen, color: "sky" },
          { id: "joborders", name: "Job Order", ic: Landmark, color: "amber" },
          { id: "pembayaran", name: "Kas & Bayar", ic: DollarSign, color: "rose", restricted: true },
          { id: "inventaris", name: "Inventaris", ic: Package, color: "slate" },
          { id: "pajak", name: "Pajak & Keu", ic: FileText, color: "orange", restricted: true },
          { id: "gaji", name: "Buku Kas & Gaji", ic: Receipt, color: "violet", restricted: true },
          { id: "kustomisasi", name: "Branding", ic: Sliders, color: "pink" },
          { id: "alumnivip", name: "Manajemen Kelas Alumni", ic: Star, color: "yellow" },
          { id: "galeri", name: "Galeri Foto", ic: Image, color: "cyan" },
          { id: "petasebaran", name: "Peta Alumni", ic: MapPin, color: "teal" },
          { id: "afiliasi", name: "Data Afiliasi", ic: Share2, color: "blue" },
          { id: "informasi", name: "Informasi", ic: Bell, color: "red" },
          { id: "manajemen", name: "Manajemen Akun & Sensei", ic: Users, color: "slate" }
        ].filter((tab) => {
          if (currentUser?.role === "Admin Biasa" && tab.restricted) {
            return false;
          }
          return true;
        }).map((tab) => {
          const Icon = tab.ic;
          const colors = {
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
            red: "bg-red-50 text-red-600 border-red-100"
          };
          return /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setActiveSegment(tab.id),
              className: "flex flex-col items-center justify-center gap-3 p-5 bg-white border border-slate-100 rounded-[2rem] hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer group",
              children: [
                /* @__PURE__ */ jsx("div", { className: `h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${colors[tab.color] || colors.blue}`, children: /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider text-slate-700 text-center leading-tight", children: tab.name })
              ]
            },
            tab.id
          );
        }) })
      ] }),
      activeSegment === "siswa" && /* @__PURE__ */ jsxs("div", { className: "space-y-6 sm:space-y-8 animate-fade-in", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/40 overflow-x-auto scrollbar-hide shrink-0 w-full md:w-auto", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSiswaTab("aktif"),
                className: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${siswaTab === "aktif" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]" : "text-slate-600 hover:bg-white hover:text-slate-900"}`,
                children: [
                  /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Siswa Aktif" }),
                  /* @__PURE__ */ jsx("div", { className: `px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "aktif" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`, children: systemState.activeStudents.filter((s) => !["Lulus", "Di Jepang"].includes(s.status) && isStudentRoleOnly(s)).length })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSiswaTab("baru"),
                className: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${siswaTab === "baru" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]" : "text-slate-600 hover:bg-white hover:text-slate-900"}`,
                children: [
                  /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Siswa Baru" }),
                  /* @__PURE__ */ jsx("div", { className: `px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "baru" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`, children: (systemState.registeredStudents || []).filter((s) => s.status !== "Disetujui" && isStudentRoleOnly(s)).length })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSiswaTab("alumni"),
                className: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${siswaTab === "alumni" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]" : "text-slate-600 hover:bg-white hover:text-slate-900"}`,
                children: [
                  /* @__PURE__ */ jsx(Award, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { children: "Alumni" }),
                  /* @__PURE__ */ jsx("div", { className: `px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${siswaTab === "alumni" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`, children: systemState.activeStudents.filter((s) => ["Lulus", "Di Jepang"].includes(s.status) && isStudentRoleOnly(s)).length })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSiswaTab("rekap"),
                className: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all duration-300 cursor-pointer shrink-0 ${siswaTab === "rekap" ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 translate-y-[-1px]" : "text-slate-600 hover:bg-white hover:text-slate-900"}`,
                children: [
                  /* @__PURE__ */ jsx(History, { className: "h-4 w-4" }),
                  /* @__PURE__ */ jsx("span", { children: "History Rekap" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: checkSyncStatus,
                className: "flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-200/60 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all duration-300 shadow-xs shrink-0",
                title: "Sinkronkan data siswa dengan akun pengguna",
                children: [
                  /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4 text-amber-600 animate-pulse" }),
                  /* @__PURE__ */ jsx("span", { children: "Sinkronkan Akun" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-50/80 px-3 py-1.5 rounded-xl border border-slate-200/50 w-full sm:w-auto", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-slate-500 shrink-0", children: [
                /* @__PURE__ */ jsx(Filter, { className: "h-3.5 w-3.5" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase tracking-wider hidden sm:inline", children: "Filter:" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-grow", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: filterMonth,
                    onChange: (e) => setFilterMonth(e.target.value),
                    className: "bg-white border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "All", children: "Semua Bulan" }),
                      Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsx("option", { value: String(i + 1), children: new Date(0, i).toLocaleString("id-ID", {
                        month: "long"
                      }) }, i))
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: filterYear,
                    onChange: (e) => setFilterYear(e.target.value),
                    className: "bg-white border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "All", children: "Semua Tahun" }),
                      ["2021", "2022", "2023", "2024", "2025", "2026", "2027"].map(
                        (y) => /* @__PURE__ */ jsx("option", { value: y, children: y }, y)
                      )
                    ]
                  }
                ),
                siswaTab === "aktif" && /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: filterClass,
                    onChange: (e) => setFilterClass(e.target.value),
                    className: "bg-white border border-slate-200/60 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-700 outline-none cursor-pointer hover:border-indigo-300 transition-colors shadow-2xs w-full sm:w-auto max-w-[130px]",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "All", children: "Semua Kelas" }),
                      /* @__PURE__ */ jsx("option", { value: "Belum Diplot", children: "Belum Diplot" }),
                      systemState.customization?.lmsClasses?.map((c) => /* @__PURE__ */ jsx("option", { value: c.name, children: c.name }, c.id))
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-white flex flex-col xl:flex-row xl:items-center justify-between gap-6 sm:gap-8 shadow-2xl relative overflow-hidden border border-white/5", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 space-y-4 sm:space-y-6 w-full", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h4", { className: "font-display font-black text-white text-base sm:text-lg flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2", children: [
                /* @__PURE__ */ jsx(Calculator, { className: "h-5 w-5 sm:h-6 sm:w-6 text-blue-400" }),
                /* @__PURE__ */ jsx("span", { children: "Statistik Kapasitas & Pertumbuhan" })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-[10px] sm:text-[11px] font-medium leading-relaxed max-w-lg", children: "Pemantauan real-time ketersediaan kursi kelas dan rasio konversi alumni LPK Source Course Indonesia." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4", children: [
              Array.from(
                new Set(
                  systemState.activeStudents.filter((s) => {
                    const validClasses = systemState.customization?.lmsClasses || [];
                    return s.status !== "Di Jepang" && s.class && validClasses.some((c) => c.name === s.class);
                  }).map((s) => s.class)
                )
              ).sort().map((className, idx) => {
                const count = systemState.activeStudents.filter(
                  (o) => o.class === className && o.status !== "Di Jepang"
                ).length;
                if (count === 0) return null;
                const colors = [
                  "text-blue-400",
                  "text-sky-400",
                  "text-indigo-400",
                  "text-purple-400",
                  "text-pink-400",
                  "text-rose-400",
                  "text-orange-400"
                ];
                const colorClass = colors[idx % colors.length];
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "bg-white/5 backdrop-blur-md border border-white/10 p-3 sm:px-4 sm:py-3 rounded-2xl flex flex-col gap-0.5 sm:min-w-[130px] shadow-lg",
                    children: [
                      /* @__PURE__ */ jsxs(
                        "span",
                        {
                          className: `${colorClass} font-black uppercase tracking-[0.1em] text-[8px] sm:text-[9px]`,
                          children: [
                            "Kelas ",
                            className
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-xl sm:text-2xl font-black text-white", children: count }),
                        /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-500 font-bold", children: "Sis" })
                      ] })
                    ]
                  },
                  className
                );
              }),
              systemState.activeStudents.filter(
                (o) => o.status === "Di Jepang"
              ).length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-400/10 border border-emerald-400/20 p-3 sm:px-4 sm:py-3 rounded-2xl flex flex-col gap-0.5 sm:min-w-[130px] shadow-lg", children: [
                /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-black uppercase tracking-[0.1em] text-[8px] sm:text-[9px]", children: "Alumni (Jepang)" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl sm:text-2xl font-black text-emerald-400", children: systemState.activeStudents.filter(
                    (o) => o.status === "Di Jepang"
                  ).length }),
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] text-emerald-600 font-bold", children: "Sis" })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white/5 backdrop-blur-xl border border-white/10 p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] text-xs space-y-3 w-full xl:max-w-sm shrink-0 shadow-2xl relative z-10", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-emerald-400", children: [
              /* @__PURE__ */ jsx(Award, { className: "h-5 w-5" }),
              /* @__PURE__ */ jsx("span", { className: "font-black uppercase tracking-widest text-[10px]", children: "Insight Sektor Sukses" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-300 leading-relaxed font-medium", children: [
              "Trend data menunjukkan peningkatan serapan alumni pada sektor ",
              /* @__PURE__ */ jsx("strong", { children: "Caregiver" }),
              " dan ",
              /* @__PURE__ */ jsx("strong", { children: "Manufaktur" }),
              " di wilayah Kanto & Kansai."
            ] }),
            /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-white/5 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-emerald-400 w-3/4 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs", children: siswaTab === "baru" ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight animate-fade-in", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-slate-500 font-bold", children: [
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight", children: "ID & Tanggal" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight", children: "Calon Siswa" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight", children: "Rincian Program & HP" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight", children: "Kualifikasi Target / Level" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight text-center", children: "Pembayaran / Bukti" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight text-center", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black tracking-tight text-center", children: "Verifikasi" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: (systemState.registeredStudents || []).filter((s) => s.status !== "Disetujui" && filterByMonthYear(s.date) && isStudentRoleOnly(s)).sort(sortStudentsByDateDesc).map((student) => /* @__PURE__ */ jsxs(
              "tr",
              {
                className: "hover:bg-slate-50/80 transition-colors",
                children: [
                  /* @__PURE__ */ jsxs("td", { className: "md:p-4 p-1.5 py-2 font-mono text-slate-600", children: [
                    /* @__PURE__ */ jsx("div", { children: student.id }),
                    /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-400", children: student.timestamp ? new Date(student.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : student.date })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "md:p-4 p-1.5 py-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900", children: student.name }) }),
                    /* @__PURE__ */ jsx("div", { className: "text-slate-500 font-mono text-[9px] mt-0.5", children: student.email })
                  ] }),
                  /* @__PURE__ */ jsxs("td", { className: "md:p-4 p-1.5 py-2", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-800", children: student.program }),
                    /* @__PURE__ */ jsxs("div", { className: "text-[9px] text-blue-600 font-mono", children: [
                      "WA: ",
                      student.phone
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 max-w-[190px]", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-sans font-bold text-slate-800 text-[10px] leading-tight", children: student.japaneseLevel }),
                    student.japaneseLevel.includes("KKNI Level 4") || student.japaneseLevel.includes("KKNI 4") || student.japaneseLevel.includes("N4") || student.japaneseLevel.includes("N3") ? /* @__PURE__ */ jsx("span", { className: "inline-flex w-fit items-center bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Instruktur Utama (KKNI 4)" }) : student.japaneseLevel.includes("KKNI Level 3") || student.japaneseLevel.includes("KKNI 3") || student.japaneseLevel.includes("N5") || student.japaneseLevel.toLowerCase().includes("asrama") || student.japaneseLevel.toLowerCase().includes("junior") ? /* @__PURE__ */ jsx("span", { className: "inline-flex w-fit items-center bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Junior / Asrama (KKNI 3)" }) : student.japaneseLevel.includes(
                      "Native Speaker"
                    ) ? /* @__PURE__ */ jsx("span", { className: "inline-flex w-fit items-center bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Native Speaker Sensei" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex w-fit items-center bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Pembinaan Karakter Awal" })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1.5 text-center", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-slate-800 font-bold text-[11px] leading-none", children: student.paymentAmount ? `Rp ${student.paymentAmount.toLocaleString("id-ID")}` : "Rp 0" }),
                    /* @__PURE__ */ jsx("span", { className: "text-[8.5px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded max-w-[120px] truncate leading-none", title: student.paymentMethod || "Transfer", children: student.paymentMethod || "Transfer Manual" }),
                    /* @__PURE__ */ jsx("div", { className: "mt-0.5", children: /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `font-semibold px-2 py-0.5 rounded text-[8px] uppercase tracking-wide border leading-none ${student.paymentStatus === "Lunas" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : student.paymentStatus === "Ditolak" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-800 border-amber-200 animate-pulse-once"}`,
                        children: student.paymentStatus || "Pending"
                      }
                    ) })
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 text-center", children: /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `font-semibold px-1.5 py-0.5 rounded-full text-[9px] uppercase ${student.status === "Disetujui" ? "bg-emerald-50 text-emerald-700 animate-pulse-once" : student.status === "Berkas Valid" ? "bg-blue-50 text-blue-700" : student.status === "Ditolak" ? "bg-rose-50 text-rose-700" : "bg-amber-100 text-amber-800 animate-pulse"}`,
                      children: student.status
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2", children: student.status === "Pending" ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1.5", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-amber-600 font-bold italic", children: "Pengecekan Berkas" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setVerifyingDocsStudent(student),
                          className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 tracking-wider text-[9px] uppercase transition cursor-pointer",
                          id: `btn-approve-berkas-tabbaru-${student.id}`,
                          children: "Verifikasi Berkas"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        ConfirmButton,
                        {
                          confirmTitle: "Tolak Pendaftar",
                          confirmMessage: `Tolak dan hapus data ${student.name}?`,
                          onConfirmClick: () => handleReject(student),
                          className: "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 font-bold px-2 py-1 rounded-lg text-[9px] uppercase transition cursor-pointer",
                          id: `btn-reject-tabbaru-${student.id}`,
                          children: "Tolak"
                        }
                      )
                    ] })
                  ] }) : student.status === "Berkas Valid" ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center gap-1.5", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-emerald-600 font-bold italic", children: "Cek Pembayaran" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setVerifyingDocsStudent(student),
                        className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded-lg flex items-center gap-0.5 tracking-wider text-[9px] uppercase transition cursor-pointer",
                        id: `btn-approve-tabbaru-${student.id}`,
                        children: "Lanjutkan Cek Pembayaran"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center gap-1.5 text-slate-400 italic text-[10px]", children: [
                    /* @__PURE__ */ jsx("span", { children: "Selesai" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => startAdminEditReg(student.id),
                          className: "inline-flex items-center justify-center p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer",
                          title: "Lihat / Edit Data",
                          children: /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        ConfirmButton,
                        {
                          confirmTitle: "Hapus Data",
                          confirmMessage: `Hapus data pendaftaran ${student.name} permanen?`,
                          onConfirmClick: () => onUpdateState("registeredStudents", "delete", { id: student.id }),
                          className: "inline-flex items-center justify-center p-1 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded transition-colors cursor-pointer",
                          title: "Hapus Data",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                        }
                      )
                    ] })
                  ] }) })
                ]
              },
              `${student.id}-${student.name}`
            )) })
          ] }) : siswaTab === "rekap" ? /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight animate-fade-in", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-slate-500 font-bold", children: [
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black", children: "NO INDUK & NAMA SISWA" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black", children: "KELAS & BATCH" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center", children: "PRESENSI (%)" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center", children: "SKOR AKHIR" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center", children: "PROGRES" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: (systemState.activeStudents || []).filter((s) => isStudentRoleOnly(s)).map((s) => {
              const attRecords = (systemState.attendance || []).filter((a) => a.studentId === s.id);
              const attPercent = attRecords.length > 0 ? attRecords.filter((a) => a.status === "Hadir").length / attRecords.length * 100 : 0;
              const scoresArr = Object.values(s.scores || {});
              const lastScore = scoresArr.length > 0 ? scoresArr[scoresArr.length - 1] : s.japaneseScore || 0;
              return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
                /* @__PURE__ */ jsxs("td", { className: "md:p-4 p-1.5 py-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-mono font-bold text-slate-400 text-[9px]", children: s.id }),
                  /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900", children: s.name })
                ] }),
                /* @__PURE__ */ jsxs("td", { className: "md:p-4 p-1.5 py-2", children: [
                  /* @__PURE__ */ jsx("div", { className: `font-bold ${isAlumniClass(s.class) ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150 w-max" : "text-blue-700"}`, children: s.class || "Belum Diplot" }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500", children: s.batch })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: `font-black text-xs ${attPercent >= 80 ? "text-emerald-600" : attPercent >= 50 ? "text-amber-600" : "text-rose-600"}`, children: [
                    attPercent.toFixed(1),
                    "%"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "w-16 h-1 bg-slate-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `h-full ${attPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"}`, style: { width: `${attPercent}%` } }) })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg", children: lastScore }) }),
                /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-slate-500", children: [
                    s.currentChapter || 1,
                    " / 50"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "w-16 h-1 bg-slate-100 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-indigo-500", style: { width: `${(s.currentChapter || 1) / 50 * 100}%` } }) })
                ] }) })
              ] }, s.id);
            }) })
          ] }) : /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight animate-fade-in", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-slate-500 font-bold", children: [
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black", children: "NO INDUK SISWA" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black", children: "IDENTITAS SISWA" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center", children: "NAMA KELAS & SENSEI PENGAMPU" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black", children: "STATUS & TAHUN LULUS" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-4 p-1.5 py-2.5 uppercase text-slate-600 font-black text-center", children: "AKSI" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: systemState.activeStudents?.filter((s) => filterByMonthYear(s.date) && isStudentRoleOnly(s))?.filter((s) => {
              const isAlumni = ["Lulus", "Di Jepang"].includes(s.status);
              if (siswaTab === "alumni") return isAlumni;
              if (isAlumni) return false;
              if (siswaTab === "aktif" && filterClass !== "All") {
                if (filterClass === "Belum Diplot") {
                  return !s.class;
                }
                return s.class === filterClass;
              }
              return true;
            })?.map((s) => /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 font-mono font-bold text-slate-600", children: s.id }),
              /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: s.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    className: "h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200",
                    alt: "Avatar"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-900", children: s.name }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 font-mono mt-0.5", children: s.batch }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1.5 mt-1.5 w-[260px]", children: [
                    /* @__PURE__ */ jsxs("label", { className: "w-full justify-center px-1.5 py-1.5 bg-blue-50/80 border border-blue-100 text-blue-700 hover:bg-blue-100 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95", children: [
                      /* @__PURE__ */ jsx(Camera, { className: "h-3 w-3 shrink-0" }),
                      " ",
                      /* @__PURE__ */ jsx("span", { className: "truncate", children: "Ganti Foto" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "file",
                          accept: "image/*",
                          className: "hidden",
                          onChange: async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const url = await uploadFileToFirebase(file, "profile_pictures");
                              await onUpdateState(
                                "activeStudents",
                                "update_status",
                                {
                                  id: s.id,
                                  profilePicture: url
                                }
                              );
                            } catch (err) {
                              console.error(err);
                              alert("Gagal mengunggah foto profil");
                            }
                          }
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => startAdminEditReg(s.id),
                        className: "w-full justify-center px-1.5 py-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95",
                        children: [
                          /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3 shrink-0" }),
                          " ",
                          /* @__PURE__ */ jsx("span", { className: "truncate", children: "Biodata" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        onClick: () => setViewingCvStudentId(s.id),
                        className: "w-full justify-center px-1.5 py-1.5 bg-violet-50/80 border border-violet-100 text-violet-700 hover:bg-violet-100 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95",
                        children: [
                          /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3 shrink-0" }),
                          " ",
                          /* @__PURE__ */ jsx("span", { className: "truncate", children: "CV Jepang" })
                        ]
                      }
                    )
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 text-center align-middle", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 items-center justify-center", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: s.class || "",
                    onChange: async (e) => {
                      await onUpdateState(
                        "activeStudents",
                        "update_status",
                        {
                          id: s.id,
                          class: e.target.value
                        }
                      );
                    },
                    className: `px-1.5 py-1 rounded font-bold text-[10px] outline-none border border-transparent cursor-pointer text-center font-sans tracking-wide w-full max-w-[170px] ${isAlumniClass(s.class) ? "bg-emerald-50 text-emerald-700 hover:border-emerald-300" : "bg-blue-50 text-blue-700 hover:border-blue-300"}`,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "Belum ada kelas" }),
                      s.class && !(systemState.customization?.lmsClasses || []).some((c) => c.name === s.class) && /* @__PURE__ */ jsxs("option", { value: s.class || "", children: [
                        s.class,
                        " (Nonaktif/Hapus)"
                      ] }),
                      /* @__PURE__ */ jsx("optgroup", { label: "Kelas E-Benkyou", children: systemState?.customization?.lmsClasses && systemState.customization.lmsClasses.length > 0 ? systemState.customization.lmsClasses.map((cls) => /* @__PURE__ */ jsx("option", { value: cls.name, children: cls.name }, cls.id)) : /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Belum ada data kelas" }) })
                    ]
                  }
                ),
                (() => {
                  const senseiUser = systemState.users?.find(
                    (u) => u.role === "Pengajar" && (u.assignedClass || "").toLowerCase() === (s.class || "").toLowerCase()
                  );
                  const displaySensei = senseiUser?.name || s.sensei || "Belum ada sensei";
                  return /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50/50 text-emerald-700 px-2 py-1 rounded font-bold text-[10px] text-center w-full max-w-[170px] border border-emerald-100", children: [
                    "\u{1F468}\u200D\u{1F3EB} ",
                    displaySensei
                  ] });
                })()
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-3 min-w-[220px]", children: /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: s.status,
                    onChange: async (e) => {
                      const val = e.target.value;
                      const isToAlumni = ["Lulus", "Di Jepang"].includes(val);
                      await onUpdateState(
                        "activeStudents",
                        "update_status",
                        {
                          id: s.id,
                          status: val,
                          prefecture: val === "Di Jepang" ? s.prefecture || "Tokyo" : "",
                          class: s.class,
                          sensei: s.sensei
                        }
                      );
                    },
                    className: `text-[10px] font-black border rounded px-2 py-1 w-full outline-none cursor-pointer tracking-wider ${s.status === "Di Jepang" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : s.status === "Lulus" ? "bg-indigo-50 text-indigo-800 border-indigo-300 animate-pulse-once" : s.status === "On Proges Job" ? "bg-cyan-50 text-cyan-800 border-cyan-300" : s.status === "On Progres JFT/JLPT/SSW" ? "bg-teal-50 text-teal-800 border-teal-300" : s.status === "Diklat SO" ? "bg-purple-50 text-purple-800 border-purple-300" : "bg-blue-50 text-blue-800 border-blue-300"}`,
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "Belajar", children: "\u{1F1EE}\u{1F1E9} 1. BELAJAR" }),
                      /* @__PURE__ */ jsx("option", { value: "On Proges Job", children: "\u{1F4BC} 2. ON PROGES JOB" }),
                      /* @__PURE__ */ jsx("option", { value: "On Progres JFT/JLPT/SSW", children: "\u{1F4CB} 3. ON PROGRES JFT/JLPT/SSW" }),
                      /* @__PURE__ */ jsx("option", { value: "Diklat SO", children: "\u{1F4D8} 4. DIKLAT SO" }),
                      /* @__PURE__ */ jsx("option", { value: "Lulus", children: "\u{1F393} 5. LULUS" }),
                      /* @__PURE__ */ jsx("option", { value: "Di Jepang", children: "\u{1F1EF}\u{1F1F5} 6. DI JEPANG" })
                    ]
                  }
                ),
                s.status === "Di Jepang" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono text-slate-500 shrink-0 font-bold", children: "Prefektur Kerja:" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: s.prefecture || "Tokyo",
                      onChange: async (e) => {
                        await onUpdateState(
                          "activeStudents",
                          "update_status",
                          {
                            id: s.id,
                            status: "Di Jepang",
                            prefecture: e.target.value
                          }
                        );
                      },
                      className: "text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full outline-none cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "Tokyo", children: "Tokyo (Ibu Kota)" }),
                        JAPAN_PREFECTURES.filter(
                          (p) => p !== "Tokyo"
                        ).map((pref) => /* @__PURE__ */ jsx("option", { value: pref, children: pref }, pref))
                      ]
                    }
                  )
                ] }),
                ["Lulus", "Di Jepang"].includes(s.status) && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono text-indigo-600 shrink-0 font-black", children: "Tahun Lulus:" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "YYYY",
                      value: s.graduationYear || "",
                      onChange: async (e) => {
                        await onUpdateState(
                          "activeStudents",
                          "update_status",
                          {
                            id: s.id,
                            graduationYear: e.target.value
                          }
                        );
                      },
                      className: "text-[10px] font-black text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full outline-none focus:border-indigo-400"
                    }
                  )
                ] })
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "md:p-4 p-1.5 py-2 text-center align-middle", children: /* @__PURE__ */ jsx(
                ConfirmButton,
                {
                  confirmTitle: "Hapus Data Siswa",
                  confirmMessage: `Hapus data siswa ${s.name} permanen?`,
                  onConfirmClick: () => onUpdateState("activeStudents", "delete", { id: s.id }),
                  className: "inline-flex items-center justify-center p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200 shadow-xs",
                  title: "Hapus Data",
                  children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                }
              ) })
            ] }, s.id)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "block md:hidden md:col-span-1 space-y-3", children: siswaTab === "baru" ? /* @__PURE__ */ jsx("div", { className: "space-y-4 animate-fade-in", children: [...systemState.registeredStudents || []]?.filter((s) => s.status !== "Disetujui" && filterByMonthYear(s.date) && isStudentRoleOnly(s))?.sort(sortStudentsByDateDesc)?.map((student) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 text-left",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded", children: student.id }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-mono", children: student.timestamp ? new Date(student.timestamp).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : student.date })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("div", { className: "font-bold text-sm text-slate-900", children: student.name }) }),
                  /* @__PURE__ */ jsx("div", { className: "text-slate-500 text-[10px] font-mono", children: student.email })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-[11px] bg-slate-50/80 p-2.5 rounded-xl border border-slate-100", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase tracking-wider text-slate-400 font-bold", children: "Program LPK" }),
                    /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-800 leading-tight block mt-0.5", children: student.program })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase tracking-wider text-slate-400 font-bold", children: "Nomor WhatsApp" }),
                    /* @__PURE__ */ jsxs("span", { className: "font-mono text-blue-600 font-bold block mt-0.5", children: [
                      "WA: ",
                      student.phone
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100", children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase tracking-wider text-slate-400 font-bold", children: "Kualifikasi Target / Level" }),
                  /* @__PURE__ */ jsx("div", { className: "font-semibold text-slate-800 text-[11px] leading-snug", children: student.japaneseLevel }),
                  /* @__PURE__ */ jsx("div", { className: "pt-1", children: student.japaneseLevel.includes("KKNI Level 4") || student.japaneseLevel.includes("KKNI 4") || student.japaneseLevel.includes("N4") || student.japaneseLevel.includes("N3") ? /* @__PURE__ */ jsx("span", { className: "inline-flex items-center bg-blue-50 text-blue-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Instruktur Utama (KKNI 4)" }) : student.japaneseLevel.includes("KKNI Level 3") || student.japaneseLevel.includes("KKNI 3") || student.japaneseLevel.includes("N5") || student.japaneseLevel.toLowerCase().includes("asrama") || student.japaneseLevel.toLowerCase().includes("junior") ? /* @__PURE__ */ jsx("span", { className: "inline-flex items-center bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Junior / Asrama (KKNI 3)" }) : student.japaneseLevel.includes("Native Speaker") ? /* @__PURE__ */ jsx("span", { className: "inline-flex items-center bg-rose-50 text-rose-700 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Native Speaker Sensei" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex items-center bg-slate-100 text-slate-600 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded", children: "Pembinaan Karakter Awal" }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[8px] uppercase tracking-wider text-slate-400 font-bold", children: "Pembayaran" }),
                    /* @__PURE__ */ jsx("span", { className: "font-mono text-slate-800 font-bold text-[11px]", children: student.paymentAmount ? `Rp ${student.paymentAmount.toLocaleString("id-ID")}` : "Rp 0" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-[10px] text-slate-600", children: [
                    /* @__PURE__ */ jsx("span", { children: "Metode:" }),
                    /* @__PURE__ */ jsx("span", { className: "font-semibold", children: student.paymentMethod || "Transfer Manual" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsx("span", { children: "Status Bayar:" }),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `font-semibold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wide border leading-none ${student.paymentStatus === "Lunas" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : student.paymentStatus === "Ditolak" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-800 border-amber-200"}`,
                        children: student.paymentStatus || "Pending"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2 border-t border-slate-100", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-1", children: "Status" }),
                    /* @__PURE__ */ jsx(
                      "span",
                      {
                        className: `font-bold px-2 py-0.5 rounded-full text-[9px] uppercase ${student.status === "Disetujui" ? "bg-emerald-50 text-emerald-700" : student.status === "Berkas Valid" ? "bg-blue-50 text-blue-700" : student.status === "Ditolak" ? "bg-rose-50 text-rose-700" : "bg-amber-100 text-amber-800 animate-pulse"}`,
                        children: student.status
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1.5", children: student.status === "Pending" ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1.5 w-full", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-amber-600 font-bold italic w-full text-right", children: "Pengecekan Berkas" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 w-full justify-end", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => setVerifyingDocsStudent(student),
                          className: "bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 tracking-tight text-[10px] uppercase transition cursor-pointer shadow-xs active:scale-95",
                          id: `btn-approve-berkas-mob-tabbaru-${student.id}`,
                          children: "Verifikasi Berkas"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        ConfirmButton,
                        {
                          confirmTitle: "Tolak Pendaftar",
                          confirmMessage: `Tolak dan hapus data ${student.name}?`,
                          onConfirmClick: () => handleReject(student),
                          className: "bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase transition cursor-pointer active:scale-95",
                          id: `btn-reject-mob-tabbaru-${student.id}`,
                          children: "Tolak"
                        }
                      )
                    ] })
                  ] }) : student.status === "Berkas Valid" ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-1.5 w-full", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-emerald-600 font-bold italic w-full text-right", children: "Cek Pembayaran" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setVerifyingDocsStudent(student),
                        className: "bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 tracking-tight text-[10px] uppercase transition cursor-pointer shadow-xs active:scale-95",
                        id: `btn-approve-mob-tabbaru-${student.id}`,
                        children: "Lanjutkan Cek Pembayaran"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 italic", children: "Selesai" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => startAdminEditReg(student.id),
                          className: "inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer",
                          title: "Lihat / Edit Data",
                          children: /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        ConfirmButton,
                        {
                          confirmTitle: "Hapus Data",
                          confirmMessage: `Hapus data pendaftaran ${student.name} permanen?`,
                          onConfirmClick: () => onUpdateState("registeredStudents", "delete", { id: student.id }),
                          className: "inline-flex items-center justify-center p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 rounded-xl transition-colors cursor-pointer",
                          title: "Hapus Data",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                        }
                      )
                    ] })
                  ] }) })
                ] })
              ]
            },
            `${student.id}-${student.name}`
          )) }) : siswaTab === "rekap" ? /* @__PURE__ */ jsx("div", { className: "space-y-4 animate-fade-in", children: systemState.activeStudents?.filter((s) => isStudentRoleOnly(s))?.map((s) => {
            const attRecords = (systemState.attendance || []).filter((a) => a.studentId === s.id);
            const attPercent = attRecords.length > 0 ? attRecords.filter((a) => a.status === "Hadir").length / attRecords.length * 100 : 0;
            const scoresArr = Object.values(s.scores || {});
            const lastScore = scoresArr.length > 0 ? scoresArr[scoresArr.length - 1] : s.japaneseScore || 0;
            return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4 text-left", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                /* @__PURE__ */ jsxs("div", { className: "max-w-[70%]", children: [
                  /* @__PURE__ */ jsx("div", { className: "text-[9px] font-mono font-bold text-slate-400 mb-0.5", children: s.id }),
                  /* @__PURE__ */ jsx("div", { className: "font-black text-slate-900 text-sm leading-tight break-words", children: s.name })
                ] }),
                /* @__PURE__ */ jsx("span", { className: `px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-sm border ${isAlumniClass(s.class) ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"}`, children: s.class || "Belum Diplot" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 pt-3 border-t border-slate-100", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-wider", children: "Statistik Presensi" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                    /* @__PURE__ */ jsxs("span", { className: `font-black text-xs shrink-0 ${attPercent >= 80 ? "text-emerald-600" : attPercent >= 50 ? "text-amber-600" : "text-rose-600"}`, children: [
                      attPercent.toFixed(0),
                      "%"
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner", children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `h-full transition-all duration-500 ${attPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"}`,
                        style: { width: `${attPercent}%` }
                      }
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-wider", children: "Skor Kuis Terakhir" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-black text-sm text-slate-800", children: lastScore }),
                    /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 font-bold", children: "Poin" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-3 border-t border-slate-100", children: [
                /* @__PURE__ */ jsx("span", { className: "block text-[8px] font-black text-slate-400 uppercase mb-1.5 tracking-wider", children: "Pencapaian Modul" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black text-slate-600 shrink-0", children: [
                    s.currentChapter || 1,
                    " / 50"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner", children: /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: "h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-700",
                      style: { width: `${(s.currentChapter || 1) / 50 * 100}%` }
                    }
                  ) })
                ] })
              ] })
            ] }, s.id);
          }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-3 animate-fade-in", children: systemState.activeStudents?.filter((s) => filterByMonthYear(s.date) && isStudentRoleOnly(s))?.filter((s) => {
            const isAlumni = ["Lulus", "Di Jepang"].includes(s.status);
            if (siswaTab === "alumni") return isAlumni;
            if (isAlumni) return false;
            if (siswaTab === "aktif" && filterClass !== "All") {
              if (filterClass === "Belum Diplot") {
                return !s.class;
              }
              return s.class === filterClass;
            }
            return true;
          })?.map((s) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-3.5 text-left",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded", children: s.id }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 font-bold", children: s.batch })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: s.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                      className: "h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200",
                      alt: "Avatar"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-0.5 w-full overflow-hidden", children: [
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-xs text-slate-900 truncate", children: s.name }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5 w-full", children: [
                      /* @__PURE__ */ jsxs("label", { className: "w-full justify-center px-1.5 py-1.5 bg-blue-50/80 border border-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95", children: [
                        /* @__PURE__ */ jsx(Camera, { className: "h-3 w-3 shrink-0" }),
                        " ",
                        /* @__PURE__ */ jsx("span", { className: "truncate", children: "Ganti Foto" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "file",
                            accept: "image/*",
                            className: "hidden",
                            onChange: async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const url = await uploadFileToFirebase(file, "profile_pictures");
                                await onUpdateState(
                                  "activeStudents",
                                  "update_status",
                                  {
                                    id: s.id,
                                    profilePicture: url
                                  }
                                );
                              } catch (err) {
                                console.error(err);
                                alert("Gagal mengunggah foto profil");
                              }
                            }
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => startAdminEditReg(s.id),
                          className: "w-full justify-center px-1.5 py-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95",
                          children: [
                            /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3 shrink-0" }),
                            " ",
                            /* @__PURE__ */ jsx("span", { className: "truncate", children: "Biodata" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => setViewingCvStudentId(s.id),
                          className: "w-full justify-center px-1.5 py-1.5 bg-violet-50/80 border border-violet-100 text-violet-700 hover:bg-violet-100 hover:text-violet-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95",
                          children: [
                            /* @__PURE__ */ jsx(FileText, { className: "h-3 w-3 shrink-0" }),
                            " ",
                            /* @__PURE__ */ jsx("span", { className: "truncate", children: "CV Jepang" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        ConfirmButton,
                        {
                          confirmTitle: "Hapus Data Siswa",
                          confirmMessage: `Hapus data siswa ${s.name} permanen?`,
                          onConfirmClick: () => onUpdateState("activeStudents", "delete", { id: s.id }),
                          className: "w-full justify-center px-1.5 py-1.5 bg-rose-50/80 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95",
                          title: "Hapus Data",
                          children: [
                            /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3 shrink-0" }),
                            " ",
                            /* @__PURE__ */ jsx("span", { className: "truncate", children: "Hapus" })
                          ]
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-[10.5px]", children: [
                  /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase font-bold text-slate-400", children: "Kelas" }),
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          value: s.class || "",
                          onChange: async (e) => {
                            await onUpdateState(
                              "activeStudents",
                              "update_status",
                              {
                                id: s.id,
                                class: e.target.value
                              }
                            );
                          },
                          className: `mt-0.5 px-1.5 py-1 rounded font-bold text-[9.5px] outline-none border border-transparent cursor-pointer w-full ${isAlumniClass(s.class) ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`,
                          children: [
                            /* @__PURE__ */ jsx("option", { value: "", children: "Belum ada kelas" }),
                            s.class && !(systemState.customization?.lmsClasses || []).some((c) => c.name === s.class) && /* @__PURE__ */ jsxs("option", { value: s.class || "", children: [
                              s.class,
                              " (Nonaktif/Hapus)"
                            ] }),
                            /* @__PURE__ */ jsx("optgroup", { label: "Kelas E-Benkyou", children: systemState?.customization?.lmsClasses && systemState.customization.lmsClasses.length > 0 ? systemState.customization.lmsClasses.map((cls) => /* @__PURE__ */ jsx("option", { value: cls.name, children: cls.name }, cls.id)) : /* @__PURE__ */ jsx("option", { value: "", disabled: true, children: "Belum ada data kelas" }) })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase font-bold text-slate-400", children: "Sensei" }),
                      (() => {
                        const senseiUser = systemState.users?.find(
                          (u) => u.role === "Pengajar" && (u.assignedClass || "").toLowerCase() === (s.class || "").toLowerCase()
                        );
                        const displaySensei = senseiUser?.name || s.sensei || "Belum ada sensei";
                        return /* @__PURE__ */ jsxs("div", { className: "mt-0.5 bg-emerald-50/50 text-emerald-700 px-1.5 py-1 rounded font-bold text-[9.5px] border border-emerald-100 w-full truncate", children: [
                          "\u{1F468}\u200D\u{1F3EB} ",
                          displaySensei
                        ] });
                      })()
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase font-bold text-slate-400", children: "Status & Lokasi" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: s.status,
                        onChange: async (e) => {
                          const val = e.target.value;
                          const isToAlumni = ["Lulus", "Di Jepang"].includes(val);
                          await onUpdateState(
                            "activeStudents",
                            "update_status",
                            {
                              id: s.id,
                              status: val,
                              prefecture: val === "Di Jepang" ? s.prefecture || "Tokyo" : "",
                              class: s.class,
                              sensei: s.sensei
                            }
                          );
                        },
                        className: `mt-0.5 text-[9.5px] font-black border rounded px-1.5 py-1 w-full outline-none cursor-pointer tracking-wider ${s.status === "Di Jepang" ? "bg-emerald-50 text-emerald-800 border-emerald-300" : s.status === "Lulus" ? "bg-indigo-50 text-indigo-800 border-indigo-300 shadow-sm" : s.status === "On Proges Job" ? "bg-cyan-50 text-cyan-800 border-cyan-300" : s.status === "On Progres JFT/JLPT/SSW" ? "bg-teal-50 text-teal-800 border-teal-300" : s.status === "Diklat SO" ? "bg-purple-50 text-purple-800 border-purple-300" : "bg-blue-50 text-blue-800 border-blue-300"}`,
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Belajar", children: "\u{1F1EE}\u{1F1E9} 1. BELAJAR" }),
                          /* @__PURE__ */ jsx("option", { value: "On Proges Job", children: "\u{1F4BC} 2. ON PROGES JOB" }),
                          /* @__PURE__ */ jsx("option", { value: "On Progres JFT/JLPT/SSW", children: "\u{1F4CB} 3. ON PROGRES JFT/JLPT/SSW" }),
                          /* @__PURE__ */ jsx("option", { value: "Diklat SO", children: "\u{1F4D8} 4. DIKLAT SO" }),
                          /* @__PURE__ */ jsx("option", { value: "Lulus", children: "\u{1F393} 5. LULUS" }),
                          /* @__PURE__ */ jsx("option", { value: "Di Jepang", children: "\u{1F1EF}\u{1F1F5} 6. DI JEPANG" })
                        ]
                      }
                    )
                  ] })
                ] }),
                s.status === "Di Jepang" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-150", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[9px] font-mono text-slate-500 shrink-0 font-bold", children: "Prefektur:" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: s.prefecture || "Tokyo",
                      onChange: async (e) => {
                        await onUpdateState(
                          "activeStudents",
                          "update_status",
                          {
                            id: s.id,
                            status: "Di Jepang",
                            prefecture: e.target.value
                          }
                        );
                      },
                      className: "text-[9.5px] font-semibold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5 w-full outline-none cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "Tokyo", children: "Tokyo (Ibu Kota)" }),
                        JAPAN_PREFECTURES.filter((p) => p !== "Tokyo").map(
                          (pref) => /* @__PURE__ */ jsx("option", { value: pref, children: pref }, pref)
                        )
                      ]
                    }
                  )
                ] })
              ]
            },
            s.id
          )) }) })
        ] })
      ] }),
      activeSegment === "dataCV" && /* @__PURE__ */ jsxs("div", { className: "space-y-6 font-sans", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-display font-black text-xl text-slate-800", children: "Data CV & Biodata Jepang" }),
          viewingCvStudentId && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setViewingCvStudentId(null),
              className: "px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition flex items-center gap-2 text-xs",
              children: [
                /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" }),
                " Kembali ke Daftar"
              ]
            }
          )
        ] }),
        !viewingCvStudentId ? /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-slate-200 p-4 sm:p-6", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: [
          [...systemState.activeStudents || []].sort(sortStudentsByDateDesc).map((student) => /* @__PURE__ */ jsxs("div", { className: "p-4 border border-slate-100 bg-slate-50 rounded-2xl flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("img", { src: student.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png", alt: student.name, className: "w-10 h-10 rounded-full object-cover border border-slate-200" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-900", children: student.name }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                  "NIM: ",
                  student.id
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => setViewingCvStudentId(student.id),
                className: "px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(BookOpen, { className: "h-3 w-3" }),
                  " Buka CV"
                ]
              }
            )
          ] }, `${student.id}-${student.name}`)),
          systemState.activeStudents.length === 0 && /* @__PURE__ */ jsx("div", { className: "col-span-full py-8 text-center text-slate-500 text-sm", children: "Belum ada siswa aktif." })
        ] }) }) : /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-slate-200 p-2 sm:p-4 print:p-0 print:border-0 print:bg-transparent shadow-sm", children: (() => {
          const student = systemState.activeStudents.find((s) => s.id === viewingCvStudentId);
          if (!student) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center", children: "Siswa tidak ditemukan" });
          return /* @__PURE__ */ jsx(
            StudentCvView,
            {
              student,
              onUpdateStudent: async (updatedStudent) => {
                const newStudents = systemState.activeStudents.map(
                  (s) => s.id === updatedStudent.id ? updatedStudent : s
                );
                await onUpdateState("activeStudents", "update", updatedStudent);
                return true;
              }
            }
          );
        })() })
      ] }),
      activeSegment === "pembayaran" && currentUser?.role !== "Admin Biasa" && /* @__PURE__ */ jsx(
        PembayaranSiswaView,
        {
          currentUser,
          systemState,
          onUpdateState,
          onOpenLogin: () => {
          }
        }
      ),
      activeSegment === "inventaris" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        (() => {
          const items = systemState.inventory || [];
          const totalUnique = items.length;
          const totalUnits = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const baikCount = items.filter((i) => i.condition === "Baik").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const perluServisCount = items.filter((i) => i.condition === "Perlu Servis").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const rusakCount = items.filter((i) => i.condition === "Rusak").reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
          const uniqueLocations = new Set(items.map((i) => i.location).filter(Boolean)).size;
          return /* @__PURE__ */ jsxs("div", { className: "bg-[#00204a]/5 p-5 rounded-2xl border border-slate-200 shadow-inner space-y-4 animate-fade-in text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "p-1.5 bg-[#00204a] text-white rounded-lg", children: /* @__PURE__ */ jsx(Package, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-extrabold text-sm text-[#00204a]", children: "Rekap Keseluruhan Inventaris" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-medium", children: "Informasi konsolidasi aset, logistik, dan kondisi fisik LPK secara real-time" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-3.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Aset Unik" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-slate-800", children: totalUnique }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500", children: "Kategori" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider", children: "Total Kuantitas" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-blue-600", children: totalUnits }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500", children: "Unit (Pcs)" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
                  " Baik"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-emerald-600", children: baikCount }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-emerald-500", children: "Pcs" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-amber-500" }),
                  " Perlu Servis"
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-amber-600", children: perluServisCount }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-amber-500", children: "Pcs" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between text-left col-span-2 md:col-span-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1", children: "\u{1F4CD} Distribusi Area" }),
                /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-baseline gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-indigo-600", children: uniqueLocations }),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-slate-500", children: "Lokasi" })
                ] })
              ] })
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsx("div", { className: "w-full flex justify-start", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setIsCreateInventoryModalOpen(true),
            className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " Registrasi Inventaris Baru"
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-500", children: "Verifikasi Logistik & Inventaris LPK" }) }),
          /* @__PURE__ */ jsx("div", { className: "hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-slate-500 font-bold", children: [
              /* @__PURE__ */ jsx("th", { className: "md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black", children: "KODE ASET" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black", children: "NAMA BARANG" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center", children: "JUMLAH" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black", children: "LOKASI" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center", children: "KONDISI" }),
              /* @__PURE__ */ jsx("th", { className: "md:p-3 p-1.5 py-2 uppercase text-slate-600 font-black text-center", children: "AKSI" })
            ] }) }),
            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: systemState.inventory.map((item) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50", children: [
              /* @__PURE__ */ jsx("td", { className: "md:p-3 p-1.5 py-2 font-mono text-[9px] text-slate-400", children: item.code }),
              /* @__PURE__ */ jsx("td", { className: "md:p-3 p-1.5 py-2 font-bold text-slate-900", children: item.itemName }),
              /* @__PURE__ */ jsxs("td", { className: "md:p-3 p-1.5 py-2 font-semibold text-slate-700 text-center", children: [
                item.amount,
                " Pcs"
              ] }),
              /* @__PURE__ */ jsx("td", { className: "md:p-3 p-1.5 py-2 text-slate-600", children: item.location }),
              /* @__PURE__ */ jsx("td", { className: "md:p-3 p-1.5 py-2 text-center", children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: `font-semibold px-1.5 py-0.5 rounded text-[9px] uppercase ${item.condition === "Baik" ? "bg-emerald-50 text-emerald-800" : item.condition === "Perlu Servis" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`,
                  children: item.condition
                }
              ) }),
              /* @__PURE__ */ jsxs("td", { className: "md:p-3 p-1.5 py-2 text-center flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      const newName = prompt("Ubah Nama Barang", item.itemName);
                      if (newName === null) return;
                      const newAmt = prompt("Ubah Jumlah (Pcs)", String(item.amount));
                      if (newAmt === null) return;
                      const newCond = prompt("Ubah Kondisi", item.condition);
                      if (newCond === null) return;
                      const newLoc = prompt("Ubah Lokasi", item.location);
                      if (newLoc === null) return;
                      onUpdateState("inventory", "edit", { id: item.id, itemName: newName, amount: Number(newAmt), condition: newCond, location: newLoc });
                    },
                    className: "text-slate-400 hover:text-indigo-600 p-1 rounded-sm hover:bg-indigo-50 transition cursor-pointer",
                    title: "Edit Inventaris",
                    children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                      /* @__PURE__ */ jsx("path", { d: "M12 20h9" }),
                      /* @__PURE__ */ jsx("path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" })
                    ] })
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      const newName = prompt("Ubah Nama Barang", item.itemName);
                      if (newName === null) return;
                      const newAmt = prompt("Ubah Jumlah (Pcs)", String(item.amount));
                      if (newAmt === null) return;
                      const newCond = prompt("Ubah Kondisi", item.condition);
                      if (newCond === null) return;
                      const newLoc = prompt("Ubah Lokasi", item.location);
                      if (newLoc === null) return;
                      onUpdateState("inventory", "edit", { id: item.id, itemName: newName, amount: Number(newAmt), condition: newCond, location: newLoc });
                    },
                    className: "text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-[9px] font-bold uppercase",
                    children: [
                      /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                        /* @__PURE__ */ jsx("path", { d: "M12 20h9" }),
                        /* @__PURE__ */ jsx("path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" })
                      ] }),
                      " Edit"
                    ]
                  }
                ),
                /* @__PURE__ */ jsx(
                  ConfirmButton,
                  {
                    confirmTitle: "Hapus Inventaris",
                    confirmMessage: `Hapus barang ${item.itemName} dari daftar aset?`,
                    onConfirmClick: () => onUpdateState("inventory", "delete", { id: item.id }),
                    className: "text-slate-400 hover:text-rose-600 p-1 rounded-sm hover:bg-rose-50 transition cursor-pointer",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                  }
                )
              ] })
            ] }, item.id)) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "block md:hidden space-y-2.5", children: systemState.inventory.map((item) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 text-left animate-fade-in relative",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-[9px] text-[#00204a] bg-blue-50 font-bold px-1.5 py-0.5 rounded", children: item.code }),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: `font-semibold px-2 py-0.5 rounded text-[8.5px] uppercase ${item.condition === "Baik" ? "bg-emerald-50 text-emerald-800" : item.condition === "Perlu Servis" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`,
                      children: item.condition
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: "font-bold text-xs text-slate-900", children: item.itemName }),
                    /* @__PURE__ */ jsxs("div", { className: "text-slate-400 text-[10px] mt-0.5 font-medium", children: [
                      "\u{1F4CD} ",
                      item.location
                    ] })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs("span", { className: "text-[11px] font-bold text-slate-800 bg-blue-50/50 border px-2 py-0.5 rounded-lg", children: [
                    item.amount,
                    " Pcs"
                  ] }) })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-end border-t pt-1.5 mt-1", children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        const newName = prompt("Ubah Nama Barang", item.itemName);
                        if (newName === null) return;
                        const newAmt = prompt("Ubah Jumlah (Pcs)", String(item.amount));
                        if (newAmt === null) return;
                        const newCond = prompt("Ubah Kondisi", item.condition);
                        if (newCond === null) return;
                        const newLoc = prompt("Ubah Lokasi", item.location);
                        if (newLoc === null) return;
                        onUpdateState("inventory", "edit", { id: item.id, itemName: newName, amount: Number(newAmt), condition: newCond, location: newLoc });
                      },
                      className: "text-slate-400 hover:text-indigo-600 p-1 rounded-md hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-[9px] font-bold uppercase mr-2",
                      children: [
                        /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                          /* @__PURE__ */ jsx("path", { d: "M12 20h9" }),
                          /* @__PURE__ */ jsx("path", { d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" })
                        ] }),
                        " Edit"
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    ConfirmButton,
                    {
                      confirmTitle: "Hapus Inventaris",
                      confirmMessage: `Hapus barang ${item.itemName} dari daftar aset?`,
                      onConfirmClick: () => handleInventoryDelete(item),
                      className: "text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer flex items-center gap-1 text-[9px] font-bold uppercase",
                      children: [
                        /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }),
                        " Hapus"
                      ]
                    }
                  )
                ] })
              ]
            },
            item.id
          )) })
        ] })
      ] }),
      activeSegment === "pajak" && currentUser?.role !== "Admin Biasa" && (() => {
        const taxes = systemState.taxes || [];
        const recommendedMonths = (() => {
          const monthlyData = {};
          const months = [
            "Januari",
            "Februari",
            "Maret",
            "April",
            "Mei",
            "Juni",
            "Juli",
            "Agustus",
            "September",
            "Oktober",
            "November",
            "Desember"
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
            if (!p.date || p.status !== "Lunas" && p.status !== "Cicilan") return;
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
          const savedTaxMonths = taxes.map((t) => t.monthString);
          return Object.keys(monthlyData).filter((m) => !savedTaxMonths.includes(m)).map((key) => ({
            monthString: key,
            totalRevenue: monthlyData[key].in,
            totalExpenses: monthlyData[key].out
          }));
        })();
        const handleQuickImport = (rec) => {
          setTaxMonth(rec.monthString);
          setTaxRev(String(rec.totalRevenue));
          setTaxExp(String(rec.totalExpenses));
          setTaxRate("0.11");
          setTaxStatus("Draft");
          setTaxNotes(`Diimpor otomatis dari buku kas bulan ${rec.monthString}`);
          setIsCreateTaxModalOpen(true);
        };
        const downloadFile = (base64Data, filename) => {
          const link = document.createElement("a");
          link.href = base64Data;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        const handleTriggerEdit = (tax) => {
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
        return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-black uppercase tracking-wider text-slate-700", children: "Pelaporan Pajak LPK & Keuangan Corporate" }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs text-slate-500 mt-1", children: "Kelola pelaporan SPT Badan, Pajak PPN 11%, upload laporan keuangan bulanan, serta unggah dokumen bukti lapor resmi." })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  resetTaxForm();
                  setIsCreateTaxModalOpen(true);
                },
                className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                  " Tambah Rekor Pajak Baru"
                ]
              }
            )
          ] }),
          recommendedMonths.length > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4.5 space-y-2.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-amber-800 text-xs font-bold", children: [
              /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4 shrink-0 text-amber-600" }),
              /* @__PURE__ */ jsx("span", { children: "\u{1F4A1} REKOMENDASI IMPOR BULAN (Terdeteksi dari Kas & Invoice)" })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs text-amber-700 leading-relaxed", children: "Kami mendeteksi aktivitas keuangan pada bulan-bulan berikut di buku kas, namun rekor pajaknya belum dibuat. Klik untuk otomatis mengisi form:" }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: recommendedMonths.map((rec) => /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => handleQuickImport(rec),
                className: "bg-white hover:bg-amber-100 border border-amber-200 text-amber-900 font-semibold px-2.5 py-1 rounded-lg text-[10.5px] transition cursor-pointer flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }),
                  " ",
                  rec.monthString,
                  " (Omset: Rp ",
                  rec.totalRevenue.toLocaleString("id-ID"),
                  ")"
                ]
              },
              rec.monthString
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold uppercase tracking-wider text-slate-500 font-mono", children: [
              "Buku Kas & Pajak Terdaftar (",
              taxes.length,
              " Rekor)"
            ] }) }),
            taxes.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 border-2 border-dashed rounded-3xl p-10 text-center space-y-2", children: [
              /* @__PURE__ */ jsx(Receipt, { className: "h-10 w-10 text-slate-300 mx-auto" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-600", children: "Belum Ada Rekor Pelaporan Pajak" }),
              /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-400 max-w-sm mx-auto", children: 'Gunakan tombol "Tambah Rekor Pajak Baru" atau klik rekomendasi di atas untuk mencatat SPT dan PPN badan usaha.' })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto max-w-full shadow-xs", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse table-auto md:text-xs text-[10px] leading-tight", children: [
                /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100 text-slate-500 font-bold", children: [
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black", children: "MASA PAJAK" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black", children: "OMSET / OPERASIONAL" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black", children: "TARIF PAJAK & TOTAL" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black", children: "DOKUMEN KEUANGAN" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black", children: "BUKTI SPT" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black", children: "STATUS" }),
                  /* @__PURE__ */ jsx("th", { className: "p-3 uppercase text-slate-600 font-black text-right", children: "AKSI" })
                ] }) }),
                /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: taxes.map((item) => {
                  const ratePercent = (item.taxRate || 0.11) * 100;
                  return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50", children: [
                    /* @__PURE__ */ jsxs("td", { className: "p-3 font-bold text-slate-900", children: [
                      /* @__PURE__ */ jsx("div", { children: item.monthString }),
                      item.notes && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-slate-400 font-normal mt-0.5 italic max-w-[150px] truncate", title: item.notes, children: [
                        '"',
                        item.notes,
                        '"'
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("td", { className: "p-3 space-y-0.5", children: [
                      /* @__PURE__ */ jsxs("div", { className: "font-mono text-emerald-700 font-medium", children: [
                        "In: Rp ",
                        item.totalRevenue.toLocaleString("id-ID")
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "font-mono text-rose-700 text-[11px]", children: [
                        "Out: Rp ",
                        item.totalExpenses.toLocaleString("id-ID")
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("td", { className: "p-3 font-mono", children: [
                      /* @__PURE__ */ jsxs("div", { className: "text-slate-500 text-[10px]", children: [
                        ratePercent,
                        "% Tarif PPN"
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "font-bold text-blue-800", children: [
                        "Rp ",
                        item.taxAmount.toLocaleString("id-ID")
                      ] })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "p-3", children: item.financialReportFile ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => triggerPreview(item.financialReportFile, `Lap_Keu_${item.monthString.replace(/\s+/g, "_")}`),
                          className: "bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1",
                          children: [
                            /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3" }),
                            " Preview"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => downloadFile(item.financialReportFile, `Lap_Keu_${item.monthString.replace(/\s+/g, "_")}.pdf`),
                          className: "text-slate-400 hover:text-slate-600 p-1",
                          title: "Download",
                          children: /* @__PURE__ */ jsx(Upload, { className: "h-3 w-3 rotate-180" })
                        }
                      )
                    ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic text-[10px]", children: "Belum unggah" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3", children: item.sptFile ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => triggerPreview(item.sptFile, `Bukti_SPT_${item.monthString.replace(/\s+/g, "_")}`),
                          className: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1",
                          children: [
                            /* @__PURE__ */ jsx(Eye, { className: "h-3 w-3" }),
                            " Preview"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => downloadFile(item.sptFile, `Bukti_SPT_${item.monthString.replace(/\s+/g, "_")}.pdf`),
                          className: "text-slate-400 hover:text-slate-600 p-1",
                          title: "Download",
                          children: /* @__PURE__ */ jsx(Upload, { className: "h-3 w-3 rotate-180" })
                        }
                      )
                    ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic text-[10px]", children: "Belum unggah" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3", children: item.status === "Final/Dilaporkan" ? /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 text-emerald-700 font-bold text-[9px] uppercase bg-emerald-50 px-2 py-0.5 rounded-full", children: "\u2713 Telah Lapor" }) : /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 text-amber-700 font-bold text-[9px] uppercase bg-amber-50 px-2 py-0.5 rounded-full", children: "Draft/Belum" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
                      item.status !== "Final/Dilaporkan" && /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleTaxReportAction(item),
                          className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] uppercase transition cursor-pointer",
                          children: "Lapor (e-SPT)"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => handleTriggerEdit(item),
                          className: "text-blue-600 hover:text-blue-800 p-1 bg-blue-50/50 rounded-md hover:bg-blue-50 transition cursor-pointer",
                          title: "Edit Rekor",
                          children: /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        ConfirmButton,
                        {
                          confirmTitle: "Hapus Rekor Pajak",
                          confirmMessage: `Hapus rekor pelaporan keuangan pajak untuk ${item.monthString}?`,
                          onConfirmClick: () => handleTaxDelete(item),
                          className: "text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                        }
                      )
                    ] }) })
                  ] }, item.id);
                }) })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "block md:hidden space-y-2.5", children: taxes.map((item) => {
                const ratePercent = (item.taxRate || 0.11) * 100;
                return /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "bg-white rounded-xl border border-slate-200 p-3 shadow-xs space-y-2.5 text-left animate-fade-in relative",
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-1.5", children: [
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("span", { className: "font-bold text-xs text-slate-900", children: item.monthString }),
                          item.notes && /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-slate-400 italic mt-0.5", children: [
                            '"',
                            item.notes,
                            '"'
                          ] })
                        ] }),
                        item.status === "Final/Dilaporkan" ? /* @__PURE__ */ jsx("span", { className: "inline-flex items-center gap-1 text-emerald-700 font-bold text-[8.5px] uppercase bg-emerald-50 px-1.5 py-0.5 rounded-full", children: "\u2713 Telah Lapor" }) : /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleTaxReportAction(item),
                            className: "bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[8.5px] uppercase tracking-wide transition cursor-pointer",
                            children: "Lapor"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 text-[10.5px] pt-1 leading-snug", children: [
                        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-1.5 rounded-lg border border-slate-100", children: [
                          /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase tracking-wider text-slate-400 font-bold", children: "Omset Masuk" }),
                          /* @__PURE__ */ jsxs("strong", { className: "text-emerald-700 text-[10px] font-mono font-semibold", children: [
                            "Rp ",
                            item.totalRevenue.toLocaleString("id-ID")
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-1.5 rounded-lg border border-slate-100", children: [
                          /* @__PURE__ */ jsx("span", { className: "block text-[8px] uppercase tracking-wider text-slate-400 font-bold", children: "Operasional" }),
                          /* @__PURE__ */ jsxs("strong", { className: "text-rose-700 text-[10px] font-mono font-semibold", children: [
                            "Rp ",
                            item.totalExpenses.toLocaleString("id-ID")
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center bg-blue-50/50 p-2 rounded-lg text-xs font-mono border", children: [
                        /* @__PURE__ */ jsxs("span", { className: "text-slate-500 text-[8.5px] font-bold", children: [
                          "ESTIMASI TARIF ",
                          ratePercent,
                          "%"
                        ] }),
                        /* @__PURE__ */ jsxs("strong", { className: "text-[#00204a]", children: [
                          "Rp ",
                          item.taxAmount.toLocaleString("id-ID")
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 pt-1 border-t", children: [
                        item.financialReportFile ? /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => triggerPreview(item.financialReportFile, `Lap_Keu_${item.monthString}`),
                            className: "bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition",
                            children: "\u{1F4C4} Lap. Keuangan"
                          }
                        ) : /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 italic", children: "No Lap. Keu" }),
                        item.sptFile ? /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => triggerPreview(item.sptFile, `SPT_${item.monthString}`),
                            className: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition",
                            children: "\u{1F4E5} Bukti SPT"
                          }
                        ) : /* @__PURE__ */ jsx("span", { className: "text-[9px] text-slate-400 italic", children: "No Bukti SPT" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-1.5 border-t", children: [
                        /* @__PURE__ */ jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => handleTriggerEdit(item),
                            className: "text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50/50 rounded-md text-[10px] font-bold flex items-center gap-1",
                            children: [
                              /* @__PURE__ */ jsx(Edit, { className: "h-3 w-3" }),
                              " Edit"
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxs(
                          ConfirmButton,
                          {
                            confirmTitle: "Hapus Pajak",
                            confirmMessage: `Hapus rekor pajak ${item.monthString}?`,
                            onConfirmClick: () => handleTaxDelete(item),
                            className: "text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition flex items-center gap-1 text-[10px]",
                            children: [
                              /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }),
                              " Hapus"
                            ]
                          }
                        )
                      ] })
                    ]
                  },
                  item.id
                );
              }) })
            ] })
          ] })
        ] });
      })(),
      activeSegment === "joborders" && /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in text-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4.5 sm:p-6 md:p-8 rounded-3xl shadow-md space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Landmark, { className: "h-6 w-6 text-indigo-200" }),
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-black tracking-tight uppercase", children: "Manajemen Job Order & Rekomendasi Kerja Jepang" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-blue-100 max-w-2xl leading-relaxed", children: [
            "Hubungkan para alumni LPK Pati yang sudah dinyatakan",
            " ",
            /* @__PURE__ */ jsx("strong", { children: "Lulus" }),
            " dengan pihak agency pendamping (PT Mitra) di Tokyo, Osaka, Kyoto & Prefektur Jepang lainnya. Berikan rekomendasi kerja langsung secara real-time yang akan muncul pada Dashboard LMS Siswa."
          ] })
        ] }),
        /* @__PURE__ */ jsx(StudentActivitySummary, { systemState }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h4", { className: "text-sm font-black uppercase tracking-wider text-slate-700", children: "Daftar Job Order Aktif" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] sm:text-xs text-slate-500 mt-1", children: "Kelola kuota, status rekrutmen, dan rekomendasikan alumni berstatus 'Lulus'." })
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setIsCreateJobOrderModalOpen(true),
              className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-sm w-full sm:w-auto justify-center cursor-pointer",
              children: [
                /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                "Buat Job Order Baru"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-left bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs", children: !systemState.jobOrders || systemState.jobOrders.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-400 italic text-xs border border-dashed rounded-2xl bg-slate-50", children: "Belum ada data lowongan kerja Jepang / Job Order mitra yang dilaporkan." }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: systemState.jobOrders.map((job) => {
          const recommendableStudents = systemState.activeStudents.filter((st) => {
            const lockedInOtherJob = systemState.jobOrders.some(
              (otherJob) => otherJob.id !== job.id && (otherJob.recommendations?.includes(st.id) || otherJob.interestedStudents?.includes(st.id) || otherJob.approvedApplicants?.includes(st.id)) && otherJob.applicantDocuments?.[st.id]?.stage !== "Ditolak"
            );
            const alreadyInThisJob = job.recommendations?.includes(st.id) || job.interestedStudents?.includes(st.id) || job.approvedApplicants?.includes(st.id);
            return !lockedInOtherJob && !alreadyInThisJob;
          });
          const isExpanded = expandedJobIds.includes(job.id);
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: "p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-200 transition space-y-4 text-left",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-205 pb-2.5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-0.5 text-left", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "inline-flex items-center px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold bg-indigo-100 text-indigo-800", children: job.noReg }),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => toggleJobExpansion(job.id),
                          className: "bg-white border border-slate-200 text-slate-500 rounded p-0.5 shadow-sm active:scale-95 transition",
                          children: isExpanded ? /* @__PURE__ */ jsx(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              className: "h-3 w-3",
                              viewBox: "0 0 20 20",
                              fill: "currentColor",
                              children: /* @__PURE__ */ jsx(
                                "path",
                                {
                                  fillRule: "evenodd",
                                  d: "M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z",
                                  clipRule: "evenodd"
                                }
                              )
                            }
                          ) : /* @__PURE__ */ jsx(
                            "svg",
                            {
                              xmlns: "http://www.w3.org/2000/svg",
                              className: "h-3 w-3",
                              viewBox: "0 0 20 20",
                              fill: "currentColor",
                              children: /* @__PURE__ */ jsx(
                                "path",
                                {
                                  fillRule: "evenodd",
                                  d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                                  clipRule: "evenodd"
                                }
                              )
                            }
                          )
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx("h4", { className: "font-extrabold text-xs text-slate-900", children: job.occupation }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-600 font-bold", children: job.partnerName }),
                    /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 font-medium", children: [
                      "\u{1F4CD} ",
                      job.location
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-start sm:items-end gap-1.5 shrink-0", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: async () => {
                            await onUpdateState(
                              "jobOrders",
                              "toggle_status",
                              { id: job.id }
                            );
                          },
                          className: `px-2 py-1 text-[8.5px] font-black rounded-lg uppercase tracking-tight transition cursor-pointer ${job.status === "Aktif" ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800" : "bg-slate-200 hover:bg-slate-300 text-slate-700"}`,
                          children: [
                            "\u25CF",
                            " ",
                            job.status === "Aktif" ? "Aktif / Buka" : "Tutup / Terpenuhi"
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setEditingJobOrder(job);
                          },
                          className: "flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition cursor-pointer border border-amber-200 text-[10px] font-bold",
                          title: "Edit Job Order",
                          children: [
                            /* @__PURE__ */ jsx(Edit, { className: "h-3.5 w-3.5" }),
                            /* @__PURE__ */ jsx("span", { children: "Edit" })
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: async () => {
                            if (window.confirm(`Hapus lowongan ${job.occupation} di ${job.partnerName}?`)) {
                              await onUpdateState("jobOrders", "delete", { id: job.id });
                            }
                          },
                          className: "flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-100 text-[10px] font-bold",
                          title: "Hapus Job Order",
                          children: [
                            /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" }),
                            /* @__PURE__ */ jsx("span", { children: "Hapus" })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("span", { className: "font-semibold text-[10px] text-blue-700 font-mono", children: [
                      job.contractDuration,
                      " Kontrak"
                    ] })
                  ] })
                ] }),
                !isExpanded && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-400 font-medium italic", children: "Detail pekerjaan disembunyikan. Klik tombol dropdown di atas untuk melihat dan mengelola proses seleksi." }),
                isExpanded && /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-[10px] text-left", children: [
                    /* @__PURE__ */ jsxs("div", { className: "bg-white p-2 rounded-xl border border-slate-200", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-400 uppercase tracking-wide block", children: "Gaji Pokok" }),
                      /* @__PURE__ */ jsx("span", { className: "font-black text-slate-800", children: job.salary })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-white p-2 rounded-xl border border-slate-200", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-400 uppercase tracking-wide block", children: "Lembur" }),
                      /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-750", children: job.overtime || "TIDAK" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-white p-2 rounded-xl border border-slate-200", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-400 uppercase tracking-wide block", children: "Tunjangan" }),
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: "font-medium text-slate-600 truncate block",
                          title: job.allowance,
                          children: job.allowance || "Fasilitas lengkap"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2 text-[10px] text-left text-slate-700", children: [
                    /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-indigo-500 uppercase tracking-wide block", children: "Gender" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.gender || "LAKI-LAKI / PEREMPUAN" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-indigo-500 uppercase tracking-wide block", children: "Persyaratan Usia" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.ageRequirement || "18-30 tahun" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-indigo-500 uppercase tracking-wide block", children: "Dibutuhkan" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.recruitCount || "6 siswa" })
                    ] })
                  ] }),
                  job.jobDescription && /* @__PURE__ */ jsxs("div", { className: "bg-slate-100/60 p-2.5 rounded-xl border border-slate-200 text-[10px]", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5", children: "Deskripsi Pekerjaan" }),
                    /* @__PURE__ */ jsx("p", { className: "text-slate-600 whitespace-pre-wrap leading-relaxed", children: job.jobDescription })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 gap-2 text-[10px] text-left", children: [
                    /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-2 rounded-xl", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-500 uppercase tracking-wide block", children: "TB Minimal" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.tbRequirement || "-" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-2 rounded-xl", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-500 uppercase tracking-wide block", children: "BB Proporsional" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.bbRequirement || "-" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-2 rounded-xl", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-500 uppercase tracking-wide block", children: "Pelaksanaan" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.interviewExecution || "-" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 p-2 rounded-xl", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-500 uppercase tracking-wide block", children: "Tanggal/Bulan" }),
                      /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: job.interviewDate || "-" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-[#f0f4f8] p-2.5 rounded-xl border border-indigo-100 text-[10.5px]", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[8.5px] font-extrabold text-blue-800 uppercase tracking-wider block mb-1", children: "Kriteria Komparasi Kelayakan" }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-5 gap-1 text-center text-slate-700", children: [
                      /* @__PURE__ */ jsxs("div", { className: "p-1 bg-white rounded-md border border-slate-200/80", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[7.5px] font-bold text-slate-400 block uppercase", children: "B. JEPANG" }),
                        /* @__PURE__ */ jsx("span", { className: "font-black text-indigo-700 text-[9.5px]", children: job.minJapaneseScore || "BAB 15" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "p-1 bg-white rounded-md border border-slate-200/80", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[7.5px] font-bold text-slate-400 block uppercase", children: "ABSENSI" }),
                        /* @__PURE__ */ jsxs("span", { className: "font-black text-indigo-700 text-[9.5px]", children: [
                          job.minAttendanceScore || "80",
                          "%"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "p-1 bg-white rounded-md border border-slate-200/80", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[7.5px] font-bold text-slate-400 block uppercase", children: "NILAI 5S" }),
                        /* @__PURE__ */ jsx("span", { className: "font-black text-indigo-700 text-[9.5px]", children: job.minFiveSScore || "80" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "p-1 bg-white rounded-md border border-slate-200/80", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[7.5px] font-bold text-slate-400 block uppercase", children: "MTK SSW" }),
                        /* @__PURE__ */ jsx("span", { className: "font-black text-indigo-700 text-[9.5px]", children: job.minMathScore || "90" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "p-1 bg-white rounded-md border border-slate-200/80", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-[7.5px] font-bold text-slate-400 block uppercase", children: "ETIKA LPK" }),
                        /* @__PURE__ */ jsx("span", { className: "font-black text-indigo-700 text-[9.5px]", children: job.minEthicsScore || "80" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 text-left font-sans", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-1.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-[9.5px] font-black uppercase text-slate-500 tracking-wide", children: "\u{1F393} REKOMENDASI SISWA" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-bold text-indigo-600 font-mono", children: [
                        (job.recommendations || []).length,
                        " ",
                        "Direkomendasikan"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          value: recoSiswaId[job.id] || "",
                          onChange: (e) => setRecoSiswaId((prev) => ({
                            ...prev,
                            [job.id]: e.target.value
                          })),
                          className: "text-[10px] font-bold text-slate-750 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full outline-none",
                          children: [
                            /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Siswa (Semua Status) --" }),
                            recommendableStudents.length === 0 ? /* @__PURE__ */ jsx("option", { disabled: true, value: "", children: "Tidak ada siswa tersedia (Semua terkunci)" }) : recommendableStudents.map((st) => /* @__PURE__ */ jsxs("option", { value: st.id, children: [
                              st.name,
                              " (",
                              st.id,
                              ")"
                            ] }, st.id))
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: async () => {
                            const stId = recoSiswaId[job.id];
                            if (!stId) {
                              alert(
                                "Silakan pilih siswa terlebih dahulu!"
                              );
                              return;
                            }
                            await onUpdateState(
                              "jobOrders",
                              "recommend",
                              {
                                jobOrderId: job.id,
                                studentId: stId
                              }
                            );
                            setRecoSiswaId((prev) => ({
                              ...prev,
                              [job.id]: ""
                            }));
                          },
                          className: "bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-wide shrink-0 transition cursor-pointer",
                          children: "Rekomendasikan \u26A1"
                        }
                      )
                    ] }),
                    !job.recommendations || job.recommendations.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 italic", children: "Belum ada lulusan yang ditugaskan ke Job Order ini." }) : /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: job.recommendations.map((stId) => {
                      const stObj = systemState.activeStudents.find(
                        (s) => s.id === stId
                      );
                      if (!stObj) return null;
                      return /* @__PURE__ */ jsxs(
                        "div",
                        {
                          className: "inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-150 px-2 py-0.5 rounded-md font-sans text-[9px] font-bold",
                          children: [
                            /* @__PURE__ */ jsxs("span", { children: [
                              "\u{1F393} ",
                              stObj.name,
                              " (",
                              stObj.id,
                              ")"
                            ] }),
                            /* @__PURE__ */ jsx(
                              "button",
                              {
                                type: "button",
                                onClick: async () => {
                                  await onUpdateState(
                                    "jobOrders",
                                    "remove_recommendation",
                                    {
                                      jobOrderId: job.id,
                                      studentId: stId
                                    }
                                  );
                                },
                                className: "text-rose-600 font-extrabold text-[10px] hover:text-rose-800 px-0.5 cursor-pointer ml-1",
                                title: "Batalkan rekomendasi",
                                children: "\xD7"
                              }
                            )
                          ]
                        },
                        stId
                      );
                    }) })
                  ] }),
                  /* @__PURE__ */ jsx(JobScheduleConfigPanel, { job, onUpdateState }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-white p-3 mt-1.5 rounded-xl border border-slate-200 text-left space-y-2", children: [
                    /* @__PURE__ */ jsxs("h5", { className: "text-[10px] font-black text-indigo-800 uppercase tracking-wider flex items-center justify-between", children: [
                      /* @__PURE__ */ jsx("span", { children: "\u{1F4DD} Monitoring Proses & Jadwal Seleksi" }),
                      /* @__PURE__ */ jsxs("span", { className: "bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono text-[9px]", children: [
                        (job.interestedStudents || []).length,
                        " Siswa"
                      ] })
                    ] }),
                    job.interestedStudents && job.interestedStudents.length > 0 ? /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-72 overflow-y-auto pr-1", children: job.interestedStudents.map((stId) => {
                      const stData = systemState.activeStudents.find((s) => s.id === stId);
                      if (!stData) return null;
                      const docs = job.applicantDocuments?.[stId] || {};
                      return /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50/40 p-2.5 border border-indigo-150 rounded-lg text-[9.5px] space-y-2", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center font-bold", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx("img", { src: stData.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png", alt: stData.name, className: "w-6 h-6 rounded-full object-cover border border-slate-200" }),
                            /* @__PURE__ */ jsx("span", { className: "text-slate-800", children: stData.name })
                          ] }),
                          /* @__PURE__ */ jsxs("span", { className: "text-slate-450 font-mono text-[8px]", children: [
                            stData.id,
                            " \u2022 ",
                            stData.batch
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "bg-white p-2 rounded-md border border-indigo-100 space-y-2", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-slate-500 w-12 shrink-0", children: "TAHAPAN:" }),
                            /* @__PURE__ */ jsxs(
                              "select",
                              {
                                defaultValue: docs.stage || "Tertarik",
                                onChange: async (e) => {
                                  const newVal = e.target.value;
                                  await onUpdateState("jobOrders", "submit_applicant_documents", {
                                    jobOrderId: job.id,
                                    studentId: stId,
                                    documents: { ...docs, stage: newVal }
                                  });
                                  if (newVal === "Lolos Akhir") {
                                    await onUpdateState("activeStudents", "edit", {
                                      id: stId,
                                      status: "Di Jepang",
                                      prefecture: job.location,
                                      company: job.partnerName
                                    });
                                  }
                                },
                                className: "flex-1 text-[9px] p-1 border border-slate-200 rounded bg-slate-50 font-bold",
                                style: {
                                  color: docs.stage === "Lolos Akhir" ? "#059669" : docs.stage === "Interview" ? "#4f46e5" : docs.stage === "Seleksi Awal" ? "#b45309" : docs.stage === "Ditolak" ? "#e11d48" : "#475569"
                                },
                                children: [
                                  /* @__PURE__ */ jsx("option", { value: "Tertarik", children: "1. Tertarik (Berkas Diterima)" }),
                                  /* @__PURE__ */ jsx("option", { value: "Seleksi Awal", children: "2. Lolos ke Seleksi Awal" }),
                                  /* @__PURE__ */ jsx("option", { value: "Interview", children: "3. Lolos ke Interview User" }),
                                  /* @__PURE__ */ jsx("option", { value: "Lolos Akhir", children: "4. Lolos Akhir (Matched) \u{1F389}" }),
                                  /* @__PURE__ */ jsx("option", { value: "Ditolak", children: "\u274C Ditolak / Gagal" })
                                ]
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-slate-500 w-12 shrink-0", children: "JADWAL:" }),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "text",
                                placeholder: "Contoh: 15 Juli 2026 pukul 10:00 WIB",
                                defaultValue: docs.scheduleDate || "",
                                onBlur: async (e) => {
                                  await onUpdateState("jobOrders", "submit_applicant_documents", {
                                    jobOrderId: job.id,
                                    studentId: stId,
                                    documents: { ...docs, scheduleDate: e.target.value }
                                  });
                                },
                                className: "flex-1 text-[9px] p-1 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                            /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-slate-500 w-12 shrink-0", children: "CATATAN:" }),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "text",
                                placeholder: "Arahan / Catatan Proses...",
                                defaultValue: docs.notes || "",
                                onBlur: async (e) => {
                                  await onUpdateState("jobOrders", "submit_applicant_documents", {
                                    jobOrderId: job.id,
                                    studentId: stId,
                                    documents: { ...docs, notes: e.target.value }
                                  });
                                },
                                className: "flex-1 text-[9px] p-1 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                              }
                            )
                          ] })
                        ] })
                      ] }, stId);
                    }) }) : /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 italic", children: "Belum ada siswa yang mendaftar / tertarik pada job order ini." })
                  ] }),
                  (() => {
                    const rejectedStudents = [
                      ...job.interestedStudents || [],
                      ...job.approvedApplicants || []
                    ].filter((stId, index, self) => {
                      if (self.indexOf(stId) !== index)
                        return false;
                      return job.applicantDocuments?.[stId]?.stage === "Ditolak";
                    });
                    if (rejectedStudents.length === 0) return null;
                    return /* @__PURE__ */ jsxs("div", { className: "bg-rose-50/50 p-3 rounded-xl border border-rose-200 text-left space-y-2 mt-3", children: [
                      /* @__PURE__ */ jsxs("h5", { className: "text-[10px] font-black text-rose-800 uppercase tracking-wider flex justify-between items-center", children: [
                        /* @__PURE__ */ jsx("span", { children: "\u274C Riwayat Penolakan (Ditolak / Gagal)" }),
                        /* @__PURE__ */ jsx("span", { className: "bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-mono text-[9px]", children: rejectedStudents.length })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "space-y-1.5 max-h-40 overflow-y-auto", children: rejectedStudents.map((stId) => {
                        const stData = systemState.activeStudents.find(
                          (s) => s.id === stId
                        );
                        if (!stData) return null;
                        const notes = job.applicantDocuments?.[stId]?.notes || "Tidak ada catatan historis.";
                        return /* @__PURE__ */ jsxs(
                          "div",
                          {
                            className: "bg-white p-2 border border-rose-100 rounded-lg flex flex-col gap-1 text-[10px]",
                            children: [
                              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                                /* @__PURE__ */ jsx("p", { className: "font-extrabold text-slate-800", children: stData.name }),
                                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                                  /* @__PURE__ */ jsx("p", { className: "text-[8px] font-mono text-slate-400", children: stData.id }),
                                  /* @__PURE__ */ jsx(
                                    "button",
                                    {
                                      type: "button",
                                      onClick: async () => {
                                        if (confirm(
                                          `Kembalikan ${stData.name} ke tahap Tertarik?`
                                        )) {
                                          await onUpdateState(
                                            "jobOrders",
                                            "submit_applicant_documents",
                                            {
                                              jobOrderId: job.id,
                                              studentId: stId,
                                              documents: {
                                                ...job.applicantDocuments?.[stId],
                                                stage: "Tertarik"
                                              }
                                            }
                                          );
                                        }
                                      },
                                      className: "text-indigo-600 hover:text-indigo-800 text-[8px] font-bold uppercase underline",
                                      children: "Undo"
                                    }
                                  )
                                ] })
                              ] }),
                              /* @__PURE__ */ jsx("p", { className: "text-rose-700 italic text-[9px] bg-rose-50 p-1.5 rounded", children: notes })
                            ]
                          },
                          stId
                        );
                      }) })
                    ] });
                  })()
                ] })
              ]
            },
            job.id
          );
        }) }) })
      ] }),
      activeSegment === "gaji" && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-left", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-display font-extrabold text-slate-900 text-sm flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-base", children: "\u{1F4BC}" }),
              " Pengelolaan Buku Kas & Penggajian Terpadu"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 font-normal leading-normal", children: currentUser?.role === "Admin Biasa" ? "Kelola absensi harian dan rekapitulasi presensi pengajar/staf." : "Catat arus kas (in/out) LPK serta kelola penggajian staff/sensei secara transparan dan akurat." })
          ] }),
          currentUser?.role !== "Admin Biasa" && /* @__PURE__ */ jsxs("div", { className: "flex bg-slate-100 p-1 rounded-xl shadow-inner", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSalarySubTab("buku_kas"),
                className: `px-4 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 ${salarySubTab === "buku_kas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
                children: "Buku Kas (Ledger)"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSalarySubTab("penggajian"),
                className: `px-4 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 ${salarySubTab === "penggajian" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
                children: "Penggajian Staff"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSalarySubTab("hr"),
                className: `px-4 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 ${salarySubTab === "hr" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`,
                children: "HR & Personalia"
              }
            )
          ] })
        ] }),
        salarySubTab === "buku_kas" && currentUser?.role !== "Admin Biasa" && (() => {
          const ledger = systemState.cashLedger || [];
          let runningSaldo = 0;
          const ledgerWithSaldo = ledger.map((entry) => {
            runningSaldo += entry.inAmount - entry.outAmount;
            return { ...entry, saldo: runningSaldo };
          });
          return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in text-left", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 border border-slate-200 p-5 rounded-xl", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(CheckSquare, { className: "h-4 w-4" }),
                " Input Jurnal Kas / Penggajian"
              ] }),
              /* @__PURE__ */ jsxs(
                "form",
                {
                  onSubmit: (e) => {
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
                      outAmount: isExpense ? Number(pOutAmount) : 0
                    });
                    e.currentTarget.reset();
                  },
                  className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end",
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Tanggal" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          name: "date",
                          type: "date",
                          required: true,
                          className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none",
                          defaultValue: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Kode Transaksi" }),
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          name: "code",
                          required: true,
                          className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsx("option", { value: "P1", children: "P1 - GAJI KARYAWAN" }),
                            /* @__PURE__ */ jsx("option", { value: "P2", children: "P2 - BIAYA OPERASIONAL" }),
                            /* @__PURE__ */ jsx("option", { value: "P3", children: "P3 - BIAYA PERJALANAN DINAS" }),
                            /* @__PURE__ */ jsx("option", { value: "P4", children: "P4 - BIAYA KONSUMSI" }),
                            /* @__PURE__ */ jsx("option", { value: "P5", children: "P5 - BIAYA INVENTARIS" }),
                            /* @__PURE__ */ jsx("option", { value: "P6", children: "P6 - BIAYA PERAWATAN GUDANG" }),
                            /* @__PURE__ */ jsx("option", { value: "P7", children: "P7 - BIAYA PENYUSUTAN" }),
                            /* @__PURE__ */ jsx("option", { value: "P8", children: "P8 - BIAYA LAINNYA" }),
                            /* @__PURE__ */ jsx("option", { value: "P9A", children: "P9A - PEMBAYARAN ONJOB" }),
                            /* @__PURE__ */ jsx("option", { value: "P9B", children: "P9B - PEMBAYARAN SISWA BARU" }),
                            /* @__PURE__ */ jsx("option", { value: "DLL", children: "DLL - LAINNYA" })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1 lg:col-span-2", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Uraian / Keterangan" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          name: "description",
                          type: "text",
                          required: true,
                          placeholder: "Cth: Gaji Satria Herlambang / Listrik Asrama",
                          className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1 sm:col-span-1 lg:col-span-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-emerald-600 uppercase", children: "Pemasukan (IN)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          name: "inAmount",
                          type: "number",
                          defaultValue: "0",
                          min: "0",
                          placeholder: "Rp",
                          className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1 sm:col-span-1 lg:col-span-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-rose-600 uppercase", children: "Pengeluaran (OUT)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          name: "outAmount",
                          type: "number",
                          defaultValue: "0",
                          min: "0",
                          placeholder: "Rp",
                          className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "sm:col-span-2 lg:col-span-2", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "submit",
                        className: "w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-2 text-xs rounded-lg transition",
                        children: "Catat Buku Kas"
                      }
                    ) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-6", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs md:text-sm", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-[#a3e635]/20 border-b-2 border-[#166534] text-[#166534]", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-center w-12", children: "No" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase w-16 text-center", children: "Kode" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase", children: "Tanggal" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase", children: "Uraian Transaksi" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-right", children: "In (Rp)" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-right", children: "Out (Rp)" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-right", children: "Saldo (Rp)" }),
                /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-center", children: "Aksi" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-200", children: [
                ledgerWithSaldo.map((entry, index) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition even:bg-slate-50/50", children: [
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-center text-slate-500 font-mono", children: index + 1 }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("span", { className: "font-bold text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded", children: entry.code }) }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-slate-700 whitespace-nowrap", children: entry.date }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 font-semibold text-slate-900", children: entry.description }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono font-bold text-emerald-600", children: entry.inAmount > 0 ? entry.inAmount.toLocaleString("id-ID") : "-" }),
                  /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono font-bold text-rose-600", children: entry.outAmount > 0 ? entry.outAmount.toLocaleString("id-ID") : "-" }),
                  /* @__PURE__ */ jsx("td", { className: `p-2 text-right font-mono font-bold ${entry.saldo < 0 ? "text-rose-600" : "text-slate-900"}`, children: entry.saldo.toLocaleString("id-ID") }),
                  /* @__PURE__ */ jsxs("td", { className: "p-2 text-center flex items-center justify-center gap-1", children: [
                    /* @__PURE__ */ jsx("button", { onClick: () => {
                      const newIn = prompt("Ubah In (Rp)", String(entry.inAmount));
                      if (newIn === null) return;
                      const newOut = prompt("Ubah Out (Rp)", String(entry.outAmount));
                      if (newOut === null) return;
                      const newDesc = prompt("Ubah Uraian", entry.description);
                      if (newDesc === null) return;
                      onUpdateState("cashLedger", "edit", { ...entry, inAmount: Number(newIn), outAmount: Number(newOut), description: newDesc });
                    }, className: "px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition", children: "Edit" }),
                    /* @__PURE__ */ jsx("button", { onClick: () => {
                      if (window.confirm("Yakin hapus data ini?")) {
                        onUpdateState("cashLedger", "delete", { id: entry.id });
                      }
                    }, className: "px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition", children: "Hapus" })
                  ] })
                ] }, entry.id)),
                ledgerWithSaldo.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-8 text-center text-slate-400 italic text-xs", children: "Buku Kas masih kosong." }) })
              ] })
            ] }) })
          ] });
        })(),
        salarySubTab === "penggajian" && currentUser?.role !== "Admin Biasa" && /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-indigo-50 border border-indigo-200 p-5 rounded-xl", children: [
            /* @__PURE__ */ jsxs("h4", { className: "text-xs font-bold text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(Receipt, { className: "h-4 w-4" }),
              " Input Penggajian Staff"
            ] }),
            /* @__PURE__ */ jsxs(
              "form",
              {
                onSubmit: (e) => {
                  e.preventDefault();
                  const payload = {
                    staffName: salStaffName,
                    role: salRole,
                    amount: Number(salAmount),
                    monthString: salMonth,
                    status: salStatus,
                    paymentDate: salPaymentDate,
                    notes: salNotes
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
                },
                className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Nama Staff" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        required: true,
                        type: "text",
                        value: salStaffName,
                        onChange: (e) => setSalStaffName(e.target.value),
                        placeholder: "Nama Lengkap",
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Role" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        required: true,
                        value: salRole,
                        onChange: (e) => setSalRole(e.target.value),
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Pengajar", children: "Pengajar (Sensei)" }),
                          /* @__PURE__ */ jsx("option", { value: "Admin", children: "Admin Keuangan" }),
                          /* @__PURE__ */ jsx("option", { value: "Admin Biasa", children: "Admin Biasa" }),
                          /* @__PURE__ */ jsx("option", { value: "Umum", children: "Umum / Lainnya" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Bulan & Tahun" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        required: true,
                        type: "month",
                        value: salMonth,
                        onChange: (e) => setSalMonth(e.target.value),
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Nominal Gaji (Rp)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        required: true,
                        type: "number",
                        min: "0",
                        value: salAmount,
                        onChange: (e) => setSalAmount(e.target.value),
                        placeholder: "Misal: 4500000",
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Tanggal Bayar" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "date",
                        value: salPaymentDate,
                        onChange: (e) => setSalPaymentDate(e.target.value),
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Status Pembayaran" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        required: true,
                        value: salStatus,
                        onChange: (e) => setSalStatus(e.target.value),
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none font-bold",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Pending", children: "Pending (Belum Lunas)" }),
                          /* @__PURE__ */ jsx("option", { value: "Lunas", children: "Lunas (Telah Dibayarkan)" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 lg:col-span-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Catatan Tambahan" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: salNotes,
                        onChange: (e) => setSalNotes(e.target.value),
                        placeholder: "Contoh: Pembayaran Gaji Pokok + Transport",
                        className: "w-full text-xs p-2 bg-white border border-slate-300 rounded-lg outline-none"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-right lg:col-span-1", children: [
                    editingSalId && /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          setEditingSalId(null);
                          setSalStaffName("");
                          setSalRole("Pengajar");
                          setSalAmount("");
                          setSalMonth("");
                          setSalStatus("Pending");
                          setSalPaymentDate("");
                          setSalNotes("");
                        },
                        className: "bg-slate-300 hover:bg-slate-400 text-slate-700 font-bold p-2 text-xs rounded-lg transition mr-2",
                        children: "Batal"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "submit",
                        className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 px-4 text-xs rounded-lg transition",
                        children: editingSalId ? "Simpan Perubahan" : "Simpan Data Gaji"
                      }
                    )
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm mt-6", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs md:text-sm", children: [
            /* @__PURE__ */ jsx("thead", { className: "bg-indigo-50 border-b-2 border-indigo-200 text-indigo-900", children: /* @__PURE__ */ jsxs("tr", { children: [
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase w-12 text-center", children: "No" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase", children: "Nama / Jabatan" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-center", children: "Bulan" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-right", children: "Gaji (Rp)" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-center", children: "Status" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-center", children: "Tgl Bayar" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 font-bold uppercase text-center", children: "Aksi" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
              (systemState.salaries || []).map((sal, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition", children: [
                /* @__PURE__ */ jsx("td", { className: "p-2 text-center text-slate-500", children: idx + 1 }),
                /* @__PURE__ */ jsxs("td", { className: "p-2", children: [
                  /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800", children: sal.staffName }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500 uppercase", children: sal.role })
                ] }),
                /* @__PURE__ */ jsx("td", { className: "p-2 text-center font-bold text-slate-700", children: sal.monthString }),
                /* @__PURE__ */ jsx("td", { className: "p-2 text-right font-mono font-bold text-emerald-600", children: sal.amount.toLocaleString("id-ID") }),
                /* @__PURE__ */ jsx("td", { className: "p-2 text-center", children: /* @__PURE__ */ jsx("span", { className: `text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sal.status === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`, children: sal.status }) }),
                /* @__PURE__ */ jsx("td", { className: "p-2 text-center text-[10px] text-slate-500 font-mono", children: sal.paymentDate || "-" }),
                /* @__PURE__ */ jsxs("td", { className: "p-2 text-center flex items-center justify-center gap-1", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
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
                      },
                      className: "px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[9px] uppercase rounded transition",
                      children: "Edit"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        if (window.confirm("Yakin hapus data gaji ini?")) {
                          onUpdateState("salaries", "delete", { id: sal.id });
                        }
                      },
                      className: "px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[9px] uppercase rounded transition",
                      children: "Hapus"
                    }
                  )
                ] })
              ] }, sal.id)),
              (!systemState.salaries || systemState.salaries.length === 0) && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "p-8 text-center text-slate-400 italic text-xs", children: "Data penggajian masih kosong." }) })
            ] })
          ] }) })
        ] }),
        salarySubTab === "hr" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fade-in text-slate-800 text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-5 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("span", { children: "\u{1F4C5}" }),
                " Filter Rekapitulasi & Gaji Bulanan"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-medium", children: "Pilih bulan untuk melihat statistik presensi, ketepatan waktu, dan melakukan pembayaran gaji terintegrasi." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-600 uppercase", children: "Pilih Bulan:" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "month",
                  value: hrFilterMonth,
                  onChange: (e) => setHrFilterMonth(e.target.value),
                  className: "text-xs p-2 bg-white border border-slate-300 rounded-xl outline-hidden focus:border-indigo-500 font-bold cursor-pointer"
                }
              )
            ] })
          ] }),
          (() => {
            const indonesianMonths = [
              "Januari",
              "Februari",
              "Maret",
              "April",
              "Mei",
              "Juni",
              "Juli",
              "Agustus",
              "September",
              "Oktober",
              "November",
              "Desember"
            ];
            const [yr, mn] = hrFilterMonth.split("-");
            const monthIndex = parseInt(mn) - 1;
            const indMonthName = indonesianMonths[monthIndex] || "";
            const formattedMonthStr = `${indMonthName} ${yr}`;
            const totalStaff = (systemState.users || []).filter((u) => u.role === "Pengajar" || u.role === "Admin").length;
            const totalMonthLogs = (systemState.logs || []).filter(
              (l) => l.type === "PRESENSI_PENGAJAR" && l.timestamp.startsWith(hrFilterMonth)
            ).length;
            const totalPaidSalary = (systemState.salaries || []).filter((sal) => (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr) && sal.status === "Lunas").reduce((sum, sal) => sum + sal.amount, 0);
            const totalPendingSalary = (systemState.salaries || []).filter((sal) => (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr) && sal.status === "Pending").reduce((sum, sal) => sum + sal.amount, 0);
            let allOnTime = 0;
            let allTotal = 0;
            (systemState.logs || []).filter((l) => l.type === "PRESENSI_PENGAJAR" && l.timestamp.startsWith(hrFilterMonth)).forEach((log) => {
              if (log.description.includes("MASUK")) {
                allTotal++;
                const match = log.description.match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                let isLate = false;
                if (match) {
                  const hrVal = parseInt(match[1]);
                  const minVal = parseInt(match[2]);
                  if (hrVal > 8 || hrVal === 8 && minVal > 0) {
                    isLate = true;
                  }
                } else {
                  const d = new Date(log.timestamp);
                  const hrVal = d.getHours();
                  const minVal = d.getMinutes();
                  if (hrVal > 8 || hrVal === 8 && minVal > 0) {
                    isLate = true;
                  }
                }
                if (!isLate) {
                  allOnTime++;
                }
              }
            });
            const avgPunctuality = allTotal > 0 ? Math.round(allOnTime / allTotal * 100) : 100;
            return /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black uppercase text-slate-400", children: "Total Staff / Pengajar" }),
                    /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F465}" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                    /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-black text-slate-900", children: [
                      totalStaff,
                      " Orang"
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-500 mt-1 font-medium", children: "Aktif mengajar & mengelola LPK" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black uppercase text-slate-400", children: [
                      "Kehadiran Staff (",
                      indMonthName,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F4DD}" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                    /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-black text-slate-900", children: [
                      totalMonthLogs,
                      " Log"
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-500 mt-1 font-medium", children: "Total tap/scan presensi masuk & pulang" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black uppercase text-slate-400", children: [
                      "Ketepatan Waktu (",
                      indMonthName,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u23F1\uFE0F" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3 text-left", children: [
                    /* @__PURE__ */ jsxs("h3", { className: `text-2xl font-black ${avgPunctuality >= 85 ? "text-emerald-600" : avgPunctuality >= 70 ? "text-indigo-600" : "text-amber-600"}`, children: [
                      avgPunctuality,
                      "%"
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "w-full bg-slate-100 rounded-full h-1.5 mt-2", children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `h-1.5 rounded-full ${avgPunctuality >= 85 ? "bg-emerald-500" : avgPunctuality >= 70 ? "bg-indigo-500" : "bg-amber-500"}`,
                        style: { width: `${avgPunctuality}%` }
                      }
                    ) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-3xl p-5 shadow-xs hover:shadow-md transition", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-black uppercase text-slate-400", children: [
                      "Gaji Terbayar (",
                      indMonthName,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "text-xl", children: "\u{1F4B5}" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
                    /* @__PURE__ */ jsxs("h3", { className: "text-xl font-black text-emerald-600", children: [
                      "Rp ",
                      totalPaidSalary.toLocaleString("id-ID")
                    ] }),
                    totalPendingSalary > 0 && /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-rose-500 mt-1 font-bold", children: [
                      "\u26A0\uFE0F Rp ",
                      totalPendingSalary.toLocaleString("id-ID"),
                      " Belum Lunas"
                    ] }),
                    totalPendingSalary === 0 && /* @__PURE__ */ jsx("p", { className: "text-[9px] text-emerald-600 mt-1 font-medium", children: "\u2713 Seluruh input gaji bulan ini lunas" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-white border border-slate-200 rounded-3xl p-6 shadow-sm", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3 text-left", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("h4", { className: "font-extrabold text-sm text-slate-900 uppercase", children: "\u{1F4B5} SINKRONISASI ABSENSI & PEMBAYARAN GAJI STAFF" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-medium", children: "Rekapitulasi ketepatan waktu & pembayaran gaji otomatis disinkronkan ke Buku Kas (Buku Kas Ledger)." })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full self-start", children: [
                    "Bulan: ",
                    formattedMonthStr
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-xs", children: [
                  /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "p-3 w-12 text-center", children: "No" }),
                    /* @__PURE__ */ jsx("th", { className: "p-3", children: "Nama Staff / Role" }),
                    /* @__PURE__ */ jsxs("th", { className: "p-3 text-center", children: [
                      "Absen Masuk (",
                      indMonthName,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx("th", { className: "p-3 text-center", children: "Ketepatan Waktu" }),
                    /* @__PURE__ */ jsx("th", { className: "p-3", children: "Info Rekening" }),
                    /* @__PURE__ */ jsxs("th", { className: "p-3", children: [
                      "Status Gaji (",
                      indMonthName,
                      ")"
                    ] }),
                    /* @__PURE__ */ jsx("th", { className: "p-3 text-center", children: "Aksi Sinkronisasi" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: (systemState.users || []).filter((u) => u.role === "Pengajar" || u.role === "Admin").map((u, idx) => {
                    const staffLogs = (systemState.logs || []).filter(
                      (l) => l.type === "PRESENSI_PENGAJAR" && (l.user === u.name || l.user === u.username) && l.timestamp.startsWith(hrFilterMonth)
                    );
                    let checkIns = 0;
                    let onTime = 0;
                    let late = 0;
                    staffLogs.forEach((l) => {
                      if (l.description.includes("MASUK")) {
                        checkIns++;
                        const match = l.description.match(/MASUK\s*-\s*(\d{2}):(\d{2}):(\d{2})/i);
                        let isLate = false;
                        if (match) {
                          const hrVal = parseInt(match[1]);
                          const minVal = parseInt(match[2]);
                          if (hrVal > 8 || hrVal === 8 && minVal > 0) {
                            isLate = true;
                          }
                        } else {
                          const d = new Date(l.timestamp);
                          const hrVal = d.getHours();
                          const minVal = d.getMinutes();
                          if (hrVal > 8 || hrVal === 8 && minVal > 0) {
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
                    const punctualityRate = checkIns > 0 ? Math.round(onTime / checkIns * 100) : 100;
                    const salRecord = (systemState.salaries || []).find(
                      (sal) => sal.staffName === u.name && (sal.monthString === hrFilterMonth || sal.monthString === formattedMonthStr)
                    );
                    return /* @__PURE__ */ jsxs(React.Fragment, { children: [
                      /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 transition", children: [
                        /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-slate-400 font-mono font-bold", children: idx + 1 }),
                        /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                          /* @__PURE__ */ jsx("div", { className: "font-bold text-slate-800", children: u.name }),
                          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-indigo-600 font-extrabold uppercase mt-0.5", children: u.role })
                        ] }),
                        /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg", children: [
                          checkIns,
                          " Hari Kerja"
                        ] }) }),
                        /* @__PURE__ */ jsx("td", { className: "p-3", children: checkIns > 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center", children: [
                          /* @__PURE__ */ jsxs("span", { className: `text-[11px] font-black ${punctualityRate >= 85 ? "text-emerald-600 bg-emerald-50 border border-emerald-100" : punctualityRate >= 70 ? "text-indigo-600 bg-indigo-50 border border-indigo-100" : "text-amber-600 bg-amber-50 border border-amber-100"} px-2 py-0.5 rounded-md`, children: [
                            punctualityRate,
                            "% Tepat Waktu"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-slate-400 mt-1", children: [
                            "(",
                            onTime,
                            " Tepat, ",
                            late,
                            " Terlambat)"
                          ] })
                        ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-400 italic text-[10px]", children: "Belum ada absen" }) }),
                        /* @__PURE__ */ jsx("td", { className: "p-3 font-mono text-[11px] text-slate-600", children: u.bankAccount || "-" }),
                        /* @__PURE__ */ jsx("td", { className: "p-3", children: salRecord ? /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsx("span", { className: `text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${salRecord.status === "Lunas" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-amber-100 text-amber-800 border border-amber-200"}`, children: salRecord.status }),
                            /* @__PURE__ */ jsxs("span", { className: "font-bold text-slate-800", children: [
                              "Rp ",
                              salRecord.amount.toLocaleString("id-ID")
                            ] })
                          ] }),
                          salRecord.paymentDate && /* @__PURE__ */ jsxs("div", { className: "text-[9px] text-slate-400 font-mono", children: [
                            "Paid: ",
                            salRecord.paymentDate
                          ] })
                        ] }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded border border-slate-200/60", children: "Belum Diinput" }) }),
                        /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: salRecord?.status === "Lunas" ? /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-1.5", children: /* @__PURE__ */ jsx("span", { className: "text-emerald-600 font-black text-xs flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-xl", children: "\u2713 Sinkron Buku Kas" }) }) : /* @__PURE__ */ jsxs(
                          "button",
                          {
                            onClick: () => {
                              setSelectedStaffForQuickPay(selectedStaffForQuickPay === u.username ? null : u.username);
                              setQuickPayAmount(salRecord ? salRecord.amount.toString() : "4500000");
                              setQuickPayNotes("");
                            },
                            className: "px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1 mx-auto shadow-sm",
                            children: [
                              /* @__PURE__ */ jsx("span", { children: "\u{1F4B5}" }),
                              " ",
                              salRecord ? "Lunasi & Sinkron" : "Bayar Gaji"
                            ]
                          }
                        ) })
                      ] }),
                      selectedStaffForQuickPay === u.username && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "bg-slate-50 p-4 border border-indigo-100/50", children: /* @__PURE__ */ jsxs("div", { className: "max-w-xl bg-white p-5 rounded-2xl border border-indigo-100 shadow-md space-y-4 text-left", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-2", children: [
                          /* @__PURE__ */ jsxs("h5", { className: "font-black text-xs text-indigo-950 flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsx("span", { children: "\u{1F4B8}" }),
                            " Form Pembayaran Gaji Terintegrasi Buku Kas"
                          ] }),
                          /* @__PURE__ */ jsxs("span", { className: "text-[9px] font-mono bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold", children: [
                            "Bulan: ",
                            formattedMonthStr
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5", children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-500 uppercase mb-1", children: "Nama Penerima" }),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "text",
                                disabled: true,
                                value: u.name,
                                className: "w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 font-bold outline-none"
                              }
                            )
                          ] }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-500 uppercase mb-1", children: "Nominal Pembayaran (Rp)" }),
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "number",
                                value: quickPayAmount,
                                onChange: (e) => setQuickPayAmount(e.target.value),
                                placeholder: "Cth: 4500000",
                                className: "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-indigo-500"
                              }
                            )
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("label", { className: "block text-[9px] font-bold text-slate-500 uppercase mb-1", children: "Catatan Pengeluaran Kas (Uraian)" }),
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "text",
                              value: quickPayNotes,
                              onChange: (e) => setQuickPayNotes(e.target.value),
                              placeholder: `Cth: Pembayaran Gaji ${u.name} - ${formattedMonthStr}`,
                              className: "w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-indigo-500"
                            }
                          )
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-[10px] text-amber-800 font-medium leading-relaxed", children: [
                          "\u26A0\uFE0F ",
                          /* @__PURE__ */ jsx("strong", { children: "Informasi Sinkronisasi:" }),
                          " Menekan tombol konfirmasi akan langsung:",
                          /* @__PURE__ */ jsxs("ul", { className: "list-disc ml-4 mt-1 space-y-0.5", children: [
                            /* @__PURE__ */ jsx("li", { children: "Mencatat penggajian lunas di database riwayat gaji staff." }),
                            /* @__PURE__ */ jsxs("li", { children: [
                              "Memasukkan pengeluaran otomatis (OUT) di ",
                              /* @__PURE__ */ jsx("strong", { children: "Buku Kas (Ledger)" }),
                              " dengan nominal Rp ",
                              Number(quickPayAmount || 0).toLocaleString("id-ID"),
                              " (Kode P1 - Gaji Karyawan)."
                            ] })
                          ] })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2.5 pt-2", children: [
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: () => setSelectedStaffForQuickPay(null),
                              className: "px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer",
                              children: "Batal"
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              type: "button",
                              onClick: async () => {
                                const amt = Number(quickPayAmount);
                                if (!amt || amt <= 0) {
                                  alert("Harap masukkan nominal gaji yang valid!");
                                  return;
                                }
                                const notesVal = quickPayNotes || `Gaji Staff: ${u.name} (${formattedMonthStr})`;
                                const salPayload = {
                                  staffName: u.name,
                                  role: u.role,
                                  amount: amt,
                                  monthString: hrFilterMonth,
                                  status: "Lunas",
                                  paymentDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                                  notes: notesVal
                                };
                                const salOk = await onUpdateState("salaries", "add", salPayload);
                                if (salOk) {
                                  await onUpdateState("cashLedger", "add", {
                                    code: "P1",
                                    // Gaji Karyawan
                                    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                                    description: `Gaji Staff: ${u.name} (${formattedMonthStr})`,
                                    inAmount: 0,
                                    outAmount: amt
                                  });
                                  alert(`Sukses! Gaji ${u.name} sebesar Rp ${amt.toLocaleString("id-ID")} telah lunas dibayarkan dan otomatis disinkronkan ke Buku Kas (Ledger).`);
                                  setSelectedStaffForQuickPay(null);
                                } else {
                                  alert("Terjadi kesalahan saat menyimpan data gaji.");
                                }
                              },
                              className: "px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition shadow-sm cursor-pointer",
                              children: "Konfirmasi & Sinkronkan Kas"
                            }
                          )
                        ] })
                      ] }) }) })
                    ] }, u.username);
                  }) })
                ] }) })
              ] })
            ] });
          })(),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl p-6 shadow-sm border border-slate-200", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 mb-4 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { children: "\u{1F334}" }),
              " Pengajuan Cuti Pengajar"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              !systemState.teacherLeaves?.length && /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 italic text-left", children: "Belum ada pengajuan cuti." }),
              (systemState.teacherLeaves || []).map((leave) => /* @__PURE__ */ jsxs("div", { className: "p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row justify-between gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-left", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-sm text-slate-800", children: leave.teacherName }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                    leave.startDate,
                    " s/d ",
                    leave.endDate
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-600 mt-2 p-2 bg-white rounded border border-slate-100", children: [
                    "Alasan: ",
                    leave.reason
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 items-end", children: [
                  /* @__PURE__ */ jsx("span", { className: `text-[10px] font-bold px-2 py-1 rounded ${leave.status === "Disetujui" ? "bg-emerald-100 text-emerald-800" : leave.status === "Ditolak" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`, children: leave.status }),
                  leave.status === "Pending" && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-2", children: [
                    /* @__PURE__ */ jsx("button", { onClick: () => onUpdateState("teacherLeaves", "update", { id: leave.id, status: "Disetujui" }), className: "px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 cursor-pointer", children: "Setujui" }),
                    /* @__PURE__ */ jsx("button", { onClick: () => onUpdateState("teacherLeaves", "update", { id: leave.id, status: "Ditolak" }), className: "px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg hover:bg-rose-700 cursor-pointer", children: "Tolak" })
                  ] })
                ] })
              ] }, leave.id))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl p-6 shadow-sm border border-slate-200", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 mb-4 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { children: "\u{1F4C4}" }),
              " Kontrak Kerja LPK (Upload/Update)"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "space-y-4", children: (systemState.users || []).filter((u) => u.role === "Pengajar").map((u) => {
              const contract = (systemState.teacherContracts || []).find((c) => c.teacherName === u.name);
              return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 text-left", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold text-xs text-slate-800", children: u.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 mt-1", children: [
                    "Status Kontrak: ",
                    contract ? contract.status : "Belum Ada"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => {
                    const url = prompt("Masukkan Link Google Drive / File URL PDF Kontrak Kerja untuk " + u.name + ":");
                    if (url) {
                      if (contract) {
                        onUpdateState("teacherContracts", "update", { id: contract.id, content: url, status: "Menunggu TTD" });
                      } else {
                        onUpdateState("teacherContracts", "add", { teacherName: u.name, content: url });
                      }
                    }
                  }, className: "px-3 py-1.5 bg-sky-600 text-white text-[10px] font-bold rounded-lg hover:bg-sky-700 cursor-pointer", children: contract ? "Update Kontrak" : "Upload Kontrak" }),
                  contract && contract.content && /* @__PURE__ */ jsx("button", { onClick: () => window.open(contract.content, "_blank"), className: "px-3 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 cursor-pointer", children: "Lihat" })
                ] })
              ] }, u.username);
            }) })
          ] })
        ] })
      ] }),
      activeSegment === "alumnivip" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fade-in text-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-left", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-white/20 text-white border border-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", children: "ADMIN KELAS ALUMNI" }),
            /* @__PURE__ */ jsx("h3", { className: "font-display font-black text-2xl", children: "Manajemen Kelas Alumni" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-amber-50 max-w-xl", children: "Atur daftar kelas bahasa Jepang, durasi, dan metode pembelajaran untuk Manajemen Kelas Alumni yang tampil di halaman depan." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-white/10 p-4 rounded-2xl flex items-center justify-center border border-white/20", children: /* @__PURE__ */ jsx(Star, { className: "h-10 w-10 text-white animate-pulse" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Teks Header VIP Alumni" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Tagline Atas" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.alumniPackageTagline || "Home / Pilih Kelas", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, alumniPackageTagline: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Judul Utama" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.alumniPackageTitle || "Pilih Kelas Bahasa Jepang", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, alumniPackageTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Banner Judul" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.alumniPackageBannerTitle || "Belajar Langsung dengan Ahlinya!", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, alumniPackageBannerTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Banner Subjudul" }),
                /* @__PURE__ */ jsx("textarea", { value: custLandingConfig.alumniPackageBannerSubtitle || "Didukung oleh Sensei Bersertifikasi N1 dan Native Speaker Jepang", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, alumniPackageBannerSubtitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-amber-500 transition", rows: 2 })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Daftar Kelas" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 ", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Daftar Kelas Alumni" }),
              /* @__PURE__ */ jsx("div", { className: "space-y-3", children: custLandingConfig.alumniClasses?.map((cls, idx) => {
                const clsId = cls.id || String(idx);
                const isExpanded = expandedAlumniClassIds.includes(clsId);
                return /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 rounded-xl bg-white relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-indigo-500" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 cursor-pointer", onClick: () => setExpandedAlumniClassIds((prev) => prev.includes(clsId) ? prev.filter((i) => i !== clsId) : [...prev, clsId]), children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pl-2", children: [
                      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100", children: /* @__PURE__ */ jsx("span", { className: "text-xl", children: cls.emoji || "\u26E9\uFE0F" }) }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 text-sm", children: cls.title || `Kelas Alumni ${idx + 1}` }),
                        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mt-1", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase", children: cls.level || "Level" }),
                          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase", children: cls.method || "Metode" })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                      /* @__PURE__ */ jsx("button", { type: "button", onClick: (e) => {
                        e.stopPropagation();
                        if (window.confirm("Yakin ingin menghapus kelas ini?")) {
                          const newItems = custLandingConfig.alumniClasses.filter((_, i) => i !== idx);
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                        }
                      }, className: "text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 p-2 rounded-lg text-xs font-bold transition border border-slate-200 hover:border-rose-200 shadow-sm", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }),
                      /* @__PURE__ */ jsx("div", { className: `w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 transition-transform duration-300 ${isExpanded ? "rotate-180 bg-indigo-50 text-indigo-600 border-indigo-200" : ""}`, children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }) })
                    ] })
                  ] }),
                  isExpanded && /* @__PURE__ */ jsx("div", { className: "p-4 pt-0 border-t border-slate-100 bg-slate-50/50", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-4 mt-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-4 space-y-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Metode" }),
                        /* @__PURE__ */ jsx("input", { type: "text", value: cls.method || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.alumniClasses];
                          newItems[idx] = { ...cls, method: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                        }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Online & Offline" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Level" }),
                        /* @__PURE__ */ jsx("input", { type: "text", value: cls.level || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.alumniClasses];
                          newItems[idx] = { ...cls, level: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                        }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 uppercase transition shadow-sm font-medium", placeholder: "N3" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Warna/Tema" }),
                        /* @__PURE__ */ jsxs("select", { value: cls.colorScheme || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.alumniClasses];
                          newItems[idx] = { ...cls, colorScheme: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                        }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden cursor-pointer focus:border-indigo-500 transition shadow-sm font-medium", children: [
                          /* @__PURE__ */ jsx("option", { value: "emerald", children: "Emerald (Hijau)" }),
                          /* @__PURE__ */ jsx("option", { value: "blue", children: "Blue (Biru)" }),
                          /* @__PURE__ */ jsx("option", { value: "purple", children: "Purple (Ungu)" }),
                          /* @__PURE__ */ jsx("option", { value: "orange", children: "Orange (Oranye)" }),
                          /* @__PURE__ */ jsx("option", { value: "rose", children: "Rose (Merah Muda)" })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-8 space-y-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Judul Kelas" }),
                          /* @__PURE__ */ jsx("input", { type: "text", value: cls.title || "", onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, title: e.target.value };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Level N3" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Emoji & Durasi" }),
                          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                            /* @__PURE__ */ jsx("input", { type: "text", value: cls.emoji || "", onChange: (e) => {
                              const newItems = [...custLandingConfig.alumniClasses];
                              newItems[idx] = { ...cls, emoji: e.target.value };
                              setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                            }, className: "w-16 text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm text-center font-medium", placeholder: "\u26E9\uFE0F" }),
                            /* @__PURE__ */ jsx("input", { type: "text", value: cls.duration || "", onChange: (e) => {
                              const newItems = [...custLandingConfig.alumniClasses];
                              newItems[idx] = { ...cls, duration: e.target.value };
                              setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                            }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Durasi: 3-4 Bulan" })
                          ] })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Jumlah Pendaftar (Registered)" }),
                          /* @__PURE__ */ jsx("input", { type: "number", value: cls.registered ?? 0, onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, registered: Number(e.target.value) };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "8" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Kuota Kelas (Quota Limit)" }),
                          /* @__PURE__ */ jsx("input", { type: "number", value: cls.quota ?? 10, onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, quota: Number(e.target.value) };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "10" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Tanggal Open Class" }),
                          /* @__PURE__ */ jsx("input", { type: "text", value: cls.openClass || "", onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, openClass: e.target.value };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Contoh: 19 Agustus 2026" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Persentase Diskon (Opsional)" }),
                          /* @__PURE__ */ jsx("input", { type: "text", value: cls.discount || "", onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, discount: e.target.value };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Contoh: 20%" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Teks Diskon" }),
                          /* @__PURE__ */ jsx("input", { type: "text", value: cls.discountText || "", onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, discountText: e.target.value };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Contoh: Hemat 200.000" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Harga Coret (Asli)" }),
                          /* @__PURE__ */ jsx("input", { type: "text", value: cls.originalPrice || "", onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, originalPrice: e.target.value };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, onBlur: (e) => {
                            const formatted = formatRupiah(e.target.value);
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, originalPrice: formatted };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Rp 1.200.000" })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                          /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Harga Akhir" }),
                          /* @__PURE__ */ jsx("input", { type: "text", value: cls.finalPrice || "", onChange: (e) => {
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, finalPrice: e.target.value };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, onBlur: (e) => {
                            const formatted = formatRupiah(e.target.value);
                            const newItems = [...custLandingConfig.alumniClasses];
                            newItems[idx] = { ...cls, finalPrice: formatted };
                            setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                          }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", placeholder: "Rp 1.000.000" })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Deskripsi" }),
                        /* @__PURE__ */ jsx("textarea", { value: cls.description || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.alumniClasses];
                          newItems[idx] = { ...cls, description: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                        }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", rows: 2 })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase tracking-wider", children: "Fitur (Pisahkan dengan koma)" }),
                        /* @__PURE__ */ jsx("textarea", { value: (cls.features || []).join(", "), onChange: (e) => {
                          const newItems = [...custLandingConfig.alumniClasses];
                          newItems[idx] = { ...cls, features: e.target.value.split(",").map((f) => f.trim()).filter(Boolean) };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                        }, className: "w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium", rows: 2, placeholder: "Kosakata & Tata Bahasa Dasar, Percakapan Sehari-hari" })
                      ] })
                    ] })
                  ] }) })
                ] }, clsId);
              }) }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-start mt-4", children: /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
                const newItem = {
                  id: "al_" + Date.now(),
                  method: "Online & Offline",
                  level: "N4",
                  emoji: "\u26E9\uFE0F",
                  title: "Level N4",
                  description: "Deskripsi program alumni.",
                  features: ["Fitur 1", "Fitur 2"],
                  duration: "Durasi: 3 Bulan",
                  colorScheme: "emerald",
                  registered: 0,
                  quota: 10
                };
                setCustLandingConfig({ ...custLandingConfig, alumniClasses: [...custLandingConfig.alumniClasses || [], newItem] });
                setExpandedAlumniClassIds([...expandedAlumniClassIds, newItem.id]);
              }, className: "text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm border border-indigo-700", children: [
                /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                " Tambah Manajemen Kelas Alumni"
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-slate-100", children: /* @__PURE__ */ jsx(
            ConfirmForm,
            {
              confirmTitle: "Simpan Manajemen Kelas Alumni",
              confirmMessage: "Menerapkan perubahan pada Kelas Alumni ke beranda publik secara instan?",
              onSubmit: async (e) => {
                e.preventDefault();
                const currentLmsClasses = systemState?.customization?.lmsClasses || systemState?.lmsClasses || [];
                const updatedLmsClasses = [...currentLmsClasses];
                (custLandingConfig.alumniClasses || []).forEach((cls) => {
                  const className = `Kelas Alumni ${cls.title || "VIP"}`;
                  const existingIndex = updatedLmsClasses.findIndex(
                    (c) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                  );
                  if (existingIndex === -1) {
                    updatedLmsClasses.push({
                      id: className,
                      name: className,
                      isActive: true,
                      type: "alumni",
                      method: cls.method || "Offline",
                      period: cls.duration || "Juni 2026",
                      chapters: CHAPTERS_LIST.map((ch) => ({ ...ch, isActive: ch.number === 1 }))
                    });
                  } else {
                    updatedLmsClasses[existingIndex] = {
                      ...updatedLmsClasses[existingIndex],
                      type: "alumni",
                      method: cls.method || updatedLmsClasses[existingIndex].method || "Offline",
                      period: cls.duration || updatedLmsClasses[existingIndex].period || "Juni 2026"
                    };
                  }
                });
                const ok = await onUpdateState("customization", "update", {
                  ...systemState?.customization,
                  landingConfig: custLandingConfig,
                  lmsClasses: updatedLmsClasses
                });
                if (ok) {
                  setLandingSaveSuccess(true);
                  setTimeout(() => setLandingSaveSuccess(false), 3e3);
                }
              },
              children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "submit",
                  className: "bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs",
                  children: [
                    /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
                    landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Perubahan"
                  ]
                }
              )
            }
          ) })
        ] })
      ] }),
      activeSegment === "kustomisasi" && /* @__PURE__ */ jsxs("div", { className: "space-y-8 animate-fade-in text-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-left", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-indigo-500/20 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", children: "ADMIN BRANDING CONSOLE" }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-black font-sans tracking-tight", children: "Kustomisasi Identitas & Slide Landing Page" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-300 max-w-xl leading-relaxed", children: "Sesuaikan nama institusi LPK, lambang lencana, palet rona tema, serta galeri gambar slideshow secara waktu nyata tanpa melakukan kompilasi ulang (re-build)." })
          ] }),
          saveSuccess && /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 animate-bounce", children: [
            /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 bg-emerald-500 text-slate-950 rounded-full p-0.5" }),
            /* @__PURE__ */ jsx("span", { children: "Berhasil Disinkronkan!" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8 text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 bg-white p-4.5 sm:p-6 md:p-8 rounded-3xl border border-slate-200/60 shadow-xs space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 border-b border-slate-100 pb-3", children: [
              /* @__PURE__ */ jsx(Palette, { className: "h-5 w-5 text-indigo-600" }),
              /* @__PURE__ */ jsx("h4", { className: "font-display font-bold text-slate-900 text-sm uppercase tracking-wide", children: "Logo & Tema Dasar" })
            ] }),
            /* @__PURE__ */ jsxs(
              ConfirmForm,
              {
                confirmTitle: "Simpan Pengaturan Visual",
                confirmMessage: "Menerapkan kustomisasi ini secara publik (semua pendaftar langsung dapat melihatnya)?",
                onSubmit: handleSaveCustomization,
                className: "space-y-6",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Nama LPK (Logo Utama)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: true,
                        value: custLogoText || "",
                        onChange: (e) => setCustLogoText(e.target.value),
                        className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-indigo-500 focus:bg-white transition",
                        placeholder: "Contoh: LPK Source Course"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 block pt-1", children: "Direkomendasikan menggunakan nama resmi LPK agar tampak kredibel." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-700 flex items-center justify-between", children: [
                      /* @__PURE__ */ jsx("span", { children: "File Gambar Logo LPK (Upload Baru)" }),
                      custLogoUrl && /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => setCustLogoUrl(""),
                          className: "text-[10px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:underline transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }),
                            " Hapus Logo Upload"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl", children: [
                      /* @__PURE__ */ jsx("div", { className: "h-12 w-12 bg-white rounded-xl border border-slate-150 flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0", children: custLogoUrl ? /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: custLogoUrl,
                          alt: "Custom Logo Preview",
                          referrerPolicy: "no-referrer",
                          className: "h-full w-full object-contain"
                        }
                      ) : /* @__PURE__ */ jsxs("div", { className: "text-slate-400 flex flex-col items-center", children: [
                        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[7px] font-bold", children: "ICON MODE" })
                      ] }) }),
                      /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-800 leading-snug", children: custLogoUrl ? "Menggunakan Logo Unggahan" : "Menggunakan Icon Lencana Vektor" }),
                        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 leading-normal", children: custLogoUrl ? "Logo unggahan berformat gambar akan menggantikan lencana ikon di atas pada seluruh bagian aplikasi." : "Pilih file gambar Anda di area drag-drop di bawah ini untuk mengganti ikon." })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        onDragEnter: handleLogoDrag,
                        onDragLeave: handleLogoDrag,
                        onDragOver: handleLogoDrag,
                        onDrop: handleLogoDrop,
                        className: `relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${custLogoDragActive ? "border-indigo-600 bg-indigo-50/40 text-indigo-950" : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-500"}`,
                        children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "file",
                              id: "input-file-logo",
                              accept: "image/*",
                              onChange: handleLogoFileChange,
                              className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            }
                          ),
                          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pointer-events-none flex flex-col items-center", children: [
                            /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 text-slate-400" }) }),
                            /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-bold text-slate-700", children: [
                              "Seret & Letakkan gambar di sini, atau",
                              " ",
                              /* @__PURE__ */ jsx("span", { className: "text-indigo-600 font-extrabold underline", children: "Cari File" })
                            ] }),
                            /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400", children: "Direkomendasikan format PNG transparan atau JPEG (Maks. 2MB)" })
                          ] })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2.5", children: [
                    /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-700 flex items-center justify-between", children: [
                      /* @__PURE__ */ jsx("span", { children: "File Gambar Favicon (Icon Tab Browser)" }),
                      custFaviconUrl && /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => setCustFaviconUrl(""),
                          className: "text-[10px] text-rose-600 hover:text-rose-800 font-extrabold flex items-center gap-1 hover:underline transition cursor-pointer",
                          children: [
                            /* @__PURE__ */ jsx(Trash2, { className: "h-3 w-3" }),
                            " Hapus Favicon Upload"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl", children: [
                      /* @__PURE__ */ jsx("div", { className: "h-10 w-10 bg-white rounded-xl border border-slate-150 flex items-center justify-center p-1.5 shadow-xs overflow-hidden shrink-0", children: custFaviconUrl ? /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: custFaviconUrl,
                          alt: "Custom Favicon Preview",
                          referrerPolicy: "no-referrer",
                          className: "h-full w-full object-contain"
                        }
                      ) : /* @__PURE__ */ jsxs("div", { className: "text-slate-400 flex flex-col items-center", children: [
                        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                        /* @__PURE__ */ jsx("span", { className: "text-[7px] font-bold", children: "DEF MODE" })
                      ] }) }),
                      /* @__PURE__ */ jsxs("div", { className: "flex-1 text-left", children: [
                        /* @__PURE__ */ jsx("p", { className: "text-[11px] font-bold text-slate-800 leading-snug", children: custFaviconUrl ? "Menggunakan Favicon Unggahan" : "Menggunakan Favicon Default LPK SCI" }),
                        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 leading-normal", children: custFaviconUrl ? "Favicon kustom akan ditampilkan di tab browser pengguna Anda." : "Pilih file gambar Anda (disarankan format square/PNG) untuk mengganti icon tab browser." })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs(
                      "div",
                      {
                        onDragEnter: handleFaviconDrag,
                        onDragLeave: handleFaviconDrag,
                        onDragOver: handleFaviconDrag,
                        onDrop: handleFaviconDrop,
                        className: `relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${custFaviconDragActive ? "border-indigo-600 bg-indigo-50/40 text-indigo-950" : "border-slate-200 hover:border-slate-350 bg-slate-50/50 hover:bg-slate-50 text-slate-500"}`,
                        children: [
                          /* @__PURE__ */ jsx(
                            "input",
                            {
                              type: "file",
                              id: "input-file-favicon",
                              accept: "image/*",
                              onChange: handleFaviconFileChange,
                              className: "absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            }
                          ),
                          /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pointer-events-none flex flex-col items-center", children: [
                            /* @__PURE__ */ jsx("div", { className: "h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center", children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 text-slate-400" }) }),
                            /* @__PURE__ */ jsxs("div", { className: "text-[11px] font-bold text-slate-700", children: [
                              "Seret & Letakkan favicon di sini, atau",
                              " ",
                              /* @__PURE__ */ jsx("span", { className: "text-indigo-600 font-extrabold underline", children: "Cari File" })
                            ] }),
                            /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400", children: "Disarankan format PNG/ICO square, rasio 1:1 (Maks. 500KB)" })
                          ] })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Lencana Lambang (Icon)" }),
                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 sm:grid-cols-5 gap-2", children: [
                      { name: "GraduationCap", ic: GraduationCap },
                      { name: "Award", ic: Award },
                      { name: "BookOpen", ic: BookOpen },
                      { name: "Globe", ic: Globe },
                      { name: "Anchor", ic: Anchor },
                      { name: "Compass", ic: Compass },
                      { name: "Sparkles", ic: Sparkles },
                      { name: "Heart", ic: Heart },
                      { name: "Landmark", ic: Landmark }
                    ].map((item) => {
                      const IconComponent = item.ic;
                      const isSelected = custLogoIcon === item.name;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => setCustLogoIcon(item.name),
                          className: `flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer text-[10px] gap-1.5 ${isSelected ? "bg-slate-950 text-white border-slate-950 shadow-sm font-bold" : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"}`,
                          children: [
                            /* @__PURE__ */ jsx(IconComponent, { className: "h-4 w-4" }),
                            /* @__PURE__ */ jsx("span", { className: "truncate max-w-full text-[8px]", children: item.name })
                          ]
                        },
                        item.name
                      );
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Palet Rona Tema Utama" }),
                    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [
                      {
                        id: "blue",
                        label: "Midnight Blue",
                        bg: "bg-blue-600"
                      },
                      {
                        id: "indigo",
                        label: "Kyoto Indigo",
                        bg: "bg-indigo-600"
                      },
                      {
                        id: "rose",
                        label: "Osaka",
                        bg: "bg-rose-500"
                      },
                      {
                        id: "emerald",
                        label: "Teal Shizuoka",
                        bg: "bg-emerald-600"
                      },
                      {
                        id: "amber",
                        label: "Golden Fuji",
                        bg: "bg-amber-500"
                      },
                      {
                        id: "slate",
                        label: "Slate Washitsu",
                        bg: "bg-slate-600"
                      }
                    ].map((col) => {
                      const isSelected = custThemeColor === col.id;
                      return /* @__PURE__ */ jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => setCustThemeColor(col.id),
                          className: `flex items-center gap-2 p-2 rounded-xl border transition text-left cursor-pointer text-xs ${isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-semibold" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`,
                          children: [
                            /* @__PURE__ */ jsx(
                              "span",
                              {
                                className: `h-4 w-4 rounded-full shadow-inner ${col.bg}`
                              }
                            ),
                            /* @__PURE__ */ jsx("span", { children: col.label })
                          ]
                        },
                        col.id
                      );
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "submit",
                      className: "w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-white font-black py-3 rounded-2xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md",
                      children: [
                        /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 stroke-[3]" }),
                        " Simpan Kustomisasi Identitas"
                      ]
                    }
                  )
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 bg-slate-50 border border-slate-200/60 rounded-3xl p-4.5 sm:p-6 md:p-8 flex flex-col justify-between space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-widest", children: "LIVE LAYOUT PREVIEW" }),
              /* @__PURE__ */ jsx("h4", { className: "font-sans font-bold text-slate-800 text-sm", children: "Pratinjau Hasil Desain Navbar" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2.5", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-xl blur-xs opacity-40 bg-indigo-500 animate-pulse" }),
                  /* @__PURE__ */ jsx("div", { className: "relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-white shadow-md", children: (() => {
                    const iconMap = {
                      GraduationCap,
                      Award,
                      BookOpen,
                      Globe,
                      Anchor,
                      Compass,
                      Sparkles,
                      Heart,
                      Landmark
                    };
                    const IconToRender = iconMap[custLogoIcon || "GraduationCap"] || GraduationCap;
                    return /* @__PURE__ */ jsx(IconToRender, { className: "h-4.5 w-4.5 text-blue-400" });
                  })() })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("span", { className: "font-sans text-xs font-black tracking-tight text-slate-900 block leading-none uppercase text-left", children: custLogoText || "LPK Source Course" }),
                  /* @__PURE__ */ jsx("span", { className: "text-[7.5px] font-sans font-bold text-slate-400 block tracking-wide uppercase pt-0.5 text-left", children: "DKP & Bahasa Jepang Resmi" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5 text-[8px] font-bold", children: [
                /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md bg-slate-100 text-slate-600", children: "FRONTEND" }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `px-2 py-0.5 rounded-md text-white ${{
                      blue: "bg-blue-600",
                      indigo: "bg-indigo-600",
                      rose: "bg-rose-500",
                      emerald: "bg-emerald-600",
                      amber: "bg-amber-500",
                      slate: "bg-slate-600"
                    }[custThemeColor || "blue"]}`,
                    children: "ACTIVE"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 text-[11px] leading-relaxed font-normal text-left", children: [
              /* @__PURE__ */ jsxs("h5", { className: "font-bold text-amber-400 mb-1 flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "h-3.5 w-3.5" }),
                " Cara Kerja Sinkronisasi"
              ] }),
              'Instalasi penyesuaian ini dijalankan secara instan. Ketika Anda mengklik tombol "Simpan Kustomisasi", sistem akan menyimpan status barunya ke memori server utama, mendistribusikannya ke seluruh komponen situs web pendaftar secara otomatis tanpa perlu mematikan container.'
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-left", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-4 gap-4 flex-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-5 w-5 text-indigo-600" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-display font-bold text-slate-900 text-sm uppercase tracking-wide", children: "Pengaturan Lokasi Kantor & Radius Presensi (Admin / VVIP)" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 font-medium", children: "Konfigurasi titik pusat GPS LPK dan jarak maksimum kehadiran fisik (default: 200 meter)." })
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: async () => {
                  const latVal = parseFloat(officeLat);
                  const lonVal = parseFloat(officeLon);
                  const radVal = parseInt(officeRadius, 10);
                  if (isNaN(latVal) || isNaN(lonVal) || isNaN(radVal)) {
                    alert("\u26A0\uFE0F Koordinat atau radius yang diisi tidak valid.");
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
                    alert("\u2705 Berhasil menyimpan pengaturan koordinat & radius presensi!");
                  } else {
                    alert("\u26A0\uFE0F Gagal menyimpan pengaturan.");
                  }
                },
                className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shadow-sm",
                children: [
                  /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5 stroke-[3]" }),
                  " Simpan Lokasi Presensi"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-8 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Garis Lintang (Latitude)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "any",
                      required: true,
                      value: officeLat || "",
                      onChange: (e) => setOfficeLat(e.target.value),
                      className: "w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition",
                      placeholder: "Contoh: -7.79558"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Garis Bujur (Longitude)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "any",
                      required: true,
                      value: officeLon || "",
                      onChange: (e) => setOfficeLon(e.target.value),
                      className: "w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition",
                      placeholder: "Contoh: 110.36949"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Radius Toleransi (Meter)" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        required: true,
                        value: officeRadius || "",
                        onChange: (e) => setOfficeRadius(e.target.value),
                        className: "w-full text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 pl-3 pr-10 py-2.5 outline-none focus:border-indigo-500 focus:bg-white transition",
                        placeholder: "200"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-slate-400", children: "meter" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 block", children: "Jarak aman standar adalah 200 meter dari titik koordinat." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Validasi Lokasi Aktif" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-2", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: !!officeEnforce,
                        onChange: (e) => setOfficeEnforce(e.target.checked),
                        className: "h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-slate-750", children: "Wajibkan presensi dari dalam radius kantor (Luring)" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-2.5 pt-2", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            setOfficeLat(String(position.coords.latitude));
                            setOfficeLon(String(position.coords.longitude));
                            alert("\u{1F4CD} Koordinat lokasi Anda saat ini berhasil dideteksi dan diisi!");
                          },
                          (error) => {
                            alert(`\u26A0\uFE0F Gagal mendeteksi lokasi: ${error.message}`);
                          }
                        );
                      } else {
                        alert("\u26A0\uFE0F Browser Anda tidak mendukung pendeteksian lokasi GPS.");
                      }
                    },
                    className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5",
                    children: "\u{1F4CD} Deteksi Koordinat Saya Saat Ini"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setOfficeLat("-7.79558");
                      setOfficeLon("110.36949");
                      setOfficeRadius("200");
                      setOfficeEnforce(true);
                    },
                    className: "px-4 py-2 bg-white hover:bg-slate-50 text-slate-500 border border-slate-100 rounded-xl text-xs font-bold cursor-pointer transition",
                    children: "Reset Default (Yogyakarta)"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-4 bg-slate-50 p-4 border border-slate-200/60 rounded-2xl flex flex-col justify-between space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] font-black text-indigo-600 uppercase tracking-wider block", children: "\u{1F4CD} Status Koordinat Saat Ini" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1 font-mono text-xs text-slate-700 font-bold", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    "Lat: ",
                    /* @__PURE__ */ jsx("span", { className: "text-indigo-700", children: officeLat || "-7.79558" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    "Lon: ",
                    /* @__PURE__ */ jsx("span", { className: "text-indigo-700", children: officeLon || "110.36949" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    "Radius: ",
                    /* @__PURE__ */ jsxs("span", { className: "text-indigo-700", children: [
                      officeRadius || "200",
                      " m"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    "Enforce: ",
                    /* @__PURE__ */ jsx("span", { className: "text-indigo-700", children: officeEnforce ? "Aktif (Wajib)" : "Nonaktif" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 leading-relaxed font-medium", children: [
                "Sistem akan menghitung jarak koordinat GPS smartphone pengajar ketika melakukan presensi secara real-time dan membandingkannya dengan koordinat ini. Jika jarak melebihi ",
                /* @__PURE__ */ jsxs("strong", { children: [
                  officeRadius || "200",
                  " meter"
                ] }),
                ", presensi akan otomatis ditolak oleh sistem."
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Camera, { className: "h-5 w-5 text-indigo-600" }),
              /* @__PURE__ */ jsx("h4", { className: "font-display font-bold text-slate-900 text-sm uppercase tracking-wide", children: "Galeri & Slideshow Foto Utama" })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  const existingIds = custSlides.filter((s) => typeof s.id === "number").map((s) => s.id);
                  const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
                  const newSlide = {
                    id: newId,
                    tag: "\u{1F31F} PROGRAM UNGGULAN BARU",
                    title: "Daftar Sekarang Juga Untuk Angkatan Musim Panas 2026/2027",
                    description: "Bimbingan terstruktur dan komprehensif bersama Sensei & Senpai berpengalaman di LPK kami.",
                    image: "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1200&q=80",
                    accent: "from-blue-500 through-indigo-500 to-purple-500",
                    glowColor: "shadow-indigo-500/25",
                    statValue: "100% Kontrak Kerja",
                    statText: "Siswa Terdaftar Berangkat",
                    actionText: "Daftar Sekarang \u{1F680}"
                  };
                  setCustSlides((prev) => [...prev || [], newSlide]);
                  setSelectedSlideId(newId);
                },
                className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition shadow-xs",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
                  " Tambah Slide Baru"
                ]
              }
            )
          ] }),
          custSlides.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs", children: 'Tidak ada slide konfigurasional. Silakan klik "Tambah Slide Baru".' }) : /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left", children: custSlides.map((slide, sIdx) => {
            const isEditing = selectedSlideId === slide.id;
            return /* @__PURE__ */ jsxs(
              "div",
              {
                className: `rounded-2xl border transition overflow-hidden flex flex-col justify-between ${isEditing ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-white" : "border-slate-200 hover:border-slate-300 bg-slate-50/20"}`,
                children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: "relative h-28 w-full bg-slate-950 bg-cover bg-center",
                      style: { backgroundImage: `url('${slide.image || "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80"}')` },
                      children: [
                        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" }),
                        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-2 left-2 right-2 text-left", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-[8px] bg-slate-900/60 font-bold px-1.5 py-0.5 rounded-md text-slate-200 border border-slate-700/60 uppercase select-none inline-block w-max truncate max-w-full", children: slide.tag || "SLIDE" }),
                          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-white font-extrabold truncate block mt-1 drop-shadow-sm leading-tight", children: slide.title || "No Title" })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "p-3 text-xs text-left text-slate-600 flex-1 space-y-2", children: isEditing ? /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-1.5 text-left", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Tag Badge" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: slide.tag || "",
                          onChange: (e) => {
                            const updated = [...custSlides];
                            updated[sIdx] = {
                              ...updated[sIdx],
                              tag: e.target.value
                            };
                            setCustSlides(updated);
                            onUpdateState("slideshows", "update", updated);
                          },
                          className: "w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Judul Slide" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: slide.title || "",
                          onChange: (e) => {
                            const updated = [...custSlides];
                            updated[sIdx] = {
                              ...updated[sIdx],
                              title: e.target.value
                            };
                            setCustSlides(updated);
                            onUpdateState("slideshows", "update", updated);
                          },
                          className: "w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Deskripsi Ringkas" }),
                      /* @__PURE__ */ jsx(
                        "textarea",
                        {
                          value: slide.description || "",
                          onChange: (e) => {
                            const updated = [...custSlides];
                            updated[sIdx] = {
                              ...updated[sIdx],
                              description: e.target.value
                            };
                            setCustSlides(updated);
                            onUpdateState("slideshows", "update", updated);
                          },
                          className: "w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500 min-h-[45px] leading-snug"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Tautan Gambar (URL/Unsplash) atau Upload Gambar" }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            value: slide.image || "",
                            placeholder: "Tempel URL gambar di sini",
                            onChange: (e) => {
                              const updated = [...custSlides];
                              updated[sIdx] = {
                                ...updated[sIdx],
                                image: e.target.value
                              };
                              setCustSlides(updated);
                              onUpdateState("slideshows", "update", updated);
                            },
                            className: "w-full text-[10px] p-1 border rounded-md bg-white outline-hidden focus:border-indigo-500 font-mono"
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-slate-400", children: "ATAU" }),
                          /* @__PURE__ */ jsxs("label", { className: "relative text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded cursor-pointer transition", children: [
                            "Upload File",
                            /* @__PURE__ */ jsx(
                              "input",
                              {
                                type: "file",
                                accept: "image/*",
                                className: "hidden",
                                onChange: (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    setSliderUploadStatus((prev) => ({ ...prev, [sIdx]: "loading" }));
                                    uploadFileToFirebase(file, "customization").then((url) => {
                                      const updated = [...custSlides];
                                      updated[sIdx] = {
                                        ...updated[sIdx],
                                        image: url
                                      };
                                      setCustSlides(updated);
                                      onUpdateState("slideshows", "update", updated);
                                      onUpdateState("slideshows", "update", updated);
                                      setSliderUploadStatus((prev) => ({ ...prev, [sIdx]: "success" }));
                                      setTimeout(() => setSliderUploadStatus((prev) => ({ ...prev, [sIdx]: void 0 })), 3e3);
                                    }).catch((err) => {
                                      console.error(err);
                                      alert("Gagal upload slide");
                                      setSliderUploadStatus((prev) => ({ ...prev, [sIdx]: void 0 }));
                                    });
                                  }
                                }
                              }
                            ),
                            sliderUploadStatus[sIdx] === "loading" && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-0 flex items-center gap-1 text-[8px] text-indigo-600 font-bold bg-white px-1 rounded-sm shadow-xs border border-indigo-200", children: [
                              /* @__PURE__ */ jsx(LoaderCircle, { className: "w-2.5 h-2.5 animate-spin" }),
                              " Uploading..."
                            ] }),
                            sliderUploadStatus[sIdx] === "success" && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-0 flex items-center gap-1 text-[8px] text-emerald-600 font-bold bg-white px-1 rounded-sm shadow-xs border border-emerald-200", children: [
                              /* @__PURE__ */ jsx(Check, { className: "w-2.5 h-2.5" }),
                              " OK"
                            ] })
                          ] })
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Nilai Stat" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            value: slide.statValue || "",
                            onChange: (e) => {
                              const updated = [...custSlides];
                              updated[sIdx] = {
                                ...updated[sIdx],
                                statValue: e.target.value
                              };
                              setCustSlides(updated);
                              onUpdateState("slideshows", "update", updated);
                              onUpdateState("slideshows", "update", updated);
                            },
                            className: "w-full text-[10px] p-1 border rounded-md bg-white"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Keterangan Stat" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            value: slide.statText || "",
                            onChange: (e) => {
                              const updated = [...custSlides];
                              updated[sIdx] = {
                                ...updated[sIdx],
                                statText: e.target.value
                              };
                              setCustSlides(updated);
                              onUpdateState("slideshows", "update", updated);
                              onUpdateState("slideshows", "update", updated);
                            },
                            className: "w-full text-[10px] p-1 border rounded-md bg-white"
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Teks Tombol" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            value: slide.actionText || "",
                            onChange: (e) => {
                              const updated = [...custSlides];
                              updated[sIdx] = {
                                ...updated[sIdx],
                                actionText: e.target.value
                              };
                              setCustSlides(updated);
                              onUpdateState("slideshows", "update", updated);
                              onUpdateState("slideshows", "update", updated);
                            },
                            className: "w-full text-[10px] p-1 border rounded-md bg-white"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[8px] font-bold text-slate-500 block uppercase", children: "Gradien Aksen" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "text",
                            placeholder: "from-blue-500 through-indigo-500 to-purple-500",
                            value: slide.accent || "",
                            onChange: (e) => {
                              const updated = [...custSlides];
                              updated[sIdx] = {
                                ...updated[sIdx],
                                accent: e.target.value
                              };
                              setCustSlides(updated);
                              onUpdateState("slideshows", "update", updated);
                              onUpdateState("slideshows", "update", updated);
                            },
                            className: "w-full text-[10px] p-1 border rounded-md bg-white font-mono"
                          }
                        )
                      ] })
                    ] })
                  ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-1 text-left", children: [
                    /* @__PURE__ */ jsx("p", { className: "line-clamp-3 text-[11px] leading-snug", children: slide.description }),
                    /* @__PURE__ */ jsxs("div", { className: "border-t border-slate-100 py-1 flex items-center justify-between text-[10px] font-mono select-none", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "Stat:" }),
                      /* @__PURE__ */ jsxs("span", { className: "text-slate-800 font-bold", children: [
                        slide.statValue,
                        " / ",
                        slide.statText
                      ] })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-slate-100 px-3 py-2 flex items-center justify-between border-t border-slate-200", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          if (isEditing) {
                            setSelectedSlideId(null);
                          } else {
                            setSelectedSlideId(slide.id);
                          }
                        },
                        className: `font-black text-[9px] px-2.5 py-1 rounded-md transition uppercase cursor-pointer ${isEditing ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`,
                        children: isEditing ? "Selesai" : "Sunting"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          const updated = custSlides.filter(
                            (s) => s.id !== slide.id
                          );
                          setCustSlides(updated);
                          onUpdateState("slideshows", "update", updated);
                          onUpdateState("slideshows", "update", updated);
                          if (selectedSlideId === slide.id) {
                            setSelectedSlideId(null);
                          }
                        },
                        className: "text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition",
                        title: "Hapus Slide",
                        children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
                      }
                    )
                  ] })
                ]
              },
              slide.id
            );
          }) }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2 border-t border-slate-100", children: /* @__PURE__ */ jsx(
            ConfirmForm,
            {
              confirmTitle: "Simpan Slideshow",
              confirmMessage: "Menerapkan gambar dan teks slideshow ini ke beranda publik secara instan?",
              onSubmit: async (e) => {
                e.preventDefault();
                const ok = await onUpdateState("slideshows", "update", custSlides);
                if (ok) {
                  setSlideSaveSuccess(true);
                  setTimeout(() => setSlideSaveSuccess(false), 3e3);
                }
              },
              children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "submit",
                  className: "bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs",
                  children: [
                    /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
                    slideSaveSuccess ? "Berhasil Disimpan!" : "Simpan Masukan Slideshow & Branding"
                  ]
                }
              )
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-slate-200 p-6 space-y-6", children: [
          /* @__PURE__ */ jsx("div", { className: "border-b border-slate-100 pb-4 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-sans font-black text-slate-900 text-lg flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(LayoutTemplate, { className: "h-6 w-6 text-indigo-600" }),
              "Kustomisasi Konten Halaman Depan"
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Sesuaikan teks dan konten untuk bagian Ekosistem, Alumni, dan Program di halaman depan." })
          ] }) }),
          custLandingConfig && /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Bagian: Ucapan Selamat Datang (Hero)" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Judul Utama" }),
                  /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.heroTitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, heroTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Subjudul Utama" }),
                  /* @__PURE__ */ jsx("textarea", { value: custLandingConfig.heroSubtitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, heroSubtitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition", rows: 2 })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Bagian: Ekosistem (Gen-Z Perks)" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Judul Ekosistem" }),
                  /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.ecosystemTitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, ecosystemTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Subjudul Ekosistem" }),
                  /* @__PURE__ */ jsx("textarea", { value: custLandingConfig.ecosystemSubtitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, ecosystemSubtitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition", rows: 2 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-4", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Daftar Fitur Ekosistem" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  custLandingConfig.perks?.map((perk, idx) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative", children: [
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Judul Fitur" }),
                      /* @__PURE__ */ jsx("input", { type: "text", value: perk.title || "", onChange: (e) => {
                        const newPerks = [...custLandingConfig.perks];
                        newPerks[idx] = { ...perk, title: e.target.value };
                        setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                      }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-8 space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Deskripsi Fitur" }),
                      /* @__PURE__ */ jsx("textarea", { value: perk.desc || "", onChange: (e) => {
                        const newPerks = [...custLandingConfig.perks];
                        newPerks[idx] = { ...perk, desc: e.target.value };
                        setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                      }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden", rows: 2 })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "md:col-span-1 flex items-end pb-1 justify-end", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
                      const newPerks = custLandingConfig.perks.filter((_, i) => i !== idx);
                      setCustLandingConfig({ ...custLandingConfig, perks: newPerks });
                    }, className: "text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }) })
                  ] }, perk.id || idx)),
                  /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
                    const newId = custLandingConfig.perks?.length > 0 ? Math.max(...custLandingConfig.perks.map((p) => p.id || 0)) + 1 : 1;
                    const newPerk = { id: newId, title: "Fitur Baru", desc: "Deskripsi", color: "blue" };
                    setCustLandingConfig({ ...custLandingConfig, perks: [...custLandingConfig.perks || [], newPerk] });
                  }, className: "text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition", children: [
                    /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
                    " Tambah Fitur"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Bagian: Apa Kata Alumni" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Judul Testimoni" }),
                  /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.alumniTitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, alumniTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Subjudul Testimoni" }),
                  /* @__PURE__ */ jsx("textarea", { value: custLandingConfig.alumniSubtitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, alumniSubtitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition", rows: 2 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-4", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Daftar Testimoni" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  custLandingConfig.testimonials?.map((testimonial, idx) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative", children: [
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Nama Alumni" }),
                        /* @__PURE__ */ jsx("input", { type: "text", value: testimonial.name, onChange: (e) => {
                          const newItems = [...custLandingConfig.testimonials];
                          newItems[idx] = { ...testimonial, name: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                        }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Peran / Pekerjaan" }),
                        /* @__PURE__ */ jsx("input", { type: "text", value: testimonial.role || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.testimonials];
                          newItems[idx] = { ...testimonial, role: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                        }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-8 space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Isi Testimoni" }),
                      /* @__PURE__ */ jsx("textarea", { value: testimonial.content || "", onChange: (e) => {
                        const newItems = [...custLandingConfig.testimonials];
                        newItems[idx] = { ...testimonial, content: e.target.value };
                        setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                      }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden h-full min-h-[4rem]" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "md:col-span-1 flex items-end pb-1 justify-end", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
                      const newItems = custLandingConfig.testimonials.filter((_, i) => i !== idx);
                      setCustLandingConfig({ ...custLandingConfig, testimonials: newItems });
                    }, className: "text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }) })
                  ] }, testimonial.id || idx)),
                  /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
                    const newId = custLandingConfig.testimonials?.length > 0 ? Math.max(...custLandingConfig.testimonials.map((p) => p.id || 0)) + 1 : 1;
                    const newItem = { id: newId, name: "Nama Baru", role: "Peran Baru", content: "Isi testimoni" };
                    setCustLandingConfig({ ...custLandingConfig, testimonials: [...custLandingConfig.testimonials || [], newItem] });
                  }, className: "text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition", children: [
                    /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
                    " Tambah Testimoni"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Bagian: Program Pemagangan" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Judul Program" }),
                  /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.programsTitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, programsTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Subjudul Program" }),
                  /* @__PURE__ */ jsx("textarea", { value: custLandingConfig.programsSubtitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, programsSubtitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition", rows: 2 })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2 mt-4", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700 block", children: "Daftar Program" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  custLandingConfig.programs?.map((program, idx) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 relative", children: [
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-2", children: [
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Tag (Pita)" }),
                        /* @__PURE__ */ jsx("input", { type: "text", value: program.tag || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.programs];
                          newItems[idx] = { ...program, tag: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                        }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden uppercase" })
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                        /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Judul Program" }),
                        /* @__PURE__ */ jsx("input", { type: "text", value: program.title || "", onChange: (e) => {
                          const newItems = [...custLandingConfig.programs];
                          newItems[idx] = { ...program, title: e.target.value };
                          setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                        }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden" })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "md:col-span-8 space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500", children: "Deskripsi Program" }),
                      /* @__PURE__ */ jsx("textarea", { value: program.desc || "", onChange: (e) => {
                        const newItems = [...custLandingConfig.programs];
                        newItems[idx] = { ...program, desc: e.target.value };
                        setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                      }, className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1 outline-hidden h-full min-h-[4rem]" })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "md:col-span-1 flex items-end pb-1 justify-end", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
                      const newItems = custLandingConfig.programs.filter((_, i) => i !== idx);
                      setCustLandingConfig({ ...custLandingConfig, programs: newItems });
                    }, className: "text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg text-xs font-bold transition", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) }) })
                  ] }, program.id || idx)),
                  /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => {
                    const newId = custLandingConfig.programs?.length > 0 ? Math.max(...custLandingConfig.programs.map((p) => p.id || 0)) + 1 : 1;
                    const newItem = { id: newId, title: "Program Baru", desc: "Deskripsi", tag: "INFO" };
                    setCustLandingConfig({ ...custLandingConfig, programs: [...custLandingConfig.programs || [], newItem] });
                  }, className: "text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition", children: [
                    /* @__PURE__ */ jsx(Plus, { className: "h-3.5 w-3.5" }),
                    " Tambah Program"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Bagian: Biaya & Transparansi" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Judul Biaya" }),
                  /* @__PURE__ */ jsx("input", { type: "text", value: custLandingConfig.biayaTitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, biayaTitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-700", children: "Subjudul Biaya" }),
                  /* @__PURE__ */ jsx("textarea", { value: custLandingConfig.biayaSubtitle || "", onChange: (e) => setCustLandingConfig({ ...custLandingConfig, biayaSubtitle: e.target.value }), className: "w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-hidden focus:border-indigo-500 transition", rows: 2 })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100", children: "Bagian: Gambar Kesempatan (3 Foto Utama)" }),
              custLandingConfig.opportunityImages && custLandingConfig.opportunityImages.length >= 3 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [0, 1, 2].map((idx) => /* @__PURE__ */ jsxs("div", { className: "space-y-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-700 block", children: [
                    "Label Gambar ",
                    idx + 1
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: custLandingConfig.opportunityImages[idx].label || "",
                      onChange: (e) => {
                        const newImages = [...custLandingConfig.opportunityImages];
                        newImages[idx] = { ...newImages[idx], label: e.target.value };
                        setCustLandingConfig({ ...custLandingConfig, opportunityImages: newImages });
                      },
                      className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsxs("label", { className: "text-xs font-bold text-slate-700 block", children: [
                    "Link Gambar (URL) atau Upload ",
                    idx + 1
                  ] }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "https://images.unsplash.com/...",
                      value: custLandingConfig.opportunityImages[idx].url || "",
                      onChange: (e) => {
                        const newImages = [...custLandingConfig.opportunityImages];
                        newImages[idx] = { ...newImages[idx], url: e.target.value };
                        setCustLandingConfig({ ...custLandingConfig, opportunityImages: newImages });
                      },
                      className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition mb-2"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        accept: "image/*",
                        onChange: (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setOppUploadStatus((prev) => ({ ...prev, [idx]: "loading" }));
                            uploadFileToFirebase(file, "customization").then((url) => {
                              const newImages = [...custLandingConfig.opportunityImages];
                              newImages[idx] = { ...newImages[idx], url };
                              const updatedConfig = { ...custLandingConfig, opportunityImages: newImages };
                              setCustLandingConfig(updatedConfig);
                              onUpdateState("customization", "update", { landingConfig: updatedConfig });
                              setOppUploadStatus((prev) => ({ ...prev, [idx]: "success" }));
                              setTimeout(() => setOppUploadStatus((prev) => ({ ...prev, [idx]: void 0 })), 3e3);
                            }).catch((err) => {
                              console.error(err);
                              alert("Gagal upload gambar");
                              setOppUploadStatus((prev) => ({ ...prev, [idx]: void 0 }));
                            });
                          }
                        },
                        className: "w-full text-xs rounded-md border border-slate-200 bg-white px-2 py-1.5 outline-hidden focus:border-indigo-500 transition"
                      }
                    ),
                    oppUploadStatus[idx] === "loading" && /* @__PURE__ */ jsxs("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-white px-1", children: [
                      /* @__PURE__ */ jsx(LoaderCircle, { className: "w-3 h-3 animate-spin" }),
                      " Uploading..."
                    ] }),
                    oppUploadStatus[idx] === "success" && /* @__PURE__ */ jsxs("div", { className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-white px-1", children: [
                      /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }),
                      " Berhasil"
                    ] })
                  ] })
                ] }),
                custLandingConfig.opportunityImages[idx].url && /* @__PURE__ */ jsx("div", { className: "h-20 rounded border border-slate-200 bg-slate-100 overflow-hidden relative mt-2", children: /* @__PURE__ */ jsx("img", { src: custLandingConfig.opportunityImages[idx].url, alt: "Preview", className: "w-full h-full object-cover" }) })
              ] }, idx)) })
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-slate-100", children: /* @__PURE__ */ jsx(
            ConfirmForm,
            {
              confirmTitle: "Simpan Halaman Depan",
              confirmMessage: "Menerapkan teks ini ke beranda publik secara instan?",
              onSubmit: async (e) => {
                e.preventDefault();
                const ok = await onUpdateState("customization", "update", {
                  landingConfig: custLandingConfig
                });
                if (ok) {
                  setLandingSaveSuccess(true);
                  setTimeout(() => setLandingSaveSuccess(false), 3e3);
                }
              },
              children: /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "submit",
                  className: "bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs",
                  children: [
                    /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
                    landingSaveSuccess ? "Berhasil Disimpan!" : "Simpan Halaman Depan"
                  ]
                }
              )
            }
          ) })
        ] })
      ] }),
      activeSegment === "galeri" && /* @__PURE__ */ jsx(
        AdminGaleriSegment,
        {
          custGallery,
          setCustGallery,
          galleryUploadStatus,
          setGalleryUploadStatus,
          onUpdateState
        }
      ),
      activeSegment === "petasebaran" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 shadow-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 pb-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-sans font-black text-slate-900 text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-6 w-6 text-red-600" }),
            "DATA PETA SEBARAN ALUMNI LPK"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Gunakan form di bawah ini untuk memasukkan atau memperbarui sebaran geografis alumni LPK yang bekerja di Jepang agar muncul secara real-time di OpenStreetMap." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative z-10 mb-6", children: /* @__PURE__ */ jsx("div", { ref: adminMapRef, className: "w-full h-full z-10 relative" }) }),
        /* @__PURE__ */ jsx("div", { className: "w-full flex justify-start", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setIsCreateMapModalOpen(true),
            className: "bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " Input Data Sebaran Alumni"
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] uppercase font-black tracking-wider text-slate-450 font-mono block", children: [
              "\u{1F4CB} Daftar Sebaran Alumni Terdaftar ",
              selectedMapPref ? `di ${selectedMapPref}` : "",
              " (",
              systemState.activeStudents?.filter(
                (s) => s.status === "Di Jepang" && (!selectedMapPref || s.prefecture === selectedMapPref || s.city === selectedMapPref)
              ).length || 0,
              " ",
              "Orang)"
            ] }),
            selectedMapPref && /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => {
                  setSelectedMapPref(null);
                  if (adminMapInstanceRef.current) {
                    adminMapInstanceRef.current.setView([36.2048, 138.2529], 5);
                  }
                },
                className: "bg-red-50 hover:bg-red-100 text-red-700 font-extrabold py-1 px-2.5 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer border border-red-100 flex items-center gap-1 shadow-xs",
                children: [
                  "\u274C Bersihkan Filter (",
                  selectedMapPref,
                  ")"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [
            /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "bg-slate-50 border-b border-slate-100", children: [
              /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase", children: "Nama Alumni" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase font-bold text-center", children: "Wilayah Jepang" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase", children: "Instansi / Perusahaan" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase", children: "Koordinat (Lat, Lng)" }),
              /* @__PURE__ */ jsx("th", { className: "p-3 text-[10px] font-bold text-slate-500 uppercase text-right", children: "Aksi" })
            ] }) }),
            /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-slate-100", children: [
              systemState.activeStudents?.filter((s) => s.status === "Di Jepang").filter((student) => {
                if (!selectedMapPref) return true;
                return student.prefecture === selectedMapPref || student.city === selectedMapPref;
              }).map((student) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: "hover:bg-slate-50/50 transition",
                  children: [
                    /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-extrabold text-slate-900", children: student.name }),
                      /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-400 font-semibold font-sans", children: [
                        student.batch,
                        " ",
                        student.graduationYear ? `| Lulus ${student.graduationYear}` : ""
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("td", { className: "p-3 text-center", children: [
                      /* @__PURE__ */ jsxs("span", { className: "bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase", children: [
                        "\u{1F1EF}\u{1F1F5} ",
                        student.prefecture || "Tokyo"
                      ] }),
                      student.city && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono mt-0.5", children: student.city })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800", children: student.company || "-" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3 font-mono text-[10px] text-slate-500", children: student.latitude !== void 0 && student.latitude !== null && student.longitude !== void 0 && student.longitude !== null ? /* @__PURE__ */ jsxs("span", { children: [
                      Number(student.latitude).toFixed(4),
                      ",",
                      " ",
                      Number(student.longitude).toFixed(4)
                    ] }) : /* @__PURE__ */ jsx("span", { className: "text-slate-300 italic", children: "Belum di-set" }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => {
                            setIsCreateMapModalOpen(true);
                            setMapIsEditing(student.id);
                            setMapStudentId(student.id);
                            setMapStudentName(student.name);
                            setMapPrefecture(
                              student.prefecture || "Tokyo"
                            );
                            setMapCity(student.city || "");
                            setMapCompany(student.company || "");
                            setMapLatitude(
                              student.latitude != null ? String(student.latitude) : ""
                            );
                            setMapLongitude(
                              student.longitude != null ? String(student.longitude) : ""
                            );
                            setMapGraduationYear(student.graduationYear || "");
                          },
                          className: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition cursor-pointer",
                          children: "Edit Lokasi"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        ConfirmButton,
                        {
                          confirmTitle: "Hapus Data Sebaran",
                          confirmMessage: `Hapus data alumni ${student.name} dari sistem?`,
                          onConfirmClick: () => onUpdateState("activeStudents", "delete", { id: student.id }),
                          className: "bg-rose-50 hover:bg-rose-100 text-rose-700 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition cursor-pointer",
                          title: "Hapus Data",
                          children: "Hapus"
                        }
                      )
                    ] }) })
                  ]
                },
                `${student.id}-${student.name}`
              )),
              (!systemState.activeStudents || systemState.activeStudents.filter(
                (s) => s.status === "Di Jepang"
              ).length === 0) && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
                "td",
                {
                  colSpan: 5,
                  className: "p-8 text-center text-slate-400 font-mono text-xs",
                  children: "Belum ada data alumni di Jepang dari LPK."
                }
              ) })
            ] })
          ] }) }) })
        ] })
      ] }),
      activeSegment === "afiliasi" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 pb-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-sans font-black text-slate-900 text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Share2, { className: "h-6 w-6 text-rose-500" }),
            "Data Afiliasi & Rekomendasi Alumni"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Sistem monitoring rujukan pendaftaran. Pantau kontribusi alumni dalam mendatangkan siswa baru secara real-time." })
        ] }),
        (() => {
          const allReferred = [
            ...(systemState.registeredStudents || []).filter((s) => s.referrer).map((s) => ({
              id: s.id,
              name: s.name,
              status: s.status,
              referrer: s.referrer || "unknown",
              date: s.date || "-",
              type: "registered"
            })),
            ...(systemState.activeStudents || []).filter((s) => s.referrer).map((s) => ({
              id: s.id,
              name: s.name,
              status: s.status,
              referrer: s.referrer || "unknown",
              date: "-",
              type: "active"
            }))
          ];
          const referrerMap = {};
          allReferred.forEach((s) => {
            const ref = s.referrer;
            if (!referrerMap[ref]) {
              const matchedUser = (systemState.users || []).find((u) => u.username === ref);
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
            if (s.type === "active") {
              referrerMap[ref].activeCount += 1;
            } else {
              referrerMap[ref].registeredCount += 1;
            }
            referrerMap[ref].students.push(s);
          });
          const referrersList = Object.values(referrerMap).sort((a, b) => b.total - a.total);
          const filteredReferrers = referrersList.filter(
            (r) => r.username.toLowerCase().includes(affiliateSearch.toLowerCase()) || r.realName.toLowerCase().includes(affiliateSearch.toLowerCase())
          );
          let displayedStudents = allReferred;
          if (selectedReferrer !== "all") {
            displayedStudents = displayedStudents.filter((s) => s.referrer === selectedReferrer);
          }
          if (affiliateSearch) {
            displayedStudents = displayedStudents.filter(
              (s) => s.name.toLowerCase().includes(affiliateSearch.toLowerCase()) || s.referrer.toLowerCase().includes(affiliateSearch.toLowerCase())
            );
          }
          const totalReferrals = allReferred.length;
          const activeReferrals = allReferred.filter((s) => s.type === "active").length;
          const registeredReferrals = allReferred.filter((s) => s.type === "registered").length;
          const totalAlumniCount = referrersList.length;
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-rose-50 border border-rose-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs", children: [
                /* @__PURE__ */ jsx("div", { className: "h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-rose-600 border border-rose-100", children: /* @__PURE__ */ jsx(Users, { className: "h-6 w-6" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-rose-700 font-extrabold uppercase tracking-wider", children: "Total Referral" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-800 leading-tight", children: [
                    totalReferrals,
                    " Siswa"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-teal-50 border border-teal-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs", children: [
                /* @__PURE__ */ jsx("div", { className: "h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-teal-600 border border-teal-100", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-6 w-6" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-teal-700 font-extrabold uppercase tracking-wider", children: "Siswa Dilatih" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-800 leading-tight", children: [
                    activeReferrals,
                    " Siswa"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-amber-50 border border-amber-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs", children: [
                /* @__PURE__ */ jsx("div", { className: "h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-amber-600 border border-amber-100", children: /* @__PURE__ */ jsx(Plus, { className: "h-6 w-6" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-amber-700 font-extrabold uppercase tracking-wider", children: "Pendaftar Baru" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-800 leading-tight", children: [
                    registeredReferrals,
                    " Calon"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-purple-50 border border-purple-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs", children: [
                /* @__PURE__ */ jsx("div", { className: "h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-purple-600 border border-purple-100", children: /* @__PURE__ */ jsx(Award, { className: "h-6 w-6" }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-[10px] text-purple-700 font-extrabold uppercase tracking-wider", children: "Alumni Mereferensi" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xl font-black text-slate-800 leading-tight", children: [
                    totalAlumniCount,
                    " Alumni"
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
                /* @__PURE__ */ jsx("span", { className: "absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400", children: /* @__PURE__ */ jsx(Search, { className: "h-4 w-4" }) }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Cari nama siswa atau username alumni...",
                    value: affiliateSearch,
                    onChange: (e) => setAffiliateSearch(e.target.value),
                    className: "w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all font-sans"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2 shrink-0", children: [
                selectedReferrer !== "all" && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => setSelectedReferrer("all"),
                    className: "bg-rose-100 hover:bg-rose-200/80 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 animate-fade-in",
                    children: [
                      /* @__PURE__ */ jsx(Filter, { className: "h-3.5 w-3.5" }),
                      /* @__PURE__ */ jsxs("span", { children: [
                        "Filter: ",
                        referrerMap[selectedReferrer]?.realName,
                        " (X)"
                      ] })
                    ]
                  }
                ),
                (affiliateSearch || selectedReferrer !== "all") && /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setAffiliateSearch("");
                      setSelectedReferrer("all");
                    },
                    className: "bg-slate-200 hover:bg-slate-300/80 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer",
                    children: "Reset Filter"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 space-y-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between px-1", children: /* @__PURE__ */ jsxs("span", { className: "text-[10.5px] font-black text-slate-450 uppercase tracking-widest font-mono", children: [
                  "Daftar Alumni Mereferensikan (",
                  filteredReferrers.length,
                  ")"
                ] }) }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-[500px] overflow-y-auto pr-1", children: filteredReferrers.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-slate-50 border border-slate-150 p-6 rounded-2xl text-center text-slate-400 text-xs italic", children: "Tidak ada alumni yang sesuai kata kunci pencarian." }) : filteredReferrers.map((alumnus) => {
                  const isCurrentSelected = selectedReferrer === alumnus.username;
                  return /* @__PURE__ */ jsxs(
                    "div",
                    {
                      onClick: () => setSelectedReferrer(isCurrentSelected ? "all" : alumnus.username),
                      className: `p-4 rounded-2xl border transition-all cursor-pointer text-left ${isCurrentSelected ? "bg-rose-50/70 border-rose-350 shadow-xs ring-2 ring-rose-100" : "bg-white hover:bg-slate-50/70 border-slate-200 hover:border-slate-300"}`,
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
                          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                            /* @__PURE__ */ jsxs("p", { className: "font-sans font-extrabold text-slate-855 text-xs flex items-center gap-1.5", children: [
                              /* @__PURE__ */ jsx("span", { children: "\u{1F469}\u200D\u{1F393}" }),
                              " ",
                              alumnus.realName
                            ] }),
                            /* @__PURE__ */ jsxs("p", { className: "font-mono text-[9.5px] text-slate-400 font-bold block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded max-w-fit leading-none", children: [
                              "Ref Code: ",
                              alumnus.username
                            ] })
                          ] }),
                          /* @__PURE__ */ jsx("div", { className: "text-right", children: /* @__PURE__ */ jsxs("span", { className: "text-xs font-black font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100", children: [
                            alumnus.total,
                            " Siswa"
                          ] }) })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "mt-3.5 space-y-1", children: [
                          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-[8.5px] text-slate-400 font-bold", children: [
                            /* @__PURE__ */ jsxs("span", { children: [
                              "Aktif: ",
                              alumnus.activeCount
                            ] }),
                            /* @__PURE__ */ jsxs("span", { children: [
                              "Pendaftar: ",
                              alumnus.registeredCount
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex", children: [
                            /* @__PURE__ */ jsx(
                              "div",
                              {
                                className: "bg-teal-500 h-full transition-all duration-350",
                                style: { width: `${alumnus.activeCount / alumnus.total * 100}%` }
                              }
                            ),
                            /* @__PURE__ */ jsx(
                              "div",
                              {
                                className: "bg-amber-400 h-full transition-all duration-350",
                                style: { width: `${alumnus.registeredCount / alumnus.total * 100}%` }
                              }
                            )
                          ] })
                        ] })
                      ]
                    },
                    alumnus.username
                  );
                }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 space-y-3", children: [
                /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between px-1", children: /* @__PURE__ */ jsx("span", { className: "text-[10.5px] font-black text-slate-450 uppercase tracking-widest font-mono", children: selectedReferrer === "all" ? `Seluruh Siswa Hasil Rujukan (${displayedStudents.length})` : `Siswa Dirujuk oleh ${referrerMap[selectedReferrer]?.realName} (${displayedStudents.length})` }) }),
                /* @__PURE__ */ jsx("div", { className: "border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
                  /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-black tracking-wider text-[9.5px]", children: /* @__PURE__ */ jsxs("tr", { children: [
                    /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Nama Siswa" }),
                    /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Referral Dari" }),
                    /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
                    /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Rincian" })
                  ] }) }),
                  /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100", children: displayedStudents.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "px-4 py-12 text-center text-slate-400 italic", children: "Belum ada data pendaftar untuk kriteria ini." }) }) : displayedStudents.map((student, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50/50 transition duration-150", children: [
                    /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5", children: [
                      /* @__PURE__ */ jsx("p", { className: "font-extrabold text-slate-800 text-[11px] font-sans", children: student.name }),
                      /* @__PURE__ */ jsx("p", { className: "text-[9px] text-slate-400 font-mono mt-0.5", children: student.id })
                    ] }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5", children: /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setSelectedReferrer(student.referrer),
                        className: "text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-1 rounded-lg border border-rose-100/50 transition text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer",
                        children: /* @__PURE__ */ jsxs("span", { children: [
                          "\u{1F464} ",
                          referrerMap[student.referrer]?.realName || student.referrer
                        ] })
                      }
                    ) }),
                    /* @__PURE__ */ jsx("td", { className: "px-4 py-3.5", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-lg text-[9px] font-black uppercase ${student.type === "active" ? "bg-teal-50 text-teal-700 border border-teal-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`, children: student.type === "active" ? "Siswa Aktif" : "Pendaftaran" }) }),
                    /* @__PURE__ */ jsxs("td", { className: "px-4 py-3.5", children: [
                      /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-600 block text-[10.5px]", children: student.status }),
                      student.date !== "-" && /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-slate-400 block font-mono", children: [
                        "Tgl: ",
                        student.date
                      ] })
                    ] })
                  ] }, idx)) })
                ] }) }) })
              ] })
            ] })
          ] });
        })()
      ] }),
      activeSegment === "informasi" && /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "border-b border-slate-100 pb-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-sans font-black text-slate-900 text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bell, { className: "h-6 w-6 text-yellow-500" }),
            "BROADCAST INFORMASI LPK"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Atur teks berjalan (marquee) yang akan tampil di halaman Beranda utama untuk semua pengguna." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4 max-w-2xl", children: [
          /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block", children: "Teks Berjalan (Marquee)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: custRunningText || "",
              onChange: (e) => setCustRunningText(e.target.value),
              className: "w-full text-sm rounded-xl border border-slate-200 p-4 outline-none focus:border-indigo-500 transition min-h-[120px] bg-white shadow-inner text-slate-800",
              placeholder: "Masukkan info terkini yang akan berjalan di layar utama..."
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-500 flex items-center justify-between gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-yellow-500 text-lg", children: "\u{1F4A1}" }),
              "Gunakan simbol | (garis vertikal) untuk memisahkan pengumuman."
            ] }),
            /* @__PURE__ */ jsx(
              ConfirmForm,
              {
                confirmTitle: "Simpan Teks Berjalan",
                confirmMessage: "Menerapkan teks berjalan baru ini ke beranda publik secara instan?",
                onSubmit: async (e) => {
                  e.preventDefault();
                  const ok = await onUpdateState("customization", "update", {
                    runningText: custRunningText
                  });
                  if (ok) {
                    setRunningTextSaveSuccess(true);
                    setTimeout(() => setRunningTextSaveSuccess(false), 3e3);
                  }
                },
                children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    className: "bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-2xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs",
                    children: [
                      /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
                      runningTextSaveSuccess ? "Berhasil Disimpan!" : "Simpan Teks Berjalan"
                    ]
                  }
                )
              }
            )
          ] })
        ] })
      ] }),
      activeSegment === "kelas" && /* @__PURE__ */ jsx(
        AdminKelasSegment,
        {
          systemState,
          onUpdateState,
          selectedClassForChapters,
          setSelectedClassForChapters,
          activeChapterTab,
          setActiveChapterTab,
          newChapterNumber,
          setNewChapterNumber,
          newChapterTitle,
          setNewChapterTitle,
          newChapterJapaneseTitle,
          setNewChapterJapaneseTitle,
          newChapterDesc,
          setNewChapterDesc,
          editingChapterNumber,
          setEditingChapterNumber
        }
      ),
      activeSegment === "kalender" && /* @__PURE__ */ jsx("div", { className: "bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs", children: /* @__PURE__ */ jsx(
        CalendarView,
        {
          systemState,
          currentUser: currentUser || null,
          onUpdateState,
          adminMode: true
        }
      ) }),
      activeSegment === "manajemen" && /* @__PURE__ */ jsx("div", { className: "w-full animate-fade-in text-slate-800", children: /* @__PURE__ */ jsx(
        AccountSettingsView,
        {
          currentUser,
          systemState,
          onUpdateState,
          onLoginSuccess: () => {
          },
          onOpenLogin: () => {
          },
          initialTab: "manajemen"
        }
      ) }),
      isCreateInventoryModalOpen && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-indigo-100 text-indigo-700 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(ShoppingBag, { className: "h-4 w-4" }) }),
              "Registrasi Inventaris Baru"
            ] }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsCreateInventoryModalOpen(false),
                className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs(
            ConfirmForm,
            {
              confirmTitle: "Tambah Inventaris",
              confirmMessage: "Tambahkan rincian inventaris aset lpk baru ini?",
              onSubmit: async (e) => {
                await handleNewInventorySubmit(e);
                setIsCreateInventoryModalOpen(false);
              },
              className: "space-y-4 text-xs",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Nama Barang / Aset" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: true,
                        placeholder: "Contoh: AC Daikin 1.5 PK",
                        value: invName,
                        onChange: (e) => setInvName(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Volume / Jumlah" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        required: true,
                        placeholder: "Contoh: 10",
                        value: invAmount,
                        onChange: (e) => setInvAmount(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Kondisi Saat Ini" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: invCondition,
                        onChange: (e) => setInvCondition(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Baik", children: "Berfungsi Baik (Sehat)" }),
                          /* @__PURE__ */ jsx("option", { value: "Perlu Servis", children: "Sedikit Rusak / Perlu Pemelihara" }),
                          /* @__PURE__ */ jsx("option", { value: "Rusak", children: "Rusak Parah / Mati Total" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Penempatan Area" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: invLoc,
                        onChange: (e) => setInvLoc(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Kantor", children: "Kantor Utama Manajemen" }),
                          /* @__PURE__ */ jsx("option", { value: "Asrama Putra", children: "Rumah Asrama Putra" }),
                          /* @__PURE__ */ jsx("option", { value: "Asrama Putri", children: "Rumah Asrama Putri" }),
                          (systemState.customization?.lmsClasses || []).map((cls) => /* @__PURE__ */ jsxs("option", { value: `Kelas ${cls.name}`, children: [
                            "Ruang Belajar ",
                            cls.name
                          ] }, cls.id))
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-slate-100", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    className: "w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                      " Daftarkan Alat"
                    ]
                  }
                ) })
              ]
            }
          ) })
        ] }) }),
        document.body
      ),
      (isCreateMapModalOpen || mapIsEditing) && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-red-100 text-red-600 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }) }),
              mapIsEditing ? "Edit Data Sebaran Alumni" : "Input Data Sebaran Alumni"
            ] }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setIsCreateMapModalOpen(false);
                  setMapIsEditing(null);
                },
                className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 overflow-y-auto space-y-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono block", children: mapIsEditing ? `\u270F\uFE0F Mengedit Alumni ID: ${mapIsEditing}` : "\u2795 Tambah / Perbarui Lokasi" }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Pilih Siswa / Alumni" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: mapStudentId,
                  onChange: (e) => {
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
                        (s) => s.id === val
                      );
                      if (found) {
                        setMapStudentName(found.name);
                        setMapBatch(found.batch || "Angkatan 11");
                        setMapPrefecture(found.prefecture || "Tokyo");
                        setMapCity(found.city || "");
                        setMapCompany(found.company || "");
                        setMapLatitude(
                          found.latitude != null ? String(found.latitude) : ""
                        );
                        setMapLongitude(
                          found.longitude != null ? String(found.longitude) : ""
                        );
                        setMapGraduationYear(found.graduationYear || "");
                      }
                    }
                  },
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "-- Hubungkan dengan Siswa Aktif --" }),
                    /* @__PURE__ */ jsx("option", { value: "new", children: "\u{1F195} Alumni Baru / Tulis Manual" }),
                    (systemState.activeStudents || []).sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((s) => /* @__PURE__ */ jsxs("option", { value: s.id, children: [
                      s.name,
                      " (",
                      s.status,
                      " - ",
                      s.class,
                      ")"
                    ] }, s.id))
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Nama Alumni / Siswa" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Nama lengkap alumni...",
                  value: mapStudentName,
                  onChange: (e) => setMapStudentName(e.target.value),
                  disabled: mapStudentId !== "new" && mapStudentId !== "",
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Angkatan" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Contoh: Angkatan 11, Angkatan 12...",
                  value: mapBatch,
                  onChange: (e) => setMapBatch(e.target.value),
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase block", children: "\u{1F4CD} Preset Cepat Koordinat (48 Prefektur)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Cari prefektur...",
                    value: presetSearch,
                    onChange: (e) => setPresetSearch(e.target.value),
                    className: "text-[10px] px-2 py-1 border border-slate-200 rounded-lg bg-white max-w-[140px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1 max-h-[120px] overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50", children: Object.keys(ALL_48_PREFECTURES_COORDINATES).filter((p) => p.toLowerCase().includes(presetSearch.toLowerCase())).map((pref) => {
                const coords = ALL_48_PREFECTURES_COORDINATES[pref];
                return /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      setMapPrefecture(pref);
                      setMapCity(pref);
                      setMapLatitude(coords[0].toString());
                      setMapLongitude(coords[1].toString());
                    },
                    className: "bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-700 text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-200 transition active:scale-95 cursor-pointer",
                    children: pref
                  },
                  pref
                );
              }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Prefektur di Jepang" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  value: mapPrefecture,
                  onChange: (e) => {
                    const val = e.target.value;
                    setMapPrefecture(val);
                    if (ALL_48_PREFECTURES_COORDINATES[val]) {
                      setMapLatitude(ALL_48_PREFECTURES_COORDINATES[val][0].toString());
                      setMapLongitude(ALL_48_PREFECTURES_COORDINATES[val][1].toString());
                    }
                  },
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500",
                  children: JAPAN_PREFECTURES.map((pref) => /* @__PURE__ */ jsx("option", { value: pref, children: pref }, pref))
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Nama Kota / Area Spesifik" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Contoh: Shinjuku, Yodogawa, Uji",
                  value: mapCity,
                  onChange: (e) => setMapCity(e.target.value),
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Pasangan Kerja / Perusahaan" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Contoh: Tokyo Luxury Care, Sanko Delica",
                  value: mapCompany,
                  onChange: (e) => setMapCompany(e.target.value),
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-slate-500 uppercase", children: "Latitude (Lintang)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "any",
                    placeholder: "Contoh: 35.6895",
                    value: mapLatitude,
                    onChange: (e) => setMapLatitude(e.target.value),
                    className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[9px] font-bold text-slate-500 uppercase", children: "Longitude (Bujur)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    step: "any",
                    placeholder: "Contoh: 139.6917",
                    value: mapLongitude,
                    onChange: (e) => setMapLongitude(e.target.value),
                    className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Tahun Lulus" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "Contoh: 2024",
                  value: mapGraduationYear,
                  onChange: (e) => setMapGraduationYear(e.target.value),
                  className: "w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "pt-2 flex gap-2", children: [
              mapIsEditing && /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
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
                  },
                  className: "w-1/3 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold py-2.5 px-3 rounded-xl transition uppercase cursor-pointer",
                  children: "Batal"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: async () => {
                    if (!mapStudentName) {
                      alert("Silakan masukkan nama alumni / siswa.");
                      return;
                    }
                    const latVal = mapLatitude && String(mapLatitude).trim() !== "" ? Number(mapLatitude) : null;
                    const lngVal = mapLongitude && String(mapLongitude).trim() !== "" ? Number(mapLongitude) : null;
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
                          longitude: lngVal !== null && !isNaN(lngVal) ? lngVal : null
                        }
                      );
                      if (ok) {
                        alert("Lokasi alumni berhasil diperbarui!");
                      }
                    } else {
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
                          longitude: lngVal !== null && !isNaN(lngVal) ? lngVal : null
                        }
                      );
                      if (ok) {
                        alert(
                          "Alumni baru berhasil ditambah ke peta sebaran!"
                        );
                      }
                    }
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
                  },
                  className: "flex-1 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-black py-2.5 px-3 rounded-xl transition uppercase tracking-wider shadow-xs cursor-pointer",
                  children: mapIsEditing ? "Simpan Perubahan" : "Simpan Lokasi Alumni"
                }
              )
            ] })
          ] })
        ] }) }),
        document.body
      ),
      isCreateTaxModalOpen && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-indigo-100 text-indigo-700 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }) }),
              "Rekor Bulan Keuangan"
            ] }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsCreateTaxModalOpen(false),
                className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs(
            ConfirmForm,
            {
              confirmTitle: "Simpan Pajak/Jurnal Masuk",
              confirmMessage: "Simpan pembukuan bulan ini ke log pajak?",
              onSubmit: async (e) => {
                await handleNewTaxSubmit(e);
                setIsCreateTaxModalOpen(false);
              },
              className: "space-y-4 text-xs",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Masa / Bulan Buku" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: true,
                        placeholder: "Contoh: Juni 2026",
                        value: taxMonth,
                        onChange: (e) => setTaxMonth(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Omzet Pendapatan (Rupiah)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          required: true,
                          placeholder: "Contoh: 120000000",
                          value: taxRev,
                          onChange: (e) => setTaxRev(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Beban Pengeluaran (Rupiah)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          required: true,
                          placeholder: "Contoh: 60000000",
                          value: taxExp,
                          onChange: (e) => setTaxExp(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-hidden focus:border-blue-500"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-slate-50/50 p-4 rounded-xl text-[11px] text-slate-600 border border-slate-200 mt-2", children: [
                    "Sistem pajak menghitung estimasi",
                    " ",
                    /* @__PURE__ */ jsx("strong", { children: "Pajak PPN LPK sebesar 11%" }),
                    " dari selisih bersih pendapatan bulanan untuk pelaporan masa e-Faktur Pajak Kemnaker."
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-slate-100", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    className: "w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
                      " Simpan Jurnal Masa"
                    ]
                  }
                ) })
              ]
            }
          ) })
        ] }) }),
        document.body
      ),
      isEditTaxModalOpen && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "bg-blue-100 text-blue-700 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" }) }),
              "Edit Rekor Pajak"
            ] }) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setIsEditTaxModalOpen(false);
                  resetTaxForm();
                },
                className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs(
            ConfirmForm,
            {
              confirmTitle: "Simpan Perubahan",
              confirmMessage: "Anda yakin ingin menyimpan perubahan pada rekor pajak ini?",
              onSubmit: handleEditTaxSubmit,
              className: "space-y-4 text-xs",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Masa / Bulan Buku" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: true,
                        value: taxMonth,
                        onChange: (e) => setTaxMonth(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Omzet Pendapatan (Rupiah)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          required: true,
                          value: taxRev,
                          onChange: (e) => setTaxRev(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold block text-slate-700", children: "Beban Pengeluaran (Rupiah)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "number",
                          required: true,
                          value: taxExp,
                          onChange: (e) => setTaxExp(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-blue-500"
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4 border-t border-slate-100", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    className: "w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl transition text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm",
                    children: [
                      /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" }),
                      " Simpan Perubahan"
                    ]
                  }
                ) })
              ]
            }
          ) })
        ] }) }),
        document.body
      ),
      previewTaxFile && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden relative", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2 text-sm", children: [
              /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-blue-600" }),
              "Pratinjau: ",
              previewTaxFileName
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  setPreviewTaxFile(null);
                  setPreviewTaxFileName("");
                },
                className: "p-1.5 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-hidden bg-slate-100 p-4", children: /* @__PURE__ */ jsx(
            "object",
            {
              data: previewTaxFile,
              type: previewTaxFile.startsWith("data:application/pdf") ? "application/pdf" : "image/jpeg",
              className: "w-full h-full rounded-xl shadow-sm",
              children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center h-full text-slate-500 space-y-3", children: [
                /* @__PURE__ */ jsx(Eye, { className: "h-10 w-10 text-slate-300" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Tidak dapat menampilkan pratinjau" })
              ] })
            }
          ) })
        ] }) }),
        document.body
      ),
      isCreateJobOrderModalOpen && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "bg-indigo-100 text-indigo-700 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }) }),
                "Buat Job Order Baru"
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono mt-1", children: "Pastikan rincian gaji, tunjangan, dan overtime tertulis jelas demi transparansi." })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setIsCreateJobOrderModalOpen(false),
                className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs(
            ConfirmForm,
            {
              confirmTitle: "Terbitkan Lowongan",
              confirmMessage: "Anda yakin ingin menerbitkan data Job Order baru ini?",
              onSubmit: async (e) => {
                e.preventDefault();
                if (!jobPartnerName || !jobOccupation || !jobLocation || !jobSalary) {
                  alert("Harap isi semua kolom wajib!");
                  return;
                }
                const ok = await onUpdateState("jobOrders", "add", {
                  partnerName: jobPartnerName,
                  noReg: jobNoReg,
                  jobType,
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
                  jobDescription,
                  minJapaneseScore: jobMinJapaneseScore,
                  minAttendanceScore: jobMinAttendanceScore,
                  minFiveSScore: jobMinFiveSScore,
                  minMathScore: jobMinMathScore,
                  minEthicsScore: jobMinEthicsScore
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
              },
              className: "space-y-4",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "PT Mitra / Agency Rekanan (Wajib)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      placeholder: "Contoh: PT Fuji Tokutei Agency Tokyo",
                      value: jobPartnerName,
                      onChange: (e) => setJobPartnerName(e.target.value),
                      className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "No Registrasi (Opsional)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        placeholder: "Contoh: R-1234",
                        value: jobNoReg,
                        onChange: (e) => setJobNoReg(e.target.value),
                        className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Jenis Visa / Program" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: jobType,
                        onChange: (e) => setJobType(e.target.value),
                        className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Tokutei ginou", children: "Tokutei ginou" }),
                          /* @__PURE__ */ jsx("option", { value: "Ginou jisshusei", children: "Ginou jisshusei" }),
                          /* @__PURE__ */ jsx("option", { value: "Ryugakusei", children: "Ryugakusei" }),
                          /* @__PURE__ */ jsx("option", { value: "Engineering", children: "Engineering" })
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Bidang Pekerjaan (Wajib)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        required: true,
                        placeholder: "Contoh: Pengolahan Makanan / Perawat Lansia",
                        value: jobOccupation,
                        onChange: (e) => setJobOccupation(e.target.value),
                        className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Lokasi / Prefektur (Wajib)" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        required: true,
                        value: jobLocation,
                        onChange: (e) => setJobLocation(e.target.value),
                        className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Lokasi --" }),
                          JAPAN_PREFECTURES.map((pref) => /* @__PURE__ */ jsx("option", { value: pref, children: pref }, pref))
                        ]
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Rincian Gaji (Wajib)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      required: true,
                      placeholder: "Contoh: \xA5180,000 / Bulan (Take home pay)",
                      value: jobSalary,
                      onChange: (e) => setJobSalary(e.target.value),
                      className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Tunjangan (Opsional)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        placeholder: "Contoh: Asrama, Asuransi",
                        value: jobAllowance,
                        onChange: (e) => setJobAllowance(e.target.value),
                        className: "w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Estimasi Lembur" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        placeholder: "Contoh: ~20 Jam / Bulan",
                        value: jobOvertime,
                        onChange: (e) => setJobOvertime(e.target.value),
                        className: "w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Durasi Kontrak" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 3 Tahun (Bisa diperpanjang)",
                      value: jobContractDuration,
                      onChange: (e) => setJobContractDuration(e.target.value),
                      className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 rounded-2xl p-4 bg-indigo-50/30 space-y-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-black uppercase text-indigo-700 block border-b border-indigo-100 pb-2", children: "Pengaturan Jadwal Proses (Sinkron LMS Siswa)" }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "1. Pendaftaran" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 1-10 Mei 2026",
                          value: jobScheduleRegistration,
                          onChange: (e) => setJobScheduleRegistration(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "2. Seleksi Dokumen" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 11-14 Mei 2026",
                          value: jobScheduleDocumentSelection,
                          onChange: (e) => setJobScheduleDocumentSelection(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "3. Pelaksanaan Interview" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: Online (Zoom)",
                          value: jobIntvExec,
                          onChange: (e) => setJobIntvExec(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Jadwal Interview" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 15-20 Mei 2026",
                          value: jobIntvDate,
                          onChange: (e) => setJobIntvDate(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "4. Pengumuman Kelulusan" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 25 Mei 2026",
                          value: jobScheduleAnnouncement,
                          onChange: (e) => setJobScheduleAnnouncement(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "5. Medical Check Up" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 26-30 Mei 2026",
                          value: jobScheduleMcu,
                          onChange: (e) => setJobScheduleMcu(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-black uppercase text-slate-600 block border-b border-slate-200 pb-2", children: "Syarat Kualifikasi" }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Gender" }),
                      /* @__PURE__ */ jsxs(
                        "select",
                        {
                          value: jobGender,
                          onChange: (e) => setJobGender(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500",
                          children: [
                            /* @__PURE__ */ jsx("option", { value: "", children: "Bebas" }),
                            /* @__PURE__ */ jsx("option", { value: "Laki-laki", children: "Laki-laki Saja" }),
                            /* @__PURE__ */ jsx("option", { value: "Perempuan", children: "Perempuan Saja" })
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Usia Max" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 30",
                          value: jobAgeRequirement,
                          onChange: (e) => setJobAgeRequirement(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Tinggi (cm)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 160",
                          value: jobTbReq,
                          onChange: (e) => setJobTbReq(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Berat (kg)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 50",
                          value: jobBbReq,
                          onChange: (e) => setJobBbReq(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min B. Jepang" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: BAB 15",
                          value: jobMinJapaneseScore,
                          onChange: (e) => setJobMinJapaneseScore(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Absensi (%)" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 80",
                          value: jobMinAttendanceScore,
                          onChange: (e) => setJobMinAttendanceScore(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Nilai 5S" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 80",
                          value: jobMinFiveSScore,
                          onChange: (e) => setJobMinFiveSScore(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Nilai MTK" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          placeholder: "Contoh: 90",
                          value: jobMinMathScore,
                          onChange: (e) => setJobMinMathScore(e.target.value),
                          className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500 block", children: "Min Nilai Etika" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        placeholder: "Contoh: 80",
                        value: jobMinEthicsScore,
                        onChange: (e) => setJobMinEthicsScore(e.target.value),
                        className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    className: "w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black uppercase tracking-wider transition cursor-pointer shadow-sm mt-4",
                    children: "Publish Job Order \u{1F680}"
                  }
                )
              ]
            }
          ) })
        ] }) }),
        document.body
      ),
      editingJobOrder && /* @__PURE__ */ jsx(
        EditJobOrderModal,
        {
          job: editingJobOrder,
          onClose: () => setEditingJobOrder(null),
          onUpdateState
        }
      ),
      adminEditingStudentId && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "bg-indigo-100 text-indigo-700 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }) }),
                "Edit Data Lengkap Siswa"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-slate-500 font-mono mt-1 ml-9", children: [
                "ID: ",
                adminEditingStudentId
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              (() => {
                const activeStudentMatch = systemState.activeStudents.find((s) => s.id === adminEditingStudentId);
                const student = systemState.registeredStudents.find((s) => s.id === adminEditingStudentId) || systemState.registeredStudents.find((s) => s.name === activeStudentMatch?.name) || activeStudentMatch;
                if (!student) return null;
                return /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => {
                        setAdminEditingStudentId(null);
                        setVerifyingDocsStudent(student);
                      },
                      className: "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider",
                      children: [
                        /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
                        " Lihat Berkas"
                      ]
                    }
                  ),
                  student.proofOfPayment ? /* @__PURE__ */ jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => setViewingReceiptUrl(student.proofOfPayment || ""),
                      className: "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer text-[10px] font-bold uppercase tracking-wider",
                      children: [
                        /* @__PURE__ */ jsx(Receipt, { className: "h-4 w-4" }),
                        " Buka Penuh"
                      ]
                    }
                  ) : null
                ] });
              })(),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setAdminEditingStudentId(null),
                  className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
                  children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs(
            "form",
            {
              id: "adminRegForm",
              onSubmit: handleAdminSaveReg,
              className: "space-y-5",
              children: [
                adminRegError && /* @__PURE__ */ jsx("div", { className: "bg-red-50 text-red-600 p-3 text-xs rounded-xl border border-red-100 font-bold", children: adminRegError }),
                adminRegSuccess && /* @__PURE__ */ jsx("div", { className: "bg-emerald-50 text-emerald-600 p-3 text-xs rounded-xl border border-emerald-100 font-bold", children: "Data siswa berhasil diperbarui." }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Nama Lengkap *" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.name || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          name: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Program / Kelas" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.program || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          program: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "No WhatsApp *" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.phone || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          phone: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Alamat / Domisili" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.district || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          district: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Tanggal Lahir" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "date",
                        value: adminRegData.birthDate || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          birthDate: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Jenis Kelamin" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: adminRegData.gender || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          gender: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", children: "Pilih" }),
                          /* @__PURE__ */ jsx("option", { value: "Laki-laki", children: "Laki-laki" }),
                          /* @__PURE__ */ jsx("option", { value: "Perempuan", children: "Perempuan" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Pendidikan Terakhir" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.education || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          education: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Asal Sekolah" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.school || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          school: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Tahun Lulus" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        placeholder: "Contoh: 2024",
                        value: adminRegData.graduationYear || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          graduationYear: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1 md:col-span-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Kemampuan Bahasa Jepang" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: adminRegData.japaneseLevel || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          japaneseLevel: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Status Pendaftaran" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: adminRegData.statusPendaftaran || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          statusPendaftaran: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50 cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "Siswa Baru", children: "Siswa Baru" }),
                          /* @__PURE__ */ jsx("option", { value: "Alumni", children: "Alumni (Gratis Biaya)" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Email Pendaftaran *" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "email",
                        value: adminRegData.email || "",
                        onChange: (e) => setAdminRegData({
                          ...adminRegData,
                          email: e.target.value
                        }),
                        className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500 transition bg-slate-50"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-[10px] font-black text-slate-500 uppercase tracking-wider block", children: "Kata Sandi / Password (Login)" }),
                    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: showAdminRegPassword ? "text" : "password",
                          placeholder: "Belum diatur (bawaan: 123456)",
                          value: adminRegData.password || "",
                          onChange: (e) => setAdminRegData({
                            ...adminRegData,
                            password: e.target.value
                          }),
                          className: "w-full text-sm font-semibold rounded-xl border border-slate-200 px-3 py-2 pr-10 outline-none focus:border-indigo-500 transition bg-slate-50"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          type: "button",
                          onClick: () => setShowAdminRegPassword(!showAdminRegPassword),
                          className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition",
                          children: showAdminRegPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" })
                        }
                      )
                    ] })
                  ] })
                ] })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setAdminEditingStudentId(null),
                className: "px-5 py-2.5 bg-white text-slate-600 rounded-xl text-xs font-black border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition shadow-sm cursor-pointer",
                children: "Tutup"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                form: "adminRegForm",
                className: "px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition shadow-sm cursor-pointer",
                children: "Simpan Perubahan"
              }
            )
          ] })
        ] }) }),
        document.body
      ),
      viewingReceiptUrl && (() => {
        const cleanReceiptUrl = viewingReceiptUrl.includes("|") ? viewingReceiptUrl.split("|")[1] : viewingReceiptUrl;
        return createPortal(
          /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50", children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-800 text-sm", children: "Bukti Transfer Pembayaran" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setViewingReceiptUrl(null),
                  className: "p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer",
                  children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-900 flex items-center justify-center max-h-[70vh] overflow-y-auto w-full", children: !cleanReceiptUrl || !cleanReceiptUrl.startsWith("http") && !cleanReceiptUrl.startsWith("data:") ? /* @__PURE__ */ jsxs("div", { className: "text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm", children: [
              /* @__PURE__ */ jsx("div", { className: "text-amber-500 text-3xl mb-2", children: "\u26A0\uFE0F" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-200", children: "Tidak ada berkas bukti transfer" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "Pendaftar belum mengunggah bukti transfer pembayaran." })
            ] }) : cleanReceiptUrl.includes("application/pdf") || cleanReceiptUrl.toLowerCase().includes(".pdf") || viewingReceiptUrl.includes("|") && viewingReceiptUrl.split("|")[0].toLowerCase().includes(".pdf") ? /* @__PURE__ */ jsx(
              "iframe",
              {
                src: cleanReceiptUrl,
                className: "w-full h-[60vh] rounded-lg border-0 bg-white",
                title: "Bukti Transfer PDF"
              }
            ) : /* @__PURE__ */ jsx(
              "img",
              {
                src: cleanReceiptUrl,
                alt: "Bukti Transfer",
                referrerPolicy: "no-referrer",
                className: "max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
              }
            ) }),
            /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 flex justify-end bg-slate-50", children: /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewingReceiptUrl(null),
                className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer",
                children: "Tutup Gambar"
              }
            ) })
          ] }) }),
          document.body
        );
      })(),
      verifyingDocsStudent && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9990] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h4", { className: "font-bold text-slate-800 text-lg", children: [
                  "Verifikasi Berkas: ",
                  verifyingDocsStudent.name
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Periksa kelengkapan dokumen pendaftaran siswa." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      setVerifyingDocsStudent(null);
                      startAdminEditReg(verifyingDocsStudent.id);
                    },
                    className: "px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer border border-indigo-100",
                    children: [
                      /* @__PURE__ */ jsx(FileText, { className: "h-3.5 w-3.5" }),
                      "Edit Biodata Siswa"
                    ]
                  }
                ),
                (() => {
                  const studentInfo = systemState.registeredStudents.find((s) => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find((s) => s.name === verifyingDocsStudent.name) || verifyingDocsStudent;
                  if (studentInfo.proofOfPayment) {
                    return /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => setViewingReceiptUrl(studentInfo.proofOfPayment || ""),
                        className: "px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer border border-emerald-100",
                        children: [
                          /* @__PURE__ */ jsx(Receipt, { className: "h-3.5 w-3.5" }),
                          "Lihat Bukti Pembayaran"
                        ]
                      }
                    );
                  }
                  return null;
                })()
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setVerifyingDocsStudent(null),
                className: "p-2 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-6 bg-slate-50 flex-1 overflow-y-auto", children: [
            /* @__PURE__ */ jsx(
              StudentDocsManager,
              {
                student: systemState.registeredStudents.find((s) => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find((s) => s.name === verifyingDocsStudent.name) || verifyingDocsStudent,
                onUpdateState,
                onViewDoc: (url, title) => setViewingDocUrl({ url, title })
              }
            ),
            (() => {
              const student = systemState.registeredStudents.find((s) => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find((s) => s.name === verifyingDocsStudent.name) || verifyingDocsStudent;
              if (student.status === "Berkas Valid") {
                return /* @__PURE__ */ jsx("div", { className: "mt-8 bg-white border border-indigo-200 p-6 rounded-2xl shadow-sm animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row gap-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
                    /* @__PURE__ */ jsx("h3", { className: "font-bold text-indigo-900 flex items-center gap-2 text-lg", children: "\u{1F4B3} Verifikasi Bukti Pembayaran" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-600", children: "Berkas telah divalidasi. Langkah selanjutnya adalah memastikan bukti transfer/pembayaran pendaftaran sesuai." }),
                    /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 uppercase", children: "Status Pembayaran:" }),
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            className: `font-black px-3 py-1 rounded-full text-xs uppercase tracking-wide border leading-none ${student.paymentStatus === "Lunas" ? "bg-emerald-100 text-emerald-700 border-emerald-300" : student.paymentStatus === "Ditolak" ? "bg-rose-100 text-rose-700 border-rose-300" : "bg-amber-100 text-amber-800 border-amber-300 animate-pulse-once"}`,
                            children: student.paymentStatus || "Pending"
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
                        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 uppercase block mb-2", children: "Dokumen Bukti Transfer:" }),
                        student.proofOfPayment ? /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2", children: /* @__PURE__ */ jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => setViewingReceiptUrl(student.proofOfPayment || ""),
                            className: "flex items-center gap-2 text-sm font-black text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-3 rounded-xl transition cursor-pointer w-full justify-center border border-blue-200",
                            children: "\u{1F441}\uFE0F Buka / Lihat Bukti Bayar"
                          }
                        ) }) : /* @__PURE__ */ jsx("div", { className: "text-sm text-rose-600 font-bold bg-rose-50 border border-rose-200 p-3 rounded-xl text-center", children: "Belum ada bukti pembayaran yang diunggah" })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "w-full md:w-64 shrink-0 flex flex-col gap-2 justify-center", children: [
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: async () => {
                          await onUpdateState("registeredStudents", "update", {
                            id: student.id,
                            paymentStatus: "Lunas",
                            paymentAmount: student.paymentAmount || 5e5
                          });
                        },
                        className: "px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black uppercase cursor-pointer transition flex items-center justify-center gap-2 shadow-sm",
                        children: [
                          /* @__PURE__ */ jsx(Check, { className: "h-5 w-5" }),
                          " Sahkan (Lunas)"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: async () => {
                          await onUpdateState("registeredStudents", "update", {
                            id: student.id,
                            paymentStatus: "Ditolak"
                          });
                        },
                        className: "px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black uppercase cursor-pointer transition flex items-center justify-center gap-2 shadow-sm",
                        children: [
                          /* @__PURE__ */ jsx(X, { className: "h-5 w-5" }),
                          " Tolak Bukti"
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: async () => {
                          await onUpdateState("registeredStudents", "update", {
                            id: student.id,
                            paymentStatus: "Pending"
                          });
                        },
                        className: "px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-sm font-black uppercase cursor-pointer transition flex items-center justify-center gap-2 shadow-sm mt-2",
                        children: "Reset Status"
                      }
                    )
                  ] })
                ] }) });
              }
              return null;
            })()
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-t border-slate-100 flex justify-end gap-3 bg-white", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setVerifyingDocsStudent(null),
                className: "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition cursor-pointer",
                children: "Tutup"
              }
            ),
            (() => {
              const student = systemState.registeredStudents.find((s) => s.id === verifyingDocsStudent.id) || systemState.registeredStudents.find((s) => s.name === verifyingDocsStudent.name) || verifyingDocsStudent;
              if (student.status === "Pending") {
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: async () => {
                      await onUpdateState("registeredStudents", "update", { id: verifyingDocsStudent.id, status: "Berkas Valid" });
                    },
                    className: "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
                      "Approve Kelengkapan Berkas"
                    ]
                  }
                );
              }
              if (student.status === "Berkas Valid" && student.paymentStatus === "Lunas") {
                const lmsClasses = systemState?.customization?.lmsClasses || [];
                const activeClasses = lmsClasses.filter((c) => c.isActive !== false);
                const teachers = (systemState.users || []).filter((u) => u.role === "Pengajar");
                const assignedTeachers = teachers.filter((t) => t.assignedClass === selectedClassToPlot);
                return /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row items-center gap-3 w-full justify-end bg-indigo-50/50 p-4 border-t border-indigo-100 rounded-b-3xl", children: /* @__PURE__ */ jsx("div", { className: "flex gap-2 shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0", children: /* @__PURE__ */ jsxs(
                  ConfirmButton,
                  {
                    confirmTitle: "Terima Pendaftar",
                    confirmMessage: `Anda yakin menyetujui ${student.name} sebagai siswa aktif? Mereka belum akan dimasukkan ke kelas manapun hingga Anda memplotnya.`,
                    onConfirmClick: async () => {
                      handleApprove(student, "");
                      setVerifyingDocsStudent(null);
                      setSelectedClassToPlot("");
                    },
                    className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-sm flex items-center gap-2 cursor-pointer",
                    id: `btn-approve-modal-${student.id}`,
                    children: [
                      /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }),
                      "Terima & Jadikan Siswa Aktif"
                    ]
                  }
                ) }) });
              }
              return null;
            })()
          ] })
        ] }) }),
        document.body
      ),
      viewingDocUrl && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50", children: [
            /* @__PURE__ */ jsx("h4", { className: "font-bold text-slate-800 text-sm", children: viewingDocUrl.title || "Lihat Dokumen" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewingDocUrl(null),
                className: "p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer",
                children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[50vh] max-h-[75vh] overflow-y-auto gap-4", children: !viewingDocUrl.url || !viewingDocUrl.url.startsWith("http") && !viewingDocUrl.url.startsWith("data:") ? /* @__PURE__ */ jsxs("div", { className: "text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm", children: [
            /* @__PURE__ */ jsx("div", { className: "text-amber-500 text-3xl mb-2", children: "\u26A0\uFE0F" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-200", children: "Berkas tidak tersedia" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mt-1", children: [
              "Pendaftar belum mengunggah dokumen ",
              viewingDocUrl.title || "ini",
              "."
            ] })
          ] }) : viewingDocUrl.url.includes("application/pdf") || viewingDocUrl.url.toLowerCase().includes(".pdf") ? /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center max-w-md w-full", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-300 font-bold mb-3 font-sans", children: "Dokumen ini adalah format PDF." }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center", children: [
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: viewingDocUrl.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Buka PDF di Tab Baru" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: viewingDocUrl.url,
                    download: viewingDocUrl.title ? `${viewingDocUrl.title}.pdf` : "dokumen.pdf",
                    className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
                      /* @__PURE__ */ jsx("span", { children: "Unduh / Simpan PDF" })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "iframe",
              {
                src: viewingDocUrl.url,
                title: "PDF Viewer",
                className: "w-full h-[50vh] bg-white rounded-lg shadow-md"
              }
            )
          ] }) : /* @__PURE__ */ jsxs("div", { className: "w-full flex flex-col items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-3 justify-center items-center w-full", children: [
              viewingDocUrl.url.startsWith("data:") && /* @__PURE__ */ jsxs(
                "a",
                {
                  href: viewingDocUrl.url,
                  download: viewingDocUrl.title ? `${viewingDocUrl.title}.jpg` : "gambar.jpg",
                  className: "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2",
                  children: [
                    /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
                    /* @__PURE__ */ jsx("span", { children: "Unduh / Simpan Gambar" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 shadow-lg text-white", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDocZoom((prev) => Math.max(0.5, prev - 0.25)),
                    disabled: docZoom <= 0.5,
                    className: "p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition text-slate-300 hover:text-white cursor-pointer",
                    title: "Perkecil (Zoom Out)",
                    children: /* @__PURE__ */ jsx(ZoomOut, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono font-bold select-none min-w-[40px] text-center text-slate-200", children: [
                  Math.round(docZoom * 100),
                  "%"
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDocZoom((prev) => Math.min(4, prev + 0.25)),
                    disabled: docZoom >= 4,
                    className: "p-1 hover:bg-slate-700 disabled:opacity-30 rounded transition text-slate-300 hover:text-white cursor-pointer",
                    title: "Perbesar (Zoom In)",
                    children: /* @__PURE__ */ jsx(ZoomIn, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "h-4 w-[1px] bg-slate-700 mx-1" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setDocRotation((prev) => (prev + 90) % 360),
                    className: "p-1 hover:bg-slate-700 rounded transition text-slate-300 hover:text-white cursor-pointer",
                    title: "Putar 90\xB0 (Rotate)",
                    children: /* @__PURE__ */ jsx(RotateCw, { className: "h-4 w-4" })
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "h-4 w-[1px] bg-slate-700 mx-1" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setDocZoom(1);
                      setDocRotation(0);
                    },
                    className: "px-2 py-0.5 text-[10px] font-bold hover:bg-slate-700 rounded transition text-slate-300 hover:text-white cursor-pointer",
                    children: "Reset"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800 min-h-[40vh] max-h-[60vh]", children: /* @__PURE__ */ jsx("div", { className: "transition-all duration-200 ease-out flex items-center justify-center", style: { transform: `scale(${docZoom}) rotate(${docRotation}deg)` }, children: /* @__PURE__ */ jsx(
              "img",
              {
                src: viewingDocUrl.url,
                alt: "Dokumen",
                referrerPolicy: "no-referrer",
                className: "max-w-full max-h-[45vh] object-contain rounded-lg shadow-md"
              }
            ) }) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 flex justify-end bg-slate-50", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewingDocUrl(null),
              className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer",
              children: "Tutup Dokumen"
            }
          ) })
        ] }) }),
        document.body
      ),
      viewingCvStudentId && activeSegment !== "dataCV" && createPortal(
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-[1200px] w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0", children: [
            /* @__PURE__ */ jsxs("h4", { className: "font-bold text-slate-800 text-sm flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
              " CV & Biodata Jepang"
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setViewingCvStudentId(null),
                className: "p-1.5 hover:bg-rose-100 hover:text-rose-600 rounded-full transition text-slate-500 cursor-pointer",
                children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "overflow-y-auto flex-1 bg-slate-50", children: (() => {
            const student = systemState.activeStudents.find((s) => s.id === viewingCvStudentId);
            if (!student) return /* @__PURE__ */ jsx("div", { className: "p-8 text-center text-slate-500", children: "Student not found" });
            return /* @__PURE__ */ jsx(
              StudentCvView,
              {
                student,
                onUpdateStudent: async (payload) => {
                  return await onUpdateState("activeStudents", "update", payload);
                },
                lpkName: systemState.customization?.logoText || "LPK Source Course"
              }
            );
          })() })
        ] }) }),
        document.body
      )
    ] }),
    showCostConfig && createPortal(
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-5 border-b flex justify-between items-center bg-indigo-50 shrink-0", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-indigo-900", children: "Konfigurasi SOP Biaya Resmi" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowCostConfig(false), className: "text-slate-400 hover:text-slate-600", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            /* @__PURE__ */ jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveCostConfig, className: "p-5 space-y-4 overflow-y-auto", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Administrasi Pendaftaran" }),
            /* @__PURE__ */ jsx("input", { type: "number", required: true, value: costRegistration, onChange: (e) => setCostRegistration(Number(e.target.value)), className: "w-full border rounded-lg p-2 text-sm mt-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "DP Biaya Belajar (Awal)" }),
            /* @__PURE__ */ jsx("input", { type: "number", required: true, value: costDP, onChange: (e) => setCostDP(Number(e.target.value)), className: "w-full border rounded-lg p-2 text-sm mt-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Pelunasan Biaya Belajar (Maks 1 Bln)" }),
            /* @__PURE__ */ jsx("input", { type: "number", required: true, value: costFullPayment, onChange: (e) => setCostFullPayment(Number(e.target.value)), className: "w-full border rounded-lg p-2 text-sm mt-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "Management Fee (Pasca Lolos)" }),
            /* @__PURE__ */ jsx("input", { type: "number", required: true, value: costManagementFee, onChange: (e) => setCostManagementFee(Number(e.target.value)), className: "w-full border rounded-lg p-2 text-sm mt-1" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-4 flex justify-end gap-2", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowCostConfig(false), className: "px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold", children: "Batal" }),
            /* @__PURE__ */ jsx("button", { type: "submit", className: "px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer", children: "Simpan" })
          ] })
        ] })
      ] }) }),
      document.body
    ),
    editingPayment && createPortal(
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-200", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-slate-900 mb-4 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Edit, { className: "w-5 h-5 text-indigo-600" }),
          "Edit Data Pembayaran"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 mb-1 block", children: "Jumlah (Rp)" }),
            /* @__PURE__ */ jsx("input", { type: "number", id: "edit-pay-amount", defaultValue: editingPayment.amount, className: "w-full border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 mb-1 block", children: "Kategori / Keterangan" }),
            /* @__PURE__ */ jsx("input", { type: "text", id: "edit-pay-cat", defaultValue: editingPayment.category, className: "w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-slate-500 mb-1 block", children: "Status" }),
            /* @__PURE__ */ jsxs("select", { id: "edit-pay-status", defaultValue: editingPayment.status, className: "w-full border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500", children: [
              /* @__PURE__ */ jsx("option", { value: "Lunas", children: "Lunas" }),
              /* @__PURE__ */ jsx("option", { value: "Cicilan", children: "Cicilan" }),
              /* @__PURE__ */ jsx("option", { value: "Belum Bayar", children: "Belum Bayar" }),
              /* @__PURE__ */ jsx("option", { value: "Pending", children: "Pending" }),
              /* @__PURE__ */ jsx("option", { value: "Ditolak", children: "Ditolak" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end mt-6", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setEditingPayment(null), className: "px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer", children: "Batal" }),
          /* @__PURE__ */ jsx("button", { onClick: () => {
            const amt = document.getElementById("edit-pay-amount").value;
            const cat = document.getElementById("edit-pay-cat").value;
            const stat = document.getElementById("edit-pay-status").value;
            onUpdateState("payments", "edit", { id: editingPayment.id, studentName: editingPayment.studentName, amount: Number(amt), category: cat, status: stat });
            setEditingPayment(null);
          }, className: "px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2", children: "Simpan Perubahan" })
        ] })
      ] }) }),
      document.body
    ),
    showSyncModal && createPortal(
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-4 mb-4", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-slate-900 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-5 h-5 text-amber-600 animate-spin" }),
            /* @__PURE__ */ jsx("span", { children: "Sinkronisasi Database Siswa" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowSyncModal(false),
              className: "p-1.5 hover:bg-rose-100 hover:text-rose-600 rounded-full transition text-slate-500 cursor-pointer",
              children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4 overflow-y-auto flex-1 pr-1 text-left", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-600 leading-relaxed", children: [
            "Fitur ini mencocokkan data ",
            /* @__PURE__ */ jsx("strong", { children: "Siswa Aktif" }),
            " dan ",
            /* @__PURE__ */ jsx("strong", { children: "Siswa Baru" }),
            " dengan daftar ",
            /* @__PURE__ */ jsx("strong", { children: "Akun Pengguna" }),
            " aktif di database."
          ] }),
          outOfSyncActive.length === 0 && outOfSyncRegistered.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3", children: [
            /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5 text-emerald-600 shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-sm text-emerald-950", children: "Semua Data Sinkron!" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-700 mt-1", children: 'Tidak ditemukan adanya data "siswa hantu" (siswa aktif/baru yang akun penggunanya sudah didelete). Semua data Anda dalam kondisi bersih dan sinkron.' })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(AlertCircle, { className: "h-5 w-5 text-amber-600 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h4", { className: "font-bold text-sm text-amber-950", children: [
                  "Ditemukan ",
                  outOfSyncActive.length + outOfSyncRegistered.length,
                  " Data Tidak Sinkron!"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-700 mt-1", children: "Terdapat data siswa aktif atau baru yang akun penggunanya (user account) telah didelete atau tidak ditemukan dalam database. Anda dapat menghapus data yatim ini agar sinkron kembali." })
              ] })
            ] }),
            outOfSyncActive.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("h5", { className: "font-bold text-xs text-slate-500 uppercase tracking-wider", children: [
                "Siswa Aktif Tanpa Akun (",
                outOfSyncActive.length,
                "):"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[150px] overflow-y-auto", children: outOfSyncActive.map((st) => /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50/50 flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: st.name }),
                /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100", children: st.id })
              ] }, st.id)) })
            ] }),
            outOfSyncRegistered.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs("h5", { className: "font-bold text-xs text-slate-500 uppercase tracking-wider", children: [
                "Pendaftaran Tanpa Akun (",
                outOfSyncRegistered.length,
                "):"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[150px] overflow-y-auto", children: outOfSyncRegistered.map((st) => /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50/50 flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-slate-800", children: st.name }),
                /* @__PURE__ */ jsx("span", { className: "font-mono text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100", children: "Disetujui" })
              ] }, st.id)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end mt-6 border-t border-slate-100 pt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowSyncModal(false),
              className: "px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer",
              children: "Tutup"
            }
          ),
          (outOfSyncActive.length > 0 || outOfSyncRegistered.length > 0) && /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleSyncStudents,
              disabled: syncingStudents,
              className: "px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2",
              children: syncingStudents ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                /* @__PURE__ */ jsx("span", { children: "Menghapus..." })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsx("span", { children: "Hapus & Sinkronkan" })
              ] })
            }
          )
        ] })
      ] }) }),
      document.body
    )
  ] });
}
function EditJobOrderModal({ job, onClose, onUpdateState }) {
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
  const handleSubmit = async (e) => {
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
        minEthicsScore
      }
    });
    setIsSaving(false);
    if (ok) {
      alert("Job Order sukses diperbarui!");
      onClose();
    }
  };
  return createPortal(
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overflow-x-hidden", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-slate-800 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "bg-amber-100 text-amber-700 p-1.5 rounded-lg", children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4" }) }),
            "Edit Job Order"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-500 font-mono mt-1", children: "Perbarui rincian lowongan kerja, jadwal proses, dan kualifikasi fisik siswa." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onClose,
            className: "p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600",
            children: /* @__PURE__ */ jsx(X, { className: "h-5 w-5" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-6 overflow-y-auto", children: /* @__PURE__ */ jsxs(
        ConfirmForm,
        {
          confirmTitle: "Simpan Perubahan",
          confirmMessage: "Anda yakin ingin menyimpan perubahan data Job Order ini?",
          onSubmit: handleSubmit,
          className: "space-y-4",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "PT Mitra / Agency Rekanan (Wajib)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  placeholder: "Contoh: PT Fuji Tokutei Agency Tokyo",
                  value: partnerName,
                  onChange: (e) => setPartnerName(e.target.value),
                  className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "No Registrasi (Opsional)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Contoh: R-1234",
                    value: noReg,
                    onChange: (e) => setNoReg(e.target.value),
                    className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Jenis Visa / Program" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: jobType,
                    onChange: (e) => setJobType(e.target.value),
                    className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "Tokutei ginou", children: "Tokutei ginou" }),
                      /* @__PURE__ */ jsx("option", { value: "Ginou jisshusei", children: "Ginou jisshusei" }),
                      /* @__PURE__ */ jsx("option", { value: "Ryugakusei", children: "Ryugakusei" }),
                      /* @__PURE__ */ jsx("option", { value: "Engineering", children: "Engineering" })
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Bidang Pekerjaan (Wajib)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    required: true,
                    placeholder: "Contoh: Pengolahan Makanan / Perawat Lansia",
                    value: occupation,
                    onChange: (e) => setOccupation(e.target.value),
                    className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Lokasi / Prefektur (Wajib)" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    required: true,
                    value: location,
                    onChange: (e) => setLocation(e.target.value),
                    className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "", children: "-- Pilih Lokasi --" }),
                      JAPAN_PREFECTURES.map((pref) => /* @__PURE__ */ jsx("option", { value: pref, children: pref }, pref))
                    ]
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Rincian Gaji (Wajib)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  required: true,
                  placeholder: "Contoh: \xA5180,000 / Bulan (Take home pay)",
                  value: salary,
                  onChange: (e) => setSalary(e.target.value),
                  className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Tunjangan (Opsional)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Contoh: Asrama, Asuransi",
                    value: allowance,
                    onChange: (e) => setAllowance(e.target.value),
                    className: "w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Estimasi Lembur" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Contoh: ~20 Jam / Bulan",
                    value: overtime,
                    onChange: (e) => setOvertime(e.target.value),
                    className: "w-full text-sm rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Durasi Kontrak" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Contoh: 3 Tahun (Bisa diperpanjang)",
                    value: contractDuration,
                    onChange: (e) => setContractDuration(e.target.value),
                    className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Jumlah Rekrutmen" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Contoh: 5 Orang",
                    value: recruitCount,
                    onChange: (e) => setRecruitCount(e.target.value),
                    className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold uppercase text-slate-500 block", children: "Deskripsi Pekerjaan / Keterangan Lain" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  rows: 3,
                  placeholder: "Tuliskan rincian deskripsi pekerjaan, jam kerja, atau catatan tambahan lainnya...",
                  value: jobDescription,
                  onChange: (e) => setJobDescription(e.target.value),
                  className: "w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition resize-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 rounded-2xl p-4 bg-indigo-50/30 space-y-4", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-black uppercase text-indigo-700 block border-b border-indigo-100 pb-2", children: "Pengaturan Jadwal Proses (Sinkron LMS Siswa)" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "1. Pendaftaran" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 1-10 Mei 2026",
                      value: scheduleRegistration,
                      onChange: (e) => setScheduleRegistration(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "2. Seleksi Dokumen" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 11-14 Mei 2026",
                      value: scheduleDocumentSelection,
                      onChange: (e) => setScheduleDocumentSelection(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "3. Pelaksanaan Interview" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: Online (Zoom)",
                      value: interviewExecution,
                      onChange: (e) => setInterviewExecution(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Jadwal Interview" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 15-20 Mei 2026",
                      value: interviewDate,
                      onChange: (e) => setInterviewDate(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "4. Pengumuman Kelulusan" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 25 Mei 2026",
                      value: scheduleAnnouncement,
                      onChange: (e) => setScheduleAnnouncement(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "5. Medical Check Up" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 26-30 Mei 2026",
                      value: scheduleMcu,
                      onChange: (e) => setScheduleMcu(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-4", children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-black uppercase text-slate-600 block border-b border-slate-200 pb-2", children: "Syarat Kualifikasi" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Gender" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: gender,
                      onChange: (e) => setGender(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Bebas" }),
                        /* @__PURE__ */ jsx("option", { value: "Laki-laki", children: "Laki-laki Saja" }),
                        /* @__PURE__ */ jsx("option", { value: "Perempuan", children: "Perempuan Saja" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Usia Max" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 30",
                      value: ageRequirement,
                      onChange: (e) => setAgeRequirement(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Tinggi (cm)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 160",
                      value: tbRequirement,
                      onChange: (e) => setTbRequirement(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Berat (kg)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 50",
                      value: bbRequirement,
                      onChange: (e) => setBbRequirement(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min B. Jepang" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: BAB 15",
                      value: minJapaneseScore,
                      onChange: (e) => setMinJapaneseScore(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Absensi (%)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 80",
                      value: minAttendanceScore,
                      onChange: (e) => setMinAttendanceScore(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Nilai 5S" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 80",
                      value: minFiveSScore,
                      onChange: (e) => setMinFiveSScore(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                  /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500", children: "Min Nilai MTK" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      placeholder: "Contoh: 90",
                      value: minMathScore,
                      onChange: (e) => setMinMathScore(e.target.value),
                      className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] font-bold uppercase text-slate-500 block", children: "Min Nilai Etika" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Contoh: 80",
                    value: minEthicsScore,
                    onChange: (e) => setMinEthicsScore(e.target.value),
                    className: "w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: isSaving,
                className: "w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl text-sm font-black uppercase tracking-wider transition cursor-pointer shadow-sm mt-4 flex items-center justify-center gap-2",
                children: isSaving ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                  /* @__PURE__ */ jsx("span", { children: "Menyimpan Perubahan..." })
                ] }) : /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx("span", { children: "Simpan Perubahan Job Order \u{1F4BE}" }) })
              }
            )
          ]
        }
      ) })
    ] }) }),
    document.body
  );
}
