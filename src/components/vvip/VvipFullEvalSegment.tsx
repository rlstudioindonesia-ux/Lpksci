import React from "react";
import { Activity, Award, BookOpen, Calculator, CheckCircle, ChevronRight, Clock, DollarSign, Edit, FileText, Filter, Globe, GraduationCap, History, RefreshCw, RotateCcw, Search, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { createSvgAvatar, getSafePhotoUrl } from "../../lib/storageHelper";
import { calculateAge } from "../../lib/dateUtils";
import { computeAttendanceRate } from "../../lib/attendanceMetrics";
import { isGradedAssessment } from "../../lib/scoreAveraging";
import { hasStaffOversight } from "../../lib/permissions";
import { countWorkingDaysInPayrollPeriod, formatPayrollPeriodLabel, generateRecentPayrollPeriods, isTimestampInPayrollPeriod } from "../../lib/staffAttendancePeriod";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface VvipFullEvalSegmentProps {
  activeStudents: any;
  classFilter: any;
  classTabs: any;
  filterMonth: any;
  filterStatus: any;
  filterYear: any;
  getClassMaxBab: any;
  hrAttendancePeriod: any;
  isReadOnly: any;
  lmsClassFilter: any;
  monitorTab: any;
  officeEnforce: any;
  officeLat: any;
  officeLon: any;
  officeRadius: any;
  onNavigateToAdmin: any;
  onUpdateState: any;
  selectedClassTab: any;
  setClassFilter: any;
  setCurrentViewMode: any;
  setFilterMonth: any;
  setFilterStatus: any;
  setFilterYear: any;
  setHrAttendancePeriod: any;
  setLmsClassFilter: any;
  setMonitorTab: any;
  setOfficeLat: any;
  setOfficeLon: any;
  setOfficeRadius: any;
  setSelectedClassTab: any;
  setSelectedHrAttendanceStaff: any;
  setSelectedSenseiDetail: any;
  setSelectedStudentDetail: any;
  setSiswaPage: any;
  setSiswaTab: any;
  setStatCardMode: any;
  setStudentListMode: any;
  setStudentSearch: any;
  siswaPage: any;
  siswaTab: any;
  startVvipEditReg: any;
  statCardMode: any;
  studentListMode: any;
  studentSearch: any;
  systemState: any;
}

export default function VvipFullEvalSegment({ activeStudents, classFilter, classTabs, filterMonth, filterStatus, filterYear, getClassMaxBab, hrAttendancePeriod, isReadOnly, lmsClassFilter, monitorTab, officeEnforce, officeLat, officeLon, officeRadius, onNavigateToAdmin, onUpdateState, selectedClassTab, setClassFilter, setCurrentViewMode, setFilterMonth, setFilterStatus, setFilterYear, setHrAttendancePeriod, setLmsClassFilter, setMonitorTab, setOfficeLat, setOfficeLon, setOfficeRadius, setSelectedClassTab, setSelectedHrAttendanceStaff, setSelectedSenseiDetail, setSelectedStudentDetail, setSiswaPage, setSiswaTab, setStatCardMode, setStudentListMode, setStudentSearch, siswaPage, siswaTab, startVvipEditReg, statCardMode, studentListMode, studentSearch, systemState }: VvipFullEvalSegmentProps) {
  return (
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
                  <span>Pantau Sensei ({systemState.users?.filter(u => hasStaffOversight(u.role)).length || 0})</span>
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
    
                                const { rate: rateAtt } = computeAttendanceRate(student, systemState.attendance);

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
                                    const { rate } = computeAttendanceRate(student, systemState.attendance);

                                    const studentAsss = (systemState.chapterAssessments || []).filter((c) => c.studentId === student.id);
                                    const gradedAsss = studentAsss.filter(isGradedAssessment);
                                    const lastBab = gradedAsss.length > 0 ? Math.max(...gradedAsss.map((c) => c.chapterNumber || 0)) : 0;

                                    const avgScoreInRange = (min: number, max: number) => {
                                      const inRange = gradedAsss.filter((c) => (c.chapterNumber || 0) >= min && (c.chapterNumber || 0) <= max);
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
                                                e.currentTarget.src = createSvgAvatar(student.name || 'Siswa', '#4338ca');
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
                                const { rate } = computeAttendanceRate(student, systemState.attendance);

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
                                const rate = computeAttendanceRate(s, systemState.attendance).rate ?? 0;
                                
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
                    {(systemState.users || []).filter(u => hasStaffOversight(u.role)).map(teacher => {
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
              const senseiCount = (systemState.users || []).filter(u => hasStaffOversight(u.role)).length || 0;
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
                                const classSensei = classUsers.filter(u => hasStaffOversight(u.role));
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
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Kehadiran (Absensi) Pengajar & Staf</h4>
                      <span className="text-[9px] text-slate-400 font-medium hidden sm:block">Klik baris untuk lihat detail log · Diurutkan dari yang paling rajin</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Periode:</span>
                      <select
                        value={hrAttendancePeriod}
                        onChange={(e) => setHrAttendancePeriod(e.target.value)}
                        className="text-[11px] font-bold p-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-hidden cursor-pointer"
                      >
                        {generateRecentPayrollPeriods(12).map((periodKey) => (
                          <option key={periodKey} value={periodKey}>{formatPayrollPeriodLabel(periodKey)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
                    <table className="w-full text-left text-xs min-w-[660px]">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wide">
                        <tr>
                          <th className="p-3 rounded-l-xl">Nama & Role</th>
                          <th className="p-3 text-center">Hadir</th>
                          <th className="p-3 text-center">Tidak Hadir</th>
                          <th className="p-3 text-center">Ketepatan Waktu</th>
                          <th className="p-3 rounded-r-xl text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(() => {
                          const workingDays = countWorkingDaysInPayrollPeriod(hrAttendancePeriod);
                          return (systemState.users || []).filter(u => hasStaffOversight(u.role)).map(u => {
                          const staffLogs = (systemState.logs || []).filter(l => l.type === "PRESENSI_PENGAJAR" && (l.user === u.name || l.user === u.username) && isTimestampInPayrollPeriod(l.timestamp || l.time, hrAttendancePeriod));
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
                          // "Hadir" counts distinct check-ins (MASUK), not every log row -
                          // each real work day writes both a MASUK and a PULANG entry, so
                          // counting staffLogs.length would double every attended day.
                          const hadir = checkIns;
                          const tidakHadir = Math.max(0, workingDays - hadir);
                          const punctuality = checkIns > 0 ? Math.round((onTime / checkIns) * 100) : null;
                          return { u, hadir, tidakHadir, punctuality };
                          })
                          .sort((a, b) => b.hadir - a.hadir)
                          .map(({ u, hadir, tidakHadir, punctuality }) => {
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
                                <span className={`font-black ${tidakHadir > 0 ? "text-rose-600" : "text-slate-400"}`}>{tidakHadir}</span>
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
                          });
                        })()}
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
                        {(systemState.users || []).filter(u => hasStaffOversight(u.role)).map(u => ( 
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
  );
}
