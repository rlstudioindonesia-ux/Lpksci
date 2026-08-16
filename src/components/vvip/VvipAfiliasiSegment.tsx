import React from "react";
import { Award, CheckCircle2, Filter, Plus, Search, Share2, Users } from "lucide-react";

interface VvipAfiliasiSegmentProps {
  affiliateSearch: any;
  isMobile: any;
  selectedReferrer: any;
  setAffiliateSearch: any;
  setSelectedReferrer: any;
  systemState: any;
}

export default function VvipAfiliasiSegment({ affiliateSearch, isMobile, selectedReferrer, setAffiliateSearch, setSelectedReferrer, systemState }: VvipAfiliasiSegmentProps) {
  return (
    <div className="space-y-6 animate-fade-in text-slate-800" id="vvip-affiliate-monitor-panel">
              {/* Header */}
              <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white p-8 rounded-[2.5rem] relative overflow-hidden border border-white/5 shadow-xl shadow-rose-500/10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-400/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 text-left">
                    <div className="inline-flex items-center gap-2 bg-rose-400/15 text-rose-300 px-3 py-1 rounded-full border border-rose-400/20 text-[10px] font-black uppercase tracking-widest">
                      <Share2 className="h-3 w-3 animate-pulse" /> Partner & Affiliate
                    </div>
                    <h3 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-none">
                      Sistem Monitoring Afiliasi LPK & Kontribusi Alumni
                    </h3>
                    <p className="text-xs text-rose-200 font-medium max-w-2xl leading-relaxed">
                      Laporan eksekutif rujukan siswa baru oleh alumni di Jepang. Pantau statistik performa rujukan masing-masing alumni secara langsung.
                    </p>
                  </div>
                </div>
              </div>
    
              <div className="bg-white border border-slate-200 p-5 sm:p-6 md:p-8 rounded-[2.5rem] shadow-sm space-y-6">
                {(() => {
                  // Get all referred students
                  const allReferred = [
                    ...(systemState.registeredStudents || []).filter(s => s.referrer).map(s => ({
                      id: s.id,
                      name: s.name,
                      status: s.status,
                      referrer: s.referrer || "unknown",
                      date: s.date || "-",
                      type: 'registered' as const
                    })),
                    ...(systemState.activeStudents || []).filter(s => s.referrer).map(s => ({
                      id: s.id,
                      name: s.name,
                      status: s.status,
                      referrer: s.referrer || "unknown",
                      date: "-",
                      type: 'active' as const
                    }))
                  ];
    
                  // Group stats by referrer
                  const referrerMap: Record<string, {
                    username: string;
                    realName: string;
                    total: number;
                    activeCount: number;
                    registeredCount: number;
                    students: typeof allReferred;
                  }> = {};
    
                  allReferred.forEach(s => {
                    const ref = s.referrer;
                    if (!referrerMap[ref]) {
                      const matchedUser = (systemState.users || []).find(u => u.username === ref);
                      referrerMap[ref] = {
                        username: ref,
                        realName: matchedUser?.name || ref,
                        total: 0,
                        activeCount: 0,
                        registeredCount: 0,
                        students: []
                      };
                    }
                    referrerMap[ref].total += 1;
                    if (s.type === 'active') {
                      referrerMap[ref].activeCount += 1;
                    } else {
                      referrerMap[ref].registeredCount += 1;
                    }
                    referrerMap[ref].students.push(s);
                  });
    
                  const referrersList = Object.values(referrerMap).sort((a, b) => b.total - a.total);
    
                  // Filter referrers by search query if any
                  const filteredReferrers = referrersList.filter(r => 
                    (r.username || "").toLowerCase().includes(affiliateSearch.toLowerCase()) ||
                    (r.realName || "").toLowerCase().includes(affiliateSearch.toLowerCase())
                  );
    
                  // Filter students to show
                  let displayedStudents = allReferred;
                  if (selectedReferrer !== "all") {
                    displayedStudents = displayedStudents.filter(s => s.referrer === selectedReferrer);
                  }
                  if (affiliateSearch) {
                    displayedStudents = displayedStudents.filter(s => 
                      (s.name || "").toLowerCase().includes(affiliateSearch.toLowerCase()) || 
                      (s.referrer || "").toLowerCase().includes(affiliateSearch.toLowerCase())
                    );
                  }
    
                  const totalReferrals = allReferred.length;
                  const activeReferrals = allReferred.filter(s => s.type === 'active').length;
                  const registeredReferrals = allReferred.filter(s => s.type === 'registered').length;
                  const totalAlumniCount = referrersList.length;
    
                  return (
                    <>
                      {/* Stats Summary Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-2xl flex items-center gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-3xs border border-rose-100">
                            <Users className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider">Total Referral</p>
                            <p className="text-lg font-black text-slate-850 leading-tight">{totalReferrals} Siswa</p>
                          </div>
                        </div>
    
                        <div className="bg-teal-50/50 border border-teal-150 p-4 rounded-2xl flex items-center gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-3xs border border-teal-100">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider">Siswa Dilatih</p>
                            <p className="text-lg font-black text-slate-850 leading-tight">{activeReferrals} Siswa</p>
                          </div>
                        </div>
    
                        <div className="bg-amber-50/50 border border-amber-150 p-4 rounded-2xl flex items-center gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-3xs border border-amber-100">
                            <Plus className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Pendaftar Baru</p>
                            <p className="text-lg font-black text-slate-850 leading-tight">{registeredReferrals} Calon</p>
                          </div>
                        </div>
    
                        <div className="bg-purple-50/50 border border-purple-150 p-4 rounded-2xl flex items-center gap-4">
                          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-purple-600 shadow-3xs border border-purple-100">
                            <Award className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">Alumni Aktif</p>
                            <p className="text-lg font-black text-slate-850 leading-tight">{totalAlumniCount} Alumni</p>
                          </div>
                        </div>
                      </div>
    
                      {/* Filter and search controls */}
                      <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-150">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <Search className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="Cari siswa rujukan atau nama alumni..."
                            value={affiliateSearch}
                            onChange={(e) => setAffiliateSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-550 transition font-sans text-left"
                          />
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          {selectedReferrer !== "all" && (
                            <button
                              type="button"
                              onClick={() => setSelectedReferrer("all")}
                              className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 animate-fade-in"
                            >
                              <Filter className="h-3.5 w-3.5" />
                              <span>Alumni: {referrerMap[selectedReferrer]?.realName} (X)</span>
                            </button>
                          )}
                          
                          {(affiliateSearch || selectedReferrer !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setAffiliateSearch("");
                                setSelectedReferrer("all");
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                            >
                              Batal Filter
                            </button>
                          )}
                        </div>
                      </div>
    
                      {/* Split sections */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* LEFT COLUMN: Alumni ranking */}
                        <div className="lg:col-span-5 space-y-2.5">
                          <div className="px-1 flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-450 uppercase tracking-widest font-mono">
                              Alumni Pembawa Siswa ({filteredReferrers.length})
                            </span>
                          </div>
    
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                            {filteredReferrers.length === 0 ? (
                              <div className="bg-slate-50 p-6 text-center text-slate-455 text-xs italic">
                                Tidak ditemukan data alumni pengundang.
                              </div>
                            ) : (
                              <div className="overflow-x-auto max-h-[420px] overflow-y-auto font-sans">
                                <table className="w-full min-w-[300px] text-left border-collapse">
                                  <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 text-[9px] uppercase tracking-wider text-slate-450 font-black border-b border-slate-150">
                                      <th className="px-3 py-2.5">Alumni</th>
                                      <th className="px-3 py-2.5 text-center">Total</th>
                                      <th className="px-3 py-2.5">Rincian</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {filteredReferrers.map((alumnus) => {
                                      const isCurrentSelected = selectedReferrer === alumnus.username;
                                      return (
                                        <tr
                                          key={alumnus.username}
                                          onClick={() => setSelectedReferrer(isCurrentSelected ? "all" : alumnus.username)}
                                          className={`cursor-pointer transition duration-150 ${
                                            isCurrentSelected
                                              ? "bg-rose-50/75"
                                              : "hover:bg-slate-50/50"
                                          }`}
                                        >
                                          <td className="px-3 py-2.5 align-top">
                                            <p className="font-sans font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                              <span>🎓</span> {alumnus.realName}
                                            </p>
                                            <p className="font-mono text-[8.5px] text-slate-400 font-medium block bg-slate-100 border border-slate-150 px-1.5 py-0.5 rounded max-w-fit leading-none mt-1">
                                              ID: {alumnus.username}
                                            </p>
                                          </td>
                                          <td className="px-3 py-2.5 text-center align-top">
                                            <span className="text-xs font-black font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 whitespace-nowrap">
                                              {alumnus.total}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 align-top min-w-[110px]">
                                            <div className="flex justify-between text-[8px] text-slate-400 font-bold whitespace-nowrap gap-1.5">
                                              <span>Aktif {alumnus.activeCount}</span>
                                              <span>Daftar {alumnus.registeredCount}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex mt-1">
                                              <div
                                                className="bg-teal-500 h-full transition-all duration-300"
                                                style={{ width: `${(alumnus.activeCount / alumnus.total) * 100}%` }}
                                              />
                                              <div
                                                className="bg-amber-400 h-full transition-all duration-300"
                                                style={{ width: `${(alumnus.registeredCount / alumnus.total) * 100}%` }}
                                              />
                                            </div>
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
    
                        {/* RIGHT COLUMN: Referred Students detail list */}
                        <div className="lg:col-span-7 space-y-2.5 text-left">
                          <div className="px-1 flex items-center justify-between">
                            <span className="text-[10px] font-extrabold text-slate-455 uppercase tracking-widest font-mono">
                              {selectedReferrer === "all" 
                                ? `Seluruh Siswa Hasil Rujukan (${displayedStudents.length})` 
                                : `Siswa Dirujuk oleh ${referrerMap[selectedReferrer]?.realName} (${displayedStudents.length})`}
                            </span>
                          </div>
    
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs font-sans">
                            {isMobile ? (
                              <div className="divide-y divide-slate-100 p-2 space-y-2">
                                {displayedStudents.length === 0 ? (
                                  <div className="py-8 text-center text-slate-400 italic font-sans text-xs">
                                    Belum ada data pendaftar rujukan.
                                  </div>
                                ) : (
                                  displayedStudents.map((student, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2 text-left">
                                      <div className="flex justify-between items-start gap-2">
                                        <div>
                                          <p className="font-extrabold text-slate-800 text-xs font-sans leading-tight">{student.name}</p>
                                          <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                                        </div>
                                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase inline-block shrink-0 ${
                                          student.type === 'active' 
                                            ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                          {student.type === 'active' ? 'Aktif' : 'Daftar'}
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100/50">
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-slate-400 font-bold">Oleh Alumni:</span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedReferrer(student.referrer)}
                                            className="text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100/50 transition text-[9px] font-mono inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <span>👤 {referrerMap[student.referrer]?.realName || student.referrer}</span>
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-slate-400 font-bold">Kondisi LPK:</span>
                                          <div className="text-right">
                                            <span className="font-bold text-slate-750 block">{student.status}</span>
                                            {student.date !== "-" && (
                                              <span className="text-[8px] text-slate-400 font-mono block">Tgl: {student.date}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-150 uppercase font-black tracking-wider text-[9px]">
                                    <tr>
                                      <th className="px-3.5 py-2.5 font-sans">Siswa</th>
                                      <th className="px-3.5 py-2.5 font-sans">Oleh Alumni</th>
                                      <th className="px-3.5 py-2.5 font-sans">Status</th>
                                      <th className="px-3.5 py-2.5 font-sans">Kondisi LPK</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {displayedStudents.length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className="px-4 py-10 text-center text-slate-400 italic font-sans">
                                          Belum ada data pendaftar rujukan.
                                        </td>
                                      </tr>
                                    ) : (
                                      displayedStudents.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                                          <td className="px-3.5 py-3">
                                            <p className="font-extrabold text-slate-800 text-[11px] font-sans leading-tight">{student.name}</p>
                                            <p className="text-[8.5px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                                          </td>
                                          
                                          <td className="px-3.5 py-3">
                                            <button
                                              type="button"
                                              onClick={() => setSelectedReferrer(student.referrer)}
                                              className="text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-0.5 rounded-lg border border-rose-100/50 transition text-[9px] font-mono inline-flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>👤 {referrerMap[student.referrer]?.realName || student.referrer}</span>
                                            </button>
                                          </td>
    
                                          <td className="px-3.5 py-3">
                                            <span className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-black uppercase inline-block ${
                                              student.type === 'active' 
                                                ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                              {student.type === 'active' ? 'Aktif' : 'Daftar'}
                                            </span>
                                          </td>
    
                                          <td className="px-3.5 py-3">
                                            <span className="font-bold text-slate-750 block text-[10px]">
                                              {student.status}
                                            </span>
                                            {student.date !== "-" && (
                                              <span className="text-[8px] text-slate-400 block font-mono">
                                                Tgl: {student.date}
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
  );
}
