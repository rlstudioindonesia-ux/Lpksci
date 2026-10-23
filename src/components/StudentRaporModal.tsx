import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Activity, Clock, DollarSign, FileText, CheckCircle, Upload, X } from "lucide-react";
import { CHAPTERS_LIST } from "../chapters";
import { isGradedAssessment } from "../lib/scoreAveraging";
import { uploadFileToFirebase } from "../lib/storageHelper";

interface StudentRaporModalProps {
  student: any;
  onClose: () => void;
  systemState: any;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  getClassMaxBab?: (className: string) => number;
}

export default function StudentRaporModal({
  student,
  onClose,
  systemState,
  onUpdateState,
  getClassMaxBab = () => 25,
}: StudentRaporModalProps) {
  const [modalSubTab, setModalSubTab] = useState<"biodata" | "skills" | "evaluasi" | "rekap">("biodata");

  if (!student) return null;

  // Find corresponding registered details for biographical profile
  const matchedRS = (systemState.registeredStudents || []).find(
    (reg: any) =>
      reg.id === student.id ||
      (reg?.name && student?.name && String(reg.name).trim().toLowerCase() === String(student.name).trim().toLowerCase()) ||
      (reg?.email && student?.email && String(reg.email).trim().toLowerCase() === String(student.email).trim().toLowerCase())
  );

  const matchedReg = {
    id: matchedRS?.id || student.id,
    name: matchedRS?.name || student.name,
    status: matchedRS?.status || student.statusPendaftaran || (["Lulus", "Di Jepang"].includes(student.status) ? "Alumni" : "Siswa Aktif"),
    email: matchedRS?.email || student.email || "-",
    phone: matchedRS?.phone || student.phone || "-",
    birthDate: matchedRS?.birthDate || student.birthDate || "-",
    education: matchedRS?.education || student.education || "-",
    program: matchedRS?.program || student.class || "-",
    japaneseLevel: matchedRS?.japaneseLevel || student.japaneseLevel || "N5",
    verifiedDocs: (matchedRS?.verifiedDocs || student.verifiedDocs || []) as string[],
    docAkta: matchedRS?.docAkta || student.docAkta,
    docFoto: matchedRS?.docFoto || student.docFoto || student.profilePicture,
    docIjazahSD: matchedRS?.docIjazahSD || student.docIjazahSD,
    docIjazahSMP: matchedRS?.docIjazahSMP || student.docIjazahSMP,
    docIjazahSMA: matchedRS?.docIjazahSMA || student.docIjazahSMA,
    docKK: matchedRS?.docKK || student.docKK,
    docKTP: matchedRS?.docKTP || student.docKTP,
    docTranskip: matchedRS?.docTranskip || student.docTranskip,
  };

  const requiredDocs = [
    { label: "Akte Kelahiran Asli", val: "docAkta" },
    { label: "Pas Foto Biometrik", val: "docFoto" },
    { label: "Ijazah SD Sederajat", val: "docIjazahSD" },
    { label: "Ijazah SMP / MTs", val: "docIjazahSMP" },
    { label: "Ijazah SMA / MA / SMK", val: "docIjazahSMA" },
    { label: "Kartu Keluarga (KK)", val: "docKK" },
    { label: "Kartu Tanda Penduduk (KTP)", val: "docKTP" },
    { label: "Transkrip Nilai Akademik", val: "docTranskip" },
  ];

  // Fetch actual chapter assessments
  const actualAssessments = (systemState.chapterAssessments || []).filter(
    (ass: any) => ass.studentId === student.id
  );

  const displayAssessments =
    actualAssessments.length > 0
      ? actualAssessments.map((ass: any) => {
          const ch = CHAPTERS_LIST.find((c) => c.number === ass.chapterNumber) || {
            title: `Bab ${ass.chapterNumber} LPK`,
          };
          return {
            chapterNumber: ass.chapterNumber,
            chapterTitle: ch.title,
            score: ass.score || 0,
            status: ass.status,
            notes: ass.notes || "-",
            assessor: ass.assessedBy || "Sensei Utama",
          };
        })
      : [];

  const gradedAssessments = actualAssessments.filter(isGradedAssessment);
  const avgScore =
    gradedAssessments.length > 0
      ? gradedAssessments.reduce((sum: number, item: any) => sum + (item.score || 0), 0) / gradedAssessments.length
      : 0;

  const customSkills = {
    kaiwa: 0,
    vocabulary: student.japaneseLevel || "-",
    sectorSkills: [] as string[],
    remarks: "Belum ada tinjauan kompetensi khusus.",
  };

  const maxCh = getClassMaxBab(student.class || "");

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-hidden">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
        {/* Header Box */}
        <div className="bg-slate-900 p-6 flex items-start justify-between text-white shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[9px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                STUDENT AUDIT RAPOR
              </span>
              <span className="text-[10px] font-black bg-emerald-500 text-slate-900 px-2 rounded-full uppercase">
                Kelas {student.class || "-"}
              </span>
            </div>
            <h3 className="font-display font-black text-lg sm:text-2xl truncate">
              {student.name}
            </h3>
            <p className="text-slate-400 text-xs font-mono">
              ID Mahasiswa: {student.id} | Batch Angkatan: {student.batch || "-"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-750 text-slate-300 p-2 rounded-xl transition cursor-pointer active:scale-95"
          >
            <span className="font-black text-sm">✕ Close</span>
          </button>
        </div>

        {/* Sub-tabs Selectors */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex gap-2 overflow-x-auto shrink-0 select-none">
          {[
            { id: "biodata", label: "🗂️ Data Pribadi & Dokumen" },
            { id: "rekap", label: "📄 Rekap & Riwayat VVIP" },
            { id: "skills", label: "📊 Peta Kompetensi Skill" },
            { id: "evaluasi", label: "📓 Nilai Evaluasi Bab Kurikulum" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setModalSubTab(item.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                modalSubTab === item.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Scrollable Contents Pane */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* TAB 1: BIODATA & DOKUMEN */}
          {modalSubTab === "biodata" && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                    Informasi Kependudukan
                  </h4>
                  <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-slate-500">Tanggal Lahir:</span>
                      <span className="font-bold text-slate-900">{matchedReg.birthDate}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-slate-500">Nomor Telepon:</span>
                      <span className="font-bold text-slate-900">{matchedReg.phone}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-slate-500">Alamat E-mail:</span>
                      <span className="font-bold text-slate-900 text-right truncate max-w-[200px]" title={matchedReg.email}>
                        {matchedReg.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                    Kualifikasi Perekrutan
                  </h4>
                  <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-slate-500">Pendidikan Terakhir:</span>
                      <span className="font-bold text-slate-900">{matchedReg.education}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-slate-500">Program Penyaluran:</span>
                      <span className="font-bold text-slate-900 leading-tight text-right">{matchedReg.program}</span>
                    </div>
                    <div className="py-2.5 flex justify-between gap-2">
                      <span className="text-slate-500">Kelayakan Target Bahasa:</span>
                      <span className="font-bold text-indigo-700">{matchedReg.japaneseLevel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklists for 8 Documents */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider">
                    Verifikasi Berkas Pendataan (8 Dokumen Wajib)
                  </h4>
                  {(() => {
                    const vCount = requiredDocs.filter((d) => (matchedReg.verifiedDocs || []).includes(d.val)).length;
                    return (
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${vCount === 8 ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"}`}>
                        {vCount === 8 ? "Lengkap 8/8 Terverifikasi" : `${vCount}/8 Terverifikasi`}
                      </span>
                    );
                  })()}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {requiredDocs.map((doc, idx) => {
                    const isVerified = (matchedReg.verifiedDocs || []).includes(doc.val);
                    const rawDoc = (matchedReg as any)[doc.val] || (student as any)[doc.val] || "";
                    const hasDoc = rawDoc && !rawDoc.includes("_default.") && (rawDoc.includes("|") || rawDoc.startsWith("http") || rawDoc.startsWith("data:"));
                    const docUrl = rawDoc.includes("|") ? rawDoc.split("|")[1] : rawDoc;

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col p-3 rounded-xl border transition shadow-3xs text-xs space-y-2.5 ${
                          isVerified
                            ? "bg-emerald-50/40 border-emerald-200"
                            : hasDoc
                            ? "bg-blue-50/30 border-blue-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {isVerified ? (
                              <span className="h-5 w-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0">
                                ✓
                              </span>
                            ) : (
                              <span className="h-5 w-5 rounded bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                            )}
                            <span className="font-bold text-slate-800 truncate" title={doc.label}>
                              {doc.label}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                            isVerified
                              ? "bg-emerald-100 text-emerald-800"
                              : hasDoc
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-200 text-slate-600"
                          }`}>
                            {isVerified ? "Terverifikasi" : hasDoc ? "Tersedia" : "Belum Ada"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/50">
                          {hasDoc && (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-3xs"
                            >
                              <FileText className="h-3 w-3 text-indigo-500" />
                              <span>Buka Berkas</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              const newDocs = isVerified
                                ? (matchedReg.verifiedDocs || []).filter((d: string) => d !== doc.val)
                                : [...(matchedReg.verifiedDocs || []), doc.val];
                              
                              await onUpdateState("activeStudents", "update_status", {
                                id: student.id,
                                verifiedDocs: newDocs,
                              });

                              if (matchedRS) {
                                await onUpdateState("registeredStudents", "update", {
                                  id: matchedRS.id,
                                  verifiedDocs: newDocs,
                                });
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-3xs cursor-pointer ${
                              isVerified
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>{isVerified ? "Batal Verif" : "Verifikasi"}</span>
                          </button>

                          <label className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-3xs cursor-pointer">
                            <Upload className="h-3 w-3 text-slate-500" />
                            <span>Unggah</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const url = await uploadFileToFirebase(file, `documents/${student.id}_${doc.val}`);
                                  const docPayload = `${file.name}|${url}`;
                                  await onUpdateState("activeStudents", "update_status", {
                                    id: student.id,
                                    [doc.val]: docPayload,
                                  });
                                  if (matchedRS) {
                                    await onUpdateState("registeredStudents", "update", {
                                      id: matchedRS.id,
                                      [doc.val]: docPayload,
                                    });
                                  }
                                } catch (err: any) {
                                  alert("Gagal mengunggah berkas: " + (err.message || err));
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REKAP */}
          {modalSubTab === "rekap" && (
            <div className="space-y-6 animate-fade-in text-slate-800 text-left">
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
                <Activity className="h-5 w-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-black text-indigo-900 uppercase tracking-tight">Timeline & Rekap Aktivitas Individual</h4>
                  <p className="text-[10px] text-indigo-700/70 font-medium">Histori lengkap presensi, pembayaran, dan penilaian untuk audit.</p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Attendance Summary */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h5 className="text-[11px] font-black text-slate-900 uppercase border-b pb-2 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-blue-500" /> Riwayat Presensi
                  </h5>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {(() => {
                      const records = (systemState.attendance || []).filter(
                        (a: any) => a.studentId === student.id || a.studentName === student.name
                      );
                      if (records.length === 0) return <p className="text-[10px] text-slate-400 italic">Tidak ada data presensi.</p>;
                      return records.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-[10px]">
                          <span className="font-bold text-slate-700">{r.date}</span>
                          <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                            r.status === "Hadir" ? "bg-emerald-100 text-emerald-700" : 
                            r.status === "Alpa" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                          }`}>{r.status}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  <h5 className="text-[11px] font-black text-slate-900 uppercase border-b pb-2 flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Riwayat Keuangan
                  </h5>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {(() => {
                      const payments = (systemState.payments || []).filter((p: any) => p.studentName === student.name);
                      if (payments.length === 0) return <p className="text-[10px] text-slate-400 italic">Tidak ada data pembayaran.</p>;
                      return payments.map((p: any) => (
                        <div key={p.id} className="flex flex-col p-2.5 bg-slate-50 rounded-xl text-[10px] gap-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700">{p.category}</span>
                            <span className={`px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${
                              p.status === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>{p.status}</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                            <span>{p.date}</span>
                            <span className="font-black">Rp {p.amount.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SKILLS */}
          {modalSubTab === "skills" && (
            <div className="space-y-6 animate-fade-in text-slate-850">
              <div className="grid items-center gap-5 sm:grid-cols-2">
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-2 border border-slate-800">
                  <span className="text-[9px] font-bold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded font-mono uppercase">
                    Vocal fluency and lisan
                  </span>
                  <h5 className="font-display font-black text-3xl">
                    {customSkills.kaiwa} / 5.0
                  </h5>
                  <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                    Nilai percakapan mandiri bahasa Jepang harian (Kaiwa) di bimbingan LPK SCI.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                      Target Bahasa
                    </span>
                    <span className="font-extrabold text-xs text-slate-800 leading-tight block pt-1">
                      {customSkills.vocabulary}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-[8px] font-bold text-slate-400 block uppercase tracking-wider">
                      Kedisiplinan Indeks
                    </span>
                    <span className="font-extrabold text-xs text-emerald-600 leading-tight block pt-1">
                      96% Sangat Disiplin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVALUASI */}
          {modalSubTab === "evaluasi" && (
            <div className="space-y-6 animate-fade-in text-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-150">
                <div className="space-y-1 text-center sm:text-left select-none">
                  <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    Evaluasi Akademik Rapor LPK
                  </p>
                  <h4 className="font-display font-black text-lg text-slate-900">
                    Buku Nilai Sinkronisasi {maxCh} Bab Kurikulum
                  </h4>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white p-3 rounded-xl border text-center font-mono min-w-[100px] shadow-3xs">
                    <p className="text-[8px] text-slate-400 font-bold block uppercase leading-none pb-1.5">
                      Nilai Rerata
                    </p>
                    <p className={`text-xl font-black ${avgScore >= 90 ? "text-emerald-600" : "text-indigo-600"}`}>
                      {Math.round(avgScore)}%
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border text-center font-mono min-w-[100px] shadow-3xs">
                    <p className="text-[8px] text-slate-400 font-bold block uppercase leading-none pb-1.5">
                      Bab Tuntas
                    </p>
                    <p className="text-xl font-black text-indigo-600">
                      {displayAssessments.filter((a) => a.status === "Telah Dinilai").length} / {maxCh} Bab
                    </p>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-indigo-50 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Bab & Kurikulum Pembelajaran</th>
                      <th className="py-2.5 px-4">Penguji</th>
                      <th className="py-2.5 px-4 text-center">Skor Evaluasi</th>
                      <th className="py-2.5 px-4 text-center">Grade</th>
                      <th className="py-2.5 px-4">Saran Perbaikan (Feedback)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-705">
                    {displayAssessments.map((ass, idx) => {
                      const isExcellent = ass.score >= 90;
                      const isGood = ass.score >= 80;
                      const gradeLetter = ass.score >= 90 ? "A" : ass.score >= 80 ? "B" : "C";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 leading-snug">Bab {ass.chapterNumber}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={ass.chapterTitle}>
                              {ass.chapterTitle}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium">{ass.assessor}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-850">{ass.score}%</td>
                          <td className="py-3 px-4 text-center font-mono font-black">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              isExcellent ? "bg-emerald-50 text-emerald-700" : isGood ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                            }`}>
                              {gradeLetter}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-sans max-w-[300px] leading-relaxed">{ass.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
