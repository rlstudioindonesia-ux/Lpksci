import React from "react";
import { Edit, Landmark, Plus, Trash2 } from "lucide-react";
import { StudentActivitySummary } from "../StudentActivitySummary";
import { ConfirmButton } from "../ConfirmButton";
import { JobScheduleConfigPanel } from "./JobScheduleConfigPanel";
import { createSvgAvatar, getSafePhotoUrl } from "../../lib/storageHelper";

interface AdminJobOrdersSegmentProps {
  expandedJobIds: any;
  onUpdateState: any;
  recoSiswaId: any;
  setEditingJobOrder: any;
  setIsCreateJobOrderModalOpen: any;
  setRecoSiswaId: any;
  systemState: any;
  toggleJobExpansion: any;
}

export default function AdminJobOrdersSegment({ expandedJobIds, onUpdateState, recoSiswaId, setEditingJobOrder, setIsCreateJobOrderModalOpen, setRecoSiswaId, systemState, toggleJobExpansion }: AdminJobOrdersSegmentProps) {
  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4.5 sm:p-6 md:p-8 rounded-3xl shadow-md space-y-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-6 w-6 text-indigo-200" />
                    <h3 className="text-lg font-black tracking-tight uppercase">
                      Manajemen Job Order & Rekomendasi Kerja Jepang
                    </h3>
                  </div>
                  <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                    Hubungkan para alumni LPK Pati yang sudah dinyatakan{" "}
                    <strong>Lulus</strong> dengan pihak agency pendamping (PT Mitra)
                    di Tokyo, Osaka, Kyoto & Prefektur Jepang lainnya. Berikan
                    rekomendasi kerja langsung secara real-time yang akan muncul
                    pada Dashboard LMS Siswa.
                  </p>
                </div>
                
                <StudentActivitySummary systemState={systemState} />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">
                      Daftar Job Order Aktif
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                      Kelola kuota, status rekrutmen, dan rekomendasikan alumni berstatus 'Lulus'.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateJobOrderModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-sm w-full sm:w-auto justify-center cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Buat Job Order Baru
                  </button>
                </div>
    
                <div className="text-left bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
                    {!systemState.jobOrders || systemState.jobOrders.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-xs border border-dashed rounded-2xl bg-slate-50">
                        Belum ada data lowongan kerja Jepang / Job Order mitra yang
                        dilaporkan.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {systemState.jobOrders.map((job) => {
                          // Filter active students available for recommendation
                          const recommendableStudents =
                            systemState.activeStudents.filter((st) => {
                              // Any status other than "Belajar" (still studying, hasn't
                              // finished the curriculum) or "Dikeluarkan" (expelled) can be
                              // recommended - this includes "Di Jepang" alumni, who were
                              // previously excluded here even though they're clearly not
                              // "Belajar". The LMS score requirement is only enforced when
                              // the student self-applies (JobsView auto-reject); an admin
                              // recommending someone here isn't blocked by score, so they
                              // can still push a student through for a special skill.
                              const isJobReady = st.status !== "Belajar" && st.status !== "Dikeluarkan";
                              if (!isJobReady) return false;
    
                              // Check if they are locked in another active job (locked if they are recommended, showed interest, or approved)
                              const lockedInOtherJob = systemState.jobOrders.some(
                                (otherJob) =>
                                  otherJob.id !== job.id &&
                                  (otherJob.recommendations?.includes(st.id) ||
                                    otherJob.interestedStudents?.includes(st.id) ||
                                    otherJob.approvedApplicants?.includes(st.id)) &&
                                  otherJob.applicantDocuments?.[st.id]?.stage !==
                                    "Ditolak",
                              );
    
                              // Check if they are already in the current job
                              const alreadyInThisJob =
                                job.recommendations?.includes(st.id) ||
                                job.interestedStudents?.includes(st.id) ||
                                job.approvedApplicants?.includes(st.id);
    
                              return !lockedInOtherJob && !alreadyInThisJob;
                            });
    
                          const isExpanded = expandedJobIds.includes(job.id);
    
                          return (
                            <div
                              key={job.id}
                              className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-200 transition space-y-4 text-left"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-205 pb-2.5">
                                <div className="space-y-0.5 text-left">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold bg-indigo-100 text-indigo-800">
                                      {job.noReg}
                                    </span>
                                    <button
                                      onClick={() => toggleJobExpansion(job.id)}
                                      className="bg-white border border-slate-200 text-slate-500 rounded p-0.5 shadow-sm active:scale-95 transition"
                                    >
                                      {isExpanded ? (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3 w-3"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      ) : (
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3 w-3"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                  <h4 className="font-extrabold text-xs text-slate-900">
                                    {job.occupation}
                                  </h4>
                                  <p className="text-[10px] text-slate-600 font-bold">
                                    {job.partnerName}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-medium">
                                    📍 {job.location}
                                  </p>
                                </div>
                                <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await onUpdateState(
                                          "jobOrders",
                                          "toggle_status",
                                          { id: job.id },
                                        );
                                      }}
                                      className={`px-2 py-1 text-[8.5px] font-black rounded-lg uppercase tracking-tight transition cursor-pointer ${
                                        job.status === "Aktif"
                                          ? "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                      }`}
                                    >
                                      ●{" "}
                                      {job.status === "Aktif"
                                        ? "Aktif / Buka"
                                        : "Tutup / Terpenuhi"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingJobOrder(job);
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition cursor-pointer border border-amber-200 text-[10px] font-bold"
                                      title="Edit Job Order"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      <span>Edit</span>
                                    </button>
                                    <ConfirmButton
                                      confirmTitle="Hapus Job Order"
                                      confirmMessage={`Hapus lowongan ${job.occupation} di ${job.partnerName}?`}
                                      onConfirmClick={() => onUpdateState("jobOrders", "delete", { id: job.id })}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer border border-rose-100 text-[10px] font-bold"
                                      title="Hapus Job Order"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Hapus</span>
                                    </ConfirmButton>
                                  </div>
                                  <span className="font-semibold text-[10px] text-blue-700 font-mono">
                                    {job.contractDuration} Kontrak
                                  </span>
                                </div>
                              </div>
    
                              {!isExpanded && (
                                <div className="text-[10px] text-slate-400 font-medium italic">
                                  Detail pekerjaan disembunyikan. Klik tombol
                                  dropdown di atas untuk melihat dan mengelola
                                  proses seleksi.
                                </div>
                              )}
    
                              {isExpanded && (
                                <>
                                  {/* Financial and Overtime Details */}
                                  <div className="grid grid-cols-3 gap-2 text-[10px] text-left">
                                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                        Gaji Pokok
                                      </span>
                                      <span className="font-black text-slate-800">
                                        {job.salary}
                                      </span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                        Lembur
                                      </span>
                                      <span className="font-semibold text-slate-750">
                                        {job.overtime || "TIDAK"}
                                      </span>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                        Tunjangan
                                      </span>
                                      <span
                                        className="font-medium text-slate-600 truncate block"
                                        title={job.allowance}
                                      >
                                        {job.allowance || "Fasilitas lengkap"}
                                      </span>
                                    </div>
                                  </div>
    
                                  {/* Demography & Recruit Target */}
                                  <div className="grid grid-cols-3 gap-2 text-[10px] text-left text-slate-700">
                                    <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                      <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide block">
                                        Gender
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.gender || "LAKI-LAKI / PEREMPUAN"}
                                      </span>
                                    </div>
                                    <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                      <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide block">
                                        Persyaratan Usia
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.ageRequirement || "18-30 tahun"}
                                      </span>
                                    </div>
                                    <div className="bg-indigo-50/50 p-2 rounded-xl border border-indigo-100/50">
                                      <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wide block">
                                        Dibutuhkan
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.recruitCount || "Belum ditentukan"}
                                      </span>
                                    </div>
                                  </div>
    
                                  {job.jobDescription && (
                                    <div className="bg-slate-100/60 p-2.5 rounded-xl border border-slate-200 text-[10px]">
                                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">
                                        Deskripsi Pekerjaan
                                      </span>
                                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                        {job.jobDescription}
                                      </p>
                                    </div>
                                  )}
    
                                  <div className="grid grid-cols-4 gap-2 text-[10px] text-left">
                                    <div className="bg-slate-100 p-2 rounded-xl">
                                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                        TB Minimal
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.tbRequirement || "-"}
                                      </span>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded-xl">
                                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                        BB Proporsional
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.bbRequirement || "-"}
                                      </span>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded-xl">
                                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                        Pelaksanaan
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.interviewExecution || "-"}
                                      </span>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded-xl">
                                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wide block">
                                        Tanggal/Bulan
                                      </span>
                                      <span className="font-bold text-slate-800">
                                        {job.interviewDate || "-"}
                                      </span>
                                    </div>
                                  </div>
    
                                  {/* Minimum Standard Competency Scores */}
                                  <div className="bg-[#f0f4f8] p-2.5 rounded-xl border border-indigo-100 text-[10.5px]">
                                    <span className="text-[8.5px] font-extrabold text-blue-800 uppercase tracking-wider block mb-1">
                                      Kriteria Komparasi Kelayakan
                                    </span>
                                    <div className="grid grid-cols-5 gap-1 text-center text-slate-700">
                                      <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                        <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                          B. JEPANG
                                        </span>
                                        <span className="font-black text-indigo-700 text-[9.5px]">
                                          {job.minJapaneseScore || "BAB 15"}
                                        </span>
                                      </div>
                                      <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                        <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                          ABSENSI
                                        </span>
                                        <span className="font-black text-indigo-700 text-[9.5px]">
                                          {job.minAttendanceScore || "80"}%
                                        </span>
                                      </div>
                                      <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                        <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                          NILAI 5S
                                        </span>
                                        <span className="font-black text-indigo-700 text-[9.5px]">
                                          {job.minFiveSScore || "80"}
                                        </span>
                                      </div>
                                      <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                        <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                          MTK SSW
                                        </span>
                                        <span className="font-black text-indigo-700 text-[9.5px]">
                                          {job.minMathScore || "90"}
                                        </span>
                                      </div>
                                      <div className="p-1 bg-white rounded-md border border-slate-200/80">
                                        <span className="text-[7.5px] font-bold text-slate-400 block uppercase">
                                          ETIKA LPK
                                        </span>
                                        <span className="font-black text-indigo-700 text-[9.5px]">
                                          {job.minEthicsScore || "80"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
    
                                  {/* Recommendation Module */}
                                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 text-left font-sans">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                      <span className="text-[9.5px] font-black uppercase text-slate-500 tracking-wide">
                                        🎓 REKOMENDASI SISWA
                                      </span>
                                      <span className="text-[9px] font-bold text-indigo-600 font-mono">
                                        {(job.recommendations || []).length}{" "}
                                        Direkomendasikan
                                      </span>
                                    </div>
    
                                    {/* Quick Add Recommendation Dropdown & Button */}
                                    <div className="flex gap-1.5">
                                      <select
                                        value={recoSiswaId[job.id] || ""}
                                        onChange={(e) =>
                                          setRecoSiswaId((prev) => ({
                                            ...prev,
                                            [job.id]: e.target.value,
                                          }))
                                        }
                                        className="text-[10px] font-bold text-slate-750 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 w-full outline-none"
                                      >
                                        <option value="">
                                          -- Pilih Siswa (Semua Status) --
                                        </option>
                                        {recommendableStudents.length === 0 ? (
                                          <option disabled value="">
                                            Tidak ada siswa tersedia (Semua
                                            terkunci)
                                          </option>
                                        ) : (
                                          recommendableStudents.map((st) => (
                                            <option key={st.id} value={st.id}>
                                              {st.name} ({st.id})
                                            </option>
                                          ))
                                        )}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const stId = recoSiswaId[job.id];
                                          if (!stId) {
                                            alert(
                                              "Silakan pilih siswa terlebih dahulu!",
                                            );
                                            return;
                                          }
                                          await onUpdateState(
                                            "jobOrders",
                                            "recommend",
                                            {
                                              jobOrderId: job.id,
                                              studentId: stId,
                                            },
                                          );
                                          // Clear selection
                                          setRecoSiswaId((prev) => ({
                                            ...prev,
                                            [job.id]: "",
                                          }));
                                        }}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-3 py-1 rounded-lg text-[9px] uppercase tracking-wide shrink-0 transition cursor-pointer"
                                      >
                                        Rekomendasikan ⚡
                                      </button>
                                    </div>
    
                                    {/* Currently Recommended Trainees List */}
                                    {!job.recommendations ||
                                    job.recommendations.length === 0 ? (
                                      <p className="text-[9px] text-slate-400 italic">
                                        Belum ada lulusan yang ditugaskan ke Job
                                        Order ini.
                                      </p>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {job.recommendations.map((stId) => {
                                          const stObj =
                                            systemState.activeStudents.find(
                                              (s) => s.id === stId,
                                            );
                                          if (!stObj) return null;
                                          return (
                                            <div
                                              key={stId}
                                              className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-900 border border-indigo-150 px-2 py-0.5 rounded-md font-sans text-[9px] font-bold"
                                            >
                                              <span>
                                                🎓 {stObj.name} ({stObj.id})
                                              </span>
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  await onUpdateState(
                                                    "jobOrders",
                                                    "remove_recommendation",
                                                    {
                                                      jobOrderId: job.id,
                                                      studentId: stId,
                                                    },
                                                  );
                                                }}
                                                className="text-rose-600 font-extrabold text-[10px] hover:text-rose-800 px-0.5 cursor-pointer ml-1"
                                                title="Batalkan rekomendasi"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      )}
                                  </div>
    
                                  {/* Global Schedule Configuration Panel */}
                                  <JobScheduleConfigPanel job={job} onUpdateState={onUpdateState} />
                                  
                                  {/* Unified Panel for Applicant Process & Schedule */}
                                  <div className="bg-white p-3 mt-1.5 rounded-xl border border-slate-200 text-left space-y-2">
                                    <h5 className="text-[10px] font-black text-indigo-800 uppercase tracking-wider flex items-center justify-between">
                                      <span>📝 Monitoring Proses & Jadwal Seleksi</span>
                                      <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                        {(job.interestedStudents || []).length} Siswa
                                      </span>
                                    </h5>
                                    {job.interestedStudents && job.interestedStudents.length > 0 ? (
                                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                        {job.interestedStudents.map((stId) => {
                                          const stData = systemState.activeStudents.find((s) => s.id === stId);
                                          if (!stData) return null;
                                          const docs = job.applicantDocuments?.[stId] || {};
                                          return (
                                            <div key={stId} className="bg-indigo-50/40 p-2.5 border border-indigo-150 rounded-lg text-[9.5px] space-y-2">
                                              <div className="flex justify-between items-center font-bold">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                    src={getSafePhotoUrl(stData.profilePicture || (stData as any).docFoto, stData.name)}
                                                    alt={stData.name}
                                                    referrerPolicy="no-referrer"
                                                    className="w-6 h-6 rounded-full object-cover border border-slate-200"
                                                    onError={(e) => {
                                                      e.currentTarget.onerror = null;
                                                      e.currentTarget.src = createSvgAvatar(stData.name || 'Siswa');
                                                    }}
                                                  />
                                                  <span className="text-slate-800">{stData.name}</span>
                                                </div>
                                                <span className="text-slate-450 font-mono text-[8px]">{stData.id} • {stData.batch}</span>
                                              </div>
                                              <div className="bg-white p-2 rounded-md border border-indigo-100 space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <label className="text-[9px] font-bold text-slate-500 w-12 shrink-0">TAHAPAN:</label>
                                                  <select
                                                    defaultValue={docs.stage || "Tertarik"}
                                                    onChange={async (e) => {
                                                      const newVal = e.target.value;
                                                      await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                        jobOrderId: job.id,
                                                        studentId: stId,
                                                        documents: { ...docs, stage: newVal },
                                                      });
                                                      if (newVal === "Lolos Akhir") {
                                                        await onUpdateState("activeStudents", "edit", {
                                                          id: stId,
                                                          status: "Di Jepang",
                                                          prefecture: job.location,
                                                          company: job.partnerName,
                                                        });
                                                      }
                                                    }}
                                                    className="flex-1 text-[9px] p-1 border border-slate-200 rounded bg-slate-50 font-bold"
                                                    style={{
                                                      color:
                                                        docs.stage === "Lolos Akhir" ? "#059669" :
                                                        docs.stage === "Lolos Interview" ? "#0d9488" :
                                                        docs.stage === "Interview" ? "#4f46e5" :
                                                        docs.stage === "Seleksi Awal" ? "#b45309" :
                                                        docs.stage === "Ditolak" ? "#e11d48" : "#475569",
                                                    }}
                                                  >
                                                    <option value="Tertarik">1. Tertarik (Berkas Diterima)</option>
                                                    <option value="Seleksi Awal">2. Lolos ke Seleksi Awal</option>
                                                    <option value="Interview">3. Sedang Interview User</option>
                                                    <option value="Lolos Interview">4. Lolos Interview (Menunggu Hasil Akhir)</option>
                                                    <option value="Lolos Akhir">5. Lolos Akhir (Matched) 🎉</option>
                                                    <option value="Ditolak">❌ Ditolak / Gagal</option>
                                                  </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <label className="text-[9px] font-bold text-slate-500 w-12 shrink-0">JADWAL:</label>
                                                  <input
                                                    type="text"
                                                    placeholder="Contoh: 15 Juli 2026 pukul 10:00 WIB"
                                                    defaultValue={docs.scheduleDate || ""}
                                                    onBlur={async (e) => {
                                                      await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                        jobOrderId: job.id,
                                                        studentId: stId,
                                                        documents: { ...docs, scheduleDate: e.target.value },
                                                      });
                                                    }}
                                                    className="flex-1 text-[9px] p-1 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                                                  />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <label className="text-[9px] font-bold text-slate-500 w-12 shrink-0">CATATAN:</label>
                                                  <input
                                                    type="text"
                                                    placeholder="Arahan / Catatan Proses..."
                                                    defaultValue={docs.notes || ""}
                                                    onBlur={async (e) => {
                                                      await onUpdateState("jobOrders", "submit_applicant_documents", {
                                                        jobOrderId: job.id,
                                                        studentId: stId,
                                                        documents: { ...docs, notes: e.target.value },
                                                      });
                                                    }}
                                                    className="flex-1 text-[9px] p-1 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-[9px] text-slate-400 italic">
                                        Belum ada siswa yang mendaftar / tertarik pada job order ini.
                                      </p>
                                      )}
                                  </div>
    
                                  {/* Panel 3: Siswa Ditolak (Riwayat) */}
                                  {(() => {
                                    const rejectedStudents = [
                                      ...(job.interestedStudents || []),
                                      ...(job.approvedApplicants || []),
                                    ].filter((stId, index, self) => {
                                      // unique student ids that are rejected
                                      if (self.indexOf(stId) !== index)
                                        return false;
                                      return (
                                        job.applicantDocuments?.[stId]?.stage ===
                                        "Ditolak"
                                      );
                                    });
    
                                    if (rejectedStudents.length === 0) return null;
    
                                    return (
                                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200 text-left space-y-2 mt-3">
                                        <h5 className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex justify-between items-center">
                                          <span>
                                            ❌ Riwayat Penolakan (Ditolak / Gagal)
                                          </span>
                                          <span className="bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-mono text-[9px]">
                                            {rejectedStudents.length}
                                          </span>
                                        </h5>
                                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                          {rejectedStudents.map((stId) => {
                                            const stData =
                                              systemState.activeStudents.find(
                                                (s) => s.id === stId,
                                              );
                                            if (!stData) return null;
                                            const notes =
                                              job.applicantDocuments?.[stId]
                                                ?.notes ||
                                              "Tidak ada catatan historis.";
    
                                            return (
                                              <div
                                                key={stId}
                                                className="bg-white p-2 border border-rose-100 rounded-lg flex flex-col gap-1 text-[10px]"
                                              >
                                                <div className="flex items-center justify-between">
                                                  <p className="font-extrabold text-slate-800">
                                                    {stData.name}
                                                  </p>
                                                  <div className="flex items-center gap-2">
                                                    <p className="text-[8px] font-mono text-slate-400">
                                                      {stData.id}
                                                    </p>
                                                    {/* Provide ability to UNDO status back to Tertarik for admin if needed */}
                                                    <ConfirmButton
                                                      type="button"
                                                      confirmTitle="Kembalikan Tahap"
                                                      confirmMessage={`Kembalikan ${stData.name} ke tahap Tertarik?`}
                                                      onConfirmClick={async () => {
                                                        await onUpdateState(
                                                          "jobOrders",
                                                          "submit_applicant_documents",
                                                          {
                                                            jobOrderId: job.id,
                                                            studentId: stId,
                                                            documents: {
                                                              ...job
                                                                .applicantDocuments?.[
                                                                stId
                                                              ],
                                                              stage: "Tertarik",
                                                            },
                                                          },
                                                        );
                                                      }}
                                                      className="text-indigo-600 hover:text-indigo-800 text-[8px] font-bold uppercase underline cursor-pointer"
                                                    >
                                                      Undo
                                                    </ConfirmButton>
                                                  </div>
                                                </div>
                                                <p className="text-rose-700 italic text-[9px] bg-rose-50 p-1.5 rounded">
                                                  {notes}
                                                </p>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
  );
}
