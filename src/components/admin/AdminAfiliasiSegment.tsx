import React from "react";
import { Award, CheckCircle2, Filter, Plus, Search, Share2, Users } from "lucide-react";

interface AdminAfiliasiSegmentProps {
  affiliateSearch: any;
  selectedReferrer: any;
  setAffiliateSearch: any;
  setSelectedReferrer: any;
  systemState: any;
}

export default function AdminAfiliasiSegment({ affiliateSearch, selectedReferrer, setAffiliateSearch, setSelectedReferrer, systemState }: AdminAfiliasiSegmentProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 animate-fade-in text-slate-800 shadow-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                    <Share2 className="h-6 w-6 text-rose-500" />
                    Data Afiliasi & Rekomendasi Alumni
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Sistem monitoring rujukan pendaftaran. Pantau kontribusi alumni dalam mendatangkan siswa baru secara real-time.
                  </p>
                </div>
    
                {(() => {
                  // The "Kode Referral" field on the registration form is free text
                  // and optional - some applicants fill it with their own email or
                  // name instead of leaving it blank, and since a student's login
                  // username is set to their own email at approval, that later
                  // resolves to a "referral" that is really just themselves. Filter
                  // those out everywhere so they never inflate an alumni's referral
                  // count or reward stats.
                  const isSelfReferral = (s: { id: string; name: string; email?: string }, ref: string) => {
                    const r = (ref || "").trim().toLowerCase();
                    if (!r) return false;
                    if (s.name && s.name.trim().toLowerCase() === r) return true;
                    if (s.email && s.email.trim().toLowerCase() === r) return true;
                    const ownUser = (systemState.users || []).find(u => u.studentId === s.id || u.name === s.name);
                    return !!ownUser && ownUser.username.trim().toLowerCase() === r;
                  };
    
                  // Get all referred students
                  const allReferred = [
                    ...(systemState.registeredStudents || []).filter(s => s.referrer && !isSelfReferral(s, s.referrer)).map(s => ({
                      id: s.id,
                      name: s.name,
                      status: s.status,
                      referrer: s.referrer || "unknown",
                      date: s.date || "-",
                      type: 'registered' as const
                    })),
                    ...(systemState.activeStudents || []).filter(s => s.referrer && !isSelfReferral(s, s.referrer)).map(s => ({
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
                    r.username.toLowerCase().includes(affiliateSearch.toLowerCase()) ||
                    r.realName.toLowerCase().includes(affiliateSearch.toLowerCase())
                  );
    
                  // Filter students to show
                  let displayedStudents = allReferred;
                  if (selectedReferrer !== "all") {
                    displayedStudents = displayedStudents.filter(s => s.referrer === selectedReferrer);
                  }
                  if (affiliateSearch) {
                    displayedStudents = displayedStudents.filter(s => 
                      s.name.toLowerCase().includes(affiliateSearch.toLowerCase()) || 
                      s.referrer.toLowerCase().includes(affiliateSearch.toLowerCase())
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
                        <div className="bg-rose-50 border border-rose-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-rose-600 border border-rose-100">
                            <Users className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] text-rose-700 font-extrabold uppercase tracking-wider">Total Referral</p>
                            <p className="text-xl font-black text-slate-800 leading-tight">{totalReferrals} Siswa</p>
                          </div>
                        </div>
    
                        <div className="bg-teal-50 border border-teal-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-teal-600 border border-teal-100">
                            <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] text-teal-700 font-extrabold uppercase tracking-wider">Siswa Dilatih</p>
                            <p className="text-xl font-black text-slate-800 leading-tight">{activeReferrals} Siswa</p>
                          </div>
                        </div>
    
                        <div className="bg-amber-50 border border-amber-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-amber-600 border border-amber-100">
                            <Plus className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider">Pendaftar Baru</p>
                            <p className="text-xl font-black text-slate-800 leading-tight">{registeredReferrals} Calon</p>
                          </div>
                        </div>
    
                        <div className="bg-purple-50 border border-purple-150/60 p-4 rounded-2xl flex items-center gap-4 shadow-3xs">
                          <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-xs text-purple-600 border border-purple-100">
                            <Award className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[10px] text-purple-700 font-extrabold uppercase tracking-wider">Alumni Mereferensi</p>
                            <p className="text-xl font-black text-slate-800 leading-tight">{totalAlumniCount} Alumni</p>
                          </div>
                        </div>
                      </div>
    
                      {/* Filter and search controls */}
                      <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        <div className="relative flex-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                            <Search className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            placeholder="Cari nama siswa atau username alumni..."
                            value={affiliateSearch}
                            onChange={(e) => setAffiliateSearch(e.target.value)}
                            className="w-full bg-white border border-slate-250 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all font-sans"
                          />
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          {selectedReferrer !== "all" && (
                            <button
                              type="button"
                              onClick={() => setSelectedReferrer("all")}
                              className="bg-rose-100 hover:bg-rose-200/80 text-rose-700 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 animate-fade-in"
                            >
                              <Filter className="h-3.5 w-3.5" />
                              <span>Filter: {referrerMap[selectedReferrer]?.realName} (X)</span>
                            </button>
                          )}
                          
                          {(affiliateSearch || selectedReferrer !== "all") && (
                            <button
                              type="button"
                              onClick={() => {
                                setAffiliateSearch("");
                                setSelectedReferrer("all");
                              }}
                              className="bg-slate-200 hover:bg-slate-300/80 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                            >
                              Reset Filter
                            </button>
                          )}
                        </div>
                      </div>
    
                      {/* Split Dashboard Sections */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN: Alumni Leaderboard & Selection */}
                        <div className="lg:col-span-5 space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10.5px] font-black text-slate-450 uppercase tracking-widest font-mono">
                              Daftar Alumni Mereferensikan ({filteredReferrers.length})
                            </span>
                          </div>
    
                          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {filteredReferrers.length === 0 ? (
                              <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl text-center text-slate-400 text-xs italic">
                                Tidak ada alumni yang sesuai kata kunci pencarian.
                              </div>
                            ) : (
                              filteredReferrers.map((alumnus) => {
                                const isCurrentSelected = selectedReferrer === alumnus.username;
                                return (
                                  <div
                                    key={alumnus.username}
                                    onClick={() => setSelectedReferrer(isCurrentSelected ? "all" : alumnus.username)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                      isCurrentSelected
                                        ? "bg-rose-50/70 border-rose-350 shadow-xs ring-2 ring-rose-100"
                                        : "bg-white hover:bg-slate-50/70 border-slate-200 hover:border-slate-300"
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1">
                                        <p className="font-sans font-extrabold text-slate-855 text-xs flex items-center gap-1.5">
                                          <span>👩‍🎓</span> {alumnus.realName}
                                        </p>
                                        <p className="font-mono text-[9.5px] text-slate-400 font-bold block bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded max-w-fit leading-none">
                                          Ref Code: {alumnus.username}
                                        </p>
                                      </div>
                                      
                                      <div className="text-right">
                                        <span className="text-xs font-black font-mono text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                          {alumnus.total} Siswa
                                        </span>
                                      </div>
                                    </div>
    
                                    {/* Custom mini progress bar of active/registered */}
                                    <div className="mt-3.5 space-y-1">
                                      <div className="flex justify-between text-[8.5px] text-slate-400 font-bold">
                                        <span>Aktif: {alumnus.activeCount}</span>
                                        <span>Pendaftar: {alumnus.registeredCount}</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                        <div 
                                          className="bg-teal-500 h-full transition-all duration-350" 
                                          style={{ width: `${(alumnus.activeCount / alumnus.total) * 100}%` }}
                                        />
                                        <div 
                                          className="bg-amber-400 h-full transition-all duration-350" 
                                          style={{ width: `${(alumnus.registeredCount / alumnus.total) * 100}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
    
                        {/* RIGHT COLUMN: Referred Students Detail list */}
                        <div className="lg:col-span-7 space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10.5px] font-black text-slate-450 uppercase tracking-widest font-mono">
                              {selectedReferrer === "all" 
                                ? `Seluruh Siswa Hasil Rujukan (${displayedStudents.length})` 
                                : `Siswa Dirujuk oleh ${referrerMap[selectedReferrer]?.realName} (${displayedStudents.length})`}
                            </span>
                          </div>
    
                          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-3xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-black tracking-wider text-[9.5px]">
                                  <tr>
                                    <th className="px-4 py-3">Nama Siswa</th>
                                    <th className="px-4 py-3">Referral Dari</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Rincian</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {displayedStudents.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="px-4 py-12 text-center text-slate-400 italic">
                                        Belum ada data pendaftar untuk kriteria ini.
                                      </td>
                                    </tr>
                                  ) : (
                                    displayedStudents.map((student, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                                        <td className="px-4 py-3.5">
                                          <p className="font-extrabold text-slate-800 text-[11px] font-sans">{student.name}</p>
                                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{student.id}</p>
                                        </td>
                                        
                                        <td className="px-4 py-3.5">
                                          <button
                                            type="button"
                                            onClick={() => setSelectedReferrer(student.referrer)}
                                            className="text-left font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 px-2 py-1 rounded-lg border border-rose-100/50 transition text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                                          >
                                            <span>👤 {referrerMap[student.referrer]?.realName || student.referrer}</span>
                                          </button>
                                        </td>
    
                                        <td className="px-4 py-3.5">
                                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                            student.type === 'active' 
                                              ? 'bg-teal-50 text-teal-700 border border-teal-100' 
                                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                                          }`}>
                                            {student.type === 'active' ? 'Siswa Aktif' : 'Pendaftaran'}
                                          </span>
                                        </td>
    
                                        <td className="px-4 py-3.5">
                                          <span className="font-medium text-slate-600 block text-[10.5px]">
                                            {student.status}
                                          </span>
                                          {student.date !== "-" && (
                                            <span className="text-[9px] text-slate-400 block font-mono">
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
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
  );
}
