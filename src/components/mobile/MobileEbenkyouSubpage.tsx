import React from "react";
import { InlineLoginPanel } from "../InlineLoginPanel";
import { BookOpen } from "lucide-react";
import { CHAPTERS_LIST } from "../../chapters";
import { LmsView } from "../MobileDashboardView";

interface MobileEbenkyouSubpageProps {
  activeSubpage: any;
  currentUser: any;
  handleUpdateState: any;
  onLoginSuccess: any;
  selectedClassLog: any;
  setSelectedClassLog: any;
  systemState: any;
}

export default function MobileEbenkyouSubpage({ activeSubpage, currentUser, handleUpdateState, onLoginSuccess, selectedClassLog, setSelectedClassLog, systemState }: MobileEbenkyouSubpageProps) {
  return (
    !currentUser ? (
                  <InlineLoginPanel
                    title="E-Benkyou LMS"
                    requiredRole="Siswa"
                    description="Masuk untuk mengakses materi latihan kuis kosakata, gramatika, dan modul Kaigo LPK Pati."
                    onLoginSuccess={(u, isDefaultPassword) => onLoginSuccess?.(u, isDefaultPassword)}
                    systemState={systemState}
                  />
                ) : (
                  <div className="p-1 space-y-4">
                    {!selectedClassLog && activeSubpage !== "17berkas" ? (
                      <div className="bg-white rounded-3xl border border-slate-100/80/80 p-5 space-y-4 text-center shadow-xs">
                        <div className="h-12 w-12 bg-sky-50 text-sky-600 rounded-[24px] flex items-center justify-center mx-auto ring-4 ring-sky-50">
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                            Pilih Kelas E-Benkyou
                          </h3>
                          <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-normal">
                            Silakan pilih kelas bimbingan aktif Anda di bawah ini
                            untuk menampilkan materi pembelajaran, latihan kuis, dan
                            logbook kehadiran kelas.
                          </p>
                        </div>
    
                        {(() => {
                          const activeLmsClasses = (systemState?.customization?.lmsClasses || []);
    
                          const uniqueClassesList = Array.from(
                            new Set(
                              activeLmsClasses
                                .filter((c: any) => {
                                  if (c.type === "alumni" && currentUser?.role !== "Admin" && currentUser?.role !== "Admin Super" && currentUser?.role !== "Admin Biasa" && currentUser?.role !== "VVIP" && currentUser?.role !== "Alumni") {
                                    return false;
                                  }
                                  return true;
                                })
                                .map((c: any) => c.name)
                            )
                          );
    
                          let plottedClass = currentUser?.assignedClass;
                          if (!plottedClass && currentUser) {
                            if (currentUser.role === "Siswa") {
                              const student = (
                                systemState?.activeStudents || []
                              ).find(
                                (s) =>
                                  s.id === currentUser.studentId ||
                                  s.name === currentUser.name,
                              );
                              plottedClass = student?.class;
                            } else if (currentUser.role === "Pengajar") {
                              plottedClass = currentUser.assignedClass || "";
                            }
                          }
    
                          let classesToDisplay = uniqueClassesList;
    
                          if (currentUser && currentUser.role === "Pengajar" && !currentUser.assignedClass) {
                            classesToDisplay = [];
                          } else if (currentUser && currentUser.role === "Siswa" && (!plottedClass || plottedClass === "Belum ada kelas")) {
                            classesToDisplay = [];
                          } else if (
                            currentUser &&
                            currentUser.role !== "Admin" &&
                            currentUser.role !== "Admin Super" &&
                            currentUser.role !== "Admin Biasa" &&
                            currentUser.role !== "VVIP" &&
                            plottedClass &&
                            plottedClass !== "Semua"
                          ) {
                            const normalize = (val: string) => {
                              if (!val) return "";
                              return val
                                .toLowerCase()
                                .replace(/^kelas\s+/i, "")
                                .replace(/\s+/g, "")
                                .trim();
                            };
                            const normPlotted = normalize(plottedClass);
                            classesToDisplay = uniqueClassesList.filter(
                              (c: any) => normalize(c) === normPlotted,
                            );
                            if (classesToDisplay.length === 0) {
                              // Only allow displaying it if it actually exists in the system classes
                              const classExists = activeLmsClasses.some((ac: any) => 
                                ac.name.toLowerCase() === plottedClass.toLowerCase() || 
                                ac.id.toLowerCase() === plottedClass.toLowerCase()
                              );
                              if (classExists) {
                                classesToDisplay = [plottedClass];
                              } else {
                                // If it doesn't exist in system, don't show it as a valid selectable class
                                classesToDisplay = [];
                              }
                            }
                          }
    
                          const normalizeForStatus = (val: string) => {
                            if (!val) return "";
                            return val
                              .toLowerCase()
                              .replace(/^kelas\s+/i, "")
                              .replace(/\s+/g, "")
                              .trim();
                          };
                          
                          const isClassActive = (className: string) => {
                            const foundClass = activeLmsClasses.find(
                              (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                            );
                            if (foundClass) {
                              return foundClass.isActive !== false;
                            }
                            if (className.startsWith("Alumni")) return true;
                            const norm = normalizeForStatus(className);
                            const hasTeacher = (systemState?.users || []).some(
                              (u) => u.role === "Pengajar" && normalizeForStatus(u.assignedClass || "") === norm
                            );
                            const hasStudent = (systemState?.activeStudents || []).some(
                              (s) => normalizeForStatus(s.class || "") === norm
                            );
                            return hasTeacher || hasStudent;
                          };
                          
                          const getClassMaxBab = (className: string) => {
                            const foundClass = activeLmsClasses.find(
                              (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                            );
                            if (!foundClass || !foundClass.chapters) return CHAPTERS_LIST.length;
                            // Count only active chapters
                            return foundClass.chapters.filter((ch: any) => ch.isActive !== false).length;
                          };
    
                          const getClassProgress = (className: string) => {
                            const foundClass = activeLmsClasses.find(
                              (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                            );
                            const classActiveBab = foundClass?.activeChapterNum || 1;
                            
                            const norm = normalizeForStatus(className);
                            const studentsInClass = (systemState?.activeStudents || []).filter(
                              (s) => normalizeForStatus(s.class || "") === norm
                            );
                            if (studentsInClass.length > 0) {
                              const studentIds = new Set(studentsInClass.map(s => s.id));
                              const assessments = (systemState?.chapterAssessments || []).filter(
                                a => studentIds.has(a.studentId) && a.status === "Telah Dinilai"
                              );
                              if (assessments.length > 0) {
                                const maxGraded = Math.max(...assessments.map(a => a.chapterNumber || 1));
                                // Capped by active bab if active bab is lower
                                return Math.min(maxGraded, classActiveBab);
                              }
                              return classActiveBab;
                            }
                            return classActiveBab;
                          };
    
                          return (
                            <div className="space-y-4 pt-1">
                              {classesToDisplay.length === 0 && currentUser?.role === "Pengajar" && !currentUser?.assignedClass && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center shadow-inner">
                                  <p className="text-[11px] leading-relaxed text-red-700 font-bold uppercase tracking-wider">
                                    Akses Ditolak
                                  </p>
                                  <p className="text-[10px] text-red-600 mt-1">
                                    Anda belum diploting (ditugaskan) ke kelas manapun. Silakan hubungi Admin LPK.
                                  </p>
                                </div>
                              )}
                              {classesToDisplay.length === 0 && currentUser?.role === "Siswa" && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center shadow-inner">
                                  <p className="text-[11px] leading-relaxed text-amber-700 font-bold uppercase tracking-wider">
                                    Menunggu Ploting Kelas
                                  </p>
                                  <p className="text-[10px] text-amber-600 mt-1">
                                    Akun Anda belum dihubungkan dengan data bimbingan aktif. Harap tunggu Admin LPK memplot data bimbingan Anda terlebih dahulu.
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                {classesToDisplay.map((className: any, idx: number) => {
                                  const active = isClassActive(className);
                                  const progress = getClassProgress(className);
                                  
                                  const foundClass = activeLmsClasses.find(
                                    (c: any) => c.name.toLowerCase() === className.toLowerCase() || c.id.toLowerCase() === className.toLowerCase()
                                  );
                                  const isAlumni = foundClass?.type === "alumni" || className.toLowerCase().includes("alumni");
                                  
                                  let borderColor = "border-slate-300";
                                  let dotColor = "bg-slate-400";
                                  let textColor = "text-slate-500";
                                  
                                  if (active) {
                                    borderColor = isAlumni ? "border-emerald-500 bg-emerald-50/30" : "border-blue-500 bg-blue-50/30";
                                    dotColor = isAlumni ? "bg-emerald-500" : "bg-blue-500";
                                    textColor = isAlumni ? "text-emerald-600" : "text-blue-600";
                                  } else {
                                    borderColor = "border-rose-400 bg-rose-50/30";
                                    dotColor = "bg-rose-500";
                                    textColor = "text-rose-500";
                                  }
                                  
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setSelectedClassLog(className)}
                                      className={`flex flex-col items-center justify-center p-2.5 border hover:opacity-80 rounded-xl transition active:scale-95 cursor-pointer text-center animate-fade-in shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${borderColor}`}
                                    >
                                      <div className="flex items-center justify-center gap-1.5 mb-1.5 w-full">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                        <span className="text-[10px] font-black text-slate-800 uppercase leading-none truncate">
                                          {className}
                                        </span>
                                      </div>
                                      <span className={`text-[10px] font-bold uppercase leading-none ${textColor}`}>
                                        BAB {progress} / ({getClassMaxBab(className)})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                              
                              <div className="flex flex-wrap items-center justify-center gap-4 py-3 border-t border-slate-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                                  <span className="text-[11px] font-semibold text-slate-700">Kelas Reguler</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                                  <span className="text-[11px] font-semibold text-slate-700">Program Alumni</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_8px_30px_rgb(0,0,0,0.04)]" />
                                  <span className="text-[11px] font-semibold text-slate-700">Nonaktif</span>
                                </div>
                              </div>
                              
                              <div className="bg-sky-50/50 rounded-[24px] p-3 flex items-start gap-2.5 border border-sky-100 text-left shadow-inner">
                                <div className="w-5 h-5 rounded-full bg-sky-200 text-sky-700 flex items-center justify-center font-extrabold text-[12px] shrink-0 mt-0.5 font-serif italic">i</div>
                                <div>
                                  <p className="text-[11px] font-bold text-sky-900 mb-0.5">Keterangan:</p>
                                  <p className="text-[10px] text-sky-800/80 leading-relaxed font-medium">BAB (Bab Pembelajaran) menunjukkan bab terakhir yang sedang dipelajari di kelas tersebut. Total BAB Bahasa disesuaikan dengan manajemen kurikulum kelas masing-masing.</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Header showing currently selected class */}
                        {activeSubpage !== "17berkas" && (
                          <div className="bg-indigo-700 text-white p-3.5 rounded-[24px] flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                          <div className="space-y-0.5 text-left">
                            <span className="text-[8px] font-bold text-yellow-350 tracking-wider uppercase font-mono">
                              KELAS AKTIF E-BENKYOU
                            </span>
                            <h4 className="text-xs font-black tracking-tight uppercase leading-none">
                              {selectedClassLog}
                            </h4>
                          </div>
                          <button
                            onClick={() => setSelectedClassLog(null)}
                            className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] uppercase border border-white/20 transition cursor-pointer active:scale-95"
                          >
                            ← Ganti Kelas
                          </button>
                        </div>
                        )}
    
                        <LmsView
                          initialSubTab={activeSubpage === "17berkas" ? "dokumen" : undefined}
                          hideWelcomeBanner={activeSubpage === "17berkas"}
                          currentUser={
                            currentUser
                              ? {
                                  ...currentUser,
                                  assignedClass:
                                    selectedClassLog || currentUser.assignedClass,
                                }
                              : null
                          }
                          attendanceRecords={systemState.attendance}
                          activeStudents={systemState.activeStudents}
                          lmsLessons={systemState.lmsLessons}
                          chapterAssessments={systemState.chapterAssessments}
                          jobOrders={systemState.jobOrders}
                          onAddAttendance={(payload) =>
                            handleUpdateState("attendance", "add", payload)
                          }
                          onUpdateState={handleUpdateState}
                          systemState={systemState}
                        />
                      </div>
                    )}
                  </div>
                )
  );
}
