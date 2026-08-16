import React from "react";
import { StudentAttendanceManager } from "./StudentAttendanceManager";
import { BookOpen, Calendar, CheckCircle, Clock, X } from "lucide-react";

interface LmsAbsenSegmentProps {
  activeStudentClass: any;
  activeStudents: any;
  allClasses: any;
  assessmentSubject: any;
  attendanceRecords: any;
  currentUser: any;
  matchingStudent: any;
  onAddAttendance: any;
  onUpdateState: any;
  selectedBabNumber: any;
  setActiveSubTab: any;
  setViewingAttendancePhoto: any;
}

export default function LmsAbsenSegment({ activeStudentClass, activeStudents, allClasses, assessmentSubject, attendanceRecords, currentUser, matchingStudent, onAddAttendance, onUpdateState, selectedBabNumber, setActiveSubTab, setViewingAttendancePhoto }: LmsAbsenSegmentProps) {
  return (
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
  );
}
