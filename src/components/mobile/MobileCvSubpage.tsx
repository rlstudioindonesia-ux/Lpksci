import React from "react";
import { AlertCircle, FileText } from "lucide-react";
import { StudentCvView } from "../MobileDashboardView";

interface MobileCvSubpageProps {
  currentUser: any;
  handleUpdateState: any;
  onOpenLogin: any;
  selectedCvStudentId: any;
  setActiveSubpage: any;
  setSelectedCvStudentId: any;
  systemState: any;
}

export default function MobileCvSubpage({ currentUser, handleUpdateState, onOpenLogin, selectedCvStudentId, setActiveSubpage, setSelectedCvStudentId, systemState }: MobileCvSubpageProps) {
  return (
    <div className="flex-1 p-3 space-y-4 text-left">
                  {(() => {
                    if (!currentUser) {
                      return (
                        <div className="bg-white p-6 rounded-3xl border border-slate-100/80 text-center space-y-4 max-w-md mx-auto my-8">
                          <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-[24px] flex items-center justify-center mx-auto">
                            <FileText className="h-6 w-6" />
                          </div>
                          <h3 className="font-extrabold text-sm text-slate-800">Menu CV & Biodata (Rirekisho)</h3>
                          <p className="text-xs text-slate-500 leading-normal">
                            Silakan login sebagai siswa bimbingan LPK untuk melengkapi, menyinkronkan data, dan mengunduh CV wawancara kerja Anda.
                          </p>
                          <button
                            onClick={onOpenLogin}
                            className="w-full bg-indigo-800 text-white font-extrabold text-xs py-3.5 rounded-[24px] transition hover:bg-indigo-700"
                          >
                            🔑 Buka Portal Login
                          </button>
                        </div>
                      );
                    }
    
                    const isAdminOrVvip = currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP" || currentUser.role === "Pengajar";
                    const activeStudent = systemState.activeStudents?.find(
                      (s) => s.id === selectedCvStudentId || (s.name === currentUser.name && !isAdminOrVvip)
                    );
    
                    return (
                      <div className="space-y-4">
                        {isAdminOrVvip && (
                          <div className="bg-slate-50 border border-slate-100/80 p-4 rounded-[24px] space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase">Pilih Siswa (Akses Staf):</label>
                            <select
                              value={selectedCvStudentId}
                              onChange={(e) => setSelectedCvStudentId(e.target.value)}
                              className="w-full text-xs p-3 border border-slate-100/80 bg-white rounded-xl outline-none"
                            >
                              <option value="">-- Pilih Siswa --</option>
                              {systemState.activeStudents?.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} ({s.id} - {s.class})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {activeStudent ? (
                          <StudentCvView
                            student={activeStudent}
                            onUpdateStudent={async (payload) => {
                              return handleUpdateState("activeStudents", "update", payload);
                            }}
                            lpkName={systemState.customization?.logoText || "LPK SOURCE COURSE INDONESIA"}
                            onBack={() => setActiveSubpage(null)}
                          />
                        ) : (
                          <div className="bg-white p-6 rounded-3xl border border-slate-100/80 text-center space-y-2 max-w-md mx-auto my-8">
                            <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
                            <h4 className="font-extrabold text-xs text-slate-850 uppercase">Data Bimbingan Belum Diplot</h4>
                            <p className="text-[10px] text-slate-500 leading-normal">
                              Akun Anda belum dihubungkan dengan data bimbingan aktif di sistem LPK Pati. Harap hubungi Admin atau Sensei bimbingan Anda untuk memplot data bimbingan Anda terlebih dahulu.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
  );
}
