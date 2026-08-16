import React, { useState } from "react";
import { InlineLoginPanel } from "../InlineLoginPanel";
import { CheckCircle, FileText, MessageSquare, Award } from "lucide-react";
import { SystemState, JobOrder, UserAccount } from "../../types";
import { computeJobEligibility } from "../../lib/jobEligibility";
import { isStudentAlumni } from "../../lib/alumniStatus";
import { canStudentViewJob, computeJobAccess } from "../../lib/jobAccess";
import { Briefcase, Building, MapPin, Users, Calendar, Banknote, ShieldAlert, CheckCircle2, ChevronRight, GraduationCap, Link as LinkIcon, Lock, Check } from "lucide-react";

interface MobileJobsSegmentProps {
  systemState: SystemState;
  currentUser: UserAccount | null;
  onLoginSuccess?: (user: UserAccount) => void;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  activeJobTab: "aktif" | "pilihanku";
  setActiveJobTab: (tab: "aktif" | "pilihanku") => void;
  confirmCancelJobId: string | null;
  setConfirmCancelJobId: (id: string | null) => void;
  expandedJobIds: string[];
  setExpandedJobIds: (ids: string[] | ((prev: string[]) => string[])) => void;
}

export default function MobileJobsSegment({
  systemState,
  currentUser,
  onLoginSuccess,
  onUpdateState,
  activeJobTab,
  setActiveJobTab,
  confirmCancelJobId,
  setConfirmCancelJobId,
  expandedJobIds,
  setExpandedJobIds
}: MobileJobsSegmentProps) {
  const toggleJobExpansion = (jobId: string) => {
    setExpandedJobIds((prev: any) =>
      prev.includes(jobId) ? prev.filter((id: any) => id !== jobId) : [...prev, jobId]
    );
  };
  // Helpers from main view
  const myActiveStudent = systemState?.activeStudents?.find(s => s.id === currentUser?.studentId || s.name === currentUser?.name);
  const isUserAlumni = currentUser?.role === "Alumni" || isStudentAlumni(myActiveStudent);
  const stId = currentUser?.studentId || systemState.activeStudents?.find(s => s.name === currentUser?.name)?.id || "SIS-001";
  
  return (
            <div className="p-4 space-y-4">
              {currentUser?.role === "Siswa" && (
                <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveJobTab("aktif")}
                    className={`whitespace-nowrap px-4 py-2 text-[10px] font-black rounded-lg transition-colors ${
                      activeJobTab === "aktif"
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    💼 JOB ORDER AKTIF
                  </button>
                  <button
                    onClick={() => setActiveJobTab("pilihanku")}
                    className={`whitespace-nowrap px-4 py-2 text-[10px] font-black rounded-lg transition-colors ${
                      activeJobTab === "pilihanku"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    ⭐ JOB ORDER PILIHANKU
                  </button>
                </div>
              )}

              <h3 className="font-sans font-black text-slate-900 border-b pb-2 text-md">
                {currentUser?.role === "Siswa" && activeJobTab === "pilihanku"
                  ? "Job Order Pilihanku"
                  : "Job Order Aktif - Rekomendasi Seleksi"}
              </h3>
              <p className="text-xs text-slate-500">
                {currentUser?.role === "Siswa" && activeJobTab === "pilihanku"
                  ? "Pantau perkembangan tahapan seleksi job order pilihan Anda."
                  : "Daftar lowongan kerja Tokutei Ginou (SSW) dan pemagangan Jishusei yang disponsori oleh perusahaan penerima (Kumiai) tepercaya di Jepang."}
              </p>

              {!currentUser ? (
                <InlineLoginPanel
                  title="Akses Lowongan Job"
                  requiredRole="Siswa"
                  description="Silakan login terlebih dahulu. Menu Order Job Jepang hanya terbuka untuk siswa yang telah lulus pendidikan prafasilitas."
                  onLoginSuccess={(u) => onLoginSuccess?.(u)}
                  systemState={systemState}
                />
              ) : currentUser.role === "Siswa" &&
                systemState.activeStudents?.find(
                  (s) =>
                    s.id === currentUser.studentId ||
                    s.name === currentUser.name,
                )?.status === "Di Jepang" ? (
                <div className="bg-white p-6 border border-emerald-200 rounded-3xl shadow-xs text-center space-y-3 animate-fade-in">
                  <div className="h-14 w-14 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-full mx-auto border-4 border-white shadow-sm ring-1 ring-emerald-100">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 mb-1">
                      Sudah Ditempatkan Pemagangan 🎉
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Selamat! Anda berstatus <strong>"Di Jepang"</strong> dan
                      telah sukses bekerja di perusahaan mitra kami. Menu
                      seleksi lowongan kerja ditutup karena Anda telah berhasil
                      menyelesaikan masa bimbingan LPK.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {systemState.jobOrders &&
                  systemState.jobOrders.filter((job) => {
                    const stId =
                      currentUser?.studentId ||
                      systemState.activeStudents?.find(
                        (s) => s.name === currentUser?.name,
                      )?.id ||
                      "SIS-001";
                    const isInterested = Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))?.includes(stId);
                    const isApproved = Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))?.includes(stId);
                    const isInMyJobs = isInterested || isApproved;

                    if (currentUser?.role === "Siswa") {
                      if (activeJobTab === "pilihanku") return isInMyJobs;
                      const me = systemState.activeStudents?.find((s) => s.id === stId);
                      return canStudentViewJob(me, job, isInMyJobs);
                    }
                    return true;
                  }).length > 0 ? (
                    systemState.jobOrders
                      .filter((job) => {
                        const stId =
                          currentUser?.studentId ||
                          systemState.activeStudents?.find(
                            (s) => s.name === currentUser?.name,
                          )?.id ||
                          "SIS-001";
                        const isInterested =
                          Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))?.includes(stId);
                        const isApproved =
                          Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))?.includes(stId);
                        const isInMyJobs = isInterested || isApproved;

                        if (currentUser?.role === "Siswa") {
                          if (activeJobTab === "pilihanku") return isInMyJobs;
                          const me = systemState.activeStudents?.find((s) => s.id === stId);
                          return canStudentViewJob(me, job, isInMyJobs);
                        }
                        return true;
                      })
                      .map((job) => {
                        const isRecommended = job.recommendations?.includes(
                          currentUser.studentId || "",
                        );
                        const isStudent = currentUser?.role === "Siswa";
                        const isExpanded =
                          isStudent || expandedJobIds.includes(job.id);

                        return (
                          <div
                            key={job.id}
                            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-3 relative"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="bg-yellow-100 text-yellow-800 font-mono font-bold text-[9px] px-2 py-0.5 rounded">
                                  {job.id}
                                </span>
                                {!isStudent && (
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
                                )}
                              </div>
                              <span
                                className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${
                                  job.status === "Aktif"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {job.status}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900">
                                {job.occupation}
                              </h4>
                              {job.jobType && (
                                <div className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[9px] rounded border border-blue-200">
                                  {job.jobType}
                                </div>
                              )}
                              <p className="text-[10px] text-slate-400 font-mono mt-1">
                                Lembaga Jepang: {job.partnerName}
                              </p>
                            </div>

                            {isExpanded && (
                              <>
                                <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-white p-2.5 rounded-xl border border-slate-100 font-sans">
                                  <div>
                                    <span className="block text-[8px] uppercase text-slate-400 font-bold">
                                      Lokasi Penempatan
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      🇯🇵 {job.location}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] uppercase text-slate-400 font-bold">
                                      Gaji Pokok Kasar
                                    </span>
                                    <span className="font-mono text-emerald-600 font-black">
                                      {job.salary}
                                    </span>
                                  </div>
                                </div>

                                {/* Extra info */}
                                <div className="grid grid-cols-3 gap-2 text-[10px] text-left">
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                      Lembur
                                    </span>
                                    <span className="font-black text-slate-800">
                                      {job.overtime || "TIDAK"}
                                    </span>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                      Tunjangan
                                    </span>
                                    <span className="font-black text-slate-800">
                                      {job.allowance || "Fasilitas lengkap"}
                                    </span>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block">
                                      Kontrak
                                    </span>
                                    <span className="font-black text-slate-800">
                                      {job.contractDuration}
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
                                      {job.gender || "LAKI/PEREMPUAN"}
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

                                {/* Height & Details */}
                                <div className="grid grid-cols-4 gap-2 text-[9px] text-left">
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-wide block text-[7px]">
                                      Min TB
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {job.tbRequirement || "155 cm"}
                                    </span>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-wide block text-[7px]">
                                      Min BB
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {job.bbRequirement || "50 kg"}
                                    </span>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-wide block text-[7px]">
                                      Pelaksana
                                    </span>
                                    <span
                                      className="font-bold text-slate-800 truncate"
                                      title={job.interviewExecution}
                                    >
                                      {job.interviewExecution || "Online Zoom"}
                                    </span>
                                  </div>
                                  <div className="bg-white p-2 border border-slate-100 rounded-xl">
                                    <span className="font-bold text-slate-400 uppercase tracking-wide block text-[7px]">
                                      Tanggal
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      {job.interviewDate || "Tentatif"}
                                    </span>
                                  </div>
                                </div>

                                {/* Minimum Standard Competency Scores */}
                                <div className="bg-[#f0f4f8] p-2.5 rounded-xl border border-indigo-100 text-[10px]">
                                  <span className="text-[8px] font-extrabold text-blue-800 uppercase tracking-wider block mb-1">
                                    Kriteria Komparasi Kelayakan
                                  </span>
                                  <div className="grid grid-cols-5 gap-1 text-center text-slate-700 font-sans">
                                    <div className="p-1 bg-white rounded-md border border-slate-200/85">
                                      <span className="text-[7px] font-bold text-slate-400 block uppercase font-mono">
                                        B. JPN
                                      </span>
                                      <span className="font-black text-indigo-700 text-[9px]">
                                        {job.minJapaneseScore || "BAB 15"}
                                      </span>
                                    </div>
                                    <div className="p-1 bg-white rounded-md border border-slate-200/85">
                                      <span className="text-[7px] font-bold text-slate-400 block uppercase font-mono">
                                        ABSEN
                                      </span>
                                      <span className="font-black text-indigo-700 text-[9px]">
                                        {job.minAttendanceScore || "80"}%
                                      </span>
                                    </div>
                                    <div className="p-1 bg-white rounded-md border border-slate-200/85">
                                      <span className="text-[7px] font-bold text-slate-400 block uppercase font-mono font-sans text-[6.5px]">
                                        NILAI 5S
                                      </span>
                                      <span className="font-black text-indigo-700 text-[9px]">
                                        {job.minFiveSScore || "80"}
                                      </span>
                                    </div>
                                    <div className="p-1 bg-white rounded-md border border-slate-200/85">
                                      <span className="text-[6px] font-bold text-slate-400 block uppercase font-mono font-sans text-[6.5px]">
                                        MTK SSW
                                      </span>
                                      <span className="font-black text-indigo-700 text-[9px]">
                                        {job.minMathScore || "90"}
                                      </span>
                                    </div>
                                    <div className="p-1 bg-white rounded-md border border-slate-200/85">
                                      <span className="text-[7px] font-bold text-slate-400 block uppercase font-mono">
                                        ETIKA
                                      </span>
                                      <span className="font-black text-indigo-700 text-[9px]">
                                        {job.minEthicsScore || "80"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {(() => {
                                  const stId =
                                    currentUser?.studentId ||
                                    systemState.activeStudents?.find(
                                      (s) => s.name === currentUser?.name,
                                    )?.id ||
                                    "SIS-001";
                                  const isInterested =
                                    Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))?.includes(stId);
                                  const isApproved =
                                    Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))?.includes(stId);
                                  const myDocs =
                                    job.applicantDocuments?.[stId] || {};

                                  const activeOtherJob =
                                    systemState.jobOrders?.find(
                                      (otherJob) =>
                                        otherJob.id !== job.id &&
                                        (otherJob.interestedStudents?.includes(
                                          stId,
                                        ) ||
                                          otherJob.approvedApplicants?.includes(
                                            stId,
                                          )) &&
                                        otherJob.applicantDocuments?.[stId]
                                          ?.stage !== "Ditolak",
                                    );
                                  const isApplyingInOtherJob = !!activeOtherJob;

                                  const me = systemState.activeStudents?.find(
                                    (s) => s.id === stId,
                                  );
                                  const { meetsAccessRequirement: canApply } = computeJobAccess(me, job);

                                  if (currentUser?.role === "Siswa") {
                                    return (
                                      <div className="space-y-3 pt-2">
                                        {isInterested || isApproved ? (
                                          myDocs.stage === "Ditolak" ? (
                                            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-rose-800 text-[10px]">
                                              <strong>Status: DITOLAK.</strong>{" "}
                                              Anda tidak lolos pada seleksi job
                                              ini. Anda dapat mendaftar di
                                              lowongan lain yang tersedia.
                                              {myDocs.notes && (
                                                <span className="block mt-1 italic opacity-80">
                                                  Catatan: "{myDocs.notes}"
                                                </span>
                                              )}
                                            </div>
                                          ) : (
                                            <div className="space-y-3">
                                              {/* Beautiful Progress Roadmap */}
                                              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left space-y-3 px-3">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[8px] font-black text-indigo-900 tracking-wider uppercase">
                                                    📊 PROSES SELEKSI AKTIF
                                                  </span>
                                                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-mono text-[8px] font-extrabold uppercase">
                                                    {myDocs.stage ===
                                                    "Lolos Akhir"
                                                      ? "MATCHED 🎉"
                                                      : myDocs.stage ===
                                                          "Interview"
                                                        ? "INTERVIEW"
                                                        : myDocs.stage ===
                                                            "Seleksi Awal"
                                                          ? "SELEKSI AWAL"
                                                          : "TERTARIK"}
                                                  </span>
                                                </div>

                                                {/* Standard 4-Step Visual Line */}
                                                <div className="relative flex items-center justify-between pt-1">
                                                  {/* Connector line */}
                                                  <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0">
                                                    <div
                                                      className="h-full bg-indigo-650 transition-all duration-300"
                                                      style={{
                                                        width:
                                                          myDocs.stage ===
                                                          "Lolos Akhir"
                                                            ? "100%"
                                                            : myDocs.stage ===
                                                                "Interview"
                                                              ? "66%"
                                                              : myDocs.stage ===
                                                                  "Seleksi Awal"
                                                                ? "33%"
                                                                : "0%",
                                                      }}
                                                    />
                                                  </div>

                                                  {/* Step 1: Tertarik */}
                                                  <div className="z-10 flex flex-col items-center bg-slate-50 px-1">
                                                    <div
                                                      className={`h-6.5 w-6.5 rounded-full flex items-center justify-center font-bold text-[9px] ring-2 ring-white ${
                                                        isInterested ||
                                                        isApproved
                                                          ? "bg-emerald-600 text-white"
                                                          : "bg-slate-200 text-slate-500"
                                                      }`}
                                                    >
                                                      ✓
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-900 mt-1 block">
                                                      1. Tertarik
                                                    </span>
                                                  </div>

                                                  {/* Step 2: Seleksi Awal */}
                                                  <div className="z-10 flex flex-col items-center bg-slate-50 px-1">
                                                    <div
                                                      className={`h-6.5 w-6.5 rounded-full flex items-center justify-center font-bold text-[9px] ring-2 ring-white ${
                                                        myDocs.stage ===
                                                          "Seleksi Awal" ||
                                                        myDocs.stage ===
                                                          "Interview" ||
                                                        myDocs.stage ===
                                                          "Lolos Akhir"
                                                          ? "bg-indigo-600 text-white"
                                                          : "bg-slate-200 text-slate-500"
                                                      }`}
                                                    >
                                                      {myDocs.stage ===
                                                        "Interview" ||
                                                      myDocs.stage ===
                                                        "Lolos Akhir"
                                                        ? "✓"
                                                        : "2"}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-900 mt-1 block">
                                                      2. Awal
                                                    </span>
                                                  </div>

                                                  {/* Step 3: Interview User */}
                                                  <div className="z-10 flex flex-col items-center bg-slate-50 px-1">
                                                    <div
                                                      className={`h-6.5 w-6.5 rounded-full flex items-center justify-center font-bold text-[9px] ring-2 ring-white ${
                                                        myDocs.stage ===
                                                          "Interview" ||
                                                        myDocs.stage ===
                                                          "Lolos Akhir"
                                                          ? "bg-indigo-600 text-white"
                                                          : "bg-slate-200 text-slate-500"
                                                      }`}
                                                    >
                                                      {myDocs.stage ===
                                                      "Lolos Akhir"
                                                        ? "✓"
                                                        : "3"}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-900 mt-1 block">
                                                      3. Interview
                                                    </span>
                                                  </div>

                                                  {/* Step 4: Lolos Akhir / Matched */}
                                                  <div className="z-10 flex flex-col items-center bg-slate-50 px-1">
                                                    <div
                                                      className={`h-6.5 w-6.5 rounded-full flex items-center justify-center font-bold text-[9px] ring-2 ring-white ${
                                                        myDocs.stage ===
                                                        "Lolos Akhir"
                                                          ? "bg-emerald-500 text-white animate-pulse"
                                                          : "bg-slate-200 text-slate-500"
                                                      }`}
                                                    >
                                                      🎉
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-900 mt-1 block">
                                                      4. Lolos
                                                    </span>
                                                  </div>
                                                </div>

                                                {/* Stage Comment Alert */}
                                                <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[10px] leading-relaxed mt-1 text-left">
                                                  {myDocs.stage ===
                                                  "Lolos Akhir" ? (
                                                    <div className="text-emerald-800 font-medium">
                                                      <strong>
                                                        🎉 LOLOS AKHIR
                                                        (Matched):
                                                      </strong>{" "}
                                                      Berkas kelulusan Anda
                                                      disinkronkan resmi ke
                                                      mitra kerja Jepang untuk
                                                      pengurusan COE & jadwal
                                                      penerbangan. Tunggu arahan
                                                      staff LPK.
                                                    </div>
                                                  ) : myDocs.stage ===
                                                    "Interview" ? (
                                                    <div className="text-indigo-800 font-medium">
                                                      <strong>
                                                        🔵 SELEKSI INTERVIEW
                                                        USER:
                                                      </strong>{" "}
                                                      Anda lolos berkas & masuk
                                                      interview langsung.
                                                      Siapkan Jikoshoukai
                                                      terbaik.
                                                    </div>
                                                  ) : myDocs.stage ===
                                                    "Seleksi Awal" ? (
                                                    <div className="text-amber-800 font-medium">
                                                      <strong>
                                                        🟡 SELEKSI AWAL
                                                        (Pre-Screening):
                                                      </strong>{" "}
                                                      Berkas disetujui internal,
                                                      kini sedang direview oleh
                                                      user / kumiai.
                                                    </div>
                                                  ) : (
                                                    <div className="text-slate-605 font-medium">
                                                      <strong>
                                                        🔸 STATUS: DAFTAR
                                                        SELEKSI.
                                                      </strong>{" "}
                                                      Berkas sedang ditinjau
                                                      Admin LPK untuk disortir.
                                                      Tinggal menunggu update
                                                      selanjutnya.
                                                    </div>
                                                  )}

                                                  {myDocs.scheduleDate && (
                                                    <div className="mt-1.5 p-2 bg-indigo-50 border border-indigo-150 rounded-lg text-left flex flex-col gap-0.5">
                                                      <span className="font-black text-indigo-950 uppercase text-[8px] tracking-wide">
                                                        📅 JADWAL PROSES:
                                                      </span>
                                                      <span className="font-bold text-indigo-800 text-[10px] font-mono">
                                                        {myDocs.scheduleDate}
                                                      </span>
                                                    </div>
                                                  )}

                                                  {myDocs.notes && (
                                                    <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200 text-[9px] text-slate-500 italic bg-amber-50/50 p-1.5 rounded-lg">
                                                      <strong>Info:</strong> "
                                                      {myDocs.notes}"
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Batal Button */}
                                              {myDocs.stage === "Tertarik" && (
                                                <button
                                                  onClick={async () => {
                                                    if (
                                                      confirmCancelJobId !==
                                                      job.id
                                                        ? (setConfirmCancelJobId(
                                                            job.id,
                                                          ),
                                                          false)
                                                        : (setConfirmCancelJobId(
                                                            null,
                                                          ),
                                                          true)
                                                    ) {
                                                      await onUpdateState(
                                                        "jobOrders",
                                                        "cancel_interest",
                                                        {
                                                          jobOrderId: job.id,
                                                          studentId: stId,
                                                        },
                                                      );
                                                    }
                                                  }}
                                                  className={`font-extrabold text-[9px] text-left uppercase cursor-pointer block mt-1 transition ${
                                                    confirmCancelJobId ===
                                                    job.id
                                                      ? "bg-red-650 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-md animate-pulse"
                                                      : "text-rose-600 hover:underline"
                                                  }`}
                                                >
                                                  {confirmCancelJobId === job.id
                                                    ? "⚡ YAKIN BATAL? SENTUH SEKALI LAGI"
                                                    : "Batal Tertarik ↩"}
                                                </button>
                                              )}
                                            </div>
                                          )
                                        ) : !canApply ? (
                                          <div className="bg-slate-100 p-3 text-center rounded-xl border border-slate-200 text-slate-500 text-[9.5px] font-medium leading-relaxed">
                                            ⚠️ Anda belum dapat mengikuti
                                            seleksi ini. <br />
                                            Syarat: Telah berstatus{" "}
                                            <strong>Lulus</strong> persiapan di
                                            LPK atau mendapatkan{" "}
                                            <strong>Rekomedasi</strong> langsung
                                            dari Admin LPK.
                                          </div>
                                        ) : isApplyingInOtherJob ? (
                                          <div className="bg-amber-50 p-3 text-center rounded-xl border border-amber-200 text-amber-700 text-[10px] font-medium">
                                            🔒 Akses terhalang. Anda sedang
                                            dalam proses seleksi{" "}
                                            <strong>{activeOtherJob.id}</strong>
                                            . Tunggu hingga selesai atau
                                            dibatalkan.
                                          </div>
                                        ) : (
                                          (() => {
                                            const {
                                              isEligible, autoRejectNote,
                                              mathScore, fiveSScore, ethicsScore, attendanceScore,
                                              reqMath, reqFiveS, reqEthics, reqAttendance,
                                              minTB, maxTB, myTB, minBB, maxBB, myBB,
                                              minAge, maxAge, myAge, minJpn, myJpn,
                                              reqGender, myGender,
                                            } = computeJobEligibility(me, job, systemState.attendance, systemState.chapterAssessments || []);

                                            return (
                                              <div className="space-y-3">
                                                {/* Preview Profil vs Syarat */}
                                                <div className="bg-white p-3 rounded-xl border border-slate-200 text-[9px] mt-2 space-y-2">
                                                  <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-2">
                                                    📋 Preview Profil Anda vs
                                                    Syarat
                                                  </h4>
                                                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Nilai MTK:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${reqMath > 0 && mathScore < reqMath ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {mathScore ?? "-"}
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Nilai 5S:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${reqFiveS > 0 && fiveSScore < reqFiveS ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {fiveSScore ?? "-"}
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Nilai Etika:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${reqEthics > 0 && ethicsScore < reqEthics ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {ethicsScore ?? "-"}
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Kehadiran:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${reqAttendance > 0 && attendanceScore < reqAttendance ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {attendanceScore ?? "-"}
                                                        %
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Tinggi Badan:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${(minTB > 0 && myTB < minTB) || (maxTB > 0 && myTB > maxTB) ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {myTB || "-"} cm
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Berat Badan:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${(minBB > 0 && myBB < minBB) || (maxBB > 0 && myBB > maxBB) ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {myBB || "-"} kg
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        Usia:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${(minAge > 0 && myAge < minAge) || (maxAge > 0 && myAge > maxAge) ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {myAge || "-"} th
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-slate-500">
                                                        B. Jepang:
                                                      </span>
                                                      <span
                                                        className={`font-mono font-bold ${minJpn > 0 && myJpn < minJpn ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {myJpn
                                                          ? `Bab ${myJpn}`
                                                          : "-"}
                                                      </span>
                                                    </div>
                                                    <div className="flex justify-between col-span-2 mt-1 pt-1 border-t border-slate-50">
                                                      <span className="text-slate-500">
                                                        Gender:
                                                      </span>
                                                      <span
                                                        className={`font-bold ${reqGender && reqGender !== "LAKI/PEREMPUAN" && reqGender !== "LAKI-LAKI/PEREMPUAN" && myGender && !reqGender.includes(myGender) ? "text-rose-600" : "text-slate-800"}`}
                                                      >
                                                        {myGender || "-"}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>

                                                {!isEligible && (
                                                  <div className="bg-rose-50 text-rose-800 p-2.5 rounded-xl border border-rose-200 text-[9px] mt-2 text-left">
                                                    <strong>
                                                      ⚠️ Perhatian:
                                                    </strong>{" "}
                                                    Nilai & Profil Anda{" "}
                                                    <strong>
                                                      TIDAK MEMENUHI SYARAT
                                                      MINIMAL
                                                    </strong>{" "}
                                                    lowongan ini.
                                                    <br />(
                                                    <span className="italic">
                                                      {autoRejectNote.trim()}
                                                    </span>
                                                    )<br />
                                                    <br />
                                                    Sistem akan otomatis menolak
                                                    pendaftaran Anda jika Anda
                                                    mengeklik tertarik, jadikan
                                                    ini motivasi untuk terus
                                                    belajar!
                                                  </div>
                                                )}
                                                <button
                                                  onClick={async () => {
                                                    const nextStage = isEligible
                                                      ? "Tertarik"
                                                      : "Ditolak";
                                                    const nextNotes = isEligible
                                                      ? ""
                                                      : `Sistem: Tertolak otomatis karena ada nilai yang tidak memenuhi standar (${autoRejectNote.trim()}). Silakan tingkatkan kualitas belajar.`;

                                                    await onUpdateState(
                                                      "jobOrders",
                                                      "express_interest",
                                                      {
                                                        jobOrderId: job.id,
                                                        studentId: stId,
                                                      },
                                                    );
                                                    await onUpdateState(
                                                      "jobOrders",
                                                      "submit_applicant_documents",
                                                      {
                                                        jobOrderId: job.id,
                                                        studentId: stId,
                                                        documents: {
                                                          stage: nextStage,
                                                          ...(nextNotes && {
                                                            notes: nextNotes,
                                                          }),
                                                        },
                                                      },
                                                    );

                                                    if (isEligible) {
                                                      alert(
                                                        `Sukses mengajukan ketertarikan!\nNama Anda dimasukkan dalam ketertarikan seleksi job ${job.id}`,
                                                      );
                                                    } else {
                                                      alert(
                                                        `Mohon maaf, pendaftaran ditolak otomatis.\n\nSistem mendeteksi nilai/kehadiran Anda belum memenuhi Standar Kriteria minimal. (${autoRejectNote.trim()})\n\nTerus semangat belajar, tingkatkan nilai Anda, dan coba lagi di lowongan lain!💪`,
                                                      );
                                                    }
                                                  }}
                                                  className="w-full mt-2 py-2.5 bg-indigo-900 text-white font-bold text-[10px] uppercase rounded-xl transition hover:opacity-90 disabled:bg-slate-300 disabled:text-slate-500 shadow-sm cursor-pointer"
                                                  disabled={
                                                    job.status !== "Aktif"
                                                  }
                                                >
                                                  Tertarik Ikut Seleksi Ini 🚀
                                                </button>
                                              </div>
                                            );
                                          })()
                                        )}
                                      </div>
                                    );
                                  }

                                    // Di staff sensei (Pengajar) & Admin & VVIP: HANYA untuk monitoring proses seleksi
                                    // Untuk memberikan rekomendasi, aksesnya pada menu panel administrasi proses order job.
                                    const isAdminOrVvip = false; // Disabled actions on Mobile UI for Admin & VVIP


                                    return (
                                      <div className="mt-3 pt-3 border-t border-slate-200 text-left space-y-3.5">
                                        {/* Monitoring Proses Seleksi (Readonly view untuk admin, vvip, dan sensei) */}
                                        <div className="border-t border-slate-200 pt-3">
                                          {/* Scrollable Horizontal Kanban for Mobile */}
                                        <div className="flex flex-col gap-4 items-start">
                                          {/* Main Kanban Columns */}
                                          <div className="flex-1 flex flex-col gap-3 pb-4 w-full">
                                            {/* Column: Siswa Layak Mengikuti Order Job (Sensei Only) */}
                                            {currentUser?.role === "Pengajar" && (
                                              <div className="w-full flex flex-col bg-white border border-emerald-200 rounded-xl overflow-hidden shadow-xs">
                                                <div className="bg-emerald-100/60 text-emerald-900 text-[10px] font-black text-center p-2.5 flex items-center justify-center gap-1">
                                                  <Check className="h-3 w-3" />
                                                  Siswa Layak Mengikuti Order Job
                                                </div>
                                                <div className="p-3 flex-1 min-h-[120px]">
                                                  <ul className="text-[10px] space-y-2.5 font-bold text-slate-700">
                                                    {(() => {
                                                      const myClassStudents = systemState.activeStudents?.filter(s => s.class === currentUser.assignedClass) || [];
                                                      const eligibleStudents = myClassStudents.filter(me =>
                                                        computeJobEligibility(me, job, systemState.attendance, systemState.chapterAssessments || []).isEligible
                                                      );

                                                      if (eligibleStudents.length === 0) {
                                                        return <div className="text-slate-400 text-center py-4 flex flex-col items-center justify-center h-full"><Users className="h-5 w-5 mb-2 text-slate-300" />Belum ada siswa di kelas Anda yang memenuhi syarat</div>;
                                                      }

                                                      return eligibleStudents.map((st, index) => (
                                                        <li
                                                          key={st.id}
                                                          className="flex flex-col gap-1 border-b border-emerald-50 pb-1.5 last:border-0 last:pb-0"
                                                        >
                                                          <div className="flex items-start">
                                                            <span className="w-4 tabular-nums shrink-0 text-emerald-600">
                                                              {index + 1}.
                                                            </span>
                                                            <span className="flex-1 leading-tight text-emerald-800">
                                                              {st.name}
                                                            </span>
                                                          </div>
                                                        </li>
                                                      ));
                                                    })()}
                                                  </ul>
                                                </div>
                                              </div>
                                            )}

                                            {/* Column 0: Siswa yang Direkomendasikan */}
                                            <div className="w-full flex flex-col bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs mt-4">
                                              <div className="bg-indigo-100/60 text-indigo-900 text-[10px] font-black text-center p-2.5">
                                                Siswa yang Direkomendasikan
                                              </div>
                                              <div className="p-3 flex-1 min-h-[120px]">
                                                <ul className="text-[10px] space-y-2.5 font-bold text-slate-700">
                                                  {job.recommendations && job.recommendations.length > 0 ? (
                                                    job.recommendations.map((stId, index) => {
                                                      const stData = systemState.activeStudents?.find((s) => s.id === stId);
                                                      return (
                                                        <li key={stId} className="flex flex-col gap-1 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                                                          <div className="flex items-start">
                                                            <span className="w-4 tabular-nums shrink-0">{index + 1}.</span>
                                                            <span className="flex-1 leading-tight">{stData?.name || stId}</span>
                                                          </div>
                                                        </li>
                                                      );
                                                    })
                                                  ) : (
                                                    <li className="text-[9px] text-slate-400 font-medium italic text-center py-2">Belum ada</li>
                                                  )}
                                                </ul>
                                              </div>
                                            </div>

                                            {/* Column 1: Siswa yang mengikuti job */}
                                            <div className="w-full flex flex-col bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                                              <div className="bg-blue-100/60 text-blue-900 text-[10px] font-black text-center p-2.5">
                                                Siswa yang mengikuti job
                                              </div>
                                              <div className="p-3 flex-1 min-h-[120px]">
                                                <ul className="text-[10px] space-y-2.5 font-bold text-slate-700">
                                                  {Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])) &&
                                                  Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])).filter(
                                                    (stId) =>
                                                      (job.applicantDocuments?.[
                                                        stId
                                                      ]?.stage ||
                                                        "Tertarik") ===
                                                      "Tertarik",
                                                  ).length > 0 ? (
                                                    Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))
                                                      .filter(
                                                        (stId) =>
                                                          (job
                                                            .applicantDocuments?.[
                                                            stId
                                                          ]?.stage ||
                                                            "Tertarik") ===
                                                          "Tertarik",
                                                      )
                                                      .map((stId, index) => {
                                                        const stData =
                                                          systemState.activeStudents?.find(
                                                            (s) =>
                                                              s.id === stId,
                                                          );
                                                        return (
                                                          <li
                                                            key={stId}
                                                            className="flex flex-col gap-1 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0"
                                                          >
                                                            <div className="flex items-start">
                                                              <span className="w-4 tabular-nums shrink-0">
                                                                {index + 1}.
                                                              </span>
                                                              <span className="flex-1 leading-tight">
                                                                {stData?.name ||
                                                                  stId}
                                                              </span>
                                                            </div>
                                                            {isAdminOrVvip && (
                                                              <div className="ml-4 mt-1 space-y-1 bg-slate-50 p-1.5 rounded border border-slate-150 text-[9px] text-left">
                                                                <div className="flex items-center justify-between gap-1">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase shrink-0">Tahap:</span>
                                                                  <select
                                                                    value="Tertarik"
                                                                    onChange={async (
                                                                      e,
                                                                    ) => {
                                                                      const newVal =
                                                                        e.target
                                                                          .value;
                                                                      if (
                                                                        newVal !==
                                                                        "Tertarik"
                                                                      ) {
                                                                        const docs =
                                                                          job
                                                                            .applicantDocuments?.[
                                                                            stId
                                                                          ] || {};
                                                                        await onUpdateState(
                                                                          "jobOrders",
                                                                          "submit_applicant_documents",
                                                                          {
                                                                            jobOrderId:
                                                                              job.id,
                                                                            studentId:
                                                                              stId,
                                                                            documents:
                                                                              {
                                                                                ...docs,
                                                                                stage:
                                                                                  newVal,
                                                                              },
                                                                          },
                                                                        );
                                                                        if (
                                                                          newVal ===
                                                                          "Lolos Akhir"
                                                                        ) {
                                                                          await onUpdateState(
                                                                            "activeStudents",
                                                                            "edit",
                                                                            {
                                                                              id: stId,
                                                                              status:
                                                                                "Di Jepang",
                                                                              prefecture:
                                                                                job.location,
                                                                              company:
                                                                                job.partnerName,
                                                                            },
                                                                          );
                                                                        }
                                                                      }
                                                                    }}
                                                                    className="text-[8.5px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium outline-none cursor-pointer tracking-tight"
                                                                  >
                                                                    <option value="Tertarik">
                                                                      1. Tertarik (Diikuti)
                                                                    </option>
                                                                    <option value="Seleksi Awal">
                                                                      2. Seleksi Awal
                                                                    </option>
                                                                    <option value="Interview">
                                                                      3. Interview
                                                                    </option>
                                                                    <option value="Lolos Akhir">
                                                                      4. Lolos Akhir
                                                                    </option>
                                                                    <option value="Ditolak">
                                                                      ❌ Ditolak / Gagal
                                                                    </option>
                                                                  </select>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Jadwal:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set jadwal..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.scheduleDate || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            scheduleDate: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Catatan:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set catatan..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.notes || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            notes: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                              </div>
                                                            )}
                                                          </li>
                                                        );
                                                      })
                                                  ) : (
                                                    <li className="text-[9px] text-slate-400 font-medium italic text-center py-2">
                                                      Belum ada
                                                    </li>
                                                  )}
                                                </ul>
                                              </div>
                                              <div className="p-3 bg-white mt-auto flex justify-center">
                                                <div className="bg-blue-50 p-2 rounded-full ring-4 ring-white shadow-xs">
                                                  <Users className="h-5 w-5 text-blue-500" />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Column 2: Siswa Ke Tahap Seleksi Awal */}
                                            <div className="w-full flex flex-col bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                                              <div className="bg-amber-100/60 text-amber-900 text-[10px] font-black text-center p-2.5">
                                                Siswa Ke Tahap Seleksi Awal
                                              </div>
                                              <div className="p-3 flex-1 min-h-[120px]">
                                                <ul className="text-[10px] space-y-2.5 font-bold text-slate-700">
                                                  {Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])) &&
                                                  Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])).filter(
                                                    (stId) =>
                                                      job.applicantDocuments?.[
                                                        stId
                                                      ]?.stage ===
                                                      "Seleksi Awal",
                                                  ).length > 0 ? (
                                                    Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))
                                                      .filter(
                                                        (stId) =>
                                                          job
                                                            .applicantDocuments?.[
                                                            stId
                                                          ]?.stage ===
                                                          "Seleksi Awal",
                                                      )
                                                      .map((stId, index) => {
                                                        const stData =
                                                          systemState.activeStudents?.find(
                                                            (s) =>
                                                              s.id === stId,
                                                          );
                                                        return (
                                                          <li
                                                            key={stId}
                                                            className="flex flex-col gap-1 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0"
                                                          >
                                                            <div className="flex items-start">
                                                              <span className="w-4 tabular-nums shrink-0">
                                                                {index + 1}.
                                                              </span>
                                                              <span className="flex-1 leading-tight">
                                                                {stData?.name ||
                                                                  stId}
                                                              </span>
                                                            </div>
                                                            {isAdminOrVvip && (
                                                              <div className="ml-4 mt-1 space-y-1 bg-slate-50 p-1.5 rounded border border-slate-150 text-[9px] text-left">
                                                                <div className="flex items-center justify-between gap-1">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase shrink-0">Tahap:</span>
                                                                  <select
                                                                    value="Seleksi Awal"
                                                                    onChange={async (
                                                                      e,
                                                                    ) => {
                                                                      const newVal =
                                                                        e.target
                                                                          .value;
                                                                      if (
                                                                        newVal !==
                                                                        "Seleksi Awal"
                                                                      ) {
                                                                        const docs =
                                                                          job
                                                                            .applicantDocuments?.[
                                                                            stId
                                                                          ] || {};
                                                                        await onUpdateState(
                                                                          "jobOrders",
                                                                          "submit_applicant_documents",
                                                                          {
                                                                            jobOrderId:
                                                                              job.id,
                                                                            studentId:
                                                                              stId,
                                                                            documents:
                                                                              {
                                                                                ...docs,
                                                                                stage:
                                                                                  newVal,
                                                                              },
                                                                          },
                                                                        );
                                                                        if (
                                                                          newVal ===
                                                                          "Lolos Akhir"
                                                                        ) {
                                                                          await onUpdateState(
                                                                            "activeStudents",
                                                                            "edit",
                                                                            {
                                                                              id: stId,
                                                                              status:
                                                                                "Di Jepang",
                                                                              prefecture:
                                                                                job.location,
                                                                              company:
                                                                                job.partnerName,
                                                                            },
                                                                          );
                                                                        }
                                                                      }
                                                                    }}
                                                                    className="text-[8.5px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium outline-none cursor-pointer tracking-tight"
                                                                  >
                                                                    <option value="Tertarik">
                                                                      1. Tertarik
                                                                    </option>
                                                                    <option value="Seleksi Awal">
                                                                      2. Seleksi Awal
                                                                    </option>
                                                                    <option value="Interview">
                                                                      3. Interview
                                                                    </option>
                                                                    <option value="Lolos Akhir">
                                                                      4. Lolos Akhir
                                                                    </option>
                                                                    <option value="Ditolak">
                                                                      ❌ Ditolak / Gagal
                                                                    </option>
                                                                  </select>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Jadwal:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set jadwal..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.scheduleDate || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            scheduleDate: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Catatan:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set catatan..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.notes || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            notes: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                              </div>
                                                            )}
                                                          </li>
                                                        );
                                                      })
                                                  ) : (
                                                    <li className="text-[9px] text-slate-400 font-medium italic text-center py-2">
                                                      Belum ada
                                                    </li>
                                                  )}
                                                </ul>
                                              </div>
                                              <div className="p-3 bg-white mt-auto flex justify-center">
                                                <div className="bg-amber-50 p-2 rounded-full ring-4 ring-white shadow-xs">
                                                  <FileText className="h-5 w-5 text-amber-500" />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Column 3: Siswa Ke Tahap Interview */}
                                            <div className="w-full flex flex-col bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                                              <div className="bg-orange-100/60 text-orange-900 text-[10px] font-black text-center p-2.5">
                                                Siswa Ke Tahap
                                                Interview/Mensetsu
                                              </div>
                                              <div className="p-3 flex-1 min-h-[120px]">
                                                <ul className="text-[10px] space-y-2.5 font-bold text-slate-700">
                                                  {Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])) &&
                                                  Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])).filter(
                                                    (stId) =>
                                                      job.applicantDocuments?.[
                                                        stId
                                                      ]?.stage === "Interview",
                                                  ).length > 0 ? (
                                                    Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))
                                                      .filter(
                                                        (stId) =>
                                                          job
                                                            .applicantDocuments?.[
                                                            stId
                                                          ]?.stage ===
                                                          "Interview",
                                                      )
                                                      .map((stId, index) => {
                                                        const stData =
                                                          systemState.activeStudents?.find(
                                                            (s) =>
                                                              s.id === stId,
                                                          );
                                                        return (
                                                          <li
                                                            key={stId}
                                                            className="flex flex-col gap-1 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0"
                                                          >
                                                            <div className="flex items-start">
                                                              <span className="w-4 tabular-nums shrink-0">
                                                                {index + 1}.
                                                              </span>
                                                              <span className="flex-1 leading-tight">
                                                                {stData?.name ||
                                                                  stId}
                                                              </span>
                                                            </div>
                                                            {isAdminOrVvip && (
                                                              <div className="ml-4 mt-1 space-y-1 bg-slate-50 p-1.5 rounded border border-slate-150 text-[9px] text-left">
                                                                <div className="flex items-center justify-between gap-1">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase shrink-0">Tahap:</span>
                                                                  <select
                                                                    value="Interview"
                                                                    onChange={async (
                                                                      e,
                                                                    ) => {
                                                                      const newVal =
                                                                        e.target
                                                                          .value;
                                                                      if (
                                                                        newVal !==
                                                                        "Interview"
                                                                      ) {
                                                                        const docs =
                                                                          job
                                                                            .applicantDocuments?.[
                                                                            stId
                                                                          ] || {};
                                                                        await onUpdateState(
                                                                          "jobOrders",
                                                                          "submit_applicant_documents",
                                                                          {
                                                                            jobOrderId:
                                                                              job.id,
                                                                            studentId:
                                                                              stId,
                                                                            documents:
                                                                              {
                                                                                ...docs,
                                                                                stage:
                                                                                  newVal,
                                                                              },
                                                                          },
                                                                        );
                                                                        if (
                                                                          newVal ===
                                                                          "Lolos Akhir"
                                                                        ) {
                                                                          await onUpdateState(
                                                                            "activeStudents",
                                                                            "edit",
                                                                            {
                                                                              id: stId,
                                                                              status:
                                                                                "Di Jepang",
                                                                              prefecture:
                                                                                job.location,
                                                                              company:
                                                                                job.partnerName,
                                                                            },
                                                                          );
                                                                        }
                                                                      }
                                                                    }}
                                                                    className="text-[8.5px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium outline-none cursor-pointer tracking-tight"
                                                                  >
                                                                    <option value="Tertarik">
                                                                      1. Tertarik
                                                                    </option>
                                                                    <option value="Seleksi Awal">
                                                                      2. Seleksi Awal
                                                                    </option>
                                                                    <option value="Interview">
                                                                      3. Interview
                                                                    </option>
                                                                    <option value="Lolos Akhir">
                                                                      4. Lolos Akhir
                                                                    </option>
                                                                    <option value="Ditolak">
                                                                      ❌ Ditolak / Gagal
                                                                    </option>
                                                                  </select>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Jadwal:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set jadwal..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.scheduleDate || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            scheduleDate: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Catatan:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set catatan..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.notes || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            notes: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                              </div>
                                                            )}
                                                          </li>
                                                        );
                                                      })
                                                  ) : (
                                                    <li className="text-[9px] text-slate-400 font-medium italic text-center py-2">
                                                      Belum ada
                                                    </li>
                                                  )}
                                                </ul>
                                              </div>
                                              <div className="p-3 bg-white mt-auto flex justify-center">
                                                <div className="bg-orange-50 p-2 rounded-full ring-4 ring-white shadow-xs">
                                                  <MessageSquare className="h-5 w-5 text-orange-500" />
                                                </div>
                                              </div>
                                            </div>

                                            {/* Column 3: LOLOS INTERVIEW */}
                                            <div className="w-full flex flex-col bg-white border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                                              <div className="bg-emerald-100/60 text-emerald-900 text-[10px] font-black text-center p-2.5">
                                                LOLOS INTERVIEW
                                              </div>
                                              <div className="p-3 flex-1 min-h-[120px]">
                                                <ul className="text-[10px] space-y-2.5 font-bold text-slate-700">
                                                  {Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])) &&
                                                  Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])])).filter(
                                                    (stId) =>
                                                      job.applicantDocuments?.[
                                                        stId
                                                      ]?.stage ===
                                                      "Lolos Akhir",
                                                  ).length > 0 ? (
                                                    Array.from(new Set([...(job.interestedStudents || []), ...(job.approvedApplicants || [])]))
                                                      .filter(
                                                        (stId) =>
                                                          job
                                                            .applicantDocuments?.[
                                                            stId
                                                          ]?.stage ===
                                                          "Lolos Akhir",
                                                      )
                                                      .map((stId, index) => {
                                                        const stData =
                                                          systemState.activeStudents?.find(
                                                            (s) =>
                                                              s.id === stId,
                                                          );
                                                        return (
                                                          <li
                                                            key={stId}
                                                            className="flex flex-col gap-1 border-b border-slate-50 pb-1.5 last:border-0 last:pb-0"
                                                          >
                                                            <div className="flex items-start">
                                                              <span className="w-4 tabular-nums shrink-0">
                                                                {index + 1}.
                                                              </span>
                                                              <span className="flex-1 leading-tight">
                                                                {stData?.name ||
                                                                  stId}
                                                              </span>
                                                            </div>
                                                            {isAdminOrVvip && (
                                                              <div className="ml-4 mt-1 space-y-1 bg-slate-50 p-1.5 rounded border border-slate-150 text-[9px] text-left">
                                                                <div className="flex items-center justify-between gap-1">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase shrink-0">Tahap:</span>
                                                                  <select
                                                                    value="Lolos Akhir"
                                                                    onChange={async (
                                                                      e,
                                                                    ) => {
                                                                      const newVal =
                                                                        e.target
                                                                          .value;
                                                                      if (
                                                                        newVal !==
                                                                        "Lolos Akhir"
                                                                      ) {
                                                                        const docs =
                                                                          job
                                                                            .applicantDocuments?.[
                                                                            stId
                                                                          ] || {};
                                                                        await onUpdateState(
                                                                          "jobOrders",
                                                                          "submit_applicant_documents",
                                                                          {
                                                                            jobOrderId:
                                                                              job.id,
                                                                            studentId:
                                                                              stId,
                                                                            documents:
                                                                              {
                                                                                ...docs,
                                                                                stage:
                                                                                  newVal,
                                                                              },
                                                                          },
                                                                        );
                                                                      }
                                                                    }}
                                                                    className="text-[8.5px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium outline-none cursor-pointer tracking-tight"
                                                                  >
                                                                    <option value="Tertarik">
                                                                      1. Tertarik
                                                                    </option>
                                                                    <option value="Seleksi Awal">
                                                                      2. Seleksi Awal
                                                                    </option>
                                                                    <option value="Interview">
                                                                      3. Interview
                                                                    </option>
                                                                    <option value="Lolos Akhir">
                                                                      4. Lolos Akhir
                                                                    </option>
                                                                    <option value="Ditolak">
                                                                      ❌ Ditolak / Gagal
                                                                    </option>
                                                                  </select>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Jadwal:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set jadwal..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.scheduleDate || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            scheduleDate: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                  <span className="text-[8px] font-black text-slate-500 uppercase w-10 shrink-0 text-left">Catatan:</span>
                                                                  <input
                                                                    type="text"
                                                                    placeholder="Set catatan..."
                                                                    defaultValue={job.applicantDocuments?.[stId]?.notes || ""}
                                                                    onBlur={async (e) => {
                                                                      const docs = job.applicantDocuments?.[stId] || {};
                                                                      await onUpdateState(
                                                                        "jobOrders",
                                                                        "submit_applicant_documents",
                                                                        {
                                                                          jobOrderId: job.id,
                                                                          studentId: stId,
                                                                          documents: {
                                                                            ...docs,
                                                                            notes: e.target.value,
                                                                          },
                                                                        },
                                                                      );
                                                                    }}
                                                                    className="w-full text-[8.5px] p-0.5 border border-slate-200 rounded font-semibold text-slate-800 focus:border-indigo-500 outline-none bg-white text-left"
                                                                  />
                                                                </div>
                                                              </div>
                                                            )}
                                                          </li>
                                                        );
                                                      })
                                                  ) : (
                                                    <li className="text-[9px] text-slate-400 font-medium italic text-center py-2">
                                                      Belum ada
                                                    </li>
                                                  )}
                                                </ul>
                                              </div>
                                              <div className="p-3 bg-white mt-auto flex justify-center">
                                                <div className="bg-emerald-50 text-emerald-500 p-2 rounded-full ring-4 ring-white shadow-xs">
                                                  <Award className="h-5 w-5" />
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Side Panel: JADWAL PROSES */}
                                          <div className="shrink-0 w-full sm:w-[220px] bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col font-sans mb-1 mt-1 xl:mt-0 xl:mb-0 pb-5">
                                            <h6 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                              JADWAL PROSES
                                            </h6>
                                            <div className="mt-4 relative pl-3.5 space-y-4 before:content-[''] before:absolute before:left-[5.5px] before:top-1.5 before:bottom-1 border-l-2 border-slate-200">
                                              <div className="relative">
                                                <div className="absolute -left-[14.5px] top-[1.5px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-50"></div>
                                                <div className="pl-1">
                                                  <div className="text-[9px] font-extrabold text-slate-800">
                                                    Pendaftaran
                                                  </div>
                                                  <div className="text-[8.5px] font-bold text-blue-600 mt-0.5">
                                                    {job.scheduleRegistration || "TBA"}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="relative">
                                                <div className="absolute -left-[14.5px] top-[1.5px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-50"></div>
                                                <div className="pl-1">
                                                  <div className="text-[9px] font-extrabold text-slate-800">
                                                    Seleksi Dokumen
                                                  </div>
                                                  <div className="text-[8.5px] font-bold text-blue-600 mt-0.5">
                                                    {job.scheduleDocumentSelection || "TBA"}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="relative">
                                                <div className="absolute -left-[14.5px] top-[1.5px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-50"></div>
                                                <div className="pl-1">
                                                  <div className="text-[9px] font-extrabold text-slate-800">
                                                    Interview / Mensetsu
                                                  </div>
                                                  <div className="text-[8.5px] font-bold text-blue-600 mt-0.5">
                                                    {job.interviewDate || "TBA"}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="relative">
                                                <div className="absolute -left-[14.5px] top-[1.5px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-50"></div>
                                                <div className="pl-1">
                                                  <div className="text-[9px] font-extrabold text-slate-800">
                                                    Pengumuman Kelulusan
                                                  </div>
                                                  <div className="text-[8.5px] font-bold text-blue-600 mt-0.5">
                                                    {job.scheduleAnnouncement || "TBA"}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="relative">
                                                <div className="absolute -left-[14.5px] top-[1.5px] h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-slate-50"></div>
                                                <div className="pl-1">
                                                  <div className="text-[9px] font-extrabold text-slate-800">
                                                    Medical Check Up
                                                  </div>
                                                  <div className="text-[8.5px] font-bold text-blue-600 mt-0.5">
                                                    {job.scheduleMcu || "TBA"}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        );
                      })
                  ) : (
                    <div className="space-y-3 pt-4 text-center">
                      <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-slate-400">
                        {currentUser?.role === "Siswa" &&
                        activeJobTab === "pilihanku"
                          ? "Belum ada job order pilihan yang Anda tandai tertarik atau Anda ikuti seleksinya."
                          : "Belum ada job order aktif."}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
  );
}
