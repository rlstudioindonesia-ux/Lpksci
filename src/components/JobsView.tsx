import React, { useState } from 'react';
import { Briefcase, MapPin, Building2, User } from 'lucide-react';
import { UserAccount, SystemState, JobOrder } from '../types';
import { ConfirmButton } from './ConfirmButton';
import { calculateAge } from '../lib/dateUtils';

interface JobsViewProps {
  currentUser: UserAccount | null;
  systemState: SystemState;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
}

export default function JobsView({ currentUser, systemState, onUpdateState }: JobsViewProps) {
  const [activeJobTab, setActiveJobTab] = useState<"aktif" | "pilihanku">("aktif");
  const [confirmCancelJobId, setConfirmCancelJobId] = useState<string | null>(null);
  const [jobOrderRecoSiswaId, setJobOrderRecoSiswaId] = useState<{ [jobId: string]: string }>({});

  const isAdminOrVvip = currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP";
  const isPengajar = currentUser?.role === "Pengajar";
  const graduatedStudents = systemState.activeStudents?.filter(st => st.status === "Lulus" || st.status === "On Proges Job" || st.status === "On Progres JFT/JLPT/SSW" || st.status === "Diklat SO") || [];
  const stId = currentUser?.studentId || systemState.activeStudents?.find(s => s.name === currentUser?.name)?.id || "SIS-001";

  const visibleJobs = systemState.jobOrders?.filter((job: JobOrder) => {
    const isInterested = job.interestedStudents?.includes(stId);
    const isApproved = job.approvedApplicants?.includes(stId);
    const isInMyJobs = isInterested || isApproved;
    
    if (currentUser?.role === "Siswa") {
      if (activeJobTab === "pilihanku") return isInMyJobs;
      const me = systemState.activeStudents?.find(s => s.id === stId);
      const isLulus = me?.status === "Lulus" || me?.status === "On Proges Job" || me?.status === "On Progres JFT/JLPT/SSW" || me?.status === "Diklat SO";
      const isRecommendedInThisJob = job.recommendations?.includes(stId);
      
      const isAlumni = me?.kategoriPendaftaran === "Alumni" || me?.statusPendaftaran === "Alumni";
      const allowByJobType = !isAlumni || (job.jobType === "Tokutei ginou" || job.jobType === "Gijin kouku");
      
      const canView = (isLulus || isRecommendedInThisJob) && allowByJobType;
      return (job.status === "Aktif" || isRecommendedInThisJob) && canView;
    }
    return true; // Staff/Admin/VVIP bisa lihat semua
  }) || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm h-[600px] flex flex-col">
      <div className="bg-indigo-900 p-6 text-white text-center">
        <h2 className="text-xl font-black tracking-tight uppercase flex items-center justify-center gap-2">
          <Briefcase className="h-6 w-6 text-yellow-400" />
          {currentUser?.role === "Siswa" ? (activeJobTab === "pilihanku" ? "Job Order Pilihanku" : "Job Order Aktif") : "Monitoring Seleksi Job Order"}
        </h2>
        <p className="text-slate-300 text-sm mt-2 opacity-90 max-w-2xl mx-auto">
          {currentUser?.role === "Siswa" 
            ? "Mulai perjalanan karir Anda di Jepang dengan memilih lowongan pekerjaan mitra resmi LPK."
            : "Pantau pendaftaran, minat siswa, dan rekap kandidat yang diusulkan untuk tes seleksi."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
        {currentUser?.role === "Siswa" && (
          <div className="flex gap-3 mb-6 max-w-sm mx-auto">
            <button
              onClick={() => setActiveJobTab("aktif")}
              className={`flex-1 py-3 text-xs font-black rounded-xl uppercase tracking-wider transition ${
                activeJobTab === "aktif" ? "bg-indigo-600 text-white shadow-md transform scale-105" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Semua Job Aktif
            </button>
            <button
              onClick={() => setActiveJobTab("pilihanku")}
              className={`flex-1 py-3 text-xs font-black rounded-xl uppercase tracking-wider transition relative ${
                activeJobTab === "pilihanku" ? "bg-indigo-600 text-white shadow-md transform scale-105" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              Job Pilihanku
              {systemState.jobOrders?.some((j: JobOrder) => j.interestedStudents?.includes(stId) || j.approvedApplicants?.includes(stId)) && (
                <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {visibleJobs.length === 0 ? (
            <div className="col-span-full border border-dashed border-slate-300 rounded-3xl p-12 text-center text-slate-500 bg-slate-50 italic">
              {activeJobTab === "pilihanku" 
                ? "Anda belum memilih job order yang diminati. Silakan cek menu Job Aktif." 
                : "Belum ada job order yang sesuai kategori saat ini."}
            </div>
          ) : (
            visibleJobs.map((job: JobOrder) => {
              const isInterested = job.interestedStudents?.includes(stId);
              const isApproved = job.approvedApplicants?.includes(stId);
              const myDocs = job.applicantDocuments?.[stId] || {};

              // Check if currently studying/applying/recommended in another job, and stage is NOT Ditolak
              const activeOtherJob = (systemState.jobOrders || []).find(otherJob => 
                otherJob.id !== job.id &&
                (
                  otherJob.recommendations?.includes(stId) ||
                  otherJob.interestedStudents?.includes(stId) ||
                  otherJob.approvedApplicants?.includes(stId)
                ) &&
                otherJob.applicantDocuments?.[stId]?.stage !== "Ditolak"
              );
              const isApplyingInOtherJob = !!activeOtherJob;

              return (
                <div key={job.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-left flex flex-col hover:border-indigo-200 transition">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <span className="bg-amber-100 text-amber-800 font-mono font-bold text-[10px] px-2 py-1 rounded-md">{job.id}</span>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                      job.status === "Aktif" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>{job.status}</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-extrabold text-lg text-slate-900 leading-tight">{job.occupation}</h4>
                    {job.jobType && (
                      <div className="inline-block mt-1 mb-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded border border-blue-200">
                        {job.jobType}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-1">
                      <Building2 className="h-3.5 w-3.5" /> {job.partnerName}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mt-1">
                      <MapPin className="h-3.5 w-3.5" /> Penempatan: {job.location}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                    <div>
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Gaji Pokok Kasar</span>
                      <span className="font-mono text-emerald-600 font-black">{job.salary}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Kontrak</span>
                      <span className="font-bold text-slate-800">{job.contractDuration}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Dibutuhkan</span>
                      <span className="font-bold text-slate-800">{job.recruitCount || "6 siswa"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase text-slate-400 font-bold">Usia</span>
                      <span className="font-bold text-slate-800">{job.ageRequirement || "18-30 batas"}</span>
                    </div>
                  </div>

                  {/* Dynamic Panel based on Roles */}
                  <div className="pt-4 mt-3 border-t border-slate-100">
                    {/* SISWA VIEW */}
                    {currentUser?.role === "Siswa" && (
                      isInterested || isApproved ? (
                        <div className="space-y-3">
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black text-indigo-900 uppercase">Tahapan Seleksi Anda</span>
                              <span className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase font-bold ${
                                myDocs.stage === "Ditolak" ? "bg-red-100 text-rose-800" : myDocs.stage === "Lolos Akhir" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                              }`}>
                                {myDocs.stage === "Ditolak" ? "DITOLAK ❌" : myDocs.stage === "Lolos Akhir" ? "MATCHED 🎉" : myDocs.stage === "Interview" ? "INTERVIEW" : myDocs.stage === "Seleksi Awal" ? "SELEKSI AWAL" : "TERTARIK"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 bg-white p-2 border border-slate-100 rounded-lg italic font-medium whitespace-pre-wrap">
                              {myDocs.stage === "Ditolak" 
                                ? `Mohon maaf seleksi Anda untuk job ini telah ditolak. Anda kini dibebaskan & dapat memilih job aktif lainnya.${myDocs.notes ? `\n\nAlasan: ${myDocs.notes}` : ''}` 
                                : (myDocs.notes || "Catatan seleksi masih kosong. Tunggu update dari Admin LPK SCI Pati.")
                              }
                            </div>
                            {myDocs.scheduleDate && (
                              <div className="mt-2 p-2 bg-indigo-50 border border-indigo-150 rounded-lg text-xs flex flex-col gap-0.5 text-left">
                                <span className="font-bold text-indigo-900 uppercase text-[9px] tracking-wide">
                                  📅 JADWAL PROSES JOB:
                                </span>
                                <span className="font-semibold text-slate-800 font-mono text-[10.5px]">
                                  {myDocs.scheduleDate}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {myDocs.stage === "Tertarik" && (
                            <button
                              onClick={async () => {
                                if (confirmCancelJobId !== job.id ? (setConfirmCancelJobId(job.id), false) : (setConfirmCancelJobId(null), true)) {
                                  await onUpdateState("jobOrders", "cancel_interest", { jobOrderId: job.id, studentId: stId });
                                }
                              }}
                              className={`w-full font-extrabold text-[10px] uppercase py-2.5 rounded-xl transition cursor-pointer ${
                                confirmCancelJobId === job.id
                                  ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                                  : "text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100"
                              }`}
                            >
                              {confirmCancelJobId === job.id ? "⚡ YAKIN BATAL? SENTUH SEKALI LAGI" : "Batal Daftar Job Ini"}
                            </button>
                          )}
                        </div>
                      ) : isApplyingInOtherJob ? (
                        <div className="bg-amber-50 p-3 text-center rounded-xl border border-amber-200 text-amber-700 text-[10px] font-medium leading-relaxed font-sans">
                          🔒 Akses terhalang. Anda sedang dalam proses seleksi <strong>{activeOtherJob.id}</strong>. Tunggu hingga selesai atau dibatalkan untuk memilih job ini.
                        </div>
                      ) : (
                        (() => {
                          const me = systemState.activeStudents?.find((s) => s.id === stId);
                          let isEligible = true;
                          let autoRejectNote = "";

                          let mathScore = 0;
                          let fiveSScore = 0;
                          let ethicsScore = 0;
                          let attendanceScore = 0;
                          
                          let reqMath = 0, reqFiveS = 0, reqEthics = 0, reqAttendance = 0;
                          let minTB = 0, maxTB = 0, myTB = 0;
                          let minBB = 0, maxBB = 0, myBB = 0;
                          let minAge = 0, maxAge = 0, myAge = 0;
                          let minJpn = 0, myJpn = 0;
                          let reqGender = "", myGender = "";

                          if (me && job) {
                            mathScore = me.mathScore ?? 0;
                            fiveSScore = me.fiveSScore ?? 0;
                            ethicsScore = me.ethicsScore ?? 0;
                            
                            const records = systemState.attendance.filter((r) => r.studentName === me.name || r.studentId === me.id);
                            const rateAtt = records.length > 0 ? Math.round((records.filter((r) => r.status === "Hadir").length / records.length) * 100) : 0;
                            attendanceScore = me.attendanceScore ?? rateAtt;

                            reqMath = parseInt((job.minMathScore || "90").toString().replace(/\D/g, ""));
                            reqFiveS = parseInt((job.minFiveSScore || "80").toString().replace(/\D/g, ""));
                            reqEthics = parseInt((job.minEthicsScore || "80").toString().replace(/\D/g, ""));
                            reqAttendance = parseInt((job.minAttendanceScore || "80").toString().replace(/\D/g, ""));

                            const tbMatches = job.tbRequirement?.match(/(\d+)/g);
                            if (tbMatches && tbMatches.length >= 1) { minTB = parseInt(tbMatches[0]); if (tbMatches.length >= 2) maxTB = parseInt(tbMatches[1]); }
                            myTB = me.tb || 0;
                            
                            const bbMatches = job.bbRequirement?.match(/(\d+)/g);
                            if (bbMatches && bbMatches.length >= 1) { minBB = parseInt(bbMatches[0]); if (bbMatches.length >= 2) maxBB = parseInt(bbMatches[1]); }
                            myBB = me.bb || 0;

                            const ageMatches = job.ageRequirement?.match(/(\d+)/g);
                            if (ageMatches && ageMatches.length >= 1) { minAge = parseInt(ageMatches[0]); if (ageMatches.length >= 2) maxAge = parseInt(ageMatches[1]); }
                            myAge = calculateAge(me.birthDate) ?? me.age ?? 0;

                            const jpnMatches = (job.minJapaneseScore || "BAB 15").toString().match(/(\d+)/);
                            if (jpnMatches && jpnMatches[1]) minJpn = parseInt(jpnMatches[1]);
                            myJpn = me.japaneseScore || 0;

                            reqGender = job.gender?.toUpperCase() || "";
                            myGender = me.gender?.toUpperCase() || "";

                            if (reqMath > 0 && mathScore < reqMath) {
                              isEligible = false; autoRejectNote += `MTK (${mathScore} < ${reqMath}). `;
                            }
                            if (reqFiveS > 0 && fiveSScore < reqFiveS) {
                              isEligible = false; autoRejectNote += `5S (${fiveSScore} < ${reqFiveS}). `;
                            }
                            if (reqEthics > 0 && ethicsScore < reqEthics) {
                              isEligible = false; autoRejectNote += `Etika (${ethicsScore} < ${reqEthics}). `;
                            }
                            if (reqAttendance > 0 && attendanceScore < reqAttendance) {
                              isEligible = false; autoRejectNote += `Absensi (${attendanceScore}% < ${reqAttendance}%). `;
                            }
                            if (minTB > 0 && myTB > 0 && myTB < minTB) {
                              isEligible = false; autoRejectNote += `TB (${myTB}cm < ${minTB}cm). `;
                            }
                            if (maxTB > 0 && myTB > 0 && myTB > maxTB) {
                              isEligible = false; autoRejectNote += `TB (${myTB}cm > ${maxTB}cm). `;
                            }
                            if (minBB > 0 && myBB > 0 && myBB < minBB) {
                              isEligible = false; autoRejectNote += `BB (${myBB}kg < ${minBB}kg). `;
                            }
                            if (maxBB > 0 && myBB > 0 && myBB > maxBB) {
                              isEligible = false; autoRejectNote += `BB (${myBB}kg > ${maxBB}kg). `;
                            }
                            if (minAge > 0 && myAge > 0 && myAge < minAge) {
                              isEligible = false; autoRejectNote += `Usia (${myAge}th < ${minAge}th). `;
                            }
                            if (maxAge > 0 && myAge > 0 && myAge > maxAge) {
                              isEligible = false; autoRejectNote += `Usia (${myAge}th > ${maxAge}th). `;
                            }
                            if (minJpn > 0 && myJpn > 0 && myJpn < minJpn) {
                              isEligible = false; autoRejectNote += `B.Jepang (Bab ${myJpn} < Bab ${minJpn}). `;
                            }
                            if (reqGender && reqGender !== "LAKI/PEREMPUAN" && reqGender !== "LAKI-LAKI/PEREMPUAN" && myGender) {
                              if (!reqGender.includes(myGender)) {
                                isEligible = false; autoRejectNote += `Gender (${me.gender} tdk sesuai). `;
                              }
                            }
                          }

                          return (
                            <div className="space-y-3">
                              {/* Preview Profil vs Syarat */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs mt-2 space-y-2">
                                <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">📋 Preview Profil Anda vs Syarat</h4>
                                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Nilai MTK:</span>
                                    <span className={`font-mono font-bold ${reqMath > 0 && mathScore < reqMath ? 'text-rose-600' : 'text-slate-800'}`}>{mathScore ?? '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Nilai 5S:</span>
                                    <span className={`font-mono font-bold ${reqFiveS > 0 && fiveSScore < reqFiveS ? 'text-rose-600' : 'text-slate-800'}`}>{fiveSScore ?? '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Nilai Etika:</span>
                                    <span className={`font-mono font-bold ${reqEthics > 0 && ethicsScore < reqEthics ? 'text-rose-600' : 'text-slate-800'}`}>{ethicsScore ?? '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Kehadiran:</span>
                                    <span className={`font-mono font-bold ${reqAttendance > 0 && attendanceScore < reqAttendance ? 'text-rose-600' : 'text-slate-800'}`}>{attendanceScore ?? '-'}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Tinggi Badan:</span>
                                    <span className={`font-mono font-bold ${(minTB > 0 && myTB < minTB) || (maxTB > 0 && myTB > maxTB) ? 'text-rose-600' : 'text-slate-800'}`}>{myTB || '-'} cm</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Berat Badan:</span>
                                    <span className={`font-mono font-bold ${(minBB > 0 && myBB < minBB) || (maxBB > 0 && myBB > maxBB) ? 'text-rose-600' : 'text-slate-800'}`}>{myBB || '-'} kg</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">Usia:</span>
                                    <span className={`font-mono font-bold ${(minAge > 0 && myAge < minAge) || (maxAge > 0 && myAge > maxAge) ? 'text-rose-600' : 'text-slate-800'}`}>{myAge || '-'} th</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-500">B. Jepang:</span>
                                    <span className={`font-mono font-bold ${minJpn > 0 && myJpn < minJpn ? 'text-rose-600' : 'text-slate-800'}`}>{myJpn ? `Bab ${myJpn}` : '-'}</span>
                                  </div>
                                  <div className="flex justify-between col-span-2 mt-1 pt-1 border-t border-slate-50">
                                    <span className="text-slate-500">Gender:</span>
                                    <span className={`font-bold ${reqGender && reqGender !== "LAKI/PEREMPUAN" && reqGender !== "LAKI-LAKI/PEREMPUAN" && myGender && !reqGender.includes(myGender) ? 'text-rose-600' : 'text-slate-800'}`}>{myGender || '-'}</span>
                                  </div>
                                </div>
                              </div>

                              {!isEligible && (
                                <div className="bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 text-xs mt-2">
                                  <strong>⚠️ Perhatian:</strong> Nilai & Profil Anda <strong>TIDAK MEMENUHI SYARAT MINIMAL</strong> lowongan ini.<br/>
                                  (<span className="italic">{autoRejectNote.trim()}</span>)<br/><br/>
                                  Sistem akan otomatis menolak pendaftaran Anda jika Anda mengeklik tertarik, jadikan ini motivasi untuk terus belajar!
                                </div>
                              )}
                              <button
                                onClick={async () => {
                                  const nextStage = isEligible ? "Tertarik" : "Ditolak";
                                  const nextNotes = isEligible ? "" : `Sistem: Tertolak otomatis karena ada nilai yang tidak memenuhi standar (${autoRejectNote.trim()}). Silakan tingkatkan kualitas belajar.`;

                                  await onUpdateState("jobOrders", "express_interest", { jobOrderId: job.id, studentId: stId });
                                  await onUpdateState("jobOrders", "submit_applicant_documents", { jobOrderId: job.id, studentId: stId, documents: { stage: nextStage, ...(nextNotes && { notes: nextNotes }) } });
                                  
                                  if (isEligible) {
                                    alert(`Sukses mengajukan ketertarikan!\nNama Anda dimasukkan dalam ketertarikan seleksi job ${job.id}`);
                                  } else {
                                    alert(`Mohon maaf, pendaftaran ditolak otomatis.\n\nSistem mendeteksi nilai/kehadiran Anda belum memenuhi Standar Kriteria minimal. (${autoRejectNote.trim()})\n\nTerus semangat belajar, tingkatkan nilai Anda, dan coba lagi di lowongan lain!💪`);
                                  }
                                }}
                                className="w-full py-3 bg-indigo-900 text-white font-bold text-xs uppercase tracking-wide rounded-xl transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-sm"
                                disabled={job.status !== "Aktif"}
                              >
                                Daftar / Tertarik Ikut 🚀
                              </button>
                            </div>
                          );
                        })()
                      )
                    )}

                    {/* STAFF VIEW */}
                    {(isAdminOrVvip || isPengajar) && (
                      <div className="mt-3 text-left space-y-3.5">
                        {isAdminOrVvip && (
                          <>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onUpdateState("jobOrders", "toggle_status", { id: job.id });
                                }}
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg uppercase tracking-tight transition cursor-pointer shadow-sm ${
                                  job.status === "Aktif" 
                                    ? "bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200" 
                                    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                🛠️ Ubah Menjadi {job.status === "Aktif" ? "TUTUP" : "AKTIF"}
                              </button>
                              <ConfirmButton
                                type="button"
                                confirmTitle="Hapus Job Order"
                                confirmMessage={`Hapus Job Order ${job.id} (${job.occupation})?`}
                                onConfirmClick={() => onUpdateState("jobOrders", "delete", { id: job.id })}
                                className="px-3 py-2 flex items-center gap-1.5 text-[10px] font-black rounded-lg uppercase tracking-tight transition cursor-pointer shadow-sm bg-red-600 hover:bg-red-700 text-white border border-red-700"
                              >
                                🗑️ <span>HAPUS</span>
                              </ConfirmButton>
                            </div>
                            
                            {/* Recommendation Module */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5 text-left font-sans shadow-xs mt-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-[10.5px] font-black uppercase text-slate-500 tracking-wide">🎓 REKOMENDASI LULUS</span>
                                <span className="text-[10px] font-bold text-indigo-600 font-mono">
                                  {(job.recommendations || []).length} Org
                                </span>
                              </div>

                              <div className="flex gap-1.5 pt-1">
                                <select
                                  value={jobOrderRecoSiswaId[job.id] || ""}
                                  onChange={(e) => setJobOrderRecoSiswaId(prev => ({ ...prev, [job.id]: e.target.value }))}
                                  className="text-xs font-bold text-slate-750 bg-white border border-slate-200 rounded-lg px-2 py-1.5 w-full outline-none"
                                >
                                  <option value="">-- Pilih Siswa Lulus --</option>
                                  {graduatedStudents.length === 0 ? (
                                    <option disabled value="">Tidak ada siswa Lulus</option>
                                  ) : (
                                    graduatedStudents.map(st => (
                                      <option key={st.id} value={st.id}>
                                        {st.name} ({st.id})
                                      </option>
                                    ))
                                  )}
                                </select>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const studentId = jobOrderRecoSiswaId[job.id];
                                    if (!studentId) {
                                      alert("Pilih siswa dulu!");
                                      return;
                                    }
                                    await onUpdateState("jobOrders", "recommend", {
                                      jobOrderId: job.id,
                                      studentId
                                    });
                                    setJobOrderRecoSiswaId(prev => ({ ...prev, [job.id]: "" }));
                                  }}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3 py-1 rounded-lg text-[10px] uppercase tracking-wide shrink-0 transition cursor-pointer"
                                >
                                  ADD ⚡
                                </button>
                              </div>

                              {(!job.recommendations || job.recommendations.length === 0) ? (
                                <p className="text-[10px] text-slate-400 italic">Belum ada yang direkomendasikan.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {job.recommendations.map(stId => {
                                    const stObj = systemState.activeStudents?.find(s => s.id === stId);
                                    if (!stObj) return null;
                                    return (
                                      <div key={stId} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-150 px-2.5 py-1 rounded-md font-sans text-xs font-bold">
                                        <span>{stObj.name}</span>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await onUpdateState("jobOrders", "remove_recommendation", {
                                              jobOrderId: job.id,
                                              studentId: stId
                                            });
                                          }}
                                          className="text-rose-600 font-extrabold text-xs hover:text-rose-800 cursor-pointer ml-1"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            
                            {/* Data Siswa Tertarik (Waiting ACC) */}
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-2 shadow-xs mt-2">
                              {(() => {
                                const pendingInterest = (job.interestedStudents || []).filter(stId => {
                                  const docs = job.applicantDocuments?.[stId];
                                  return docs?.stage !== "Ditolak";
                                });
                                return (
                                  <>
                                    <h5 className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
                                      <span>🎯 Siswa Tertarik (Menunggu ACC)</span>
                                      <span className="bg-indigo-900 text-white px-2 py-0.5 rounded font-mono text-[10px]">
                                        {pendingInterest.length}
                                      </span>
                                    </h5>
                                    {pendingInterest.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {pendingInterest.map(stId => {
                                          const stData = systemState.activeStudents?.find(s => s.id === stId);
                                          if (!stData) return null;
                                          return (
                                            <div key={stId} className="bg-white p-2.5 rounded-lg border border-slate-150 flex items-center justify-between gap-2 text-[10px]">
                                              <div>
                                                <p className="font-extrabold text-slate-800 text-xs leading-tight">{stData.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400 mt-0.5">{stData.id} • {stData.batch}</p>
                                              </div>
                                              <div className="flex gap-1.5">
                                                <ConfirmButton
                                                  type="button"
                                                  confirmTitle="Tolak Siswa"
                                                  confirmMessage={`Tolak siswa ${stData.name} dari seleksi ini?`}
                                                  onConfirmClick={async () => {
                                                    await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                      jobOrderId: job.id,
                                                      studentId: stId,
                                                      documents: { stage: "Ditolak", notes: "Sistem: Tertolak tahap evaluasi awal oleh Admin." }
                                                    });
                                                  }}
                                                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide cursor-pointer transition"
                                                >
                                                  Tolak ✕
                                                </ConfirmButton>
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    await onUpdateState("jobOrders", "approve_interest", {
                                                      jobOrderId: job.id,
                                                      studentId: stId
                                                    });
                                                  }}
                                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide shadow-sm cursor-pointer transition"
                                                >
                                                  ACC ✓
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[10px] text-slate-400 italic">Belum ada siswa yang tertarik dan menunggu ACC.</p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}

                        {/* Monitoring Proses Seleksi (Readonly view untuk admin, vvip, dan sensei) */}
                        <div>
                          <h5 className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-2 pt-2 flex items-center justify-between">
                            <span>📝 Monitoring Proses Seleksi</span>
                            <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-mono">{job.approvedApplicants?.length || 0}</span>
                          </h5>
                          
                          {job.approvedApplicants && job.approvedApplicants.length > 0 ? (
                            <div className="space-y-2 mt-1">
                              {job.approvedApplicants.map(stId => {
                                const stData = systemState.activeStudents?.find(s => s.id === stId);
                                if (!stData) return null;
                                const docs = job.applicantDocuments?.[stId] || {};

                                return (
                                  <div key={stId} className="bg-white p-3 border border-slate-200 rounded-xl space-y-2 shadow-xs">
                                    <div className="flex justify-between items-center font-black">
                                      <span className="text-slate-800 text-xs truncate mr-2">{stData.name}</span>
                                      <span className="text-slate-400 text-[10px] font-mono whitespace-nowrap">{stData.id}</span>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                      <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mb-2">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase sm:w-16">TAHAPAN:</span>
                                        <select
                                          value={docs.stage || "Tertarik"}
                                          onChange={async (e) => {
                                            if (isAdminOrVvip) {
                                              const newVal = e.target.value;
                                              await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                jobOrderId: job.id,
                                                studentId: stId,
                                                documents: { ...docs, stage: newVal }
                                              });
                                              if (newVal === "Lolos Akhir") {
                                                await onUpdateState("activeStudents", "edit", {
                                                  id: stId,
                                                  status: "Di Jepang",
                                                  prefecture: job.location,
                                                  company: job.partnerName
                                                });
                                              }
                                            } else {
                                              alert("Hanya Admin atau VVIP yang dapat mengedit tahap seleksi siswa.");
                                            }
                                          }}
                                          disabled={!isAdminOrVvip}
                                          className={`font-black text-[10px] px-2 py-1.5 rounded-md w-full sm:w-auto outline-none transition ${
                                            !isAdminOrVvip ? "appearance-none bg-transparent pl-0" : "bg-white border border-slate-200 cursor-pointer shadow-sm hover:border-indigo-400 focus:ring-1 focus:ring-indigo-500"
                                          } ${
                                            docs.stage === 'Lolos Akhir' ? 'text-emerald-700' : 
                                            docs.stage === 'Interview' ? 'text-indigo-700' : 
                                            docs.stage === 'Seleksi Awal' ? 'text-amber-700' : 'text-slate-700'
                                          }`}
                                        >
                                          <option value="Tertarik">1. Tertarik (Berkas Diterima)</option>
                                          <option value="Seleksi Awal">2. Seleksi Awal (Pre-Screening)</option>
                                          <option value="Interview">3. Interview User</option>
                                          <option value="Lolos Akhir">4. Lolos Akhir (Matched) 🎉</option>
                                        </select>
                                      </div>

                                      <div className="flex flex-col sm:flex-row sm:items-start gap-1.5 mt-2 pt-2 border-t border-slate-150">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase sm:w-16 mt-0.5">CATATAN:</span>
                                        <input
                                          type="text"
                                          value={docs.notes || ""}
                                          placeholder={isAdminOrVvip ? "Tulis catatan evaluasi..." : "Belum ada catatan."}
                                          disabled={!isAdminOrVvip}
                                          onChange={async (e) => {
                                            const newValue = e.target.value;
                                            e.target.dataset.val = newValue;
                                          }}
                                          onBlur={async (e) => {
                                            if (isAdminOrVvip) {
                                              const newVal = e.target.dataset.val;
                                              if (newVal !== undefined) {
                                                await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                  jobOrderId: job.id,
                                                  studentId: stId,
                                                  documents: { ...docs, notes: newVal }
                                                });
                                              }
                                            }
                                          }}
                                          className={`text-[10px] flex-1 min-w-0 outline-none w-full bg-transparent ${
                                            isAdminOrVvip ? "italic border-b border-dashed border-indigo-200 focus:border-indigo-500 py-0.5 text-indigo-900" : "italic text-slate-700"
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic mt-1">Belum ada siswa yang lulus screening (di-ACC Admin).</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
