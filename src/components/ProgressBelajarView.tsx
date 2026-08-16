import React, { useState } from "react";
import { 
  TrendingUp, BookOpen, Clock, Calendar, Search, Award, CheckCircle2, 
  HelpCircle, ChevronRight, Save, User, Sparkles, Star, ClipboardList, ShieldAlert,
  Upload, Eye, Trash2, X, FileText, Check
} from "lucide-react";
import { SystemState, UserAccount, ActiveStudent, ChapterAssessment } from "../types";
import { CHAPTERS_LIST } from "../chapters";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { uploadFileToFirebase, getEmbeddablePdfUrl } from "../lib/storageHelper";
import { resolveAttendanceScore } from "../lib/attendanceMetrics";
import { computeSubjectAverage } from "../lib/scoreAveraging";
import { hasStaffOversight } from "../lib/permissions";

interface ProgressBelajarViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  onLoginSuccess?: (user: UserAccount) => void;
}

export default function ProgressBelajarView({
  currentUser,
  systemState,
  onUpdateState
}: ProgressBelajarViewProps) {
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    currentUser?.role === "Siswa" ? currentUser.studentId || null : (systemState.activeStudents[0]?.id || null)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("Semua");

  // Post-JOB Monitoring Form States
  const [jobTestimonial, setJobTestimonial] = useState("");
  const [jobSoMitra, setJobSoMitra] = useState("");
  const [jobCompanyJapan, setJobCompanyJapan] = useState("");
  const [jobField, setJobField] = useState("");
  const [jobKumiai, setJobKumiai] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobMcu2Date, setJobMcu2Date] = useState("");
  const [jobPassportDate, setJobPassportDate] = useState("");
  const [jobCoeDate, setJobCoeDate] = useState("");
  const [jobVisaDate, setJobVisaDate] = useState("");
  const [jobDepartureDate, setJobDepartureDate] = useState("");
  const [jobCoeFile, setJobCoeFile] = useState("");
  const [jobFeedback, setJobFeedback] = useState("");
  const [jobRoadmap, setJobRoadmap] = useState("");

  const [viewingDoc, setViewingDoc] = useState<{ title: string; url: string } | null>(null);
  const [isSubmittingJobForm, setIsSubmittingJobForm] = useState(false);
  const [jobFormSuccess, setJobFormSuccess] = useState("");

  React.useEffect(() => {
    const student = systemState.activeStudents.find(s => s.id === selectedStudentId);
    if (student) {
      setJobTestimonial(student.jobTestimonial || "");
      setJobSoMitra(student.jobSoMitra || "");
      setJobCompanyJapan(student.jobCompanyJapan || "");
      setJobField(student.jobField || "");
      setJobKumiai(student.jobKumiai || "");
      setJobLocation(student.jobLocation || "");
      setJobMcu2Date(student.jobMcu2Date || "");
      setJobPassportDate(student.jobPassportDate || "");
      setJobCoeDate(student.jobCoeDate || "");
      setJobVisaDate(student.jobVisaDate || "");
      setJobDepartureDate(student.jobDepartureDate || "");
      setJobCoeFile(student.jobCoeFile || "");
      setJobFeedback(student.jobFeedback || "");
      setJobRoadmap(student.jobRoadmap || "");
    }
  }, [selectedStudentId]);

  // Grading form states
  const [gradingChapter, setGradingChapter] = useState<number>(1);
  const [gradingStatus, setGradingStatus] = useState<"Belum Belajar" | "Selesai Belajar" | "Telah Dinilai">("Telah Dinilai");
  const [gradingScore, setGradingScore] = useState<number>(85);
  const [gradingNotes, setGradingNotes] = useState<string>("");

  // Student metrics editing states (for Staff/Admin/VVIP)
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [editMath, setEditMath] = useState(80);
  const [editFiveS, setEditFiveS] = useState(85);
  const [editEthics, setEditEthics] = useState(90);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const isStaff = hasStaffOversight(currentUser?.role);

  // Filter students
  const filteredStudents = (systemState?.activeStudents || []).filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClassFilter === "Semua" || student.class === selectedClassFilter;
    return matchesSearch && matchesClass;
  });

  // Find currently active selected student
  const activeStudent = (systemState?.activeStudents || []).find(s => s.id === selectedStudentId);

  // Extract assessments for selected student
  const studentAssessments = (systemState?.chapterAssessments || []).filter(
    c => c.studentId === selectedStudentId
  );

  // Compute stats
  const finishedChaptersCount = studentAssessments.filter(c => c.status === "Telah Dinilai").length;

  const getClassMaxChapters = (className: string) => {
    const classDef = systemState?.customization?.lmsClasses?.find((c: any) => c.name === className);
    const chapters = classDef?.chapters || CHAPTERS_LIST;
    return chapters.length;
  };
  
  const currentClassMaxChapters = activeStudent ? getClassMaxChapters(activeStudent.class) : CHAPTERS_LIST.length;
  const averageJapaneseScore = computeSubjectAverage(systemState?.chapterAssessments, activeStudent, "Bahasa Jepang").average
    ?? (activeStudent?.japaneseScore || 0);

  // Attendance rate
  const computedAttendanceRate = resolveAttendanceScore(activeStudent, systemState?.attendance);

  const mathScore = activeStudent?.mathScore ?? 0;
  const fiveSScore = activeStudent?.fiveSScore ?? 0;
  const ethicsScore = activeStudent?.ethicsScore ?? 0;

  const chartData = [
    { subject: "Mtk Dasar", score: mathScore, fill: "#3b82f6" },
    { subject: "Prinsip 5S", score: fiveSScore, fill: "#10b981" },
    { subject: "Etika & SOP", score: ethicsScore, fill: "#8b5cf6" },
    { subject: "B. Jepang", score: averageJapaneseScore, fill: "#f59e0b" },
    { subject: "Absensi %", score: computedAttendanceRate, fill: "#6366f1" }
  ];

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !activeStudent) return;

    // Construct chapter assessment payload
    const payloadAssessment: Partial<ChapterAssessment> = {
      id: `${selectedStudentId}_ch${gradingChapter}`,
      studentId: selectedStudentId,
      studentName: activeStudent.name,
      chapterNumber: gradingChapter,
      title: `Bab ${gradingChapter}: Pelajaran Standar LPK`,
      status: gradingStatus,
      score: gradingStatus === "Telah Dinilai" ? gradingScore : undefined,
      notes: gradingNotes,
      assessedBy: currentUser?.name || "Instruktur",
      assessedDate: new Date().toISOString().split("T")[0]
    };

    // Save assessment to firestore
    const success = await onUpdateState("chapterAssessments", "upsert", payloadAssessment);
    
    if (success) {
      setSaveSuccessMsg(`Berhasil menyimpan penilaian Bab ${gradingChapter}!`);
      setTimeout(() => setSaveSuccessMsg(""), 3500);
      setGradingNotes("");
    }
  };

  const handleSaveMetrics = async () => {
    if (!selectedStudentId || !activeStudent) return;

    const updatedStudentPayload = {
      ...activeStudent,
      mathScore: editMath,
      fiveSScore: editFiveS,
      ethicsScore: editEthics,
      japaneseScore: averageJapaneseScore,
      attendanceScore: computedAttendanceRate
    };

    const success = await onUpdateState("activeStudents", "edit", updatedStudentPayload);
    if (success) {
      setSaveSuccessMsg("Berhasil memperbarui skor pilar utama siswa!");
      setIsEditingMetrics(false);
      setTimeout(() => setSaveSuccessMsg(""), 3500);
    }
  };

  const handleSaveJobMonitoring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !activeStudent) return;

    setIsSubmittingJobForm(true);
    setJobFormSuccess("");

    const updatedStudentPayload: Partial<ActiveStudent> = {
      ...activeStudent,
      jobTestimonial,
      jobSoMitra,
      jobCompanyJapan,
      jobField,
      jobKumiai,
      jobLocation,
      jobMcu2Date,
      jobPassportDate,
      jobCoeDate,
      jobVisaDate,
      jobDepartureDate,
      jobCoeFile,
      jobFeedback,
      jobRoadmap
    };

    const success = await onUpdateState("activeStudents", "edit", updatedStudentPayload);
    setIsSubmittingJobForm(false);
    if (success) {
      setJobFormSuccess("Berhasil menyimpan data pemantauan pasca-Job!");
      setTimeout(() => setJobFormSuccess(""), 4000);
    } else {
      alert("Gagal menyimpan data pemantauan pasca-Job.");
    }
  };

  const startEditMetrics = () => {
    setEditMath(mathScore);
    setEditFiveS(fiveSScore);
    setEditEthics(ethicsScore);
    setIsEditingMetrics(true);
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="h-16 w-16 bg-violet-50 text-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h2 className="font-sans font-black text-slate-900 text-lg uppercase tracking-wider">Akses Masuk Diperlukan</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
            Silakan masuk menggunakan akun Siswa, Pengajar, atau Admin Anda terlebih dahulu untuk memantau nilai akademik dan kemajuan belajar di LPK.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h2 className="font-sans font-black text-xl uppercase tracking-wider text-indigo-900">
              Progress & Perkembangan Belajarku
            </h2>
          </div>
          <p className="text-xs text-slate-500 leading-normal">
            Sistem Pemantauan Capaian 5 Pilar Utama Kompetensi Magang & Tokutei Ginou LPK Source Course Indonesia.
          </p>
        </div>
        
        {saveSuccessMsg && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2.5 rounded-xl border border-emerald-100 font-bold animate-fade-in flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {saveSuccessMsg}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Student Selector Roster (Only visible to Staff/Admin/VVIP) */}
        {isStaff && (
          <div className="md:col-span-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="font-sans font-black text-xs uppercase tracking-wider text-slate-700">
                Roster Peserta Didik
              </h3>
              <p className="text-[10px] text-slate-400">
                Pilih siswa untuk melihat performa dan memberikan penilaian bab.
              </p>
            </div>

            {/* Filter controls */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {["Semua", ...(systemState.customization?.lmsClasses?.map(c => c.name) || [])].map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg transition cursor-pointer ${
                      selectedClassFilter === cls
                        ? "bg-indigo-900 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Kelas {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Student list */}
            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  return (
                    <button
                      key={`${student.id}-${student.name}`}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsEditingMetrics(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition border flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-purple-50/80 border-purple-200 shadow-2xs"
                          : "bg-white border-slate-150 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                          isSelected ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {student.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-950 truncate">{student.name}</p>
                          <p className="text-[9.5px] text-slate-400 font-mono">
                            {student.class} • {student.status}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition ${isSelected ? "text-purple-600 transform translate-x-0.5" : "text-slate-300"}`} />
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center bg-white border border-dashed rounded-xl text-xs text-slate-400">
                  Tidak ditemukan siswa yang cocok.
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Active Student Performance Metrics Card */}
        <div className={`${isStaff ? "md:col-span-8" : "md:col-span-12"} space-y-6`}>
          
          {activeStudent ? (
            <div className="space-y-6">
              
              {/* 1. Header Detail Card of Selected Student */}
              <div className="bg-gradient-to-br from-indigo-700 to-[#001d3d] text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 blur-md">
                  <TrendingUp className="h-44 w-44" />
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-yellow-400/95 text-indigo-900 flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                    {activeStudent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="bg-white/15 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold font-mono">
                      Kelas {activeStudent.class} • Batch {activeStudent.batch}
                    </span>
                    <h3 className="font-sans font-black text-lg uppercase tracking-wide text-yellow-400 mt-1">
                      {activeStudent.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5 font-medium">
                      <Clock className="h-3.5 w-3.5" /> Status Belajar: <strong>{activeStudent.status}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 font-mono text-center shrink-0 relative z-10 bg-white/5 border border-white/10 p-3 rounded-2xl">
                  <div>
                    <span className="text-[9px] uppercase text-slate-300 block">Jepang</span>
                    <span className="text-base font-black text-yellow-400">{averageJapaneseScore}</span>
                  </div>
                  <div className="border-l border-white/15 pl-4">
                    <span className="text-[9px] uppercase text-slate-300 block">Absen</span>
                    <span className="text-base font-black text-emerald-400">{computedAttendanceRate}%</span>
                  </div>
                  <div className="border-l border-white/15 pl-4">
                    <span className="text-[9px] uppercase text-slate-300 block">Bab Selesai</span>
                    <span className="text-base font-black text-sky-400">{finishedChaptersCount}/{currentClassMaxChapters}</span>
                  </div>
                </div>
              </div>

              {/* 2. Radar-equivalent 5 Pilar Dashboard Chart & List */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* 5 Pilar Radar Chart Box */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      5 Pilar Evaluasi Kompetensi
                    </h4>
                    
                    {isStaff && !isEditingMetrics && (
                      <button
                        onClick={startEditMetrics}
                        className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-1 rounded transition cursor-pointer"
                      >
                        Edit Pilar
                      </button>
                    )}
                  </div>

                  {isEditingMetrics ? (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-2 border">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Matematika Dasar SSW</label>
                        <input
                          type="number"
                          value={editMath}
                          min="0"
                          max="100"
                          onChange={(e) => setEditMath(Number(e.target.value))}
                          className="w-full bg-white border rounded px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-2 border">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Kedisiplinan & 5S</label>
                        <input
                          type="number"
                          value={editFiveS}
                          min="0"
                          max="100"
                          onChange={(e) => setEditFiveS(Number(e.target.value))}
                          className="w-full bg-white border rounded px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-xl space-y-2 border">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Prinsip & Etika Kerja SOP</label>
                        <input
                          type="number"
                          value={editEthics}
                          min="0"
                          max="100"
                          onChange={(e) => setEditEthics(Number(e.target.value))}
                          className="w-full bg-white border rounded px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      
                      <div className="flex gap-1.5 pt-1">
                        <button
                          onClick={handleSaveMetrics}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-lg text-xs transition cursor-pointer"
                        >
                          Simpan Pilar
                        </button>
                        <button
                          onClick={() => setIsEditingMetrics(false)}
                          className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="subject" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                          <Tooltip cursor={{ fill: "rgba(226, 232, 240, 0.4)" }} contentStyle={{ borderRadius: "8px", fontSize: "10px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Chapter Evaluation Form (Sensei/Admin view) or Milestone status */}
                {isStaff ? (
                  <form onSubmit={handleSaveGrade} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div className="border-b pb-2">
                      <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                        <ClipboardList className="h-4 w-4 text-indigo-900" />
                        Form Penilaian Bab LMS
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Pilih Bab (1 - {currentClassMaxChapters})</label>
                        <select
                          value={gradingChapter}
                          onChange={(e) => setGradingChapter(Number(e.target.value))}
                          className="w-full bg-white border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                        >
                          {Array.from({ length: currentClassMaxChapters }, (_, i) => i + 1).map(b => (
                            <option key={b} value={b}>Bab {b}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Status Kelayakan</label>
                        <select
                          value={gradingStatus}
                          onChange={(e) => setGradingStatus(e.target.value as any)}
                          className="w-full bg-white border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                        >
                          <option value="Belum Belajar">Belum Belajar</option>
                          <option value="Selesai Belajar">Selesai Belajar</option>
                          <option value="Telah Dinilai">Telah Dinilai</option>
                        </select>
                      </div>
                    </div>

                    {gradingStatus === "Telah Dinilai" && (
                      <div className="space-y-1 text-xs">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Nilai Kuis (0 - 100)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={gradingScore}
                          onChange={(e) => setGradingScore(Number(e.target.value))}
                          className="w-full bg-white border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1 text-xs">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Catatan Catatan Instruktur</label>
                      <input
                        type="text"
                        placeholder="e.g., Bagus sekali, kaiwa sangat lancar!"
                        value={gradingNotes}
                        onChange={(e) => setGradingNotes(e.target.value)}
                        className="w-full bg-white border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-900 hover:bg-indigo-700 text-white font-extrabold uppercase text-[10px] py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm mt-1"
                    >
                      <Save className="h-3.5 w-3.5" /> Simpan Nilai Akademik
                    </button>
                  </form>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
                    <div className="border-b pb-2">
                      <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-amber-500" />
                        Milestone Kompetensi Siswa
                      </h4>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      <div className="flex gap-2.5 items-start">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white ${computedAttendanceRate >= 80 ? "bg-emerald-500" : "bg-slate-200"}`}>
                          ✓
                        </div>
                        <p className="text-slate-600">
                          <strong>Kepatuhan Absensi:</strong> {computedAttendanceRate}% (Minimum 80% disyaratkan oleh Kumiai jepang).
                        </p>
                      </div>

                      <div className="flex gap-2.5 items-start">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white ${averageJapaneseScore >= 75 ? "bg-emerald-500" : "bg-slate-200"}`}>
                          ✓
                        </div>
                        <p className="text-slate-600">
                          <strong>Kelulusan JLPT / JFT-Basic:</strong> Rata-rata kuis bahasa Jepang Anda berada di angka <strong>{averageJapaneseScore}</strong> (Nilai lulus ≥ 75).
                        </p>
                      </div>

                      <div className="flex gap-2.5 items-start">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white ${finishedChaptersCount >= 15 ? "bg-emerald-500" : "bg-slate-200"}`}>
                          ✓
                        </div>
                        <p className="text-slate-600">
                          <strong>Batas Matching Job:</strong> Menyelesaikan 15 Bab (Status saat ini: {finishedChaptersCount}/{currentClassMaxChapters} Bab).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Pemantauan Aktivitas Pasca-JOB (Diklat SO) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
                <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-sans font-black text-sm uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" />
                      Laporan & Pemantauan Aktivitas Pasca-JOB (Diklat SO)
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Khusus bagi siswa yang sudah dinyatakan lulus wawancara (Mendapatkan JOB) untuk memantau aktivitas & bimbingan diklat di LPK SO.
                    </p>
                  </div>
                  {jobFormSuccess && (
                    <div className="bg-emerald-50 text-emerald-800 text-[10px] px-3 py-1.5 rounded-xl border border-emerald-100 font-bold flex items-center gap-1 shrink-0 animate-fade-in shadow-2xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      {jobFormSuccess}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSaveJobMonitoring} className="space-y-6">
                  {/* GROUP 1: Informasi Pekerjaan & Perusahaan */}
                  <div className="space-y-4">
                    <h5 className="font-extrabold text-[11px] text-indigo-600 uppercase tracking-widest border-l-2 border-indigo-600 pl-2">
                      1. Informasi Pekerjaan & Perusahaan (JOB)
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Nama SO Mitra SCI */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">2. Nama SO Mitra SCI</label>
                        <input
                          type="text"
                          value={jobSoMitra}
                          onChange={(e) => setJobSoMitra(e.target.value)}
                          placeholder="Masukkan nama SO Mitra SCI"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>

                      {/* Nama Perusahaan Jepang */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">3. Nama Perusahaan Jepang</label>
                        <input
                          type="text"
                          value={jobCompanyJapan}
                          onChange={(e) => setJobCompanyJapan(e.target.value)}
                          placeholder="Masukkan nama perusahaan di Jepang"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>

                      {/* Nama Bidang Job Lulus */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">4. Nama Bidang Job Lulus</label>
                        <input
                          type="text"
                          value={jobField}
                          onChange={(e) => setJobField(e.target.value)}
                          placeholder="Contoh: Pengolahan Makanan, Pertanian"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>

                      {/* Nama Kumiai */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">5. Nama Kumiai</label>
                        <input
                          type="text"
                          value={jobKumiai}
                          onChange={(e) => setJobKumiai(e.target.value)}
                          placeholder="Masukkan nama Kumiai / Pengawas"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>

                      {/* Lokasi Perusahaan */}
                      <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">6. Lokasi Perusahaan Jepang</label>
                        <input
                          type="text"
                          value={jobLocation}
                          onChange={(e) => setJobLocation(e.target.value)}
                          placeholder="Contoh: Nagoya, Prefektur Aichi, Jepang"
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Testimoni Siswa */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">1. Testimoni Siswa</label>
                      <textarea
                        value={jobTestimonial}
                        onChange={(e) => setJobTestimonial(e.target.value)}
                        placeholder="Tuliskan testimoni Anda selama mengikuti pelatihan di LPK SO hingga berhasil lulus wawancara kerja Jepang..."
                        rows={3}
                        className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* GROUP 2: Timeline & Dokumen Imigrasi */}
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <h5 className="font-extrabold text-[11px] text-indigo-900 uppercase tracking-widest border-l-2 border-indigo-900 pl-2">
                      2. Timeline & Dokumen Imigrasi
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {/* Tanggal MCU Ke-2 */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">7. Tgl MCU Ke-2</label>
                        <input
                          type="date"
                          value={jobMcu2Date}
                          onChange={(e) => setJobMcu2Date(e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs transition focus:outline-none font-mono"
                        />
                      </div>

                      {/* Tanggal Paspor */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">8. Tgl Paspor</label>
                        <input
                          type="date"
                          value={jobPassportDate}
                          onChange={(e) => setJobPassportDate(e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs transition focus:outline-none font-mono"
                        />
                      </div>

                      {/* Tanggal COE */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">9. Tgl COE</label>
                        <input
                          type="date"
                          value={jobCoeDate}
                          onChange={(e) => setJobCoeDate(e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs transition focus:outline-none font-mono"
                        />
                      </div>

                      {/* Tanggal Visa */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">10. Tgl Visa</label>
                        <input
                          type="date"
                          value={jobVisaDate}
                          onChange={(e) => setJobVisaDate(e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs transition focus:outline-none font-mono"
                        />
                      </div>

                      {/* Tanggal Keberangkatan */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">11. Tgl Berangkat</label>
                        <input
                          type="date"
                          value={jobDepartureDate}
                          onChange={(e) => setJobDepartureDate(e.target.value)}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-xs transition focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Upload COE dari SO */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                          12. UPLOAD COE DARI SO
                        </span>
                        <p className="text-[10.5px] text-slate-500">
                          Unggah scan dokumen Certificate of Eligibility (COE) resmi yang dikeluarkan oleh pihak imigrasi Jepang/SO Anda.
                        </p>
                        {jobCoeFile ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-600 font-mono font-bold pt-1">
                            <span>✓ COE sudah terunggah</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 block pt-1 italic">Belum ada dokumen COE diunggah</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-800 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                          <Upload className="h-4 w-4 text-indigo-600" />
                          <span>{jobCoeFile ? "Ganti File COE" : "Unggah File COE"}</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const url = await uploadFileToFirebase(file, "coe_documents");
                                setJobCoeFile(url);
                                setJobFormSuccess("Dokumen COE berhasil diunggah! Tekan tombol simpan di bawah untuk menyimpan perubahan.");
                                setTimeout(() => setJobFormSuccess(""), 4500);
                              } catch (err) {
                                console.error(err);
                                alert("Gagal mengunggah file.");
                              }
                            }}
                          />
                        </label>

                        {jobCoeFile && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setViewingDoc({
                                  title: "Dokumen COE Resmi",
                                  url: jobCoeFile
                                });
                              }}
                              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition cursor-pointer"
                              title="Lihat COE"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setJobCoeFile("");
                                setJobFormSuccess("File COE dilepas. Harap simpan perubahan.");
                                setTimeout(() => setJobFormSuccess(""), 4000);
                              }}
                              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-150 transition cursor-pointer"
                              title="Hapus COE"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: Evaluasi & Perencanaan */}
                  <div className="space-y-4 border-t border-slate-100 pt-5">
                    <h5 className="font-extrabold text-[11px] text-emerald-600 uppercase tracking-widest border-l-2 border-emerald-600 pl-2">
                      3. Evaluasi & Perencanaan (Diklat SO)
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Kritik dan Saran Pembelajaran */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          13. Kritik dan Saran Mengenai Sistem Pembelajaran
                        </label>
                        <textarea
                          value={jobFeedback}
                          onChange={(e) => setJobFeedback(e.target.value)}
                          placeholder="Berikan kritik, saran, atau masukan objektif Anda mengenai sistem pembelajaran bahasa Jepang, kedisiplinan, maupun pilar kompetensi lainnya di LPK SO..."
                          rows={3}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>

                      {/* Roadmap Siswa */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          14. Roadmap Siswa (Rencana Persiapan Ke Depan)
                        </label>
                        <textarea
                          value={jobRoadmap}
                          onChange={(e) => setJobRoadmap(e.target.value)}
                          placeholder="Contoh: Menyelesaikan hafalan bab 25, bimbingan berkas imigrasi, bimbingan mental fisik pra-keberangkatan..."
                          rows={3}
                          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs transition focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="border-t border-slate-100 pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingJobForm}
                      className="bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase px-6 py-2.5 rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isSubmittingJobForm ? (
                        <>
                          <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Simpan Laporan Aktivitas Pasca-Job</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 3. Detailed 25-Chapter Grid list of LMS Grades */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
                <div className="border-b pb-2 flex justify-between items-center">
                  <h4 className="font-sans font-black text-xs uppercase tracking-wider text-slate-850 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    Buku Rekap Penilaian Bab (1 - 25)
                  </h4>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                    Kurikulum Minna no Nihongo
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 25 }, (_, i) => {
                    const chNumber = i + 1;
                    const assessment = studentAssessments.find(a => a.chapterNumber === chNumber);
                    
                    let bgStyle = "bg-slate-50 border-slate-150";
                    let labelStyle = "bg-slate-200 text-slate-600";
                    let titleText = `Belum Belajar`;
                    let scoreText = "";

                    if (assessment) {
                      if (assessment.status === "Selesai Belajar") {
                        bgStyle = "bg-yellow-50/50 border-yellow-200";
                        labelStyle = "bg-yellow-400 text-slate-900";
                        titleText = "Selesai Belajar";
                      } else if (assessment.status === "Telah Dinilai") {
                        bgStyle = "bg-emerald-50/40 border-emerald-200";
                        labelStyle = "bg-emerald-500 text-white";
                        titleText = "Telah Dinilai";
                        scoreText = `${assessment.score ?? 0} P`;
                      }
                    }

                    return (
                      <div key={chNumber} className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition ${bgStyle}`}>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-slate-950">Bab {chNumber}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{titleText}</p>
                          {assessment?.notes && (
                            <p className="text-[8.5px] text-slate-500 italic truncate mt-0.5">"{assessment.notes}"</p>
                          )}
                        </div>
                        {scoreText ? (
                          <span className="font-mono text-[11px] font-black text-indigo-900 bg-white px-2 py-1 rounded-lg border shadow-3xs">
                            {scoreText}
                          </span>
                        ) : (
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md font-mono tracking-wider font-bold uppercase ${labelStyle}`}>
                            {assessment ? "STUDY" : "LOCK"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-dashed rounded-3xl text-xs text-slate-400">
              Pilih salah satu siswa di daftar sebelah kiri untuk memantau nilai akademik dan perkembangan belajar.
            </div>
          )}

        </div>

      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="font-bold text-slate-800 text-sm">
                {viewingDoc.title}
              </h4>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 bg-slate-900 flex flex-col items-center justify-center min-h-[50vh] max-h-[70vh] overflow-y-auto gap-4">
              {!viewingDoc.url || (!viewingDoc.url.startsWith('http') && !viewingDoc.url.startsWith('data:')) ? (
                <div className="text-center p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-sm">
                  <div className="text-amber-500 text-3xl mb-2">⚠️</div>
                  <p className="text-sm font-bold text-slate-200">Berkas tidak tersedia</p>
                  <p className="text-xs text-slate-400 mt-1">Dokumen belum diunggah.</p>
                </div>
              ) : viewingDoc.url.includes("application/pdf") || viewingDoc.url.toLowerCase().includes(".pdf") ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center max-w-md w-full">
                    <p className="text-xs text-slate-300 font-bold mb-3">
                      Dokumen ini adalah format PDF.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <a
                        href={viewingDoc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-900 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Buka PDF di Tab Baru</span>
                      </a>
                    </div>
                  </div>
                  <object
                    data={getEmbeddablePdfUrl(viewingDoc.url)}
                    type="application/pdf"
                    className="w-full h-[45vh] bg-white rounded-lg shadow-md border border-slate-200"
                  >
                    <iframe
                      src={getEmbeddablePdfUrl(viewingDoc.url)}
                      title="PDF Viewer"
                      className="w-full h-full bg-white rounded-lg border-0"
                    />
                  </object>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="flex flex-wrap gap-3 justify-center items-center w-full">
                    <a
                      href={viewingDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-900 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Buka Gambar di Tab Baru</span>
                    </a>
                  </div>
                  <div className="w-full overflow-auto flex items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800 max-h-[50vh]">
                    <img
                      src={viewingDoc.url}
                      alt="Dokumen"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[40vh] object-contain rounded-lg shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
