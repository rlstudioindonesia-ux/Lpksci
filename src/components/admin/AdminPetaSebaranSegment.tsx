import React from "react";
import { ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import { ConfirmButton } from "../ConfirmButton";

interface AdminPetaSebaranSegmentProps {
  adminMapInstanceRef: any;
  adminMapRef: any;
  onUpdateState: any;
  sebaranPage: any;
  selectedMapPref: any;
  setIsCreateMapModalOpen: any;
  setMapCity: any;
  setMapCompany: any;
  setMapGraduationYear: any;
  setMapIsEditing: any;
  setMapLatitude: any;
  setMapLongitude: any;
  setMapPrefecture: any;
  setMapStudentId: any;
  setMapStudentName: any;
  setSebaranPage: any;
  setSelectedMapPref: any;
  systemState: any;
}

export default function AdminPetaSebaranSegment({ adminMapInstanceRef, adminMapRef, onUpdateState, sebaranPage, selectedMapPref, setIsCreateMapModalOpen, setMapCity, setMapCompany, setMapGraduationYear, setMapIsEditing, setMapLatitude, setMapLongitude, setMapPrefecture, setMapStudentId, setMapStudentName, setSebaranPage, setSelectedMapPref, systemState }: AdminPetaSebaranSegmentProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-4.5 sm:p-6 md:p-8 space-y-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-red-600" />
                    DATA PETA SEBARAN ALUMNI LPK
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Gunakan form di bawah ini untuk memasukkan atau memperbarui
                    sebaran geografis alumni LPK yang bekerja di Jepang agar muncul
                    secara real-time di OpenStreetMap.
                  </p>
                </div>
    
                {/* New Map Data Button */}
                <div className="w-full h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative z-10 mb-6">
                  <div ref={adminMapRef} className="w-full h-full z-10 relative"></div>
                </div>
    
                <div className="w-full flex justify-start">
                  <button
                    type="button"
                    onClick={() => setIsCreateMapModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Plus className="h-4 w-4" /> Input Data Sebaran Alumni
                  </button>
                </div>
    
                <div className="space-y-4">
                  {(() => {
                    const allSebaranAlumni = (systemState.activeStudents || [])
                      .filter((s) => s.status === "Di Jepang")
                      .filter((student) => {
                        if (!selectedMapPref) return true;
                        return (
                          student.prefecture === selectedMapPref ||
                          student.city === selectedMapPref
                        );
                      });
    
                    const sebaranPerPage = 10;
                    const totalSebaranPages = Math.max(1, Math.ceil(allSebaranAlumni.length / sebaranPerPage));
                    const currentSebaranPage = Math.min(sebaranPage, totalSebaranPages);
                    const paginatedSebaran = allSebaranAlumni.slice(
                      (currentSebaranPage - 1) * sebaranPerPage,
                      currentSebaranPage * sebaranPerPage
                    );
    
                    return (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-450 font-mono block">
                            📋 Daftar Sebaran Alumni Terdaftar {selectedMapPref ? `di ${selectedMapPref}` : ""} (
                            {allSebaranAlumni.length} Orang)
                          </span>
                          {selectedMapPref && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMapPref(null);
                                setSebaranPage(1);
                                if (adminMapInstanceRef.current) {
                                  adminMapInstanceRef.current.setView([36.2048, 138.2529], 5);
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-extrabold py-1 px-2.5 rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer border border-red-100 flex items-center gap-1 shadow-xs"
                            >
                              ❌ Bersihkan Filter ({selectedMapPref})
                            </button>
                          )}
                        </div>
    
                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                    Nama Alumni
                                  </th>
                                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase font-bold text-center">
                                    Wilayah Jepang
                                  </th>
                                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                    Instansi / Perusahaan
                                  </th>
                                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase">
                                    Koordinat (Lat, Lng)
                                  </th>
                                  <th className="p-3 text-[10px] font-bold text-slate-500 uppercase text-right">
                                    Aksi
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {paginatedSebaran.map((student) => (
                                  <tr
                                    key={`${student.id}-${student.name}`}
                                    className="hover:bg-slate-50/50 transition"
                                  >
                                    <td className="p-3">
                                      <p className="font-extrabold text-slate-900">
                                        {student.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-semibold font-sans">
                                        {student.batch} {student.graduationYear ? `| Lulus ${student.graduationYear}` : ""}
                                      </p>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-md text-[10px] uppercase">
                                        🇯🇵 {student.prefecture || "Tokyo"}
                                      </span>
                                      {student.city && (
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                          {student.city}
                                        </p>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <p className="font-semibold text-slate-800">
                                        {student.company || "-"}
                                      </p>
                                    </td>
                                    <td className="p-3 font-mono text-[10px] text-slate-500">
                                      {student.latitude !== undefined && student.latitude !== null &&
                                      student.longitude !== undefined && student.longitude !== null ? (
                                        <span>
                                          {Number(student.latitude).toFixed(4)},{" "}
                                          {Number(student.longitude).toFixed(4)}
                                        </span>
                                      ) : (
                                        <span className="text-slate-300 italic">
                                          Belum di-set
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsCreateMapModalOpen(true);
                                            setMapIsEditing(student.id);
                                            setMapStudentId(student.id);
                                            setMapStudentName(student.name);
                                            setMapPrefecture(
                                              student.prefecture || "Tokyo",
                                            );
                                            setMapCity(student.city || "");
                                            setMapCompany(student.company || "");
                                            setMapLatitude(
                                              student.latitude != null ? String(student.latitude) : "",
                                            );
                                            setMapLongitude(
                                              student.longitude != null ? String(student.longitude) : "",
                                            );
                                            setMapGraduationYear(student.graduationYear || "");
                                          }}
                                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition cursor-pointer"
                                        >
                                          Edit Lokasi
                                        </button>
                                        <ConfirmButton
                                          confirmTitle="Hapus Data Sebaran"
                                          confirmMessage={`Hapus data alumni ${student.name} dari sistem?`}
                                          onConfirmClick={() => onUpdateState("activeStudents", "delete", { id: student.id })}
                                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black px-2.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wide transition cursor-pointer"
                                          title="Hapus Data"
                                        >
                                          Hapus
                                        </ConfirmButton>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {allSebaranAlumni.length === 0 && (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="p-8 text-center text-slate-400 font-mono text-xs"
                                    >
                                      Belum ada data alumni di Jepang dari LPK.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
    
                          {/* Pagination Controls */}
                          {totalSebaranPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-6">
                              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-xs text-slate-600">
                                    Menampilkan <span className="font-bold text-slate-800">{((currentSebaranPage - 1) * sebaranPerPage) + 1}</span> hingga <span className="font-bold text-slate-800">{Math.min(currentSebaranPage * sebaranPerPage, allSebaranAlumni.length)}</span> dari <span className="font-bold text-slate-800">{allSebaranAlumni.length}</span> alumni
                                  </p>
                                </div>
                                <div>
                                  <nav className="isolate inline-flex -space-x-px rounded-xl shadow-2xs overflow-hidden border border-slate-200 bg-white" aria-label="Pagination">
                                    <button
                                      type="button"
                                      onClick={() => setSebaranPage(p => Math.max(1, p - 1))}
                                      disabled={currentSebaranPage === 1}
                                      className="relative inline-flex items-center px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    {Array.from({ length: totalSebaranPages }).map((_, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSebaranPage(i + 1)}
                                        className={`relative inline-flex items-center px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                                          currentSebaranPage === i + 1
                                            ? "bg-indigo-600 text-white"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        {i + 1}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => setSebaranPage(p => Math.min(totalSebaranPages, p + 1))}
                                      disabled={currentSebaranPage === totalSebaranPages}
                                      className="relative inline-flex items-center px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </nav>
                                </div>
                              </div>
    
                              {/* Mobile Pagination */}
                              <div className="flex flex-1 justify-between sm:hidden items-center">
                                <button
                                  type="button"
                                  onClick={() => setSebaranPage(p => Math.max(1, p - 1))}
                                  disabled={currentSebaranPage === 1}
                                  className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                >
                                  Sebelumnya
                                </button>
                                <span className="text-xs text-slate-600 font-bold">
                                  {currentSebaranPage} / {totalSebaranPages}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSebaranPage(p => Math.min(totalSebaranPages, p + 1))}
                                  disabled={currentSebaranPage === totalSebaranPages}
                                  className="relative inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                                >
                                  Selanjutnya
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
  );
}
