import React from "react";
import { Award, Calculator, ChevronLeft, ChevronRight, Edit, Eye, FileText, Filter, History, RefreshCw, RotateCcw, Search, Sparkles, Trash2, Users, X } from "lucide-react";
import { ConfirmButton } from "../ConfirmButton";
import { createSvgAvatar, getSafePhotoUrl } from "../../lib/storageHelper";
import { JAPAN_PREFECTURES } from "../../types";

interface AdminSiswaSegmentProps {
  checkSyncStatus: any;
  filterClass: any;
  filterMonth: any;
  filterStatus: any;
  filterYear: any;
  filteredSiswaItems: any;
  handleReject: any;
  isAlumniClass: any;
  isStudentRoleOnly: any;
  onUpdateState: any;
  paginatedSiswaItems: any;
  setFilterClass: any;
  setFilterMonth: any;
  setFilterStatus: any;
  setFilterYear: any;
  setSiswaPage: any;
  setSiswaSearch: any;
  setSiswaTab: any;
  setStatCardMode: any;
  setVerifyingDocsStudent: any;
  setViewingCvStudentId: any;
  siswaItemsPerPage: any;
  siswaPage: any;
  siswaSearch: any;
  siswaTab: any;
  siswaTotalPages: any;
  startAdminEditReg: any;
  statCardMode: any;
  systemState: any;
}

export default function AdminSiswaSegment({ checkSyncStatus, filterClass, filterMonth, filterStatus, filterYear, filteredSiswaItems, handleReject, isAlumniClass, isStudentRoleOnly, onUpdateState, paginatedSiswaItems, setFilterClass, setFilterMonth, setFilterStatus, setFilterYear, setSiswaPage, setSiswaSearch, setSiswaTab, setStatCardMode, setVerifyingDocsStudent, setViewingCvStudentId, siswaItemsPerPage, siswaPage, siswaSearch, siswaTab, siswaTotalPages, startAdminEditReg, statCardMode, systemState }: AdminSiswaSegmentProps) {
  return (
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
                                        e.currentTarget.src = createSvgAvatar(s.name || 'Siswa');
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
                                      placeholder="Catatan bebas (isi Mitra SO/Job1/Bulan Lulus lewat tombol Edit)"
                                      defaultValue={s.keterangan || ""}
                                      onBlur={async (e) => {
                                        if (e.target.value !== (s.keterangan || "")) {
                                          await onUpdateState(
                                            "activeStudents",
                                            "update_status",
                                            {
                                              id: s.id,
                                              keterangan: e.target.value,
                                            },
                                          );
                                        }
                                      }}
                                      title="Catatan bebas. Untuk Mitra SO/TSK, Job 1, dan Bulan Lulus gunakan tombol Edit (Edit Data Lengkap Siswa)."
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
                                    e.currentTarget.src = createSvgAvatar(s.name || 'Siswa');
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
                                placeholder="Catatan bebas (isi Mitra SO/Job1/Bulan Lulus lewat tombol Edit)"
                                defaultValue={s.keterangan || ""}
                                onBlur={async (e) => {
                                  if (e.target.value !== (s.keterangan || "")) {
                                    await onUpdateState(
                                      "activeStudents",
                                      "update_status",
                                      {
                                        id: s.id,
                                        keterangan: e.target.value,
                                      },
                                    );
                                  }
                                }}
                                title="Catatan bebas. Untuk Mitra SO/TSK, Job 1, dan Bulan Lulus gunakan tombol Edit (Edit Data Lengkap Siswa)."
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
  );
}
