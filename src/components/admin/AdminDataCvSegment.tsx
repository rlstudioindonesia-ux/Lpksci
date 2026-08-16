import React from "react";
import { BookOpen, ChevronLeft } from "lucide-react";
import { createSvgAvatar, getSafePhotoUrl } from "../../lib/storageHelper";
import StudentCvView from "../StudentCvView";
import { sortStudentsByDateDesc } from "../AdminView";

interface AdminDataCvSegmentProps {
  onUpdateState: any;
  setViewingCvStudentId: any;
  systemState: any;
  viewingCvStudentId: any;
}

export default function AdminDataCvSegment({ onUpdateState, setViewingCvStudentId, systemState, viewingCvStudentId }: AdminDataCvSegmentProps) {
  return (
    <div className="space-y-6 font-sans">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h2 className="font-display font-black text-xl text-slate-800">
                    Data CV & Biodata Jepang
                  </h2>
                  {viewingCvStudentId && (
                    <button
                      onClick={() => setViewingCvStudentId(null)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition flex items-center gap-2 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" /> Kembali ke Daftar
                    </button>
                  )}
                </div>
                
                {!viewingCvStudentId ? (
                  <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[...(systemState.activeStudents || [])].sort(sortStudentsByDateDesc).map(student => (
                        <div key={`${student.id}-${student.name}`} className="p-4 border border-slate-100 bg-slate-50 rounded-2xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={getSafePhotoUrl(student.profilePicture || (student as any).docFoto || systemState.registeredStudents?.find(r => r.id === student.id || (r.email && r.email === (student as any).email))?.docFoto, student.name)}
                              alt={student.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = createSvgAvatar(student.name || 'Siswa');
                              }}
                            />
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{student.name}</h4>
                              <p className="text-xs text-slate-500 mt-1">NIM: {student.id}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setViewingCvStudentId(student.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1.5"
                          >
                            <BookOpen className="h-3 w-3" /> Buka CV
                          </button>
                        </div>
                      ))}
                      {systemState.activeStudents.length === 0 && (
                        <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                          Belum ada siswa aktif.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 p-2 sm:p-4 print:p-0 print:border-0 print:bg-transparent shadow-sm">
                    {(() => {
                      const student = systemState.activeStudents.find(s => s.id === viewingCvStudentId);
                      if (!student) return <div className="p-8 text-center">Siswa tidak ditemukan</div>;
                      return (
                        <StudentCvView
                          student={student}
                          onUpdateStudent={async (updatedStudent) => {
                            const newStudents = systemState.activeStudents.map(s => 
                              s.id === updatedStudent.id ? updatedStudent : s
                            );
                            await onUpdateState("activeStudents", "update", updatedStudent);
                            return true;
                          }}
                        />
                      );
                    })()}
                  </div>
                )}
    
              </div>
  );
}
