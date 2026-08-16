import React from "react";
import { AlertCircle, Eye, FileText, Trash2, Upload } from "lucide-react";
import { uploadFileToFirebase } from "../../lib/storageHelper";

interface LmsDokumenSegmentProps {
  currentUser: any;
  onUpdateState: any;
  setViewingDoc: any;
  systemState: any;
}

export default function LmsDokumenSegment({ currentUser, onUpdateState, setViewingDoc, systemState }: LmsDokumenSegmentProps) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
                {(() => {
                  let regStudent = systemState?.registeredStudents?.find(
                    (rs: any) =>
                      (currentUser?.studentId && rs.id === currentUser.studentId) ||
                      (currentUser?.email && rs.email === currentUser.email) || (currentUser?.name && rs.name === currentUser.name)
                  );
    
                  let isActiveStudentFallback = false;
                  if (!regStudent) {
                    const matchedActive = systemState?.activeStudents?.find(
                      (as: any) =>
                        as.id === currentUser?.studentId ||
                        (currentUser?.name && as.name === currentUser.name) ||
                        (currentUser?.email && as.email === currentUser.email)
                    );
                    if (matchedActive) {
                      regStudent = matchedActive;
                      isActiveStudentFallback = true;
                    }
                  }
    
                  if (!regStudent) {
                    return (
                      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 text-amber-900">
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                          <span>Akun Registrasi Belum Terhubung</span>
                        </div>
                        <p className="text-xs">
                          Sistem tidak mendeteksi formulir pendaftaran akademik yang terhubung dengan email Anda (<strong>{currentUser?.email}</strong>). Harap hubungi staf admin LPK Source Course Indonesia untuk menautkan akun Anda.
                        </p>
                      </div>
                    );
                  }
    
                  // Calculate how many of the 17 documents have been uploaded
                  const documentList = [
                    { field: "docKTP", label: "KTP (Kartu Tanda Penduduk)", isRequired: true, type: "PDF" },
                    { field: "docAkta", label: "Akta Kelahiran", isRequired: true, type: "PDF" },
                    { field: "docIjazahSMA", label: "Ijazah SMA/SMK/Sederajat", isRequired: true, type: "PDF" },
                    { field: "docTranskip", label: "Transkrip Nilai Akademik", isRequired: false, type: "PDF" },
                    { field: "docKK", label: "Kartu Keluarga (KK)", isRequired: false, type: "PDF" },
                    { field: "docFoto", label: "Pasfoto (Background Merah)", isRequired: false, type: "JPG" },
                    { field: "docIjazahSD", label: "Ijazah SD", isRequired: false, type: "PDF" },
                    { field: "docIjazahSMP", label: "Ijazah SMP/MTs", isRequired: false, type: "PDF" },
                    { field: "docPraMCU", label: "Hasil Pra Medical Check-Up", isRequired: false, type: "MED" },
                    { field: "docVaksin", label: "Sertifikat Vaksin Booster", isRequired: false, type: "MED" },
                    { field: "docCV1", label: "Curriculum Vitae (CV) - Bagian 1", isRequired: false, type: "CV" },
                    { field: "docCV2", label: "Curriculum Vitae (CV) - Bagian 2", isRequired: false, type: "CV" },
                    { field: "docCV3", label: "Curriculum Vitae (CV) - Bagian 3", isRequired: false, type: "CV" },
                    { field: "docCV4", label: "Curriculum Vitae (CV) - Bagian 4", isRequired: false, type: "CV" },
                    { field: "docCV5", label: "Curriculum Vitae (CV) - Bagian 5", isRequired: false, type: "CV" },
                    { field: "docMoU", label: "MoU Dokumen Persetujuan", isRequired: false, type: "MoU" },
                    { field: "docKontrak", label: "Kontrak Kerja (JOB)", isRequired: false, type: "JOB" },
                  ];
    
                  const getRealDocValue = (val: string) => val && !val.includes("_default.") ? val : "";
                  const totalUploaded = documentList.filter(d => !!getRealDocValue((regStudent as any)[d.field])).length;
                  const requiredUploaded = documentList.filter(d => d.isRequired && !!getRealDocValue((regStudent as any)[d.field])).length;
                  const totalRequired = documentList.filter(d => d.isRequired).length;
                  const allRequiredCompleted = requiredUploaded === totalRequired;
    
                  return (
                    <div className="space-y-6">
                      {/* Summary Banner */}
                      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-10 translate-x-8 translate-y-8">
                          <FileText className="h-44 w-44" />
                        </div>
                        <div className="space-y-3 relative z-10 max-w-2xl">
                          <span className="text-[10px] font-mono font-extrabold uppercase bg-yellow-400 text-blue-950 px-2.5 py-1 rounded-md tracking-wider">
                            📂 Dokumen Persyaratan Akademik (17 Berkas)
                          </span>
                          <h3 className="font-display font-black text-xl sm:text-2xl leading-tight">
                            Lengkapi & Pantau Berkas Administrasi Anda
                          </h3>
                          <p className="text-xs text-blue-100 font-normal leading-relaxed">
                            Sesuai ketentuan, Anda wajib melengkapi 3 berkas utama (KTP, Akta, Ijazah SMA) terlebih dahulu saat pendaftaran. Sisa 14 dokumen lainnya (Transkrip, Pasfoto, KK, MCU, Vaksin, Kontrak Kerja, dll) dapat Anda unggah/lengkapi secara bertahap di bawah ini seiring jalannya perkuliahan.
                          </p>
    
                          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                              <span className="text-yellow-400 font-bold">📋 Total Terunggah:</span>
                              <span className="font-extrabold text-white font-mono">{totalUploaded} / 17 Berkas</span>
                            </div>
                            <div className="bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                              <span className="text-yellow-400 font-bold">⚠️ Syarat Wajib:</span>
                              <span className={`font-extrabold font-mono ${allRequiredCompleted ? "text-emerald-400" : "text-amber-400"}`}>
                                {requiredUploaded} / {totalRequired} Lengkap
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
    
                      {/* Document Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentList.map((doc, idx) => {
                          const rawVal = (regStudent as any)[doc.field];
                          const currentVal = rawVal && !rawVal.includes("_default.") ? rawVal : "";
                          const badgeColor = 
                            doc.isRequired ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
    
                          return (
                            <div key={doc.field} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3 hover:border-indigo-200 hover:shadow-xs transition">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border leading-none bg-slate-50">
                                    #{idx + 1}
                                  </span>
                                  <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded border leading-none uppercase shrink-0 ${badgeColor}`}>
                                    {doc.isRequired 
                                      ? "Wajib" 
                                      : doc.label.includes("Transkrip")
                                        ? "Tidak Wajib"
                                        : doc.label.includes("Kontrak Kerja")
                                          ? "Setelah Lulus"
                                          : "Bisa Menyusul"}
                                  </span>
                                  <span className="text-[8.5px] font-mono font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border leading-none uppercase">
                                    {doc.type}
                                  </span>
                                </div>
                                <h4 className="text-[11.5px] font-black text-slate-900 mt-2 truncate" title={doc.label}>
                                  {doc.label}
                                </h4>
                                
                                <div className="mt-2.5 flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 text-[10px] text-slate-600 truncate font-mono">
                                  <span className="text-slate-400 shrink-0">📄</span>
                                  <span className="truncate" title={currentVal.includes('|') ? currentVal.split('|')[0] : (currentVal.startsWith('http') || currentVal.startsWith('data:') ? 'Berkas Terlampir' : currentVal) || "Belum dilengkapi"}>
                                    {(currentVal.includes('|') ? currentVal.split('|')[0] : (currentVal.startsWith('http') || currentVal.startsWith('data:') ? 'Berkas Terlampir' : currentVal)) || "Belum dilengkapi (Silakan Unggah)"}
                                  </span>
                                </div>
                              </div>
    
                              <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 pt-3">
                                <label className="flex-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-200 px-2 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition text-center flex items-center justify-center gap-1">
                                  <Upload className="h-3.5 w-3.5 text-indigo-600" />
                                  <span>{currentVal ? "Ganti" : "Unggah"}</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const url = await uploadFileToFirebase(file, "registrations");
                                        const updated = {
                                          ...regStudent,
                                          [doc.field]: `${file.name}|${url}`,
                                        };
                                        if (onUpdateState) {
                                          await onUpdateState(
                                            isActiveStudentFallback ? "activeStudents" : "registeredStudents",
                                            "update",
                                            updated
                                          );
                                        }
                                      } catch(err) {
                                        console.error(err);
                                        alert("Gagal mengunggah berkas.");
                                      }
                                    }}
                                  />
                                </label>
    
                                {currentVal && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setViewingDoc({
                                        title: doc.label,
                                        url: currentVal.includes("|") ? currentVal.split("|")[1] : currentVal,
                                      });
                                    }}
                                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1.5 rounded-xl text-[10px] font-extrabold transition text-center flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                                    title="Lihat Berkas"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Lihat</span>
                                  </button>
                                )}
    
                                {currentVal && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const updated = {
                                        ...regStudent,
                                        [doc.field]: "",
                                      };
                                      if (onUpdateState) {
                                        await onUpdateState(
                                          isActiveStudentFallback ? "activeStudents" : "registeredStudents",
                                          "update",
                                          updated
                                        );
                                      }
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-150 transition cursor-pointer"
                                    title="Hapus Berkas"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
  );
}
