/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { uploadFileToFirebase, downloadFile, getEmbeddablePdfUrl } from "../lib/storageHelper";
import { ConfirmForm } from "./ConfirmForm";
import { Play, BookOpen, Calendar, HelpCircle, GraduationCap, CheckCircle, Award, 
  AlertCircle, ChevronRight, Check, X, RefreshCw, Clock, Calculator,
  Plus, Trash2, Edit3, Video, FileText, Save, Download, Info, MessageSquare, User, Users, Upload, Eye, ExternalLink,
  Percent, Hash, Brain, Scale, Volume2, Lock, Unlock, ChevronDown, ChevronUp, RotateCcw
, PanelLeftClose, Search, MapPin, Camera, SlidersHorizontal, Bell, ArrowLeft, Star } from "lucide-react";
import { AttendanceRecord, ActiveStudent, UserAccount, LMSLesson, ChapterAssessment, JobOrder } from "../types";
import { CHAPTERS_LIST, MATH_CHAPTERS_LIST } from "../chapters";

export function StudentAttendanceManager({
  activeStudents = [],
  allClasses = [],
  attendanceRecords = [],
  onAddAttendance,
  onUpdateState,
  defaultBabNumber = 1,
  defaultSubject = "Bahasa Jepang",
  defaultClass = "",
  onViewChapters
}: {
  activeStudents: any[];
  allClasses: any[];
  attendanceRecords: any[];
  onAddAttendance: (payload: any) => Promise<boolean>;
  onUpdateState?: (dataType: string, action: string, payload: any) => Promise<boolean>;
  defaultBabNumber?: number;
  defaultSubject?: string;
  defaultClass?: string;
  onViewChapters?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [kegiatan, setKegiatan] = React.useState("");
  const [date, setDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = React.useState("08:30");
  const [endTime, setEndTime] = React.useState("11:00");
  const [selectedClass, setSelectedClass] = React.useState(defaultClass || "");
  const [selectedBab, setSelectedBab] = React.useState(defaultBabNumber);
  const [selectedSubject, setSelectedSubject] = React.useState(defaultSubject);
  const [studentStatuses, setStudentStatuses] = React.useState<Record<string, string>>({});
  const [studentNotes, setStudentNotes] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"input" | "history">("input");
  const [historySearch, setHistorySearch] = React.useState("");
  const [editingRecord, setEditingRecord] = React.useState<any>(null);
  const [expandedSessions, setExpandedSessions] = React.useState<string[]>([]);
  const [viewingAttendancePhoto, setViewingAttendancePhoto] = React.useState<string | null>(null);
  
  // Group records by session
  const sessionGroups = React.useMemo(() => {
    // Map student IDs to their classes
    const studentClassMap = new Map<string, string>();
    activeStudents.forEach(s => {
      studentClassMap.set(s.id, (s.class || "").toLowerCase().trim());
    });

    const groups = new Map<string, any>();
    
    const filteredRecords = attendanceRecords.filter((r: any) => {
      // If a class is selected, filter by that class
      if (selectedClass) {
        const rClass = studentClassMap.get(r.studentId) || "";
        if (rClass !== selectedClass.toLowerCase().trim()) return false;
      }
      
      return (
        (r.studentName || "").toLowerCase().includes(historySearch.toLowerCase()) ||
        (r.subject || "").toLowerCase().includes(historySearch.toLowerCase()) ||
        (r.notes || "").toLowerCase().includes(historySearch.toLowerCase())
      );
    });
    
    filteredRecords.forEach((r: any) => {
      // Add class to the group key if we have it, to distinguish identical sessions across different classes
      const rClass = studentClassMap.get(r.studentId) || "Unknown Class";
      const key = `${r.date}|${r.time || '-' }|${r.subject}|${rClass}`;
      if (!groups.has(key)) {
        groups.set(key, { records: [], className: rClass });
      }
      groups.get(key)!.records.push(r);
    });
    
    return Array.from(groups.entries())
      .map(([key, data]) => ({ key, records: data.records, className: data.className }))
      .sort((a, b) => new Date(b.records[0].date).getTime() - new Date(a.records[0].date).getTime());
  }, [attendanceRecords, historySearch, selectedClass, activeStudents]);

  React.useEffect(() => {
    if (defaultClass) {
      setSelectedClass(defaultClass);
    }
  }, [defaultClass]);

  React.useEffect(() => {
    if (defaultBabNumber) {
      setSelectedBab(defaultBabNumber);
    }
  }, [defaultBabNumber]);

  React.useEffect(() => {
    if (defaultSubject) {
      setSelectedSubject(defaultSubject);
    }
  }, [defaultSubject]);

  const studentsInClass = React.useMemo(() => {
    if (!selectedClass) return [];
    return activeStudents.filter(
      (s: any) => (s.class || "").toLowerCase().trim() === selectedClass.toLowerCase().trim()
    );
  }, [activeStudents, selectedClass]);

  React.useEffect(() => {
    const initialStatuses: Record<string, string> = { ...studentStatuses };
    let changed = false;
    studentsInClass.forEach((s: any) => {
      if (!initialStatuses[s.id]) {
        initialStatuses[s.id] = "Hadir";
        changed = true;
      }
    });
    if (changed) {
      setStudentStatuses(initialStatuses);
    }
  }, [studentsInClass]);

  const currentCounts = React.useMemo(() => {
    let hadir = 0, sakit = 0, izin = 0, alpa = 0;
    studentsInClass.forEach((s: any) => {
      const st = studentStatuses[s.id] || "Hadir";
      if (st === "Hadir") hadir++;
      else if (st === "Sakit") sakit++;
      else if (st === "Izin") izin++;
      else if (st === "Alpa" || st === "Absen") alpa++;
    });
    return { hadir, sakit, izin, alpa, total: studentsInClass.length };
  }, [studentsInClass, studentStatuses]);

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentsInClass.length === 0) {
      alert("Tidak ada siswa di kelas ini untuk diabsen!");
      return;
    }
    setIsSubmitting(true);
    setSuccessMsg("");

    let successCount = 0;
    try {
      for (const student of studentsInClass) {
        const statusVal = studentStatuses[student.id] || "Hadir";
        const customNote = studentNotes[student.id] || "";
        const finalNotes = kegiatan 
          ? `Kegiatan: ${kegiatan}${customNote ? ` | Catatan: ${customNote}` : ""}`
          : customNote || "Mengikuti sesi kelas";

        const payload = {
          studentId: student.id,
          studentName: student.name,
          status: statusVal,
          subject: `Bab ${selectedBab} - ${selectedSubject}`,
          date,
          time: `${startTime} - ${endTime}`,
          notes: finalNotes,
          hasPermission: statusVal === "Izin" || statusVal === "Sakit"
        };
        const ok = await onAddAttendance(payload);
        if (ok) successCount++;
      }
      
      setSuccessMsg(`Absensi kelas ${selectedClass} Bab ${selectedBab} berhasil disimpan untuk ${successCount} siswa!`);
      setKegiatan("");
      setStudentNotes({});
      setTimeout(() => setSuccessMsg(""), 6000);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menyimpan absensi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs mt-3 animate-fade-in">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 bg-gradient-to-r from-indigo-50/60 to-slate-50/40 hover:from-indigo-50 hover:to-slate-100 transition flex items-center justify-between text-left cursor-pointer border-l-4 border-indigo-600"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100/85 text-indigo-700 rounded-2xl shadow-3xs">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h5 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Presensi Kelas oleh Sensei</h5>
              <span className="bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-lg tracking-wider shadow-3xs">
                Akses Sensei
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Input absensi harian, topik kegiatan, jam kelas, dan status kehadiran siswa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {selectedClass && (
            <div className="hidden sm:flex gap-1.5 text-[9px] font-bold">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">Kelas: {selectedClass}</span>
              <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-150">Hadir: {currentCounts.hadir}</span>
              <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-150">Sakit: {currentCounts.sakit}</span>
              <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-150">Izin: {currentCounts.izin}</span>
              <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-150">Alpa: {currentCounts.alpa}</span>
            </div>
          )}
          <span className="text-indigo-600 font-bold bg-indigo-50/50 p-1.5 rounded-full transition-transform hover:scale-110">
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-slate-150 bg-slate-50/30 space-y-5 animate-fade-in text-left">
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setViewMode("input")}
                className={`px-4 py-2 text-xs font-bold transition ${viewMode === "input" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Input Absensi
              </button>
              <button
                type="button"
                onClick={() => setViewMode("history")}
                className={`px-4 py-2 text-xs font-bold transition ${viewMode === "history" ? "border-b-2 border-indigo-600 text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
              >
                Riwayat Absensi
              </button>
            </div>
            {onViewChapters && (
              <button
                type="button"
                onClick={onViewChapters}
                className="px-4 py-2 text-xs font-black text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1.5 cursor-pointer ml-auto hover:bg-indigo-50/50 rounded-lg"
              >
                📖 Buka Tampilan Bab &amp; Materi
              </button>
            )}
          </div>
          
          {viewMode === "input" ? (
          <form onSubmit={handleSubmitAll} className="space-y-5">
            {/* Success message banner */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-bold animate-bounce shadow-3xs">
                <span className="text-xl">✅</span>
                <p>{successMsg}</p>
              </div>
            )}

            {/* Global Settings Grid: Class, Time, Date, Chapter, Activity */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <span className="text-base">⚙️</span>
                <h6 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider">Pengaturan Sesi &amp; Kegiatan Kelas</h6>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Pilih Kelas</span>
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {allClasses.map((c: any) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Tanggal Absen</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Kelas Jam Berapa</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                      required
                    />
                    <span className="text-slate-400 font-bold">-</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Pelajaran &amp; Bab</span>
                  </label>
                  <div className="flex gap-1.5">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 px-2 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="Bahasa Jepang">Bahasa Jepang</option>
                      <option value="SSW">SSW</option>
                    </select>
                    <select
                      value={selectedBab}
                      onChange={(e) => setSelectedBab(Number(e.target.value))}
                      className="w-20 bg-slate-50 border border-slate-200 px-2 py-2 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                    >
                      {Array.from({ length: 35 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>Bab {i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Kegiatan Hari Ini</label>
                <input
                  type="text"
                  placeholder="Contoh: Membaca kosa kata bab baru, latihan percakapan Kaiwa, &amp; pengerjaan kuis mandiri..."
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 outline-none focus:bg-white transition-all shadow-2xs"
                  required
                />
              </div>
            </div>

            {/* Student Roster Section */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-3xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h6 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider">
                    Daftar Kehadiran Siswa ({studentsInClass.length} Terdaftar)
                  </h6>
                </div>
                <div className="flex gap-2 text-[9px] font-black uppercase">
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-md">Hadir: {currentCounts.hadir}</span>
                  <span className="text-amber-700 bg-amber-50 border border-amber-150 px-2 py-0.5 rounded-md">Sakit: {currentCounts.sakit}</span>
                  <span className="text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-md">Izin: {currentCounts.izin}</span>
                  <span className="text-rose-700 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-md">Alpa: {currentCounts.alpa}</span>
                </div>
              </div>

              {studentsInClass.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <div className="text-3xl">👥</div>
                  <p className="text-xs font-semibold">Tidak ada siswa yang terplot di kelas "{selectedClass || 'Silakan Pilih Kelas'}"</p>
                  <p className="text-[10px] text-slate-400">Pilih kelas di dropdown pengaturan sesi di atas untuk memunculkan daftar nama siswa.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto pr-1">
                  {studentsInClass.map((student: any, idx: number) => {
                    const currentStatus = studentStatuses[student.id] || "Hadir";
                    return (
                      <div key={student.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                        {/* Student profile info */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 font-mono w-5 text-right">{idx + 1}.</span>
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center uppercase shadow-3xs">
                            {student.name ? student.name.substring(0, 2) : "SW"}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800">{student.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{student.id} • {student.class}</p>
                          </div>
                        </div>

                        {/* Status Selection & Individual Notes */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:w-2/3 justify-end">
                          {/* Individual small note input */}
                          <input
                            type="text"
                            placeholder="Catatan individu (opsional)..."
                            value={studentNotes[student.id] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentNotes(prev => ({ ...prev, [student.id]: val }));
                            }}
                            className="flex-1 bg-slate-50 border border-slate-200/70 px-2.5 py-1 text-[10px] rounded-lg outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                          />

                          {/* Hadir, Sakit, Izin, Alpa Button Group */}
                          <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200/50">
                            {[
                              { key: "Hadir", label: "Hadir", activeColor: "bg-emerald-600 text-white shadow-3xs" },
                              { key: "Sakit", label: "Sakit", activeColor: "bg-amber-500 text-white shadow-3xs" },
                              { key: "Izin", label: "Izin", activeColor: "bg-blue-600 text-white shadow-3xs" },
                              { key: "Alpa", label: "Alpa", activeColor: "bg-rose-600 text-white shadow-3xs" }
                            ].map((opt) => {
                              const isSelected = currentStatus === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  type="button"
                                  onClick={() => {
                                    setStudentStatuses(prev => ({ ...prev, [student.id]: opt.key }));
                                  }}
                                  className={`py-1 px-2.5 rounded-lg text-[10px] font-black uppercase text-center transition cursor-pointer select-none ${
                                    isSelected 
                                      ? opt.activeColor 
                                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Bar */}
            {studentsInClass.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[10px] text-slate-500 font-medium text-center sm:text-left">
                  Menyimpan kehadiran untuk <strong className="font-extrabold text-indigo-600">{studentsInClass.length} siswa</strong> di kelas <strong className="font-extrabold text-slate-700">{selectedClass}</strong> Bab {selectedBab}.
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? "Sedang Menyimpan..." : "Simpan Seluruh Absensi"}</span>
                </button>
              </div>
            )}
          </form>
          ) : (
            <div className="space-y-4">
              <div className="relative mb-4">
                <Search className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama siswa, topik, catatan..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-3">
                {sessionGroups.map((group) => {
                  const firstRecord = group.records[0];
                  const dateStr = new Date(firstRecord.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  const isExpanded = expandedSessions.includes(group.key);
                  const hadirCount = group.records.filter(r => r.status === 'Hadir').length;
                  const totalCount = group.records.length;
                  
                  return (
                    <div key={group.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-3xs">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedSessions(prev => 
                            prev.includes(group.key) 
                              ? prev.filter(k => k !== group.key)
                              : [...prev, group.key]
                          );
                        }}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800">{dateStr}</h4>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                {firstRecord.time || "-"}
                              </span>
                              <span className="text-xs font-bold text-slate-600">
                                {firstRecord.subject}
                              </span>
                              {!selectedClass && (
                                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 ml-1">
                                  {group.className}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:block text-right">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">Kehadiran</span>
                            <span className="block text-sm font-black text-emerald-600">{hadirCount} / {totalCount} Siswa</span>
                          </div>
                          <div className={`p-1.5 rounded-full transition-transform ${isExpanded ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-black text-[9px] tracking-wider">
                                <tr>
                                  <th className="px-4 py-3">Siswa</th>
                                  <th className="px-4 py-3">Status</th>
                                  <th className="px-4 py-3">Foto Bukti</th>
                                  <th className="px-4 py-3">Catatan Khusus</th>
                                  <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {group.records.map((r: any) => (
                                  <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-800">{r.studentName}</td>
                                    <td className="px-4 py-3">
                                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        r.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' :
                                        r.status === 'Izin' || r.status === 'Sakit' ? 'bg-amber-100 text-amber-700' :
                                        'bg-rose-100 text-rose-700'
                                      }`}>{r.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      {(r.photo || r.photoUrl || r.proof) ? (
                                        <button
                                          type="button"
                                          onClick={() => setViewingAttendancePhoto(r.photo || r.photoUrl || r.proof)}
                                          className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-extrabold border border-blue-200/80 transition cursor-pointer"
                                        >
                                          <img
                                            src={r.photo || r.photoUrl || r.proof}
                                            className="w-5 h-5 rounded object-cover border border-blue-300"
                                            alt="Foto"
                                            referrerPolicy="no-referrer"
                                          />
                                          <span>Lihat Foto</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 italic">Tanpa Foto</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={r.notes}>{r.notes || "-"}</td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setEditingRecord(r)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {sessionGroups.length === 0 && (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-500 text-xs">
                    Belum ada riwayat absensi.
                  </div>
                )}
              </div>
              
              {editingRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-extrabold text-sm text-slate-800">Edit Riwayat Absensi</h3>
                      <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Siswa</label>
                        <p className="font-bold text-slate-800">{editingRecord.studentName}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                          <select
                            value={editingRecord.status}
                            onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                            className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                          >
                            <option value="Hadir">Hadir</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Alpa">Alpa</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Topik</label>
                          <input
                            type="text"
                            value={editingRecord.subject}
                            onChange={(e) => setEditingRecord({...editingRecord, subject: e.target.value})}
                            className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Catatan</label>
                        <textarea
                          rows={2}
                          value={editingRecord.notes}
                          onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
                          className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-xs focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setEditingRecord(null)}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (onUpdateState) {
                            await onUpdateState('attendance', 'edit', editingRecord);
                            setEditingRecord(null);
                          }
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" /> Simpan Perubahan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {viewingAttendancePhoto && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingAttendancePhoto(null)}>
                  <div className="bg-white rounded-3xl p-4 max-w-md w-full shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                        <span>📷</span> Foto Bukti Presensi
                      </h4>
                      <button
                        onClick={() => setViewingAttendancePhoto(null)}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[65vh]">
                      <img
                        src={viewingAttendancePhoto}
                        alt="Foto Absen"
                        className="max-h-[63vh] w-auto object-contain rounded-xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-center pt-1">
                      <button
                        onClick={() => setViewingAttendancePhoto(null)}
                        className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LmsViewProps {
  currentUser: UserAccount | null;
  attendanceRecords: AttendanceRecord[];
  activeStudents: ActiveStudent[];
  lmsLessons?: LMSLesson[];
  chapterAssessments?: ChapterAssessment[];
  jobOrders?: JobOrder[];
  onAddAttendance: (payload: any) => Promise<boolean>;
  onUpdateState?: (dataType: string, action: string, payload: any) => Promise<boolean>;
  initialSubTab?: string;
  systemState?: any;
  hideWelcomeBanner?: boolean;
}


const CountdownTimer = ({ deadline }: { deadline: string }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  React.useEffect(() => {
    if (!deadline) return;
    const updateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft("Waktu Habis");
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (d > 0) timeStr += `${d}h `;
        timeStr += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setTimeLeft(timeStr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);
  if (!deadline) return null;
  return <span className="font-mono">{timeLeft || "Menghitung..."}</span>;
};


const ToastNotification = ({ message, onClose }: { message: string, onClose: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
      <div className="bg-white/20 p-1.5 rounded-lg">
        <Bell className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xs">Pemberitahuan Baru</span>
        <span className="text-[10px] opacity-90">{message}</span>
      </div>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-md transition">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};


const CBTTimer = ({ startTime, durationMinutes, onExpire }: { startTime: number, durationMinutes: number, onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  
  React.useEffect(() => {
    let expired = false;
    const updateTime = () => {
      if (expired) return;
      const now = Date.now();
      const end = startTime + durationMinutes * 60 * 1000;
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Waktu Habis");
        expired = true;
        onExpire();
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        let timeStr = "";
        if (h > 0) timeStr += `${h.toString().padStart(2, '0')}:`;
        timeStr += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        setTimeLeft(timeStr);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [startTime, durationMinutes, onExpire]);
  
  return (
    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg border border-rose-200 font-mono font-bold text-sm shadow-sm animate-pulse">
      ⏳ Sisa Waktu CBT: {timeLeft || "Menghitung..."}
    </div>
  );
};

const getEmbeddableUrl = (url: string | null) => {
  if (!url) return undefined;
  if (url.includes('drive.google.com/file/d/')) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  return url;
};

const dataURLtoBlob = (dataurl: string) => {
  try {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("Error parsing base64 to blob", err);
    return null;
  }
};

export default function LmsView({
  currentUser,
  attendanceRecords,
  activeStudents,
  lmsLessons,
  chapterAssessments = [],
  jobOrders = [],
  onAddAttendance,
  onUpdateState,
  initialSubTab,
  systemState,
  hideWelcomeBanner
}: LmsViewProps) {
  const isReadOnlyView = false;

  const matchingStudent = React.useMemo(() => {
    if (!currentUser) return null;
    const studentId = (currentUser.studentId || "").trim().toLowerCase();
    const nameLower = (currentUser.name || "").trim().toLowerCase();
    const emailLower = (currentUser.email || "").trim().toLowerCase();
    const usernameLower = (currentUser.username || "").trim().toLowerCase();
    
    return (activeStudents || []).find((s: any) => {
      const sId = (s.id || "").trim().toLowerCase();
      const sName = (s.name || "").trim().toLowerCase();
      const sEmail = (s.email || "").trim().toLowerCase();
      const sUsername = (s.username || "").trim().toLowerCase();
      
      if (studentId && sId === studentId) return true;
      if (nameLower && sName === nameLower) return true;
      if (emailLower && sEmail === emailLower) return true;
      if (usernameLower && sUsername === usernameLower) return true;
      return false;
    });
  }, [activeStudents, currentUser]);

  const [activeTab, setActiveTab] = React.useState<"dashboard" | "materi" | "tugas" | "progress" | "laporan">("dashboard");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [notifiedLessonIds, setNotifiedLessonIds] = React.useState<Set<string>>(new Set());
  const [pdfViewerUrl, setPdfViewerUrl] = React.useState<string | null>(null);
  const [useGoogleDocs, setUseGoogleDocs] = React.useState(true);
  const [blobPdfUrl, setBlobPdfUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pdfViewerUrl) {
      if (blobPdfUrl) {
        URL.revokeObjectURL(blobPdfUrl);
        setBlobPdfUrl(null);
      }
      return;
    }

    const trimmed = pdfViewerUrl.trim();
    if (trimmed.startsWith("data:")) {
      const blob = dataURLtoBlob(trimmed);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBlobPdfUrl(url);
        setUseGoogleDocs(false); // Google Docs cannot view local data/blob URLs
      } else {
        setBlobPdfUrl(null);
      }
    } else {
      if (blobPdfUrl) {
        URL.revokeObjectURL(blobPdfUrl);
        setBlobPdfUrl(null);
      }
      // Standard HTTP/HTTPS URLs work best with Google Docs inside frames
      setUseGoogleDocs(true);
    }
  }, [pdfViewerUrl]);

  const [activeQuizChapterId, setActiveQuizChapterId] = React.useState<number | null>(null);

  React.useEffect(() => {
  if (pdfViewerUrl) {
      window.history.pushState({ pdfViewerOpen: true }, "");
    }
  }, [pdfViewerUrl]);

  React.useEffect(() => {
    const handlePopState = () => {
      if (pdfViewerUrl) {
        setPdfViewerUrl(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pdfViewerUrl]);

  const [cbtStartTimes, setCbtStartTimes] = React.useState<Record<string, number>>({});
  
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('cbtStartTimes');
      if (stored) setCbtStartTimes(JSON.parse(stored));
    } catch(e){}
  }, []);

  const handleStartCbt = (id: string) => {
    const newTs = { ...cbtStartTimes, [id]: Date.now() };
    setCbtStartTimes(newTs);
    localStorage.setItem('cbtStartTimes', JSON.stringify(newTs));
  };

  
  React.useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission();
    }
  }, []);

  React.useEffect(() => {
    if (!lmsLessons || !currentUser || currentUser.role !== "Siswa") return;
    const activeAssignments = lmsLessons.filter(l => 
      l.difficulty === "Tugas" && 
      (l.targetClass === "Semua" || l.targetClass === currentUser.assignedClass) &&
      (!l.deadline || new Date(l.deadline).getTime() > Date.now())
    );
    activeAssignments.forEach(assignment => {
      if (!notifiedLessonIds.has(assignment.id)) {
        const msg = "Tugas Baru: " + assignment.title;
        setToastMessage(msg);
        if ("Notification" in window && Notification.permission === "granted") {
           try { new Notification(msg, { body: "Silakan cek LMS E-Benkyou.", icon: "/logo.png" }); } catch(e) {}
        }
        // @ts-ignore
        if (window.Android && typeof window.Android.showNotification === 'function') {
           // @ts-ignore
           window.Android.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        // @ts-ignore
        if (window.JSBridge && typeof window.JSBridge.showNotification === 'function') {
           // @ts-ignore
           window.JSBridge.showNotification(msg, "Silakan cek LMS E-Benkyou.");
        }
        setNotifiedLessonIds(prev => new Set(prev).add(assignment.id));
      }
    });
  }, [lmsLessons, currentUser, notifiedLessonIds]);

  const [activeSubTab, setActiveSubTab] = React.useState(initialSubTab || "bab");
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    } else {
      setActiveSubTab("bab");
    }
  }, [initialSubTab]);
  const [progressSubject, setProgressSubject] = React.useState("Bahasa Jepang");
  const [viewingDoc, setViewingDoc] = React.useState<{ title: string; url: string } | null>(null);
  const [viewingAttendancePhoto, setViewingAttendancePhoto] = React.useState<string | null>(null);
  
  const [scoreKanji, setScoreKanji] = React.useState<number | "">("");
  const [scoreKotoba, setScoreKotoba] = React.useState<number | "">("");
  const [scoreBumpo, setScoreBumpo] = React.useState<number | "">("");
  const [scoreKaiwa, setScoreKaiwa] = React.useState<number | "">("");
  const [assessmentSubject, setAssessmentSubject] = React.useState("Bahasa Jepang");
  const [gradingNotes, setGradingNotes] = React.useState("");
  const [isGradingSubmitting, setIsGradingSubmitting] = React.useState(false);
  
  
  const [isQuizSubmitted, setIsQuizSubmitted] = React.useState(false);
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [essayAnswer, setEssayAnswer] = React.useState("");
  const [quizIndex, setQuizIndex] = React.useState(0);
  const [quizScore, setQuizScore] = React.useState(0);
  const [showQuizResults, setShowQuizResults] = React.useState(false);
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("");
  const [absenType, setAbsenType] = React.useState<"Masuk" | "Pulang">("Masuk");
  const [absenLocation, setAbsenLocation] = React.useState<string | null>(null);
  const [absenPhoto, setAbsenPhoto] = React.useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);
  const [showCamera, setShowCamera] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const [absenMsg, setAbsenMsg] = React.useState("");
  const [absenSubject, setAbsenSubject] = React.useState("Bab 1");
  const [absenYear, setAbsenYear] = React.useState(new Date().getFullYear().toString());
  const [absenStatus, setAbsenStatus] = React.useState("Hadir");
  const [absenNotes, setAbsenNotes] = React.useState("");
  const [isSubmittingAbsen, setIsSubmittingAbsen] = React.useState(false);
  const [quizSubMode, setQuizSubMode] = React.useState("belajar");
  const [isQuizFormOpen, setIsQuizFormOpen] = React.useState(false);
  const [newQuiz, setNewQuiz] = React.useState<any>({
    subject: "Bahasa Jepang",
    questionType: "pilihan_ganda",
    question: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0
  });
  const [quizBatch, setQuizBatch] = React.useState<any[]>([]);
  const [selectedBatchIndex, setSelectedBatchIndex] = React.useState<number>(0);
  const [batchDeadline, setBatchDeadline] = React.useState<string>("");
  const [batchDurationMinutes, setBatchDurationMinutes] = React.useState<number | "">("");
  const [batchTargetClass, setBatchTargetClass] = React.useState<string>("Semua");
  const [selectedPracticePacket, setSelectedPracticePacket] = React.useState("N4_Paket1");
  const [practiceAnswers, setPracticeAnswers] = React.useState<any>({});
  const [studentQuizAnswers, _setStudentQuizAnswers] = React.useState<Record<string, number>>({});
  const [studentQuizEssayAnswers, _setStudentQuizEssayAnswers] = React.useState<Record<string, string>>({});
  const [submittedQuizIds, _setSubmittedQuizIds] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    try {
      const p1 = localStorage.getItem('cbtAnswers');
      if (p1) _setStudentQuizAnswers(JSON.parse(p1));
      const p2 = localStorage.getItem('cbtEssayAnswers');
      if (p2) _setStudentQuizEssayAnswers(JSON.parse(p2));
      const p3 = localStorage.getItem('cbtSubmittedIds');
      if (p3) _setSubmittedQuizIds(JSON.parse(p3));
    } catch(e){}
  }, []);

  const setStudentQuizAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizAnswers) : val;
    _setStudentQuizAnswers(updated);
    localStorage.setItem('cbtAnswers', JSON.stringify(updated));
  };
  
  const setStudentQuizEssayAnswers = (val: any) => {
    const updated = typeof val === 'function' ? val(studentQuizEssayAnswers) : val;
    _setStudentQuizEssayAnswers(updated);
    localStorage.setItem('cbtEssayAnswers', JSON.stringify(updated));
  };
  
  const setSubmittedQuizIds = (val: any) => {
    const updated = typeof val === 'function' ? val(submittedQuizIds) : val;
    _setSubmittedQuizIds(updated);
    localStorage.setItem('cbtSubmittedIds', JSON.stringify(updated));
  };
  const [practiceShowExplanations, setPracticeShowExplanations] = React.useState<any>({});
  const [selectedClassFilter, setSelectedClassFilter] = React.useState("Semua");
  const [showAllChapters, setShowAllChapters] = React.useState(false);
  const [gradingIsUnlocked, setGradingIsUnlocked] = React.useState(false);
  const [gradingStatus, setGradingStatus] = React.useState("Draft");
  const [expandedLessons, setExpandedLessons] = React.useState<string[]>([]);
  const [progressTabMode, setProgressTabMode] = React.useState<"penilaian" | "penilaian_bab" | "sikap">("penilaian_bab");
  const [babCurrentPage, setBabCurrentPage] = React.useState(1);
  const [tugasCurrentPage, setTugasCurrentPage] = React.useState(1);
  const [evalSelectedLessonId, setEvalSelectedLessonId] = React.useState<string>("");
  const [evalSelectedBabId, setEvalSelectedBabId] = React.useState<number | "">("");
  const [isChaptersMinimized, setIsChaptersMinimized] = React.useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  // Assignment states
  const [submittingLessons, setSubmittingLessons] = React.useState<Record<string, boolean>>({});
  const [tugasScores, setTugasScores] = React.useState<Record<string, string>>({});
  const [tugasNotes, setTugasNotes] = React.useState<Record<string, string>>({});
  const [tugasGrades, setTugasGrades] = React.useState<Record<string, string>>({});
  const [tugasGradingSubmitting, setTugasGradingSubmitting] = React.useState<Record<string, boolean>>({});

  // Deletion Confirmation Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleteType, setDeleteType] = React.useState<"lesson" | "quiz" | null>(null);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = React.useState<string>("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [attendanceClassFilter, setAttendanceClassFilter] = React.useState("Semua");
  const [attendanceSenseiFilter, setAttendanceSenseiFilter] = React.useState(() => {
    if (currentUser?.role === "Pengajar" && currentUser?.name) {
      return currentUser.name;
    }
    return "Semua";
  });
  const [attendanceSearchQuery, setAttendanceSearchQuery] = React.useState("");

  const isStaff = ["Pengajar", "Admin", "Admin Super", "Admin Biasa"].includes(currentUser?.role || "");

  const myAttendance = React.useMemo(() => {
    let list = attendanceRecords || [];
    if (!isStaff) {
      const studentId = matchingStudent?.id || currentUser?.studentId || currentUser?.username || "SIS-099";
      list = list.filter((rec: any) => rec.studentId === studentId);
    } else {
      if (attendanceClassFilter !== "Semua") {
        list = list.filter((rec: any) => (rec.class || "").toLowerCase() === attendanceClassFilter.toLowerCase());
      }
      if (attendanceSenseiFilter !== "Semua") {
        list = list.filter((rec: any) => (rec.sensei || "").toLowerCase() === attendanceSenseiFilter.toLowerCase());
      }
      if (attendanceSearchQuery.trim()) {
        const query = attendanceSearchQuery.toLowerCase();
        list = list.filter((rec: any) => 
          (rec.studentName || "").toLowerCase().includes(query) || 
          (rec.studentId || "").toLowerCase().includes(query) ||
          (rec.subject || "").toLowerCase().includes(query) ||
          (rec.status || "").toLowerCase().includes(query)
        );
      }
    }
    return list;
  }, [attendanceRecords, isStaff, matchingStudent, currentUser, attendanceClassFilter, attendanceSenseiFilter, attendanceSearchQuery]);
  
  const lmsClassesMap = React.useMemo(() => {
    const rawList = [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])];
    const studentClasses = (activeStudents || []).map(s => (s.class || "").trim()).filter(Boolean);
    const seenClasses = new Set(rawList.map(c => (c.name || "").trim().toLowerCase()));
    
    studentClasses.forEach(scName => {
      const lower = scName.toLowerCase();
      if (!seenClasses.has(lower) && lower !== "belum diplot" && lower !== "belum ada kelas" && lower !== "semua" && lower !== "semua kelas") {
        rawList.push({
          id: scName,
          name: scName,
          isActive: true,
          method: "Offline",
          chapters: CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 })),
          mathChapters: MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 }))
        });
        seenClasses.add(lower);
      }
    });

    const seen = new Set<string>();
    const uniqueRawList = rawList.filter(c => {
      const nameKey = (c.name || c.id || "").trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });

    const map = new Map();
    const cleanStr = (s: string) => {
      if (!s) return "";
      return s.trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    };
    uniqueRawList.forEach((c: any) => {
      if (c?.name) {
        map.set(cleanStr(c.name), {
          chapters: c.chapters || [],
          mathChapters: c.mathChapters || []
        });
      }
    });
    return map;
  }, [systemState?.customization?.lmsClasses, systemState?.lmsClasses, activeStudents]);

  const getClassChaptersList = React.useCallback((cls: string, sub: string, showAll: boolean = false): any[] => {
    const cleanStr = (s: string) => {
      if (!s) return "";
      return s.trim().toLowerCase().replace(/^kelas[:\s]*/i, "");
    };
    const targetCls = cleanStr(cls);
    const entry = lmsClassesMap.get(targetCls);
    
    let chapters: any[] = [];
    if (sub === "SSW") {
      chapters = entry?.mathChapters || [];
      if (chapters.length === 0) {
        chapters = MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1, activeDate: "" }));
      }
    } else {
      chapters = entry?.chapters || [];
      if (chapters.length === 0) {
        chapters = CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1, activeDate: "" }));
      }
    }
    
    if (!showAll) {
      return chapters.filter((c: any) => c.isActive !== false);
    }
    return chapters;
  }, [lmsClassesMap]);

  const getResolvedChapterNum = React.useCallback((clsName: string, rawVal: any, sub: string): number => {
    if (!rawVal) return 0;
    const num = Number(rawVal);
    const isFukushu = (clsName || "").toUpperCase().includes("FUKUSHU") || (clsName || "").toUpperCase().includes("FUKUSU");
    if (isFukushu && num <= 10) {
      const trulyActiveChapters = getClassChaptersList(clsName, sub, false);
      const hasStandardChapters = trulyActiveChapters.some((ch: any) => ch.number < 26);
      if (!hasStandardChapters) {
        return 25 + num;
      }
    }
    return num;
  }, [getClassChaptersList]);
  
  const toggleLessonExpanded = (id: string) => {
    setExpandedLessons((prev: any) => {
      const list = Array.isArray(prev) ? prev : [];
      if (list.includes(id)) {
        return list.filter((x: any) => x !== id);
      } else {
        return [...list, id];
      }
    });
  };
  const handleToggleLessonLock = async (lesson: any) => {
    if (!onUpdateState) return;
    await onUpdateState("lmsLessons", "update", {
      ...lesson,
      isLocked: !lesson.isLocked
    });
  };
  const handleOpenEditLesson = (lesson: any) => {
    setSelectedLessonToEdit(lesson);
    setLessonSubject(lesson.subject || "Bahasa Jepang");
    setSelectedBabNumber(lesson.chapterNumber || 1);
    setLessonDifficulty(lesson.difficulty || "Umum");
    setLessonTitle(lesson.title || "");
    setLessonJapaneseTitle(lesson.japaneseTitle || "");
    setLessonContentType(lesson.contentType || "text_only");
    setLessonUploadMethod(lesson.uploadMethod || "url");
    setLessonVideoUrl(lesson.videoUrl || "");
    setLessonSlidesUrl(lesson.slidesUrl || "");
    setLessonBookUrl(lesson.bookUrl || "");
    setLessonAudioData(lesson.audioData || "");
    setLessonContent(lesson.content || "");
    setLessonIsLocked(!!lesson.isLocked);
    setLessonTargetClass(lesson.targetClass || "Semua");
    setLessonDeadline(lesson.deadline || "");
    setLessonDurationMinutes(lesson.durationMinutes || "");
    setIsLessonFormOpen(true);
  };
  const handleLessonDelete = (id: string, name: string) => {
    setDeleteType("lesson");
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteConfirmOpen(true);
  };
  const handleQuizDelete = (id: string, name: string) => {
    setDeleteType("quiz");
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!onUpdateState || !deleteTargetId || !deleteType) return;
    setIsDeleting(true);
    try {
      if (deleteType === "lesson") {
        await onUpdateState("lmsLessons", "delete", { id: deleteTargetId });
      } else if (deleteType === "quiz") {
        await onUpdateState("lmsQuizzes", "delete", { id: deleteTargetId });
      }
    } catch (err) {
      console.error("Gagal menghapus data:", err);
    } finally {
      setIsDeleting(false);
      setDeleteConfirmOpen(false);
      setDeleteType(null);
      setDeleteTargetId(null);
      setDeleteTargetName("");
    }
  };

  const [isLessonFormOpen, setIsLessonFormOpen] = React.useState(false);
  const [lessonTargetClass, setLessonTargetClass] = React.useState("Semua");
  const [selectedClassForLms, setSelectedClassForLms] = React.useState<string | null>(null);
  const [selectedLessonToEdit, setSelectedLessonToEdit] = React.useState<any>(null);
  const [lessonError, setLessonError] = React.useState("");
  const [lessonSubject, setLessonSubject] = React.useState("Bahasa Jepang");
  const [selectedBabNumber, setSelectedBabNumber] = React.useState<number>(1);
  const [lessonDifficulty, setLessonDifficulty] = React.useState("Umum");
  const [lessonTitle, setLessonTitle] = React.useState("");
  const [lessonJapaneseTitle, setLessonJapaneseTitle] = React.useState("");
  const [lessonContentType, setLessonContentType] = React.useState("text_only");
  const [lessonUploadMethod, setLessonUploadMethod] = React.useState("url");
  const [lessonVideoUrl, setLessonVideoUrl] = React.useState("");
  const [lessonSlidesUrl, setLessonSlidesUrl] = React.useState("");
  const [lessonBookUrl, setLessonBookUrl] = React.useState("");
  const [lessonAudioData, setLessonAudioData] = React.useState<any>(null);
  const [isRecordingAudio, setIsRecordingAudio] = React.useState(false);
  const [lessonIsLocked, setLessonIsLocked] = React.useState(false);
  const [lessonContent, setLessonContent] = React.useState("");
  const [lessonDeadline, setLessonDeadline] = React.useState("");
  const [lessonDurationMinutes, setLessonDurationMinutes] = React.useState<number | "">("");
  const [isSubmittingLesson, setIsSubmittingLesson] = React.useState(false);
  const [isFileUploading, setIsFileUploading] = React.useState(false);

  const startRecording = () => {};
  const stopRecording = () => {};
  const handleFileUpload = async (e: any, setter: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsFileUploading(true);
    setLessonError("");
    try {
      const url = await uploadFileToFirebase(file, "lms_materials");
      setter(url);
    } catch (err) {
      console.error(err);
      alert("Gagal upload berkas");
    } finally {
      setIsFileUploading(false);
    }
  };
  const handleGradeSubmit = async (statusOverride?: string | Event) => {
    if (typeof statusOverride === "object" && statusOverride.preventDefault) {
      statusOverride.preventDefault();
    }
    if (isReadOnlyView) return;

    let submitStatus = "Telah Dinilai";
    if (typeof statusOverride === "string") {
      submitStatus = statusOverride;
    }

    if (currentUser?.role === "Siswa") {
      submitStatus = statusOverride as string;
    }

    setIsGradingSubmitting(true);

    try {
      const finalKotoba = Number(scoreKotoba) || 0;
      const finalBumpo = Number(scoreBumpo) || 0;
      const finalKaiwa = Number(scoreKaiwa) || 0;
      const finalKanji = Number(scoreKanji) || 0;
      const computedAverage = Math.round(((finalKotoba + finalBumpo + finalKaiwa + finalKanji) / 4) * 10) / 10;

      let letterGrade = "E";
      if (computedAverage >= 90) letterGrade = "A";
      else if (computedAverage >= 80) letterGrade = "B";
      else if (computedAverage >= 70) letterGrade = "C";
      else if (computedAverage >= 60) letterGrade = "D";

      const payload: any = {
        id: `asses-${viewStudentId}-${selectedBabNumber}-${Date.now()}`,
        studentId: viewStudentId,
        chapterId: `ch-${selectedBabNumber}`,
        chapterNumber: Number(selectedBabNumber),
        subject: assessmentSubject,
        status: submitStatus,
        score: computedAverage,
        grade: letterGrade,
        notes: gradingNotes,
        details: {
          kotoba: finalKotoba,
          bumpo: finalBumpo,
          kaiwa: finalKaiwa,
          kanji: finalKanji
        },
        assessedBy: currentUser?.name || "System",
        assessedDate: new Date().toLocaleDateString("id-ID")
      };

      if (onUpdateState) {
        await onUpdateState("chapterAssessments", "UPDATE", payload);
      }
    } catch (err) {
      console.error("Error submitting grade:", err);
      alert("Gagal menyimpan nilai.");
    } finally {
      setIsGradingSubmitting(false);
    }
  };
  const handleLessonSubmit = async (e: any) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!lessonTitle.trim()) {
      setLessonError("Judul materi wajib diisi");
      return;
    }
    if (isFileUploading) {
      setLessonError("Harap tunggu hingga proses upload berkas selesai.");
      return;
    }
    setIsSubmittingLesson(true);
    setLessonError("");
    
    const payload: any = {
      subject: lessonSubject,
      chapterNumber: Number(selectedBabNumber),
      difficulty: lessonDifficulty,
      title: lessonTitle,
      japaneseTitle: lessonJapaneseTitle,
      contentType: lessonContentType,
      uploadMethod: lessonUploadMethod,
      videoUrl: lessonVideoUrl,
      slidesUrl: lessonSlidesUrl,
      bookUrl: lessonBookUrl,
      audioData: lessonAudioData || "",
      content: lessonContent,
      isLocked: lessonIsLocked,
      targetClass: lessonTargetClass,
      deadline: lessonDeadline,
      durationMinutes: lessonDurationMinutes ? Number(lessonDurationMinutes) : undefined
    };

    if (selectedLessonToEdit) {
      payload.id = selectedLessonToEdit.id;
    }

    if (!onUpdateState) {
      setLessonError("System update handler is not configured.");
      setIsSubmittingLesson(false);
      return;
    }

    const ok = await onUpdateState("lmsLessons", selectedLessonToEdit ? "update" : "add", payload);
    setIsSubmittingLesson(false);
    
    if (ok) {
      // BROADCAST LOGIC: If it's a "Tugas", automatically create/ensure assessments for all students in the target class
      if (payload.difficulty === "Tugas" && onUpdateState) {
        const targetClass = payload.targetClass || "Semua";
        const studentsToBroadcast = (activeStudents || []).filter(s => 
          targetClass === "Semua" || s.class === targetClass
        );

        for (const student of studentsToBroadcast) {
          // Check if assessment already exists for this student and chapter/subject/title to avoid duplicate/reset
          const exists = (chapterAssessments || []).some(a => 
            a.studentId === student.id && 
            a.chapterNumber === payload.chapterNumber && 
            (a.subject || "Bahasa Jepang") === (payload.subject || "Bahasa Jepang") &&
            a.title === payload.title
          );

          if (!exists) {
            const assessPayload = {
              studentId: student.id,
              studentName: student.name,
              chapterNumber: payload.chapterNumber,
              title: payload.title,
              status: "Belum Belajar",
              subject: payload.subject || "Bahasa Jepang",
              lessonId: payload.id // will be undefined if "add", but server logic handles it
            };
            // Note: We don't await to avoid blocking the UI too much, or we can await in a loop
            // But for reliability with onUpdateState (which calls fetchState), we might need to be careful.
            // However, onUpdateState is async, so we'll just fire them.
            onUpdateState("chapterAssessments", "update", assessPayload);
          }
        }
      }

      setIsLessonFormOpen(false);
      // Reset form
      setSelectedLessonToEdit(null);
      setLessonTitle("");
      setLessonJapaneseTitle("");
      setLessonVideoUrl("");
      setLessonSlidesUrl("");
      setLessonBookUrl("");
      setLessonAudioData("");
      setLessonContent("");
      setLessonDeadline("");
      setLessonDurationMinutes("");
    } else {
      setLessonError("Gagal menyimpan materi, silakan coba lagi.");
    }
  };

  const handleSetChapterActiveDate = async (cls: string, chapterNum: number, activeDate: string) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase()) {
        const isMath = assessmentSubject === "SSW";
        const chaptersKey = isMath ? "mathChapters" : "chapters";
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }
        const updatedChapters = chapters.map((ch: any) => {
          if (ch.number === chapterNum) {
            return {
              ...ch,
              activeDate: activeDate
            };
          }
          return ch;
        });
        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
  };

  const handleActivateChapterInLms = async (cls: string, chapterNum: number) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const classObj = lmsClasses.find((c: any) => (c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase());
    if (!classObj) return;

    const isMath = assessmentSubject === "SSW";
    const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
    const rawClassActiveChapter = classObj[activeChapterNumKey];
    
    const classActiveChapter = getResolvedChapterNum(cls, rawClassActiveChapter, assessmentSubject);

    const trulyActiveChapters = getClassChaptersList(cls, assessmentSubject, false);
    if (trulyActiveChapters.length === 0) {
      alert("Gagal: Tidak ada bab aktif dalam kurikulum kelas ini.");
      return;
    }

    // Find target chapter position
    const targetIndex = trulyActiveChapters.findIndex((ch: any) => ch.number === chapterNum);
    if (targetIndex === -1) {
      alert("Gagal: Bab ini tidak termasuk dalam kurikulum aktif kelas ini.");
      return;
    }

    // Sequential Check:
    if (classActiveChapter === 0) {
      const firstCh = trulyActiveChapters[0];
      if (chapterNum !== firstCh.number) {
        alert(`Gagal: Pengaktifan bab harus berurutan. Silakan aktifkan Bab ${firstCh.number} terlebih dahulu.`);
        return;
      }
    } else {
      const activeIndex = trulyActiveChapters.findIndex((ch: any) => ch.number === classActiveChapter);
      if (activeIndex !== -1) {
        const nextCh = trulyActiveChapters[activeIndex + 1];
        if (!nextCh) {
          alert("Gagal: Semua bab dalam kurikulum kelas sudah diaktifkan.");
          return;
        }
        if (chapterNum !== nextCh.number) {
          alert(`Gagal: Pengaktifan bab harus berurutan. Silakan aktifkan Bab ${nextCh.number} terlebih dahulu.`);
          return;
        }
      }
    }

    // Determine what exact value to store for activeChapterNum
    let dbValueToSet = chapterNum;

    await handleSetClassActiveChapter(cls, dbValueToSet);
    alert(`Akses Bab ${chapterNum} berhasil diaktifkan! Status pembelajaran aktif.`);
  };

  const handleDeactivateChapterInLms = async (cls: string, chapterNum: number) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const classObj = lmsClasses.find((c: any) => (c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase());
    if (!classObj) return;

    const isMath = assessmentSubject === "SSW";
    const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
    const rawClassActiveChapter = classObj[activeChapterNumKey];
    
    const classActiveChapter = getResolvedChapterNum(cls, rawClassActiveChapter, assessmentSubject);

    if (chapterNum !== classActiveChapter) {
      alert("Gagal: Hanya bab aktif terakhir yang dapat dinonaktifkan.");
      return;
    }

    const trulyActiveChapters = getClassChaptersList(cls, assessmentSubject, false);
    const activeIndex = trulyActiveChapters.findIndex((ch: any) => ch.number === classActiveChapter);
    
    let prevChapterNum = 0;
    if (activeIndex > 0) {
      prevChapterNum = trulyActiveChapters[activeIndex - 1].number;
    }

    let dbValueToSet = prevChapterNum;

    await handleSetClassActiveChapter(cls, dbValueToSet);
    alert(`Akses Bab ${chapterNum} berhasil dinonaktifkan.`);
  };

  const handleToggleChapterActive = async (cls: string, chapterNum: number, currentActive: boolean) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const isMath = assessmentSubject === "SSW";
    const chaptersKey = isMath ? "mathChapters" : "chapters";

    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase()) {
        const activeNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }
        const updatedChapters = chapters.map((ch: any) => {
          if (ch.number === chapterNum) {
            return {
              ...ch,
              isActive: !currentActive
            };
          }
          return ch;
        });

        const willBeActive = !currentActive;
        const additionalUpdate: any = {};
        if (willBeActive) {
          additionalUpdate[activeNumKey] = chapterNum;
        } else {
          additionalUpdate[activeNumKey] = Math.max(1, chapterNum - 1);
        }

        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters,
          ...additionalUpdate
        };
      }
      return {
        ...c,
        id: classId
      };
    });

    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
  };

  const handleUnlockAllChapters = async (cls: string) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase()) {
        const isMath = assessmentSubject === "SSW";
        const chaptersKey = isMath ? "mathChapters" : "chapters";
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }
        const updatedChapters = chapters.map((ch: any) => ({
          ...ch,
          activeDate: ""
        }));
        return {
          ...c,
          id: classId,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
  };

  const handleSetClassActiveChapter = async (cls: string, chapterNum: number) => {
    if (!onUpdateState) return;
    const lmsClasses = allClasses;
    const updatedLmsClasses = lmsClasses.map((c: any) => {
      const classId = c.id || c.name || "KLS-" + Math.random().toString(36).substr(2, 9);
      if ((c.name || "").trim().toLowerCase() === (cls || "").trim().toLowerCase()) {
        const isMath = assessmentSubject === "SSW";
        const chaptersKey = isMath ? "mathChapters" : "chapters";
        let chapters = c[chaptersKey] || [];
        if (chapters.length === 0) {
          const baseTemplate = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
          chapters = baseTemplate.map((ch: any) => ({
            ...ch,
            isActive: true,
            activeDate: ""
          }));
        }
        const updatedChapters = chapters.map((ch: any) => {
          if (ch.number === chapterNum) {
            return {
              ...ch,
              activeDate: ""
            };
          }
          return ch;
        });
        const activeChapterNumKey = isMath ? "activeMathChapterNum" : "activeChapterNum";
        return {
          ...c,
          id: classId,
          [activeChapterNumKey]: chapterNum,
          [chaptersKey]: updatedChapters
        };
      }
      return {
        ...c,
        id: classId
      };
    });
    
    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedLmsClasses
    });
  };

  const getClassChaptersCount = (cls: string, sub: string, showAll: boolean = false) => {
    const chapters = getClassChaptersList(cls, sub, showAll);
    return chapters.length;
  };
  const isSiswaOrAlumni = currentUser?.role === "Siswa" || currentUser?.role === "Alumni";

  const allClasses = React.useMemo(() => {
    // Merge classes from customization and top-level lmsClasses and deduplicate by trimmed name
    const rawList = [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])];
    
    // Also extract any classes from activeStudents that aren't in rawList
    const studentClasses = (activeStudents || []).map(s => (s.class || "").trim()).filter(Boolean);
    const seenClasses = new Set(rawList.map(c => (c.name || "").trim().toLowerCase()));
    
    studentClasses.forEach(scName => {
      const lower = scName.toLowerCase();
      if (!seenClasses.has(lower) && lower !== "belum diplot" && lower !== "belum ada kelas" && lower !== "semua" && lower !== "semua kelas") {
        rawList.push({
          id: scName,
          name: scName,
          isActive: true,
          method: "Offline",
          chapters: CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 })),
          mathChapters: MATH_CHAPTERS_LIST.map(ch => ({ ...ch, isActive: ch.number === 1 }))
        });
        seenClasses.add(lower);
      }
    });

    const seen = new Set<string>();
    return rawList.filter(c => {
      const nameKey = (c.name || c.id || "").trim().toLowerCase();
      if (!nameKey || seen.has(nameKey)) return false;
      seen.add(nameKey);
      return true;
    });
  }, [systemState?.lmsClasses, systemState?.customization?.lmsClasses, activeStudents]);

  const vvipPlottedStudents = React.useMemo(() => {
    let list = activeStudents || [];
    list = list.filter((s: any) => {
      const sClass = (s.class || "").trim().toLowerCase();
      if (!sClass || sClass === "" || sClass === "belum diplot" || sClass === "belum ada kelas" || sClass === "semua" || sClass === "semua kelas") {
        return false;
      }
      // If student is suspended in user accounts, exclude them; otherwise include them since they are plotted
      const sId = (s.id || "").trim().toLowerCase();
      const sName = (s.name || "").trim().toLowerCase();
      
      const matchedUser = (systemState?.users || []).find((u: any) => {
        const uId = (u.studentId || "").trim().toLowerCase();
        const uName = (u.name || "").trim().toLowerCase();
        return (uId && uId === sId) || (uName && uName === sName);
      });
      if (matchedUser && matchedUser.status === "Suspended") {
        return false;
      }
      return true;
    });
    return list;
  }, [activeStudents, systemState?.users]);

  const officialClasses = React.useMemo(() => {
    return [...(systemState?.customization?.lmsClasses || []), ...(systemState?.lmsClasses || [])]
      .filter(c => c.isActive !== false)
      .reduce((acc: any[], current: any) => {
        const x = acc.find((item: any) => item.name === current.name);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, []);
  }, [systemState]);

  const dropdownClasses = React.useMemo(() => {
    const list = allClasses.filter(c => c.isActive !== false);
    if (currentUser?.role === "VVIP") {
      const occupiedClassNames = new Set(vvipPlottedStudents.map(s => (s.class || "").trim().toLowerCase()));
      if (occupiedClassNames.size === 0) return list;
      return list.filter(c => occupiedClassNames.has((c.name || "").trim().toLowerCase()));
    }
    if (currentUser?.role === "Pengajar") {
      const pClass = (currentUser?.assignedClass || "").trim().toLowerCase();
      if (pClass === "semua" || pClass === "semua kelas") {
        return list;
      }
      if (pClass && pClass !== "belum diplot" && pClass !== "belum ada kelas") {
        return list.filter(c => (c.name || "").trim().toLowerCase() === pClass);
      }
      return [];
    }
    return list;
  }, [allClasses, currentUser?.role, currentUser?.assignedClass, vvipPlottedStudents]);

  // For VVIP or Pengajar or Admin viewing a specific class, automatically set selectedClassFilter to the assignedClass if available
  React.useEffect(() => {
    const isRestrictedRole = currentUser?.role === "VVIP" || currentUser?.role === "Pengajar";
    if (currentUser?.assignedClass && currentUser.assignedClass !== "Semua" && currentUser.assignedClass !== "Semua Kelas" && currentUser.assignedClass !== "Belum Diplot") {
      if (selectedClassFilter !== currentUser.assignedClass) {
        setSelectedClassFilter(currentUser.assignedClass);
      }
    } else if (isRestrictedRole && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas")) {
      if (dropdownClasses.length > 0) {
        setSelectedClassFilter(dropdownClasses[0].name);
      }
    }
  }, [currentUser?.assignedClass, currentUser?.role, dropdownClasses, selectedClassFilter]);

  const filteredActiveStudents = React.useMemo(() => {
    let list = (activeStudents || []);
    if (currentUser?.role === "VVIP") {
      list = (activeStudents || []);
    } else if (currentUser?.role === "Pengajar") {
      const pClass = (currentUser?.assignedClass || "").trim().toLowerCase();
      if (pClass === "semua" || pClass === "semua kelas") {
        // Keep full list
      } else if (pClass && pClass !== "belum diplot" && pClass !== "belum ada kelas") {
        list = list.filter((s: any) => (s.class || "").trim().toLowerCase() === pClass);
      } else {
        return [];
      }
    }
    
    if (selectedClassFilter && selectedClassFilter !== "Semua" && selectedClassFilter !== "Semua Kelas") {
      list = list.filter((s: any) => {
        const sClass = (s.class || "").trim().toLowerCase();
        const fClass = selectedClassFilter.trim().toLowerCase();
        return sClass === fClass;
      });
    }
    return list;
  }, [activeStudents, selectedClassFilter, currentUser, vvipPlottedStudents]);

  const itemsPerPage = 10;
  
  const totalBabPages = Math.ceil(filteredActiveStudents.length / itemsPerPage);
  const paginatedBabStudents = React.useMemo(() => {
    const startIndex = (babCurrentPage - 1) * itemsPerPage;
    return filteredActiveStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActiveStudents, babCurrentPage]);

  const totalTugasPages = Math.ceil(filteredActiveStudents.length / itemsPerPage);
  const paginatedTugasStudents = React.useMemo(() => {
    const startIndex = (tugasCurrentPage - 1) * itemsPerPage;
    return filteredActiveStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActiveStudents, tugasCurrentPage]);

  React.useEffect(() => {
    if (totalBabPages > 0 && babCurrentPage > totalBabPages) {
      setBabCurrentPage(totalBabPages);
    }
  }, [filteredActiveStudents.length, totalBabPages, babCurrentPage]);

  React.useEffect(() => {
    if (totalTugasPages > 0 && tugasCurrentPage > totalTugasPages) {
      setTugasCurrentPage(totalTugasPages);
    }
  }, [filteredActiveStudents.length, totalTugasPages, tugasCurrentPage]);

  // Set default student if current selection is not in filtered list
  const hasInitializedDefaultStudent = React.useRef(false);

  React.useEffect(() => {
    if (filteredActiveStudents.length > 0) {
      if (!hasInitializedDefaultStudent.current) {
        if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
          setSelectedStudentId(currentUser.studentId || filteredActiveStudents[0].id);
        } else {
          setSelectedStudentId(filteredActiveStudents[0].id);
        }
        hasInitializedDefaultStudent.current = true;
      } else {
        if (selectedStudentId) {
          const stillExists = filteredActiveStudents.some(s => s.id === selectedStudentId);
          if (!stillExists) {
            if (currentUser?.role === "Siswa" || currentUser?.role === "Alumni") {
              const myId = currentUser.studentId || "";
              if (filteredActiveStudents.some(s => s.id === myId)) {
                setSelectedStudentId(myId);
              } else {
                setSelectedStudentId(filteredActiveStudents[0].id);
              }
            } else {
              setSelectedStudentId(filteredActiveStudents[0].id);
            }
          }
        }
      }
    } else {
      setSelectedStudentId("");
    }
  }, [filteredActiveStudents, selectedStudentId, currentUser]);

  const viewStudentId = selectedStudentId || (currentUser?.studentId || "SIS-001");
  const viewStudent = (filteredActiveStudents || []).find((s: any) => s.id === viewStudentId) || (filteredActiveStudents || [])[0];

  
  const activeStudentClass = React.useMemo(() => {
    if (currentUser?.role === "Pengajar" && (!currentUser?.assignedClass || currentUser?.assignedClass === "Belum Diplot" || currentUser?.assignedClass === "Belum ada kelas")) {
      return null;
    }
    if (isSiswaOrAlumni && matchingStudent?.class) return matchingStudent.class;
    if (viewStudent && !isSiswaOrAlumni) return viewStudent.class;
    if (selectedClassForLms) return selectedClassForLms;
    if (currentUser?.assignedClass) return currentUser?.assignedClass;
    return null;
  }, [viewStudent, selectedClassForLms, isSiswaOrAlumni, currentUser, matchingStudent]);

  const currentClassObj = React.useMemo(() => {
    if (!activeStudentClass) return null;
    return allClasses.find(
      (c) => (c.name || "").trim().toLowerCase() === activeStudentClass.trim().toLowerCase()
    );
  }, [activeStudentClass, allClasses]);

  const isClassActive = currentClassObj ? currentClassObj.isActive !== false : true;
  const isAdminOrVvip = ["Pengajar", "Admin", "Admin Super", "Admin Biasa", "VVIP"].includes(currentUser?.role || "");
  const isVvipOrAdmin = currentUser?.role === "VVIP" || ["Admin", "Admin Super", "Admin Biasa"].includes(currentUser?.role || "");

  const handleToggleClassActive = async () => {
    if (!onUpdateState || !activeStudentClass) return;
    const baseClasses = systemState?.customization?.lmsClasses || [];
    const updatedClasses = [...baseClasses];
    const targetIdx = updatedClasses.findIndex(
      (item) => item.id.toLowerCase() === activeStudentClass.toLowerCase() || item.name.toLowerCase() === activeStudentClass.toLowerCase()
    );
    
    if (targetIdx !== -1) {
      updatedClasses[targetIdx] = {
        ...updatedClasses[targetIdx],
        isActive: true
      };
    } else {
      const templateClass = allClasses.find(
        (c) => (c.name || "").trim().toLowerCase() === activeStudentClass.trim().toLowerCase()
      );
      updatedClasses.push({
        id: activeStudentClass,
        name: activeStudentClass,
        isActive: true,
        type: templateClass?.type || "reguler",
        method: templateClass?.method || "Offline",
        chapters: templateClass?.chapters || CHAPTERS_LIST.map(ch => ({ ...ch, isActive: true }))
      });
    }

    const ok = await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedClasses
    });
    if (ok) {
      alert(`Kelas ${activeStudentClass} berhasil diaktifkan!`);
    } else {
      alert("Gagal mengaktifkan kelas.");
    }
  };

  const currentClassMaxBab = React.useMemo(() => {
    const cls = activeStudentClass || (dropdownClasses[0]?.name || "");
    if (!cls) return `${CHAPTERS_LIST.length}`;
    const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === cls.trim().toLowerCase());
    const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
    const activeCount = classObj?.[activeChapterNumKey] || 1;
    const totalCount = getClassChaptersList(cls, assessmentSubject, true).length;
    return `${activeCount} / ${totalCount}`;
  }, [activeStudentClass, dropdownClasses, allClasses, assessmentSubject]);

  const studentAssessmentsMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    (chapterAssessments || []).forEach(c => {
      if (!c.studentId) return;
      const list = map.get(c.studentId) || [];
      list.push(c);
      map.set(c.studentId, list);
    });
    return map;
  }, [chapterAssessments]);
  React.useEffect(() => {
    if (viewStudentId && selectedBabNumber) {
      const assessment = (chapterAssessments || []).find(
        (a: any) => a.studentId === viewStudentId && a.chapterNumber === Number(selectedBabNumber) && (a.subject || "Bahasa Jepang") === assessmentSubject
      );
      if (assessment) {
        setGradingStatus(assessment.status || "Belum Belajar");
        setScoreKotoba(assessment.details?.kotoba ?? assessment.details?.aritmatika ?? "");
        setScoreBumpo(assessment.details?.bumpo ?? assessment.details?.rasio ?? "");
        setScoreKaiwa(assessment.details?.kaiwa ?? assessment.details?.spasial ?? "");
        setScoreKanji(assessment.details?.kanji ?? assessment.details?.logika ?? "");
        setGradingNotes(assessment.notes || "");
      } else {
        setGradingStatus("Belum Belajar");
        setScoreKotoba("");
        setScoreBumpo("");
        setScoreKaiwa("");
        setScoreKanji("");
        setGradingNotes("");
      }
    }
  }, [viewStudentId, selectedBabNumber, assessmentSubject, chapterAssessments]);

  const hasInitializedBabRef = React.useRef({ studentId: "", subject: "" });

  React.useEffect(() => {
    if (viewStudentId) {
      if (hasInitializedBabRef.current.studentId === viewStudentId && hasInitializedBabRef.current.subject === assessmentSubject) {
        return;
      }
      const targetStudent = activeStudents.find(s => s.id === viewStudentId);
      if (targetStudent) {
        const studentAsss = (studentAssessmentsMap.get(viewStudentId) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
        const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (targetStudent.class || "").trim().toLowerCase());
        const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
        const trulyActiveChapters = getClassChaptersList(targetStudent.class || "", assessmentSubject, false);
        const rawStudentChapter = targetStudent?.currentChapter;
        const studentChapter = getResolvedChapterNum(targetStudent.class || "", rawStudentChapter, assessmentSubject);

        const rawClassActiveChapter = classObj?.[activeChapterNumKey];
        const hasClassActive = rawClassActiveChapter !== undefined && rawClassActiveChapter !== null;
        const classActiveChapter = getResolvedChapterNum(targetStudent.class || "", rawClassActiveChapter, assessmentSubject);

        let nextTarget = 1;
        if (studentChapter) {
          nextTarget = studentChapter;
        } else if (hasClassActive) {
          nextTarget = classActiveChapter || 1;
        } else {
          nextTarget = trulyActiveChapters[0]?.number || 1;
          for (const ch of trulyActiveChapters) {
            const asses = studentAsss.find((c: any) => c.chapterNumber === ch.number);
            if (!asses || asses.status !== "Telah Dinilai") {
              nextTarget = ch.number;
              break;
            }
          }
        }
        setSelectedBabNumber(Number(nextTarget));
        hasInitializedBabRef.current = { studentId: viewStudentId, subject: assessmentSubject };
      }
    }
  }, [viewStudentId, assessmentSubject, activeStudents, studentAssessmentsMap, allClasses, getClassChaptersList]);


  const studentAttendanceMap = React.useMemo(() => {
    const map = new Map<string, any[]>();
    (attendanceRecords || []).forEach(r => {
      if (r.studentId) {
        const listId = map.get(r.studentId) || [];
        listId.push(r);
        map.set(r.studentId, listId);
      }
      if (r.studentName) {
        const listName = map.get(r.studentName) || [];
        listName.push(r);
        map.set(r.studentName, listName);
      }
    });
    return map;
  }, [attendanceRecords]);

  const isAlumniClass = React.useMemo(() => {
    if (!activeStudentClass) return false;
    if (activeStudentClass.toLowerCase().includes("alumni")) return true;
    const lmsClasses = allClasses;
    const foundClass = lmsClasses.find((c: any) => c.name.toLowerCase() === activeStudentClass.toLowerCase() || c.id.toLowerCase() === activeStudentClass.toLowerCase());
    return foundClass?.type === "alumni";
  }, [activeStudentClass, allClasses]);

  const currentChapterObj = React.useMemo(() => {
    if (!activeStudentClass) return null;
    const chapters = getClassChaptersList(activeStudentClass, assessmentSubject, true);
    return chapters.find((ch: any) => ch.number === selectedBabNumber);
  }, [activeStudentClass, assessmentSubject, selectedBabNumber, allClasses]);

    // Get real quizzes from systemState
  const realQuizzes = systemState?.lmsQuizzes || [];
  const quizQuestions = realQuizzes.filter(q => q.subject === "Bahasa Jepang" || q.subject === "SSW");
  
  // Group into practice packets (10 per packet)
  const practicePackets = [];
  for (let i = 0; i < realQuizzes.length; i += 10) {
    const packetQuestions = realQuizzes.slice(i, i + 10).map((q, idx) => ({
      id: q.id,
      q: q.question,
      options: q.options || [],
      correct: q.correctAnswerIndex || 0,
      desc: "Jawaban yang benar adalah opsi ke-" + ((q.correctAnswerIndex || 0) + 1),
      type: q.questionType || "pilihan_ganda"
    }));
    practicePackets.push({
      id: "paket-" + (i / 10 + 1),
      name: "Paket " + (i / 10 + 1) + " (" + packetQuestions.length + " Soal)",
      subject: "Campuran",
      questions: packetQuestions
    });
  }
  const handleAbsenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAbsen(true);
    setAbsenMsg("");

    const payload = {
      studentId: matchingStudent?.id || currentUser?.username || "SIS-099",
      studentName: currentUser?.name || "Siswa Luar",
      status: absenStatus,
      type: absenType, // Masuk / Pulang
      subject: absenSubject,
      year: absenYear,
      notes: absenNotes,
      location: absenLocation,
      photo: absenPhoto,
      role: currentUser?.role,
      date: new Date().toISOString(),
      class: matchingStudent?.class || currentUser?.assignedClass || "Umum",
      sensei: matchingStudent?.sensei || "Tidak Terplot"
    };

    const isSuccess = await onAddAttendance(payload);
    setIsSubmittingAbsen(false);

    if (isSuccess) {
      setAbsenMsg(`Presensi ${absenType} (${absenStatus}) berhasil terekam real-time!`);
      setAbsenNotes("");
      setAbsenPhoto(null);
    } else {
      setAbsenMsg("Gagal melakukan absensi. Coba lagi.");
    }
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAbsenLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setAbsenLocation("Gagal mendapatkan lokasi");
          setIsGettingLocation(false);
        }
      );
    } else {
      setAbsenLocation("Browser tidak mendukung GPS");
      setIsGettingLocation(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Gagal mengakses kamera");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setAbsenPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isQuizSubmitted) return;
    setSelectedOption(index);
  };

  const handleQuizSubmit = () => {
    if (isQuizSubmitted) return;
    const currentQ = quizQuestions[quizIndex];
    if (currentQ?.questionType === "essay") {
      if (!essayAnswer.trim()) return;
      setIsQuizSubmitted(true);
      // For essay, we assume correct or maybe no score impact for now, 
      // but let's give partial/full point just for completing it.
      setQuizScore(prev => prev + Math.round(100 / (quizQuestions.length || 1)));
    } else {
      if (selectedOption === null) return;
      setIsQuizSubmitted(true);
      if (selectedOption === currentQ?.correctAnswerIndex) {
        setQuizScore(prev => prev + Math.round(100 / (quizQuestions.length || 1)));
      }
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setEssayAnswer("");
    setIsQuizSubmitted(false);
    if (quizIndex < quizQuestions.length - 1) {
      setQuizIndex(prev => prev + 1);
    } else {
      setShowQuizResults(true);
    }
  };

  const handleResetQuiz = () => {
    setQuizIndex(0);
    setSelectedOption(null);
    setIsQuizSubmitted(false);
    setQuizScore(0);
    setShowQuizResults(false);
  };

  const isSiswa = currentUser?.role === "Siswa" || currentUser?.role === "Alumni";
  const isAlumniUser = currentUser?.role === "Alumni";
  const hasNoClass = (currentUser?.role === "Siswa" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot")) ||
                     (currentUser?.role === "Alumni" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot" || !isAlumniClass)) ||
                     (currentUser?.role === "Pengajar" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot" || activeStudentClass === "Belum ada kelas"));

  if (currentUser?.role === "Pengajar" && (!activeStudentClass || activeStudentClass.trim() === "" || activeStudentClass === "Belum Diplot" || activeStudentClass === "Belum ada kelas")) {
    return (
      <div className="space-y-6 py-6 text-left animate-fade-in">
        <div className="bg-gradient-to-r from-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-15">
            <Users className="h-44 w-44" />
          </div>
          <div className="relative max-w-xl space-y-2">
            <span className="bg-rose-500/30 text-rose-200 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Akses Terbatas: Pengajar Belum Diplot
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Halo, Sensei {currentUser?.name || "Agus Sensei"}!</h2>
            <p className="text-xs text-indigo-100 font-light leading-relaxed">
              Anda masuk dengan akun sebagai <strong>Sensei (Pengajar)</strong>, namun Anda belum diploting untuk mengampu kelas manapun oleh Admin SCI di database.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-2xl mx-auto my-6 shadow-xs space-y-5">
          <div className="mx-auto w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-150 text-2xl animate-bounce">
            ⚠️
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-display font-black text-slate-900 text-base">Belum Ada Sesi Kelas yang Diampu</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Karena Anda belum diplot untuk mengajar kelas tertentu di <strong>Admin Desk</strong>, saat ini Anda tidak dapat melihat materi harian, mengoreksi tugas, atau melakukan absensi kelas di LMS.
            </p>
          </div>
          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 text-left space-y-1.5 max-w-lg mx-auto">
            <h5 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">💡 Apa yang harus dilakukan?</h5>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Silakan hubungi <strong>Admin LPK SCI / Sensei Utama</strong> untuk memploting Anda (<strong>{currentUser?.name || "Agus Sensei"}</strong>) sebagai pengajar di salah satu kelas aktif melalui panel <strong>Manajemen Pengajar / Manajemen Kelas</strong> di Admin Desk. Setelah diplot, akses LMS kelas Anda akan terbuka secara otomatis baik di desktop maupun mobile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminOrVvip && !selectedClassForLms && !currentUser?.assignedClass && !viewStudent) {
    return (
      <div className="space-y-6 py-6 text-left animate-fade-in">
        <div className="bg-gradient-to-r from-slate-800 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-15">
            <Users className="h-44 w-44" />
          </div>
          <div className="relative max-w-xl space-y-2">
            <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Panel Akses E-Learning
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Pilih Kelas Belajar</h2>
            <p className="text-xs text-blue-100 font-light leading-relaxed">
              Sebagai Admin/VVIP, Anda dapat memantau progres materi dan kuis di berbagai kelas yang tersedia. Silakan pilih salah satu kelas di bawah ini.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allClasses.map((cls: any) => (
            <button
              key={cls.id || cls.name}
              onClick={() => setSelectedClassForLms(cls.name)}
              className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 p-5 rounded-2xl transition shadow-sm text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${cls.isAlumni ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"}`}>
                  <GraduationCap className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{cls.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  BAB {cls.activeChapterNum || 1} AKTIF
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {cls.isAlumni ? "Program Alumni" : "Program Diklat Reguler"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                  {cls.method || "Offline"}
                </span>
              </div>
            </button>
          ))}
          {allClasses.length === 0 && (
            <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500">Belum ada kelas yang terdaftar di sistem.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

    if (activeQuizChapterId !== null) {
    const targetClassForQuiz = activeStudentClass || currentUser?.assignedClass || "";
    const activeChaptersListForQuiz = getClassChaptersList(targetClassForQuiz, assessmentSubject, true);
    const chapter = activeChaptersListForQuiz.find(c => c.number === activeQuizChapterId);
    if (!chapter) {
      setActiveQuizChapterId(null);
      return null;
    }
    const lmsQuizzes = systemState?.lmsQuizzes || [];
    const filteredQuizzes = lmsQuizzes.filter((q: any) => String(q.chapterId) === String(chapter.number) || Number(q.chapterId) === chapter.number);
    const cbtStarted = !!cbtStartTimes[`kuis_ch_${chapter.number}`];
    const isSubmitted = filteredQuizzes.every(q => submittedQuizIds.includes(q.id));
    const isQuizDeadlinePassed = filteredQuizzes[0]?.deadline ? new Date() > new Date(filteredQuizzes[0].deadline) : false;
    const mcqQuizzes = filteredQuizzes.filter(q => q.questionType !== "essay");
    const correctMcqs = mcqQuizzes.filter(q => studentQuizAnswers[q.id] === q.correctAnswerIndex);
    const score = mcqQuizzes.length > 0 ? Math.round((correctMcqs.length / mcqQuizzes.length) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col h-[100dvh] w-screen overflow-y-auto">
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm sticky top-0 z-50">
           <button onClick={() => setActiveQuizChapterId(null)} className="flex items-center gap-2 p-2 hover:bg-slate-100 text-slate-700 rounded-lg transition">
             <ArrowLeft className="w-5 h-5" />
             <span className="font-bold text-sm">Kembali</span>
           </button>
           <div className="flex-1 text-center font-bold text-sm px-4 truncate text-slate-800">
             Kuis Bab {chapter.number}: {chapter.title}
           </div>
           <div className="w-24"></div>
        </div>
        
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-24">
           {isSubmitted ? (
             <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 text-center shadow-sm">
                <h3 className="text-emerald-800 font-extrabold text-xl mb-2">🎉 Kuis Selesai</h3>
                <p className="text-emerald-700 text-sm mb-4">Anda telah menyelesaikan kuis ini.</p>
                {mcqQuizzes.length > 0 && (
                  <div className="inline-block bg-white border border-emerald-200 rounded-xl px-6 py-4 shadow-sm mb-4">
                     <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Nilai Pilihan Ganda</p>
                     <p className="text-4xl font-black text-slate-800">{score}</p>
                  </div>
                )}
                {filteredQuizzes.some(q => q.questionType === "essay") && (
                  <p className="text-xs text-emerald-600 bg-emerald-100/50 p-3 rounded-xl inline-block font-medium">
                    ✏️ Jawaban essay Anda telah tersimpan dan akan dinilai secara manual oleh Sensei.
                  </p>
                )}
             </div>
           ) : (
             <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <h3 className="font-bold text-slate-800">Informasi Kuis</h3>
                  <p className="text-xs text-slate-500 mt-1">Jawablah semua pertanyaan di bawah ini dengan tepat.</p>
               </div>
               {filteredQuizzes[0]?.durationMinutes && (
                 <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                   <span className="text-xs font-bold text-slate-600">Sisa Waktu:</span>
                   {cbtStarted ? (
                     <CBTTimer 
                       startTime={cbtStartTimes[`kuis_ch_${chapter.number}`]} 
                       durationMinutes={filteredQuizzes[0].durationMinutes} 
                       onExpire={() => {
                         const allQuizIds = filteredQuizzes.map(q => q.id);
                         const newSubmitted = [...submittedQuizIds];
                         allQuizIds.forEach(id => {
                           if (!newSubmitted.includes(id)) newSubmitted.push(id);
                         });
                         setSubmittedQuizIds(newSubmitted);
                         setCbtStartTimes(prev => ({...prev}));
                       }} 
                     />
                   ) : (
                     <span className="text-sm font-black text-slate-800">{filteredQuizzes[0].durationMinutes}:00</span>
                   )}
                 </div>
               )}
             </div>
           )}

           {(!filteredQuizzes[0]?.durationMinutes || cbtStarted || isSubmitted || currentUser?.role !== "Siswa") ? (
             <div className="space-y-6">
                {filteredQuizzes.map((quiz, idx) => {
                  const isQSubmitted = submittedQuizIds.includes(quiz.id);
                  const selectedAns = studentQuizAnswers[quiz.id];
                  const essayAns = studentQuizEssayAnswers[quiz.id] || "";
                  const isCorrect = selectedAns === quiz.correctAnswerIndex;
                  return (
                    <div key={quiz.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-sm relative">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">Soal {idx + 1}</span>
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">
                          {quiz.questionType === "essay" ? "Essay" : "Pilihan Ganda"}
                        </span>
                      </div>
                      
                      {quiz.imageUrl && (
                        <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={quiz.imageUrl} alt="Gambar Soal Kuis" className="w-full h-auto object-contain" />
                        </div>
                      )}
                      
                      <div className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {quiz.question}
                      </div>

                      {quiz.questionType === "essay" ? (
                        <div className="space-y-2 mt-2">
                          <textarea
                            rows={3}
                            disabled={isQSubmitted || isQuizDeadlinePassed}
                            placeholder={isQuizDeadlinePassed && !isQSubmitted ? "Batas waktu pengerjaan telah berakhir." : "Ketik jawaban Anda di sini..."}
                            value={essayAns}
                            onChange={(e) => setStudentQuizEssayAnswers({...studentQuizEssayAnswers, [quiz.id]: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-indigo-500 focus:bg-white transition disabled:opacity-60"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                          {(quiz.options || []).map((opt, oIdx) => {
                            const isSelected = selectedAns === oIdx;
                            const isCorrectOpt = oIdx === quiz.correctAnswerIndex;
                            let btnStyle = "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50";
                            if (isQSubmitted) {
                              if (isCorrectOpt) {
                                btnStyle = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                              } else if (isSelected) {
                                btnStyle = "bg-rose-50 border-rose-300 text-rose-800";
                              } else {
                                btnStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
                              }
                            } else if (isSelected) {
                              btnStyle = "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold";
                            }
                            return (
                              <button
                                key={oIdx}
                                disabled={isQSubmitted || isQuizDeadlinePassed}
                                onClick={() => setStudentQuizAnswers({...studentQuizAnswers, [quiz.id]: oIdx})}
                                className={`px-4 py-3 rounded-xl text-left text-sm transition flex items-start gap-3 cursor-pointer ${btnStyle}`}
                              >
                                <span className="font-black bg-white/50 border border-black/5 text-slate-600 text-[10px] px-2 py-0.5 rounded-md uppercase shrink-0 mt-0.5">
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {isQSubmitted && quiz.questionType !== "essay" && (
                        <div className={`mt-4 p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                          isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          <span>{isCorrect ? "🎉 Jawaban Benar!" : `❌ Kurang Tepat. Jawaban yang benar adalah Opsi ${String.fromCharCode(65 + quiz.correctAnswerIndex)}.`}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isSubmitted && currentUser?.role === "Siswa" && (
                  <div className="flex justify-end pt-4 pb-12">
                    <button
                      onClick={() => {
                        const allQuizIds = filteredQuizzes.map(q => q.id);
                        const newSubmitted = [...submittedQuizIds];
                        allQuizIds.forEach(id => {
                          if (!newSubmitted.includes(id)) newSubmitted.push(id);
                        });
                        setSubmittedQuizIds(newSubmitted);
                      }}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition active:scale-95"
                    >
                      Finish Attempt (Submit)
                    </button>
                  </div>
                )}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 ml-1" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Siap untuk memulai?</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm">Waktu Anda akan dihitung mundur setelah Anda menekan tombol di bawah ini. Pastikan Anda memiliki koneksi internet yang stabil.</p>
                <button 
                  onClick={() => handleStartCbt(`kuis_ch_${chapter.number}`)} 
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition active:scale-95"
                >
                  Start Attempt
                </button>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (pdfViewerUrl) {
    const resolvedUrl = blobPdfUrl || (pdfViewerUrl.startsWith("/") ? window.location.origin + pdfViewerUrl : pdfViewerUrl);
    const embedUrl = useGoogleDocs && !pdfViewerUrl.startsWith("data:")
      ? `https://docs.google.com/gview?url=${encodeURIComponent(resolvedUrl)}&embedded=true`
      : resolvedUrl;

    return createPortal(
      <div className="fixed inset-0 bg-white z-[100000] flex flex-col h-[100dvh] w-screen">
        <div className="h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-900 text-white flex items-center justify-between px-4 shrink-0 shadow-md relative z-20">
           <button onClick={() => { 
             setPdfViewerUrl(null); 
             if (window.history.state && window.history.state.pdfViewerOpen) {
               window.history.back();
             }
           }} className="flex items-center gap-2 p-2 hover:bg-white/15 rounded-lg transition cursor-pointer font-bold text-sm">
             <ArrowLeft className="w-5 h-5" />
             <span>Kembali</span>
           </button>
           <div className="font-bold text-sm px-4 truncate max-w-[40%] sm:max-w-none">Penampil Dokumen PDF</div>
           <div className="flex items-center gap-2">
             <button
               onClick={() => downloadFile(pdfViewerUrl, "dokumen_lms.pdf")}
               className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
             >
               <Download className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Unduh PDF</span>
             </button>
             <a
               href={resolvedUrl}
               target="_blank"
               rel="noopener noreferrer"
               className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
             >
               <ExternalLink className="w-3.5 h-3.5" />
               <span>Tab Baru</span>
             </a>
           </div>
        </div>
        
        {/* Helper bar & view selector */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 shrink-0 z-10">
           <div className="flex items-center gap-1.5 min-w-0">
             <span className="text-base shrink-0">💡</span>
             <div className="flex flex-col min-w-0">
               <span className="truncate">
                 {pdfViewerUrl.startsWith("data:") 
                   ? "Dokumen terenkripsi lokal (Base64). Direndisikan langsung menggunakan engine browser." 
                   : `Mode aktif: ${useGoogleDocs ? "Google Docs Viewer (Disarankan untuk HP & Safari)" : "Penampil Langsung Browser"}`}
               </span>
               {useGoogleDocs && !pdfViewerUrl.startsWith("data:") && (window.location.hostname.includes("run.app") || window.location.hostname.includes("localhost")) && (
                 <span className="text-[10px] text-amber-700 mt-0.5 font-semibold leading-tight">
                   ⚠️ Di lingkungan preview/dev, Google Docs tidak dapat mengakses file ini secara langsung. Jika kosong, ganti ke <strong>Penampil Langsung</strong> atau klik <strong>Tab Baru / Unduh PDF</strong>.
                 </span>
               )}
             </div>
           </div>
           
           {!pdfViewerUrl.startsWith("data:") && (
             <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
               <button
                 onClick={() => setUseGoogleDocs(!useGoogleDocs)}
                 className="font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-md shadow-2xs hover:bg-emerald-50 transition cursor-pointer text-[11px] flex items-center gap-1"
               >
                 <RefreshCw className="w-3 h-3" />
                 Ganti ke {useGoogleDocs ? "Penampil Langsung" : "Google Docs Viewer"}
               </button>
             </div>
           )}
        </div>

        <div className="flex-1 w-full bg-slate-100 overflow-hidden relative">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-0 absolute inset-0 bg-white" 
            title="PDF Document Viewer"
            key={useGoogleDocs ? "gdocs" : "native"}
          />
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className="space-y-6 py-6 relative">
      {toastMessage && (
        <ToastNotification message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
      {!hideWelcomeBanner && (
      <div className={`rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden transition-all duration-350 ${
        isAlumniClass 
          ? "bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-950 border border-emerald-600/30 shadow-emerald-900/10" 
          : "bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900"
      }`}>
        <div className="absolute right-0 top-0 opacity-15">
          <BookOpen className="h-44 w-44" />
        </div>
        <div className="relative max-w-xl space-y-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
            isAlumniClass ? "bg-emerald-500/30 text-emerald-200" : "bg-blue-500/30 text-blue-200"
          }`}>
            PORTAL LMS E-BENKYOULPK SC {isAlumniClass ? "(PROGRAM ALUMNI)" : ""}
          </span>
          {isAdminOrVvip && selectedClassForLms && !viewStudent && (
            <button
              onClick={() => setSelectedClassForLms(null)}
              className="absolute top-0 right-0 bg-white/20 hover:bg-white/30 text-white text-[9px] font-black uppercase px-3 py-1 rounded-bl-2xl backdrop-blur-md transition border-l border-b border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Ganti Kelas Pantauan
            </button>
          )}

          <h2 className="font-display text-2xl md:text-3xl font-bold flex flex-wrap items-center gap-2">
            Halo, {currentUser?.name}!
            {(() => {
              const uClass = activeStudentClass || "";
              if (!uClass || uClass === "Semua" || uClass === "Semua Kelas") {
                return (
                  <span className="text-[10px] uppercase font-black tracking-widest bg-amber-500/35 text-white px-3 py-1 rounded-full border border-amber-400">
                    Semua Kelas (Monitoring)
                  </span>
                );
              }
              const uClassObj = allClasses.find(
                (c) => c.id.toLowerCase() === uClass.toLowerCase() || c.name.toLowerCase() === uClass.toLowerCase()
              );
              let displaySenseiName = "Belum diplot";
              
              // Prioritize fetching the actual Sensei user assigned to this class to ensure name is synced with Manajemen Akun & Sensei
              const senseiUser = systemState?.users?.find(
                (u: any) => u.role === "Pengajar" && (u.assignedClass || "").toLowerCase() === uClass.toLowerCase()
              );

              if (senseiUser?.name) {
                displaySenseiName = senseiUser.name;
              } else if (isSiswaOrAlumni && matchingStudent?.sensei) {
                displaySenseiName = matchingStudent.sensei;
              } else {
                const studentInClassWithSensei = (activeStudents || []).find(
                  (s: any) => (s.class || "").trim().toLowerCase() === uClass.toLowerCase() && s.sensei
                );
                if (studentInClassWithSensei?.sensei) {
                  displaySenseiName = studentInClassWithSensei.sensei;
                }
              }
              return (
                <span className="flex flex-wrap items-center gap-1.5 mt-1 lg:mt-0">
                  <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border leading-none ${
                    isAlumniClass 
                      ? "bg-emerald-500/35 text-white border-emerald-400" 
                      : "bg-blue-500/35 text-white border-blue-400"
                  }`}>
                    Plotting: {uClass}
                  </span>
                  <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-rose-500/35 text-white border border-rose-400 leading-none">
                    👨‍🏫 Sensei: {displaySenseiName}
                  </span>
                  {uClassObj?.period && (
                    <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-violet-500/35 text-white border border-violet-400 leading-none">
                      📅 Periode: {uClassObj.period}
                    </span>
                  )}
                  <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full bg-slate-500/35 text-white border border-slate-400 leading-none">
                    📍 Metode: {uClassObj?.method || "Offline"}
                  </span>
                </span>
              );
            })()}
          </h2>
        </div>
      </div>
      )}

      {initialSubTab !== "dokumen" && (
      <div className="w-full mb-6">
        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 font-mono text-left">Pilih Mata Pelajaran (Subject):</p>
        <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-2.5 rounded-3xl border border-slate-200/80">
          <button
            onClick={() => {
              setAssessmentSubject("Bahasa Jepang");
              setLessonSubject("Bahasa Jepang");
              setProgressSubject("Bahasa Jepang");
              setSelectedBabNumber(1);
            }}
            className={`flex items-center justify-start gap-4 py-3.5 px-5 rounded-2xl border text-sm transition-all duration-200 active:scale-95 cursor-pointer text-left ${
              assessmentSubject === "Bahasa Jepang"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black"
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            <span className="text-2xl filter drop-shadow-xs shrink-0">🇯🇵</span>
            <div className="leading-none flex-1">
              <span className="block text-xs font-black uppercase tracking-tight">Bahasa Jepang</span>
              <span className="block text-[8px] font-mono mt-1 opacity-80 uppercase tracking-widest">Materi &amp; 25 Bab Tata Bahasa</span>
            </div>
            {assessmentSubject === "Bahasa Jepang" && (
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
            )}
          </button>

          <button
            onClick={() => {
              setAssessmentSubject("SSW");
              setLessonSubject("SSW");
              setProgressSubject("SSW");
              setSelectedBabNumber(1);
            }}
            className={`flex items-center justify-start gap-4 py-3.5 px-5 rounded-2xl border text-sm transition-all duration-200 active:scale-95 cursor-pointer text-left ${
              assessmentSubject === "SSW"
                ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-black"
                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
            }`}
          >
            <span className="text-2xl filter drop-shadow-xs shrink-0">📐</span>
            <div className="leading-none flex-1">
              <span className="block text-xs font-black uppercase tracking-tight">Matematika (SSW)</span>
              <span className="block text-[8px] font-mono mt-1 opacity-80 uppercase tracking-widest">Materi &amp; 25 Bab Berhitung</span>
            </div>
            {assessmentSubject === "SSW" && (
              <span className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Segment tabs */}
      {initialSubTab !== "dokumen" && (
      <div className="w-full">
        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-2 font-mono text-left">Pilih Menu Pembelajaran:</p>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
          {[
            {
              id: "bab",
              name: `Materi & ${currentClassMaxBab} Bab`,
              desc: "Kurikulum Terstruktur",
              ic: GraduationCap,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
              actColor: "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15",
              isActive: activeSubTab === "bab",
              onClick: () => setActiveSubTab("bab")
            },
            {
              id: "absen",
              name: "Absen Harian",
              desc: "Presensi Real-time",
              ic: Calendar,
              color: "text-amber-600",
              bg: "bg-amber-50",
              actColor: "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-600/15",
              isActive: activeSubTab === "absen",
              onClick: () => setActiveSubTab("absen")
            },
            ...(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP" ? [
              {
                id: "progress",
                name: "Progress & Nilai",
                desc: "Rekap Evaluasi",
                ic: Award,
                color: "text-rose-600",
                bg: "bg-rose-50",
                actColor: "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/15",
                isActive: activeSubTab === "progress" && progressTabMode !== "sikap",
                onClick: () => {
                  setActiveSubTab("progress");
                  if (progressTabMode === "sikap") {
                    setProgressTabMode("penilaian_bab");
                  }
                }
              },
              {
                id: "sikap",
                name: "Kelayakan Order Job",
                desc: "Evaluasi 5S & Sikap",
                ic: Star,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                actColor: "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/15",
                isActive: activeSubTab === "progress" && progressTabMode === "sikap",
                onClick: () => {
                  setActiveSubTab("progress");
                  setProgressTabMode("sikap");
                }
              }
            ] : [])
          ].map((tab) => {
            const Icon = tab.ic;
            const isActive = tab.isActive;

            return (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                  isActive
                    ? tab.actColor
                    : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <span className={`p-2 rounded-lg shrink-0 transition ${isActive ? "bg-white/20 text-white" : tab.bg + " " + tab.color}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1 leading-none select-none">
                  <span className={`block text-[10px] font-black uppercase tracking-tight ${isActive ? "text-white" : "text-slate-800"}`}>{tab.name}</span>
                  <span className={`block text-[8px] font-mono mt-0.5 font-bold ${isActive ? "text-white/80" : "text-slate-400"}`}>{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* Subtab Content */}
      <div className="pt-2">
        {/* Banner for inactive class - visible to staff only */}
        {!isClassActive && !isSiswaOrAlumni && (
          <div className="mb-4 p-4.5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
            <div className="flex items-start gap-3">
              <span className="h-9 w-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold text-lg">⚠️</span>
              <div>
                <h4 className="font-display font-black text-slate-900 text-xs sm:text-sm">Kelas "{activeStudentClass}" Nonaktif</h4>
                <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">Status kelas ini dinonaktifkan di Manajemen Kelas, sehingga siswa tidak dapat mengakses materi & kuis.</p>
              </div>
            </div>
            {(currentUser?.role === "Pengajar" || currentUser?.role === "VVIP" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa") && (
              <button
                type="button"
                onClick={handleToggleClassActive}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold rounded-xl shadow-md cursor-pointer transition active:scale-95 shrink-0 flex items-center gap-1 uppercase"
              >
                ⚡ Aktifkan Kelas Sekarang
              </button>
            )}
          </div>
        )}

        {/* Locked screen for students when the class is inactive - applies to "bab" and "kuis" subtabs */}
        {!isClassActive && isSiswaOrAlumni && (activeSubTab === "bab") && (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center max-w-lg mx-auto my-12 shadow-md space-y-4 animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center border border-rose-100 text-2xl animate-bounce">
              🔒
            </div>
            <div className="space-y-1.5">
              <h3 className="font-display font-black text-slate-900 text-base">LMS E-Benkyou Kelas Anda Belum Aktif</h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                Maaf, akses materi dan kuis untuk kelas <strong className="text-indigo-600">{activeStudentClass}</strong> saat ini sedang dinonaktifkan oleh administrasi.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-left">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Informasi & Solusi:</h5>
              <p className="text-[10px] text-slate-600 font-normal leading-relaxed">
                Silakan hubungi Sensei Utama, Wali Kelas, atau bagian Akademik LPK SCI untuk melakukan aktivasi status kelas belajar Anda agar dapat kembali melanjutkan pembelajaran mandiri di LMS.
              </p>
            </div>
          </div>
        )}

        {/* SUBTAB 2: ATTENDANCE (ABSENSI) */}
        {activeSubTab === "absen" && (
          <div className="space-y-6 animate-fade-in">
            {currentUser?.role !== "Siswa" ? (
              <StudentAttendanceManager
                activeStudents={activeStudents || []}
                allClasses={allClasses || []}
                attendanceRecords={attendanceRecords || []}
                onAddAttendance={onAddAttendance}
                onUpdateState={onUpdateState}
                defaultBabNumber={selectedBabNumber}
                defaultSubject={assessmentSubject}
                defaultClass={activeStudentClass || ""}
                onViewChapters={() => setActiveSubTab("bab")}
              />
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8 pointer-events-none">
                    <Calendar className="h-40 w-40" />
                  </div>
                  <div className="max-w-xl space-y-2 relative z-10 text-left">
                    <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                      Rekapitulasi
                    </span>
                    <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-tight">
                      Riwayat Kehadiran Harian
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed font-normal">
                      Data absensi harian yang dicatat oleh Sensei pada setiap pertemuan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab("bab")}
                    className="relative z-10 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs px-5 py-3 rounded-2xl transition shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0"
                  >
                    <BookOpen className="h-4 w-4" /> Buka Tampilan Bab &amp; Materi
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                  {(() => {
                    const studentIdToMatch = matchingStudent?.id || currentUser?.studentId ;
                    const myAttendance = (attendanceRecords || []).filter(
                      (a: any) => a.studentId === studentIdToMatch || (a.studentName && a.studentName === currentUser?.name)
                    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

                    if (myAttendance.length === 0) {
                      return (
                        <div className="p-10 text-center">
                          <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center border border-slate-100 mb-3">
                            <Calendar className="w-8 h-8" />
                          </div>
                          <h4 className="font-display font-bold text-slate-700 text-sm">Belum Ada Catatan Absensi</h4>
                          <p className="text-xs text-slate-400 mt-1">Absensi Anda akan muncul di sini setelah Sensei mencatatnya.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y divide-slate-100">
                        {myAttendance.map((record: any, idx: number) => {
                          const dateObj = new Date(record.date);
                          const dateStr = dateObj.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          });
                          
                          let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
                          let StatusIcon = Calendar;
                          if (record.status === "Hadir") {
                            statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                            StatusIcon = CheckCircle;
                          } else if (record.status === "Sakit" || record.status === "Izin") {
                            statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                            StatusIcon = Clock;
                          } else if (record.status === "Alpa" || record.status === "Absen") {
                            statusColor = "bg-rose-50 text-rose-700 border-rose-200";
                            StatusIcon = X;
                          }
                          
                          return (
                            <div key={record.id || idx} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                              <div className="flex gap-4 items-start">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 \${statusColor}`}>
                                  <StatusIcon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="font-bold text-slate-800 text-sm">{dateStr}</h5>
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border \${statusColor}`}>
                                      {record.status}
                                    </span>
                                  </div>
                                  <div className="text-xs font-medium text-slate-500">
                                    {record.time ? (
                                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3"/> {record.time}</span>
                                    ) : null}
                                    {record.time && <span className="mx-1.5 opacity-30">|</span>}
                                    <span className="inline-flex items-center gap-1 font-bold text-blue-600"><BookOpen className="w-3 h-3"/> {record.subject || "-"}</span>
                                  </div>
                                  {record.notes && (
                                    <p className="text-[10px] text-slate-400 mt-1 flex gap-1">
                                      <span className="font-bold">Catatan:</span> {record.notes}
                                    </p>
                                  )}
                                  {(record.photo || record.photoUrl || record.proof) && (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        onClick={() => setViewingAttendancePhoto(record.photo || record.photoUrl || record.proof)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-extrabold border border-blue-200 transition cursor-pointer"
                                      >
                                        <img
                                          src={record.photo || record.photoUrl || record.proof}
                                          className="w-6 h-6 rounded-md object-cover border border-blue-300"
                                          alt="Bukti Presensi"
                                          referrerPolicy="no-referrer"
                                        />
                                        <span>🔍 Lihat Foto Absen</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 4: HARIAN BAB */}
        {activeSubTab === "bab" && (!isSiswaOrAlumni || isClassActive) && (
          <div className="space-y-6 animate-fade-in" id="lms-bab-section-container">

            {/* Teacher, Admin, VVIP: select student to view/assess */}
            {true && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{currentUser?.role === "Pengajar" ? "👩‍🏫" : "👥"}</span>
                    <div>
                      <h4 className="font-display font-bold text-slate-800 text-xs">
                        {currentUser?.role === "Pengajar" ? "Pilih Siswa Bimbingan" : "Data Siswa Kelas"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Daftar siswa bimbingan aktif di kelas ini beserta status progres pembelajaran.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    
                    
                    <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border whitespace-nowrap ${
                      isAlumniClass 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      Materi: {assessmentSubject}
                    </span>
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-2 pt-1.5 pb-2 scrollbar-thin scrollbar-thumb-slate-200" id="lms-teacher-student-roster">
                  {filteredActiveStudents.map((student) => {
                    const isSelected = selectedStudentId === student.id;
                    const studentAssessments = (studentAssessmentsMap.get(student.id) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                    const completed = studentAssessments.filter((c: any) => c.status === "Telah Dinilai").length;
                    const pending = studentAssessments.filter((c: any) => c.status === "Selesai Belajar").length;
                    const isAlumni = (student.class || "").toLowerCase().includes("alumni");

                    return (
                      <button
                        key={`${student.id}-${student.name}`}
                        type="button"
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`shrink-0 w-44 sm:w-56 p-3 rounded-xl border text-left transition relative cursor-pointer ${
                          isSelected
                            ? isAlumni
                              ? "bg-emerald-50 border-emerald-500 shadow-3xs ring-2 ring-emerald-100"
                              : "bg-blue-50 border-blue-500 shadow-3xs ring-2 ring-blue-100"
                            : isAlumni
                              ? "bg-emerald-50/40 hover:bg-emerald-100/95 border-emerald-200 text-emerald-900"
                              : "bg-sky-50/40 hover:bg-sky-100/90 border-sky-200 text-sky-900"
                        }`}
                      >
                        <p className={`font-black text-[13px] sm:text-sm uppercase tracking-wide truncate ${isSelected ? isAlumni ? "text-emerald-900" : "text-blue-900" : "text-slate-900"}`}>
                          {student.name}
                        </p>
                        <p className={`text-[9px] font-medium font-mono ${isAlumni ? "text-emerald-600/90" : "text-sky-600"}`}>
                          {student.id} • {student.class}
                        </p>
                        
                        <div className="flex gap-1.5 mt-2 text-[9px] font-bold">
                          {completed > 0 && (
                            <span className={`px-1 py-0.2 rounded font-extrabold ${isAlumni ? "text-emerald-700 bg-emerald-100/55" : "text-emerald-700 bg-emerald-50/50"}`} title="Selesai Dinilai">
                              {completed}⭐
                            </span>
                          )}
                          {pending > 0 && (
                            <span className="text-amber-600 bg-amber-50 px-1 py-0.2 rounded animate-pulse" title="Butuh Penilaian">
                              {pending}📝
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Overall Progress Tracker */}
            {(() => {
              const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
              const targetStudent = activeStudents.find(s => s.id === studentIdToView || s.name === currentUser?.name);
              if (!targetStudent) return null;
              
              const studentClass = activeStudentClass || targetStudent.class || "";
              const maxChapters = getClassChaptersCount(studentClass, assessmentSubject);
              const totalPossibleChapters = getClassChaptersCount(studentClass, assessmentSubject, true);
              const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
              
              const gradedAsss = studentAsss.filter((c: any) => c.status === "Telah Dinilai");
              let finishedChaptersCount = gradedAsss.length > 0 
                ? Math.max(...gradedAsss.map((a: any) => Number(a.chapterNumber) || 0))
                : 0;
              
              finishedChaptersCount = Math.min(finishedChaptersCount, maxChapters);
              
              return (
                <div className="mb-6 bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 animate-fade-in relative">
                  <div className="hidden sm:block absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-50 text-blue-700 text-[9px] font-bold px-3 py-1 rounded-full border border-blue-200 shadow-sm whitespace-nowrap z-10">
                    💡 Progress pencapaian selesai bab dihitung dari nilai tertinggi di bab terakhir yang telah dinilai Sensei
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600 shadow-3xs">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-black text-sm text-slate-800">Kemajuan {assessmentSubject}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{targetStudent.name} • {studentClass || "Semua"}</p>
                      <p className="sm:hidden mt-1 text-[9px] text-blue-600 font-bold bg-blue-50 border border-blue-100 rounded px-2 py-0.5">Progress = Bab tertinggi yang telah dinilai</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="text-xs font-black text-slate-700 whitespace-nowrap">{finishedChaptersCount} / {maxChapters} BAB AKTIF</span>
                      <div className="flex-1 sm:w-48 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-1000 shadow-sm" 
                          style={{ width: `${(finishedChaptersCount / (maxChapters || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Silabus: {maxChapters} Aktif / {totalPossibleChapters} Total Bab</span>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-tighter shadow-3xs">
                        Pencapaian: {((finishedChaptersCount / (maxChapters || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Split layout: Chapter list vs Chapter detail */}
            <div className="flex flex-col gap-6">
              
              {/* Left sidebar: grid of Bab */}
              <div className={`space-y-3 ${isSidebarCollapsed ? 'hidden' : 'w-full'}`}>
                {(() => {
                  const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                  const targetStudent = activeStudents.find(s => s.id === studentIdToView || s.name === currentUser?.name);
                  const isFukushu = targetStudent ? ((targetStudent.class || "").toUpperCase().includes("FUKUSHU") || (targetStudent.class || "").toUpperCase().includes("FUKUSU")) : false;
                  const studentClass = activeStudentClass || targetStudent?.class || "";
                  const showAll = isSiswaOrAlumni || showAllChapters;
                  const maxChapters = getClassChaptersCount(studentClass, assessmentSubject, showAll);
                  const activeChaptersList = getClassChaptersList(studentClass, assessmentSubject, showAll);

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-2">
                        <h4 className="font-display font-bold text-slate-700 text-xs flex items-center gap-1.5">
                          {assessmentSubject === "SSW" ? (
                            <Calculator className={`h-4 w-4 ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`} />
                          ) : (
                            <BookOpen className={`h-4 w-4 ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`} />
                          )} 
                          <span>Daftar Pelajaran {assessmentSubject} (Bab 1 s/d {maxChapters})</span>
                        </h4>
                        <div className="flex items-center gap-2">
                          {currentUser?.role !== "Siswa" && (
                            <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-all">
                              <input
                                type="checkbox"
                                checked={showAllChapters}
                                onChange={(e) => setShowAllChapters(e.target.checked)}
                                className="h-3 w-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span>Tampilkan Bab Nonaktif</span>
                            </label>
                          )}
                          <span className="text-[10px] text-slate-400 font-bold font-mono whitespace-nowrap">
                            Total: {maxChapters} Bab
                          </span>
                        </div>
                      </div>

                      <div className="flex overflow-x-auto scroll-smooth gap-3 pb-3 hide-scrollbar w-full" id="lms-chapters-list-scrollable">
                        {(() => {
                          const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                          
                          const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase());
                          // Find highest graded bab + 1 as recommend next step, overridden by manual activeChapterNum if set
                          const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";
                          const rawStudentChapter = targetStudent?.currentChapter;
                          const studentChapter = getResolvedChapterNum(studentClass || "", rawStudentChapter, assessmentSubject);

                          const rawClassActiveChapter = classObj?.[activeChapterNumKey];
                          const hasClassActive = rawClassActiveChapter !== undefined && rawClassActiveChapter !== null;
                          const classActiveChapter = getResolvedChapterNum(studentClass || "", rawClassActiveChapter, assessmentSubject);

                          let nextTargetChapterNum = 1;
                          if (studentChapter) {
                            nextTargetChapterNum = studentChapter;
                          } else if (hasClassActive) {
                            nextTargetChapterNum = classActiveChapter;
                          } else {
                            nextTargetChapterNum = activeChaptersList[0]?.number || 1;
                            for (const ch of activeChaptersList) {
                              const asses = studentAsss.find(c => c.chapterNumber === ch.number);
                              if (!asses || asses.status !== "Telah Dinilai") {
                                nextTargetChapterNum = ch.number;
                                break;
                              }
                            }
                          }

                          return activeChaptersList.map((chapter) => {
                            const assessment = studentAsss.find(c => c.chapterNumber === chapter.number);
                            const isSelected = selectedBabNumber === chapter.number;
                            const isCompleted = assessment?.status === "Telah Dinilai";
                            const isPending = assessment?.status === "Selesai Belajar";
                            
                            const isFukushuLocked = false;
                            const isLockedBySensei = chapter.isActive === false || Number(chapter.number) > Number(nextTargetChapterNum);
                            const isTarget = Number(chapter.number) === Number(nextTargetChapterNum);
                            const isLocked = false;
                            const classMethod = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase())?.method || "Offline";
                            let statusBadge = (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-lg whitespace-nowrap">
                                  Belum Mulai
                                </span>
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Metode: {classMethod}</span>
                              </div>
                            );
                            if (isLockedBySensei) {
                              statusBadge = (
                                <span className="text-[9px] text-amber-600 bg-amber-50 border border-amber-150 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap">
                                  🔒 Belum Mulai
                                </span>
                              );
                            } else if (isFukushuLocked) {
                              statusBadge = (
                                <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 whitespace-nowrap">
                                  🔒 Fukushu
                                </span>
                              );
                            } else if (isPending) {
                              statusBadge = (
                                <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 whitespace-nowrap animate-pulse">
                                  📝 Butuh Nilai
                                </span>
                              );
                            } else if (isCompleted) {
                              statusBadge = (
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-lg font-extrabold flex items-center gap-0.5 whitespace-nowrap">
                                  ⭐ Nilai: {assessment.score} ({assessment.grade})
                                </span>
                              );

                            } else if (isLocked) {
                              statusBadge = (
                                <span className="text-[9px] text-slate-400 bg-slate-100/50 border border-slate-150 px-1.5 py-0.5 rounded-lg font-medium whitespace-nowrap flex items-center gap-1">
                                  🔒 Antrean
                                </span>
                              );
                            } else if (chapter.number < nextTargetChapterNum) {
                              statusBadge = (
                                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-lg font-bold flex items-center gap-0.5 whitespace-nowrap">
                                  ✅ Sudah Dipelajari
                                </span>
                              );
                            } else if (isSelected || isTarget) {
                              statusBadge = <></>;
                            }

                            return (
                              <button
                                key={chapter.number}
                                type="button"
                                onClick={() => setSelectedBabNumber(chapter.number)}
                                className={`flex-shrink-0 min-w-[240px] max-w-[280px] w-fit text-left p-3 rounded-2xl border transition flex flex-col justify-between gap-3 cursor-pointer ${
                                  isLockedBySensei
                                    ? isSelected
                                      ? "bg-slate-700 text-white/90 border-slate-700 opacity-60 font-medium"
                                      : "bg-slate-100 opacity-55 border-slate-200"
                                    : isSelected
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                    : isTarget
                                    ? isAlumniClass
                                      ? "bg-emerald-50 hover:bg-emerald-100/90 border-emerald-400 ring-2 ring-emerald-100/85 shadow-sm"
                                      : "bg-blue-50 hover:bg-blue-100/90 border-blue-400 ring-2 ring-blue-100/85 shadow-sm"
                                    : isFukushuLocked
                                    ? "bg-stone-50/60 opacity-75 hover:opacity-100 border-dashed border-stone-200"
                                    : isLocked
                                    ? "bg-white opacity-60 hover:opacity-100 border-slate-150"
                                    : "bg-white hover:bg-slate-50 border-slate-150"
                                }`}
                              >
                                <div className="w-full space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`font-mono font-bold text-[10px] uppercase ${
                                      isSelected 
                                        ? isAlumniClass ? "text-emerald-400" : "text-blue-400" 
                                        : isAlumniClass ? "text-emerald-600 font-extrabold" : "text-blue-600 font-extrabold"
                                    }`}>
                                      Bab {chapter.number} / {maxChapters}
                                    </span>
                                    <span className={`text-[7px] font-black uppercase px-1 rounded-md ${
                                      isSelected ? 'bg-white/10 text-white/60 border border-white/20' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                    }`}>
                                      {classMethod}
                                    </span>
                                    {isTarget && (
                                      <span className={`text-[8px] px-1 rounded font-black uppercase ${
                                        isAlumniClass ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                      }`}>
                                        LANJUTAN
                                      </span>
                                    )}
                                    {isFukushuLocked && (
                                      <span className="text-[8px] bg-amber-100 text-amber-800 px-1 rounded font-black uppercase">
                                        REVIU
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-bold text-xs truncate leading-snug">
                                    {chapter.title}
                                  </p>
                                  <p className={`text-[10px] font-medium truncate ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                                    {chapter.japaneseTitle}
                                  </p>
                                </div>
                                <div className="self-start mt-auto">
                                  {statusBadge}
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Right panel: Details and Action form */}
              <div className="w-full">
                {(() => {
                  const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                  const targetStudent = filteredActiveStudents.find(s => s.id === studentIdToView) || filteredActiveStudents[0] || ({ id: "SIS-001", name: "Siswa LPK", class: "" } as any);
                  const studentClass = activeStudentClass || targetStudent?.class || "";
                  const activeChaptersList = getClassChaptersList(studentClass, assessmentSubject, true);
                  const chapter = activeChaptersList.find(b => b.number === selectedBabNumber) || activeChaptersList[0];
                  const assessment = chapterAssessments.find(
                    c => c.studentId === studentIdToView && c.chapterNumber === chapter.number && (c.subject || "Bahasa Jepang") === assessmentSubject
                  );

                  const isFukushu = targetStudent ? ((targetStudent.class || "").toUpperCase().includes("FUKUSHU") || (targetStudent.class || "").toUpperCase().includes("FUKUSU")) : false;
                  const maxChaptersNum = getClassChaptersCount(studentClass, assessmentSubject, true);

                  const studentAsss = (studentAssessmentsMap.get(studentIdToView) || []).filter((c: any) => (c.subject || "Bahasa Jepang") === assessmentSubject);
                  const classObj = allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase());
                  const trulyActiveChapters = getClassChaptersList(studentClass, assessmentSubject, false);
                  const activeChapterNumKey = assessmentSubject === "SSW" ? "activeMathChapterNum" : "activeChapterNum";

                  const rawStudentChapter = targetStudent?.currentChapter;
                  const studentChapter = getResolvedChapterNum(studentClass || "", rawStudentChapter, assessmentSubject);

                  const rawClassActiveChapter = classObj?.[activeChapterNumKey];
                  const hasClassActive = rawClassActiveChapter !== undefined && rawClassActiveChapter !== null;
                  const classActiveChapter = getResolvedChapterNum(studentClass || "", rawClassActiveChapter, assessmentSubject);

                  let nextTargetChapterNum = 1;
                  if (studentChapter) {
                    nextTargetChapterNum = studentChapter;
                  } else if (hasClassActive) {
                    nextTargetChapterNum = classActiveChapter;
                  } else {
                    nextTargetChapterNum = trulyActiveChapters[0]?.number || 1;
                    for (const ch of trulyActiveChapters) {
                      const asses = studentAsss.find(c => c.chapterNumber === ch.number);
                      if (!asses || asses.status !== "Telah Dinilai") {
                        nextTargetChapterNum = ch.number;
                        break;
                      }
                    }
                  }

                  const isLockedBySensei = chapter?.isActive === false || Number(chapter?.number) > Number(nextTargetChapterNum);
                  const isLockedByProgress = false;

                  const userRole = currentUser?.role as any;
                  const canManageChapter = userRole === "Pengajar" || 
                                           userRole === "Admin" || 
                                           userRole === "Admin Super" || 
                                           userRole === "Admin Biasa" || 
                                           userRole === "VVIP" || 
                                           userRole === "VIP";

                  return (
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6" id="lms-chapter-detail-widget">
                      {/* Chapter Title block */}
                      <div className="border-b border-slate-100 pb-4 space-y-1.5 text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors" title={isSidebarCollapsed ? "Tampilkan Daftar Bab" : "Sembunyikan Daftar Bab"}>
                            <PanelLeftClose className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`} />
                          </button>
                          <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-md tracking-wider border inline-block ${
                            isAlumniClass ? "bg-emerald-50 text-emerald-700 border-emerald-150/70" : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                            {assessmentSubject.toUpperCase()} • BAB {chapter.number} DARI {maxChaptersNum}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-md tracking-wider border inline-block bg-slate-50 text-slate-600 border-slate-200">
                            {allClasses.find(c => (c.name || "").trim().toLowerCase() === (studentClass || "").trim().toLowerCase())?.method || "Offline"}
                          </span>
                        </div>
                        <h3 className="font-display font-extrabold text-slate-950 text-lg sm:text-xl leading-snug">
                          {chapter.title}
                        </h3>
                        <p className={`text-sm font-extrabold font-display ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`}>
                          🇯🇵 {chapter.japaneseTitle}
                        </p>
                      </div>
                      
                      {/* Chapter Syllabus Outline */}
                      <div className="space-y-2 text-left">
                        <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Silabus Pembelajaran</h5>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150/60 text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                          {chapter.description}
                        </div>
                      </div>


                      {/* Materi Belajar untuk Bab Ini */}
                      {isLockedBySensei || isLockedByProgress ? (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-600 shadow-3xs">
                            <Lock className="h-8 w-8" />
                          </div>
                          <div className="space-y-2 max-w-md mx-auto">
                            <h4 className="font-display font-extrabold text-slate-800 text-sm sm:text-base">
                              {isLockedBySensei ? "Akses Bab Belum Dibuka Oleh Sensei 🔒" : "Selesaikan Bab Sebelumnya Terlebih Dahulu 📖"}
                            </h4>
                            <p className="text-xs text-slate-500 font-normal leading-relaxed font-sans">
                              {isLockedBySensei 
                                ? `Materi Bab ${chapter.number} belum dibuka aksesnya oleh Sensei. Silakan selesaikan tugas harian Anda dan temui Sensei Utama untuk membuka akses Bab ini.` 
                                : `Anda perlu menyelesaikan dan mendapatkan penilaian untuk Bab ${nextTargetChapterNum} sebelum dapat mempelajari Bab ${chapter.number}. Silakan fokus pada materi target Anda hari ini.`}
                            </p>
                            {isLockedBySensei && canManageChapter && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleActivateChapterInLms(studentClass, chapter.number);
                                }}
                                className="mt-6 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[13px] rounded-2xl transition-all shadow-xl shadow-indigo-200/50 active:scale-95 flex items-center gap-2 mx-auto cursor-pointer uppercase"
                              >
                                <Unlock className="h-5 w-5" /> Aktifkan Bab {chapter.number}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 pt-2">
                          {/* Active chapter status banner for teachers/admins/VVIP/VIP */}
                          {canManageChapter && chapter.number === classActiveChapter && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-600 text-sm animate-pulse">🟢</span>
                                <span className="text-xs font-bold text-slate-700">Bab {chapter.number} Aktif & Sedang Dipelajari</span>
                              </div>
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleDeactivateChapterInLms(studentClass, chapter.number);
                                }}
                                className="px-2.5 py-1 text-[9px] font-black text-rose-600 hover:text-white bg-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all uppercase cursor-pointer"
                              >
                                🔒 Nonaktifkan Bab
                              </button>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-display font-extrabold text-slate-900">
                              Materi & Rujukan
                            </h4>
                            <p className="text-[10px] text-slate-500 font-normal">
                              Pelajaran pendamping untuk bab ini.
                            </p>
                          </div>
                          {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Tambah Materi */}
                              <button 
                                onClick={() => {
                                  setSelectedLessonToEdit(null);
                                  setLessonSubject(assessmentSubject);
                                  setLessonTitle("");
                                  setLessonJapaneseTitle("");
                                  setLessonDifficulty("Dasar");
                                  setLessonContentType("text_only");
                                  setLessonContent("");
                                  setLessonVideoUrl("");
                                  setLessonSlidesUrl("");
                                  setLessonBookUrl("");
                                  setLessonIsLocked(false);
                                  setLessonError("");
                                  setLessonDeadline("");
                                  setLessonDurationMinutes("");
                                  setLessonTargetClass(activeStudentClass || "Semua");
                                  setIsLessonFormOpen(true);
                                  // Set the new bab number for the form
                                  setSelectedBabNumber(chapter.number);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Materi</span>
                              </button>

                              {/* Tambah Kuis */}
                              <button 
                                onClick={() => {
                                  const defaultQ = {
                                    subject: assessmentSubject,
                                    questionType: "pilihan_ganda",
                                    question: "",
                                    options: ["", "", "", ""],
                                    correctAnswerIndex: 0,
                                    chapterNumber: chapter.number,
                                    deadline: "",
                                    durationMinutes: "",
                                    imageUrl: "",
                                    videoUrl: "",
                                    audioUrl: ""
                                  };
                                  setNewQuiz(defaultQ);
                                  setQuizBatch([defaultQ]);
                                  setSelectedBatchIndex(0);
                                  setBatchDeadline("");
                                  setBatchDurationMinutes("");
                                  setBatchTargetClass(activeStudentClass || "Semua");
                                  setIsQuizFormOpen(true);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Kuis / Soal</span>
                              </button>

                              {/* Tambah Tugas */}
                              <button 
                                onClick={() => {
                                  setSelectedLessonToEdit(null);
                                  setLessonSubject(assessmentSubject);
                                  setLessonTitle(`Tugas Mandiri Bab ${chapter.number}`);
                                  setLessonJapaneseTitle("");
                                  setLessonDifficulty("Tugas");
                                  setLessonContentType("text_only");
                                  setLessonContent("Silakan ketik petunjuk tugas mandiri/PR di sini...");
                                  setLessonVideoUrl("");
                                  setLessonSlidesUrl("");
                                  setLessonBookUrl("");
                                  setLessonIsLocked(false);
                                  setLessonError("");
                                  setLessonDeadline("");
                                  setLessonDurationMinutes("");
                                  setLessonTargetClass(activeStudentClass || "Semua");
                                  setIsLessonFormOpen(true);
                                  setSelectedBabNumber(chapter.number);
                                }}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Tugas</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {(() => {
                          const lessons = lmsLessons || systemState?.lmsLessons || [];
                          const studentIdToView = selectedStudentId || (currentUser?.studentId || "SIS-001");
                          const targetStudent = filteredActiveStudents.find(s => s.id === studentIdToView) || filteredActiveStudents[0] || ({ id: "SIS-001", name: "Siswa LPK", class: "" } as any);
                          const studentClass = activeStudentClass || targetStudent?.class || "";
                          const isStaffViewer = ["Admin", "Admin Super", "Admin Biasa", "Pengajar", "VVIP"].includes(currentUser?.role || "");
                          const targetViewerClass = isStaffViewer && selectedClassFilter !== "Semua" && selectedClassFilter !== "Semua Kelas" 
                            ? selectedClassFilter.trim().toLowerCase() 
                            : (studentClass || "").trim().toLowerCase();
                          
                          // Match subject and chapterNumber and class
                          const filteredLessons = lessons.filter(l => {
                            const normalizedTargetClass = (l.targetClass || "Semua").trim().toLowerCase();
                            const matchClass = isStaffViewer && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas")
                              ? true
                              : (normalizedTargetClass === "semua" || normalizedTargetClass === targetViewerClass);
                            return l.subject === assessmentSubject && l.chapterNumber === chapter.number && matchClass;
                          });

                          // Fetch quizzes for this chapter and subject and class
                          const filteredQuizzes = (systemState?.lmsQuizzes || []).filter(q => {
                            const normalizedTargetClass = (q.targetClass || "Semua").trim().toLowerCase();
                            const matchClass = isStaffViewer && (selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas")
                              ? true
                              : (normalizedTargetClass === "semua" || normalizedTargetClass === targetViewerClass);
                            return q.chapterNumber === chapter.number && q.subject === assessmentSubject && matchClass;
                          });

                          if (filteredLessons.length === 0 && filteredQuizzes.length === 0) {
                            return (
                              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-normal leading-relaxed">
                                Tidak ada materi khusus maupun kuis untuk Bab ini.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-6">
                              {/* Lessons Section */}
                              {filteredLessons.length > 0 && (
                                <div className="space-y-4">
                                  {filteredLessons.map((lesson, idx) => {
                                    const isExpanded = expandedLessons.includes(lesson.id);
                                    const isLockedBySensei = lesson.isLocked && currentUser?.role === "Siswa";
                                    const isLessonDeadlinePassed = lesson.deadline ? new Date() > new Date(lesson.deadline) : false;
                                    
                                    return (
                                      <div key={lesson.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden transition-all duration-200">
                                        
                                        <div 
                                          className="p-4 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition" 
                                          onClick={() => toggleLessonExpanded(lesson.id)}
                                        >
                                          <div className="flex-1 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase border bg-slate-50 text-slate-700 border-slate-200">
                                                {lesson.contentType === "video" ? "🎬 Video" :
                                                lesson.contentType === "slide" ? "📽️ Slide PPT" :
                                                lesson.contentType === "buku" ? "📚 Rujukan Buku" :
                                                lesson.contentType === "audio" ? "🎙️ Rekaman Suara" :
                                                "📝 Tulis"}
                                              </span>
                                              {lesson.difficulty && (
                                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                                                  {lesson.difficulty}
                                                </span>
                                              )}
                                              {lesson.deadline && (
                                                isLessonDeadlinePassed ? (
                                                  <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-md border border-red-700 flex items-center gap-1 animate-pulse">
                                                    ⏳ Batas Terlewati: {new Date(lesson.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                                  </span>
                                                ) : (
                                                  <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 animate-pulse">
                                                    ⏳ Batas: {new Date(lesson.deadline).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                                                  </span>
                                                )
                                              )}
                                              {lesson.durationMinutes && (
                                                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                                                  ⏱️ Durasi: {lesson.durationMinutes} mnt
                                                </span>
                                              )}
                                              {lesson.isLocked && (
                                                <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1 uppercase">
                                                  <Lock className="w-3 h-3" /> Dikunci
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">{lesson.title}</h4>
                                              {lesson.japaneseTitle && (
                                                <p className="text-[10px] text-blue-600 font-bold font-display mt-0.5">{lesson.japaneseTitle}</p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5">
                                            {(currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                  onClick={() => {
                                                    handleOpenEditLesson(lesson);
                                                    setSelectedBabNumber(chapter.number);
                                                  }}
                                                  className="p-1.5 text-blue-600 bg-blue-50 border border-blue-150 hover:bg-blue-100 rounded-lg transition cursor-pointer shadow-3xs flex items-center justify-center"
                                                  title="Edit Materi"
                                                >
                                                  <Edit3 className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleLessonDelete(lesson.id, lesson.title)}
                                                  className="p-1.5 text-rose-600 bg-rose-50 border border-rose-150 hover:bg-rose-100 rounded-lg transition cursor-pointer shadow-3xs flex items-center justify-center"
                                                  title="Hapus Materi"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                              </div>
                                            )}
                                            
                                            <div className="text-slate-400 bg-slate-100 p-1.5 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600 transition">
                                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Body */}
                                        {isExpanded && !isLockedBySensei && (
                                          <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50 animate-fade-in">
                                            {isLessonDeadlinePassed && currentUser?.role === "Siswa" && (
                                              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold rounded-xl flex items-center gap-1.5 shadow-2xs">
                                                <span>⚠️ Batas waktu mempelajari materi ini telah berakhir ({new Date(lesson.deadline || "").toLocaleString("id-ID")}).</span>
                                              </div>
                                            )}
                                            {lesson.contentType === "video" && lesson.videoUrl && (
                                              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-black">
                                                {lesson.videoUrl.includes("youtube.com") || lesson.videoUrl.includes("youtu.be") || lesson.videoUrl.includes("vimeo.com") || lesson.videoUrl.includes("embed") ? (
                                                  <iframe src={lesson.videoUrl} className="w-full h-full" allowFullScreen referrerPolicy="no-referrer" title={lesson.title} />
                                                ) : (
                                                  <video src={lesson.videoUrl} controls className="w-full h-full" />
                                                )}
                                              </div>
                                            )}

                                            {lesson.contentType === "slide" && lesson.slidesUrl && (
                                              <div className="relative aspect-video sm:aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 shadow-3xs bg-slate-50">
                                                <iframe src={lesson.slidesUrl} className="absolute top-0 left-0 w-full h-full animate-fade-in" style={{ objectFit: 'contain' }} allowFullScreen referrerPolicy="no-referrer" title={lesson.title} />
                                              </div>
                                            )}

                                            {lesson.contentType === "buku" && lesson.bookUrl && (
                                              <div className="space-y-3">
                                                <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-200/60 p-4 rounded-xl flex items-center justify-between gap-3 text-left">
                                                  <div className="flex items-center gap-3">
                                                    <span className="h-9 w-9 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded-xl font-bold text-base">📚</span>
                                                    <div>
                                                      <p className="font-bold text-[11px] text-slate-800">Dokumen Pendukung</p>
                                                      <p className="text-[9px] text-slate-500">Materi PDF / Docs</p>
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                      type="button"
                                                      onClick={() => downloadFile(lesson.bookUrl, `${lesson.title || "Dokumen_Materi"}.pdf`)}
                                                      className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 text-center flex items-center gap-1 cursor-pointer"
                                                      title="Unduh File Dokumen"
                                                    >
                                                      <Download className="w-3 h-3" />
                                                      <span>Unduh</span>
                                                    </button>
                                                    <button onClick={() => setPdfViewerUrl(lesson.bookUrl)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition active:scale-95 shadow-2xs shrink-0 text-center cursor-pointer">Buka PDF</button>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            {lesson.contentType === "audio" && lesson.audioData && (
                                              <div className="bg-gradient-to-r from-indigo-500/5 to-blue-500/5 border border-indigo-200/60 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-4 text-left shadow-3xs">
                                                <div className="flex items-center gap-3">
                                                  <div className="h-10 w-10 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full font-bold shadow-sm">
                                                    🎙️
                                                  </div>
                                                  <div>
                                                    <p className="font-bold text-[11px] text-slate-800">Rekaman Suara / Audio</p>
                                                    <p className="text-[9px] text-slate-500">Dengarkan materi bahasa Jepang</p>
                                                  </div>
                                                </div>
                                                <div className="w-full sm:flex-1">
                                                  <audio src={lesson.audioData} controls className="w-full h-10" />
                                                </div>
                                              </div>
                                            )}
                                            
                                            {lesson.content && (
                                              <div className="bg-white p-4 rounded-xl whitespace-pre-line text-xs font-normal text-slate-700 leading-relaxed border border-slate-200 shadow-3xs relative group/content">
                                                <button
                                                  onClick={() => {
                                                    if ('speechSynthesis' in window) {
                                                      const utterance = new SpeechSynthesisUtterance(lesson.content);
                                                      utterance.lang = lesson.subject === "Bahasa Jepang" ? 'ja-JP' : 'id-ID';
                                                      window.speechSynthesis.speak(utterance);
                                                    }
                                                  }}
                                                  className="absolute top-2 right-2 p-1.5 bg-slate-100 text-slate-600 rounded-lg opacity-0 group-hover/content:opacity-100 transition shadow-3xs hover:bg-indigo-100 hover:text-indigo-600 cursor-pointer"
                                                  title="Dengarkan Materi"
                                                >
                                                  <Volume2 className="h-3 w-3" />
                                                </button>
                                                <div className="pr-6">{lesson.content}</div>
                                              </div>
                                            )}

                                            {/* Panel Tugas untuk Siswa / Guru */}
                                            {lesson.difficulty === "Tugas" && (
                                              <div className="mt-4 p-4 rounded-2xl border border-slate-150 bg-white space-y-4">
                                                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 font-bold">
                                                    <GraduationCap className="w-4 h-4" />
                                                  </span>
                                                  <div>
                                                    <h5 className="font-display font-extrabold text-xs text-slate-800">Panel Tugas & Pengumpulan</h5>
                                                    <p className="text-[10px] text-slate-400">Semua upload tugas berupa file PDF atau Gambar (PNG/JPEG).</p>
                                                  </div>
                                                </div>

                                                {currentUser?.role === "Siswa" ? (
                                                  // SISWA INTERFACE
                                                  (() => {
                                                    const studentId = currentUser?.studentId || currentUser?.username || "SIS-001";
                                                    const assessment = (systemState?.chapterAssessments || []).find(
                                                      (c) => c.lessonId === lesson.id && c.studentId === studentId
                                                    );

                                                    return (
                                                      <div className="space-y-4">
                                                        {/* Current Status */}
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                                                          <div className="space-y-1">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Status Pengumpulan</span>
                                                            <div className="flex items-center gap-1.5">
                                                              {assessment ? (
                                                                assessment.status === "Menunggu Penilaian" ? (
                                                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                    🟡 Menunggu Penilaian
                                                                  </span>
                                                                ) : (
                                                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                    🟢 Sudah Dinilai
                                                                  </span>
                                                                )
                                                              ) : (
                                                                <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                                                  Belum Mengumpulkan
                                                                </span>
                                                              )}
                                                            </div>
                                                          </div>

                                                          {assessment && assessment.status !== "Menunggu Penilaian" && (
                                                            <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-3 pt-2 sm:pt-0">
                                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nilai Dari Sensei</span>
                                                              <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-lg">
                                                                  {assessment.score ?? 0} / 100
                                                                </span>
                                                                {assessment.grade && (
                                                                  <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                                                                    Grade {assessment.grade}
                                                                  </span>
                                                                )}
                                                              </div>
                                                            </div>
                                                          )}
                                                        </div>

                                                        {/* Teacher Feedback Notes */}
                                                        {assessment && assessment.notes && (
                                                          <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl space-y-1">
                                                            <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">Catatan & Koreksi Sensei ({assessment.assessedBy || "Sensei"}):</span>
                                                            <p className="text-xs font-normal text-slate-700 leading-relaxed italic">"{assessment.notes}"</p>
                                                          </div>
                                                        )}

                                                        {/* Submitted File Detail */}
                                                        {assessment?.submissionUrl && (
                                                          <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                            <div className="flex items-center gap-2.5 truncate">
                                                              <span className="h-8 w-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg">
                                                                <FileText className="w-4 h-4" />
                                                              </span>
                                                              <div className="truncate">
                                                                <p className="font-bold text-xs text-slate-800 truncate">Berkas Tugas Anda</p>
                                                                <p className="text-[9px] text-slate-400">
                                                                  Diserahkan: {assessment.submissionDate ? new Date(assessment.submissionDate).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "-"}
                                                                </p>
                                                              </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                              <button
                                                                type="button"
                                                                onClick={() => downloadFile(assessment.submissionUrl, `Tugas_${assessment.studentName || "Siswa"}`)}
                                                                className="p-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition shadow-3xs cursor-pointer flex items-center justify-center"
                                                                title="Buka / Unduh Berkas"
                                                              >
                                                                <Download className="w-3.5 h-3.5" />
                                                              </button>
                                                            </div>
                                                          </div>
                                                        )}

                                                        {/* File Upload Area */}
                                                        {(!lesson.deadline || new Date() < new Date(lesson.deadline)) && (
                                                          <div className="space-y-2">
                                                            {lesson.durationMinutes && !cbtStartTimes[`tugas_${lesson.id}`] ? (
                                                              <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                                                <p className="text-sm font-bold text-slate-700">Tugas ini memiliki durasi pengerjaan CBT.</p>
                                                                <p className="text-xs text-slate-500">Durasi: {lesson.durationMinutes} Menit. Waktu akan terus berjalan meskipun aplikasi ditutup.</p>
                                                                <button onClick={() => handleStartCbt(`tugas_${lesson.id}`)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition">
                                                                  Mulai Mengerjakan Tugas
                                                                </button>
                                                              </div>
                                                            ) : (
                                                              <>
                                                                {lesson.durationMinutes && cbtStartTimes[`tugas_${lesson.id}`] && (
                                                                  <div className="mb-4 flex justify-center">
                                                                    <CBTTimer 
                                                                      startTime={cbtStartTimes[`tugas_${lesson.id}`]} 
                                                                      durationMinutes={lesson.durationMinutes} 
                                                                      onExpire={() => { setCbtStartTimes(prev => ({...prev})) }} 
                                                                    />
                                                                  </div>
                                                                )}
                                                                {(!lesson.durationMinutes || (cbtStartTimes[`tugas_${lesson.id}`] && Date.now() < cbtStartTimes[`tugas_${lesson.id}`] + lesson.durationMinutes * 60 * 1000)) ? (
                                                              <>
                                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                              {assessment ? "Kirim Ulang / Perbarui Tugas" : "Unggah Lembar Jawaban"}
                                                            </label>
                                                            <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-6 transition flex flex-col items-center justify-center text-center bg-slate-50/20 group">
                                                              <input
                                                                type="file"
                                                                accept="application/pdf,image/*"
                                                                disabled={submittingLessons[lesson.id]}
                                                                onChange={async (e) => {
                                                                  const file = e.target.files?.[0];
                                                                  if (!file) return;
                                                                  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
                                                                  if (!allowedTypes.includes(file.type)) {
                                                                    alert("Format file tidak didukung. Harap unggah file PDF atau Gambar (PNG/JPEG).");
                                                                    return;
                                                                  }
                                                                  if (file.size > 15 * 1024 * 1024) {
                                                                    alert("Ukuran file terlalu besar. Maksimal 15 MB.");
                                                                    return;
                                                                  }

                                                                  setSubmittingLessons(prev => ({ ...prev, [lesson.id]: true }));
                                                                  try {
                                                                    const url = await uploadFileToFirebase(file, "lms_assignments");
                                                                    const payload = {
                                                                      studentId,
                                                                      studentName: currentUser?.name || "Siswa LPK",
                                                                      chapterNumber: Number(lesson.chapterNumber || chapter.number),
                                                                      title: lesson.title,
                                                                      status: "Menunggu Penilaian",
                                                                      subject: lesson.subject,
                                                                      lessonId: lesson.id,
                                                                      submissionUrl: url,
                                                                      submissionDate: new Date().toISOString()
                                                                    };
                                                                    if (onUpdateState) {
                                                                      await onUpdateState("chapterAssessments", "update", payload);
                                                                      alert("Tugas berhasil diunggah!");
                                                                    }
                                                                  } catch (err) {
                                                                    console.error(err);
                                                                    alert("Gagal mengunggah tugas.");
                                                                  } finally {
                                                                    setSubmittingLessons(prev => ({ ...prev, [lesson.id]: false }));
                                                                  }
                                                                }}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                              />
                                                              {submittingLessons[lesson.id] ? (
                                                                <div className="flex flex-col items-center gap-2">
                                                                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                                                                  <p className="text-[11px] font-bold text-slate-600">Sedang mengunggah berkas tugas...</p>
                                                                </div>
                                                              ) : (
                                                                <>
                                                                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition mb-1.5" />
                                                                  <p className="text-xs font-bold text-slate-700">Tarik berkas ke sini atau klik untuk memilih</p>
                                                                  <p className="text-[9px] text-slate-400 mt-1">PDF atau Gambar (Maks. 15MB)</p>
                                                                </>
                                                              )}
                                                            </div>
                                                              </>
                                                                ) : (
                                                                    <div className="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-center font-bold text-xs shadow-3xs">
                                                                      🚫 Waktu pengerjaan tugas CBT telah habis. Anda tidak dapat mengunggah berkas lagi.
                                                                    </div>
                                                                )}
                                                              </>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    );
                                                  })()
                                                ) : (
                                                  // STAFF / TEACHER INTERFACE (Redirect to Progress Tab)
                                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
                                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                      <Award className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                      <h6 className="font-extrabold text-sm text-slate-800">Manajemen Penilaian Tugas</h6>
                                                      <p className="text-xs text-slate-500 mt-1">Penilaian tugas siswa telah dipindahkan ke menu Progress & Nilai untuk mempermudah rekapitulasi.</p>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEvalSelectedLessonId(lesson.id);
                                                        setProgressTabMode("penilaian");
                                                        setActiveSubTab("progress");
                                                      }}
                                                      className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition active:scale-95 shadow-sm inline-flex items-center gap-2"
                                                    >
                                                      Buka Panel Penilaian
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {isExpanded && isLockedBySensei && (
                                          <div className="p-8 border-t border-slate-100 text-center flex flex-col items-center justify-center bg-slate-50/50 animate-fade-in">
                                            <div className="bg-red-100 p-3 rounded-full mb-2 shadow-3xs">
                                              <Lock className="w-5 h-5 text-red-600" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">Materi Dikunci</p>
                                            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto">
                                              Silakan ikuti instruksi Sensei di kelas.
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Quizzes Section */}
                              {filteredQuizzes.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-slate-150/60 text-left">
                                  <div className="mb-2">
                                    <h4 className="font-display font-extrabold text-slate-900 text-sm">📋 Soal Latihan & Kuis Bab {chapter.number}</h4>
                                    <p className="text-[10px] text-slate-500">Kerjakan kuis interaktif di bawah untuk menguji pemahaman materi Anda.</p>
                                  </div>

                                  {currentUser?.role === "Siswa" ? (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
                                      <p className="text-sm font-bold text-slate-700">Kuis Bab {chapter.number}</p>
                                      {filteredQuizzes[0].durationMinutes && (
                                         <p className="text-xs text-slate-500">Durasi CBT: {filteredQuizzes[0].durationMinutes} Menit.</p>
                                      )}
                                      
                                      {filteredQuizzes.every(q => submittedQuizIds.includes(q.id)) ? (
                                         <button onClick={() => setActiveQuizChapterId(chapter.number)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                            Lihat Hasil Kuis
                                         </button>
                                      ) : (
                                         <button onClick={() => {
                                            setActiveQuizChapterId(chapter.number);
                                         }} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                            {cbtStartTimes[`kuis_ch_${chapter.number}`] ? "Lanjutkan Kuis CBT" : "Mulai Kerjakan Kuis"}
                                         </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-2xs text-center space-y-4">
                                      <p className="text-sm font-bold text-slate-700">Pratinjau Kuis Bab {chapter.number}</p>
                                      <button onClick={() => setActiveQuizChapterId(chapter.number)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition">
                                        Buka Penampil Kuis
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      )}

                      {/* Status indicator widget */}
                      <div className="p-4 rounded-2xl border flex items-center justify-between gap-4 text-left bg-radial" style={{ contentVisibility: "auto" }}>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metrik Kemajuan Siswa ({targetStudent.name})</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            {assessment?.status === "Telah Dinilai" ? (
                              <>
                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-bold text-emerald-800">
                                  {assessmentSubject === "SSW" ? "Telah Dinilai Instruktur SSW" : "Telah Dievaluasi Oleh Instruktur Kelisanan"}
                                </span>
                              </>
                            ) : assessment?.status === "Selesai Belajar" ? (
                              <>
                                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-amber-800">
                                  {assessmentSubject === "SSW" ? "Menunggu Verifikasi & Tes Logika SSW" : "Menunggu Verifikasi & Ujian Lisan Instruktur"}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                                <span className="text-xs font-bold text-slate-700">Belum Mengambil / Belum Lulus Bab Ini</span>
                              </>
                            )}
                          </div>
                        </div>

                        {assessment?.status === "Telah Dinilai" && (
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-4 py-2 rounded-xl text-center shrink-0">
                            <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Nilai Bab</p>
                            <p className="font-display font-black text-2xl leading-none">{assessment.score}</p>
                            <p className="text-[9px] font-extrabold mt-0.5">GRADE {assessment.grade}</p>
                          </div>
                        )}
                      </div>

                      {/* User Context Based Form */}
                      {currentUser?.role !== "Siswa" && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3 mt-6">
                          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h6 className="font-extrabold text-sm text-slate-800">Manajemen Penilaian Bab</h6>
                            <p className="text-xs text-slate-500 mt-1">Daftar dan penilaian bab siswa telah dipindahkan ke menu Progress & Nilai untuk mempermudah rekapitulasi.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProgressTabMode("penilaian_bab");
                              setActiveSubTab("progress");
                            }}
                            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition active:scale-95 shadow-sm inline-flex items-center gap-2"
                          >
                            Buka Panel Penilaian Bab
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}
        {/* SUBTAB DOKUMEN: 17 Dokumen Persyaratan & Akademik */}
        {activeSubTab === "dokumen" && (
          <div className="space-y-6 animate-fade-in text-left">
            {(() => {
              let regStudent = systemState?.registeredStudents?.find(
                (rs: any) =>
                  (currentUser?.studentId && rs.id === currentUser.studentId) ||
                  (currentUser?.email && rs.email === currentUser.email) || (currentUser?.name && rs.name === currentUser.name)
              );

              let isActiveStudentFallback = false;
              if (!regStudent) {
                const matchedActive = systemState?.activeStudents?.find(
                  (as: any) =>
                    as.id === currentUser?.studentId ||
                    (currentUser?.name && as.name === currentUser.name) ||
                    (currentUser?.email && as.email === currentUser.email)
                );
                if (matchedActive) {
                  regStudent = matchedActive;
                  isActiveStudentFallback = true;
                }
              }

              if (!regStudent) {
                return (
                  <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-amber-900">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <span>Akun Registrasi Belum Terhubung</span>
                    </div>
                    <p className="text-xs">
                      Sistem tidak mendeteksi formulir pendaftaran akademik yang terhubung dengan email Anda (<strong>{currentUser?.email}</strong>). Harap hubungi staf admin LPK Source Course Indonesia untuk menautkan akun Anda.
                    </p>
                  </div>
                );
              }

              // Calculate how many of the 17 documents have been uploaded
              const documentList = [
                { field: "docKTP", label: "KTP (Kartu Tanda Penduduk)", isRequired: true, type: "PDF" },
                { field: "docAkta", label: "Akta Kelahiran", isRequired: true, type: "PDF" },
                { field: "docIjazahSMA", label: "Ijazah SMA/SMK/Sederajat", isRequired: true, type: "PDF" },
                { field: "docTranskip", label: "Transkrip Nilai Akademik", isRequired: false, type: "PDF" },
                { field: "docKK", label: "Kartu Keluarga (KK)", isRequired: false, type: "PDF" },
                { field: "docFoto", label: "Pasfoto (Background Merah)", isRequired: false, type: "JPG" },
                { field: "docIjazahSD", label: "Ijazah SD", isRequired: false, type: "PDF" },
                { field: "docIjazahSMP", label: "Ijazah SMP/MTs", isRequired: false, type: "PDF" },
                { field: "docPraMCU", label: "Hasil Pra Medical Check-Up", isRequired: false, type: "MED" },
                { field: "docVaksin", label: "Sertifikat Vaksin Booster", isRequired: false, type: "MED" },
                { field: "docCV1", label: "Curriculum Vitae (CV) - Bagian 1", isRequired: false, type: "CV" },
                { field: "docCV2", label: "Curriculum Vitae (CV) - Bagian 2", isRequired: false, type: "CV" },
                { field: "docCV3", label: "Curriculum Vitae (CV) - Bagian 3", isRequired: false, type: "CV" },
                { field: "docCV4", label: "Curriculum Vitae (CV) - Bagian 4", isRequired: false, type: "CV" },
                { field: "docCV5", label: "Curriculum Vitae (CV) - Bagian 5", isRequired: false, type: "CV" },
                { field: "docMoU", label: "MoU Dokumen Persetujuan", isRequired: false, type: "MoU" },
                { field: "docKontrak", label: "Kontrak Kerja (JOB)", isRequired: false, type: "JOB" },
              ];

              const getRealDocValue = (val: string) => val && !val.includes("_default.") ? val : "";
              const totalUploaded = documentList.filter(d => !!getRealDocValue((regStudent as any)[d.field])).length;
              const requiredUploaded = documentList.filter(d => d.isRequired && !!getRealDocValue((regStudent as any)[d.field])).length;
              const totalRequired = documentList.filter(d => d.isRequired).length;
              const allRequiredCompleted = requiredUploaded === totalRequired;

              return (
                <div className="space-y-6">
                  {/* Summary Banner */}
                  <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8">
                      <FileText className="h-44 w-44" />
                    </div>
                    <div className="space-y-3 relative z-10 max-w-2xl">
                      <span className="text-[10px] font-mono font-extrabold uppercase bg-yellow-400 text-blue-950 px-2.5 py-1 rounded-md tracking-wider">
                        📂 Dokumen Persyaratan Akademik (17 Berkas)
                      </span>
                      <h3 className="font-display font-black text-xl sm:text-2xl leading-tight">
                        Lengkapi & Pantau Berkas Administrasi Anda
                      </h3>
                      <p className="text-xs text-blue-100 font-normal leading-relaxed">
                        Sesuai ketentuan, Anda wajib melengkapi 3 berkas utama (KTP, Akta, Ijazah SMA) terlebih dahulu saat pendaftaran. Sisa 14 dokumen lainnya (Transkrip, Pasfoto, KK, MCU, Vaksin, Kontrak Kerja, dll) dapat Anda unggah/lengkapi secara bertahap di bawah ini seiring jalannya perkuliahan.
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                        <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                          <span className="text-yellow-400 font-bold">📋 Total Terunggah:</span>
                          <span className="font-extrabold text-white font-mono">{totalUploaded} / 17 Berkas</span>
                        </div>
                        <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                          <span className="text-yellow-400 font-bold">⚠️ Syarat Wajib:</span>
                          <span className={`font-extrabold font-mono ${allRequiredCompleted ? "text-emerald-400" : "text-amber-400"}`}>
                            {requiredUploaded} / {totalRequired} Lengkap
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documentList.map((doc, idx) => {
                      const rawVal = (regStudent as any)[doc.field];
                      const currentVal = rawVal && !rawVal.includes("_default.") ? rawVal : "";
                      const badgeColor = 
                        doc.isRequired ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";

                      return (
                        <div key={doc.field} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3 hover:border-indigo-200 hover:shadow-xs transition">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none bg-slate-50">
                                #{idx + 1}
                              </span>
                              <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded border leading-none uppercase shrink-0 ${badgeColor}`}>
                                {doc.isRequired 
                                  ? "Wajib" 
                                  : doc.label.includes("Transkrip")
                                    ? "Tidak Wajib"
                                    : doc.label.includes("Kontrak Kerja")
                                      ? "Setelah Lulus"
                                      : "Bisa Menyusul"}
                              </span>
                              <span className="text-[8.5px] font-mono font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border leading-none uppercase">
                                {doc.type}
                              </span>
                            </div>
                            <h4 className="text-[11.5px] font-black text-slate-900 mt-2 truncate" title={doc.label}>
                              {doc.label}
                            </h4>
                            
                            <div className="mt-2.5 flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 text-[10px] text-slate-600 truncate font-mono">
                              <span className="text-slate-400 shrink-0">📄</span>
                              <span className="truncate" title={currentVal.includes('|') ? currentVal.split('|')[0] : (currentVal.startsWith('http') || currentVal.startsWith('data:') ? 'Berkas Terlampir' : currentVal) || "Belum dilengkapi"}>
                                {(currentVal.includes('|') ? currentVal.split('|')[0] : (currentVal.startsWith('http') || currentVal.startsWith('data:') ? 'Berkas Terlampir' : currentVal)) || "Belum dilengkapi (Silakan Unggah)"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
                            <label className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 px-2 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition text-center flex items-center justify-center gap-1">
                              <Upload className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{currentVal ? "Ganti" : "Unggah"}</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const url = await uploadFileToFirebase(file, "registrations");
                                    const updated = {
                                      ...regStudent,
                                      [doc.field]: `${file.name}|${url}`,
                                    };
                                    if (onUpdateState) {
                                      await onUpdateState(
                                        isActiveStudentFallback ? "activeStudents" : "registeredStudents",
                                        "update",
                                        updated
                                      );
                                    }
                                  } catch(err) {
                                    console.error(err);
                                    alert("Gagal mengunggah berkas.");
                                  }
                                }}
                              />
                            </label>

                            {currentVal && (
                              <button
                                type="button"
                                onClick={() => {
                                  setViewingDoc({
                                    title: doc.label,
                                    url: currentVal.includes("|") ? currentVal.split("|")[1] : currentVal,
                                  });
                                }}
                                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition text-center flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                title="Lihat Berkas"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Lihat</span>
                              </button>
                            )}

                            {currentVal && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated = {
                                    ...regStudent,
                                    [doc.field]: "",
                                  };
                                  if (onUpdateState) {
                                    await onUpdateState(
                                      isActiveStudentFallback ? "activeStudents" : "registeredStudents",
                                      "update",
                                      updated
                                    );
                                  }
                                }}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-150 transition cursor-pointer"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* SUBTAB PROGRESS: Khusus Staf Sensei */}
        {activeSubTab === "progress" && (currentUser?.role === "Pengajar" || currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-3xs">
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-fit">
                <button 
                  onClick={() => setProgressTabMode("penilaian_bab")} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${progressTabMode === "penilaian_bab" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Penilaian Bab
                </button>
                <button 
                  onClick={() => setProgressTabMode("penilaian")} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${progressTabMode === "penilaian" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Penilaian Tugas
                </button>
                <button 
                  onClick={() => setProgressTabMode("sikap")} 
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${progressTabMode === "sikap" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <Star className="w-3.5 h-3.5" />
                  Penilaian Kelayakan (5S)
                </button>
              </div>
            </div>


            
            {progressTabMode === "penilaian_bab" && (
              <div id="lms-bab-section-container" className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                    <BookOpen className="h-48 w-48" />
                  </div>
                  <div className="max-w-xl space-y-2 relative z-10">
                    <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                      Penilaian
                    </span>
                    <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-tight">
                      Evaluasi Bab & Pelajaran
                    </h3>
                    <p className="text-xs text-blue-100 leading-relaxed font-normal">
                      Pilih mata pelajaran dan bab untuk memberikan penilaian kepada siswa di kelas ini.
                    </p>
                  </div>
                </div>
                
                {(() => {
                  const chaptersList = assessmentSubject === "SSW" 
                    ? MATH_CHAPTERS_LIST 
                    : CHAPTERS_LIST;
                  const selectedBab = evalSelectedBabId !== "" ? chaptersList.find(c => c.number === evalSelectedBabId) : null;
                  
                  return (
                    <div className="space-y-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Pilih Mata Pelajaran</label>
                            <select
                              value={assessmentSubject}
                              onChange={(e) => {
                                setAssessmentSubject(e.target.value);
                                setEvalSelectedBabId("");
                              }}
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none cursor-pointer"
                            >
                              <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
                              <option value="SSW">📐 Matematika (SSW)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Pilih Bab</label>
                            <select
                              value={evalSelectedBabId}
                              onChange={(e) => setEvalSelectedBabId(e.target.value ? Number(e.target.value) : "")}
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:border-blue-500 outline-none cursor-pointer"
                            >
                              <option value="">-- Pilih Bab --</option>
                              {chaptersList.map(c => (
                                <option key={c.number} value={c.number}>Bab {c.number}: {c.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {selectedBab ? (
                                                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 text-left">
                          <div className="border-b border-slate-100 pb-4">
                            <h4 className="font-display font-black text-slate-850 text-sm tracking-tight">Daftar & Penilaian Siswa ({assessmentSubject})</h4>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Daftar siswa aktif di kelas ini. Pilih siswa di bawah untuk memasukkan nilai Bab {selectedBab.number} secara langsung.</p>
                          </div>

                          <div className="space-y-4">
                            {filteredActiveStudents.length === 0 ? (
                              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs font-normal">
                                Tidak ada siswa aktif yang terdaftar di kelas ini.
                              </div>
                            ) : (
                              paginatedBabStudents.map((student) => {
                                const isSelected = selectedStudentId === student.id;
                                const studentAssessment = (chapterAssessments || []).find(
                                  (a: any) => a.studentId === student.id && a.chapterNumber === Number(selectedBab.number) && (a.subject || "Bahasa Jepang") === assessmentSubject
                                );

                                return (
                                  <div 
                                    key={student.id} 
                                    className={`border rounded-2xl transition overflow-hidden bg-white ${
                                      isSelected 
                                        ? "border-blue-500 shadow-sm ring-2 ring-blue-50/50" 
                                        : "border-slate-200 hover:border-slate-300 shadow-3xs"
                                    }`}
                                  >
                                    {/* Student Card Header */}
                                    <div 
                                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedStudentId("");
                                        } else {
                                          setSelectedStudentId(student.id);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 select-none">
                                          {student.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="text-left">
                                          <h5 className="font-display font-bold text-sm text-slate-900 leading-tight">
                                            {student.name}
                                          </h5>
                                          <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5">
                                            ID: {student.id} • Kelas: {student.class || "-"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-start sm:self-center">
                                        {/* Status Badge */}
                                        {studentAssessment?.status === "Telah Dinilai" ? (
                                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1.5 font-mono">
                                            <span>⭐ {studentAssessment.score}</span>
                                            <span className="opacity-55">|</span>
                                            <span>GRADE {studentAssessment.grade}</span>
                                          </span>
                                        ) : studentAssessment?.status === "Selesai Belajar" ? (
                                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border bg-amber-50 text-amber-700 border-amber-100 animate-pulse">
                                            📝 Mandiri
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border bg-slate-50 text-slate-500 border-slate-200">
                                            Belum Dinilai
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          className={`px-3 py-1.5 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                                            isSelected 
                                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-3xs"
                                          }`}
                                        >
                                          {isSelected ? "Tutup" : "Beri / Edit Nilai"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Inline Assessment Form (rendered only for the active student) */}
                                    {isSelected && (
                                      <div className="border-t border-slate-100 p-5 sm:p-6 bg-slate-50/30 space-y-6 animate-fade-in text-left">
                                        
                                        {/* Score inputs panel */}
                                        <div className="space-y-5">
                                          {/* Info Box */}
                                          <div className="flex gap-3 bg-blue-50/70 text-blue-800 p-3.5 rounded-xl text-xs font-semibold leading-relaxed border border-blue-100/65">
                                            <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                                            <span>Nilai akan dihitung otomatis berdasarkan rata-rata dari ke-4 poin penilaian di bawah ini.</span>
                                          </div>

                                          {/* Evaluation Grid */}
                                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
                                            {/* Header */}
                                            <div className="hidden sm:grid grid-cols-[50px_160px_1fr_130px] gap-4 bg-slate-50/70 p-3.5 border-b border-slate-150 text-[10px] font-black text-slate-400 uppercase tracking-wider items-center">
                                              <div>No.</div>
                                              <div>Fokus Evaluasi</div>
                                              <div>Metrik Pengujian & Kelayakan</div>
                                              <div className="text-right">Nilai Poin</div>
                                            </div>

                                            {/* Row 1: Kotoba / Aritmatika */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 border-b border-slate-100 items-center">
                                              <div className="text-xs font-black text-slate-400 hidden sm:block">1</div>
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                  {assessmentSubject === "SSW" ? <Hash className="h-4 w-4 text-white" /> : "あ"}
                                                </div>
                                                <div>
                                                  <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                    {assessmentSubject === "SSW" ? "Aritmatika" : "Kotoba"}
                                                  </h5>
                                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {assessmentSubject === "SSW" ? "(Kalkulasi Desimal)" : "(Kosakata)"}
                                                  </p>
                                                </div>
                                              </div>
                                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {assessmentSubject === "SSW" 
                                                  ? "Keunggulan kalkulasi bilangan bulat, desimal, persen, konversi satuan, dan matematika dasar." 
                                                  : "Penguasaan kosakata dan pemahaman makna kata."}
                                              </p>
                                              <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={100}
                                                  placeholder="0"
                                                  value={scoreKotoba === 0 ? "" : scoreKotoba}
                                                  onChange={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (val > 100) val = 100;
                                                    if (val < 0) val = 0;
                                                    setScoreKotoba(val);
                                                  }}
                                                  className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black text-blue-600 focus:outline-none focus:border-blue-500 font-mono bg-white"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                              </div>
                                            </div>

                                            {/* Row 2: Bumpo / Rasio */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 border-b border-slate-100 items-center">
                                              <div className="text-xs font-black text-slate-400 hidden sm:block">2</div>
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                  {assessmentSubject === "SSW" ? <Percent className="h-4 w-4 text-white" /> : <MessageSquare className="h-4 w-4 text-white" />}
                                                </div>
                                                <div>
                                                  <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                    {assessmentSubject === "SSW" ? "Rasio & Skala" : "Bumpo"}
                                                  </h5>
                                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {assessmentSubject === "SSW" ? "(Proporsi Campuran)" : "(Pola Kalimat)"}
                                                  </p>
                                                </div>
                                              </div>
                                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {assessmentSubject === "SSW" 
                                                  ? "Kemampuan merangkai rasio pencampuran bahan baku, faktor pengenceran kimia cair ppm, dan yield rate penyusutan." 
                                                  : "Kemampuan memahami dan menggunakan pola kalimat dengan tepat."}
                                              </p>
                                              <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={100}
                                                  placeholder="0"
                                                  value={scoreBumpo === 0 ? "" : scoreBumpo}
                                                  onChange={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (val > 100) val = 100;
                                                    if (val < 0) val = 0;
                                                    setScoreBumpo(val);
                                                  }}
                                                  className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black text-blue-600 focus:outline-none focus:border-blue-500 font-mono bg-white"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                              </div>
                                            </div>

                                            {/* Row 3: Kaiwa / Metrik Spasial */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 border-b border-slate-100 items-center">
                                              <div className="text-xs font-black text-slate-400 hidden sm:block">3</div>
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                  {assessmentSubject === "SSW" ? <Scale className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                                                </div>
                                                <div>
                                                  <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                    {assessmentSubject === "SSW" ? "Metrik & Spasial" : "Kaiwa"}
                                                  </h5>
                                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {assessmentSubject === "SSW" ? "(Volume & Geometri)" : "(Percakapan)"}
                                                  </p>
                                                </div>
                                              </div>
                                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {assessmentSubject === "SSW" 
                                                  ? "Kalkulasi volume ruangan kontainer, rencana baki muat, luas pelat penampang, suhu derajat celcius & tekanan psi." 
                                                  : "Kemampuan berkomunikasi dan merespons dalam percakapan."}
                                              </p>
                                              <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={100}
                                                  placeholder="0"
                                                  value={scoreKaiwa === 0 ? "" : scoreKaiwa}
                                                  onChange={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (val > 100) val = 100;
                                                    if (val < 0) val = 0;
                                                    setScoreKaiwa(val);
                                                  }}
                                                  className="w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black text-blue-600 focus:outline-none focus:border-blue-500 font-mono bg-white"
                                                />
                                                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                              </div>
                                            </div>

                                            {/* Row 4: Kanji / Logika Terapan */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[50px_160px_1fr_130px] gap-3 sm:gap-4 p-4 items-center">
                                              <div className="text-xs font-black text-slate-400 hidden sm:block">4</div>
                                              <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-fuchsia-600 text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                                                  {assessmentSubject === "SSW" ? <Brain className="h-4 w-4 text-white" /> : "字"}
                                                </div>
                                                <div>
                                                  <h5 className="text-xs font-black text-slate-800 leading-tight">
                                                    {assessmentSubject === "SSW" ? "Logika Terapan" : "Kanji"}
                                                  </h5>
                                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                    {assessmentSubject === "SSW" ? "(Optimasi Kerja & QC)" : "(Penulisan)"}
                                                  </p>
                                                </div>
                                              </div>
                                              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                {assessmentSubject === "SSW" 
                                                  ? "Ketangkasan dlm mengorelasikan waktu operasi mesin, defect rate ppm, kelistrikan AC/DC, shift & Kyukei, dan slip gaji." 
                                                  : "Kemampuan menulis dan mengingat kanji dengan benar."}
                                              </p>
                                              <div className="flex items-center justify-end sm:justify-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min={0}
                                                  max={100}
                                                  placeholder="0"
                                                  value={scoreKanji === 0 ? "" : scoreKanji}
                                                  onChange={(e) => {
                                                    let val = Number(e.target.value);
                                                    if (val > 100) val = 100;
                                                    if (val < 0) val = 0;
                                                    setScoreKanji(val);
                                                  }}
                                                  className={`w-16 h-8 text-center border border-slate-200 rounded-lg text-xs font-black focus:outline-none font-mono bg-white ${
                                                    isAlumniClass ? "text-emerald-600 focus:border-emerald-500" : "text-blue-600 focus:border-blue-500"
                                                  }`}
                                                />
                                                <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Real-time calculated score display */}
                                          {(() => {
                                            const computedAverage = Math.round(((Number(scoreKotoba) + Number(scoreBumpo) + Number(scoreKaiwa) + Number(scoreKanji)) / 4) * 10) / 10;
                                            return (
                                              <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 ${
                                                isAlumniClass 
                                                  ? "bg-emerald-50/40 border-emerald-100" 
                                                  : "bg-blue-50/40 border-blue-100"
                                              }`}>
                                                <div className="flex justify-between items-center flex-wrap gap-2">
                                                  <div>
                                                    <h5 className="font-display font-black text-slate-800 text-xs sm:text-sm tracking-tight text-left">Nilai Rata-rata {assessmentSubject}</h5>
                                                    <p className="text-[10px] text-slate-400 font-medium">Dihitung otomatis dari rata-rata ke 4 poin di atas</p>
                                                  </div>
                                                  <span className={`font-mono font-black text-lg sm:text-2xl ${isAlumniClass ? "text-emerald-600" : "text-blue-600"}`}>
                                                    {computedAverage.toFixed(1)} <span className="text-slate-400 text-xs font-bold">/ 100</span>
                                                  </span>
                                                </div>

                                                <div className="space-y-2">
                                                  {/* Range Track Background */}
                                                  <div className="relative w-full h-1.5 bg-slate-200 rounded-full">
                                                    <div 
                                                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                                                        isAlumniClass ? "bg-emerald-600" : "bg-blue-600"
                                                      }`}
                                                      style={{ width: `${computedAverage}%` }}
                                                    />
                                                    <div 
                                                      className={`absolute w-3 h-3 border-2 border-white rounded-full shadow -top-1 transition-all duration-300 ${
                                                        isAlumniClass ? "bg-emerald-600" : "bg-blue-600"
                                                      }`}
                                                      style={{ left: `calc(${computedAverage}% - 6px)` }}
                                                    />
                                                  </div>
                                                  
                                                  {/* Milestones labels */}
                                                  <div className="flex justify-between text-[9px] text-slate-400 font-black font-mono">
                                                    <span>0 (Kurang)</span>
                                                    <span>60 (Cukup)</span>
                                                    <span>80 (Baik)</span>
                                                    <span>100 (Sangat Baik)</span>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        {/* Feedback notes */}
                                        <div className="space-y-1.5">
                                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Catatan & Evaluasi Pengajar</label>
                                          <textarea
                                            rows={3}
                                            placeholder={assessmentSubject === "SSW" ? "Tulis catatan evaluasi logika dan ketelitian berhitung matematika (Contoh: Kuat di logika konversi berat, namun perlu latihan ekstra pada estimasi rasio penyusutan...)" : "Tulis catatan evaluasi lisan siswa (Contoh: Pelafalan Jikoshoukai lancar, Ojigi bungkuk badan perlu dilatih lagi...)"}
                                            value={gradingNotes}
                                            onChange={(e) => setGradingNotes(e.target.value)}
                                            className={`w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 font-normal ${
                                              isAlumniClass ? "focus:outline-emerald-500" : "focus:outline-blue-500"
                                            }`}
                                          />
                                        </div>

                                        {/* Bottom section with auto-save hint and submit button */}
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                                          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-600">
                                            <Check className="h-4 w-4 text-emerald-500" />
                                            <span>Nilai akan diperbarui secara otomatis saat Anda mengisi setiap poin.</span>
                                          </div>

                                          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto shrink-0">
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                if (!isVvipOrAdmin) {
                                                  alert("Hanya Sensei VVIP dan Admin yang memiliki otorisasi untuk mereset nilai.");
                                                  return;
                                                }
                                                if (confirm("Apakah Anda yakin ingin menghapus dan mereset nilai penilaian bab ini?")) {
                                                  if (studentAssessment?.id && onUpdateState) {
                                                    const payload = {
                                                      ...studentAssessment,
                                                      status: "Selesai Belajar",
                                                      score: "",
                                                      scoreKotoba: "",
                                                      scoreBumpo: "",
                                                      scoreKaiwa: "",
                                                      scoreKanji: "",
                                                      grade: "",
                                                      notes: ""
                                                    };
                                                    const ok = await onUpdateState("chapterAssessments", "update", payload);
                                                    if (ok) {
                                                      alert("Berhasil mereset nilai bab menjadi belum dinilai.");
                                                    } else {
                                                      alert("Gagal mereset nilai bab.");
                                                      return;
                                                    }
                                                  }
                                                  setScoreKotoba("");
                                                  setScoreBumpo("");
                                                  setScoreKaiwa("");
                                                  setScoreKanji("");
                                                  setGradingNotes("");
                                                }
                                              }}
                                              disabled={isReadOnlyView || !isVvipOrAdmin}
                                              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                              title={!isVvipOrAdmin ? "Hanya Sensei VVIP dan Admin yang dapat melakukan reset nilai" : "Reset semua nilai bab ini"}
                                            >
                                              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                                              <span>Reset Nilai</span>
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleGradeSubmit(new Event('submit'))}
                                              disabled={isGradingSubmitting || isReadOnlyView}
                                              className={`w-full sm:w-auto px-6 py-2.5 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 ${
                                                isReadOnlyView ? "bg-slate-400 cursor-not-allowed" :
                                                isAlumniClass 
                                                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10" 
                                                  : "bg-blue-600 hover:bg-blue-700"
                                              } ${isReadOnlyView ? "" : "cursor-pointer"}`}
                                            >
                                              <Save className="h-3.5 w-3.5" />
                                              <span>{isReadOnlyView ? "Mode Pantau" : (isGradingSubmitting ? "Sedang Menyimpan..." : "Simpan Nilai")}</span>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}

                            {/* Pagination Controls for Penilaian Bab */}
                            {totalBabPages > 1 && (
                              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 mt-6 gap-4">
                                <span className="text-[11px] font-bold text-slate-500">
                                  Menampilkan {Math.min(filteredActiveStudents.length, (babCurrentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredActiveStudents.length, babCurrentPage * itemsPerPage)} dari {filteredActiveStudents.length} siswa
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={babCurrentPage === 1}
                                    onClick={() => {
                                      setBabCurrentPage(prev => Math.max(1, prev - 1));
                                      const sec = document.getElementById("lms-bab-section-container");
                                      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-blue-600 hover:border-blue-300"
                                  >
                                    Sebelumnya
                                  </button>
                                  {Array.from({ length: totalBabPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                      key={page}
                                      type="button"
                                      onClick={() => {
                                        setBabCurrentPage(page);
                                        const sec = document.getElementById("lms-bab-section-container");
                                        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      className={`w-7 h-7 rounded-lg text-[11px] font-bold transition ${
                                        babCurrentPage === page
                                          ? "bg-blue-600 text-white shadow-xs"
                                          : "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    disabled={babCurrentPage === totalBabPages}
                                    onClick={() => {
                                      setBabCurrentPage(prev => Math.min(totalBabPages, prev + 1));
                                      const sec = document.getElementById("lms-bab-section-container");
                                      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-blue-600 hover:border-blue-300"
                                  >
                                    Berikutnya
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                            <BookOpen className="w-8 h-8" />
                          </div>
                          <h4 className="font-display font-extrabold text-slate-600">Pilih Bab di Atas</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Silakan pilih mata pelajaran dan bab yang ingin dinilai dari menu dropdown di atas untuk mulai melihat daftar siswa.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {progressTabMode === "sikap" && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs animate-fade-in text-left">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-slate-800">
                      Penilaian Kelayakan Order Job
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Nilai sikap (5S), etika, Bahasa Jepang, matematika, dan kehadiran untuk menentukan kelayakan siswa mengikuti Order Job. Nilai Bahasa Jepang, Matematika, dan Kehadiran (%) dihitung secara otomatis dari progres &amp; presensi siswa.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredActiveStudents.map((student) => {
                    const allStudentAssessments = (chapterAssessments && chapterAssessments.length > 0 ? chapterAssessments : (systemState?.chapterAssessments || [])).filter(
                      (a: any) => a.studentId === student.id || (a.studentName && a.studentName === student.name)
                    );

                    // Bahasa Jepang Assessments
                    const jpnAssessments = allStudentAssessments.filter(
                      (a: any) => (a.subject || "Bahasa Jepang") === "Bahasa Jepang" && 
                                  (a.status === "Telah Dinilai" || a.status === "Sudah Dinilai" || a.score !== undefined) && 
                                  typeof a.score === "number" && !isNaN(a.score)
                    );
                    const hasJpnAssessments = jpnAssessments.length > 0;
                    const computedJpnAvg = hasJpnAssessments
                      ? Math.round(jpnAssessments.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / jpnAssessments.length)
                      : (student.japaneseScore || 0);

                    // Matematika SSW Assessments
                    const mathAssessments = allStudentAssessments.filter(
                      (a: any) => (a.subject === "SSW" || a.subject === "Matematika" || a.subject === "SSW Matematika") && 
                                  (a.status === "Telah Dinilai" || a.status === "Sudah Dinilai" || a.score !== undefined) && 
                                  typeof a.score === "number" && !isNaN(a.score)
                    );
                    const hasMathAssessments = mathAssessments.length > 0;
                    const computedMathAvg = hasMathAssessments
                      ? Math.round(mathAssessments.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / mathAssessments.length)
                      : (student.mathScore || 0);

                    // Attendance calculation from presence records vs total available bab
                    const studentAtts = studentAttendanceMap.get(student.id) || studentAttendanceMap.get(student.name) || (attendanceRecords || []).filter((r: any) => r.studentId === student.id || r.studentName === student.name);
                    const presentCount = studentAtts.filter((r: any) => r.status === "Hadir" || r.status === "Hadir (Tepat Waktu)" || r.status === "Hadir (Terlambat)").length;
                    const totalAvailableBab = getClassChaptersCount(student.class || "", "Bahasa Jepang", true) || 25;
                    const hasAttRecords = studentAtts.length > 0;
                    const computedAttendanceRate = hasAttRecords
                      ? Math.min(100, Math.round((presentCount / totalAvailableBab) * 100))
                      : (student.attendanceScore || 0);

                    return (
                      <div key={student.id} className="p-4 border border-slate-200 bg-white rounded-2xl flex flex-col gap-3 relative shadow-2xs hover:shadow-xs transition">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                            {student.name ? student.name.charAt(0).toUpperCase() : <Users className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-800 truncate">{student.name}</h4>
                            <div className="text-[10px] text-slate-500 font-medium font-mono truncate">{student.id} {student.class ? `• ${student.class}` : ''}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2.5 mt-1">
                          {/* NILAI 5S */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai 5S</label>
                            <input 
                              type="number"
                              min="0" max="100"
                              defaultValue={student.fiveSScore || 0}
                              onBlur={(e) => {
                                if (onUpdateState) {
                                  onUpdateState("activeStudents", "update", { ...student, fiveSScore: parseInt(e.target.value) || 0 });
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white"
                            />
                          </div>

                          {/* NILAI ETIKA */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nilai Etika</label>
                            <input 
                              type="number"
                              min="0" max="100"
                              defaultValue={student.ethicsScore || 0}
                              onBlur={(e) => {
                                if (onUpdateState) {
                                  onUpdateState("activeStudents", "update", { ...student, ethicsScore: parseInt(e.target.value) || 0 });
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white"
                            />
                          </div>

                          {/* BAHASA JEPANG */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">B. Jepang</label>
                              {hasJpnAssessments && (
                                <span className="text-[8.5px] font-extrabold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200" title={`Diambil dari rata-rata ${jpnAssessments.length} bab`}>
                                  Auto ({jpnAssessments.length} Bab)
                                </span>
                              )}
                            </div>
                            {hasJpnAssessments ? (
                              <div 
                                className="w-full bg-amber-50/80 border border-amber-200 rounded-lg px-2 py-1.5 text-xs text-center font-black text-amber-900 shadow-2xs"
                                title={`Rata-rata dari ${jpnAssessments.length} bab Bahasa Jepang yang telah dinilai`}
                              >
                                {computedJpnAvg} <span className="text-[9px] font-semibold text-amber-600">/ 100</span>
                              </div>
                            ) : (
                              <input 
                                type="number"
                                min="0" max="100"
                                defaultValue={student.japaneseScore || 0}
                                onBlur={(e) => {
                                  if (onUpdateState) {
                                    onUpdateState("activeStudents", "update", { ...student, japaneseScore: parseInt(e.target.value) || 0 });
                                  }
                                }}
                                placeholder="Manual"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-amber-500 focus:bg-white"
                              />
                            )}
                          </div>

                          {/* MATEMATIKA */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Matematika</label>
                              {hasMathAssessments && (
                                <span className="text-[8.5px] font-extrabold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-200" title={`Diambil dari rata-rata ${mathAssessments.length} bab SSW`}>
                                  Auto ({mathAssessments.length} Bab)
                                </span>
                              )}
                            </div>
                            {hasMathAssessments ? (
                              <div 
                                className="w-full bg-blue-50/80 border border-blue-200 rounded-lg px-2 py-1.5 text-xs text-center font-black text-blue-900 shadow-2xs"
                                title={`Rata-rata dari ${mathAssessments.length} bab Matematika/SSW yang telah dinilai`}
                              >
                                {computedMathAvg} <span className="text-[9px] font-semibold text-blue-600">/ 100</span>
                              </div>
                            ) : (
                              <input 
                                type="number"
                                min="0" max="100"
                                defaultValue={student.mathScore || 0}
                                onBlur={(e) => {
                                  if (onUpdateState) {
                                    onUpdateState("activeStudents", "update", { ...student, mathScore: parseInt(e.target.value) || 0 });
                                  }
                                }}
                                placeholder="Manual"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-blue-500 focus:bg-white"
                              />
                            )}
                          </div>

                          {/* KEHADIRAN (%) */}
                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Kehadiran (%)</label>
                              {hasAttRecords && (
                                <span className="text-[8.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200" title={`Akumulasi ${presentCount} presensi hadir dari ${totalAvailableBab} total bab`}>
                                  Auto ({presentCount}/{totalAvailableBab} Bab)
                                </span>
                              )}
                            </div>
                            {hasAttRecords ? (
                              <div 
                                className="w-full bg-emerald-50/80 border border-emerald-200 rounded-lg px-2 py-1.5 text-xs text-center font-black text-emerald-900 shadow-2xs"
                                title={`Persentase kehadiran: ${presentCount} hadir / ${totalAvailableBab} total bab (${computedAttendanceRate}%)`}
                              >
                                {computedAttendanceRate}% <span className="text-[9px] font-semibold text-emerald-600">({presentCount}/{totalAvailableBab})</span>
                              </div>
                            ) : (
                              <input 
                                type="number"
                                min="0" max="100"
                                defaultValue={student.attendanceScore || 0}
                                onBlur={(e) => {
                                  if (onUpdateState) {
                                    onUpdateState("activeStudents", "update", { ...student, attendanceScore: parseInt(e.target.value) || 0 });
                                  }
                                }}
                                placeholder="Manual"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-slate-800 focus:outline-emerald-500 focus:bg-white"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredActiveStudents.length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-400 text-sm">
                      Belum ada siswa di kelas ini.
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {progressTabMode === "penilaian" && (
              <div id="lms-tugas-section-container" className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                    <Award className="h-48 w-48" />
                  </div>
                  <div className="max-w-xl space-y-2 relative z-10">
                    <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                      Penilaian
                    </span>
                    <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-tight">
                      Evaluasi Tugas Siswa
                    </h3>
                    <p className="text-xs text-indigo-100 leading-relaxed font-normal">
                      Pilih pelajaran, bab, dan tugas untuk memberikan penilaian kepada siswa.
                    </p>
                  </div>
                </div>

                {(() => {
                  const allTugasLessons = (lmsLessons || [])
                    .filter(l => l.difficulty === "Tugas")
                    .filter(l => {
                      if (!selectedClassFilter || selectedClassFilter === "Semua" || selectedClassFilter === "Semua Kelas") return true;
                      const tc = (l.targetClass || "Semua").trim().toLowerCase();
                      if (tc === "semua") return true;
                      return tc === selectedClassFilter.trim().toLowerCase();
                    })
                    .sort((a, b) => Number(a.chapterNumber) - Number(b.chapterNumber));
                  const selectedTugas = allTugasLessons.find(l => l.id === evalSelectedLessonId);
                  
                  return (
                    <div className="space-y-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pilih Tugas yang Ingin Dinilai</label>
                        <select
                          value={evalSelectedLessonId}
                          onChange={(e) => setEvalSelectedLessonId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 outline-none cursor-pointer"
                        >
                          <option value="">-- Pilih Tugas --</option>
                          {allTugasLessons.map(l => (
                            <option key={l.id} value={l.id}>[{l.targetClass || "Semua Kelas"}] [{l.subject}] Bab {l.chapterNumber} - {l.title}</option>
                          ))}
                        </select>
                      </div>

                      {selectedTugas ? (
                        <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                          <h4 className="font-display font-extrabold text-slate-900 text-lg mb-2">Penilaian: {selectedTugas.title}</h4>
                          <p className="text-xs text-slate-500 mb-6">Bab {selectedTugas.chapterNumber} • {selectedTugas.subject}</p>
                          
                          {filteredActiveStudents.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-4 text-center">Tidak ada siswa yang terdaftar di kelas ini.</p>
                          ) : (
                            <div className="divide-y divide-slate-100">
                              {paginatedTugasStudents.map((student) => {
                                const assessment = (systemState?.chapterAssessments || []).find(
                                  (c) => c.lessonId === selectedTugas.id && c.studentId === student.id
                                );

                                const currentScore = tugasScores[`${student.id}-${selectedTugas.id}`] !== undefined 
                                  ? tugasScores[`${student.id}-${selectedTugas.id}`] 
                                  : (assessment?.score !== undefined ? String(assessment.score) : "");

                                const currentNotes = tugasNotes[`${student.id}-${selectedTugas.id}`] !== undefined 
                                  ? tugasNotes[`${student.id}-${selectedTugas.id}`] 
                                  : (assessment?.notes || "");

                                const isSaving = tugasGradingSubmitting[`${student.id}-${selectedTugas.id}`] || false;

                                const calculateGrade = (scoreVal) => {
                                  const s = Number(scoreVal);
                                  if (isNaN(s) || scoreVal === "") return "";
                                  if (s >= 90) return "A";
                                  if (s >= 80) return "B";
                                  if (s >= 70) return "C";
                                  if (s >= 60) return "D";
                                  return "E";
                                };

                                return (
                                  <div key={student.id} className="py-6 first:pt-0 last:pb-0 space-y-4">
                                    {/* Student row header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div>
                                        <h6 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                                          <span>{student.name}</span>
                                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                                            {student.id}
                                          </span>
                                        </h6>
                                        <p className="text-[10px] text-slate-400 mt-1">Kelas: {student.class || "-"}</p>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2">
                                        {assessment ? (
                                          assessment.status === "Menunggu Penilaian" ? (
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg shadow-3xs">
                                              🟡 Menunggu Penilaian
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg shadow-3xs">
                                              🟢 Telah Dinilai: {assessment.score}/100
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg shadow-3xs">
                                            Belum Mengumpulkan
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* File Link (if submitted) */}
                                    {assessment?.submissionUrl && (
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60">
                                        <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-500 rounded-lg shrink-0">
                                          <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="truncate flex-1">
                                          <span className="text-xs font-bold text-indigo-700 block truncate">File Jawaban Terlampir</span>
                                          <span className="text-[10px] text-indigo-400 block mt-0.5">{new Date(assessment.submissionDate || "").toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                                          <a
                                            href={assessment.submissionUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full sm:w-auto text-center bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-[11px] font-extrabold hover:bg-indigo-50 transition shadow-sm"
                                          >
                                            Unduh
                                          </a>
                                          <button
                                            onClick={() => setPdfViewerUrl(assessment.submissionUrl)}
                                            className="w-full sm:w-auto text-center bg-indigo-600 text-white border border-transparent px-4 py-2 rounded-lg text-[11px] font-extrabold hover:bg-indigo-700 transition shadow-sm"
                                          >
                                            Buka PDF
                                          </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* Grading Inputs */}
                                    <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                        {/* Score & Grade (5 cols on md) */}
                                        <div className="md:col-span-5 flex items-start gap-3">
                                          <div className="flex-1">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Skor (0-100)</label>
                                            <div className="relative rounded-xl shadow-3xs">
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                placeholder="0 - 100"
                                                value={currentScore}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  const key = `${student.id}-${selectedTugas.id}`;
                                                  setTugasScores(prev => ({ ...prev, [key]: val }));
                                                  const gradeLetter = calculateGrade(val);
                                                  setTugasGrades(prev => ({ ...prev, [key]: gradeLetter }));
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-800 font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition shadow-3xs"
                                              />
                                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                <span className="text-xs font-bold text-slate-400">%</span>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="w-20 shrink-0">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 text-center">Grade</label>
                                            <div className={`h-10 flex items-center justify-center rounded-xl text-xs font-black text-center select-none shadow-3xs border transition-colors ${
                                              calculateGrade(currentScore) === "A" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                              calculateGrade(currentScore) === "B" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                              calculateGrade(currentScore) === "C" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                              calculateGrade(currentScore) === "D" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                              calculateGrade(currentScore) === "E" ? "bg-rose-50 text-rose-700 border-rose-200" :
                                              "bg-white text-slate-400 border-slate-200"
                                            }`}>
                                              {calculateGrade(currentScore) || "-"}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Notes & Feedback (7 cols on md) */}
                                        <div className="md:col-span-7">
                                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Catatan Koreksi & Feedback</label>
                                          <textarea
                                            rows={1}
                                            placeholder="Tulis umpan balik untuk siswa (opsional)"
                                            value={currentNotes}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              const key = `${student.id}-${selectedTugas.id}`;
                                              setTugasNotes(prev => ({ ...prev, [key]: val }));
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500 transition placeholder-slate-400 font-normal min-h-[42px] max-h-32 resize-y shadow-3xs"
                                          />
                                        </div>
                                      </div>

                                      {/* Bottom Buttons Row */}
                                      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            if (!isVvipOrAdmin) {
                                              alert("Hanya Sensei VVIP dan Admin yang memiliki otorisasi untuk mereset nilai.");
                                              return;
                                            }
                                            if (confirm("Apakah Anda yakin ingin menghapus dan mereset nilai tugas ini?")) {
                                              if (assessment?.id && onUpdateState) {
                                                let ok = false;
                                                if (assessment.submissionUrl) {
                                                  const payload = {
                                                    ...assessment,
                                                    status: "Menunggu Penilaian",
                                                    score: "",
                                                    grade: "",
                                                    notes: ""
                                                  };
                                                  ok = await onUpdateState("chapterAssessments", "update", payload);
                                                } else {
                                                  ok = await onUpdateState("chapterAssessments", "delete", { id: assessment.id });
                                                }

                                                if (ok) {
                                                  alert("Berhasil mereset nilai tugas menjadi belum dinilai.");
                                                } else {
                                                  alert("Gagal mereset nilai tugas.");
                                                  return;
                                                }
                                              }
                                              const key = `${student.id}-${selectedTugas.id}`;
                                              setTugasScores(prev => ({ ...prev, [key]: "" }));
                                              setTugasGrades(prev => ({ ...prev, [key]: "" }));
                                              setTugasNotes(prev => ({ ...prev, [key]: "" }));
                                            }
                                          }}
                                          disabled={!isVvipOrAdmin}
                                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                          title={!isVvipOrAdmin ? "Hanya Sensei VVIP dan Admin yang dapat melakukan reset nilai" : "Reset nilai tugas ini"}
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                                          <span>Reset Nilai</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isSaving}
                                          onClick={async () => {
                                            if (currentScore === "") {
                                              alert("Harap masukkan nilai terlebih dahulu.");
                                              return;
                                            }
                                            const scoreNum = Number(currentScore);
                                            if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
                                              alert("Nilai harus berupa angka antara 0 - 100.");
                                              return;
                                            }

                                            const key = `${student.id}-${selectedTugas.id}`;
                                            setTugasGradingSubmitting(prev => ({ ...prev, [key]: true }));

                                            const payload = {
                                              studentId: student.id,
                                              studentName: student.name,
                                              chapterNumber: Number(selectedTugas.chapterNumber || 1),
                                              title: selectedTugas.title,
                                              status: "Telah Dinilai",
                                              subject: selectedTugas.subject,
                                              lessonId: selectedTugas.id,
                                              score: scoreNum,
                                              grade: calculateGrade(currentScore) || "E",
                                              notes: currentNotes,
                                              assessedBy: currentUser?.name || "Sensei",
                                              submissionUrl: assessment?.submissionUrl || "",
                                              submissionDate: assessment?.submissionDate || new Date().toISOString()
                                            };

                                            try {
                                              if (onUpdateState) {
                                                const ok = await onUpdateState("chapterAssessments", "update", payload);
                                                if (ok) {
                                                  alert(`Berhasil menyimpan nilai untuk ${student.name}!`);
                                                } else {
                                                  alert("Gagal menyimpan nilai.");
                                                }
                                              }
                                            } catch (err) {
                                              console.error(err);
                                              alert("Gagal menyimpan nilai.");
                                            } finally {
                                              setTugasGradingSubmitting(prev => ({ ...prev, [key]: false }));
                                            }
                                          }}
                                          className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-3xs active:scale-95"
                                        >
                                          {isSaving ? (
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <>
                                              <Save className="w-3.5 h-3.5" />
                                              <span>Simpan Nilai</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Pagination Controls for Penilaian Tugas */}
                              {totalTugasPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 mt-6 gap-4">
                                  <span className="text-[11px] font-bold text-slate-500">
                                    Menampilkan {Math.min(filteredActiveStudents.length, (tugasCurrentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredActiveStudents.length, tugasCurrentPage * itemsPerPage)} dari {filteredActiveStudents.length} siswa
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={tugasCurrentPage === 1}
                                      onClick={() => {
                                        setTugasCurrentPage(prev => Math.max(1, prev - 1));
                                        const sec = document.getElementById("lms-tugas-section-container");
                                        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-indigo-600 hover:border-indigo-300"
                                    >
                                      Sebelumnya
                                    </button>
                                    {Array.from({ length: totalTugasPages }, (_, i) => i + 1).map((page) => (
                                      <button
                                        key={page}
                                        type="button"
                                        onClick={() => {
                                          setTugasCurrentPage(page);
                                          const sec = document.getElementById("lms-tugas-section-container");
                                          if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        className={`w-7 h-7 rounded-lg text-[11px] font-bold transition ${
                                          tugasCurrentPage === page
                                            ? "bg-indigo-600 text-white shadow-xs"
                                            : "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                                        }`}
                                      >
                                        {page}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      disabled={tugasCurrentPage === totalTugasPages}
                                      onClick={() => {
                                        setTugasCurrentPage(prev => Math.min(totalTugasPages, prev + 1));
                                        const sec = document.getElementById("lms-tugas-section-container");
                                        if (sec) sec.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition hover:text-indigo-600 hover:border-indigo-300"
                                    >
                                      Berikutnya
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                            <BookOpen className="w-8 h-8" />
                          </div>
                          <h4 className="font-display font-extrabold text-slate-600">Pilih Tugas di Atas</h4>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">Silakan pilih tugas yang ingin dinilai dari menu dropdown di atas untuk mulai melihat daftar pengumpulan siswa.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SENSEI ACCORDION FORM DIALOG MODAL (ADD / EDIT LESSON) */}
      {isQuizFormOpen && (() => {
        const currentQuiz = quizBatch[selectedBatchIndex] || {
          subject: "Bahasa Jepang",
          questionType: "pilihan_ganda",
          question: "",
          options: ["", "", "", ""],
          correctAnswerIndex: 0,
          chapterNumber: undefined,
          deadline: "",
          durationMinutes: "",
          imageUrl: "",
          videoUrl: "",
          audioUrl: ""
        };

        return (
          <div className="fixed inset-0 z-[10000] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
              <div className="bg-slate-50 border-b border-slate-100 p-4 sm:p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-lg text-slate-900">Tambah Banyak Soal Kuis (Batch)</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Buat beberapa soal sekaligus dalam satu pop-up</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsQuizFormOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Horizontal Question Navigation Tabs */}
              <div className="bg-slate-50/50 border-b border-slate-150 px-4 sm:px-6 py-2.5 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono select-none mr-1 shrink-0">Daftar Soal ({quizBatch.length}):</span>
                {quizBatch.map((q, idx) => {
                  const isActive = idx === selectedBatchIndex;
                  const isQEmpty = !q.question?.trim();
                  return (
                    <div key={idx} className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedBatchIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-sm border-transparent"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${isQEmpty ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                        <span>Soal {idx + 1}</span>
                      </button>
                      {quizBatch.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updatedBatch = quizBatch.filter((_, i) => i !== idx);
                            setQuizBatch(updatedBatch);
                            setSelectedBatchIndex(prev => {
                              if (prev >= updatedBatch.length) {
                                return updatedBatch.length - 1;
                              }
                              return prev;
                            });
                          }}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition shrink-0 cursor-pointer"
                          title="Hapus soal ini"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const template = {
                      subject: currentQuiz.subject || "Bahasa Jepang",
                      questionType: "pilihan_ganda",
                      question: "",
                      options: ["", "", "", ""],
                      correctAnswerIndex: 0,
                      chapterNumber: currentQuiz.chapterNumber,
                      deadline: currentQuiz.deadline || "",
                      durationMinutes: currentQuiz.durationMinutes || "",
                      imageUrl: "",
                      videoUrl: "",
                      audioUrl: ""
                    };
                    setQuizBatch(prev => [...prev, template]);
                    setSelectedBatchIndex(quizBatch.length);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Soal</span>
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-left flex-1">
                {/* Pengaturan Kuis Keseluruhan (Global Settings) */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                    <span className="text-base">⏳</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Tenggang Waktu &amp; Durasi Kuis (Global)</h4>
                      <p className="text-[10px] text-slate-500">Waktu penyelesaian ini berlaku untuk keseluruhan soal kuis dalam sesi ini</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Tenggang Waktu (Deadline)</label>
                      <input
                        type="datetime-local"
                        value={batchDeadline || ""}
                        onChange={(e) => setBatchDeadline(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Durasi Kuis (Menit)</label>
                      <select
                        value={batchDurationMinutes || ""}
                        onChange={(e) => setBatchDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:border-emerald-500 outline-none cursor-pointer text-slate-800 font-medium"
                      >
                        <option value="">Tanpa Batas Durasi</option>
                        <option value="5">5 Menit</option>
                        <option value="10">10 Menit</option>
                        <option value="15">15 Menit</option>
                        <option value="20">20 Menit</option>
                        <option value="30">30 Menit</option>
                        <option value="45">45 Menit</option>
                        <option value="60">60 Menit (1 Jam)</option>
                        <option value="90">90 Menit (1.5 Jam)</option>
                        <option value="120">120 Menit (2 Jam)</option>
                        <option value="180">180 Menit (3 Jam)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700">Kelas Sasaran (Target)</label>
                      <select
                        value={batchTargetClass}
                        onChange={(e) => setBatchTargetClass(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:border-emerald-500 outline-none cursor-pointer text-slate-800 font-semibold"
                      >
                        <option value="Semua">Semua Kelas</option>
                        {officialClasses.map((c: any) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-3 mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">✍️ Mengedit: <strong className="font-bold">Soal #{selectedBatchIndex + 1}</strong></span>
                  <span className="text-[10px] text-slate-500 font-mono">Lampiran Media tersimpan otomatis di Firebase Storage</span>
                </div>

                {/* Lampiran Media (Opsional) - Pindah ke Atas */}
                <div className="space-y-3 p-4 bg-slate-50/60 border border-slate-200 rounded-2xl">
                  <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                    <span>📎 Lampiran Media Soal #{selectedBatchIndex + 1} (Opsional)</span>
                    <span className="text-[10px] text-slate-400 font-normal">(Pratinjau langsung di bawah ini)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Upload Gambar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 text-left shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">🖼️ Gambar</span>
                        {currentQuiz.imageUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                            <img src={currentQuiz.imageUrl} alt="Quiz Attachment" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], imageUrl: "" };
                                  return copy;
                                });
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Belum ada gambar yang dilampirkan</div>
                        )}
                      </div>
                      {!currentQuiz.imageUrl && (
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isFileUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsFileUploading(true);
                            try {
                              const url = await uploadFileToFirebase(file, "lms_quizzes");
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], imageUrl: url };
                                return copy;
                              });
                            } catch (err) {
                              console.error(err);
                              alert("Gagal upload gambar");
                            } finally {
                              setIsFileUploading(false);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-50 cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Upload Video */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 text-left shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">🎬 Video</span>
                        {currentQuiz.videoUrl ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-white aspect-video flex items-center justify-center">
                            <video src={currentQuiz.videoUrl} controls className="max-h-full max-w-full" />
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], videoUrl: "" };
                                  return copy;
                                });
                              }}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Belum ada video yang dilampirkan</div>
                        )}
                      </div>
                      {!currentQuiz.videoUrl && (
                        <input
                          type="file"
                          accept="video/*"
                          disabled={isFileUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsFileUploading(true);
                            try {
                              const url = await uploadFileToFirebase(file, "lms_quizzes");
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], videoUrl: url };
                                return copy;
                              });
                            } catch (err) {
                              console.error(err);
                              alert("Gagal upload video");
                            } finally {
                              setIsFileUploading(false);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-50 cursor-pointer"
                        />
                      )}
                    </div>

                    {/* Upload Suara */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-between gap-2 text-left shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">🎙️ Suara (Audio)</span>
                        {currentQuiz.audioUrl ? (
                          <div className="relative rounded-lg p-2 border border-slate-200 bg-white flex flex-col items-center gap-1">
                            <audio src={currentQuiz.audioUrl} controls className="w-full h-8" />
                            <button
                              type="button"
                              onClick={() => {
                                setQuizBatch(prev => {
                                  const copy = [...prev];
                                  copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], audioUrl: "" };
                                  return copy;
                                });
                              }}
                              className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition cursor-pointer"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 italic">Belum ada rekaman suara yang dilampirkan</div>
                        )}
                      </div>
                      {!currentQuiz.audioUrl && (
                        <input
                          type="file"
                          accept="audio/*"
                          disabled={isFileUploading}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setIsFileUploading(true);
                            try {
                              const url = await uploadFileToFirebase(file, "lms_quizzes");
                              setQuizBatch(prev => {
                                const copy = [...prev];
                                copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], audioUrl: url };
                                return copy;
                              });
                            } catch (err) {
                              console.error(err);
                              alert("Gagal upload audio");
                            } finally {
                              setIsFileUploading(false);
                            }
                          }}
                          className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 disabled:opacity-50 cursor-pointer"
                        />
                      )}
                    </div>
                  </div>
                  {isFileUploading && (
                    <p className="text-[10px] text-amber-600 font-bold animate-pulse text-left mt-2">⚡ Sedang mengunggah berkas kuis ke Firebase Storage... Mohon tunggu.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Mata Pelajaran</label>
                    <select 
                      value={currentQuiz.subject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuizBatch(prev => {
                          const copy = [...prev];
                          copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], subject: val };
                          return copy;
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="Bahasa Jepang">🇯🇵 Bahasa Jepang</option>
                      <option value="SSW">📐 SSW (SSW)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Jenis Soal</label>
                    <select 
                      value={currentQuiz.questionType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setQuizBatch(prev => {
                          const copy = [...prev];
                          copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], questionType: val };
                          return copy;
                        });
                      }}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none"
                    >
                      <option value="pilihan_ganda">Pilihan Ganda</option>
                      <option value="essay">Essay</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pertanyaan</label>
                  <textarea 
                    value={currentQuiz.question}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuizBatch(prev => {
                        const copy = [...prev];
                        copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], question: val };
                        return copy;
                      });
                    }}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Ketik pertanyaan di sini..."
                  />
                </div>

                {currentQuiz.questionType === "pilihan_ganda" && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700">Pilihan Jawaban</label>
                    {(currentQuiz.options || ["", "", "", ""]).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          name={`correctAnswer-${selectedBatchIndex}`}
                          checked={currentQuiz.correctAnswerIndex === i}
                          onChange={() => {
                            setQuizBatch(prev => {
                              const copy = [...prev];
                              copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], correctAnswerIndex: i };
                              return copy;
                            });
                          }}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const val = e.target.value;
                            setQuizBatch(prev => {
                              const copy = [...prev];
                              const newOpts = [...(copy[selectedBatchIndex].options || ["", "", "", ""])];
                              newOpts[i] = val;
                              copy[selectedBatchIndex] = { ...copy[selectedBatchIndex], options: newOpts };
                              return copy;
                            });
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-sm focus:border-emerald-500 outline-none"
                          placeholder={'Opsi ' + (i + 1)}
                        />
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-500 italic">* Pilih radio button untuk menandai jawaban yang benar.</p>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-50 border-t border-slate-100 p-4 sm:p-6 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] text-slate-500 font-mono text-center sm:text-left">
                  Menyimpan <span className="font-extrabold text-emerald-600">{quizBatch.filter(q => q.question?.trim()).length}</span> dari <span className="font-extrabold">{quizBatch.length}</span> soal yang valid.
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsQuizFormOpen(false)}
                    className="flex-1 sm:flex-none border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isFileUploading || quizBatch.filter(q => q.question?.trim()).length === 0}
                    onClick={async () => {
                      if (onUpdateState) {
                        const validQuizzes = quizBatch.filter(q => q.question?.trim());
                        for (const q of validQuizzes) {
                          const id = "QZ-" + Math.floor(Math.random() * 10000);
                          const payload = { 
                            ...q, 
                            id,
                            targetClass: batchTargetClass,
                            deadline: batchDeadline,
                            durationMinutes: batchDurationMinutes
                          };
                          await onUpdateState('lmsQuizzes', 'add', payload);
                        }
                      }
                      setIsQuizFormOpen(false);
                    }}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan Semua Soal</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {isLessonFormOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  {selectedLessonToEdit ? "📝" : "➕"}
                </span>
                <div>
                  <h3 className="font-display font-black text-slate-900 text-sm">
                    {lessonDifficulty === "Tugas"
                      ? (selectedLessonToEdit ? `Ubah Tugas: ${selectedLessonToEdit.id}` : `Tambah Tugas Baru`)
                      : (selectedLessonToEdit ? `Ubah Materi: ${selectedLessonToEdit.id}` : `Tambah Materi Baru`)}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-normal leading-tight">
                    {lessonDifficulty === "Tugas"
                      ? "Pastikan rincian tugas dan tenggang waktu sudah benar."
                      : "Pastikan data modul valid sesuai kurikulum standard."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLessonFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <ConfirmForm 
              confirmTitle={lessonDifficulty === "Tugas" ? "Simpan Tugas" : "Simpan Materi Pokok"} 
              confirmMessage={lessonDifficulty === "Tugas" ? "Publikasikan tugas baru ini?" : "Publikasikan modul pelajaran baru ini?"} 
              onSubmit={handleLessonSubmit} 
              className="flex-1 overflow-y-auto min-h-0 w-full p-6 space-y-4 text-left"
            >
              {lessonError && (
                <div className="p-3.5 bg-rose-50 border border-rose-150 text-rose-800 text-[11px] font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>{lessonError}</span>
                </div>
              )}

              {/* Subject Select & Bab Number */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subjek Pelajaran</label>
                  <select
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="Bahasa Jepang">Bahasa Jepang</option>
                    <option value="SSW">SSW</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nomor Bab</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={selectedBabNumber}
                    onChange={(e) => setSelectedBabNumber(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kelas Sasaran</label>
                  <select
                    value={lessonTargetClass}
                    onChange={(e) => setLessonTargetClass(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {officialClasses.map((c: any) => (
                      <option key={c.id || c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kesulitan / Jenis</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dasar N5"
                    value={lessonDifficulty}
                    onChange={(e) => setLessonDifficulty(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Title & Jp Title */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {lessonDifficulty === "Tugas" ? "Nama / Judul Tugas" : "Nama / Judul Materi"}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    placeholder={lessonDifficulty === "Tugas" ? "Masukkan nama tugas..." : "Masukkan nama modul..."}
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>

                {lessonSubject === "Bahasa Jepang" && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Karakter Jepang (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: 自己紹介 (じこしょうかい)"
                      value={lessonJapaneseTitle}
                      onChange={(e) => setLessonJapaneseTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-emerald-600"
                    />
                  </div>
                )}
              </div>

              {/* Content Type Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jenis Konten Penunjang</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: "text_only", label: "Tulis 📝" },
                    { id: "video", label: "Video 🎬" },
                    { id: "slide", label: "Slide PPT 📽️" },
                    { id: "buku", label: "Buku PDF 📚" },
                    { id: "audio", label: "Suara 🎙️" }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setLessonContentType(t.id as any)}
                      className={`py-2 px-1 rounded-xl font-bold text-xs border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        lessonContentType === t.id
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span className="text-[10px] font-semibold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Embed URLs */}
              {lessonContentType === "video" && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Video</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link Semat</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload File</button>
                    </div>
                  </div>

                  {lessonUploadMethod === "url" ? (
                    <>
                      <input
                        type="url"
                        required
                        placeholder="Contoh: https://www.youtube.com/embed/dQw4w9WgXcQ"
                        value={lessonVideoUrl}
                        onChange={(e) => setLessonVideoUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Harap gunakan format link embed mandiri demi menghindari blokir iframe oleh browser.</span>
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="video/*"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonVideoUrl)}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {isFileUploading ? (
                        <span className="text-[9px] text-amber-600 font-bold block mt-1 animate-pulse">⚡ Mengunggah & mengompres berkas video... Mohon tunggu...</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 block mt-1">Pilih file Video dari perangkat Anda. (Max 2MB direkomendasikan untuk upload lokal)</span>
                      )}
                    </>
                  )}
                </div>
              )}

              {lessonContentType === "slide" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link Semat / Embed Google Slides URL</label>
                  <input
                    type="url"
                    required
                    placeholder="Contoh: https://docs.google.com/presentation/d/.../embed"
                    value={lessonSlidesUrl}
                    onChange={(e) => setLessonSlidesUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                  <span className="text-[9px] text-slate-400 block mt-1">Gunakan link sebaran Google Slide dengan akhiran /embed atau tautan interaktif sejenis.</span>
                </div>
              )}

              {lessonContentType === "buku" && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tautan / Upload Buku PDF</label>
                    <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                      <button type="button" onClick={() => setLessonUploadMethod("url")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "url" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Link Tautan</button>
                      <button type="button" onClick={() => setLessonUploadMethod("file")} className={`px-2 py-1 text-[9px] font-bold rounded-md ${lessonUploadMethod === "file" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>Upload File</button>
                    </div>
                  </div>
                  
                  {lessonUploadMethod === "url" ? (
                    <>
                      <input
                        type="url"
                        required
                        placeholder="Contoh: https://example.com/buku/kurikulum_japanese.pdf"
                        value={lessonBookUrl}
                        onChange={(e) => setLessonBookUrl(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1">Tautan rujukan langsung ke server dokumen PDF atau berkas drive publik Anda.</span>
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isFileUploading}
                        onChange={(e) => handleFileUpload(e, setLessonBookUrl)}
                        className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                      />
                      {isFileUploading ? (
                        <span className="text-[9px] text-amber-600 font-bold block mt-1 animate-pulse">⚡ Mengunggah & mengompres dokumen PDF... Mohon tunggu...</span>
                      ) : (
                        <span className="text-[9px] text-slate-400 block mt-1">Pilih file PDF dari perangkat Anda. File berukuran besar mungkin tidak didukung.</span>
                      )}
                    </>
                  )}
                </div>
              )}

              {lessonContentType === "audio" && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rekaman Suara / Audio</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-4">
                    {lessonAudioData ? (
                      <div className="w-full flex flex-col items-center gap-2">
                        <audio src={lessonAudioData} controls className="w-full max-w-sm" />
                        <button
                          type="button"
                          onClick={() => setLessonAudioData("")}
                          className="text-xs text-rose-600 hover:text-rose-700 font-bold"
                        >
                          Hapus Rekaman
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center gap-3">
                        {isRecordingAudio ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2 text-rose-600 font-bold text-xs animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                              Sedang Merekam...
                            </div>
                            <button
                              type="button"
                              onClick={stopRecording}
                              className="bg-rose-100 text-rose-700 hover:bg-rose-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2"
                            >
                              <div className="w-3 h-3 bg-rose-700 rounded-sm"></div> Berhenti
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                              type="button"
                              onClick={startRecording}
                              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                              <Volume2 className="w-4 h-4" /> Mulai Rekam
                            </button>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">ATAU</span>
                            <div className="relative">
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileUpload(e, setLessonAudioData)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <button
                                type="button"
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 w-full sm:w-auto justify-center"
                              >
                                <Upload className="w-4 h-4" /> Upload MP3/Audio
                              </button>
                            </div>
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 text-center max-w-xs">
                          Gunakan mikrofon perangkat Anda untuk merekam suara (misal: pelafalan bahasa Jepang). Rekaman akan disimpan sebagai materi audio.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="lessonIsLockedCheckbox"
                  checked={lessonIsLocked}
                  onChange={(e) => setLessonIsLocked(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="lessonIsLockedCheckbox" className="text-xs text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer">
                  Kunci Materi Ini (Hanya dapat dibuka oleh Sensei/Admin/VIP)
                </label>
              </div>

              {/* Tenggang Waktu & Durasi Pengerjaan */}
              <div className="grid grid-cols-2 gap-3.5 pt-2.5 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tenggang Waktu (Deadline) - Opsional</label>
                  <input
                    type="datetime-local"
                    value={lessonDeadline || ""}
                    onChange={(e) => setLessonDeadline(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Durasi Pengerjaan (Menit) - Opsional</label>
                  <select
                    value={lessonDurationMinutes || ""}
                    onChange={(e) => setLessonDurationMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-800 focus:outline-emerald-600 cursor-pointer text-slate-700 font-medium"
                  >
                    <option value="">Tanpa Batas Durasi</option>
                    <option value="5">5 Menit</option>
                    <option value="10">10 Menit</option>
                    <option value="15">15 Menit</option>
                    <option value="20">20 Menit</option>
                    <option value="30">30 Menit</option>
                    <option value="45">45 Menit</option>
                    <option value="60">60 Menit (1 Jam)</option>
                    <option value="90">90 Menit (1.5 Jam)</option>
                    <option value="120">120 Menit (2 Jam)</option>
                    <option value="180">180 Menit (3 Jam)</option>
                  </select>
                </div>
              </div>

              {/* Text Area Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {lessonDifficulty === "Tugas" ? "Isi Petunjuk & Deskripsi Tugas" : "Isi Ringkasan Materi & Keterangan"}
                </label>
                <textarea
                  rows={4}
                  placeholder={lessonDifficulty === "Tugas" ? "Ketik detail tugas, instruksi pengerjaan, rincian soal atau rujukan PR di sini..." : "Ketik deskripsi materi, langkah-langkah belajar, kisi-kisi atau terjemahan..."}
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-xs font-normal text-slate-700 leading-relaxed focus:outline-emerald-600 whitespace-pre-line"
                />
              </div>

              {/* Footer Actions inside form */}
              <div className="border-t border-slate-100 pt-4.5 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsLessonFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLesson}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmittingLesson ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>{lessonDifficulty === "Tugas" ? "Simpan Tugas" : "Simpan Materi"}</span>
                    </>
                  )}
                </button>
              </div>
            </ConfirmForm>

          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 overflow-y-auto">
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
                  <p className="text-xs text-slate-400 mt-1">Anda belum mengunggah dokumen ini.</p>
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
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Buka PDF di Tab Baru</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => downloadFile(viewingDoc.url, `${viewingDoc.title}.pdf`)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>Unduh PDF</span>
                      </button>
                    </div>
                  </div>
                  <iframe
                    src={getEmbeddablePdfUrl(viewingDoc.url)}
                    title="PDF Viewer"
                    className="w-full h-[45vh] bg-white rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="flex flex-wrap gap-3 justify-center items-center w-full">
                    <a
                      href={viewingDoc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Buka Gambar di Tab Baru</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadFile(viewingDoc.url, `${viewingDoc.title}.jpg`)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Unduh Gambar</span>
                    </button>
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
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Deletion Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-fade-in flex flex-col">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 border border-rose-100 animate-pulse">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-display font-extrabold text-slate-950 mb-1.5">
                Konfirmasi Hapus Data
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[260px] mb-4">
                Apakah Anda yakin ingin menghapus {deleteType === "lesson" ? "materi" : "kuis / soal"} ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              {/* Target Data Preview Box */}
              {deleteTargetName && (
                <div className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-3 text-left mb-6">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Nama {deleteType === "lesson" ? "Materi" : "Kuis / Soal"}
                  </span>
                  <p className="text-xs font-bold text-slate-700 font-sans line-clamp-3 leading-relaxed">
                    {deleteTargetName}
                  </p>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeleteType(null);
                    setDeleteTargetId(null);
                    setDeleteTargetName("");
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Ya, Hapus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingAttendancePhoto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewingAttendancePhoto(null)}>
          <div className="bg-white rounded-3xl p-4 max-w-md w-full shadow-2xl relative space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                <span>📷</span> Foto Bukti Presensi
              </h4>
              <button
                onClick={() => setViewingAttendancePhoto(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[220px] max-h-[65vh]">
              <img
                src={viewingAttendancePhoto}
                alt="Foto Absen"
                className="max-h-[63vh] w-auto object-contain rounded-xl"
              />
            </div>
            <div className="text-center pt-1">
              <button
                onClick={() => setViewingAttendancePhoto(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
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

