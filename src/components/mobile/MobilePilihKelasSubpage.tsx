import React from "react";
import { Activity, BookOpen, Calendar, Check, Clock, Crown, Eye, FileText, GraduationCap, MessageCircle, MessageSquare, ShieldAlert, Users, X } from "lucide-react";
import { formatRupiah, parsePrice } from "../MobileDashboardView";
import { matchesClassLevel, alumniClassNameFor, resolveClassQuota } from "../../lib/classQuota";

interface MobilePilihKelasSubpageProps {
  currentUser: any;
  isUserAlumni: any;
  monitoredVvipClass: any;
  setActiveSubpage: any;
  setMonitoredVvipClass: any;
  setSelectedClassLog: any;
  systemState: any;
}

export default function MobilePilihKelasSubpage({ currentUser, isUserAlumni, monitoredVvipClass, setActiveSubpage, setMonitoredVvipClass, setSelectedClassLog, systemState }: MobilePilihKelasSubpageProps) {
  return (
    (() => {
                const getStudentsInClass = (className: string) => {
                  const students = (systemState.activeStudents || []).filter(
                    (s: any) => matchesClassLevel(s.assignedClass || s.class, className)
                  );
                  const usersWithClass = (systemState.users || []).filter(
                    (u: any) => matchesClassLevel(u.assignedClass, className)
                  );
                  
                  const seen = new Set();
                  const combined: any[] = [];
                  
                  students.forEach((s: any) => {
                    const key = (s.id || s.name || "").toLowerCase().trim();
                    if (key && !seen.has(key)) {
                      seen.add(key);
                      combined.push({
                        id: s.id || "SIS-???",
                        name: s.name,
                        phone: s.phone || s.whatsapp || "",
                        status: s.status || "Aktif",
                        role: "Alumni"
                      });
                    }
                  });
                  
                  usersWithClass.forEach((u: any) => {
                    const key = (u.studentId || u.username || u.name || "").toLowerCase().trim();
                    if (key && !seen.has(key)) {
                      seen.add(key);
                      combined.push({
                        id: u.studentId || "SIS-???",
                        name: u.name,
                        phone: u.phone || u.whatsapp || "",
                        status: "Aktif",
                        role: u.role || "Alumni"
                      });
                    }
                  });
                  
                  return combined;
                };
    
                return (
                  <div className="flex-1 p-3 space-y-4 text-left font-sans">
                    {currentUser?.role === "VVIP" && (
                      <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl p-4 text-white shadow-md flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-[24px] shrink-0">
                          <ShieldAlert className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-xs uppercase tracking-wider">Akses Executive VVIP Monitoring</h3>
                          <p className="text-[10px] text-amber-50 leading-tight">Gunakan tombol "Pantau Kelas" pada masing-masing kartu kelas di bawah untuk melihat rincian peserta.</p>
                        </div>
                      </div>
                    )}
    
                    <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-lg border border-slate-800">
                      <div className="absolute top-0 right-0 p-4">
                        <div className="bg-white/10 backdrop-blur text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20">
                          ☆ ☆ ☆ N1 CERTIFIED
                        </div>
                      </div>
                      <div className="relative z-10 space-y-4 max-w-[85%]">
                        <h2 className="text-xl font-display font-black text-white leading-tight">
                          Belajar Langsung dengan Ahlinya!
                        </h2>
                        <p className="text-xs text-sky-200">
                          Didukung oleh Sensei Bersertifikasi N1 dan Native Speaker Jepang
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 text-sky-400 mt-0.5" />
                            <p className="text-[9px] text-slate-300">Kurikulum Berstandar Jepang</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-sky-400 mt-0.5" />
                            <p className="text-[9px] text-slate-300">Pengajar N1 & Native</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Activity className="h-4 w-4 text-sky-400 mt-0.5" />
                            <p className="text-[9px] text-slate-300">Metode Interaktif</p>
                          </div>
                        </div>
                      </div>
                    </div>
    
                    {/* Dynamic Alumni VIP Cards Section */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 mt-6">
                      {(systemState.customization?.landingConfig?.alumniClasses && systemState.customization.landingConfig.alumniClasses.length > 0
                        ? systemState.customization.landingConfig.alumniClasses
                        : [
                            {
                              method: "ONLINE & OFFLINE",
                              level: "N3",
                              emoji: "⛩️",
                              title: "Level N3",
                              description: "Membangun dasar yang kuat untuk komunikasi sehari-hari & persiapan kerja di Jepang.",
                              features: ['Kosakata & Tata Bahasa Dasar', 'Percakapan Sehari-hari', 'Persiapan ujian JLPT N3'],
                              openClass: "19 Agustus 2026",
                              duration: "3-4 Bulan",
                              discount: "20%",
                              discountText: "Diskon Hemat Rp 200.000",
                              originalPrice: "Rp 1.200.000",
                              finalPrice: "Rp 1.000.000",
                              colorScheme: "emerald",
                              registered: 8,
                              quota: 10
                            },
                            {
                              method: "ONLINE & OFFLINE",
                              level: "N2",
                              emoji: "🗻",
                              title: "Level N2",
                              description: "Tingkatkan kemampuan bahasa untuk komunikasi lebih luas & dunia kerja.",
                              features: ['Kosakata & Tata Bahasa Menengah', 'Pemahaman Bacaan & Listening', 'Persiapan JLPT N2'],
                              openClass: "26 Agustus 2026",
                              duration: "4-6 Bulan",
                              discount: "15%",
                              discountText: "Diskon Hemat Rp 195.000",
                              originalPrice: "Rp 1.495.000",
                              finalPrice: "Rp 1.300.000",
                              colorScheme: "blue",
                              registered: 7,
                              quota: 15
                            },
                            {
                              method: "ONLINE & OFFLINE",
                              level: "N1",
                              emoji: "🏯",
                              title: "Level N1",
                              description: "Kuasai bahasa Jepang tingkat lanjut untuk keperluan akademik, bisnis, & profesional.",
                              features: ['Kosakata & Tata Bahasa Lanjutan', 'Kemampuan Diskusi & Presentasi', 'Persiapan JLPT N1'],
                              openClass: "1 September 2026",
                              duration: "6-8 Bulan",
                              discount: "10%",
                              discountText: "Diskon Hemat Rp 150.000",
                              originalPrice: "Rp 1.650.000",
                              finalPrice: "Rp 1.500.000",
                              colorScheme: "purple",
                              registered: 3,
                              quota: 8
                            },
                            {
                              method: "ONLINE & OFFLINE",
                              level: "NATIVE",
                              emoji: "🪭",
                              title: "Level Native",
                              description: "Belajar seperti orang Jepang! Fasih, natural, dan percaya diri dalam segala situasi.",
                              features: ['Ekspresi Natural & Idiom', 'Komunikasi Bisnis & Budaya Jepang', 'Praktik Langsung dengan Native Speaker'],
                              openClass: "Setiap Senin",
                              duration: "Fleksibel",
                              colorScheme: "orange",
                              registered: 4,
                              quota: 10,
                              originalPrice: "Rp 1.900.000",
                              finalPrice: "Rp 1.800.000",
                              discount: "5%",
                              discountText: "Diskon Hemat Rp 100.000"
                            }
                          ]
                      ).map((cls: any, cidx: number) => {
                        const colorTheme = cls.colorScheme || "blue";
                        
                        const themeMap: Record<string, any> = {
                          emerald: {
                            textTop: 'text-emerald-500',
                            textMain: 'text-emerald-600',
                            check: 'text-emerald-500',
                            bgBadge: 'bg-emerald-50',
                            textBadge: 'text-emerald-700',
                            borderBadge: 'border-emerald-100',
                            bgBtn: 'bg-emerald-600',
                            hoverBtn: 'hover:bg-emerald-700'
                          },
                          blue: {
                            textTop: 'text-blue-500',
                            textMain: 'text-blue-600',
                            check: 'text-blue-500',
                            bgBadge: 'bg-blue-50',
                            textBadge: 'text-blue-700',
                            borderBadge: 'border-blue-100',
                            bgBtn: 'bg-blue-600',
                            hoverBtn: 'hover:bg-blue-700'
                          },
                          purple: {
                            textTop: 'text-purple-500',
                            textMain: 'text-purple-600',
                            check: 'text-purple-500',
                            bgBadge: 'bg-purple-50',
                            textBadge: 'text-purple-700',
                            borderBadge: 'border-purple-100',
                            bgBtn: 'bg-purple-600',
                            hoverBtn: 'hover:bg-purple-700'
                          },
                          orange: {
                            textTop: 'text-orange-500',
                            textMain: 'text-orange-600',
                            check: 'text-orange-500',
                            bgBadge: 'bg-orange-50',
                            textBadge: 'text-orange-700',
                            borderBadge: 'border-orange-100',
                            bgBtn: 'bg-orange-500',
                            hoverBtn: 'hover:bg-orange-600'
                          },
                          rose: {
                            textTop: 'text-rose-500',
                            textMain: 'text-rose-600',
                            check: 'text-rose-500',
                            bgBadge: 'bg-rose-50',
                            textBadge: 'text-rose-700',
                            borderBadge: 'border-rose-100',
                            bgBtn: 'bg-rose-600',
                            hoverBtn: 'hover:bg-rose-700'
                          }
                        };
    
                        const t = themeMap[colorTheme] || themeMap.blue;
                        const isLongLevel = cls.level?.length > 3;
                        // The real class name students actually get assigned to
                        // (matches what the "Manajemen Kelas Alumni" admin panel
                        // creates in lmsClasses: `Kelas Alumni ${title}`) - the
                        // old `Alumni ${level}` name never matched any real
                        // student, so the "Pendaftar" count (and Pemantauan
                        // Kelas below) always showed 0 regardless of the manual
                        // quota numbers typed into the CMS.
                        const alumniClassName = alumniClassNameFor(cls);
                        const realEnrolledCount = getStudentsInClass(alumniClassName).length;
                        const { registeredCount, quotaLimit, remaining } = resolveClassQuota(cls, realEnrolledCount);
                        const hasAccess = isUserAlumni || ["Admin", "Admin Super", "Admin Biasa", "VVIP"].includes(currentUser?.role || "");
    
                        return (
                          <div key={cls.id || cidx} className="bg-white rounded-[24px] md:rounded-[2.5rem] p-3 md:p-6 border border-slate-100/90 shadow-xs hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 flex flex-col relative overflow-hidden">
                            <div className="flex justify-between items-start mb-2 md:mb-3">
                              <div>
                                <span className={`${t.textTop} text-[8px] md:text-[9px] font-extrabold tracking-widest block uppercase`}>{cls.method || "ONLINE & OFFLINE"}</span>
                                <h3 className={`${isLongLevel ? 'text-lg md:text-3xl' : 'text-3xl md:text-5xl'} font-black ${t.textMain} mt-0.5 tracking-tight`}>{cls.level}</h3>
                              </div>
                              <div className="text-2xl md:text-4xl opacity-85 select-none">{cls.emoji}</div>
                            </div>
                            
                            <h4 className="text-xs md:text-sm font-black text-slate-900 mb-1">{cls.title}</h4>
                            <p className="text-[9px] md:text-[10px] text-slate-500 mb-2 md:mb-3 leading-relaxed min-h-[30px] line-clamp-2">{cls.description}</p>
                            
                            <ul className="space-y-1 mb-3 md:mb-4 flex-1">
                              {(cls.features || []).slice(0, 3).map((pt: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 md:gap-2 text-[9px] md:text-[10px] text-slate-700 font-bold">
                                  <Check className={`w-3 h-3 md:w-3.5 md:h-3.5 ${t.check} shrink-0`} />
                                  <span className="leading-tight">{pt}</span>
                                </li>
                              ))}
                            </ul>
    
                            <div className="mb-3 md:mb-4 space-y-1.5 md:space-y-2">
                              {cls.openClass && (
                                <div className={`flex items-center justify-between ${t.bgBadge} px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border ${t.borderBadge}`}>
                                  <div className={`flex items-center gap-1 md:gap-1.5 ${t.textMain} font-bold text-[8px] md:text-[10px]`}>
                                    <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    <span>Open</span>
                                  </div>
                                  <span className={`${t.textMain} font-black text-[8px] md:text-[10px]`}>{cls.openClass}</span>
                                </div>
                              )}
                              {cls.duration && (
                                <div className={`flex items-center justify-between ${t.bgBadge} px-2 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border ${t.borderBadge}`}>
                                  <div className={`flex items-center gap-1 md:gap-1.5 ${t.textMain} font-bold text-[8px] md:text-[10px]`}>
                                    <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                    <span>Durasi</span>
                                  </div>
                                  <span className={`${t.textMain} font-black text-[8px] md:text-[10px]`}>{cls.duration}</span>
                                </div>
                              )}
    
                              {(cls.originalPrice || cls.finalPrice) && (
                                <div className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-[24px] p-2 md:p-3.5 mt-2 md:mt-4 relative overflow-hidden shadow-xs">
                                  <div className="flex flex-col gap-0.5 md:gap-1 text-left">
                                    {cls.originalPrice && (
                                      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 line-through">
                                          {formatRupiah(cls.originalPrice)}
                                        </span>
                                        {/* Discount badge omitted for extreme space saving if mobile */}
                                        <span className="hidden md:block">
                                        {(() => {
                                          const origNum = parsePrice(cls.originalPrice);
                                          const finalNum = parsePrice(cls.finalPrice);
                                          const savedAmount = origNum - finalNum;
                                          let badgeText = "";
                                          if (savedAmount > 0) badgeText = `-${formatRupiah(savedAmount)}`;
                                          if (!badgeText) return null;
                                          return (
                                            <span className="bg-rose-500 text-white text-[8px] font-black tracking-wide px-1 py-0.5 rounded uppercase">
                                              {badgeText}
                                            </span>
                                          );
                                        })()}
                                        </span>
                                      </div>
                                    )}
                                    {cls.finalPrice && (
                                      <div className="flex items-baseline gap-1 mt-0.5">
                                        <span className={`text-[9px] md:text-lg font-black tracking-tight ${t.textMain}`}>
                                          {formatRupiah(cls.finalPrice)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
    
                            {/* Registration status panel */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl md:rounded-[24px] p-2 md:p-3.5 space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                              <div className="flex items-center justify-between text-[8px] md:text-[10px] font-bold text-slate-700">
                                <div className="flex items-center gap-1 md:gap-1.5">
                                  <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                                  <span>Pendaftar</span>
                                </div>
                                <span className={`${t.textMain} font-black`}>
                                  {registeredCount}/{quotaLimit}
                                </span>
                              </div>
                              
                              <div className="w-full h-1.5 md:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${t.bgBtn}`}
                                  style={{ width: `${Math.min(100, Math.round((registeredCount / quotaLimit) * 100))}%` }}
                                />
                              </div>
    
                              <div className="flex items-center justify-between text-[7px] md:text-[9px] font-bold">
                                <span className={t.textMain}>
                                  Sisa: {remaining}
                                </span>
                              </div>
                            </div>
    
                            {/* Actions buttons */}
                            <div className="space-y-1 md:space-y-1.5">
                              {currentUser?.role === "VVIP" && (
                                <button
                                  onClick={() => {
                                    setMonitoredVvipClass(monitoredVvipClass === alumniClassName ? null : alumniClassName);
                                  }}
                                  className={`w-full text-[8px] md:text-[10px] font-bold py-1.5 md:py-2 px-2 md:px-3 rounded-full transition-all duration-300 flex items-center justify-center gap-1 border ${
                                    monitoredVvipClass === alumniClassName
                                      ? "bg-slate-950 text-white border-slate-900 shadow-xs"
                                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
                                  }`}
                                >
                                  <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                  <span>{monitoredVvipClass === alumniClassName ? "Dipantau" : "Pantau"}</span>
                                </button>
                              )}
    
                              {hasAccess ? (
                                <button 
                                  onClick={() => {
                                    setSelectedClassLog(alumniClassName);
                                    setActiveSubpage("ebenkyou");
                                  }}
                                  className={`w-full ${t.bgBtn} ${t.hoverBtn} text-white text-[9px] md:text-[10px] font-bold py-2 md:py-2.5 px-2 md:px-3 rounded-full flex items-center justify-center gap-1 transition duration-300`}
                                >
                                  <GraduationCap className="w-3 h-3 md:w-4 md:h-4" />
                                  <span>Masuk &gt;</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    const message = `Halo Admin LPK SCI, saya tertarik untuk mendaftar Kelas Alumni ${cls.level}. Mohon informasi pendaftaran selengkapnya.`;
                                    window.open(`https://wa.me/6281395090885?text=${encodeURIComponent(message)}`, "_blank");
                                  }}
                                  className={`w-full ${t.bgBtn} ${t.hoverBtn} text-white text-[9px] md:text-[10px] font-black py-2 md:py-2.5 px-2 md:px-3 rounded-full flex items-center justify-center gap-1 transition duration-300 cursor-pointer shadow-xs`}
                                >
                                  <FileText className="w-3 h-3 md:w-4 md:h-4" />
                                  <span>Daftar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
    
                    {currentUser?.role === "VVIP" && monitoredVvipClass && (() => {
                      const classStudents = getStudentsInClass(monitoredVvipClass);
                      return (
                        <div className="bg-white border border-slate-100/80/80 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4 animate-fade-in text-left">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-slate-100 p-2 rounded-[24px]">
                                <Crown className="h-5 w-5 text-amber-500" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm text-slate-850">
                                  Pemantauan Kelas: <span className="text-indigo-600">{monitoredVvipClass}</span>
                                </h3>
                                <p className="text-[10px] text-slate-500">
                                  Menampilkan daftar peserta terdaftar yang aktif belajar di level ini
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => setMonitoredVvipClass(null)}
                              className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full text-slate-400 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
    
                          {classStudents.length === 0 ? (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              Belum ada alumni/siswa yang terdaftar di kelas <span className="font-semibold">{monitoredVvipClass}</span>.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                              {classStudents.map((student, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 rounded-[24px] bg-slate-50 hover:bg-slate-100 border border-slate-100 transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center font-extrabold text-xs text-slate-600">
                                      {student.name ? student.name.charAt(0).toUpperCase() : "?"}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-xs text-slate-800">{student.name}</h4>
                                      <p className="text-[9px] text-slate-500 font-mono">{student.id}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {student.phone && (
                                      <a
                                        href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 p-2 rounded-full transition"
                                        title="WhatsApp"
                                      >
                                        <MessageSquare className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                    <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                                      {student.role || "Alumni"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
    
                    <div className="bg-indigo-800 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-black text-sm">Daftar Sekarang!</h3>
                        <p className="text-[9px] text-slate-300">Raih kesempatan terbaikmu<br/>untuk masa depan di Jepang.</p>
                      </div>
                      <button 
                        onClick={() => window.open(`https://wa.me/6281395090885?text=Halo%20Admin%20LPK%20SCI,%20saya%20${currentUser?.name || "Alumni"}%20ingin%20mendaftar%20kelas%20lanjutan.`)}
                        className="bg-white text-indigo-800 font-bold text-[10px] px-4 py-2 rounded-full hover:bg-slate-100 flex items-center gap-1.5"
                      >
                        Hubungi Kami <MessageCircle className="h-3 w-3 text-emerald-500" />
                      </button>
                    </div>
                  </div>
                );
              })()
  );
}
