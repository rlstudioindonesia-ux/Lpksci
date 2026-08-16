import React from "react";
import { InlineLoginPanel } from "../InlineLoginPanel";
import { Award, Copy, Share2 } from "lucide-react";

interface MobileAfiliasiSubpageProps {
  currentUser: any;
  onLoginSuccess: any;
  systemState: any;
}

export default function MobileAfiliasiSubpage({ currentUser, onLoginSuccess, systemState }: MobileAfiliasiSubpageProps) {
  return (
    !currentUser ? (
                  <InlineLoginPanel
                    title="Program Afiliasi SCI"
                    requiredRole="Siswa"
                    description="Masuk untuk mengakses kode referral Anda dan memonitor pendaftaran siswa yang Anda rekomendasikan."
                    onLoginSuccess={(u, isDefaultPassword) => onLoginSuccess?.(u, isDefaultPassword)}
                    systemState={systemState}
                  />
                ) : (
                <div className="flex-1 p-3 space-y-4 text-left font-sans">
                  <div className="bg-white rounded-3xl border border-rose-100 p-6 text-center space-y-4 max-w-md mx-auto my-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-md">
                      <Share2 className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-slate-800">Program Afiliasi SCI</h3>
                      <p className="text-[10px] text-slate-500 px-4 leading-relaxed">
                        Ajak teman, kerabat, atau rekan kerja Anda untuk belajar dan meraih sukses di Jepang bersama LPK Source Course Indonesia. Dapatkan reward khusus untuk setiap siswa yang berhasil mendaftar melalui referensi Anda!
                      </p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100/80 rounded-[24px] p-4 mt-2 text-left">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Kode Referral Anda:</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={currentUser?.username || "alumni"}
                          className="flex-1 bg-white border border-slate-100/80 rounded-lg p-2 text-xs font-bold text-slate-800 text-center outline-none tracking-wider"
                        />
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(currentUser?.username || "alumni");
                            alert("Kode referral berhasil disalin!");
                          }}
                          className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition cursor-pointer"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-2 leading-relaxed">
                        Bagikan kode referral di atas kepada calon siswa. Minta mereka untuk memasukkan kode ini ke dalam kolom <strong>KODE REFERRAL / ALUMNI REFERRER</strong> saat mengisi formulir pendaftaran LPK SCI.
                      </p>
                    </div>
                  </div>
    
                  {/* Summary of Referrals by Alumni - Admin & VVIP View */}
                  {(currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && (
                    <div className="bg-white rounded-3xl border border-indigo-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-indigo-500" />
                        <h4 className="font-bold text-slate-800 text-sm">Monitoring Afiliasi Alumni (Direksi)</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-4">
                        Rekap total rekomendasi siswa baru dan alumni yang berhasil diajak oleh masing-masing alumni sponsor.
                      </p>
                      {(() => {
                        const allRegs = systemState.registeredStudents || [];
                        const allActives = systemState.activeStudents || [];
    
                        // The "Kode Referral" field on the registration form is free
                        // text and optional - some applicants fill it with their own
                        // email or name instead of leaving it blank, and since a
                        // student's login username is set to their own email at
                        // approval, that later resolves to a "referral" that is
                        // really just themselves. Exclude those so they don't
                        // inflate an alumni's referral count.
                        const isSelfReferral = (s: { id: string; name: string; email?: string }, ref: string) => {
                          const r = (ref || "").trim().toLowerCase();
                          if (!r) return false;
                          if (s.name && s.name.trim().toLowerCase() === r) return true;
                          if (s.email && s.email.trim().toLowerCase() === r) return true;
                          const ownUser = (systemState.users || []).find(u => u.studentId === s.id || u.name === s.name);
                          return !!ownUser && ownUser.username.trim().toLowerCase() === r;
                        };
    
                        // Group referrals by referrer username/email
                        const statsByReferrer: { [key: string]: { name: string, regs: number, actives: number } } = {};
    
                        allRegs.forEach(s => {
                          if (s.referrer && !isSelfReferral(s, s.referrer)) {
                            const refKey = s.referrer.trim().toLowerCase();
                            if (!statsByReferrer[refKey]) {
                              statsByReferrer[refKey] = { name: s.referrer, regs: 0, actives: 0 };
                            }
                            statsByReferrer[refKey].regs += 1;
                          }
                        });
    
                        allActives.forEach(s => {
                          if (s.referrer && !isSelfReferral(s, s.referrer)) {
                            const refKey = s.referrer.trim().toLowerCase();
                            if (!statsByReferrer[refKey]) {
                              statsByReferrer[refKey] = { name: s.referrer, regs: 0, actives: 0 };
                            }
                            statsByReferrer[refKey].actives += 1;
                          }
                        });
    
                        const statsList = Object.values(statsByReferrer);
    
                        if (statsList.length === 0) {
                          return (
                            <div className="text-center py-4 text-slate-500 text-xs italic">
                              Belum ada alumni yang melakukan referral.
                            </div>
                          );
                        }
    
                        return (
                          <div className="space-y-2.5">
                            {statsList.map((stat, i) => (
                              <div key={i} className="flex justify-between items-center bg-indigo-50/40 border border-indigo-50 p-3 rounded-[24px]">
                                <div>
                                  <p className="font-bold text-xs text-indigo-900">{stat.name}</p>
                                  <p className="text-[9px] text-slate-500 mt-0.5">Sponsor Afiliasi Resmi</p>
                                </div>
                                <div className="flex gap-2">
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-1 rounded-lg">
                                    {stat.regs} Pendaftar
                                  </span>
                                  <span className="bg-teal-100 text-teal-800 text-[9px] font-bold px-2 py-1 rounded-lg">
                                    {stat.actives} Siswa Aktif
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
    
                  {/* Data Rekomendasi Siswa */}
                  <div className="bg-white rounded-3xl border border-slate-100/80 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-left">
                    <h4 className="font-bold text-slate-800 text-sm mb-3">Siswa Direkomendasikan</h4>
                    <div className="space-y-3">
                      {(() => {
                        const isAdminOrVip = currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP";
                        const isReferrerMatch = (ref: string) => {
                          if (!ref) return false;
                          const r = ref.toLowerCase().trim();
                          return r === currentUser?.username?.toLowerCase().trim() ||
                                 r === currentUser?.email?.toLowerCase().trim() ||
                                 r === currentUser?.name?.toLowerCase().trim();
                        };
                        // A student cannot refer themselves - some applicants type
                        // their own email/name into the optional "Kode Referral"
                        // field on the registration form, which later resolves back
                        // to their own account. Never show that as a referral.
                        const isSelfReferral = (s: { name: string }, ref: string) => {
                          const r = (ref || "").toLowerCase().trim();
                          return !!r && s.name.toLowerCase().trim() === r;
                        };
    
                        const myReferrals = [
                          ...(systemState.registeredStudents || [])
                            .filter(s => s.referrer && !isSelfReferral(s, s.referrer) && (isAdminOrVip || isReferrerMatch(s.referrer)))
                            .map(s => ({
                              id: s.id,
                              name: s.name,
                              status: s.status,
                              date: s.date,
                              type: 'Pendaftar',
                              referrer: s.referrer
                            })),
                          ...(systemState.activeStudents || [])
                            .filter(s => s.referrer && !isSelfReferral(s, s.referrer) && (isAdminOrVip || isReferrerMatch(s.referrer)))
                            .map(s => ({
                              id: s.id,
                              name: s.name,
                              status: s.status,
                              date: "-",
                              type: 'Siswa Aktif',
                              referrer: s.referrer
                            }))
                        ];
    
                        if (myReferrals.length === 0) {
                          return (
                            <div className="text-center py-6 text-slate-500 text-xs italic">
                              Belum ada siswa yang mendaftar menggunakan kode referral{isAdminOrVip ? "." : " Anda."}
                            </div>
                          );
                        }
    
                        return myReferrals.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-xl">
                            <div>
                              <p className="font-bold text-xs text-slate-800">{item.name}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">
                                {item.type} • {item.date} 
                                {isAdminOrVip && <span className="block mt-0.5 text-rose-500 font-bold">Ref: {item.referrer}</span>}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                              item.type === 'Siswa Aktif' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                )
  );
}
