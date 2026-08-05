import React, { useState } from "react";
import { Users, BookOpen, Award, CheckCircle2, ChevronRight, BarChart, FileText, Search } from "lucide-react";
import { SystemState, UserAccount } from "../types";
import { CHAPTERS_LIST, MATH_CHAPTERS_LIST } from "../chapters";

interface SenseiDashboardViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
}

export default function SenseiDashboardView({ currentUser, systemState }: SenseiDashboardViewProps) {
  const [selectedSubject, setSelectedSubject] = useState("Bahasa Jepang");
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Determine which class(es) to show based on user role
  const isSensei = currentUser?.role === "Pengajar";
  const assignedClass = (currentUser?.assignedClass || "").trim();
  
  const studentsList = systemState.activeStudents || [];
  
  const myStudents = React.useMemo(() => {
    let list = studentsList;
    if (isSensei) {
      if (assignedClass && assignedClass.toLowerCase() !== "semua" && assignedClass.toLowerCase() !== "semua kelas") {
        list = list.filter(s => (s.class || "").trim().toLowerCase() === assignedClass.toLowerCase());
      }
    }
    // Filter out alumni
    list = list.filter(s => !["Lulus", "Di Jepang"].includes(s.status) && s.statusPendaftaran !== "Alumni");
    return list;
  }, [studentsList, isSensei, assignedClass]);

  const uniqueClasses = React.useMemo(() => {
    const classesSet = new Set<string>();
    (systemState.activeStudents || []).forEach((s: any) => {
      if (s.class) {
        classesSet.add(s.class.trim());
      }
    });
    return Array.from(classesSet).sort();
  }, [systemState.activeStudents]);

  const filteredStudents = React.useMemo(() => {
    let list = myStudents;
    if (classFilter !== "Semua") {
      list = list.filter(s => (s.class || "").trim().toLowerCase() === classFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => (s.name || "").toLowerCase().includes(q) || (s.id || "").toLowerCase().includes(q));
    }
    return list;
  }, [myStudents, classFilter, searchQuery]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [classFilter, searchQuery, selectedSubject]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = React.useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredStudents, currentPage]);

  const assessments = systemState.chapterAssessments || [];
  
  const currentSubjectChapters = selectedSubject === "SSW" ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Award className="h-32 w-32" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full border border-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <Users className="h-4 w-4" />
            Sensei Dashboard
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight">Data Progress & Nilai Siswa</h1>
          <p className="text-blue-100 leading-relaxed font-medium">
            {isSensei 
              ? (assignedClass ? `Memantau progress belajar dan nilai per bab untuk siswa kelas ${assignedClass}.` : "Anda belum diplot ke kelas manapun. Anda dapat melihat progress semua siswa sementara.")
              : "Memantau progress belajar dan nilai siswa dari semua kelas."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-800 font-display">Data Siswa & Rekap Nilai</h2>
            <p className="text-xs text-slate-400">Total: {filteredStudents.length} siswa aktif ditemukan</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition-colors text-slate-800 placeholder-slate-400 shadow-3xs"
              />
            </div>

            {/* Class Filter Dropdown */}
            {(!isSensei || !assignedClass || assignedClass.toLowerCase() === "semua" || assignedClass.toLowerCase() === "semua kelas") ? (
              <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 outline-none cursor-pointer w-full sm:w-40 transition-colors shadow-3xs"
                >
                  <option value="Semua">🏫 Semua Kelas</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>Kelas {cls}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 whitespace-nowrap w-full sm:w-auto text-center">
                🏫 Kelas: {assignedClass}
              </div>
            )}

            {/* Subject Selector */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 outline-none cursor-pointer w-full sm:w-44 transition-colors shadow-3xs"
            >
              <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
              <option value="SSW">📐 Matematika (SSW)</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 whitespace-nowrap border-r border-slate-100">Nama Siswa</th>
                <th className="p-4 whitespace-nowrap border-r border-slate-100 text-center">Progress</th>
                <th className="p-4 whitespace-nowrap border-r border-slate-100 text-center">Rata-rata</th>
                <th className="p-4 whitespace-nowrap">Detail Nilai per Bab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center gap-3 py-6">
                      <Users className="h-10 w-10 text-slate-300 animate-pulse" />
                      <p className="text-xs text-slate-400">Tidak ada data siswa aktif yang cocok dengan kriteria filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map(student => {
                  const studentEvals = assessments.filter(a => a.studentId === student.id && (a.subject || "Bahasa Jepang") === selectedSubject && a.status === "Telah Dinilai");
                  const totalBab = currentSubjectChapters.length;
                  const completedBabCount = studentEvals.length;
                  const validScores = studentEvals.filter(a => a.score !== undefined).map(a => a.score as number);
                  const averageScore = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-r border-slate-100">
                        <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{student.class ? `Kelas ${student.class}` : "Belum ada kelas"}</div>
                      </td>
                      <td className="p-4 text-center border-r border-slate-100 align-middle">
                        <div className="flex flex-col items-center justify-center gap-1.5 h-full">
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 leading-none">
                            {completedBabCount} / {totalBab}
                          </span>
                          <div className="w-24 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (completedBabCount/totalBab)*100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center border-r border-slate-100 align-middle">
                        <div className="flex items-center justify-center h-full">
                          {averageScore > 0 ? (
                            <span className={`font-black px-3 py-1.5 rounded-lg border text-sm ${
                              averageScore >= 80 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                              averageScore >= 60 ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                              {averageScore}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">-</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                          {studentEvals.slice().sort((a,b)=>a.chapterNumber - b.chapterNumber).map(ev => (
                            <div key={ev.id} className="flex flex-col items-center bg-white border border-slate-200 rounded-md p-1.5 min-w-[36px] shadow-3xs" title={`Bab ${ev.chapterNumber}: ${ev.score}`}>
                              <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">B{ev.chapterNumber}</span>
                              <span className="text-xs font-bold text-slate-800 leading-none">{ev.score || "-"}</span>
                            </div>
                          ))}
                          {studentEvals.length === 0 && (
                            <span className="text-slate-400 text-[10px] italic py-1">Belum ada nilai yang dimasukkan.</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 p-4 gap-4 bg-slate-50/50">
            <span className="text-xs font-bold text-slate-500">
              Menampilkan {Math.min(filteredStudents.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredStudents.length, currentPage * itemsPerPage)} dari {filteredStudents.length} siswa
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-indigo-600 hover:border-indigo-300 cursor-pointer"
              >
                Sebelumnya
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === page
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-indigo-600 hover:border-indigo-300 cursor-pointer"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
