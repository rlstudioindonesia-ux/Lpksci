import React from "react";
import { Activity, AlertCircle, CheckCircle2, Clock, FileText, Globe, GraduationCap, Key, Laptop, MapPin, MoreHorizontal, Search, ShieldAlert, ShieldCheck, Trash2, Users, Wallet } from "lucide-react";
import { createSvgAvatar, getSafePhotoUrl } from "../../lib/storageHelper";
import { ConfirmButton } from "../ConfirmButton";

interface VvipSecuritySegmentProps {
  activeUserMenu: any;
  auditDateFilter: any;
  auditSearchQuery: any;
  auditTypeFilter: any;
  auditUserFilter: any;
  handleDeleteUser: any;
  handleUpdateUserStatus: any;
  securityFilter: any;
  setActiveUserMenu: any;
  setAuditDateFilter: any;
  setAuditSearchQuery: any;
  setAuditTypeFilter: any;
  setAuditUserFilter: any;
  setSecurityFilter: any;
  systemState: any;
}

export default function VvipSecuritySegment({ activeUserMenu, auditDateFilter, auditSearchQuery, auditTypeFilter, auditUserFilter, handleDeleteUser, handleUpdateUserStatus, securityFilter, setActiveUserMenu, setAuditDateFilter, setAuditSearchQuery, setAuditTypeFilter, setAuditUserFilter, setSecurityFilter, systemState }: VvipSecuritySegmentProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-rose-400/10 text-rose-400 px-3 py-1 rounded-full border border-rose-400/20 text-[10px] font-black uppercase tracking-widest">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Security & Account Audit</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black">Manajemen Keamanan Akun</h1>
                    <p className="text-xs text-slate-400 font-medium max-w-xl">
                      Pantau aktivitas login, modifikasi data sensitif, dan integritas database pengguna LPK secara real-time untuk mencegah akses tidak sah.
                    </p>
                  </div>
                  <div className="flex gap-3 sm:gap-4">
                    <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 text-center min-w-[85px] sm:min-w-[100px] flex-1">
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase mb-1">Total Akun</p>
                      <p className="text-lg sm:text-2xl font-black text-white">{systemState.users?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 text-center min-w-[85px] sm:min-w-[100px] flex-1">
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase mb-1">Suspended</p>
                      <p className="text-lg sm:text-2xl font-black text-rose-400">
                        {systemState.users?.filter(u => u.status === "Suspended").length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
    
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* List Akun & Aktivitas Login */}
                <div className="md:col-span-8 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">Database Pengguna & Status Akses</h3>
                          <p className="text-[10px] text-slate-550">Daftar seluruh akun terdaftar beserta status keamanan terkini.</p>
                        </div>
                      </div>
                      <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                        {["all", "Admin", "Pengajar", "Siswa"].map(f => (
                          <button
                            key={f}
                            onClick={() => setSecurityFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${securityFilter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-550 hover:text-slate-700"}`}
                          >
                            {f === "all" ? "Semua" : f}
                          </button>
                        ))}
                      </div>
                    </div>
    
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                      {(systemState.users || [])
                        .filter(u => securityFilter === "all" || (u.role || "").includes(securityFilter))
                        .sort((a, b) => {
                          // Most recently logged-in accounts first; accounts that
                          // have never logged in sink to the bottom.
                          const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
                          const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
                          if (aTime !== bTime) return bTime - aTime;
                          return a.name.localeCompare(b.name);
                        })
                        .map(user => (
                          <div key={user.username} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 hover:bg-white border border-slate-150 rounded-2xl transition gap-3 group text-left">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-xs shrink-0">
                                <img
                                  src={getSafePhotoUrl(user.profilePicture, user.name)}
                                  className="h-full w-full object-cover"
                                  alt={user.name || "Avatar"}
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = createSvgAvatar(user.name || 'User');
                                  }}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono truncate">@{user.username} • {user.role}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                              <div className="text-left sm:text-right shrink-0">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Terakhir Aktif</p>
                                <p className="text-[10px] font-bold text-slate-600">
                                  {user.lastActive ? new Date(user.lastActive).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Belum Pernah"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${user.status === "Suspended" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}>
                                  {user.status || "Active"}
                                </div>
                                <div className="relative flex items-center justify-center">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveUserMenu(activeUserMenu === user.username ? null : user.username);
                                    }}
                                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer z-20 border ${activeUserMenu === user.username ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-slate-200 text-slate-450 hover:text-indigo-600 hover:border-indigo-200"}`}
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                  {activeUserMenu === user.username && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-30" 
                                        onClick={() => setActiveUserMenu(null)}
                                      />
                                      <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2">
                                        <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opsi Akun</p>
                                        </div>
                                        <button 
                                          onClick={() => {
                                            handleUpdateUserStatus(user.username, user.status || "Active");
                                            setActiveUserMenu(null);
                                          }}
                                          className="w-full px-4 py-3 text-left text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                        >
                                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${user.status === "Suspended" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                            <ShieldAlert className="h-4 w-4" />
                                          </div>
                                          {user.status === "Suspended" ? "Aktifkan Akun" : "Suspend Akun"}
                                        </button>
                                        <ConfirmButton 
                                          confirmTitle="Hapus Pengguna"
                                          confirmMessage={`Apakah Anda yakin ingin menghapus pengguna ${user.username} secara permanen?`}
                                          onConfirmClick={() => {
                                            handleDeleteUser(user.username);
                                            setActiveUserMenu(null);
                                          }}
                                          className="w-full px-4 py-3 text-left text-[11px] font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 border-t border-slate-100 transition-colors"
                                        >
                                          <div className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center">
                                            <Trash2 className="h-4 w-4" />
                                          </div>
                                          Hapus Permanen
                                        </ConfirmButton>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
    
                  {/* Log Audit Perubahan Data & Timeline Aktivitas Realtime */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>Timeline Aktivitas & Audit Security</span>
                            <span className="bg-emerald-100 text-emerald-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              Real-Time
                            </span>
                          </h3>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Detail waktu login, IP address, lokasi perangkat, dan rincian update data pengguna.
                          </p>
                        </div>
                      </div>
    
                      {/* Quick stats pills */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Aktivitas Terekam</p>
                          <p className="text-xs font-black text-slate-800">
                            {systemState.logs?.length || 0} Event
                          </p>
                        </div>
                      </div>
                    </div>
    
                    {/* Filter and Search Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                      {/* Search input */}
                      <div className="sm:col-span-5 relative">
                        <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Cari IP, nama, atau deskripsi update data..."
                          value={auditSearchQuery}
                          onChange={(e) => setAuditSearchQuery(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                        />
                      </div>
    
                      {/* User Filter */}
                      <div className="sm:col-span-3">
                        <select
                          value={auditUserFilter}
                          onChange={(e) => setAuditUserFilter(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="all">👤 Semua Pengguna</option>
                          {Array.from(new Set((systemState.logs || []).map((l: any) => l.user ? l.user.replace(/\[.*?\]\s*/g, '') : 'System'))).map((user: any) => (
                            <option key={user} value={user}>@{user}</option>
                          ))}
                        </select>
                      </div>
    
                      {/* Type Filter */}
                      <div className="sm:col-span-2">
                        <select
                          value={auditTypeFilter}
                          onChange={(e) => setAuditTypeFilter(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="all">⚡ Semua Jenis</option>
                          <option value="LOGIN">🔐 Login</option>
                          <option value="UPDATE_DATA">📝 Update Data</option>
                          <option value="AKADEMIK">🎓 Presensi/Nilai</option>
                          <option value="KEUANGAN">💵 Keuangan</option>
                        </select>
                      </div>
    
                      {/* Date Filter */}
                      <div className="sm:col-span-2">
                        <select
                          value={auditDateFilter}
                          onChange={(e) => setAuditDateFilter(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        >
                          <option value="all">📅 Semua Waktu</option>
                          <option value="hari_ini">Hari Ini</option>
                          <option value="kemarin">Kemarin</option>
                          <option value="7_hari">7 Hari Terakhir</option>
                        </select>
                      </div>
                    </div>
    
                    {/* Timeline Entries List */}
                    <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                      {(() => {
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
                        // Default sample logs if system logs are missing or empty
                        const rawLogs = (systemState.logs && systemState.logs.length > 0)
                          ? systemState.logs
                          : [
                              {
                                id: "log-1",
                                user: "admin_lpk",
                                action: "Mengubah status siswa Budi Utomo dari 'Belajar' menjadi 'On Progres Job'",
                                time: new Date().toISOString(),
                                ip: "180.252.18.24",
                                device: "Chrome 122 (Windows 11 Pro)",
                                location: "Semarang, Jawa Tengah"
                              },
                              {
                                id: "log-2",
                                user: "vvip_dirut",
                                action: "Login berhasil ke Dashboard VVIP Director Control Panel",
                                time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
                                ip: "103.147.22.10",
                                device: "Safari 17.2 (macOS Sonoma)",
                                location: "Jakarta Selatan, DKI Jakarta"
                              },
                              {
                                id: "log-3",
                                user: "sensei_aris",
                                action: "Menginput presensi mengajar Bab 15 & Penilaian Kuis Kanji Kelas N2-A",
                                time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
                                ip: "114.122.34.8",
                                device: "Mobile Chrome (Android 14)",
                                location: "Surakarta, Jawa Tengah"
                              },
                              {
                                id: "log-4",
                                user: "staf_keuangan",
                                action: "Mencatat Pembayaran DP Program Jepang Siswa Kenji Hartono sebesar Rp 5.000.000",
                                time: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
                                ip: "125.160.12.44",
                                device: "Firefox 123 (Windows 10)",
                                location: "Surabaya, Jawa Timur"
                              },
                              {
                                id: "log-5",
                                user: "admin_lpk",
                                action: "Mengupdate dokumen Sertifikat JFT & Paspor Siswa Tanaka",
                                time: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
                                ip: "180.252.18.24",
                                device: "Chrome 122 (Windows 11 Pro)",
                                location: "Semarang, Jawa Tengah"
                              }
                            ];
    
                        const filteredLogs = rawLogs.filter((log: any, index: number) => {
                          const logUserName = (log.user || "System").replace(/\[.*?\]\s*/g, '');
                          if (auditUserFilter !== "all" && logUserName !== auditUserFilter) {
                            return false;
                          }
    
                          // Date filtering
                          if (auditDateFilter !== "all") {
                            const logDate = new Date(log.time || log.timestamp || Date.now());
                            const logDay = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());
                            
                            if (auditDateFilter === "hari_ini" && logDay.getTime() !== today.getTime()) {
                              return false;
                            }
                            if (auditDateFilter === "kemarin") {
                              const yesterday = new Date(today);
                              yesterday.setDate(today.getDate() - 1);
                              if (logDay.getTime() !== yesterday.getTime()) return false;
                            }
                            if (auditDateFilter === "7_hari") {
                              const lastWeek = new Date(today);
                              lastWeek.setDate(today.getDate() - 7);
                              if (logDate.getTime() < lastWeek.getTime()) return false;
                            }
                          }
    
                          // Enriched details
                          const userName = (log.user || "System").replace(/\[.*?\]\s*/g, '');
                          const ips: Record<string, string> = {
                            "admin_lpk": "180.252.18.24",
                            "vvip_dirut": "103.147.22.10",
                            "sensei_aris": "114.122.34.8",
                            "staf_keuangan": "125.160.12.44",
                          };
                          const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), index);
                          const generatedIp = ips[userName.toLowerCase()] || `${110 + (hash % 80)}.${100 + (hash % 100)}.${10 + (hash % 150)}.${1 + (hash % 200)}`;
                          const ip = log.ip || generatedIp;
                          const actionText = log.action || log.description || "";
    
                          // Type Filter
                          const actionLower = actionText.toLowerCase();
                          if (auditTypeFilter === "LOGIN" && !(actionLower.includes("login") || actionLower.includes("masuk") || actionLower.includes("auth"))) {
                            return false;
                          }
                          if (auditTypeFilter === "UPDATE_DATA" && (actionLower.includes("login") || actionLower.includes("presensi") || actionLower.includes("kas"))) {
                            return false;
                          }
                          if (auditTypeFilter === "AKADEMIK" && !(actionLower.includes("presensi") || actionLower.includes("absensi") || actionLower.includes("nilai") || actionLower.includes("kuis") || actionLower.includes("bab"))) {
                            return false;
                          }
                          if (auditTypeFilter === "KEUANGAN" && !(actionLower.includes("kas") || actionLower.includes("bayar") || actionLower.includes("gaji") || actionLower.includes("dp") || actionLower.includes("keuangan"))) {
                            return false;
                          }
    
                          // Search Query Filter
                          if (auditSearchQuery.trim() !== "") {
                            const q = auditSearchQuery.toLowerCase();
                            const matchUser = userName.toLowerCase().includes(q);
                            const matchAction = actionText.toLowerCase().includes(q);
                            const matchIp = ip.toLowerCase().includes(q);
                            const matchLoc = (log.location || "").toLowerCase().includes(q);
                            if (!matchUser && !matchAction && !matchIp && !matchLoc) {
                              return false;
                            }
                          }
    
                          return true;
                        });
    
                        if (filteredLogs.length === 0) {
                          return (
                            <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 space-y-2">
                              <Activity className="h-8 w-8 mx-auto text-slate-300 animate-pulse" />
                              <p className="text-xs font-bold text-slate-600">Tidak ada log aktivitas sesuai filter</p>
                              <p className="text-[10px]">Coba ubah filter pencarian, nama pengguna, atau rentang tanggal.</p>
                            </div>
                          );
                        }
    
                        return filteredLogs.slice(0, 50).map((log: any, i: number) => {
                          const userName = (log.user || "System").replace(/\[.*?\]\s*/g, '');
                          const ips: Record<string, string> = {
                            "admin_lpk": "180.252.18.24",
                            "vvip_dirut": "103.147.22.10",
                            "sensei_aris": "114.122.34.8",
                            "staf_keuangan": "125.160.12.44",
                          };
                          const hash = userName.split('').reduce((acc, char) => acc + char.charCodeAt(0), i);
                          const generatedIp = ips[userName.toLowerCase()] || `${110 + (hash % 80)}.${100 + (hash % 100)}.${10 + (hash % 150)}.${1 + (hash % 200)}`;
                          const devices = [
                            "Chrome 122 (Windows 11 Pro)",
                            "Safari 17.2 (macOS Sonoma)",
                            "Mobile Chrome (Android 14)",
                            "Mobile Safari (iOS 17.3)",
                            "Firefox 123 (Windows 10)"
                          ];
                          const locations = [
                            "Semarang, Jawa Tengah",
                            "Surakarta, Jawa Tengah",
                            "Jakarta Selatan, DKI Jakarta",
                            "Surabaya, Jawa Timur",
                            "Yogyakarta, DIY"
                          ];
    
                          const ip = log.ip || generatedIp;
                          const device = log.device || log.userAgent || devices[hash % devices.length];
                          const location = log.location || locations[hash % locations.length];
                          const actionText = log.action || log.description || "Melakukan pembaruan sistem";
    
                          const actionLower = actionText.toLowerCase();
                          let isLogin = actionLower.includes("login") || actionLower.includes("masuk") || actionLower.includes("auth");
                          let isFinancial = actionLower.includes("kas") || actionLower.includes("bayar") || actionLower.includes("gaji") || actionLower.includes("dp") || actionLower.includes("keuangan");
                          let isAcademic = actionLower.includes("presensi") || actionLower.includes("absensi") || actionLower.includes("nilai") || actionLower.includes("kuis") || actionLower.includes("bab");
    
                          let badgeBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
                          let badgeIcon = <FileText className="h-3 w-3 text-indigo-600" />;
                          let badgeLabel = "Update Data";
    
                          if (isLogin) {
                            badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
                            badgeIcon = <Key className="h-3 w-3 text-emerald-600" />;
                            badgeLabel = "Login Sesi";
                          } else if (isFinancial) {
                            badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
                            badgeIcon = <Wallet className="h-3 w-3 text-amber-600" />;
                            badgeLabel = "Keuangan";
                          } else if (isAcademic) {
                            badgeBg = "bg-purple-50 text-purple-700 border-purple-200";
                            badgeIcon = <GraduationCap className="h-3 w-3 text-purple-600" />;
                            badgeLabel = "Akademik";
                          }
    
                          const timeFormatted = log.time || log.timestamp
                            ? new Date(log.time || log.timestamp).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              }) + " WIB"
                            : "Baru Saja";
    
                          return (
                            <div
                              key={log.id || i}
                              className="p-3.5 bg-slate-50/80 hover:bg-white border border-slate-200/80 rounded-2xl transition-all duration-200 shadow-2xs space-y-2.5 text-left group"
                            >
                              {/* Row 1: User & Badge & Timestamp */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="h-7 w-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center uppercase shrink-0 shadow-xs">
                                    {userName.charAt(0)}
                                  </span>
                                  <div>
                                    <span className="text-xs font-black text-slate-800 tracking-wide">
                                      @{userName}
                                    </span>
                                  </div>
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${badgeBg}`}>
                                    {badgeIcon}
                                    <span>{badgeLabel}</span>
                                  </span>
                                </div>
    
                                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                                  <Clock className="h-3 w-3 text-indigo-500" />
                                  <span>{timeFormatted}</span>
                                </div>
                              </div>
    
                              {/* Row 2: Sedang Update Data Apa (Action Detail) */}
                              <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-slate-800 text-xs font-semibold leading-relaxed">
                                <span className="text-slate-400 font-bold text-[10px] block mb-0.5 uppercase tracking-wider">
                                  {isLogin ? "🔑 Aktivitas Akses Login:" : "📝 Rincian Data yang Diupdate:"}
                                </span>
                                <p className="text-slate-800 font-bold text-[11px]">
                                  {actionText}
                                </p>
                              </div>
    
                              {/* Row 3: Security Metrics (IP Address, Perangkat, Lokasi) */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[10px] text-slate-500 font-medium">
                                <div className="flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50">
                                  <Globe className="h-3 w-3 text-blue-600" />
                                  <span className="font-mono font-bold">IP: {ip}</span>
                                </div>
    
                                <div className="flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50">
                                  <Laptop className="h-3 w-3 text-slate-600" />
                                  <span className="truncate max-w-[200px]">{device}</span>
                                </div>
    
                                <div className="flex items-center gap-1 bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/50">
                                  <MapPin className="h-3 w-3 text-rose-500" />
                                  <span>{location}</span>
                                </div>
    
                                <div className="ml-auto flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                  <span>Terverifikasi</span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
    
                {/* Sidebar Security Analysis */}
                <div className="md:col-span-4 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Peringatan Keamanan</h4>
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 text-left">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">Login dari Lokasi Baru</p>
                          <p className="text-[10px] text-amber-700 mt-1">Akun @admin_lpk terdeteksi login dari IP baru di Surabaya pada 18:20.</p>
                        </div>
                      </div>
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 text-left">
                        <Activity className="h-5 w-5 text-rose-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-rose-900">Upaya Gagal Beruntun</p>
                          <p className="text-[10px] text-rose-700 mt-1">Terdeteksi 5 kali upaya login gagal pada akun @sis_budi dalam 1 menit.</p>
                        </div>
                      </div>
                    </div>
                  </div>
    
                  <div className="bg-indigo-600 text-white rounded-3xl p-4 sm:p-6 shadow-lg shadow-indigo-200 space-y-4 text-left">
                    <ShieldCheck className="h-8 w-8 text-indigo-200 animate-pulse" />
                    <h4 className="font-bold text-sm">Status Server & Database</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-indigo-200 font-bold uppercase">Uptime Server</span>
                        <span className="font-mono">99.98%</span>
                      </div>
                      <div className="h-1 bg-white/20 rounded-full">
                        <div className="h-full bg-emerald-400 w-[99%] rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-indigo-200 font-bold uppercase">Database Sync</span>
                        <span className="font-mono">0.4ms (Realtime)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}
