import React, { useState, useEffect, useMemo } from "react";
import { CheckCircle2, Copy, AlertCircle, ChevronLeft, MapPin, UploadCloud, FileText, ChevronRight, Lock, ArrowRight, User, GraduationCap, Eye, EyeOff, Loader2, Camera } from "lucide-react";
import { RegisteredStudent } from "../types";
import { ConfirmForm } from "./ConfirmForm";
import { uploadFileToFirebase } from "../lib/storageHelper";
import { DocumentScannerModal } from "./DocumentScannerModal";
import { DocumentPreviewModal } from "./DocumentPreviewModal";

interface RegistrationViewProps {
  onRegisterSubmit: (formData: any) => Promise<RegisteredStudent | null>;
  onBackToLanding?: () => void;
  systemState?: any;
}

export default function RegistrationView({
  onRegisterSubmit,
  onBackToLanding,
  systemState,
}: RegistrationViewProps) {
const [step, setStep] = useState(1);
const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

const [selectedRegType, setSelectedRegType] = useState<
  "reguler" | "matching"
>("reguler");
const [registrationFeeChoice, setRegistrationFeeChoice] = useState<
  "admin" | "dp"
>("admin");
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [birthDate, setBirthDate] = useState("");
const [education, setEducation] = useState("SMK");
const [statusPendaftaran, setStatusPendaftaran] =
  useState("Siswa Baru");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [program, setProgram] = useState("* All bidang JOB");
const [japaneseLevel, setJapaneseLevel] = useState(
  "Belum Belajar Sama Sekali (Nol Mutlak)",
);
const [loading, setLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{url: string, name: string} | null>(null);
  const [scanningDocument, setScanningDocument] = useState<{label: string, setter: any} | null>(null);
const [successInfo, setSuccessInfo] = useState<any | null>(null);
 // Document attachments
const [docAkta, setDocAkta] = useState("");
const [docFoto, setDocFoto] = useState("");
const [docIjazahSD, setDocIjazahSD] = useState("");
const [docIjazahSMP, setDocIjazahSMP] = useState("");
const [docIjazahSMA, setDocIjazahSMA] = useState("");
const [docKK, setDocKK] = useState("");
const [docKTP, setDocKTP] = useState("");
const [docTranskip, setDocTranskip] = useState("");
const [docPraMCU, setDocPraMCU] = useState("");
const [docVaksin, setDocVaksin] = useState("");
const [docKontrak, setDocKontrak] = useState("");
 // Payment simulated values
const [paymentType, setPaymentType] = useState<
  "va" | "transfer" | "cash"
>("va");
const [proofOfPayment, setProofOfPayment] = useState("");
const [paymentMethod, setPaymentMethod] = useState(
  "BCA Virtual Account",
);
const [jobOrderRecoSiswaId, setJobOrderRecoSiswaId] = useState<{
  [jobId: string]: string;
}>({});
const [showOtpPopup, setShowOtpPopup] = useState(false);
const [otpValue, setOtpValue] = useState("");
const [otpError, setOtpError] = useState("");
const [copiedVa, setCopiedVa] = useState(false);
const [referrer, setReferrer] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lpk_referral_code") || "";
  }
  return "";
});

const isSelfReferralCode = useMemo(() => {
  if (!referrer.trim()) return false;
  const r = referrer.trim().toLowerCase();
  return r === email.trim().toLowerCase() || (!!name.trim() && r === name.trim().toLowerCase());
}, [referrer, email, name]);

const matchedReferrer = useMemo(() => {
  if (!referrer || isSelfReferralCode) return null;
  return (systemState?.users || []).find((u: any) =>
    u.username.toLowerCase().trim() === referrer.toLowerCase().trim()
  );
}, [referrer, systemState?.users, isSelfReferralCode]);

useEffect(() => {
  if (typeof window !== "undefined") {
    const code = localStorage.getItem("lpk_referral_code");
    if (code && !referrer) {
      setReferrer(code);
    }
  }
}, []);

 const handleStep1Form = (e: React.FormEvent) => {
  e.preventDefault();
  if (!name || !email || !phone) return;
   if (statusPendaftaran !== "Alumni") {
    if (
      !docAkta ||
      !docIjazahSMA ||
      !docKTP
    ) {
      alert(
        "Harap lengkapi berkas persyaratan wajib (Akta Kelahiran, Ijazah SMA/SMK, dan KTP) di bagian bawah form terlebih dahulu. Berkas lainnya dapat dilengkapi menyusul kemudian hari.",
      );
      return;
    }
    setStep(2);
  } else {
    // Bypass payment step and documents for Alumni
    handleMidtransSimulatedPayment();
  }
};
 const handleMidtransSimulatedPayment = async () => {
  setLoading(true);
  try {
    let calculatedAmount =
      selectedRegType === "reguler"
        ? registrationFeeChoice === "dp"
          ? 4000000
          : 500000
        : 500000;
     if (statusPendaftaran === "Alumni") {
      calculatedAmount = 0;
    }
     const payload = {
      name: name,
      email: email,
      password: password || "123456",
      phone: phone,
      birthDate: birthDate || "2003-01-01",
      education: education,
      statusPendaftaran: statusPendaftaran,
      program: program,
      japaneseLevel: japaneseLevel,
      paymentAmount: calculatedAmount,
      paymentMethod:
        paymentType === "va"
          ? paymentMethod
          : paymentType === "transfer"
            ? "Transfer Rekening Manual"
            : "Bayar Langsung Kantor LPK",
      // Never fabricate a filename when nothing was actually uploaded - that
      // creates a broken/misleading "proof of payment" link for admins reviewing it.
      proofOfPayment:
        paymentType === "va" || paymentType === "cash"
          ? ""
          : proofOfPayment || "",
      docAkta: docAkta,
      docFoto: docFoto,
      docIjazahSD: docIjazahSD,
      docIjazahSMP: docIjazahSMP,
      docIjazahSMA: docIjazahSMA,
      docKK: docKK,
      docKTP: docKTP,
      docTranskip: docTranskip,
      docPraMCU: docPraMCU,
      docVaksin: docVaksin,
      docKontrak: docKontrak,
      // A student cannot refer themselves - guard against applicants who
      // misunderstand the optional field and type their own email/name.
      referrer:
        referrer.trim().toLowerCase() === email.trim().toLowerCase() ||
        referrer.trim().toLowerCase() === name.trim().toLowerCase()
          ? ""
          : referrer.trim(),
    };
    const result = await onRegisterSubmit(payload);
    if (result) {
      setSuccessInfo(result);
      setStep(3);
    }
  } catch (err) {
    console.error(err);
    alert(
      "Pendaftaran gagal disinkronkan ke server. Coba beberapa saat lagi.",
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="py-6 sm:py-10 px-4 animate-fade-in bg-slate-100 min-h-screen font-sans">
      {onBackToLanding && (
        <div className="max-w-2xl mx-auto mb-4">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" /> Kembali ke Beranda Utama
          </button>
        </div>
      )}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-4 text-left font-sans">
    {/* Header Title Bar */}
    <div className="border-b border-slate-100 pb-3">
      <span className="text-[9px] font-mono bg-indigo-550 bg-indigo-700 text-white font-black px-2.5 py-1 rounded uppercase tracking-wider">
        📝 FORM PENDAFTARAN (SISWA/ALUMNI)
      </span>
      <h3 className="text-md font-black text-slate-800 mt-2.5 leading-tight">
        Mulai Fast-Track Karir Jepang Kamu!
      </h3>
      <p className="text-[10px] text-slate-500 mt-1">
        Isi formulir dan booking asrama LPK Pati secara mandiri
        (tanpa perlu login).
      </p>
    </div>
     {/* Progress Steps Indicator */}
    <div className="bg-slate-50 border border-slate-150 p-2.5 rounded-2xl flex items-center justify-between gap-1.5 select-none font-sans">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[9px] font-black ${step >= 1 ? "bg-indigo-900 text-yellow-400" : "bg-slate-200 text-slate-500"}`}
        >
          1
        </span>
        <span
          className={`text-[10px] font-bold ${step === 1 ? "text-slate-800" : "text-slate-400"}`}
        >
          Biodata
        </span>
      </div>
      <div className="h-px bg-slate-200 flex-1"></div>
      <div className="flex items-center gap-1.5">
        <span
          className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[9px] font-black ${step >= 2 ? "bg-indigo-900 text-yellow-400" : "bg-slate-200 text-slate-500"}`}
        >
          2
        </span>
        <span
          className={`text-[10px] font-bold ${step === 2 ? "text-slate-800" : "text-slate-400 font-normal"}`}
        >
          Biaya
        </span>
      </div>
      <div className="h-px bg-slate-200 flex-1"></div>
      <div className="flex items-center gap-1.5">
        <span
          className={`h-5 w-5 rounded-full flex items-center justify-center font-mono text-[9px] font-black ${step >= 3 ? "bg-indigo-900 text-yellow-400" : "bg-slate-200 text-slate-500"}`}
        >
          3
        </span>
        <span
          className={`text-[10px] font-bold ${step === 3 ? "text-slate-800 font-extrabold" : "text-slate-400 font-normal"}`}
        >
          Selesai
        </span>
      </div>
    </div>
     {/* STEP 1: BIODATA & ATTACHMENTS */}
    {step === 1 && (
      <ConfirmForm
        confirmTitle="Lanjut ke Pendaftaran?"
        confirmMessage="Anda yakin informasi diri awal ini sudah benar?"
        onSubmit={handleStep1Form}
        className="space-y-4"
      >
        <div className="space-y-3">
          {/* Status Pendaftaran Icons Area */}
          <div className="space-y-1.5 pb-2">
            <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
              STATUS PENDAFTARAN (SIKAP/JALUR)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setStatusPendaftaran("Siswa Baru")
                }
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  statusPendaftaran === "Siswa Baru"
                    ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-500/20"
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                }`}
              >
                <User
                  className={`h-6 w-6 mb-1 block ${statusPendaftaran === "Siswa Baru" ? "text-blue-600" : "text-slate-300"}`}
                />
                <span className="font-extrabold text-[10px]">
                  Siswa Baru
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStatusPendaftaran("Alumni")}
                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                  statusPendaftaran === "Alumni"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm ring-1 ring-indigo-500/20"
                    : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                }`}
              >
                <GraduationCap
                  className={`h-6 w-6 mb-1 block ${statusPendaftaran === "Alumni" ? "text-indigo-600" : "text-slate-300"}`}
                />
                <span className="font-extrabold text-[10px]">
                  Alumni
                </span>
              </button>
            </div>
          </div>
           <div className="space-y-1 mt-2">
            <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
              NAMA LENGKAP CALON SISWA
            </label>
            <input
              type="text"
              required
              placeholder="Masukkan nama lengkap sesuai KTP..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
            />
          </div>
           <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                ALAMAT EMAIL
              </label>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                WHATSAPP / TELEPON
              </label>
              <input
                type="tel"
                required
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>
           <div className="space-y-1 mt-2">
            <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
              KATA SANDI / PASSWORD UNTUK LOGIN
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Pilih password untuk login akun..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-10 focus:border-blue-500 focus:bg-white outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 mt-2 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-3 rounded-2xl border border-indigo-100/60">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono font-black text-indigo-800 uppercase tracking-wider block">
                🔑 KODE REFERRAL / ALUMNI REFERRER (OPSIONAL)
              </label>
              {referrer && (
                <button
                  type="button"
                  onClick={() => setReferrer("")}
                  className="text-[9px] text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                >
                  Hapus
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder="Contoh: alumni123 (username alumni sponsor)"
              value={referrer}
              onChange={(e) => setReferrer(e.target.value)}
              className="w-full text-xs rounded-xl border border-indigo-200 bg-white px-3 py-2.5 focus:border-indigo-500 outline-none transition font-semibold"
            />
            {referrer && (
              <div className="mt-1 flex items-start gap-1.5 animate-fade-in">
                {isSelfReferralCode ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-lg border border-rose-200/50 font-bold">
                      ⚠️ Kode Referral Tidak Boleh Nama/Email Anda Sendiri
                    </span>
                    <span className="text-[9.5px] text-slate-500 ml-1">
                      Kolom ini untuk username Alumni/Siswa lain yang mengajak Anda. Kosongkan jika tidak ada.
                    </span>
                  </div>
                ) : matchedReferrer ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-200/50 font-bold flex items-center gap-1">
                      <span>✓ Kode Referral Cocok!</span>
                    </span>
                    <span className="text-[9.5px] text-slate-600 font-medium ml-1">
                      Sponsor Resmi: <span className="font-bold text-slate-800">{matchedReferrer.name}</span> ({matchedReferrer.role})
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200/50 font-bold">
                      ⚠️ Kode Belum Terdaftar di Database SCI
                    </span>
                    <span className="text-[9.5px] text-slate-500 ml-1">
                      Siswa akan terdaftar secara reguler tanpa sponsor terafiliasi.
                    </span>
                  </div>
                )}
              </div>
            )}
            {!referrer && (
              <p className="text-[9px] text-slate-400 leading-normal">
                Jika Anda diajak oleh Alumni atau Siswa LPK Source Course Indonesia, masukkan username mereka di sini untuk mendapatkan keuntungan akselerasi.
              </p>
            )}
          </div>

           <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                TANGGAL LAHIR
              </label>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3  py-2.5  block focus:border-blue-500 focus:bg-white outline-none transition cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                PENDIDIKAN TERAKHIR
              </label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3  py-2.5  block focus:border-blue-500 focus:bg-white outline-none transition cursor-pointer"
              >
                <option value="SMA">SMA</option>
                <option value="SMK">SMK / STM</option>
                <option value="MA">MA / Pesantren</option>
                <option value="D3">Diploma III</option>
                <option value="S1">Sarjana S1</option>
              </select>
            </div>
          </div>
           {statusPendaftaran !== "Alumni" && (
            <>
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block font-bold">
                  PROGRAM KERJA JEPANG
                </label>
                <select
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  className="w-full block text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition cursor-pointer font-bold"
                >
                  <option value="* All bidang JOB">
                    * All bidang JOB
                  </option>
                  <optgroup label="Program Magang (Jishusei)">
                    <option value="Magang (Jishusei) - Manufaktur">
                      Magang Kerja (Jishusei) - Operator Perakitan Pabrik
                    </option>
                    <option value="Magang (Jishusei) - Pengolahan Makanan">
                      Magang Kerja (Jishusei) - Pengolahan Makanan
                    </option>
                    <option value="Magang (Jishusei) - Pertanian">
                      Magang Kerja (Jishusei) - Pertanian
                    </option>
                  </optgroup>
                  <optgroup label="Tokutei Ginou (SSW) 14 Bidang">
                    <option value="Tokutei Ginou - Care Worker / Perawat Lansia">Care Worker / Perawat Lansia</option>
                    <option value="Tokutei Ginou - Building Cleaning Management / Petugas Kebersihan Gedung">Building Cleaning Management / Petugas Kebersihan Gedung</option>
                    <option value="Tokutei Ginou - Machine Parts & Tooling Industries / Industri Pembuatan Perangkat & Suku Cadang Mesin">Machine Parts & Tooling Industries / Industri Pembuatan Perangkat & Suku Cadang Mesin</option>
                    <option value="Tokutei Ginou - Industrial Machinery Industry / Industri Permesinan Pabrik">Industrial Machinery Industry / Industri Permesinan Pabrik</option>
                    <option value="Tokutei Ginou - Electric, Electronics and Information Industries / Industri Listrik, Elektronik dan Informasi">Electric, Electronics and Information Industries / Industri Listrik, Elektronik dan Informasi</option>
                    <option value="Tokutei Ginou - Construction Industries / Konstruksi">Construction Industries / Konstruksi</option>
                    <option value="Tokutei Ginou - Shipbuilding & Ship Machinery Industries / Industri Pembuatan Kapal dan Permesinan Kapal">Shipbuilding & Ship Machinery Industries / Industri Pembuatan Kapal dan Permesinan Kapal</option>
                    <option value="Tokutei Ginou - Automobile Repair & Maintenance / Industri Perawatan & Perbaikan Kendaraan Bermotor">Automobile Repair & Maintenance / Industri Perawatan & Perbaikan Kendaraan Bermotor</option>
                    <option value="Tokutei Ginou - Aviation Industries / Industri Penerbangan">Aviation Industries / Industri Penerbangan</option>
                    <option value="Tokutei Ginou - Accomodation Industries / Industri Perhotelan & Pariwisata">Accomodation Industries / Industri Perhotelan & Pariwisata</option>
                    <option value="Tokutei Ginou - Agriculture / Pertanian & Peternakan">Agriculture / Pertanian & Peternakan</option>
                    <option value="Tokutei Ginou - Fishery & Aquaculture / Perikanan & Budi Daya Ikan (Aquakultur)">Fishery & Aquaculture / Perikanan & Budi Daya Ikan (Aquakultur)</option>
                    <option value="Tokutei Ginou - Manufacture Food & Beverages / Produksi Makanan & Minuman">Manufacture Food & Beverages / Produksi Makanan & Minuman</option>
                    <option value="Tokutei Ginou - Food Service Industries / Industri Pelayanan Makanan">Food Service Industries / Industri Pelayanan Makanan</option>
                  </optgroup>
                </select>
              </div>
               <div className="space-y-1">
                <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                  KEMAMPUAN BAHASA JEPANG
                </label>
                <select
                  value={japaneseLevel}
                  onChange={(e) =>
                    setJapaneseLevel(e.target.value)
                  }
                  className="w-full block text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition cursor-pointer"
                >
                  <option value="Belum Belajar Sama Sekali (Nol Mutlak)">
                    Belum Belajar Sama Sekali (Nol Mutlak / Dari
                    Dasar)
                  </option>
                  <option value="Sedang Belajar Mandiri atau Kursus Singkat">
                    Sedang Belajar Mandiri atau Kursus Singkat
                  </option>
                  <option value="Pernah Ikut Tes JFT-Basic / JLPT N5">
                    Pernah Ikut Tes JFT-Basic / JLPT N5
                  </option>
                  <option value="Lulus JLPT N4 / JLPT N3 (Ex-Kenshusei)">
                    Lulus JLPT N4 / JLPT N3 (Ex-Kenshusei / Eks
                    Magang)
                  </option>
                </select>
              </div>
               <div className="space-y-1">
                <label className="text-[9px] font-mono font-black text-indigo-900 uppercase tracking-wider block font-bold">
                  JALUR PENDAFTARAN RESMI (SOP)
                </label>
                <select
                  value={selectedRegType}
                  onChange={(e) =>
                    setSelectedRegType(e.target.value as any)
                  }
                  className="w-full block text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus:border-blue-500 focus:bg-white outline-none transition cursor-pointer font-bold text-blue-700"
                >
                  <option value="reguler">
                    Jalur Kelas Regular ( Magang/Ikusei
                    shuro/Tokuteiginou)
                  </option>
                  <option value="matching">
                    Jalur Matching Job Cepat (Ex-LPK/Otodidak)
                  </option>
                </select>
              </div>
            </>
          )}
           {statusPendaftaran !== "Alumni" &&
            selectedRegType === "reguler" && (
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-150 space-y-1.5 text-left">
                <label className="text-[9px] font-mono font-black text-blue-800 uppercase tracking-wider block">
                  Opsi Pembayaran Registrasi Awal:
                </label>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="reg_fee_choice"
                      checked={
                        registrationFeeChoice === "admin"
                      }
                      onChange={() =>
                        setRegistrationFeeChoice("admin")
                      }
                      className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>Hanya Administrasi</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="reg_fee_choice"
                      checked={registrationFeeChoice === "dp"}
                      onChange={() =>
                        setRegistrationFeeChoice("dp")
                      }
                      className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span>
                      Administrasi + DP Kelas
                    </span>
                  </label>
                </div>
              </div>
            )}
        </div>
         {/* Attachment Files Simulation Block */}
        {statusPendaftaran !== "Alumni" ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 p-3.5 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block font-bold">
                📂 BERKAS PERSYARATAN WAJIB (11 DOKUMEN)
              </span>
            </div>
             <p className="text-[8.5px] text-slate-400">
              Silakan lengkapi berkas calon peserta didik.
            </p>
             <div className="grid grid-cols-1 gap-2 text-[9px] font-mono text-slate-600 bg-white p-2.5 border border-slate-200 rounded-xl max-h-[250px] overflow-y-auto">
              {[
                {
                  label: "Akta Kelahiran",
                  state: docAkta,
                  setter: setDocAkta,
                  isRequired: true,
                },
                {
                  label: "Pas Foto 3x4",
                  state: docFoto,
                  setter: setDocFoto,
                  isRequired: false,
                },
                {
                  label: "Ijazah SD",
                  state: docIjazahSD,
                  setter: setDocIjazahSD,
                  isRequired: false,
                },
                {
                  label: "Ijazah SMP",
                  state: docIjazahSMP,
                  setter: setDocIjazahSMP,
                  isRequired: false,
                },
                {
                  label: "Ijazah SMA/SMK",
                  state: docIjazahSMA,
                  setter: setDocIjazahSMA,
                  isRequired: true,
                },
                {
                  label: "Kartu Keluarga",
                  state: docKK,
                  setter: setDocKK,
                  isRequired: false,
                },
                {
                  label: "KTP Calon Siswa",
                  state: docKTP,
                  setter: setDocKTP,
                  isRequired: true,
                },
                {
                  label: "Transkrip Nilai",
                  state: docTranskip,
                  setter: setDocTranskip,
                  isRequired: false,
                },
                {
                  label: "Hasil PraMCU",
                  state: docPraMCU,
                  setter: setDocPraMCU,
                  isRequired: false,
                },
                {
                  label: "Sertifikat Vaksin",
                  state: docVaksin,
                  setter: setDocVaksin,
                  isRequired: false,
                },
                {
                  label: "Kontrak Kerja",
                  state: docKontrak,
                  setter: setDocKontrak,
                  isRequired: false,
                },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1.5 text-slate-700 border border-slate-100 p-2 rounded-lg bg-slate-50"
                >
                  <span className="font-bold font-sans flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1.5">
                      <span>{doc.label}</span>
                      <span className={`text-[7px] px-1 py-0.2 rounded font-mono ${
                        doc.isRequired ? "bg-red-100 text-red-700 font-bold" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {doc.isRequired 
                          ? "Wajib" 
                          : doc.label === "Transkrip Nilai"
                            ? "Tidak Wajib"
                            : doc.label === "Kontrak Kerja"
                              ? "Setelah Lulus"
                              : "Bisa Menyusul"}
                      </span>
                    </span>
                    <span
                      className={
                        uploadingFiles[doc.label]
                          ? "text-blue-600 text-xs font-bold animate-pulse flex items-center gap-1"
                          : doc.state
                            ? "text-emerald-600 text-xs font-bold"
                            : "text-amber-500 text-xs"
                      }
                    >
                      {uploadingFiles[doc.label] ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" />
                          <span>Mengunggah...</span>
                        </>
                      ) : doc.state ? (
                        "✓ Sudah Terisi"
                      ) : (
                        "• Belum Diisi"
                      )}
                    </span>
                  </span>
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingFiles[doc.label]}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) {
                          doc.setter("");
                          return;
                        }
                        setUploadingFiles((prev) => ({ ...prev, [doc.label]: true }));
                        uploadFileToFirebase(file, "registrations")
                          .then((downloadUrl) => {
                            doc.setter(`${file.name}|${downloadUrl}`);
                          })
                          .catch((err: any) => {
                            console.error(err);
                            alert(`Gagal mengunggah ${doc.label}: ${err.message || err}`);
                          })
                          .finally(() => {
                            setUploadingFiles((prev) => ({ ...prev, [doc.label]: false }));
                          });
                      }}
                      className="text-[9px] font-sans file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-indigo-100 file:text-indigo-800 hover:file:bg-indigo-200 flex-1 cursor-pointer disabled:opacity-50 min-w-0"
                    />
                    {doc.state && (
                      <button
                        type="button"
                        onClick={() => {
                          const parts = doc.state.split("|");
                          if (parts.length >= 2) {
                            setPreviewDocument({ name: parts[0], url: parts.slice(1).join("|") });
                          } else {
                            setPreviewDocument({ name: doc.label, url: doc.state });
                          }
                        }}
                        className="flex-shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors text-[9px] font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={uploadingFiles[doc.label]}
                      onClick={() => setScanningDocument({ label: doc.label, setter: doc.setter })}
                      className="flex-shrink-0 flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors text-[9px] font-bold"
                    >
                      <Camera className="w-3.5 h-3.5" /> Scan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl">
            <p className="text-[10px] text-emerald-800 font-bold uppercase text-center tracking-wide">
              🎓 Alumni: Dokumen & Biaya Pendaftaran Gratis!
            </p>
          </div>
        )}
         {/* Next Action Button */}
        <button
          type="submit"
          className="w-full bg-indigo-900 text-yellow-400 font-black text-xs py-3.5 rounded-xl transition hover:bg-indigo-700 active:scale-95 text-center cursor-pointer flex items-center justify-center gap-1 shadow-md"
        >
          {statusPendaftaran === "Alumni"
            ? "Selesaikan Pendaftaran"
            : "Lanjut Ke Langkah 2 (Biaya)"}{" "}
          <ArrowRight className="h-4 w-4" />
        </button>
      </ConfirmForm>
    )}
     {/* STEP 2: COST ESTIMATION & PAYMENTS */}
    {step === 2 && (
      <div className="space-y-4 font-sans text-left">
        {selectedRegType === "reguler" && (
          <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-150 space-y-1.5 text-left">
            <label className="text-[9px] font-mono font-black text-blue-800 uppercase tracking-wider block">
              Opsi Pembayaran Registrasi:
            </label>
            <div className="space-y-1">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="reg_fee_choice_step2"
                  checked={
                    registrationFeeChoice === "admin"
                  }
                  onChange={() =>
                    setRegistrationFeeChoice("admin")
                  }
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Hanya Administrasi (Rp 500.000)</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="reg_fee_choice_step2"
                  checked={registrationFeeChoice === "dp"}
                  onChange={() =>
                    setRegistrationFeeChoice("dp")
                  }
                  className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>
                  Administrasi + DP Kelas (Rp 4.000.000)
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block font-bold">
            NOMINAL TRANSFER
          </span>
          <p className="text-sm font-black text-rose-600 mt-1">
            {selectedRegType === "reguler"
              ? registrationFeeChoice === "dp"
                ? "Rp 4.000.000"
                : "Rp 500.000"
              : "Rp 500.000"}{" "}
            <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
              (
              {selectedRegType === "reguler"
                ? registrationFeeChoice === "dp"
                  ? "Administrasi + DP Kelas Awal LPK SCI"
                  : "Administrasi Pendaftaran Resmi LPK SCI"
                : "Administrasi Pendaftaran Resmi LPK SCI"}
              )
            </span>
          </p>
        </div>
         <div className="space-y-3">
          <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block font-bold">
            PILIH SISTEM PEMBAYARAN
          </label>
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold font-sans">
            <button
              type="button"
              onClick={() => {
                setPaymentType("va");
                setPaymentMethod("BCA Virtual Account");
              }}
              className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                paymentType === "va"
                  ? "bg-indigo-900 text-yellow-400 border-indigo-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 active:bg-slate-50"
              }`}
            >
              <span className="text-sm">⚡</span>
              <span className="block text-[9px] font-black uppercase tracking-tight leading-none">
                Virtual Account
              </span>
            </button>
             <button
              type="button"
              onClick={() => {
                setPaymentType("transfer");
                setPaymentMethod("Transfer Rekening Manual");
              }}
              className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                paymentType === "transfer"
                  ? "bg-indigo-900 text-yellow-400 border-indigo-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 active:bg-slate-50"
              }`}
            >
              <span className="text-sm">🏦</span>
              <span className="block text-[9px] font-black uppercase tracking-tight leading-none">
                Transfer Bank
              </span>
            </button>
             <button
              type="button"
              onClick={() => {
                setPaymentType("cash");
                setPaymentMethod("Bayar Langsung Kantor LPK");
              }}
              className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                paymentType === "cash"
                  ? "bg-indigo-900 text-yellow-400 border-indigo-900 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 active:bg-slate-50"
              }`}
            >
              <span className="text-sm">💵</span>
              <span className="block text-[9px] font-black uppercase tracking-tight leading-none">
                Cash Kantor
              </span>
            </button>
          </div>
        </div>
         {paymentType === "va" && (
          <div className="space-y-2">
            <label className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider block font-bold">
              PILIH METODE PEMBAYARAN SIMULASI
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() =>
                  setPaymentMethod("BCA Virtual Account")
                }
                className={`p-3 rounded-xl border text-center transition ${paymentMethod === "BCA Virtual Account" ? "bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100" : "bg-white border-slate-200 active:bg-slate-50"}`}
              >
                🔵 BCA Virtual Account
              </button>
              <button
                type="button"
                onClick={() =>
                  setPaymentMethod("QRIS Gopay Shopee")
                }
                className={`p-3 rounded-xl border text-center transition ${paymentMethod === "QRIS Gopay Shopee" ? "bg-blue-50 border-blue-600 text-blue-700 ring-2 ring-blue-100" : "bg-white border-slate-200 active:bg-slate-50"}`}
              >
                🔴 QRIS (DANA/Gopay)
              </button>
            </div>
             {/* Info Simulation Box */}
            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl space-y-1 my-1 border border-amber-200/50 text-[10px] leading-relaxed">
              <p className="font-bold text-amber-800">
                🔒 Transaksi Simulator Terintegrasi
              </p>
              <p className="text-slate-650">
                VA dan QRIS disimulasikan menggunakan API Sandbox,
                otomatis lunas setelah pin atau OTP selesai
                diinput.
              </p>
            </div>
          </div>
        )}
         {paymentType === "cash" && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 font-sans text-left my-2">
            <p className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block font-mono">
              PEMBAYARAN CASH (Tunai) DI KANTOR
            </p>
            <p className="text-[11px] text-slate-600 leading-normal">
              Silahkan bawa uang tunai dan lakukan pembayaran
              langsung di kantor pelayanan LPK SCI Pati setelah
              pendaftaran ini tersubmit:
            </p>
            <div className="bg-white p-3 rounded-xl border border-slate-150 inline-block w-full">
              <strong className="text-xs text-slate-800">
                Kantor Utama LPK SCI Pati
              </strong>
              <p className="text-[10px] text-slate-500 mt-1">
                Jl. Kol. Sunandar No.2, Winong, Kec. Pati, Kab.
                Pati, Jawa Tengah 59112
              </p>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Pendaftaran akan berstatus "Tertunda Review"
              (Pending) sampai pembayaran diserahkan.
            </p>
          </div>
        )}
         {paymentType === "transfer" && (
          /* MANUAL PAYMENT DETAIL */
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3 font-sans text-left my-2">
            <p className="text-[9px] font-bold text-indigo-900 uppercase tracking-wider block font-mono">
              REKENING TERVERIFIKASI LPK SCI PATI
            </p>
            <div className="space-y-2 text-[11px]">
              {(systemState?.customization?.paymentAccounts || []).length === 0 && (
                <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5 italic">
                  Rekening transfer belum tersedia. Silakan pilih metode pembayaran lain atau hubungi Admin.
                </p>
              )}
              {(systemState?.customization?.paymentAccounts || []).map((acc, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2.5 rounded-xl border border-slate-150 flex items-center justify-between"
                >
                  <div>
                    <span className="text-[8px] text-slate-400 font-bold block uppercase font-mono">
                      {acc.bankName}
                    </span>
                    <strong className="text-xs font-mono tracking-wider font-extrabold text-slate-900 block">
                      {acc.accountNumber}
                    </strong>
                    <span className="text-[8px] text-slate-500 block">
                      a.n. {acc.holderName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        acc.accountNumber.replace(/\D/g, ""),
                      );
                      alert(
                        `Rekening ${acc.bankName} berhasil disalin!`,
                      );
                    }}
                    className="px-2 py-0.5 text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-900 font-bold rounded-lg"
                  >
                    Salin
                  </button>
                </div>
              ))}
            </div>
             {/* Real upload block on Mobile */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-200">
              <label className="text-[8.5px] font-mono font-black text-slate-500 uppercase tracking-wider block">
                UNGGAH BUKTI TRANSFER (RESI/SCREENSHOT)
              </label>
              <div className="flex items-center gap-2 w-full">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  disabled={uploadingFiles['proofOfPayment']}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingFiles((prev) => ({ ...prev, proofOfPayment: true }));
                    uploadFileToFirebase(file, "payments")
                      .then((downloadUrl) => {
                        setProofOfPayment(`${file.name}|${downloadUrl}`);
                      })
                      .catch((err: any) => {
                        console.error(err);
                        alert(`Gagal mengunggah bukti pembayaran: ${err.message || err}`);
                      })
                      .finally(() => {
                        setUploadingFiles((prev) => ({ ...prev, proofOfPayment: false }));
                      });
                  }}
                  className="text-[10px] font-sans file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[9px] file:font-bold file:bg-indigo-900 file:text-yellow-400 hover:file:bg-indigo-700 flex-1 cursor-pointer disabled:opacity-50 min-w-0"
                />
                {proofOfPayment && (
                  <button
                    type="button"
                    onClick={() => {
                      const parts = proofOfPayment.split("|");
                      if (parts.length >= 2) {
                        setPreviewDocument({ name: parts[0], url: parts.slice(1).join("|") });
                      } else {
                        setPreviewDocument({ name: 'Bukti Pembayaran', url: proofOfPayment });
                      }
                    }}
                    className="flex-shrink-0 flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors text-[10px] font-bold"
                  >
                    <Eye className="w-3.5 h-3.5" /> Lihat
                  </button>
                )}
                <button
                  type="button"
                  disabled={uploadingFiles['proofOfPayment']}
                  onClick={() => setScanningDocument({ label: 'proofOfPayment', setter: setProofOfPayment })}
                  className="flex-shrink-0 flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors text-[10px] font-bold"
                >
                  <Camera className="w-3.5 h-3.5" /> Scan
                </button>
              </div>
              {uploadingFiles['proofOfPayment'] && (
                <p className="text-blue-600 font-bold text-[9px] block animate-pulse flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin inline-block mr-1" />
                  <span>Mengunggah bukti transfer...</span>
                </p>
              )}
              {proofOfPayment && !uploadingFiles['proofOfPayment'] && (
                <p className="text-emerald-600 font-bold text-[9px] block">
                  ✓ Terpilih: {proofOfPayment.includes("|") ? proofOfPayment.split("|")[0] : proofOfPayment}
                </p>
              )}
            </div>
          </div>
        )}
         <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-3.5 rounded-xl transition text-center cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (paymentType === "va") {
                setShowOtpPopup(true);
              } else {
                handleMidtransSimulatedPayment();
              }
            }}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl transition text-center shadow-md cursor-pointer flex items-center justify-center gap-1"
          >
            {loading
              ? "Memproses..."
              : paymentType === "va"
                ? "Selesaikan Pembayaran 💳"
                : "Lanjutkan & Kirim Data 📤"}
          </button>
        </div>
      </div>
    )}
     {/* STEP 3: CONGRATS & RECEIPT DISPLAY */}
    {step === 3 && successInfo && (
      <div className="space-y-4 animate-fade-in text-left">
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-250 text-center space-y-1.5">
          <span className="text-2xl">✅</span>
          <h4 className="text-xs font-black uppercase text-emerald-900">
            {successInfo.paymentMethod?.includes("Manual") ||
            successInfo.paymentMethod?.includes("Kantor")
              ? "Pendaftaran Terkirim (Pending Review)"
              : "Pendaftaran Sukses Terkirim!"}
          </h4>
          <p className="text-[10px] text-emerald-700 leading-normal">
            {successInfo.paymentMethod?.includes("Manual") ||
            successInfo.paymentMethod?.includes("Kantor")
              ? "Pendaftaran Anda telah disimpan. Harap simpan kwitansi atau bukti pembayaran untuk verifikasi."
              : "Selamat! Berkas dan data pendaftaran Anda telah tercatat dan lunas secara otomatis pada server LPK SCI Pati."}
          </p>
        </div>
         <div className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-slate-50/50 select-text font-mono text-xs">
          <div className="flex justify-between border-b pb-2">
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
              KODE REGISTRASI
            </span>
            <strong className="text-xs text-indigo-600 font-mono tracking-wider font-extrabold">
              {successInfo.id || "SCI-XP5-101"}
            </strong>
          </div>
           <div className="divide-y divide-slate-100 space-y-2 text-[11px]">
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">
                Nama Lengkap:
              </span>
              <strong className="text-slate-800 font-bold">
                {successInfo.name}
              </strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Email:</span>
              <strong
                className="text-slate-800 truncate max-w-[150px]"
                title={successInfo.email}
              >
                {successInfo.email}
              </strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">
                Program Kerja Jepang:
              </span>
              <strong className="text-slate-800 font-bold">
                {successInfo.program}
              </strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">
                Metode Bayar:
              </span>
              <strong className="text-slate-800">
                {successInfo.paymentMethod ||
                  "BCA Virtual Account"}
              </strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">
                Nominal Setor:
              </span>
              <strong className="text-slate-900 font-bold">
                IDR{" "}
                {successInfo.paymentAmount?.toLocaleString(
                  "id-ID",
                ) || "500.000"}
              </strong>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">
                Status Bayar:
              </span>
              <strong
                className={`text-xs font-mono font-black uppercase ${successInfo.paymentMethod?.includes("Manual") || successInfo.paymentMethod?.includes("Kantor") ? "text-amber-500 animate-pulse" : "text-emerald-600"}`}
              >
                {successInfo.paymentMethod?.includes(
                  "Manual",
                ) ||
                successInfo.paymentMethod?.includes("Kantor")
                  ? "TERTUNDA REVIEW"
                  : "SUKSES LUNAS / SANDBOX"}
              </strong>
            </div>
          </div>
        </div>
         <button
          type="button"
          onClick={() => {
            setStep(1);
            setName("");
            setEmail("");
            setPhone("");
            setBirthDate("");
            setStatusPendaftaran("Siswa Baru");
            setDocAkta("");
            setDocFoto("");
            setDocIjazahSD("");
            setDocIjazahSMP("");
            setDocIjazahSMA("");
            setDocKK("");
            setDocKTP("");
            setDocTranskip("");
            setProofOfPayment("");
            setSuccessInfo(null);
          }}
          className="w-full bg-indigo-900 text-yellow-400 font-extrabold text-xs py-3.5 rounded-xl transition text-center cursor-pointer shadow-md"
        >
          Daftar Baru Lainnya (Reset Form)
        </button>
      </div>
    )}
  </div>
 {/* OTP Simulator Popup for Mobile Registered Form */}
{showOtpPopup && (
  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[100000] animate-fade-in font-sans">
    <div className="bg-white rounded-2xl border border-slate-150 p-5 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
      <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
        💳
      </div>
      <div>
        <h4 className="font-extrabold text-sm text-indigo-900">
          Simulasi Keamanan Midtrans 3D Secure
        </h4>
        <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">
          Kami mengirimkan kode OTP SMS simulasi ke nomor{" "}
          <strong className="text-slate-800">
            {phone || "pendaftar"}
          </strong>
          . Masukkan angka{" "}
          <strong className="text-slate-850 font-bold text-indigo-600">
            123456
          </strong>{" "}
          untuk otorisasi tagihan Rp $
          {(selectedRegType === "reguler"
            ? registrationFeeChoice === "dp"
              ? 4000000
              : 500000
            : 500000
          ).toLocaleString("id-ID")}
          .
        </p>
      </div>
       <div className="space-y-1 text-left">
        <label className="text-[9px] font-mono font-black text-slate-500 block">
          KODE OTORISASI (OTP)
        </label>
        <input
          type="text"
          placeholder="Masukkan angka 123456"
          value={otpValue}
          onChange={(e) => setOtpValue(e.target.value)}
          className="w-full text-center tracking-widest font-mono text-sm uppercase rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white"
        />
        {otpError && (
          <span className="text-[9px] text-rose-600 font-bold block">
            {otpError}
          </span>
        )}
      </div>
       <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setShowOtpPopup(false);
            setOtpValue("");
            setOtpError("");
          }}
          className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl transition"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={() => {
            if (otpValue.trim() === "123456") {
              setShowOtpPopup(false);
              setOtpValue("");
              setOtpError("");
              handleMidtransSimulatedPayment();
            } else {
              setOtpError(
                "Kode salah! Masukkan angka '123456' untuk simulasi.",
              );
            }
          }}
          className="flex-1 bg-indigo-900 text-yellow-400 font-extrabold text-xs py-2.5 rounded-xl transition hover:bg-indigo-700 text-center"
        >
          Verifikasi OTP ✓
        </button>
      </div>
    </div>
  </div>
)}
      {previewDocument && (
        <DocumentPreviewModal
          url={previewDocument.url}
          name={previewDocument.name}
          onClose={() => setPreviewDocument(null)}
        />
      )}
      
      {scanningDocument && (
        <DocumentScannerModal
          onClose={() => setScanningDocument(null)}
          onCapture={(file) => {
            const { label, setter } = scanningDocument;
            setScanningDocument(null);
            
            setUploadingFiles((prev) => ({ ...prev, [label]: true }));
            uploadFileToFirebase(file, "registrations")
              .then((downloadUrl) => {
                setter(`${file.name}|${downloadUrl}`);
              })
              .catch((err) => {
                console.error(err);
                alert(`Gagal mengunggah ${label}: ${err.message || err}`);
              })
              .finally(() => {
                setUploadingFiles((prev) => ({ ...prev, [label]: false }));
              });
          }}
        />
      )}
    </div>
  );
}
