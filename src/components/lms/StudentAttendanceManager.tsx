import React from "react";
import { BookOpen, Calendar, ChevronDown, ChevronUp, Clock, Edit3, Save, Search, Users, X } from "lucide-react";

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
