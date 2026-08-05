import React, { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Info,
  Loader2,
} from "lucide-react";
import { uploadFileToFirebase } from "../lib/storageHelper";
import { ActiveStudent } from "../types";

interface StudentCvViewProps {
  student: ActiveStudent;
  onUpdateStudent: (payload: any) => Promise<boolean>;
  lpkName?: string;
  onBack?: () => void;
}

export default function StudentCvView({
  student,
  onUpdateStudent,
  lpkName = "LPK SOURCE COURSE INDONESIA",
  onBack
}: StudentCvViewProps) {
  // Tabs: "edit" or "preview"
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [editTab, setEditTab] = useState<"personal" | "physical" | "history" | "family" | "saving">("personal");
  const [scale, setScale] = useState(1.0);
  const [uploadingCvPhoto, setUploadingCvPhoto] = useState(false);

  useEffect(() => {
    if (activeTab === "preview") {
      const updateScale = () => {
        if (window.innerWidth < 640) {
          // mobile screen typically 360-400px. Account for padding in MobileDashboardView
          const calculatedScale = Math.max(0.2, Math.min(1.2, (window.innerWidth - 64) / 810));
          setScale(calculatedScale);
        } else if (window.innerWidth < 1024) {
          // tablet screen
          const calculatedScale = Math.max(0.5, Math.min(1.2, (window.innerWidth - 48) / 820));
          setScale(calculatedScale);
        } else {
          // desktop - scale slightly to fit container nicely if needed
          const calculatedScale = Math.max(0.8, Math.min(1.1, (window.innerWidth - 300) / 840));
          setScale(Math.min(1.0, calculatedScale));
        }
      };
      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
  }, [activeTab]);

  // Local state for CV fields to prevent excessive network requests and ensure snappy editing
  const [formData, setFormData] = useState<Partial<ActiveStudent>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize local state from student prop
  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || "",
        gender: student.gender || "Laki-laki",
        birthDate: student.birthDate || "",
        age: student.age || undefined,
        birthPlace: student.birthPlace || "",
        address: student.address || "",
        phone: student.phone || "",
        religion: student.religion || "",
        bloodType: student.bloodType || "",
        marriageStatus: student.marriageStatus || "Lajang",
        tb: student.tb || undefined,
        bb: student.bb || undefined,
        shoeSize: student.shoeSize || undefined,
        waistSize: student.waistSize || undefined,
        headSize: student.headSize || undefined,
        smoking: student.smoking || "Tidak",
        drinking: student.drinking || "Tidak",
        visionRight: student.visionRight || "",
        visionLeft: student.visionLeft || "",
        dominantHand: student.dominantHand || "Kanan",
        colorBlind: student.colorBlind || "Tidak Ada",
        colorBlindDetails: student.colorBlindDetails || "",
        hobby: student.hobby || "",
        specialTalent: student.specialTalent || "",
        strength: student.strength || "",
        weakness: student.weakness || "",
        purposeToJapan: student.purposeToJapan || "",
        savingTarget: student.savingTarget || undefined,
        savingTargetYen: student.savingTargetYen || undefined,
        educationHistory: student.educationHistory || [
          { fromYear: "", fromMonth: "", toYear: "", toMonth: "", schoolName: "", major: "" },
          { fromYear: "", fromMonth: "", toYear: "", toMonth: "", schoolName: "", major: "" },
          { fromYear: "", fromMonth: "", toYear: "", toMonth: "", schoolName: "", major: "" }
        ],
        workHistory: student.workHistory || [
          { fromYear: "", fromMonth: "", toYear: "", toMonth: "", companyName: "", jobType: "" },
          { fromYear: "", fromMonth: "", toYear: "", toMonth: "", companyName: "", jobType: "" },
          { fromYear: "", fromMonth: "", toYear: "", toMonth: "", companyName: "", jobType: "" }
        ],
        emergencyContactName: student.emergencyContactName || "",
        emergencyContactAddress: student.emergencyContactAddress || "",
        emergencyContactPhone: student.emergencyContactPhone || "",
        familyMonthlyIncome: student.familyMonthlyIncome || undefined,
        familyMonthlyIncomeRp: student.familyMonthlyIncomeRp || undefined,
        familyInIndonesia: student.familyInIndonesia || [
          { name: "", age: "", relation: "", job: "" },
          { name: "", age: "", relation: "", job: "" },
          { name: "", age: "", relation: "", job: "" }
        ],
        familyInJapan: student.familyInJapan || [
          { name: "", age: "", relation: "", job: "" }
        ],
        lpkEntryDate: student.lpkEntryDate || "",
        studyDuration: student.studyDuration || "",
        email: student.email || "",
        profilePicture: student.profilePicture || ""
      });
    }
  }, [student]);

  const handleFieldChange = (field: keyof ActiveStudent, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
    setSaveSuccess(false);
  };

  const handleEducationChange = (index: number, key: string, value: string) => {
    const list = [...(formData.educationHistory || [])];
    if (!list[index]) {
      list[index] = { fromYear: "", fromMonth: "", toYear: "", toMonth: "", schoolName: "", major: "" };
    }
    list[index] = { ...list[index], [key]: value };
    handleFieldChange("educationHistory", list);
  };

  const addEducationRow = () => {
    const list = [...(formData.educationHistory || [])];
    list.push({ fromYear: "", fromMonth: "", toYear: "", toMonth: "", schoolName: "", major: "" });
    handleFieldChange("educationHistory", list);
  };

  const removeEducationRow = (index: number) => {
    const list = (formData.educationHistory || []).filter((_, i) => i !== index);
    handleFieldChange("educationHistory", list);
  };

  const handleWorkChange = (index: number, key: string, value: string) => {
    const list = [...(formData.workHistory || [])];
    if (!list[index]) {
      list[index] = { fromYear: "", fromMonth: "", toYear: "", toMonth: "", companyName: "", jobType: "" };
    }
    list[index] = { ...list[index], [key]: value };
    handleFieldChange("workHistory", list);
  };

  const addWorkRow = () => {
    const list = [...(formData.workHistory || [])];
    list.push({ fromYear: "", fromMonth: "", toYear: "", toMonth: "", companyName: "", jobType: "", jobDetail: "" });
    handleFieldChange("workHistory", list);
  };

  const removeWorkRow = (index: number) => {
    const list = (formData.workHistory || []).filter((_, i) => i !== index);
    handleFieldChange("workHistory", list);
  };

  const handleFamilyIndoChange = (index: number, key: string, value: string) => {
    const list = [...(formData.familyInIndonesia || [])];
    if (!list[index]) {
      list[index] = { name: "", age: "", relation: "", job: "" };
    }
    list[index] = { ...list[index], [key]: value };
    handleFieldChange("familyInIndonesia", list);
  };

  const addFamilyIndoRow = () => {
    const list = [...(formData.familyInIndonesia || [])];
    list.push({ name: "", age: "", relation: "", job: "" });
    handleFieldChange("familyInIndonesia", list);
  };

  const removeFamilyIndoRow = (index: number) => {
    const list = (formData.familyInIndonesia || []).filter((_, i) => i !== index);
    handleFieldChange("familyInIndonesia", list);
  };

  const handleFamilyJapanChange = (index: number, key: string, value: string) => {
    const list = [...(formData.familyInJapan || [])];
    if (!list[index]) {
      list[index] = { name: "", age: "", relation: "", job: "" };
    }
    list[index] = { ...list[index], [key]: value };
    handleFieldChange("familyInJapan", list);
  };

  const addFamilyJapanRow = () => {
    const list = [...(formData.familyInJapan || [])];
    list.push({ name: "", age: "", relation: "", job: "" });
    handleFieldChange("familyInJapan", list);
  };

  const removeFamilyJapanRow = (index: number) => {
    const list = (formData.familyInJapan || []).filter((_, i) => i !== index);
    handleFieldChange("familyInJapan", list);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        id: student.id,
        ...formData
      };
      const result = await onUpdateStudent(payload);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Gagal menyimpan data ke server.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutofill = () => {
    if (confirm("Apakah Anda ingin mengisi otomatis data yang sudah ada di sistem LPK?")) {
      setFormData((prev) => ({
        ...prev,
        name: student.name || prev.name,
        gender: student.gender || prev.gender,
        tb: student.tb || prev.tb,
        bb: student.bb || prev.bb,
        age: student.age || prev.age,
        profilePicture: student.profilePicture || prev.profilePicture,
        phone: student.phone || prev.phone || "",
        birthDate: student.date ? student.date : prev.birthDate,
      }));
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  // Safe checks for arrays to render empty rows if needed
  const renderEduRows = formData.educationHistory || [];
  const renderWorkRows = formData.workHistory || [];
  const renderFamilyIndo = formData.familyInIndonesia || [];
  const renderFamilyJapan = formData.familyInJapan || [];

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            9. CV & BIODATA (RIREKISHO)
          </h2>
          <p className="text-xs text-slate-500">
            Kelola, sinkronisasi, dan unduh CV standar wawancara Jepang Anda.
          </p>
        </div>
        
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Kembali
            </button>
          )}
          <button
            onClick={handleAutofill}
            className="px-3.5 py-2 text-xs font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Autofill Sistem
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 shadow-sm ${
              saveSuccess ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isSaving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Menyimpan..." : saveSuccess ? "Tersimpan!" : "Simpan CV"}
          </button>
        </div>
      </div>

      {/* VIEW / PREVIEW TABS */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 max-w-sm">
        <button
          onClick={() => setActiveTab("edit")}
          className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition ${
            activeTab === "edit"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📝 Isi Data CV
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition ${
            activeTab === "preview"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          👁️ Pratinjau & Cetak CV
        </button>
      </div>

      {activeTab === "edit" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* SIDE NAVIGATION FOR SECTIONS - Responsive Desktop vs Mobile */}
          <div className="md:col-span-1">
            {/* Desktop Navigation */}
            <div className="hidden md:flex flex-col space-y-2">
              {[
                { id: "personal", label: "👤 Biodata Pribadi" },
                { id: "physical", label: "📏 Data Fisik & Medis" },
                { id: "history", label: "🎓 Pendidikan & Kerja" },
                { id: "family", label: "👨‍👩‍👦 Data Keluarga" },
                { id: "saving", label: "⛩️ Tujuan Ke Jepang" }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setEditTab(section.id as any)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition flex items-center justify-between border ${
                    editTab === section.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{section.label}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-[11px] text-slate-500 space-y-2 leading-relaxed">
                <div className="flex gap-1.5 text-indigo-600 font-bold items-center mb-1">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  <span>Petunjuk Pengisian:</span>
                </div>
                <p>Isilah data dengan jujur dan lengkap menggunakan bahasa Indonesia.</p>
                <p>Sistem akan memformat dan menerjemahkan istilah kunci secara otomatis ke dalam Rirekisho standar Jepang.</p>
              </div>
            </div>

            {/* Mobile Navigation - Scrollable horizontal tabs */}
            <div className="flex md:hidden flex-row gap-1.5 overflow-x-auto pb-2 scrollbar-none w-full mb-1">
              {[
                { id: "personal", label: "👤 Biodata" },
                { id: "physical", label: "📏 Fisik & Medis" },
                { id: "history", label: "🎓 Edu & Kerja" },
                { id: "family", label: "👨‍👩‍👦 Keluarga" },
                { id: "saving", label: "⛩️ Tujuan" }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setEditTab(section.id as any)}
                  className={`px-3 py-2.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap transition border shrink-0 active:scale-95 ${
                    editTab === section.id
                      ? "bg-indigo-700 text-white border-indigo-700 shadow-xs"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </div>

          {/* EDIT FORM PORT */}
          <div className="md:col-span-3 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            {/* 1. PERSONAL DATA SECTION */}
            {editTab === "personal" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b pb-2">👤 BIODATA PRIBADI</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nama Lengkap (Sesuai KTP)</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.gender || "Laki-laki"}
                      onChange={(e) => handleFieldChange("gender", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="Laki-laki">Laki-laki / 男</option>
                      <option value="Perempuan">Perempuan / 女</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tempat Lahir</label>
                    <input
                      type="text"
                      placeholder="e.g. Pati"
                      value={formData.birthPlace || ""}
                      onChange={(e) => handleFieldChange("birthPlace", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tanggal Lahir</label>
                    <input
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => handleFieldChange("birthDate", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Umur (Tahun)</label>
                    <input
                      type="number"
                      placeholder="e.g. 23"
                      value={formData.age || ""}
                      onChange={(e) => handleFieldChange("age", e.target.value ? Number(e.target.value) : "")}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Status Pernikahan</label>
                    <select
                      value={formData.marriageStatus || "Lajang"}
                      onChange={(e) => handleFieldChange("marriageStatus", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="Lajang">Lajang / 未婚</option>
                      <option value="Menikah">Menikah / 既婚</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Agama</label>
                    <input
                      type="text"
                      placeholder="e.g. Islam"
                      value={formData.religion || ""}
                      onChange={(e) => handleFieldChange("religion", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nomor Telepon</label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Foto Kandidat (Unggah File)</label>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingCvPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingCvPhoto(true);
                          try {
                            const downloadUrl = await uploadFileToFirebase(file, "profile_pictures");
                            handleFieldChange("profilePicture", downloadUrl);
                          } catch (err: any) {
                            console.error(err);
                            alert(`Gagal mengunggah foto kandidat: ${err.message || err}`);
                          } finally {
                            setUploadingCvPhoto(false);
                          }
                        }
                      }}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer disabled:opacity-50"
                    />
                    {uploadingCvPhoto && (
                      <p className="text-[9px] text-blue-600 font-bold mt-1.5 flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" /> Mengunggah foto kandidat...
                      </p>
                    )}
                    {formData.profilePicture && formData.profilePicture.length > 0 && !uploadingCvPhoto && (
                      <p className="text-[9px] text-emerald-600 font-bold mt-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Foto terlampir
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Alamat Rumah Lengkap</label>
                  <textarea
                    rows={3}
                    placeholder="Alamat lengkap RT/RW, Kelurahan, Kecamatan, Kabupaten, Provinsi"
                    value={formData.address || ""}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 2. PHYSICAL & MEDICAL DATA */}
            {editTab === "physical" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b pb-2">📏 DATA FISIK & MEDIS</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tinggi Badan (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 165"
                      value={formData.tb || ""}
                      onChange={(e) => handleFieldChange("tb", e.target.value ? Number(e.target.value) : "")}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Berat Badan (kg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 58"
                      value={formData.bb || ""}
                      onChange={(e) => handleFieldChange("bb", e.target.value ? Number(e.target.value) : "")}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Golongan Darah</label>
                    <select
                      value={formData.bloodType || ""}
                      onChange={(e) => handleFieldChange("bloodType", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="">Pilih / 血液型</option>
                      <option value="A">A / A型</option>
                      <option value="B">B / B型</option>
                      <option value="AB">AB / AB型</option>
                      <option value="O">O / O型</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Ukuran Sepatu (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 26.5"
                      value={formData.shoeSize || ""}
                      onChange={(e) => handleFieldChange("shoeSize", e.target.value ? Number(e.target.value) : "")}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Ukuran Pinggang (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 78"
                      value={formData.waistSize || ""}
                      onChange={(e) => handleFieldChange("waistSize", e.target.value ? Number(e.target.value) : "")}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Ukuran Kepala (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 56"
                      value={formData.headSize || ""}
                      onChange={(e) => handleFieldChange("headSize", e.target.value ? Number(e.target.value) : "")}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Merokok</label>
                    <select
                      value={formData.smoking || "Tidak"}
                      onChange={(e) => handleFieldChange("smoking", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="Tidak">Tidak Merokok / 吸わない</option>
                      <option value="Merokok">Merokok / 吸う</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Minum Alkohol (Sake)</label>
                    <select
                      value={formData.drinking || "Tidak"}
                      onChange={(e) => handleFieldChange("drinking", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="Tidak">Tidak Minum / 飲まない</option>
                      <option value="Minum">Minum / 飲む</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tangan Dominan</label>
                    <select
                      value={formData.dominantHand || "Kanan"}
                      onChange={(e) => handleFieldChange("dominantHand", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="Kanan">Tangan Kanan / 右手</option>
                      <option value="Kiri">Tangan Kiri / 左手</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Buta Warna</label>
                    <select
                      value={formData.colorBlind || "Tidak Ada"}
                      onChange={(e) => handleFieldChange("colorBlind", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="Tidak Ada">Tidak Ada / 無</option>
                      <option value="Ada">Ada Buta Warna / 有</option>
                    </select>
                  </div>
                  {formData.colorBlind === "Ada" && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Detail Buta Warna (Warna/Sebab)</label>
                      <input
                        type="text"
                        placeholder="Sebutkan detail, misal: Merah-Hijau Parsial"
                        value={formData.colorBlindDetails || ""}
                        onChange={(e) => handleFieldChange("colorBlindDetails", e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Ketajaman Penglihatan (Kanan)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.0 (Normal) atau Minus 1.5"
                      value={formData.visionRight || ""}
                      onChange={(e) => handleFieldChange("visionRight", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Ketajaman Penglihatan (Kiri)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.0 (Normal) atau Minus 1.25"
                      value={formData.visionLeft || ""}
                      onChange={(e) => handleFieldChange("visionLeft", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Kelebihan (Karakter Anda)</label>
                    <textarea
                      rows={2}
                      placeholder="Kelebihan kepribadian Anda yang positif..."
                      value={formData.strength || ""}
                      onChange={(e) => handleFieldChange("strength", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Kekurangan (Karakter Anda)</label>
                    <textarea
                      rows={2}
                      placeholder="Kekurangan kepribadian Anda dan cara mengatasinya..."
                      value={formData.weakness || ""}
                      onChange={(e) => handleFieldChange("weakness", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Hobi</label>
                    <input
                      type="text"
                      placeholder="e.g. Membaca, Olahraga, Menggambar"
                      value={formData.hobby || ""}
                      onChange={(e) => handleFieldChange("hobby", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Bakat Khusus (Keterampilan)</label>
                    <input
                      type="text"
                      placeholder="e.g. Las Listrik, Rakit PC, Desain CAD"
                      value={formData.specialTalent || ""}
                      onChange={(e) => handleFieldChange("specialTalent", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. EDUCATION & WORK EXPERIENCE */}
            {editTab === "history" && (
              <div className="space-y-6">
                {/* EDUCATION TABLE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-black text-slate-900">🎓 RIWAYAT PENDIDIKAN</h3>
                    <button
                      onClick={addEducationRow}
                      className="px-2.5 py-1 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                    >
                      <Plus className="h-3 w-3" /> Tambah Baris
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {renderEduRows.map((row, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-3">
                        <button
                          onClick={() => removeEducationRow(index)}
                          className="absolute top-2 right-2 p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="text-[10px] font-black text-slate-400">Pendidikan #{index + 1}</div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Mulai (Tahun)</label>
                            <input
                              type="number"
                              placeholder="e.g. 2012"
                              value={row.fromYear}
                              onChange={(e) => handleEducationChange(index, "fromYear", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Mulai (Bulan)</label>
                            <input
                              type="number"
                              placeholder="e.g. 7"
                              value={row.fromMonth}
                              onChange={(e) => handleEducationChange(index, "fromMonth", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Selesai (Tahun)</label>
                            <input
                              type="number"
                              placeholder="e.g. 2015"
                              value={row.toYear}
                              onChange={(e) => handleEducationChange(index, "toYear", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Selesai (Bulan)</label>
                            <input
                              type="number"
                              placeholder="e.g. 6"
                              value={row.toMonth}
                              onChange={(e) => handleEducationChange(index, "toMonth", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama Sekolah</label>
                            <input
                              type="text"
                              placeholder="e.g. SDN Pati 01"
                              value={row.schoolName}
                              onChange={(e) => handleEducationChange(index, "schoolName", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jurusan / Bidang Studi</label>
                            <input
                              type="text"
                              placeholder="e.g. Ilmu Pengetahuan Alam (IPA) atau kosongkan jika SD/SMP"
                              value={row.major}
                              onChange={(e) => handleEducationChange(index, "major", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WORK EXPERIENCE */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-black text-slate-900">💼 RIWAYAT / PENGALAMAN KERJA</h3>
                    <button
                      onClick={addWorkRow}
                      className="px-2.5 py-1 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                    >
                      <Plus className="h-3 w-3" /> Tambah Baris
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {renderWorkRows.map((row, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-3">
                        <button
                          onClick={() => removeWorkRow(index)}
                          className="absolute top-2 right-2 p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="text-[10px] font-black text-slate-400">Pengalaman Kerja #{index + 1}</div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Mulai (Tahun)</label>
                            <input
                              type="number"
                              placeholder="e.g. 2018"
                              value={row.fromYear}
                              onChange={(e) => handleWorkChange(index, "fromYear", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Mulai (Bulan)</label>
                            <input
                              type="number"
                              placeholder="e.g. 1"
                              value={row.fromMonth}
                              onChange={(e) => handleWorkChange(index, "fromMonth", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Selesai (Tahun)</label>
                            <input
                              type="number"
                              placeholder="e.g. 2021"
                              value={row.toYear}
                              onChange={(e) => handleWorkChange(index, "toYear", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Selesai (Bulan)</label>
                            <input
                              type="number"
                              placeholder="e.g. 12"
                              value={row.toMonth}
                              onChange={(e) => handleWorkChange(index, "toMonth", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama Perusahaan / Organisasi</label>
                            <input
                              type="text"
                              placeholder="e.g. PT Astra Honda Motor"
                              value={row.companyName}
                              onChange={(e) => handleWorkChange(index, "companyName", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Jenis Pekerjaan</label>
                            <input
                              type="text"
                              placeholder="e.g. Operator Produksi (K組立) atau Konstruksi"
                              value={row.jobType}
                              onChange={(e) => handleWorkChange(index, "jobType", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Detail Pekerjaan</label>
                            <textarea
                              placeholder="e.g. Bertanggung jawab atas kualitas pengecekan produk..."
                              value={row.jobDetail || ""}
                              onChange={(e) => handleWorkChange(index, "jobDetail", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none h-16 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. FAMILY DATA */}
            {editTab === "family" && (
              <div className="space-y-6">
                {/* EMERGENCY CONTACT & HOUSE INCOME */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black text-slate-900 border-b pb-2">🏡 KONTAK DARURAT DI INDONESIA</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nama Kontak Darurat</label>
                      <input
                        type="text"
                        placeholder="e.g. Ahmad Siswanto"
                        value={formData.emergencyContactName || ""}
                        onChange={(e) => handleFieldChange("emergencyContactName", e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nomor Telepon Darurat</label>
                      <input
                        type="tel"
                        placeholder="e.g. 081234567890"
                        value={formData.emergencyContactPhone || ""}
                        onChange={(e) => handleFieldChange("emergencyContactPhone", e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Alamat Lengkap Kontak Darurat</label>
                      <input
                        type="text"
                        placeholder="Alamat domisili keluarga penanggungjawab"
                        value={formData.emergencyContactAddress || ""}
                        onChange={(e) => handleFieldChange("emergencyContactAddress", e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Penghasilan Keluarga Sebulan (Rupiah)</label>
                      <input
                        type="number"
                        placeholder="e.g. 3500000"
                        value={formData.familyMonthlyIncomeRp || ""}
                        onChange={(e) => handleFieldChange("familyMonthlyIncomeRp", e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Penghasilan Keluarga Sebulan (Yen 💰 - Jika Tahu)</label>
                      <input
                        type="number"
                        placeholder="e.g. 35000"
                        value={formData.familyMonthlyIncome || ""}
                        onChange={(e) => handleFieldChange("familyMonthlyIncome", e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* INDONESIAN FAMILY LIST */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900">👨‍👩‍👦 ANGGOTA KELUARGA DI INDONESIA</h3>
                    <button
                      onClick={addFamilyIndoRow}
                      className="px-2.5 py-1 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                    >
                      <Plus className="h-3 w-3" /> Tambah Baris
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {renderFamilyIndo.map((row, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-3">
                        <button
                          onClick={() => removeFamilyIndoRow(index)}
                          className="absolute top-2 right-2 p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama</label>
                            <input
                              type="text"
                              placeholder="e.g. Sutrisno"
                              value={row.name}
                              onChange={(e) => handleFamilyIndoChange(index, "name", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Umur (Thn)</label>
                            <input
                              type="number"
                              placeholder="e.g. 48"
                              value={row.age}
                              onChange={(e) => handleFamilyIndoChange(index, "age", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Hubungan</label>
                            <input
                              type="text"
                              placeholder="e.g. Ayah / Ibu / Kakak"
                              value={row.relation}
                              onChange={(e) => handleFamilyIndoChange(index, "relation", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pekerjaan</label>
                            <input
                              type="text"
                              placeholder="e.g. Wiraswasta / Tani"
                              value={row.job}
                              onChange={(e) => handleFamilyIndoChange(index, "job", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAMILY IN JAPAN LIST */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900">🇯🇵 KELUARGA/TEMAN DI JEPANG (JIKA ADA)</h3>
                    <button
                      onClick={addFamilyJapanRow}
                      className="px-2.5 py-1 text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1 transition"
                    >
                      <Plus className="h-3 w-3" /> Tambah Baris
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {renderFamilyJapan.map((row, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative space-y-3">
                        <button
                          onClick={() => removeFamilyJapanRow(index)}
                          className="absolute top-2 right-2 p-1.5 text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100"
                          title="Hapus baris"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nama</label>
                            <input
                              type="text"
                              placeholder="e.g. Yuki Tanaka"
                              value={row.name}
                              onChange={(e) => handleFamilyJapanChange(index, "name", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Umur (Thn)</label>
                            <input
                              type="number"
                              placeholder="e.g. 26"
                              value={row.age}
                              onChange={(e) => handleFamilyJapanChange(index, "age", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Hubungan</label>
                            <input
                              type="text"
                              placeholder="e.g. Kakak / Senpai / Teman"
                              value={row.relation}
                              onChange={(e) => handleFamilyJapanChange(index, "relation", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Pekerjaan</label>
                            <input
                              type="text"
                              placeholder="e.g. Kaigo / Jishusei / Pangan"
                              value={row.job}
                              onChange={(e) => handleFamilyJapanChange(index, "job", e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-200 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. SAVING & GOALS IN JAPAN */}
            {editTab === "saving" && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b pb-2">⛩️ TUJUAN KE JEPANG & TARGET</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tujuan Pergi Ke Jepang</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Membantu perekonomian keluarga, mengumpulkan modal usaha mandiri di Indonesia, dan mempelajari teknologi perawat lansia di Jepang."
                      value={formData.purposeToJapan || ""}
                      onChange={(e) => handleFieldChange("purposeToJapan", e.target.value)}
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Target Menabung Selama 3 Tahun (Rupiah)</label>
                      <input
                        type="number"
                        placeholder="e.g. 200000000"
                        value={formData.savingTarget || ""}
                        onChange={(e) => handleFieldChange("savingTarget", e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Target Menabung Selama 3 Tahun (Yen 💰)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2000000"
                        value={formData.savingTargetYen || ""}
                        onChange={(e) => handleFieldChange("savingTargetYen", e.target.value ? Number(e.target.value) : "")}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tanggal Masuk LPK</label>
                      <input
                        type="date"
                        value={formData.lpkEntryDate || ""}
                        onChange={(e) => handleFieldChange("lpkEntryDate", e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Lama Belajar di LPK</label>
                      <input
                        type="text"
                        placeholder="e.g. 4 Bulan (4ヶ月)"
                        value={formData.studyDuration || ""}
                        onChange={(e) => handleFieldChange("studyDuration", e.target.value)}
                        className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAVE ACTION FLOATING BAR */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/10 active:scale-95 text-xs"
              >
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Menyimpan Data..." : "Simpan Seluruh Data CV"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* PRATINJAU & CETAK CV - TEMPLATE BILINGUAL JEPANG INDONESIA PERSIS GAMBAR */
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">🖥️ Tips Cetak / Unduh PDF Presisi:</p>
              <p>1. Klik tombol <strong>"Cetak CV / Simpan PDF"</strong> di bawah untuk membuka dialog print browser.</p>
              <p>2. Pada pengaturan print, pastikan pilih <strong>Tujuan: Simpan sebagai PDF (Save as PDF)</strong>.</p>
              <p>3. Di bagian setelan lain, centang <strong>"Gambar Latar Belakang" (Background Graphics)</strong> agar seluruh tabel dan warna keluar sempurna.</p>
              <p>4. Atur ukuran kertas ke <strong>A4</strong> dan skala ke <strong>Default atau Pas ke Halaman</strong>.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            {/* Zoom Control */}
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                🔎 Skala Pratinjau:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="w-28 sm:w-36 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md min-w-[45px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={() => setScale(1.0)}
                  className="px-2.5 py-1 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-100 transition"
                  title="Reset ke 100%"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Print Button */}
            <button
              onClick={triggerPrint}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition flex items-center gap-2 shadow-md shadow-indigo-500/15"
            >
              <Printer className="h-4 w-4" />
              Cetak CV / Simpan PDF
            </button>
          </div>

          {/* DUAL PAGES GRAPHICS IN A STYLED BOX WITH PRINT SPECIFIC OVERRIDES */}
          <div className="bg-slate-300 p-2 sm:p-6 rounded-3xl overflow-x-auto w-full shadow-inner flex flex-col items-center gap-8">
            
            {/* ================= PAGE 1 ================= */}
            <div 
              className="print:w-full print:h-auto print:block relative mx-auto"
              style={{ 
                height: scale === 1 ? "auto" : `${297 * scale}mm`, 
                width: scale === 1 ? "auto" : `${210 * scale}mm`,
              }}
            >
              <div 
                id="rirekisho-page-1" 
                className="bg-white p-[10mm] border border-slate-400 w-[210mm] min-h-[297mm] shadow-lg print:p-0 print:border-0 print:shadow-none print:w-full font-sans text-[11px] leading-relaxed relative flex flex-col justify-between origin-top-left" 
                style={{ 
                  boxSizing: "border-box",
                  transform: scale === 1 ? "none" : `scale(${scale})`,
                }}
              >
              <div>
                {/* DOUBLE BORDER HEADER WITH TITLE */}
                <div className="border-4 border-double border-black p-1 text-center mb-4">
                  <div className="text-[12px] font-bold tracking-widest text-black">履歴書</div>
                  <div className="text-[14px] font-black text-black">BIODATA • C V</div>
                </div>

                {/* HEADER LAYOUT: NAME & PHOTO & PERSONAL INFOS */}
                <table className="w-full border-collapse border-2 border-black text-[10px] text-black">
                  <tbody>
                    {/* Row 1: Name and Candidate Photo */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[130px]">
                        <div>氏名 :</div>
                        <div className="text-[8.5px] text-slate-500">Nama :</div>
                      </td>
                      <td className="border border-black p-2 font-black text-xs uppercase" colSpan={4}>
                        {formData.name || "-"}
                      </td>
                      <td className="border-2 border-black text-center align-middle w-[150px] font-bold text-slate-300 text-[10px] uppercase font-mono relative p-0" rowSpan={4}>
                        {formData.profilePicture ? (
                          <img
                            src={formData.profilePicture}
                            alt="Foto Kandidat"
                            className="w-full h-[180px] object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-[180px] flex items-center justify-center border-dashed border border-slate-300 m-1 bg-slate-50 text-slate-400 text-center font-bold px-4">
                            FOTO KANDIDAT<br />(3 x 4)
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Row 2: Birth Date and Age */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>生年月日 :</div>
                        <div className="text-[8.5px] text-slate-500">Tanggal Lahir :</div>
                      </td>
                      <td className="border border-black p-2 font-bold" colSpan={2}>
                        {(() => {
                          if (!formData.birthDate) return "-";
                          const d = new Date(formData.birthDate);
                          return (
                            <div className="flex gap-4">
                              <span>{d.getFullYear()} <span className="text-[9px] font-light">年 Thn</span></span>
                              <span>{d.getMonth() + 1} <span className="text-[9px] font-light">月 Bln</span></span>
                              <span>{d.getDate()} <span className="text-[9px] font-light">日 Tgl</span></span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[70px]">
                        <div>年齢 :</div>
                        <div className="text-[8.5px] text-slate-500">Umur :</div>
                      </td>
                      <td className="border border-black p-2 font-bold w-[120px]">
                        {formData.age ? `${formData.age} 歳 Tahun` : "-"}
                      </td>
                    </tr>

                    {/* Row 3: Gender and Marriage Status */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>性別 :</div>
                        <div className="text-[8.5px] text-slate-500">Jenis Kelamin :</div>
                      </td>
                      <td className="border border-black p-2" colSpan={2}>
                        <div className="flex gap-6">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.gender === "Laki-laki"} readOnly className="h-3.5 w-3.5 accent-black pointer-events-none" />
                            <span>男 Male</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.gender === "Perempuan"} readOnly className="h-3.5 w-3.5 accent-black pointer-events-none" />
                            <span>女 Female</span>
                          </label>
                        </div>
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>配偶者 :</div>
                        <div className="text-[8.5px] text-slate-500">Pernikahan :</div>
                      </td>
                      <td className="border border-black p-2">
                        <div className="flex gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.marriageStatus === "Menikah"} readOnly className="h-3.5 w-3.5 accent-black pointer-events-none" />
                            <span>既婚 Menikah</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.marriageStatus === "Lajang"} readOnly className="h-3.5 w-3.5 accent-black pointer-events-none" />
                            <span>未婚 Lajang</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    {/* Row 4: Birthplace */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>出身地 :</div>
                        <div className="text-[8.5px] text-slate-500">Tempat Lahir :</div>
                      </td>
                      <td className="border border-black p-2 font-bold uppercase" colSpan={4}>
                        {formData.birthPlace || "-"}
                      </td>
                    </tr>

                    {/* Row 5: Home Address and Phone */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>本国住所地 :</div>
                        <div className="text-[8.5px] text-slate-500">Alamat Rumah :</div>
                      </td>
                      <td className="border border-black p-2 uppercase leading-tight font-medium" colSpan={4}>
                        {formData.address || "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>電話番号 :</div>
                        <div className="text-[8.5px] text-slate-500">Nomor Telpon :</div>
                        <div className="mt-1.5 font-mono text-black font-extrabold text-[10.5px]">
                          {formData.phone || "-"}
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Religion */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>宗教 :</div>
                        <div className="text-[8.5px] text-slate-500">Agama :</div>
                      </td>
                      <td className="border border-black p-2 font-bold uppercase" colSpan={5}>
                        {formData.religion || "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* PHYSICAL AND ADDITIONAL METADATA GRID */}
                <table className="w-full border-collapse border-l-2 border-r-2 border-b-2 border-t-0 border-black text-[9.5px] text-black">
                  <tbody>
                    {/* Row 1: Height, Weight, Blood Type */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[110px]">
                        <div>身長 :</div>
                        <div className="text-[8px] text-slate-500">Tinggi Badan :</div>
                      </td>
                      <td className="border border-black p-2 font-bold text-center">
                        {formData.tb ? `${formData.tb} Cm` : "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[110px]">
                        <div>体重 :</div>
                        <div className="text-[8px] text-slate-500">Berat Badan :</div>
                      </td>
                      <td className="border border-black p-2 font-bold text-center">
                        {formData.bb ? `${formData.bb} Kg` : "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[110px]">
                        <div>血液型 :</div>
                        <div className="text-[8px] text-slate-500">Golongan Darah :</div>
                      </td>
                      <td className="border border-black p-2 font-black text-center text-xs">
                        {formData.bloodType ? `${formData.bloodType} 型` : "-"}
                      </td>
                    </tr>

                    {/* Row 2: Shoe Size, Waist, Head Size */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>靴サイズ :</div>
                        <div className="text-[8px] text-slate-500">Ukuran Sepatu :</div>
                      </td>
                      <td className="border border-black p-2 font-bold text-center">
                        {formData.shoeSize ? `${formData.shoeSize} Cm` : "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>ウェイスト :</div>
                        <div className="text-[8px] text-slate-500">Ukuran Pinggang :</div>
                      </td>
                      <td className="border border-black p-2 font-bold text-center">
                        {formData.waistSize ? `${formData.waistSize} Cm` : "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>頭のサイズ :</div>
                        <div className="text-[8px] text-slate-500">Ukuran Kepala :</div>
                      </td>
                      <td className="border border-black p-2 font-bold text-center">
                        {formData.headSize ? `${formData.headSize} Cm` : "-"}
                      </td>
                    </tr>

                    {/* Row 3: Cigarettes and Alcohol */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>タバコ :</div>
                        <div className="text-[8px] text-slate-500">Merokok :</div>
                      </td>
                      <td className="border border-black p-2" colSpan={2}>
                        <div className="flex gap-4 justify-around">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.smoking === "Merokok"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>吸う Merokok</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.smoking === "Tidak"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>吸わない Tidak</span>
                          </label>
                        </div>
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>飲酒 :</div>
                        <div className="text-[8px] text-slate-500">Minum Sake :</div>
                      </td>
                      <td className="border border-black p-2" colSpan={2}>
                        <div className="flex gap-4 justify-around">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.drinking === "Minum"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>飲む Minum</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.drinking === "Tidak"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>飲まない Tidak</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    {/* Row 4: Vision and Dominant Hand */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>視力 :</div>
                        <div className="text-[8px] text-slate-500">Vision :</div>
                      </td>
                      <td className="border border-black p-2" colSpan={2}>
                        <div className="flex justify-around">
                          <span>右目 Mata Kanan : <strong>{formData.visionRight || "-"}</strong></span>
                          <span>左目 Mata Kiri : <strong>{formData.visionLeft || "-"}</strong></span>
                        </div>
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>利き手 :</div>
                        <div className="text-[8px] text-slate-500">Tangan Dominan :</div>
                      </td>
                      <td className="border border-black p-2" colSpan={2}>
                        <div className="flex gap-4 justify-around">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.dominantHand === "Kanan"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>右手 Kanan</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.dominantHand === "Kiri"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>左手 Kiri</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    {/* Row 5: Color Blindness */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>色覚障害 :</div>
                        <div className="text-[8px] text-slate-500">Buta Warna :</div>
                      </td>
                      <td className="border border-black p-2" colSpan={5}>
                        <div className="flex gap-6 items-center">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.colorBlind === "Ada"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>有 Ada</span>
                          </label>
                          {formData.colorBlind === "Ada" && (
                            <span className="text-[9px] font-bold bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                              (色 Warna : {formData.colorBlindDetails || "-"} )
                            </span>
                          )}
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={formData.colorBlind === "Tidak Ada"} readOnly className="h-3 w-3 accent-black pointer-events-none" />
                            <span>無 Tidak Ada</span>
                          </label>
                        </div>
                      </td>
                    </tr>

                    {/* Row 6: Hobby and Special Talent */}
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>趣味 :</div>
                        <div className="text-[8px] text-slate-500">Hobby :</div>
                      </td>
                      <td className="border border-black p-2 font-medium" colSpan={2}>
                        {formData.hobby || "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>特徴 :</div>
                        <div className="text-[8px] text-slate-500">Bakat Khusus :</div>
                      </td>
                      <td className="border border-black p-2 font-medium" colSpan={2}>
                        {formData.specialTalent || "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* SELF ANALYSIS: STRENGTH & WEAKNESS */}
                <table className="w-full border-collapse border-l-2 border-r-2 border-b-2 border-t-0 border-black text-[9.5px] text-black">
                  <tbody>
                    <tr className="bg-slate-100 text-center font-bold text-[10px]">
                      <td className="border border-black p-1.5" colSpan={2}>
                        自己の長所と短所 Kelebihan dan Kekurangan
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[110px]">
                        <div>長所 :</div>
                        <div className="text-[8px] text-slate-500">Kelebihan :</div>
                      </td>
                      <td className="border border-black p-2">
                        {formData.strength || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>短所 :</div>
                        <div className="text-[8px] text-slate-500">Kekurangan :</div>
                      </td>
                      <td className="border border-black p-2">
                        {formData.weakness || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>日本へ行く目的 :</div>
                        <div className="text-[8px] text-slate-500">Tujuan ke Jepang :</div>
                      </td>
                      <td className="border border-black p-2 leading-tight">
                        {formData.purposeToJapan || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>3年間貯金目標 :</div>
                        <div className="text-[8px] text-slate-500">Target Menabung :</div>
                      </td>
                      <td className="border border-black p-2 font-mono font-extrabold text-[10px]">
                        <div className="flex gap-8">
                          <span>円 Yen : {formData.savingTargetYen ? `${Number(formData.savingTargetYen).toLocaleString("ja-JP")} 円` : "-"}</span>
                          <span>Rp. Rupiah : {formData.savingTarget ? `Rp. ${Number(formData.savingTarget).toLocaleString("id-ID")}` : "-"}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* EDUCATION HISTORY TABLE */}
                <div className="mt-4">
                  <div className="bg-slate-150 p-1 border-2 border-black border-b-0 text-center font-bold text-[10px] text-black">
                    学歴 Riwayat Pendidikan
                  </div>
                  <table className="w-full border-collapse border-2 border-black text-[9.5px] text-black">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <td className="border border-black p-1 w-[80px]">から Dari</td>
                        <td className="border border-black p-1 w-[80px]">まで Sampai</td>
                        <td className="border border-black p-1">学校名 Nama Sekolah</td>
                        <td className="border border-black p-1">学科専門 Jurusan</td>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fixed height rendering (always render at least 5 rows to preserve neat structure) */}
                      {Array.from({ length: Math.max(5, renderEduRows.length) }).map((_, i) => {
                        const row = renderEduRows[i];
                        return (
                          <tr key={i} className="h-6">
                            <td className="border border-black text-center p-1">
                              {row?.fromYear ? `${row.fromYear}年 ${row.fromMonth}月` : ""}
                            </td>
                            <td className="border border-black text-center p-1">
                              {row?.toYear ? `${row.toYear}年 ${row.toMonth}月` : ""}
                            </td>
                            <td className="border border-black px-2 py-1 font-bold uppercase">
                              {row?.schoolName || ""}
                            </td>
                            <td className="border border-black px-2 py-1 uppercase">
                              {row?.major || ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* WORK HISTORY TABLE */}
                <div className="mt-4">
                  <div className="bg-slate-150 p-1 border-2 border-black border-b-0 text-center font-bold text-[10px] text-black">
                    職歴 Riwayat/Pengalaman Kerja
                  </div>
                  <table className="w-full border-collapse border-2 border-black text-[9.5px] text-black">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <td className="border border-black p-1 w-[80px]">から Dari</td>
                        <td className="border border-black p-1 w-[80px]">まで Sampai</td>
                        <td className="border border-black p-1">企業名 Nama Perusahaan</td>
                        <td className="border border-black p-1">職業内容 Jenis Kerja</td>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fixed height rendering (always render at least 5 rows to preserve neat structure) */}
                      {Array.from({ length: Math.max(2, renderWorkRows.length) }).map((_, i) => {
                        const row = renderWorkRows[i];
                        return (
                          <tr key={i} className="h-6">
                            <td className="border border-black text-center p-1">
                              {row?.fromYear ? `${row.fromYear}年 ${row.fromMonth}月` : ""}
                            </td>
                            <td className="border border-black text-center p-1">
                              {row?.toYear ? `${row.toYear}年 ${row.toMonth}月` : ""}
                            </td>
                            <td className="border border-black px-2 py-1 font-bold uppercase">
                              {row?.companyName || ""}
                            </td>
                            <td className="border border-black px-2 py-1 uppercase">
                              <div className="font-bold">{row?.jobType || ""}</div>
                              {row?.jobDetail && <div className="text-[8px] mt-0.5 whitespace-pre-wrap leading-tight normal-case text-gray-700">{row.jobDetail}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FOOTER PAGE NUMBER FOR A4 */}
              <div className="text-right text-[8px] text-slate-400 font-mono mt-4">
                1 / 2
              </div>
            </div>
            </div>


            {/* ================= PAGE 2 ================= */}
            <div 
              className="print:w-full print:h-auto print:block relative mx-auto"
              style={{ 
                height: scale === 1 ? "auto" : `${297 * scale}mm`, 
                width: scale === 1 ? "auto" : `${210 * scale}mm`,
              }}
            >
              <div 
                id="rirekisho-page-2" 
                className="bg-white p-[10mm] border border-slate-400 w-[210mm] min-h-[297mm] shadow-lg print:p-0 print:border-0 print:shadow-none print:w-full font-sans text-[11px] leading-relaxed relative flex flex-col justify-between origin-top-left" 
                style={{ 
                  boxSizing: "border-box",
                  transform: scale === 1 ? "none" : `scale(${scale})`,
                }}
              >
              <div>
                {/* TOP HEADER */}
                <div className="bg-slate-100 p-2 border-2 border-black text-center font-bold text-[10px] text-black mb-4 uppercase">
                  本国での家族の連絡先 Keluarga di Indonesia yang bisa dihubungi
                </div>

                {/* EMERGENCY CONTACT DETAILS */}
                <table className="w-full border-collapse border-2 border-black text-[9.5px] text-black mb-4">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[180px]">
                        <div>本国での家族の連絡先名 :</div>
                        <div className="text-[8px] text-slate-500">Nama Kontak :</div>
                      </td>
                      <td className="border border-black p-2 font-bold uppercase">
                        {formData.emergencyContactName || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>本国での家族の連絡先住所 :</div>
                        <div className="text-[8px] text-slate-500">Alamat Kontak :</div>
                      </td>
                      <td className="border border-black p-2 uppercase">
                        {formData.emergencyContactAddress || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>緊急電話番号 :</div>
                        <div className="text-[8px] text-slate-500">Emergency Call :</div>
                      </td>
                      <td className="border border-black p-2 font-mono font-bold text-xs">
                        {formData.emergencyContactPhone || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>家族の1か月の収入 :</div>
                        <div className="text-[8px] text-slate-500">Penghasilan Keluarga Sebulan :</div>
                      </td>
                      <td className="border border-black p-2 font-mono font-extrabold">
                        <div className="flex gap-8">
                          <span>円 Yen : {formData.familyMonthlyIncome ? `${Number(formData.familyMonthlyIncome).toLocaleString("ja-JP")} 円` : "-"}</span>
                          <span>Rp. Rupiah : {formData.familyMonthlyIncomeRp ? `Rp. ${Number(formData.familyMonthlyIncomeRp).toLocaleString("id-ID")}` : "-"}</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* INDONESIAN FAMILY LIST */}
                <div>
                  <div className="bg-slate-150 p-1 border-2 border-black border-b-0 text-center font-bold text-[10px] text-black">
                    インドネシアでの家族 Keluarga di Indonesia
                  </div>
                  <table className="w-full border-collapse border-2 border-black text-[9.5px] text-black mb-4">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <td className="border border-black p-1">氏名 Nama</td>
                        <td className="border border-black p-1 w-[90px]">年齢 Umur</td>
                        <td className="border border-black p-1 w-[120px]">続柄 Hubungan</td>
                        <td className="border border-black p-1">職業 Pekerjaan</td>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fixed height rendering (always render at least 10 rows to preserve neat structure) */}
                      {Array.from({ length: Math.max(10, renderFamilyIndo.length) }).map((_, i) => {
                        const row = renderFamilyIndo[i];
                        return (
                          <tr key={i} className="h-6">
                            <td className="border border-black px-2 py-1 font-bold uppercase">
                              {row?.name || ""}
                            </td>
                            <td className="border border-black text-center p-1 font-mono font-medium">
                              {row?.age ? `${row.age} 歳 Thn` : ""}
                            </td>
                            <td className="border border-black text-center p-1 uppercase font-medium">
                              {row?.relation || ""}
                            </td>
                            <td className="border border-black px-2 py-1 uppercase">
                              {row?.job || ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* FAMILY IN JAPAN LIST */}
                <div>
                  <div className="bg-slate-150 p-1 border-2 border-black border-b-0 text-center font-bold text-[10px] text-black">
                    在日家族・親戚・友達 Keluarga, Famili, Teman yang tinggal di Jepang
                  </div>
                  <table className="w-full border-collapse border-2 border-black text-[9.5px] text-black mb-4">
                    <thead>
                      <tr className="bg-slate-50 font-bold text-center">
                        <td className="border border-black p-1">氏名 Nama</td>
                        <td className="border border-black p-1 w-[90px]">年齢 Umur</td>
                        <td className="border border-black p-1 w-[120px]">続柄 Hubungan</td>
                        <td className="border border-black p-1">職業 Pekerjaan</td>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Fixed height rendering (always render at least 4 rows to preserve neat structure) */}
                      {Array.from({ length: Math.max(4, renderFamilyJapan.length) }).map((_, i) => {
                        const row = renderFamilyJapan[i];
                        return (
                          <tr key={i} className="h-6">
                            <td className="border border-black px-2 py-1 font-bold uppercase">
                              {row?.name || ""}
                            </td>
                            <td className="border border-black text-center p-1 font-mono font-medium">
                              {row?.age ? `${row.age} 歳 Thn` : ""}
                            </td>
                            <td className="border border-black text-center p-1 uppercase font-medium">
                              {row?.relation || ""}
                            </td>
                            <td className="border border-black px-2 py-1 uppercase">
                              {row?.job || ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* LPK METADATA FOOTER */}
                <table className="w-full border-collapse border-2 border-black text-[9.5px] text-black mb-6">
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[130px]">
                        <div>Tanggal masuk LPK :</div>
                      </td>
                      <td className="border border-black p-2 font-mono font-bold">
                        {formData.lpkEntryDate || "-"}
                      </td>
                      <td className="border border-black p-2 bg-slate-50 font-bold w-[130px]">
                        <div>Lama belajar :</div>
                      </td>
                      <td className="border border-black p-2 font-bold uppercase">
                        {formData.studyDuration || "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black p-2 bg-slate-50 font-bold">
                        <div>EMAIL :</div>
                      </td>
                      <td className="border border-black p-2 font-mono font-bold" colSpan={3}>
                        {formData.email || "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SIGNATURE / STAMP BLOCK */}
              <div className="flex justify-between items-end mt-4">
                <div className="text-[9px] text-slate-400 font-mono">
                  2 / 2
                </div>
                <div className="text-right space-y-12 pr-6">
                  <div className="text-[10px] font-black uppercase text-slate-800">
                    <div>{lpkName}</div>
                    <div className="text-[9px] font-bold text-slate-500 mt-0.5">Peserta Interview</div>
                  </div>
                  <div className="border-t border-black w-[180px] pt-1 text-center font-bold text-[9.5px] uppercase">
                    {formData.name || "______________________"}
                  </div>
                </div>
              </div>
            </div>
            </div>

          </div>
        </div>
      )}

      {/* PRINT STYLES OVERRIDE */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #rirekisho-page-1, #rirekisho-page-1 * {
            visibility: visible;
          }
          #rirekisho-page-1 {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;
            transform: none !important;
            padding: 10mm !important;
            margin: 0 !important;
            page-break-after: always;
            box-sizing: border-box;
          }
          #rirekisho-page-2, #rirekisho-page-2 * {
            visibility: visible;
          }
          #rirekisho-page-2 {
            position: absolute;
            left: 0;
            top: 297mm; /* Ensure page 2 prints as page 2 */
            width: 210mm;
            height: 297mm;
            transform: none !important;
            padding: 10mm !important;
            margin: 0 !important;
            box-sizing: border-box;
          }
          /* Hide everything else */
          header, footer, nav, button, .flex, .bg-slate-300, .bg-amber-50 {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Icon helper
function ChevronRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}
