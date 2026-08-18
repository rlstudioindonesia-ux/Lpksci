import React from "react";
import { Activity, Award, Calendar, DollarSign, Key, Share2, ShieldCheck, Users } from "lucide-react";

interface VvipExecSegmentProps {
  currentViewMode: any;
  inJapanCount: any;
  setCurrentViewMode: any;
  setMonitorTab: any;
  setSelectedClassTab: any;
  setShowLoginAsModal: any;
  studyingCount: any;
  systemState: any;
  totalLunasRevenue: any;
}

export default function VvipExecSegment({ currentViewMode, inJapanCount, setCurrentViewMode, setMonitorTab, setSelectedClassTab, setShowLoginAsModal, studyingCount, systemState, totalLunasRevenue }: VvipExecSegmentProps) {
  return (
    <>
              <section className="bg-gradient-to-br from-[#001d3d] via-indigo-900 to-slate-950 text-white rounded-[2.5rem] p-6 sm:p-8 md:p-12 relative overflow-hidden shadow-2xl border border-white/10">
                {/* Abstract background decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 px-4 py-1.5 rounded-full border border-yellow-400/20 text-[10px] font-black uppercase tracking-[0.2em]">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Executive Access Granted</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black leading-tight tracking-tight">
                      Laporan Strategis <br />
                      <span className="text-blue-400">Direksi LPK SCI</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
                      Selamat datang, Direktur. Pantau pertumbuhan ekosistem LPK Source Course Indonesia, efisiensi operasional, dan proyeksi finansial secara real-time.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <div 
                      onClick={() => {
                        setMonitorTab("siswa");
                        setSelectedClassTab("Di Jepang");
                        setTimeout(() => {
                          document.getElementById('vvip-monitoring-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl min-w-[140px] shadow-lg cursor-pointer hover:bg-white/10 transition-all active:scale-95"
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alumni (Di Jepang)</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{inJapanCount}</span>
                        <span className="text-[10px] font-bold text-emerald-400">Sis</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-emerald-400 w-3/4 rounded-full" />
                      </div>
                    </div>
                    <div 
                      onClick={() => {
                        setMonitorTab("siswa");
                        setSelectedClassTab("Belajar");
                        setTimeout(() => {
                          document.getElementById('vvip-monitoring-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-3xl min-w-[140px] shadow-lg cursor-pointer hover:bg-white/10 transition-all active:scale-95"
                    >
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Siswa Aktif</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{studyingCount}</span>
                        <span className="text-[10px] font-bold text-sky-400">Sis</span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-sky-400 w-2/3 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
    
              {/* QUICK KPI TILES: Bento grid style */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-6">
                <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Rp {totalLunasRevenue.toLocaleString("id-ID")}</p>
                </div>
                
                <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth Rate</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">+12.5%</p>
                </div>
    
                <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Award className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Success Rate</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">94%</p>
                </div>
    
                <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Jobs</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{systemState.jobOrders?.length || 0}</p>
                </div>
              </div>
    
              {/* VVIP QUICK NAVIGATION MENU */}
              {currentViewMode !== "exec" && (
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (currentViewMode !== "full") {
                        setCurrentViewMode("full");
                        setTimeout(() => {
                          const el = document.getElementById('vvip-monitoring-section');
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } else {
                        const el = document.getElementById('vvip-monitoring-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${currentViewMode === "full" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
                  >
                    <Activity className="h-4 w-4 text-rose-500" />
                    Monitoring Utama
                  </button>
                  <button
                    onClick={() => {
                      setCurrentViewMode("kalender");
                    }}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${(currentViewMode as string) === "kalender" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
                  >
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    Jadwal LPK
                  </button>
                  <button
                    onClick={() => {
                      setCurrentViewMode("afiliasi");
                    }}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${(currentViewMode as string) === "afiliasi" ? "bg-rose-600 text-white border-rose-600 shadow-rose-500/10" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
                  >
                    <Share2 className="h-4 w-4 text-rose-500" />
                    Monitoring Afiliasi
                  </button>
                  <button
                    onClick={() => {
                      setCurrentViewMode("security");
                    }}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer ${(currentViewMode as string) === "security" ? "bg-slate-900 text-white border-slate-900" : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200"}`}
                  >
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    Keamanan Akun
                  </button>
                  <button
                    onClick={() => setShowLoginAsModal(true)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-2xl border shadow-xs transition-all active:scale-95 cursor-pointer bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200"
                  >
                    <Key className="h-4 w-4 text-indigo-500" />
                    Login Sebagai...
                  </button>
                </div>
              )}
            </>
  );
}
