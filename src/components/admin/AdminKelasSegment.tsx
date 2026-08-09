
                import React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, GraduationCap, Users, Anchor, Compass, Globe, Plus, Trash2, Edit, BookOpen, AlertCircle, Check, X } from "lucide-react";
import { SystemState } from "../../types";
import { CHAPTERS_LIST, MATH_CHAPTERS_LIST } from "../../chapters";
import { StudentActivitySummary } from "../StudentActivitySummary";
import { ConfirmButton } from "../ConfirmButton";

interface AdminKelasSegmentProps {
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  selectedClassForChapters: any | null;
  setSelectedClassForChapters: (cls: any | null) => void;
  activeChapterTab: "list" | "form";
  setActiveChapterTab: (tab: "list" | "form") => void;
  newChapterNumber: number;
  setNewChapterNumber: (num: number) => void;
  newChapterTitle: string;
  setNewChapterTitle: (title: string) => void;
  newChapterJapaneseTitle: string;
  setNewChapterJapaneseTitle: (title: string) => void;
  newChapterDesc: string;
  setNewChapterDesc: (desc: string) => void;
  editingChapterNumber: number | null;
  setEditingChapterNumber: (num: number | null) => void;
}

export default function AdminKelasSegment({
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
}: AdminKelasSegmentProps) {
  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");
  const [activeTab, setActiveTab] = React.useState<"daftar" | "tambah">("daftar");
  const [isRegulerSectionExpanded, setIsRegulerSectionExpanded] = React.useState(true);
  const [isAlumniSectionExpanded, setIsAlumniSectionExpanded] = React.useState(false);
  const [editingClassId, setEditingClassId] = React.useState<string | null>(null);
  const [expandedClassIds, setExpandedClassIds] = React.useState<string[]>([]);
  const [renamingClassId, setRenamingClassId] = React.useState<string | null>(null);
  const [renamingValue, setRenamingValue] = React.useState<string>("");
  const toggleExpand = (id: string) => setExpandedClassIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  
  const handleRenameClass = async (id: string) => {
    if (!renamingValue.trim()) return;
    const baseClasses = systemState?.customization?.lmsClasses || [];
    const updatedClasses = [...baseClasses];
    const targetIdx = updatedClasses.findIndex((item: any) => item.id.toLowerCase() === id.toLowerCase());
    
    let oldName = "";
    const newName = renamingValue.trim();
    if (targetIdx !== -1) {
      oldName = updatedClasses[targetIdx].name;
      if (
        newName.toLowerCase() !== oldName.toLowerCase() &&
        updatedClasses.some((c: any, i: number) => i !== targetIdx && c.name.toLowerCase() === newName.toLowerCase())
      ) {
        alert(`Kelas dengan nama "${newName}" sudah terdaftar.`);
        return;
      }
      updatedClasses[targetIdx] = {
        ...updatedClasses[targetIdx],
        name: newName
      };
    } else {
      return;
    }

    await onUpdateState("customization", "update", {
      ...systemState?.customization,
      lmsClasses: updatedClasses,
      ...(oldName && oldName !== newName ? { renamedClass: { oldName, newName } } : {})
    });
    
    setRenamingClassId(null);
  };
  
  const allClasses = [
            ...(systemState?.customization?.lmsClasses || systemState?.lmsClasses || [])
          ];
          
          const students = systemState?.activeStudents || [];
 
          return (
            <div className="space-y-6 animate-fade-in text-slate-800">
              {/* Header banner */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-800 text-white rounded-3xl p-4.5 sm:p-6 md:p-8 shadow-md relative overflow-hidden">
                <div className="absolute right-0 bottom-0 opacity-10 translate-x-12 translate-y-12">
                  <GraduationCap className="h-48 w-48" />
                </div>
                <div className="max-w-xl space-y-2 relative z-10">
                  <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2.5 py-1 rounded-full tracking-wider border border-white/20">
                    Sistem Akademik LPK
                  </span>
                  <h3 className="font-display font-extrabold text-lg sm:text-2xl leading-tight">
                    Manajemen & Status Kelas
                  </h3>
                  <p className="text-xs text-violet-100 leading-relaxed font-normal">
                    Kelola seluruh kelas belajar LPK di sini. Tambah kelas baru, atur tipe (Reguler / Alumni), serta aktifkan atau nonaktifkan kelas. Kelas yang dinonaktifkan akan disembunyikan dari pilihan filter pembelajaran.
                  </p>
                </div>
              </div>

              {/* Quick Access Buttons */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('daftar')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${activeTab === 'daftar' ? 'bg-indigo-600 text-white shadow-lg border-indigo-600 ring-2 ring-indigo-200 ring-offset-1' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <BookOpen className={`h-5 w-5 mx-auto mb-1.5 ${activeTab === 'daftar' ? 'text-indigo-200' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Daftar Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tambah')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${activeTab === 'tambah' ? 'bg-blue-600 text-white shadow-lg border-blue-600 ring-2 ring-blue-200 ring-offset-1' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                >
                  <Plus className={`h-5 w-5 mx-auto mb-1.5 ${activeTab === 'tambah' ? 'text-blue-200' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Tambah Reguler</span>
                </button>
              </div>
              
              <div className="flex flex-col gap-6">
                
                {activeTab === "tambah" && (
                <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">
                      Tambah Kelas Reguler Baru
                    </h4>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Buat ruang kelas baru untuk menampung plotting siswa dan materi pembelajaran.
                    </p>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const name = (formData.get("className") as string || "").trim();
                      const type = "reguler";
                      const method = formData.get("classMethod") as string;
                      const pMonth = formData.get("classPeriodMonth") as string;
                      const pYear = formData.get("classPeriodYear") as string;
                      const period = `${pMonth} ${pYear}`;
                      if (!name) return;
                      // Check duplicate against both name AND id: a class's id is
                      // permanently set to its name at creation and never changes
                      // on rename, so a renamed-away name is still "in use" as an
                      // id. Allowing it to be reused would create two classes
                      // sharing the same lmsClasses/{id} Firestore document,
                      // silently corrupting whichever one loses the write race.
                      if (allClasses.some(c => c.name.toLowerCase() === name.toLowerCase() || c.id.toLowerCase() === name.toLowerCase())) {
                        alert(`Kelas dengan nama "${name}" sudah terdaftar.`);
                        return;
                      }
                      const newClassObj = {
                        id: name,
                        name: name,
                        isActive: true,
                        type: type,
                        method: method,
                        period: period,
                        chapters: CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })),
                        mathChapters: MATH_CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 }))
                      };
                      const updatedLmsClasses = [
                        ...(systemState?.customization?.lmsClasses || []),
                        newClassObj
                      ];
                      const ok = await onUpdateState("customization", "update", {
                        ...systemState?.customization,
                        lmsClasses: updatedLmsClasses
                      });
                      if (ok) {
                        form.reset();
                        alert(`Kelas "${name}" berhasil ditambahkan.`);
                        setActiveTab("daftar");
                      }
                    }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Nama Kelas Reguler
                      </label>
                      <input
                        type="text"
                        name="className"
                        required
                        placeholder="Contoh: Tokyo, Kyoto, Osaka"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Metode Pembelajaran
                      </label>
                      <select
                        name="classMethod"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="Offline">Offline (Luring)</option>
                        <option value="Online">Online (Daring)</option>
                        <option value="Hybrid">Hybrid (Campuran)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Periode Kelas (Bulan & Tahun)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          name="classPeriodMonth"
                          required
                          defaultValue="Juni"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold cursor-pointer font-sans"
                        >
                          {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          name="classPeriodYear"
                          required
                          defaultValue="2026"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold cursor-pointer font-sans"
                        >
                          {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Simpan Kelas Reguler Baru
                    </button>
                  </form>
                </div>
                )}
                
                {/* Daftar Kelas */}
                {activeTab === "daftar" && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">
                      Daftar & Pengaturan Kelas
                    </h4>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Aktifkan atau nonaktifkan kelas yang ada untuk mengontrol penampilannya di platform.
                    </p>
                  </div>

                                                      
                                    
                  {/* Bagian Kelas Reguler */}
                  <div className="space-y-3 mt-6">
                    <button 
                      onClick={() => setIsRegulerSectionExpanded(!isRegulerSectionExpanded)}
                      className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 border border-blue-200 p-4 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-blue-900 text-sm">Pengaturan Kelas Reguler</h5>
                          <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                            Kelola {allClasses.filter(c => c.type !== "alumni").length} kelas reguler yang ada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-white text-blue-700 rounded-full text-[10px] font-bold border border-blue-100 shadow-sm">
                          {allClasses.filter(c => c.type !== "alumni").length} Kelas
                        </span>
                        <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-blue-100 transition-transform duration-300 ${isRegulerSectionExpanded ? "rotate-180" : ""}`}>
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </button>
                    {isRegulerSectionExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300 pt-2">
                      {allClasses.filter(c => c.type !== "alumni").map((c) => {
                        const isEditing = editingClassId === c.id;
                        const isExpanded = expandedClassIds.includes(c.id);
                        return (
                          <div key={c.id} className="bg-white rounded-2xl p-4 border border-blue-100 flex flex-col gap-3 relative overflow-hidden group shadow-sm hover:shadow-md transition">
                            {/* Indicator */}
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                            
                            <div className="flex justify-between items-start pl-2">
                              <div>
                                {renamingClassId === c.id ? (
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5 w-full">
                                    <input 
                                      type="text" 
                                      value={renamingValue} 
                                      onChange={(e) => setRenamingValue(e.target.value)}
                                      className="border-2 border-blue-500 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                                      placeholder="Nama kelas baru..."
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameClass(c.id);
                                        if (e.key === 'Escape') setRenamingClassId(null);
                                      }}
                                    />
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button 
                                        type="button"
                                        onClick={() => handleRenameClass(c.id)} 
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 flex-1 sm:flex-initial"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Simpan
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setRenamingClassId(null)} 
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" /> Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h5 className="font-bold text-slate-800 text-sm sm:text-base">{c.name}</h5>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setRenamingClassId(c.id);
                                        setRenamingValue(c.name);
                                      }}
                                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                                      title="Edit / Rename Nama Kelas"
                                    >
                                      <Edit className="w-3 h-3 text-blue-600" /> Edit Nama
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border bg-blue-50 text-blue-700 border-blue-150">
                                    Reguler
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                                    c.isActive
                                      ? "bg-green-50 text-green-700 border-green-150"
                                      : "bg-slate-50 text-slate-500 border-slate-200"
                                  }`}>
                                    {c.isActive ? "Aktif" : "Nonaktif"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Power Toggle */}
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const baseClasses = systemState?.customization?.lmsClasses || [];
                                    const updatedClasses = [...baseClasses];
                                    const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === c.id.toLowerCase());
                                    if (targetIdx !== -1) {
                                      updatedClasses[targetIdx] = {
                                        ...updatedClasses[targetIdx],
                                        isActive: !updatedClasses[targetIdx].isActive
                                      };
                                    } else {
                                      updatedClasses.push({
                                        id: c.id,
                                        name: c.name,
                                        isActive: !c.isActive,
                                        type: c.type
                                      });
                                    }
                                    await onUpdateState("customization", "update", {
                                      ...systemState?.customization,
                                      lmsClasses: updatedClasses
                                    });
                                  }}
                                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                                    c.isActive ? "bg-indigo-500" : "bg-slate-200"
                                  }`}
                                  title={c.isActive ? "Nonaktifkan" : "Aktifkan"}
                                >
                                  <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                                    c.isActive ? "translate-x-6" : "translate-x-0"
                                  }`} />
                                </button>
                              </div>
                            </div>

                            {/* Detail Toggle */}
                            <button 
                               onClick={() => toggleExpand(c.id)} 
                               className="ml-2 mt-1 w-full text-left flex items-center justify-between p-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition cursor-pointer text-blue-700 font-semibold text-xs"
                            >
                               <span>{isExpanded ? "Sembunyikan Detail" : "Lihat Detail"}</span>
                               <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>

                            {isExpanded && (
                               <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="grid grid-cols-2 gap-3 pl-2">
                                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jadwal / Periode</span>
                                      <button onClick={() => setEditingClassId(isEditing ? null : c.id)} className="text-indigo-500 hover:text-indigo-700 transition cursor-pointer p-1"><Edit className="w-3 h-3"/></button>
                                    </div>
                                    {(() => {
                                      let selectedMonth = "Juni";
                                      let selectedYear = "2026";
                                      if (c.period) {
                                        const parts = c.period.split(" ");
                                        if (parts.length === 2) {
                                          selectedMonth = parts[0];
                                          selectedYear = parts[1];
                                        }
                                      }
                                      
                                      const updatePeriod = async (m, y) => {
                                        const baseClasses = systemState?.customization?.lmsClasses || [];
                                        const updatedClasses = [...baseClasses];
                                        const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === c.id.toLowerCase());
                                        const newPeriod = `${m} ${y}`;
                                        if (targetIdx !== -1) {
                                          updatedClasses[targetIdx] = {
                                            ...updatedClasses[targetIdx],
                                            period: newPeriod
                                          };
                                        } else {
                                          updatedClasses.push({
                                            id: c.id,
                                            name: c.name,
                                            isActive: c.isActive,
                                            type: c.type,
                                            period: newPeriod
                                          });
                                        }
                                        await onUpdateState("customization", "update", {
                                          ...systemState?.customization,
                                          lmsClasses: updatedClasses
                                        });
                                      };

                                      return isEditing ? (
                                        <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                          <select
                                            value={selectedMonth}
                                            onChange={async (e) => await updatePeriod(e.target.value, selectedYear)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-300 transition cursor-pointer"
                                          >
                                            {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                                              <option key={m} value={m}>{m}</option>
                                            ))}
                                          </select>
                                          <select
                                            value={selectedYear}
                                            onChange={async (e) => await updatePeriod(selectedMonth, e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-300 transition cursor-pointer"
                                          >
                                            {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                                              <option key={y} value={y}>{y}</option>
                                            ))}
                                          </select>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-slate-700">{c.period || "Juni 2026"}</span>
                                      );
                                    })()}
                                  </div>

                                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex flex-col justify-between">
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Metode</span>
                                        <button onClick={() => setEditingClassId(isEditing ? null : c.id)} className="text-indigo-500 hover:text-indigo-700 transition cursor-pointer p-1"><Edit className="w-3 h-3"/></button>
                                      </div>
                                      {isEditing ? (
                                        <div className="animate-in fade-in zoom-in-95 duration-200">
                                          <select
                                            value={c.method || "Offline"}
                                            onChange={async (e) => {
                                              const newVal = e.target.value;
                                              const baseClasses = systemState?.customization?.lmsClasses || [];
                                              const updatedClasses = baseClasses.map(item =>
                                                  item.id.toLowerCase() === c.id.toLowerCase()
                                                    ? { ...item, method: newVal }
                                                    : item
                                              );
                                              await onUpdateState("customization", "update", {
                                                ...systemState?.customization,
                                                lmsClasses: updatedClasses
                                              });
                                            }}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-300 transition cursor-pointer"
                                          >
                                            <option value="Offline">Offline</option>
                                            <option value="Online">Online</option>
                                            <option value="Hybrid">Hybrid</option>
                                          </select>
                                        </div>
                                      ) : (
                                        <span className="text-xs font-bold text-slate-700">{c.method || "Offline"}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex gap-2 pl-2 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // @ts-ignore
                                        const classChapters = c.chapters || (typeof CHAPTERS_LIST !== 'undefined' ? CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })) : []);
                                        // @ts-ignore
                                        const classMathChapters = c.mathChapters || (typeof MATH_CHAPTERS_LIST !== 'undefined' ? MATH_CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })) : []);
                                        
                                        setSelectedClassForChapters({
                                          ...c,
                                          chapters: classChapters,
                                          mathChapters: classMathChapters
                                        });
                                        
                                        const nextNum = classChapters.length > 0
                                            ? Math.max(...classChapters.map((ch: any) => ch.number)) + 1
                                            : 1;
                                        setNewChapterNumber(nextNum);
                                        setNewChapterTitle("");
                                        setNewChapterJapaneseTitle("");
                                        setNewChapterDesc("");
                                        setEditingChapterNumber(null);
                                      }}
                                      className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl font-bold text-[10px] uppercase cursor-pointer transition flex flex-col items-center justify-center gap-0.5"
                                    >
                                      <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3"/> Silabus & Materi</span>
                                      <span className="text-[8.5px] opacity-75 capitalize">
                                        {/* @ts-ignore */}
                                        {(c.chapters || (typeof CHAPTERS_LIST !== 'undefined' ? CHAPTERS_LIST : [])).filter((ch: any) => ch.isActive !== false).length} Bab JP • {(c.mathChapters || (typeof MATH_CHAPTERS_LIST !== 'undefined' ? MATH_CHAPTERS_LIST : [])).filter((ch: any) => ch.isActive !== false).length} Bab SSW
                                      </span>
                                    </button>
                                  <ConfirmButton
                                      type="button"
                                      confirmTitle="Hapus Kelas"
                                      confirmMessage="Apakah Anda yakin ingin menghapus kelas ini? Data yang terkait mungkin akan terpengaruh."
                                      onConfirmClick={async () => {
                                        const baseClasses = systemState?.customization?.lmsClasses || [];
                                        const updatedClasses = baseClasses.filter((item: any) => item.id.toLowerCase() !== c.id.toLowerCase());
                                        await onUpdateState("customization", "update", {
                                          ...systemState?.customization,
                                          lmsClasses: updatedClasses,
                                          deletedLmsClassId: c.id
                                        });
                                      }}
                                      className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition cursor-pointer"
                                      title="Hapus Kelas"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </ConfirmButton>
                                </div>
                               </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>

                                    {/* Bagian Kelas Alumni */}
                  <div className="space-y-3 mt-8">
                    <button 
                      onClick={() => setIsAlumniSectionExpanded(!isAlumniSectionExpanded)}
                      className="w-full flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-4 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <GraduationCap className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-emerald-900 text-sm">Pengaturan Kelas Alumni</h5>
                          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Kelola {allClasses.filter(c => c.type === "alumni").length} kelas alumni yang ada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-white text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm">
                          {allClasses.filter(c => c.type === "alumni").length} Kelas
                        </span>
                        <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-emerald-100 transition-transform duration-300 ${isAlumniSectionExpanded ? "rotate-180" : ""}`}>
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    </button>

                    {isAlumniSectionExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300 pt-2">
                        {allClasses.filter(c => c.type === "alumni").map((c) => {
                          const isEditing = editingClassId === c.id;
                          const isExpanded = expandedClassIds.includes(c.id);
                          return (
                            <div key={c.id} className="bg-white rounded-2xl p-4 border border-emerald-200 flex flex-col gap-3 relative overflow-hidden group shadow-sm hover:shadow-md transition">
                              {/* Indicator */}
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                              
                              <div className="flex justify-between items-start pl-2">
                                <div>
                                  {renamingClassId === c.id ? (
                                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2.5 w-full">
                                    <input 
                                      type="text" 
                                      value={renamingValue} 
                                      onChange={(e) => setRenamingValue(e.target.value)}
                                      className="border-2 border-emerald-500 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-300 w-full"
                                      placeholder="Nama kelas baru..."
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameClass(c.id);
                                        if (e.key === 'Escape') setRenamingClassId(null);
                                      }}
                                    />
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button 
                                        type="button"
                                        onClick={() => handleRenameClass(c.id)} 
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95 flex-1 sm:flex-initial"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Simpan
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setRenamingClassId(null)} 
                                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" /> Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h5 className="font-bold text-slate-800 text-sm sm:text-base">{c.name}</h5>
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        setRenamingClassId(c.id);
                                        setRenamingValue(c.name);
                                      }}
                                      className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-2xs active:scale-95"
                                      title="Edit / Rename Nama Kelas"
                                    >
                                      <Edit className="w-3 h-3 text-emerald-600" /> Edit Nama
                                    </button>
                                  </div>
                                )}
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-150">
                                      Alumni
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                                      c.isActive
                                        ? "bg-green-50 text-green-700 border-green-150"
                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}>
                                      {c.isActive ? "Aktif" : "Nonaktif"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Power Toggle */}
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const baseClasses = systemState?.customization?.lmsClasses || [];
                                      const updatedClasses = [...baseClasses];
                                      const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === c.id.toLowerCase());
                                      if (targetIdx !== -1) {
                                        updatedClasses[targetIdx] = {
                                          ...updatedClasses[targetIdx],
                                          isActive: !updatedClasses[targetIdx].isActive
                                        };
                                      } else {
                                        updatedClasses.push({
                                          id: c.id,
                                          name: c.name,
                                          isActive: !c.isActive,
                                          type: c.type
                                        });
                                      }
                                      await onUpdateState("customization", "update", {
                                        ...systemState?.customization,
                                        lmsClasses: updatedClasses
                                      });
                                    }}
                                    className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                                      c.isActive ? "bg-emerald-500" : "bg-slate-200"
                                    }`}
                                    title={c.isActive ? "Nonaktifkan" : "Aktifkan"}
                                  >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                                      c.isActive ? "translate-x-6" : "translate-x-0"
                                    }`} />
                                  </button>
                                </div>
                              </div>

                              {/* Detail Toggle */}
                              <button 
                                 onClick={() => toggleExpand(c.id)} 
                                 className="ml-2 mt-1 w-full text-left flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-100 transition cursor-pointer text-emerald-800 font-semibold text-xs group/btn"
                              >
                                 <span>{isExpanded ? "Sembunyikan Detail" : "Lihat Detail"}</span>
                                 <ChevronDown className={`w-4 h-4 transition-transform group-hover/btn:scale-110 ${isExpanded ? "rotate-180" : ""}`} />
                              </button>

                              {isExpanded && (
                                 <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                  <div className="grid grid-cols-2 gap-3 pl-2">
                                    <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jadwal / Periode</span>
                                        <button onClick={() => setEditingClassId(isEditing ? null : c.id)} className="text-emerald-600 hover:text-emerald-800 transition cursor-pointer p-1"><Edit className="w-3 h-3"/></button>
                                      </div>
                                      {(() => {
                                        let selectedMonth = "Juni";
                                        let selectedYear = "2026";
                                        if (c.period) {
                                          const parts = c.period.split(" ");
                                          if (parts.length === 2) {
                                            selectedMonth = parts[0];
                                            selectedYear = parts[1];
                                          }
                                        }
                                        
                                        const updatePeriod = async (m, y) => {
                                          const baseClasses = systemState?.customization?.lmsClasses || [];
                                          const updatedClasses = [...baseClasses];
                                          const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === c.id.toLowerCase());
                                          const newPeriod = `${m} ${y}`;
                                          if (targetIdx !== -1) {
                                            updatedClasses[targetIdx] = {
                                              ...updatedClasses[targetIdx],
                                              period: newPeriod
                                            };
                                          } else {
                                            updatedClasses.push({
                                              id: c.id,
                                              name: c.name,
                                              isActive: c.isActive,
                                              type: c.type,
                                              period: newPeriod
                                            });
                                          }
                                          await onUpdateState("customization", "update", {
                                            ...systemState?.customization,
                                            lmsClasses: updatedClasses
                                          });
                                        };

                                        return isEditing ? (
                                          <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            <select
                                              value={selectedMonth}
                                              onChange={async (e) => await updatePeriod(e.target.value, selectedYear)}
                                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                                            >
                                              {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                              ))}
                                            </select>
                                            <select
                                              value={selectedYear}
                                              onChange={async (e) => await updatePeriod(selectedMonth, e.target.value)}
                                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                                            >
                                              {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                              ))}
                                            </select>
                                          </div>
                                        ) : (
                                          <span className="text-xs font-bold text-emerald-900">{c.period || "Juni 2026"}</span>
                                        );
                                      })()}
                                    </div>

                                    <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100 flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Metode</span>
                                          <button onClick={() => setEditingClassId(isEditing ? null : c.id)} className="text-emerald-600 hover:text-emerald-800 transition cursor-pointer p-1"><Edit className="w-3 h-3"/></button>
                                        </div>
                                        {isEditing ? (
                                          <div className="animate-in fade-in zoom-in-95 duration-200">
                                            <select
                                              value={c.method || "Offline"}
                                              onChange={async (e) => {
                                                const newVal = e.target.value;
                                                const baseClasses = systemState?.customization?.lmsClasses || [];
                                                const updatedClasses = baseClasses.map(item =>
                                                    item.id.toLowerCase() === c.id.toLowerCase()
                                                      ? { ...item, method: newVal }
                                                      : item
                                                );
                                                await onUpdateState("customization", "update", {
                                                  ...systemState?.customization,
                                                  lmsClasses: updatedClasses
                                                });
                                              }}
                                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                                            >
                                              <option value="Offline">Offline</option>
                                              <option value="Online">Online</option>
                                              <option value="Hybrid">Hybrid</option>
                                            </select>
                                          </div>
                                        ) : (
                                          <span className="text-xs font-bold text-emerald-900">{c.method || "Offline"}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex gap-2 pl-2 pt-2 border-t border-emerald-100/50">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // @ts-ignore
                                          const classChapters = c.chapters || (typeof CHAPTERS_LIST !== 'undefined' ? CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })) : []);
                                          // @ts-ignore
                                          const classMathChapters = c.mathChapters || (typeof MATH_CHAPTERS_LIST !== 'undefined' ? MATH_CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })) : []);
                                          
                                          setSelectedClassForChapters({
                                            ...c,
                                            chapters: classChapters,
                                            mathChapters: classMathChapters
                                          });
                                          
                                          const nextNum = classChapters.length > 0
                                              ? Math.max(...classChapters.map((ch: any) => ch.number)) + 1
                                              : 1;
                                          setNewChapterNumber(nextNum);
                                          setNewChapterTitle("");
                                          setNewChapterJapaneseTitle("");
                                          setNewChapterDesc("");
                                          setEditingChapterNumber(null);
                                        }}
                                        className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[10px] uppercase cursor-pointer transition flex flex-col items-center justify-center gap-0.5"
                                      >
                                        <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3"/> Silabus & Materi</span>
                                        <span className="text-[8.5px] opacity-75 capitalize">
                                          {/* @ts-ignore */}
                                          {(c.chapters || (typeof CHAPTERS_LIST !== 'undefined' ? CHAPTERS_LIST : [])).filter((ch: any) => ch.isActive !== false).length} Bab JP • {(c.mathChapters || (typeof MATH_CHAPTERS_LIST !== 'undefined' ? MATH_CHAPTERS_LIST : [])).filter((ch: any) => ch.isActive !== false).length} Bab SSW
                                        </span>
                                      </button>
                                    <ConfirmButton
                                        type="button"
                                        confirmTitle="Hapus Kelas"
                                        confirmMessage="Apakah Anda yakin ingin menghapus kelas ini? Data yang terkait mungkin akan terpengaruh."
                                        onConfirmClick={async () => {
                                          const baseClasses = systemState?.customization?.lmsClasses || [];
                                          const updatedClasses = baseClasses.filter((item: any) => item.id.toLowerCase() !== c.id.toLowerCase());
                                          await onUpdateState("customization", "update", {
                                            ...systemState?.customization,
                                            lmsClasses: updatedClasses,
                                            deletedLmsClassId: c.id
                                          });
                                        }}
                                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-emerald-200 hover:border-red-200 transition cursor-pointer"
                                        title="Hapus Kelas"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </ConfirmButton>
                                  </div>
                                 </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              {selectedClassForChapters && createPortal(
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[82vh] md:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
                    
                    {/* Modal Header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-700 p-2 rounded-xl">
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-display font-black text-slate-800 text-sm">
                            Manajemen Bab Kelas: {selectedClassForChapters.name}
                          </h3>
                          <p className="text-[10px] text-slate-400 font-normal">
                            Tambahkan, hapus, atau sesuaikan materi bab kurikulum untuk kelas {selectedClassForChapters.type === "alumni" ? "Alumni" : "Reguler"} ini.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedClassForChapters(null)}
                        className="p-2 hover:bg-slate-200 rounded-full transition cursor-pointer text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
 
                    {/* Subject Switcher */}
                    <div className="flex border-b border-slate-100 p-3 gap-2 bg-indigo-50/30">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrCurriculumSubject("Bahasa Jepang");
                          const chList = selectedClassForChapters.chapters || [];
                          const nextNum = chList.length > 0 ? Math.max(...chList.map((ch: any) => ch.number)) + 1 : 1;
                          setNewChapterNumber(nextNum);
                          setEditingChapterNumber(null);
                          setNewChapterTitle("");
                          setNewChapterJapaneseTitle("");
                          setNewChapterDesc("");
                        }}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                          currCurriculumSubject === "Bahasa Jepang"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        🇯🇵 Kurikulum Bahasa Jepang
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrCurriculumSubject("SSW");
                          const chList = selectedClassForChapters.mathChapters || [];
                          const nextNum = chList.length > 0 ? Math.max(...chList.map((ch: any) => ch.number)) + 1 : 1;
                          setNewChapterNumber(nextNum);
                          setEditingChapterNumber(null);
                          setNewChapterTitle("");
                          setNewChapterJapaneseTitle("");
                          setNewChapterDesc("");
                        }}
                        className={`px-4 py-2 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                          currCurriculumSubject === "SSW"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        🧮 Kurikulum Matematika (SSW)
                      </button>
                    </div>

                    {/* Tab Switcher - Mobile Only */}
                    <div className="flex md:hidden border-b border-slate-100 p-2 gap-1 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setActiveChapterTab("list")}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
                          activeChapterTab === "list"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        📖 Daftar Bab ({selectedClassForChapters.chapters?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveChapterTab("form")}
                        className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition ${
                          activeChapterTab === "form"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {editingChapterNumber !== null ? "✏️ Edit Detail Bab" : "➕ Tambah Bab"}
                      </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col md:grid md:grid-cols-12 gap-6 min-h-0">
                      {(() => {
                        const isMath = currCurriculumSubject === "SSW";
                        const chList = isMath 
                          ? (selectedClassForChapters.mathChapters || []) 
                          : (selectedClassForChapters.chapters || []);
                        const templateList = isMath ? MATH_CHAPTERS_LIST : CHAPTERS_LIST;
                        const subjectName = isMath ? "Matematika (SSW)" : "Bahasa Jepang";
                        const chaptersField = isMath ? "mathChapters" : "chapters";

                        return (
                          <>
                            {/* Left Side: Chapter List */}
                            <div className={`md:col-span-7 flex flex-col min-h-0 ${activeChapterTab === "list" ? "flex flex-1" : "hidden md:flex"}`}>
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                  Daftar Bab {subjectName} ({chList.length} Bab)
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (true) {
                                        setSelectedClassForChapters({
                                          ...selectedClassForChapters,
                                          [chaptersField]: templateList.map((ch: any) => ({ ...ch, isActive: ch.number === 1 }))
                                        });
                                        const nextNum = templateList.length > 0 ? Math.max(...templateList.map((ch: any) => ch.number)) + 1 : 1;
                                        setNewChapterNumber(nextNum);
                                      }
                                    }}
                                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer transition"
                                  >
                                    🔄 Reset ke {templateList.length} Bab Standar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (true) {
                                        const bab1 = chList.find((ch: any) => ch.number === 1) || templateList[0];
                                        setSelectedClassForChapters({
                                          ...selectedClassForChapters,
                                          [chaptersField]: [{ ...bab1, isActive: true }]
                                        });
                                        setNewChapterNumber(2);
                                      }
                                    }}
                                    className="text-[9px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 cursor-pointer transition"
                                  >
                                    🗑️ Sisakan Bab 1
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (true) {
                                        setSelectedClassForChapters({
                                          ...selectedClassForChapters,
                                          [chaptersField]: []
                                        });
                                        setNewChapterNumber(1);
                                      }
                                    }}
                                    className="text-[9px] font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 cursor-pointer transition"
                                  >
                                    🗑️ Kosongkan Semua (0 Bab)
                                  </button>
                                </div>
                              </div>

                              <div className="flex-1 overflow-y-auto border border-slate-150 rounded-2xl bg-slate-50/50 divide-y divide-slate-100 p-2 max-h-[35vh] md:max-h-[55vh]">
                                {chList.length === 0 ? (
                                  <div className="p-8 text-center text-slate-400 text-xs">
                                    Belum ada bab yang dikonfigurasi untuk kelas ini. Klik tombol reset atau tambahkan bab baru di sebelah kanan.
                                  </div>
                                ) : (
                                  [...chList]
                                    .sort((a: any, b: any) => a.number - b.number)
                                    .map((ch: any) => (
                                      <div key={ch.number} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 hover:bg-white rounded-xl transition group ${ch.isActive === false ? "opacity-60 bg-slate-100/50" : ""}`}>
                                        <div className="space-y-0.5 pr-2 flex-1 text-left">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ch.isActive === false ? "bg-slate-200 text-slate-600" : "bg-indigo-100 text-indigo-700"}`}>
                                              Bab {ch.number}
                                            </span>
                                            <h5 className={`text-xs font-bold ${ch.isActive === false ? "text-slate-500 line-through" : "text-slate-800"}`}>{ch.title}</h5>
                                            {ch.isActive === false && (
                                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-200 px-1.5 py-0.5 rounded">Nonaktif</span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-500 font-medium italic">{ch.japaneseTitle}</p>
                                          <p className="text-[9px] text-slate-400 font-normal line-clamp-1 group-hover:line-clamp-none transition-all duration-150">{ch.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 justify-end border-t border-slate-100 sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
                                          {/* Checkbox to Toggle Active State */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentlyActive = ch.isActive !== false;
                                              const targetActive = !currentlyActive;

                                              const updatedCh = chList.map((item: any) => {
                                                if (item.number === ch.number) {
                                                  return { ...item, isActive: targetActive };
                                                }
                                                return item;
                                              });
                                              setSelectedClassForChapters({
                                                ...selectedClassForChapters,
                                                [chaptersField]: updatedCh
                                              });
                                            }}
                                            className={`flex items-center gap-1 cursor-pointer text-[10px] font-black uppercase px-3 py-1.5 rounded-xl transition-all border shadow-sm ${
                                              ch.isActive !== false
                                                ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                                                : "bg-slate-200 text-slate-500 border-slate-300 hover:bg-slate-300"
                                            }`}
                                          >
                                            {ch.isActive !== false ? <Check className="w-3 h-3 stroke-[4]" /> : <X className="w-3 h-3 stroke-[4]" />}
                                            <span>{ch.isActive !== false ? "Aktif" : "Nonaktif"}</span>
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingChapterNumber(ch.number);
                                              setNewChapterNumber(ch.number);
                                              setNewChapterTitle(ch.title);
                                              setNewChapterJapaneseTitle(ch.japaneseTitle);
                                              setNewChapterDesc(ch.description || "");
                                              setActiveChapterTab("form"); // Auto switch tab on mobile
                                            }}
                                            className={`p-1.5 rounded-lg cursor-pointer transition ${
                                              editingChapterNumber === ch.number
                                                ? "text-amber-600 bg-amber-50 border border-amber-200"
                                                : "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                                            }`}
                                            title="Edit Bab"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updatedCh = chList.filter((item: any) => item.number !== ch.number);
                                              setSelectedClassForChapters({
                                                ...selectedClassForChapters,
                                                [chaptersField]: updatedCh
                                              });
                                              const nextNum = updatedCh.length > 0 ? Math.max(...updatedCh.map((item: any) => item.number)) + 1 : 1;
                                              setNewChapterNumber(nextNum);
                                              if (editingChapterNumber === ch.number) {
                                                setEditingChapterNumber(null);
                                                setNewChapterTitle("");
                                                setNewChapterJapaneseTitle("");
                                                setNewChapterDesc("");
                                              }
                                            }}
                                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                                            title="Hapus Bab"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                )}
                              </div>
                            </div>

                            {/* Right Side: Form Tambah/Edit Bab */}
                            <div className={`md:col-span-5 bg-slate-50 border border-slate-150 rounded-2xl p-3 md:p-4.5 space-y-4 overflow-y-auto ${activeChapterTab === "form" ? "block flex-1" : "hidden md:block"}`}>
                              <div>
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                  <span>{editingChapterNumber !== null ? "✏️ Edit Detail Bab" : `➕ Tambah Bab ${subjectName} Baru`}</span>
                                </h4>
                                <p className="text-[9px] text-slate-400 leading-tight">
                                  {editingChapterNumber !== null 
                                    ? `Mengedit detail Bab ${editingChapterNumber} pada kurikulum ${subjectName} kelas ini.`
                                    : `Materi baru akan ditambahkan ke kurikulum ${subjectName} kelas ini.`
                                  }
                                </p>
                              </div>

                              <div className="space-y-3.5">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Nomor Bab
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={newChapterNumber}
                                    onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                                    required
                                    disabled={editingChapterNumber !== null} // Keep the number locked while editing to avoid accidental conflicts
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Judul Bab (Bahasa Indonesia)
                                  </label>
                                  <input
                                    type="text"
                                    value={newChapterTitle}
                                    onChange={(e) => setNewChapterTitle(e.target.value)}
                                    placeholder={isMath ? "Contoh: Pecahan & Persentase" : "Contoh: Perkenalan Diri (Jikoshoukai)"}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Judul Bab (Bahasa Jepang / Istilah)
                                  </label>
                                  <input
                                    type="text"
                                    value={newChapterJapaneseTitle}
                                    onChange={(e) => setNewChapterJapaneseTitle(e.target.value)}
                                    placeholder={isMath ? "Contoh: 分数とパーセント" : "Contoh: 自己紹介"}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                                    required
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                                    Deskripsi / Konten Ringkas
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={newChapterDesc}
                                    onChange={(e) => setNewChapterDesc(e.target.value)}
                                    placeholder="Materi dasar yang dipelajari pada bab ini..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-normal text-slate-800 resize-none"
                                    required
                                  />
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newChapterTitle || !newChapterJapaneseTitle || !newChapterDesc) {
                                        alert("Mohon lengkapi seluruh field bab.");
                                        return;
                                      }

                                      if (editingChapterNumber !== null) {
                                        // Update existing chapter
                                        const updatedCh = chList.map((item: any) => {
                                          if (item.number === editingChapterNumber) {
                                            return {
                                              ...item,
                                              title: newChapterTitle,
                                              japaneseTitle: newChapterJapaneseTitle,
                                              description: newChapterDesc
                                            };
                                          }
                                          return item;
                                        });

                                        setSelectedClassForChapters({
                                          ...selectedClassForChapters,
                                          [chaptersField]: updatedCh
                                        });

                                        // Reset editing mode
                                        setEditingChapterNumber(null);
                                        const nextNum = updatedCh.length > 0 ? Math.max(...updatedCh.map((item: any) => item.number)) + 1 : 1;
                                        setNewChapterNumber(nextNum);
                                        setNewChapterTitle("");
                                        setNewChapterJapaneseTitle("");
                                        setNewChapterDesc("");
                                        setActiveChapterTab("list");
                                      } else {
                                        // Check duplicate for new chapter
                                        if (chList.some((ch: any) => ch.number === newChapterNumber)) {
                                          alert(`Bab nomor ${newChapterNumber} sudah ada di kelas ini.`);
                                          return;
                                        }

                                        const newChapterObj = {
                                          number: newChapterNumber,
                                          title: newChapterTitle,
                                          japaneseTitle: newChapterJapaneseTitle,
                                          description: newChapterDesc,
                                          isActive: true
                                        };

                                        const updatedCh = [...chList, newChapterObj].sort((a: any, b: any) => a.number - b.number);
                                        
                                        setSelectedClassForChapters({
                                          ...selectedClassForChapters,
                                          [chaptersField]: updatedCh
                                        });

                                        // Clear inputs
                                        setNewChapterTitle("");
                                        setNewChapterJapaneseTitle("");
                                        setNewChapterDesc("");
                                        setNewChapterNumber(newChapterNumber + 1);
                                        setActiveChapterTab("list");
                                      }
                                    }}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center justify-center gap-1 shadow-sm font-sans"
                                  >
                                    {editingChapterNumber !== null ? (
                                      <>
                                        <Check className="h-3.5 w-3.5" />
                                        <span>Simpan Perubahan Bab</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Tambahkan Bab</span>
                                      </>
                                    )}
                                  </button>

                                  {editingChapterNumber !== null && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingChapterNumber(null);
                                        const nextNum = chList.length > 0 
                                          ? Math.max(...chList.map((ch: any) => ch.number)) + 1 
                                          : 1;
                                        setNewChapterNumber(nextNum);
                                        setNewChapterTitle("");
                                        setNewChapterJapaneseTitle("");
                                        setNewChapterDesc("");
                                        setActiveChapterTab("list");
                                      }}
                                      className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition flex items-center justify-center font-sans"
                                    >
                                      Batal Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedClassForChapters(null)}
                        className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const baseClasses = systemState?.customization?.lmsClasses || [];

                          const updatedClasses = [...baseClasses];
                          const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === selectedClassForChapters.id.toLowerCase());
                          
                          if (targetIdx !== -1) {
                            updatedClasses[targetIdx] = {
                              ...updatedClasses[targetIdx],
                              chapters: selectedClassForChapters.chapters,
                              mathChapters: selectedClassForChapters.mathChapters
                            };
                          } else {
                            updatedClasses.push({
                              id: selectedClassForChapters.id,
                              name: selectedClassForChapters.name,
                              isActive: selectedClassForChapters.isActive,
                              type: selectedClassForChapters.type,
                              chapters: selectedClassForChapters.chapters,
                              mathChapters: selectedClassForChapters.mathChapters
                            });
                          }

                          const ok = await onUpdateState("customization", "update", {
                            ...systemState?.customization,
                            lmsClasses: updatedClasses
                          });

                          if (ok) {
                            setSelectedClassForChapters(null);
                            alert("Konfigurasi bab kelas berhasil disimpan.");
                          }
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-sm"
                      >
                        Simpan Perubahan Bab
                      </button>
                    </div>

                  </div>
                </div>,
                document.body
              )}
            </div>          ); }
