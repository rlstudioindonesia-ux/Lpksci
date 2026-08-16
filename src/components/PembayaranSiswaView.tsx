import React, { useState } from "react";
import { createPortal } from "react-dom";
import { SystemState, UserAccount, PaymentRecord } from "../types";
import { uploadFileToFirebase } from "../lib/storageHelper";
import { isStudentAlumni } from "../lib/alumniStatus";
import { 
  CreditCard, Search, CheckCircle, AlertCircle, TrendingUp, 
  DollarSign, Clock, Users, ArrowRight, ShieldCheck, PieChart, Info,
  Plus, Edit2, Trash2, Check, X, FileText, Landmark, Wallet, Eye, Settings, ListFilter, Loader2, GraduationCap, Download, RefreshCw, UserCheck,
  BarChart3, Activity, Sparkles, Layers, ArrowUpRight
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
import PaymentDetailModal from "./PaymentDetailModal";
import { TeacherDashboardPanel } from "./TeacherDashboardPanel";
import { ConfirmButton } from "./ConfirmButton";

function parsePrice(priceStr: string | number | undefined): number {
  if (!priceStr) return 1000000;
  if (typeof priceStr === 'number') return priceStr;
  const cleaned = priceStr.replace(/[^0-9]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 1000000;
}

// Standard billing selector helper used to ensure equal billing categories across all students
export function getStudentPayments(
  studentName: string, 
  allPayments: PaymentRecord[], 
  costConfig?: SystemState['costConfig'],
  activeStudents?: any[],
  registeredStudents?: any[],
  customization?: SystemState['customization']
): PaymentRecord[] {
  if (!studentName) return [];

  // Find all actual payments for this student
  const studentActualPayments = (allPayments || []).filter(p => 
    (p.studentName || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase()
  );

  // Check if student has cleared all bills marker
  const isClearedAll = studentActualPayments.some(p => 
    p.isClearedAll === true || p.category === "ALL_CLEARED" || (p as any).isDeletedAll === true
  );

  // Check if this student is an Alumni
  const isAlumni = (activeStudents || []).some(s =>
    (s.name || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase() &&
    (isStudentAlumni(s) || s.status === "Alumni")
  ) || (registeredStudents || []).some(s =>
    (s.name || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase() &&
    (isStudentAlumni(s) || s.status === "Alumni")
  );

  if (isAlumni) {
    const studentObj = (activeStudents || []).find(s => 
      (s.name || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase()
    ) || (registeredStudents || []).find(s =>
      (s.name || "").trim().toLowerCase() === (studentName || "").trim().toLowerCase()
    );
    
    const studentClass = studentObj ? (studentObj.class || studentObj.assignedClass || "") : "";
    
    // Attempt to match the student class with custom alumniClasses configured in customization
    const alumniClassesList = customization?.landingConfig?.alumniClasses || [];
    const matchedAlumniClass = studentClass ? alumniClassesList.find((c: any) => {
      const titleLower = (c.title || "").toLowerCase();
      const classLower = studentClass.toLowerCase();
      return classLower.includes(titleLower) || titleLower.includes(classLower);
    }) : undefined;
    
    const result: PaymentRecord[] = [];

    if (matchedAlumniClass && !isClearedAll) {
      const classFee = parsePrice(matchedAlumniClass.finalPrice);
      const defaultAlumniCategory = {
        idSuffix: "AL",
        category: `Biaya Kelas: ${matchedAlumniClass.title}`,
        amount: classFee,
        defaultStatus: "Belum Bayar" as const,
        defaultMethod: ""
      };
      
      const existing = studentActualPayments.find(p => 
        (p.category || "").toLowerCase().includes("biaya kelas") || 
        (p.category || "").toLowerCase().includes(matchedAlumniClass.title.toLowerCase())
      );
      
      if (existing) {
        if (!existing.isDeleted && existing.status !== "Dihapus" && existing.status !== "Dibatalkan") {
          result.push(existing);
        }
      } else {
        result.push({
          id: `PAY-${studentName.replace(/\s+/g, "").toUpperCase().slice(0, 6)}-AL`,
          studentName,
          category: defaultAlumniCategory.category,
          amount: defaultAlumniCategory.amount,
          date: new Date().toISOString().split("T")[0],
          status: defaultAlumniCategory.defaultStatus,
          paymentMethod: defaultAlumniCategory.defaultMethod
        });
      }
    }
    
    // Append other custom active payments
    studentActualPayments.forEach(p => {
      if (p.isDeleted || p.status === "Dihapus" || p.status === "Dibatalkan" || p.category === "ALL_CLEARED") return;
      const isAlreadyAdded = result.some(r => r.id === p.id);
      if (!isAlreadyAdded) {
        result.push(p);
      }
    });
    
    return result;
  }

  const defaultCategories = [
    { idSuffix: "1", category: "Administrasi Pendaftaran", amount: (costConfig?.registration ?? 500000), defaultStatus: "Belum Bayar" as const, defaultMethod: "" },
    { idSuffix: "2", category: "DP Biaya Belajar (Persiapan Awal)", amount: (costConfig?.dp ?? 3500000), defaultStatus: "Belum Bayar" as const, defaultMethod: "" },
    { idSuffix: "3", category: "Pelunasan Biaya Belajar (Max 1 Bulan)", amount: (costConfig?.fullPayment ?? 2000000), defaultStatus: "Belum Bayar" as const, defaultMethod: "" },
    { idSuffix: "4", category: "Pembayaran Manajemen Fee", amount: (costConfig?.managementFee ?? 5000000), defaultStatus: "Belum Bayar" as const, defaultMethod: "" }
  ];

  const result: PaymentRecord[] = [];

  if (!isClearedAll) {
    const studentClean = (studentName || "").replace(/\s+/g, "").toUpperCase();

    // For each default category, find ALL matching actual payments for this student
    defaultCategories.forEach((cat) => {
      const defaultId = `PAY-${studentClean.slice(0, 6)}-${cat.idSuffix}`;

      // All actual payments in DB that match this default category
      const matching = studentActualPayments.filter(p => {
        if (p.id === defaultId) return true;
        const pCatLower = (p.category || "").toLowerCase();
        const catLower = cat.category.toLowerCase();

        return pCatLower.includes(catLower) || 
               catLower.includes(pCatLower) ||
               (cat.category.includes("Pendaftaran") && pCatLower.includes("pendaftaran")) ||
               (cat.category.includes("DP Biaya Belajar") && (pCatLower.includes("pelatihan") || pCatLower.includes("asrama") || pCatLower.includes("dp"))) ||
               (cat.category.includes("Pelunasan") && pCatLower.includes("pelunasan")) ||
               (cat.category.includes("Manajemen") && pCatLower.includes("manajemen"));
      });

      // Check if user explicitly deleted this category
      const isExplicitlyDeleted = matching.some(p => p.isDeleted || p.status === "Dihapus" || p.status === "Dibatalkan");

      if (isExplicitlyDeleted) {
        // Do not render anything for this deleted category!
        return;
      }

      // Filter active (non-deleted) payments matching this category
      const activeMatching = matching.filter(p => !p.isDeleted && p.status !== "Dihapus" && p.status !== "Dibatalkan");

      if (activeMatching.length > 0) {
        activeMatching.forEach(p => {
          if (!result.some(r => r.id === p.id)) {
            result.push(p);
          }
        });
      } else {
        // No DB records at all for this category, render default fallback item
        result.push({
          id: defaultId,
          studentName,
          category: cat.category,
          amount: cat.amount,
          date: new Date().toISOString().split("T")[0],
          status: cat.defaultStatus,
          paymentMethod: cat.defaultMethod || ""
        });
      }
    });
  }

  // Now, append any other custom active payments for this student
  studentActualPayments.forEach((p) => {
    if (p.isDeleted || p.status === "Dihapus" || p.status === "Dibatalkan" || p.category === "ALL_CLEARED") return;

    // Skip if already pushed into result
    if (result.some(r => r.id === p.id)) return;

    const matchesAnyDefault = defaultCategories.some(cat => {
      const pCatLower = (p.category || "").toLowerCase();
      const catLower = cat.category.toLowerCase();

      return pCatLower.includes(catLower) || 
             catLower.includes(pCatLower) ||
             (cat.category.includes("Pendaftaran") && pCatLower.includes("pendaftaran")) ||
             (cat.category.includes("DP Biaya Belajar") && (pCatLower.includes("pelatihan") || pCatLower.includes("asrama") || pCatLower.includes("dp"))) ||
             (cat.category.includes("Pelunasan") && pCatLower.includes("pelunasan")) ||
             (cat.category.includes("Manajemen") && pCatLower.includes("manajemen"));
    });

    if (!matchesAnyDefault) {
      result.push(p);
    }
  });

  return result;
}

interface PembayaranSiswaViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  onOpenLogin: () => void;
  setActiveTab?: (tab: string) => void;
}

export default function PembayaranSiswaView({ 
  currentUser, 
  systemState, 
  onUpdateState, 
  onOpenLogin, 
  setActiveTab 
}: PembayaranSiswaViewProps) {
  const [activePaymentDetail, setActivePaymentDetail] = useState<PaymentRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [adminActiveTab, setAdminActiveTab] = useState<"dashboard" | "manajemen" | "settings" | "grafik">("dashboard");
  const [sidebarFilter, setSidebarFilter] = useState<"siswa" | "alumni">("siswa");
  const [sidebarPage, setSidebarPage] = useState(1);

  React.useEffect(() => {
    setSidebarPage(1);
  }, [sidebarFilter, searchQuery]);

  // Cost configs
  const [showCostConfig, setShowCostConfig] = useState(false);
  const [costRegistration, setCostRegistration] = useState(systemState.costConfig?.registration ?? 500000);
  const [costDP, setCostDP] = useState(systemState.costConfig?.dp ?? 3500000);
  const [costFullPayment, setCostFullPayment] = useState(systemState.costConfig?.fullPayment ?? 2000000);
  const [costManagementFee, setCostManagementFee] = useState(systemState.costConfig?.managementFee ?? 5000000);

  // Manual payment creation / editing
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState<PaymentRecord | null>(null);
  
  // Creation form states
  const [formStudentName, setFormStudentName] = useState("");
  const [formCategory, setFormCategory] = useState("Custom Tagihan");
  const [formAmount, setFormAmount] = useState(1000000);
  const [formStatus, setFormStatus] = useState<"Lunas" | "Belum Bayar" | "Cicilan">("Belum Bayar");
  const [formMethod, setFormMethod] = useState("Cash");

  // Edit form states
  const [editCategory, setEditCategory] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editStatus, setEditStatus] = useState<"Lunas" | "Belum Bayar" | "Cicilan" | "Pending">("Belum Bayar");
  const [editMethod, setEditMethod] = useState("");
  const [editProofOfPayment, setEditProofOfPayment] = useState("");
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  // Bank Account states
  const [newBankName, setNewBankName] = useState("");
  const [newBankNumber, setNewBankNumber] = useState("");
  const [newBankHolder, setNewBankHolder] = useState("");

  // Verification review modal
  const [reviewingVerification, setReviewingVerification] = useState<PaymentRecord | null>(null);

  // Sync Student modal
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncManualName, setSyncManualName] = useState("");
  const [syncMode, setSyncMode] = useState<"create" | "merge">("create");
  const [syncTargetStudent, setSyncTargetStudent] = useState("");

  const handleSaveCostConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateState('costConfig', 'update', { 
      registration: costRegistration,
      dp: costDP,
      fullPayment: costFullPayment,
      managementFee: costManagementFee
    });
    alert("Konfigurasi SOP Biaya Resmi berhasil disimpan!");
    setShowCostConfig(false);
  };

  const handleDeletePayment = async (paymentId: string, paymentRecord?: PaymentRecord) => {
    const allPays = systemState.payments || [];
    const targetStudent = paymentRecord?.studentName || selectedStudent;
    const targetCategory = paymentRecord?.category || "";

    // Find all matching payments in DB for this student and ID or category
    const matchingInDb = allPays.filter(p => 
      p.id === paymentId || 
      (
        targetStudent && targetCategory &&
        (p.studentName || "").trim().toLowerCase() === targetStudent.trim().toLowerCase() &&
        (
          (p.category || "").trim().toLowerCase() === targetCategory.trim().toLowerCase() ||
          (targetCategory.includes("Pendaftaran") && (p.category || "").toLowerCase().includes("pendaftaran")) ||
          (targetCategory.includes("DP Biaya") && ((p.category || "").toLowerCase().includes("dp") || (p.category || "").toLowerCase().includes("pelatihan") || (p.category || "").toLowerCase().includes("asrama"))) ||
          (targetCategory.includes("Pelunasan") && (p.category || "").toLowerCase().includes("pelunasan")) ||
          (targetCategory.includes("Manajemen") && (p.category || "").toLowerCase().includes("manajemen"))
        )
      )
    );

    if (matchingInDb.length > 0) {
      for (const item of matchingInDb) {
        await onUpdateState('payments', 'update', {
          ...item,
          status: "Dihapus",
          isDeleted: true
        });
      }
    } else {
      const targetPay = paymentRecord || getStudentPayments(selectedStudent, allPays, systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization).find(p => p.id === paymentId);
      await onUpdateState('payments', 'add', {
        id: paymentId,
        studentName: targetStudent,
        category: targetCategory || targetPay?.category || "Tagihan",
        amount: targetPay?.amount || 0,
        date: targetPay?.date || new Date().toISOString().split("T")[0],
        status: "Dihapus",
        isDeleted: true
      });
    }
  };

  const handleAddCustomPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName) {
      alert("Silakan pilih nama siswa.");
      return;
    }
    const payload = {
      id: `PAY-${formStudentName.replace(/\s+/g, "").toUpperCase().slice(0, 6)}-${Date.now().toString().slice(-3)}`,
      studentName: formStudentName,
      category: formCategory,
      amount: Number(formAmount),
      date: new Date().toISOString().split("T")[0],
      status: formStatus,
      paymentMethod: formMethod
    };

    await onUpdateState('payments', 'edit', payload);
    alert(`Sukses menambahkan tagihan baru untuk ${formStudentName}!`);
    setShowAddPaymentModal(false);
  };

  const handleEditPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditPaymentModal) return;

    const payload = {
      id: showEditPaymentModal.id,
      studentName: showEditPaymentModal.studentName,
      category: editCategory,
      amount: Number(editAmount),
      date: showEditPaymentModal.date,
      status: editStatus,
      paymentMethod: editMethod,
      proofOfPayment: editProofOfPayment
    };

    await onUpdateState('payments', 'edit', payload);
    alert("Data pembayaran berhasil diperbarui!");
    setShowEditPaymentModal(null);
  };

  const handleVerifyPayment = async (payment: PaymentRecord, approved: boolean) => {
    if (approved) {
      await onUpdateState("payments", "status", {
        id: payment.id,
        status: "Lunas",
      });
      await onUpdateState("payments", "sign_payment", {
        id: payment.id,
        isSigned: true,
        signatureDate: new Date().toLocaleDateString("id-ID"),
      });
      alert(`Pembayaran ${payment.studentName} berhasil disahkan LUNAS dengan tanda tangan admin.`);
    } else {
      await onUpdateState("payments", "status", {
        id: payment.id,
        status: "Belum Bayar",
      });
      alert(`Bukti transfer ditolak. Status tagihan diubah ke Belum Bayar.`);
    }
    setReviewingVerification(null);
  };

  const handleAddBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName || !newBankNumber || !newBankHolder) {
      alert("Lengkapi semua field bank.");
      return;
    }
    const currentAccounts = systemState.customization?.paymentAccounts || [];
    const updatedAccounts = [
      ...currentAccounts,
      { bankName: newBankName, accountNumber: newBankNumber, holderName: newBankHolder }
    ];

    await onUpdateState("customization", "update", { paymentAccounts: updatedAccounts });
    setNewBankName("");
    setNewBankNumber("");
    setNewBankHolder("");
    alert("Rekening PT SCI Berhasil Ditambahkan!");
  };

  const handleDeleteBankAccount = async (indexToDelete: number) => {
    const currentAccounts = systemState.customization?.paymentAccounts || [];
    const updatedAccounts = currentAccounts.filter((_, idx) => idx !== indexToDelete);
    await onUpdateState("customization", "update", { paymentAccounts: updatedAccounts });
  };

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 text-center space-y-6 shadow-sm animate-fade-in">
        <div className="h-14 w-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto ring-4 ring-amber-100">
          <CreditCard className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Otentikasi Diperlukan</h2>
          <p className="text-[13px] text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
            Portal tagihan dan admin keuangan siswa memerlukan login pengguna LPK Source Course Indonesia.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition shadow-sm"
        >
          Masuk ke Akun
        </button>
      </div>
    );
  }

  // Check if teacher/staff is redirected to TeacherDashboardPanel
  const isPersonalStaff = ["Pengajar", "Alumni"].includes(currentUser.role);

  if (isPersonalStaff) {
    return (
      <TeacherDashboardPanel 
        currentUser={currentUser} 
        systemState={systemState} 
        onUpdateState={onUpdateState} 
        setActiveTab={setActiveTab} 
      />
    );
  }

  const isAdminOrVvip = currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "VVIP" || currentUser.role === "Admin Biasa";

  // Registered Student Names Set (from official accounts & active registration records)
  const registeredStudentNamesSet = new Set([
    ...(systemState.activeStudents || []).map(s => (s.name || "").trim()),
    ...(systemState.registeredStudents || []).map(s => (s.name || "").trim()),
    ...(systemState.users || []).map(u => (u.name || "").trim())
  ].filter(Boolean));

  // Names from payment records (including manual entries)
  const manualPaymentStudentNames = Array.from(new Set(
    (systemState.payments || []).map(p => (p.studentName || "").trim()).filter(Boolean)
  ));

  // Build dynamic unique students collection using active, registered, and manual lists
  const allStudentNames = Array.from(new Set([
    ...Array.from(registeredStudentNamesSet),
    ...manualPaymentStudentNames
  ])).filter(Boolean).sort();

  const alumniStudentNames = Array.from(new Set([
    ...(systemState.activeStudents || []).filter((s: any) =>
      isStudentAlumni(s) || s.status === "Alumni"
    ).map(s => s.name),
    ...(systemState.registeredStudents || []).filter((s: any) =>
      isStudentAlumni(s) || s.status === "Alumni"
    ).map(s => s.name)
  ])).filter(Boolean).sort();

  const activeStudentNames = allStudentNames.filter(name => !alumniStudentNames.includes(name));

  const isSelectedStudentManual = Boolean(selectedStudent) && !registeredStudentNamesSet.has(selectedStudent.trim());

  const handleOpenSyncModal = (manualName: string) => {
    if (!manualName) return;
    setSyncManualName(manualName);
    setSyncMode("create");
    const registeredList = Array.from(registeredStudentNamesSet).filter(Boolean).sort();
    setSyncTargetStudent(registeredList[0] || "");
    setShowSyncModal(true);
  };

  const handleExecuteSync = async () => {
    if (!syncManualName) return;

    if (syncMode === "create") {
      const username = syncManualName.toLowerCase().replace(/[^a-z0-9]/g, "") || `siswa${Date.now().toString().slice(-4)}`;
      const newStudent = {
        id: "STU-" + Date.now(),
        name: syncManualName,
        status: "Aktif",
        statusPendaftaran: "Siswa Aktif",
        class: "Kelas Reguler",
        registrationDate: new Date().toISOString().split("T")[0]
      };

      const newUser = {
        username: username,
        password: "123",
        name: syncManualName,
        role: "Siswa" as const,
        assignedClass: "Kelas Reguler",
        createdAt: new Date().toISOString()
      };

      await onUpdateState("activeStudents", "add", newStudent);
      await onUpdateState("users", "add", newUser);
      alert(`🎉 SINKRONISASI BERHASIL!\n\nSiswa "${syncManualName}" telah resmi terdaftar di database LPK SCI.\nUsername: ${username}\nPassword Akses: 123`);
      setShowSyncModal(false);
    } else {
      if (!syncTargetStudent) {
        alert("Silakan pilih akun siswa terdaftar dari dropdown.");
        return;
      }

      const studentPayments = systemState.payments?.filter(p => p.studentName === syncManualName) || [];
      for (const p of studentPayments) {
        await onUpdateState("payments", "update", { ...p, studentName: syncTargetStudent });
      }
      alert(`🎉 SINKRONISASI BERHASIL!\n\n${studentPayments.length} tagihan dari "${syncManualName}" telah digabungkan ke akun siswa terdaftar "${syncTargetStudent}".`);
      setSelectedStudent(syncTargetStudent);
      setShowSyncModal(false);
    }
  };

  if (isAdminOrVvip && !selectedStudent) {
    const defaultList = sidebarFilter === "siswa" ? activeStudentNames : alumniStudentNames;
    if (defaultList.length > 0) {
      setSelectedStudent(defaultList[0]);
    } else if (allStudentNames.length > 0) {
      setSelectedStudent(allStudentNames[0]);
    }
  }

  // Dynamic high fidelity aggregated financials calculations (using real database helper)
  let totalLunasGross = 0;
  let totalTunggakanGross = 0;
  let totalPendingVerification = 0;

  const categoryStats = {
    "Administrasi Pendaftaran": { lunas: 0, tunggakan: 0, total: 0 },
    "DP Biaya Belajar": { lunas: 0, tunggakan: 0, total: 0 },
    "Pelunasan Biaya Belajar": { lunas: 0, tunggakan: 0, total: 0 },
    "Manajemen Fee": { lunas: 0, tunggakan: 0, total: 0 }
  };

  allStudentNames.forEach(name => {
    const studentPayments = getStudentPayments(name, systemState.payments || [], systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization);
    studentPayments.forEach(p => {
      let isLunas = p.status === "Lunas";
      let amount = p.amount;

      if (isLunas) {
        totalLunasGross += amount;
      } else {
        totalTunggakanGross += amount;
      }

      if (p.status === "Pending") {
        totalPendingVerification += 1;
      }

      const pCatLower = p.category.toLowerCase();
      if (pCatLower.includes("pendaftaran") || pCatLower.includes("administrasi")) {
        categoryStats["Administrasi Pendaftaran"].total += amount;
        if (isLunas) categoryStats["Administrasi Pendaftaran"].lunas += amount;
        else categoryStats["Administrasi Pendaftaran"].tunggakan += amount;
      } else if (pCatLower.includes("dp") || pCatLower.includes("awal")) {
        categoryStats["DP Biaya Belajar"].total += amount;
        if (isLunas) categoryStats["DP Biaya Belajar"].lunas += amount;
        else categoryStats["DP Biaya Belajar"].tunggakan += amount;
      } else if (pCatLower.includes("pelunasan") || pCatLower.includes("cicilan") || pCatLower.includes("satu") || pCatLower.includes("1")) {
        categoryStats["Pelunasan Biaya Belajar"].total += amount;
        if (isLunas) categoryStats["Pelunasan Biaya Belajar"].lunas += amount;
        else categoryStats["Pelunasan Biaya Belajar"].tunggakan += amount;
      } else if (pCatLower.includes("manajemen") || pCatLower.includes("management") || pCatLower.includes("fee")) {
        categoryStats["Manajemen Fee"].total += amount;
        if (isLunas) categoryStats["Manajemen Fee"].lunas += amount;
        else categoryStats["Manajemen Fee"].tunggakan += amount;
      }
    });
  });

  const grandTotalExpected = totalLunasGross + totalTunggakanGross;
  const lunasPercentage = grandTotalExpected > 0 ? (totalLunasGross / grandTotalExpected) * 100 : 0;

  const allPays = systemState.payments || [];
  const currentSiswaPayments = getStudentPayments(currentUser.name, allPays, systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization);

  return (
    <div className="p-3 sm:p-6 text-left max-w-7xl mx-auto space-y-6">
      
      {/* 1. ADMIN PANEL DECK */}
      {isAdminOrVvip ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Header Banner */}
          <div className="bg-white p-4 sm:p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  Akses Console Keuangan
                </span>
                <h2 className="font-display font-black text-xl sm:text-2xl text-slate-800 tracking-tight flex items-center gap-2">
                  <PieChart className="h-6 w-6 text-indigo-600" />
                  Admin Keuangan Siswa
                </h2>
                <p className="text-xs text-slate-500 max-w-xl">
                  Sistem monitoring tagihan program, rekapitulasi pelunasan alumni, verifikasi bukti transfer manual digital, serta kustomisasi SOP Biaya PT SCI Pati.
                </p>
              </div>

              {/* Console Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 border border-slate-200/80 rounded-2xl w-full md:w-auto md:self-center shadow-inner">
                <button
                  onClick={() => setAdminActiveTab("dashboard")}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    adminActiveTab === "dashboard"
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-indigo-50/90 to-purple-50/90 text-indigo-700 hover:from-indigo-600 hover:to-purple-600 hover:text-white border border-indigo-100 hover:border-transparent hover:shadow-md hover:shadow-indigo-500/20"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" /> <span className="truncate">Dashboard</span>
                </button>
                <button
                  onClick={() => setAdminActiveTab("manajemen")}
                  className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    adminActiveTab === "manajemen"
                      ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-emerald-50/90 to-teal-50/90 text-emerald-700 hover:from-emerald-600 hover:to-teal-600 hover:text-white border border-emerald-100 hover:border-transparent hover:shadow-md hover:shadow-emerald-500/20"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" /> <span className="truncate">Tagihan Siswa</span>
                </button>
                <button
                  onClick={() => setAdminActiveTab("settings")}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    adminActiveTab === "settings"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-amber-50/90 to-orange-50/90 text-amber-700 hover:from-amber-500 hover:to-orange-500 hover:text-white border border-amber-100 hover:border-transparent hover:shadow-md hover:shadow-amber-500/20"
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" /> <span className="truncate">Konfig SOP</span>
                </button>
                <button
                  onClick={() => setAdminActiveTab("grafik")}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                    adminActiveTab === "grafik"
                      ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02]"
                      : "bg-gradient-to-r from-purple-50/90 to-pink-50/90 text-purple-700 hover:from-violet-600 hover:to-fuchsia-600 hover:text-white border border-purple-100 hover:border-transparent hover:shadow-md hover:shadow-purple-500/20"
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" /> 
                  <span className="truncate">Grafik Keuangan Siswa</span>
                  <span className="ml-1 text-[8.5px] bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded-full font-black tracking-tight">SUPER & VVIP</span>
                </button>
              </div>
            </div>

            {/* HIGH DENSITY STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> Siswa Aktif
                </span>
                <div className="mt-2 text-xl font-black text-slate-800 font-mono">
                  {activeStudentNames.length} <span className="text-xs font-sans text-slate-500 font-normal">Siswa</span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400" /> Alumni
                </span>
                <div className="mt-2 text-xl font-black text-slate-800 font-mono">
                  {alumniStudentNames.length} <span className="text-xs font-sans text-slate-500 font-normal">Siswa</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Kas Lunas
                </span>
                <div className="mt-2 text-xl font-black text-emerald-700 font-mono">
                  Rp {totalLunasGross.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Total Piutang
                </span>
                <div className="mt-2 text-xl font-black text-rose-700 font-mono">
                  Rp {totalTunggakanGross.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col justify-between">
                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Verifikasi
                </span>
                <div className="mt-2 text-xl font-black text-amber-700 font-mono">
                  {totalPendingVerification} <span className="text-xs font-sans text-slate-500 font-normal">Antrian</span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB CONTENT: 1. DASHBOARD */}
          {adminActiveTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Ratio Block */}
              <div className="md:col-span-5 bg-white p-5 rounded-3xl border border-slate-250/60 shadow-xs space-y-5">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <PieChart className="w-4 h-4 text-indigo-600" />
                    Rasio Kas Terbayar
                  </h4>
                  <p className="text-[10px] text-slate-400">Rasio setoran riil lunas dibandingkan dengan seluruh tagihan terdaftar.</p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-550">Total Invoice Terdaftar:</span>
                    <strong className="text-slate-900 font-mono">Rp {grandTotalExpected.toLocaleString("id-ID")}</strong>
                  </div>

                  {/* Progress Stack Bar */}
                  <div className="w-full h-6 bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200">
                    <div 
                      style={{ width: `${lunasPercentage}%` }}
                      className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-black font-mono transition-all duration-500"
                    >
                      {lunasPercentage > 15 && `${lunasPercentage.toFixed(1)}%`}
                    </div>
                    <div 
                      style={{ width: `${100 - lunasPercentage}%` }}
                      className="bg-amber-400 h-full flex items-center justify-center text-[10px] text-slate-900 font-extrabold font-mono transition-all duration-500"
                    >
                      {(100 - lunasPercentage) > 15 && `${(100 - lunasPercentage).toFixed(1)}%`}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10.5px] pt-1">
                    <span className="flex items-center gap-1.5 font-bold text-slate-600">
                      <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Terbayar Lunas ({lunasPercentage.toFixed(1)}%)
                    </span>
                    <span className="flex items-center gap-1.5 font-bold text-slate-600">
                      <span className="w-3 h-3 rounded bg-amber-400 inline-block"></span> Piutang Outstanding ({ (100 - lunasPercentage).toFixed(1) }%)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10.5px] leading-relaxed text-indigo-950">
                  <p className="font-semibold flex items-center gap-1.5 mb-1 text-indigo-900">
                    <Info className="w-3.5 h-3.5" /> Buku Kas Sinkron Otomatis
                  </p>
                  Setiap tagihan yang disahkan <strong>Lunas</strong> secara manual oleh Admin, sistem secara real-time mencatat pemasukan tersebut ke dalam Buku Kas LPK terpadu.
                </div>
              </div>

              {/* Category Breakdown Chart */}
              <div className="md:col-span-7 bg-white p-5 rounded-3xl border border-slate-250/60 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ListFilter className="w-4 h-4 text-indigo-600" />
                    Persentase Pelunasan Per Kategori Anggaran
                  </h4>
                  <p className="text-[10px] text-slate-400">Distribusi realisasi pembayaran untuk masing-masing pos anggaran SOP resmi.</p>
                </div>

                <div className="space-y-4 pt-2">
                  {(Object.keys(categoryStats) as Array<keyof typeof categoryStats>).map(catKey => {
                    const c = categoryStats[catKey];
                    const catRate = c.total > 0 ? (c.lunas / c.total) * 100 : 0;
                    return (
                      <div key={catKey} className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="font-extrabold text-slate-800 truncate max-w-[60%]">{catKey}</span>
                          <span className="text-slate-500 font-mono text-right shrink-0">
                            Rp {c.lunas.toLocaleString("id-ID")} / Rp {c.total.toLocaleString("id-ID")} ({catRate.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div 
                            style={{ width: `${catRate}%` }}
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 2. MANAJEMEN DATA TAGIHAN */}
          {adminActiveTab === "manajemen" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Student Selector Sidebar */}
              <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-black text-slate-900">Daftar Siswa & Alumni</h4>
                    <p className="text-[9.5px] text-slate-400">Pilih siswa untuk mengelola laporan tagihannya.</p>
                  </div>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    title="Catat Pembayaran Baru"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Search query box */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-250 pl-9 pr-4 py-2 bg-slate-50 focus:bg-white focus:border-indigo-500 transition-all outline-none"
                  />
                </div>

                {/* Separation Tabs: Active Students vs Alumni */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
                  <button
                    onClick={() => {
                      setSidebarFilter("siswa");
                      const activeFiltered = activeStudentNames;
                      if (activeFiltered.length > 0) setSelectedStudent(activeFiltered[0]);
                    }}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      sidebarFilter === "siswa" 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Siswa Aktif ({activeStudentNames.length})
                  </button>
                  <button
                    onClick={() => {
                      setSidebarFilter("alumni");
                      const alumniFiltered = alumniStudentNames;
                      if (alumniFiltered.length > 0) setSelectedStudent(alumniFiltered[0]);
                    }}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      sidebarFilter === "alumni" 
                        ? "bg-white text-slate-900 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Alumni LPK ({alumniStudentNames.length})
                  </button>
                </div>

                {/* List items with Pagination */}
                {(() => {
                  const filteredNames = (sidebarFilter === "siswa" ? activeStudentNames : alumniStudentNames)
                    .filter(name => name.toLowerCase().includes(searchQuery.toLowerCase()));

                  const itemsPerPage = 8;
                  const totalPages = Math.ceil(filteredNames.length / itemsPerPage) || 1;
                  const currentPage = Math.min(sidebarPage, totalPages);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const paginatedNames = filteredNames.slice(startIndex, startIndex + itemsPerPage);

                  return (
                    <div className="space-y-3">
                      <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                        {paginatedNames.map(name => {
                          const isSelected = selectedStudent === name;
                          const studentPays = getStudentPayments(name, systemState.payments || [], systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization);
                          const isFullyPaid = studentPays.length > 0 && studentPays.every(p => p.status === "Lunas");
                          const hasPending = studentPays.some(p => p.status === "Pending");
                          
                          return (
                            <button
                              key={name}
                              onClick={() => setSelectedStudent(name)}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition duration-150 flex items-center justify-between ${
                                isSelected 
                                  ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                                  : "bg-slate-50 border-slate-200 text-slate-700 font-medium hover:bg-slate-100"
                              }`}
                            >
                              <div className="truncate pr-2 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate block font-semibold">{name}</span>
                                  {!registeredStudentNamesSet.has(name.trim()) && (
                                    <span 
                                      className={`text-[8px] px-1 py-0.2 rounded font-black shrink-0 ${
                                        isSelected 
                                          ? 'bg-amber-400 text-slate-900' 
                                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                                      }`} 
                                      title="Diinput secara manual (Belum disinkronkan ke Akun)"
                                    >
                                      Manual
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[8.5px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'} font-mono block`}>
                                  Lunas: {studentPays.filter(p => p.status === 'Lunas').length} / {studentPays.length}
                                </span>
                              </div>
                              
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                                studentPays.length === 0
                                  ? (isSelected ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 text-slate-500')
                                  : isFullyPaid 
                                    ? (isSelected ? 'bg-indigo-500/50 text-white' : 'bg-emerald-100 text-emerald-800') 
                                    : hasPending
                                      ? (isSelected ? 'bg-indigo-500/50 text-white border border-indigo-300 animate-pulse' : 'bg-yellow-100 text-yellow-800')
                                      : (isSelected ? 'bg-indigo-500/50 text-white' : 'bg-amber-100 text-amber-800')
                              }`}>
                                {studentPays.length === 0 ? "0 Tagihan" : isFullyPaid ? "Lunas" : hasPending ? "Pending VA" : "Outstanding"}
                              </span>
                            </button>
                          );
                        })}

                        {filteredNames.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-xs italic font-mono">
                            Belum ada {sidebarFilter === "siswa" ? "siswa" : "alumni"} yang cocok.
                          </div>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] font-mono">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setSidebarPage(prev => Math.max(prev - 1, 1))}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-700"
                          >
                            &larr; Prev
                          </button>
                          <span className="text-slate-500 font-bold">
                            Hal {currentPage} / {totalPages}
                          </span>
                          <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setSidebarPage(prev => Math.min(prev + 1, totalPages))}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer text-slate-700"
                          >
                            Next &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Right Column: Student detailed view & controls */}
              <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-250/60 shadow-xs space-y-4">
                {selectedStudent ? (
                  <div className="space-y-4">
                    
                    {/* Header profile student */}
                    <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900">{selectedStudent}</h4>
                          {isSelectedStudentManual ? (
                            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                              <Info className="w-3 h-3 text-amber-700" /> Input Manual
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-2xs">
                              <UserCheck className="w-3 h-3 text-emerald-600" /> Terdaftar & Sinkron
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Daftar Tagihan Resmi Program & Kuitansi Pembayaran Siswa</p>
                      </div>

                      <div className="flex flex-wrap gap-2 self-start sm:self-center">
                        {isSelectedStudentManual && (
                          <button
                            type="button"
                            onClick={() => handleOpenSyncModal(selectedStudent)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            title="Singkronkan Data Siswa Manual ke Akun Terdaftar LPK SCI"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Singkronkan Data Siswa
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setFormStudentName(selectedStudent);
                            setShowAddPaymentModal(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Tagihan Custom
                        </button>
                        
                        <ConfirmButton
                          confirmTitle="Hapus Rincian Tagihan"
                          confirmMessage={`Apakah Anda yakin ingin menghapus seluruh rincian riwayat tagihan/pembayaran milik "${selectedStudent}"? Data profil & akun siswa TIDAK akan terhapus.`}
                          onConfirmClick={async () => {
                            // Tandai semua pembayaran milik siswa sebagai dihapus
                            const studentPayments = systemState.payments?.filter(p => (p.studentName || "").trim().toLowerCase() === selectedStudent.trim().toLowerCase()) || [];
                            for (const p of studentPayments) {
                              await onUpdateState('payments', 'update', { ...p, status: "Dihapus", isDeleted: true });
                            }
                            // Simpan marker penanda bahwa semua tagihan siswa ini telah dibersihkan
                            const studentClean = (selectedStudent || "").replace(/\s+/g, "").toUpperCase();
                            await onUpdateState('payments', 'add', {
                              id: `PAY-${studentClean}-CLEARED`,
                              studentName: selectedStudent,
                              category: "ALL_CLEARED",
                              amount: 0,
                              date: new Date().toISOString().split("T")[0],
                              status: "Dihapus",
                              isDeleted: true,
                              isClearedAll: true
                            });
                          }}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Hapus Rincian Tagihan"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus Rincian Tagihan
                        </ConfirmButton>
                      </div>
                    </div>

                    {/* Manual Student Info & Sync Alert Banner */}
                    {isSelectedStudentManual && (
                      <div className="p-3 bg-amber-50/90 border border-amber-250/70 rounded-2xl text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                        <div className="flex items-start gap-2.5">
                          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-extrabold text-[11.5px] block text-amber-950">
                              💡 Informasi: Data Siswa Ini Diinput Manual
                            </strong>
                            <p className="text-[10.5px] text-amber-800 leading-relaxed mt-0.5">
                              Siswa <span className="font-extrabold underline">{selectedStudent}</span> berasal dari inputan manual kuitansi dan belum terhubung ke Akun Login / Database Terdaftar. Klik tombol <span className="font-extrabold">"Singkronkan Data Siswa"</span> untuk membuatkan akun login secara otomatis atau menggabungkannya dengan siswa lain.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenSyncModal(selectedStudent)}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-xl text-xs transition shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5 self-start sm:self-center"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Singkronkan Data Siswa
                        </button>
                      </div>
                    )}

                    {/* Check if any payment requires verification */}
                    {(() => {
                      const studentPays = getStudentPayments(selectedStudent, systemState.payments || [], systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization);
                      const pendingVerifyList = studentPays.filter(p => p.status === "Pending");
                      if (pendingVerifyList.length === 0) return null;
                      return (
                        <div className="p-3 bg-yellow-50/70 border border-yellow-250/50 rounded-2xl text-left space-y-2 text-xs">
                          <p className="font-bold text-yellow-800 flex items-center gap-1.5 animate-pulse">
                            ⚠️ Terdeteksi {pendingVerifyList.length} Pembayaran Menunggu Verifikasi TTD
                          </p>
                          <div className="space-y-1">
                            {pendingVerifyList.map(p => (
                              <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-yellow-100">
                                <div>
                                  <strong className="text-slate-900 block font-bold">{p.category}</strong>
                                  <span className="text-[10px] text-slate-500">Nominal: Rp {p.amount.toLocaleString("id-ID")} • Metode: {p.paymentMethod}</span>
                                </div>
                                <button
                                  onClick={() => setReviewingVerification(p)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9.5px] font-bold cursor-pointer"
                                >
                                  Verifikasi TTD
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const isAlumni = ((systemState.activeStudents || []) as any[]).some(s =>
                        (s.name || "").trim().toLowerCase() === (selectedStudent || "").trim().toLowerCase() &&
                        (isStudentAlumni(s) || s.status === "Alumni")
                      ) || ((systemState.registeredStudents || []) as any[]).some(s =>
                        (s.name || "").trim().toLowerCase() === (selectedStudent || "").trim().toLowerCase() &&
                        (isStudentAlumni(s) || s.status === "Alumni")
                      );

                      if (!isAlumni) return null;

                      const studentObj = ((systemState.activeStudents || []) as any[]).find(s => 
                        (s.name || "").trim().toLowerCase() === (selectedStudent || "").trim().toLowerCase()
                      ) || ((systemState.registeredStudents || []) as any[]).find(s =>
                        (s.name || "").trim().toLowerCase() === (selectedStudent || "").trim().toLowerCase()
                      ) as any;

                      const studentClass = studentObj ? (studentObj.class || studentObj.assignedClass || "") : "";
                      const classNameToShow = studentClass || "";
                      const alumniClassesList = systemState.customization?.landingConfig?.alumniClasses || [];
                      const matchedAlumniClass = studentClass ? alumniClassesList.find((c: any) => {
                        const titleLower = (c.title || "").toLowerCase();
                        const classLower = studentClass.toLowerCase();
                        return classLower.includes(titleLower) || titleLower.includes(classLower);
                      }) : undefined;
                      const classFee = matchedAlumniClass ? parsePrice(matchedAlumniClass.finalPrice) : 0;

                      return (
                        <div className="p-4 bg-indigo-50/70 border border-indigo-200/50 rounded-2xl text-left space-y-2 text-xs animate-fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md inline-block">
                                Kelas & Biaya Bimbingan Alumni LPK
                              </span>
                              <h5 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-indigo-600" />
                                Penyesuaian Tarif Alumni: {classNameToShow || "Belum Diplot"}
                              </h5>
                              <p className="text-[11px] text-slate-550 leading-relaxed">
                                Biaya otomatis disesuaikan dengan Manajemen Kelas Alumni:{" "}
                                {matchedAlumniClass ? (
                                  <span className="text-emerald-700 font-bold">
                                    Cocok dengan "{matchedAlumniClass.title}" (Rp {classFee.toLocaleString("id-ID")})
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-bold">
                                    Belum diplot ke Kelas Alumni aktif. Tagihan otomatis tidak ada (Rp 0).
                                  </span>
                                )}
                              </p>
                            </div>

                            {isAdminOrVvip && studentObj && (
                              <div className="shrink-0">
                                <label className="text-[9px] font-black uppercase text-slate-500 block mb-1 font-mono">Setel Kelas Alumni:</label>
                                <select
                                  value={studentClass}
                                  onChange={async (e) => {
                                    const newClass = e.target.value;
                                    if (!newClass) return;
                                    const isAct = (systemState.activeStudents || []).some(s => s.id === studentObj.id);
                                    try {
                                      if (isAct) {
                                        await onUpdateState("activeStudents", "update", { ...studentObj, class: newClass });
                                      } else {
                                        await onUpdateState("registeredStudents", "update", { ...studentObj, class: newClass });
                                      }
                                      alert(`Berhasil memplot ${selectedStudent} ke kelas "${newClass}". Tagihan bimbingan alumni otomatis berubah menjadi Rp ${parsePrice(alumniClassesList.find((c:any)=>c.title===newClass)?.finalPrice).toLocaleString("id-ID")}!`);
                                    } catch (err: any) {
                                      alert("Gagal mengupdate kelas: " + err.message);
                                    }
                                  }}
                                  className="text-[11px] bg-white border border-slate-300 rounded-xl px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                                >
                                  <option value="">-- Pilih Kelas Alumni --</option>
                                  {alumniClassesList.map((cls: any) => (
                                    <option key={cls.title} value={cls.title}>
                                      {cls.title} ({cls.finalPrice || "Rp 1.000.000"})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Timeline lists */}
                    <div className="space-y-3">
                      {getStudentPayments(selectedStudent, systemState.payments || [], systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization).map((p, index) => {
                        return (
                          <div key={p.id} className="relative p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-left transition duration-150">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-mono font-bold text-[9px] text-slate-600 shrink-0">
                                  {index + 1}
                                </span>
                                <strong className="text-slate-800 font-extrabold text-[12px] truncate">{p.category}</strong>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pl-7 text-[10px] text-slate-500 font-mono">
                                <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded truncate max-w-[100px]" title={p.id}>{p.id}</span>
                                <span className="font-bold text-slate-700">Rp {p.amount.toLocaleString("id-ID")}</span>
                                <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-600">{p.paymentMethod || "Belum Bayar"}</span>
                                <span className="text-slate-400 shrink-0">{p.date}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pl-7 sm:pl-0 self-start sm:self-center shrink-0">
                              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                                p.status === "Lunas" ? "bg-emerald-100 text-emerald-800" :
                                p.status === "Cicilan" ? "bg-amber-100 text-amber-800" :
                                p.status === "Pending" ? "bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse" :
                                "bg-slate-200 text-slate-700"
                              }`}>
                                {p.status === "Pending" ? "Menunggu Verifikasi" : p.status}
                              </span>

                              <button 
                                onClick={() => setActivePaymentDetail(p)}
                                className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1 text-[10px] font-bold border border-indigo-150"
                                title="Unduh Invoice PDF (Lunas / Belum Lunas)"
                              >
                                <Download className="w-3 h-3" /> Invoice PDF
                              </button>

                              {p.proofOfPayment && (
                                <button
                                  onClick={() => setReviewingVerification(p)}
                                  className="text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 p-1 rounded-md transition cursor-pointer"
                                  title="Lihat Bukti Lampiran Transfer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                              
                              <button 
                                onClick={() => {
                                  setEditCategory(p.category);
                                  setEditAmount(p.amount);
                                  setEditStatus(p.status as any);
                                  setEditMethod(p.paymentMethod || "Cash");
                                  setEditProofOfPayment(p.proofOfPayment || "");
                                  setShowEditPaymentModal(p);
                                }}
                                className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 p-1 rounded-md transition cursor-pointer"
                                title="Edit Detail Tagihan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {(currentUser?.role === 'Admin Super' || currentUser?.role === 'VVIP' || currentUser?.role === 'Admin' || currentUser?.role === 'Admin Biasa') && (
                                <ConfirmButton
                                  confirmTitle="Hapus Rincian Tagihan"
                                  confirmMessage={`Apakah Anda yakin ingin menghapus rincian tagihan "${p.category}" (Rp ${p.amount.toLocaleString("id-ID")}) milik ${selectedStudent}? Data profil siswa tidak akan terhapus.`}
                                  onConfirmClick={() => handleDeletePayment(p.id, p)}
                                  className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded-md transition cursor-pointer"
                                  title="Hapus Rincian Tagihan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </ConfirmButton>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Summary of Student balance */}
                    {(() => {
                      const studentPays = getStudentPayments(selectedStudent, systemState.payments || [], systemState.costConfig, systemState.activeStudents, systemState.registeredStudents, systemState.customization);
                      const totalSiswaPaid = studentPays.filter(p => p.status === "Lunas").reduce((acc, curr) => acc + curr.amount, 0);
                      const totalSiswaExpected = studentPays.reduce((acc, curr) => acc + curr.amount, 0);
                      const isSiswaLunasAll = studentPays.every(p => p.status === "Lunas");

                      return (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-left">
                          <div>
                            <p className="font-extrabold text-slate-800">Total Akumulasi Pembayaran Siswa</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Live realisasi setoran kas LPK resmi</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900 font-mono">
                              Rp {totalSiswaPaid.toLocaleString("id-ID")} <span className="text-[10px] text-slate-400 font-normal">/ Rp {totalSiswaExpected.toLocaleString("id-ID")}</span>
                            </p>
                            <span className={`text-[9px] font-mono font-bold mt-1 inline-block ${isSiswaLunasAll ? "text-emerald-600" : "text-amber-600"}`}>
                              {isSiswaLunasAll ? "✓ STATUS KAS BERES / AMAN" : `⚠️ BELUM LUNAS (SISA Rp ${(totalSiswaExpected - totalSiswaPaid).toLocaleString("id-ID")})`}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-3xl font-mono text-xs">
                    Pilih nama siswa untuk mengelola laporan tagihan.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. SETTINGS & REKENING MANAGEMENT */}
          {adminActiveTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Left Column: SOP Biaya Program */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    SOP Anggaran Resmi LPK PT SCI
                  </h4>
                  <p className="text-[10px] text-slate-400">Tentukan standar nominal wajib untuk setiap paket pendaftaran.</p>
                </div>

                <form onSubmit={handleSaveCostConfig} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">Administrasi Pendaftaran (Rp)</label>
                    <input type="number" required value={costRegistration} onChange={e => setCostRegistration(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs font-bold font-mono outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">DP Biaya Belajar (Persiapan Awal) (Rp)</label>
                    <input type="number" required value={costDP} onChange={e => setCostDP(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs font-bold font-mono outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">Pelunasan Biaya Belajar (Rp)</label>
                    <input type="number" required value={costFullPayment} onChange={e => setCostFullPayment(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs font-bold font-mono outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block mb-1">Management Fee (Pasca Lolos CoE) (Rp)</label>
                    <input type="number" required value={costManagementFee} onChange={e => setCostManagementFee(Number(e.target.value))} className="w-full border rounded-xl p-2 text-xs font-bold font-mono outline-none focus:border-indigo-500" />
                  </div>
                  <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                    Simpan SOP Biaya Baru
                  </button>
                </form>
              </div>

              {/* Right Column: Manage SCI Official Bank Accounts */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-indigo-600" />
                    Manajemen Rekening LPK Resmi
                  </h4>
                  <p className="text-[10px] text-slate-400">Tambahkan atau hapus akun penerimaan transfer bank untuk portal siswa.</p>
                </div>

                {/* List of active Bank Accounts */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(systemState.customization?.paymentAccounts || []).map((acc, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-extrabold text-slate-800 block">{acc.bankName}</span>
                        <span className="font-mono text-slate-650 tracking-wider block mt-0.5">{acc.accountNumber}</span>
                        <span className="text-[9px] text-slate-450">a.n {acc.holderName}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteBankAccount(idx)}
                        className="text-rose-500 hover:text-rose-750 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(systemState.customization?.paymentAccounts || []).length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic font-mono border border-dashed rounded-xl">
                      Belum ada rekening bank resmi.
                    </div>
                  )}
                </div>

                {/* Add new Bank Account form */}
                <form onSubmit={handleAddBankAccount} className="border-t border-slate-100 pt-3 space-y-2.5">
                  <span className="text-[10px] font-black uppercase text-slate-700 font-mono block">Tambah Rekening Baru:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <input type="text" required placeholder="Nama Bank (e.g. BCA)" value={newBankName} onChange={e => setNewBankName(e.target.value)} className="border rounded-lg p-2 outline-none focus:border-indigo-500" />
                    <input type="text" required placeholder="Nomor Rekening" value={newBankNumber} onChange={e => setNewBankNumber(e.target.value)} className="border rounded-lg p-2 font-mono outline-none focus:border-indigo-500" />
                  </div>
                  <input type="text" required placeholder="Nama Pemilik Rekening" value={newBankHolder} onChange={e => setNewBankHolder(e.target.value)} className="w-full text-xs border rounded-lg p-2 outline-none focus:border-indigo-500" />
                  <button type="submit" className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition">
                    + Daftarkan Rekening
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. GRAFIK ANALYTICS KAS (Super Admin & VVIP) */}
          {adminActiveTab === "grafik" && (
            <div className="space-y-6 text-left animate-fade-in">
              {/* Header Banner */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-3xl border border-indigo-900 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 z-10">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                      KHUSUS ADMIN SUPER & VVIP
                    </span>
                    <span className="bg-indigo-500/30 text-indigo-200 text-[9px] font-mono px-2 py-0.5 rounded-full border border-indigo-400/30">
                      Real-time Analytics Engine
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    Grafik Interactive Visualisasi Keuangan Siswa
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    Analisis mendalam mengenai arus kas masuk, rasio pelunasan tagihan per kategori SOP, distribusi status pembayaran siswa, serta tren transaksi terkini.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 z-10">
                  <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
                    <div className="text-[9px] text-slate-300 font-mono uppercase font-bold">Total Nilai Tagihan</div>
                    <div className="text-base font-black font-mono text-emerald-400">Rp {grandTotalExpected.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Realisasi Kas Lunas
                  </span>
                  <div className="text-lg font-black text-emerald-600 font-mono">
                    Rp {totalLunasGross.toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {lunasPercentage.toFixed(1)}% dari total target tagihan terdaftar
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Total Piutang Belum Bayar
                  </span>
                  <div className="text-lg font-black text-rose-600 font-mono">
                    Rp {totalTunggakanGross.toLocaleString("id-ID")}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {(100 - lunasPercentage).toFixed(1)}% piutang belum direalisasi
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-500" /> Collection Efficiency
                  </span>
                  <div className="text-lg font-black text-indigo-600 font-mono">
                    {lunasPercentage.toFixed(1)}%
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div style={{ width: `${lunasPercentage}%` }} className="bg-indigo-600 h-full rounded-full" />
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" /> Antrian Verifikasi
                  </span>
                  <div className="text-lg font-black text-amber-600 font-mono">
                    {totalPendingVerification} Transaksi
                  </div>
                  <p className="text-[10px] text-amber-700 font-medium">
                    Membutuhkan konfirmasi admin
                  </p>
                </div>
              </div>

              {/* Chart Grid Row 1: Bar Chart Per Kategori & Donut Status */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Bar Chart */}
                <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        Perbandingan Kas Lunas vs Piutang Per SOP
                      </h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5">
                        Breakdown nominal terbayar vs outstanding piutang di tiap pos anggaran.
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart
                        data={(Object.keys(categoryStats) as Array<keyof typeof categoryStats>).map((catKey) => {
                          const c = categoryStats[catKey];
                          return {
                            name: catKey.length > 14 ? catKey.slice(0, 14) + "..." : catKey,
                            fullName: catKey,
                            Lunas: c.lunas,
                            Tunggakan: Math.max(0, c.total - c.lunas)
                          };
                        })}
                        margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(val) => `Rp ${(val/1000000).toFixed(0)}M`} />
                        <Tooltip
                          formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, ""]}
                          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px", fontWeight: "bold" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                        <Bar dataKey="Lunas" fill="#10B981" radius={[6, 6, 0, 0]} name="Terbayar Lunas" />
                        <Bar dataKey="Tunggakan" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Piutang Belum Bayar" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart: Donut Status */}
                <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-600" />
                      Distribusi Status Tagihan Siswa
                    </h4>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Proporsi status seluruh record pembayaran aktif di dalam sistem.
                    </p>
                  </div>

                  {(() => {
                    const statusCounts = {
                      Lunas: allPays.filter(p => p.status === "Lunas" && !p.isDeleted).length,
                      "Belum Bayar": allPays.filter(p => (p.status === "Belum Bayar" || !p.status) && !p.isDeleted).length,
                      Cicilan: allPays.filter(p => p.status === "Cicilan" && !p.isDeleted).length,
                      Pending: allPays.filter(p => p.status === "Pending" && !p.isDeleted).length,
                    };
                    const pieData = [
                      { name: "Lunas", value: statusCounts.Lunas, color: "#10B981" },
                      { name: "Belum Bayar", value: statusCounts["Belum Bayar"], color: "#EF4444" },
                      { name: "Cicilan", value: statusCounts.Cicilan, color: "#F59E0B" },
                      { name: "Pending", value: statusCounts.Pending, color: "#6366F1" },
                    ].filter(d => d.value > 0);

                    return (
                      <div className="h-64 w-full flex flex-col items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={85}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(val: any, name: any) => [`${val} Tagihan`, name]}
                              contentStyle={{ borderRadius: "12px", fontSize: "11px", fontWeight: "bold" }}
                            />
                          </RePieChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-2 gap-2 w-full pt-2">
                          {pieData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[10.5px] p-2 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                {item.name}
                              </span>
                              <span className="font-black font-mono text-slate-900">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Chart Grid Row 2: Metode Pembayaran & Ranking Siswa Lunas */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Metode Pembayaran Terfavorit */}
                <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      Metode Transfer & Pembayaran Terfavorit
                    </h4>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Kanal pembayaran yang sering diakses siswa untuk pelunasan.
                    </p>
                  </div>

                  {(() => {
                    const methodStats: Record<string, { count: number; total: number }> = {};
                    allPays.filter(p => !p.isDeleted).forEach(p => {
                      const m = p.paymentMethod || "Manual Cash";
                      if (!methodStats[m]) methodStats[m] = { count: 0, total: 0 };
                      methodStats[m].count += 1;
                      if (p.status === "Lunas") methodStats[m].total += (p.amount || 0);
                    });

                    const methodList = Object.keys(methodStats).map(k => ({
                      method: k,
                      count: methodStats[k].count,
                      total: methodStats[k].total
                    })).sort((a, b) => b.total - a.total);

                    return (
                      <div className="space-y-2.5">
                        {methodList.map((m, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/80 transition rounded-2xl border border-slate-200/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-mono font-black text-xs shrink-0">
                                #{idx + 1}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-800 text-xs block">{m.method}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{m.count} transaksi dicatat</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-emerald-600 text-xs font-mono block">
                                Rp {m.total.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">Total Lunas</span>
                            </div>
                          </div>
                        ))}

                        {methodList.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400 italic">Belum ada data transaksi metode pembayaran.</div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Top Ranking Siswa Lunas */}
                <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-500" />
                      Siswa & Alumni Kontributor Pelunasan Terbesar
                    </h4>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      Daftar siswa dengan total akumulasi pembayaran terbanyak yang telah terverifikasi.
                    </p>
                  </div>

                  {(() => {
                    const studentTotals: Record<string, number> = {};
                    allPays.filter(p => p.status === "Lunas" && !p.isDeleted).forEach(p => {
                      const name = p.studentName || "Siswa Anonymous";
                      studentTotals[name] = (studentTotals[name] || 0) + (p.amount || 0);
                    });

                    const topList = Object.keys(studentTotals).map(name => ({
                      name,
                      total: studentTotals[name]
                    })).sort((a, b) => b.total - a.total).slice(0, 5);

                    return (
                      <div className="space-y-2.5">
                        {topList.map((s, idx) => (
                          <div key={idx} className="p-3 bg-gradient-to-r from-amber-50/60 to-orange-50/40 rounded-2xl border border-amber-200/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                                #{idx + 1}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-900 text-xs block">{s.name}</span>
                                <span className="text-[9.5px] text-amber-700 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md inline-block mt-0.5">
                                  LUNAS TERVERIFIKASI
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-900 text-xs font-mono block">
                                Rp {s.total.toLocaleString("id-ID")}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">Akumulasi Realisasi</span>
                            </div>
                          </div>
                        ))}

                        {topList.length === 0 && (
                          <div className="py-8 text-center text-xs text-slate-400 italic">Belum ada data siswa yang melunasi pembayaran.</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        
        /* 3. STUDENT BILLING BOARD (Siswa Access Only) */
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-md space-y-4 animate-fade-in text-slate-850">
          <div className="border-b pb-4 space-y-2 text-left">
            <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md inline-block">
              PORTAL TAGIHAN MANDIRI
            </span>
            <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              Tagihan & Histori Pembayaran Saya
            </h3>
            <p className="text-xs text-slate-500">
              Halo <strong>{currentUser.name}</strong>, berikut adalah daftar tagihan program wajib Anda di LPK PT SCI Pati. Pilih tagihan yang belum lunas untuk memproses pembayaran secara aman.
            </p>
          </div>

          {/* WARNING GUIDE BANNER */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[10.5px] leading-relaxed text-amber-950 flex gap-2 text-left">
            <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold">Panduan Proses Pelunasan Mandiri:</p>
              <p className="mt-0.5 opacity-90">
                Klik pada tagihan berlabel <strong>BELUM BAYAR</strong> atau <strong>CICILAN</strong> di bawah. Anda bisa memilih bayar tunai (cash di kantor), transfer manual ke rekening bank PT SCI, atau checkout instan online Virtual Account.
              </p>
            </div>
          </div>

          {/* LIST OF THE INTEGRATED BILLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-left">
            {currentSiswaPayments.map((payment, i) => {
              const isPaid = payment.status === "Lunas";
              return (
                <div 
                  key={i} 
                  onClick={() => setActivePaymentDetail(payment)} 
                  className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all duration-255 text-left"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-slate-950 truncate max-w-[65%]">{payment.category}</h4>
                    <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md shrink-0 border ${
                      isPaid 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : payment.status === 'Pending'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-100 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>{payment.status === "Pending" ? "Menunggu Verifikasi" : payment.status}</span>
                  </div>

                  <p className="text-xs text-slate-500 font-semibold">
                    Metode: {payment.paymentMethod || "Belum Dipilih"} • Tanggal: {payment.date}
                  </p>

                  <div className="border-t border-slate-200/65 pt-3 flex items-center justify-between font-mono">
                    <span className="text-slate-400 text-xs">Total Anggaran:</span>
                    <strong className="text-slate-900 text-sm">Rp {payment.amount.toLocaleString("id-ID")}</strong>
                  </div>

                  {/* Dynamic Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePaymentDetail(payment);
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> Detail & Bayar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePaymentDetail(payment);
                      }}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-300 transition shadow-2xs"
                      title="Unduh Invoice PDF (Lunas / Belum Lunas)"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" /> Invoice PDF
                    </button>
                  </div>

                  {!isPaid && payment.status !== "Pending" && (
                    <div className="text-center text-[10.5px] font-black text-indigo-750 bg-indigo-50 p-2 rounded-xl border border-indigo-150 animate-pulse flex items-center justify-center gap-1.5">
                      <span>Proses Bayar Mandiri (3 Metode)</span> <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {payment.status === "Pending" && (
                    <div className="text-center text-[10.5px] font-semibold text-slate-500 bg-slate-100 p-2 rounded-xl border border-slate-200">
                      ⌛ Menunggu Verifikasi TTD Kasir LPK SCI
                    </div>
                  )}

                  {isPaid && (
                    <div className="text-center text-[10.5px] font-semibold text-emerald-750 bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      ✓ Pembayaran Selesai & Lunas Valid
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MODALS CONTAINER */}
      
      {/* 4.1 MODAL VIEW & PAY (STUDENT / ADMIN ACTIONS) */}
      {activePaymentDetail && (
        <PaymentDetailModal
          payment={activePaymentDetail}
          currentUser={currentUser}
          systemState={systemState}
          onUpdateState={onUpdateState}
          onClose={() => setActivePaymentDetail(null)}
        />
      )}

      {/* 4.2 MODAL TAMBAH ANGGARAN BARU (ADMIN ONLY) */}
      {showAddPaymentModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] shadow-2xl flex flex-col text-left animate-fade-in">
            <div className="p-5 border-b bg-indigo-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-indigo-900 text-sm">Input Kwitansi & Kas Masuk Baru</h3>
              <button onClick={() => setShowAddPaymentModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            
            <form onSubmit={handleAddCustomPayment} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase block">Nama Lengkap Siswa</label>
                  <span className="text-[9.5px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    Bisa Manual / Sync Akun
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Manual Input field with Datalist */}
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formStudentName}
                      onChange={e => setFormStudentName(e.target.value)}
                      placeholder="Ketik nama siswa secara manual..."
                      className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 bg-white focus:bg-white focus:border-indigo-600 outline-none transition"
                      list="student-names-list-sync"
                    />
                    <datalist id="student-names-list-sync">
                      {allStudentNames.map(name => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                  </div>

                  {/* Dropdown for quick sync / selection from registered student accounts */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <select
                        value=""
                        onChange={e => {
                          if (e.target.value) {
                            setFormStudentName(e.target.value);
                          }
                        }}
                        className="w-full text-[11px] font-medium border border-indigo-200 bg-indigo-50/70 text-indigo-900 rounded-xl p-2 outline-none cursor-pointer hover:bg-indigo-100/80 transition"
                      >
                        <option value="">⚡ Singkronkan / Pilih dari Akun Siswa Terdaftar ({allStudentNames.length} Akun)</option>
                        {allStudentNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    {formStudentName && (
                      <button
                        type="button"
                        onClick={() => setFormStudentName("")}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0 transition"
                        title="Reset Input Nama"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Kategori Tagihan / Alokasi</label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  placeholder="Misal: Biaya Sertifikasi, Kas Asrama Tambahan"
                  className="w-full text-xs border rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  required
                  value={formAmount}
                  onChange={e => setFormAmount(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold border rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Status Laporan</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full text-xs border rounded-lg p-2 bg-slate-55 outline-none"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Cicilan">Cicilan</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Metode Setoran</label>
                  <select
                    value={formMethod}
                    onChange={e => setFormMethod(e.target.value)}
                    className="w-full text-xs border rounded-lg p-2 bg-slate-55 outline-none"
                  >
                    <option value="Cash">Cash / Tunai</option>
                    <option value="Transfer">Transfer Mandiri</option>
                    <option value="Midtrans VA">Midtrans VA</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                <button type="button" onClick={() => setShowAddPaymentModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">Catat Setoran</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4.3 MODAL EDIT TAGIHAN (ADMIN ONLY) */}
      {showEditPaymentModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] shadow-2xl flex flex-col text-left animate-fade-in">
            <div className="p-5 border-b bg-indigo-50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-indigo-900 text-sm">Edit Data Tagihan Keuangan</h3>
              <button onClick={() => setShowEditPaymentModal(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            
            <form onSubmit={handleEditPaymentSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="bg-slate-50 p-3 rounded-xl border text-[11px] text-slate-500 space-y-1">
                <p>Siswa: <strong>{showEditPaymentModal.studentName}</strong></p>
                <p>ID Invoice: <code className="font-mono">{showEditPaymentModal.id}</code></p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Kategori Tagihan</label>
                <input
                  type="text"
                  required
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full text-xs border rounded-lg p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Nominal Tagihan (Rp)</label>
                <input
                  type="number"
                  required
                  value={editAmount}
                  onChange={e => setEditAmount(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold border rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Status Laporan</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full text-xs border rounded-lg p-2 bg-slate-55 outline-none"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Cicilan">Cicilan</option>
                    <option value="Pending">Pending Verifikasi</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Metode Setoran</label>
                  <input
                    type="text"
                    value={editMethod}
                    onChange={e => setEditMethod(e.target.value)}
                    placeholder="Cash, Transfer, VA"
                    className="w-full text-xs border rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Bukti Foto / Scan Pembayaran</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  disabled={isUploadingEdit} 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setIsUploadingEdit(true);
                      try {
                        const downloadUrl = await uploadFileToFirebase(file, "payments");
                        setEditProofOfPayment(`${file.name}|${downloadUrl}`);
                      } catch (err: any) {
                        alert(`Gagal mengunggah file: ${err.message || err}`);
                      } finally {
                        setIsUploadingEdit(false);
                      }
                    }
                  }} 
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-50" 
                />
                {isUploadingEdit && (
                  <p className="text-indigo-600 font-bold text-[9px] flex items-center gap-1 mt-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Mengunggah berkas...</span>
                  </p>
                )}
                {editProofOfPayment && (
                  <div className="space-y-1 mt-2">
                    <div className="bg-slate-100 rounded-xl border border-slate-200 overflow-hidden min-h-[100px] flex items-center justify-center relative">
                      <img 
                        src={editProofOfPayment.includes("|") ? editProofOfPayment.split("|")[1] : editProofOfPayment} 
                        alt="Bukti Scan" 
                        referrerPolicy="no-referrer"
                        className="max-h-48 object-contain w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-500 truncate block max-w-[80%] font-mono">
                        File: {editProofOfPayment.includes("|") ? editProofOfPayment.split("|")[0] : "bukti.jpg"}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setEditProofOfPayment("")} 
                        className="text-[9px] text-red-600 hover:underline font-bold"
                      >
                        Hapus Lampiran
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t mt-4 shrink-0">
                <button type="button" onClick={() => setShowEditPaymentModal(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 4.4 REVIEW VERIFICATION POPUP (ADMIN ONLY) */}
      {reviewingVerification && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col text-left animate-fade-in">
            <div className="p-5 border-b bg-indigo-700 text-white flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-xs tracking-wider uppercase flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Review Bukti Pembayaran</h3>
              <button onClick={() => setReviewingVerification(null)} className="text-white/70 hover:text-white font-bold text-lg">×</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="space-y-1.5 text-xs text-slate-700 border-b pb-3">
                <p>Nama Siswa: <strong>{reviewingVerification.studentName}</strong></p>
                <p>Kategori: <strong>{reviewingVerification.category}</strong></p>
                <p>Nominal: <strong className="text-indigo-850 font-mono text-sm">Rp {reviewingVerification.amount.toLocaleString("id-ID")}</strong></p>
                <p>Metode: <strong>{reviewingVerification.paymentMethod}</strong></p>
                {reviewingVerification.senderBank && (
                  <>
                    <p>Bank Pengirim: <strong>{reviewingVerification.senderBank}</strong></p>
                    <p>Atas Nama Pengirim: <strong>{reviewingVerification.senderAccountName}</strong></p>
                  </>
                )}
              </div>

              {/* Review Image display */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-black block">Lampiran Bukti Transfer</span>
                <div className="bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden min-h-[160px] flex items-center justify-center relative">
                  {reviewingVerification.proofOfPayment ? (
                    <img 
                      src={reviewingVerification.proofOfPayment.includes("|") ? reviewingVerification.proofOfPayment.split("|")[1] : reviewingVerification.proofOfPayment} 
                      alt="Bukti Pembayaran" 
                      referrerPolicy="no-referrer"
                      className="max-h-96 object-contain w-full"
                    />
                  ) : (
                    <div className="text-slate-400 text-xs italic font-mono text-center p-4">
                      Tidak ada gambar bukti yang diunggah. <br/> (Simulasi Transfer / Cash Kantor)
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons controls */}
              <div className="pt-4 flex flex-col sm:flex-row gap-2 border-t mt-4">
                {reviewingVerification.status === "Pending" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(reviewingVerification, false)}
                      className="w-full sm:w-auto px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs cursor-pointer transition"
                    >
                      Tolak Pembayaran
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyPayment(reviewingVerification, true)}
                      className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <Check className="w-4 h-4" /> Sahkan Lunas & TTD Digital
                    </button>
                  </>
                ) : (
                  <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bukti Pembayaran Telah Divalidasi LPK SCI
                    </span>
                    <button
                      type="button"
                      onClick={() => setReviewingVerification(null)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition"
                    >
                      Tutup Berkas
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 4.5 SINKRONISASI DATA SISWA MODAL */}
      {showSyncModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col text-left animate-fade-in overflow-hidden">
            <div className="p-5 border-b bg-emerald-700 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                <h3 className="font-extrabold text-xs sm:text-sm tracking-wider uppercase">Sinkronisasi Data Siswa Manual</h3>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-white/70 hover:text-white font-bold text-xl cursor-pointer">×</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Siswa Manual: <u className="text-amber-950 font-black">{syncManualName}</u></span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Siswa ini diinput secara manual melalui kuitansi dan belum terhubung ke database akun resmi LPK SCI.
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Pilih Opsi Sinkronisasi
                </label>

                {/* Option 1: Create new account */}
                <div 
                  onClick={() => setSyncMode("create")}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    syncMode === "create" 
                      ? "border-emerald-600 bg-emerald-50/60 shadow-2xs" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="syncMode" 
                    checked={syncMode === "create"} 
                    onChange={() => setSyncMode("create")}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <div>
                    <strong className="text-xs font-bold text-slate-900 block">1. Otomatis Buat Akun Siswa & Pendaftaran Baru</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Mendaftarkan <span className="font-semibold text-slate-800">{syncManualName}</span> secara resmi ke database siswa LPK SCI dan membuatkan akun login portal siswa (password default: <code className="bg-slate-100 px-1 rounded text-emerald-700">123</code>).
                    </p>
                  </div>
                </div>

                {/* Option 2: Merge into registered student dropdown */}
                <div 
                  onClick={() => setSyncMode("merge")}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                    syncMode === "merge" 
                      ? "border-emerald-600 bg-emerald-50/60 shadow-2xs" 
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="syncMode" 
                    checked={syncMode === "merge"} 
                    onChange={() => setSyncMode("merge")}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                  />
                  <div className="w-full">
                    <strong className="text-xs font-bold text-slate-900 block">2. Gabungkan Tagihan ke Siswa Terdaftar Resmi</strong>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Pilih siswa terdaftar resmi dari dropdown di bawah untuk mengalihkan seluruh tagihan ke akun tersebut.
                    </p>

                    {syncMode === "merge" && (
                      <div className="mt-3 space-y-1.5" onClick={e => e.stopPropagation()}>
                        <label className="text-[10px] font-extrabold text-slate-600 uppercase block">
                          Pilih Akun Siswa Terdaftar (Dropdown):
                        </label>
                        <select
                          value={syncTargetStudent}
                          onChange={e => setSyncTargetStudent(e.target.value)}
                          className="w-full text-xs font-bold border-2 border-emerald-500 bg-white text-slate-900 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-200 transition cursor-pointer"
                        >
                          {Array.from(registeredStudentNamesSet).filter(Boolean).sort().map(name => (
                            <option key={name} value={name}>
                              👤 {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowSyncModal(false)} 
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleExecuteSync} 
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Proses Sinkronkan
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
