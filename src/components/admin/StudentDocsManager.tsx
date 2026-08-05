import { Upload } from 'lucide-react';
import { SystemState, UserAccount } from '../../types';
import React from 'react';
import { uploadFileToFirebase } from '../../lib/storageHelper';
import { RegisteredStudent } from '../../types';
import { CheckCircle2, AlertCircle, Trash2, Loader2, X, Eye } from 'lucide-react';

const ADMIN_DOCUMENT_FIELDS = [
  { field: "docKTP", label: "KTP", color: "blue", type: "PDF" },
  { field: "docKK", label: "KK", color: "blue", type: "PDF" },
  { field: "docAkta", label: "Akta Lahir", color: "blue", type: "PDF" },
  { field: "docIjazahSD", label: "Ijazah SD", color: "blue", type: "PDF" },
  { field: "docIjazahSMP", label: "Ijazah SMP", color: "blue", type: "PDF" },
  { field: "docIjazahSMA", label: "Ijazah SMA/SMK", color: "blue", type: "PDF" },
  { field: "docTranskip", label: "Transkrip Nilai", color: "purple", type: "PDF" },
  { field: "docFoto", label: "Pasfoto Merah", color: "emerald", type: "JPG" },
  { field: "docPraMCU", label: "Pra MCU", color: "rose", type: "MED" },
  { field: "docVaksin", label: "Vaksin Booster", color: "rose", type: "MED" },
  { field: "docCV1", label: "CV Bagian 1", color: "amber", type: "CV" },
  { field: "docCV2", label: "CV Bagian 2", color: "amber", type: "CV" },
  { field: "docCV3", label: "CV Bagian 3", color: "amber", type: "CV" },
  { field: "docCV4", label: "CV Bagian 4", color: "amber", type: "CV" },
  { field: "docCV5", label: "CV Bagian 5", color: "amber", type: "CV" },
  { field: "docMoU", label: "MoU Persetujuan", color: "slate", type: "MoU" },
  { field: "docKontrak", label: "Kontrak Kerja (JOB)", color: "indigo", type: "JOB" },
];

export function StudentDocsManager({
  student,
  onUpdateState,
  onViewDoc,
}: {
  student: RegisteredStudent;
  onUpdateState: (
    dataType: string,
    action: string,
    payload: any,
  ) => Promise<boolean>;
  onViewDoc?: (docUrl: string, title?: string) => void;
}) {
  const [editMode, setEditMode] = React.useState(false);
  const [uploadingFields, setUploadingFields] = React.useState<Record<string, boolean>>({});

  return (
    <div className="w-full mt-3 animate-fade-in">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="font-bold text-slate-700 text-sm">Dokumen Pendaftaran & Akademik</h3>
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${editMode ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          {editMode ? "Selesai Edit" : "Edit Berkas"}
        </button>
      </div>
      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-[11px] font-sans relative shadow-inner text-left w-full">
        {ADMIN_DOCUMENT_FIELDS.map((doc, idx) => {
          const rawVal = (student as any)[doc.field] || "";
          const currentVal = rawVal && !rawVal.includes("_default.") ? rawVal : "";
          let displayVal = "";
          let dataVal = "";
          let hasValidFile = false;

          if (currentVal) {
            if (currentVal.includes("|")) {
              const parts = currentVal.split("|");
              displayVal = parts[0];
              dataVal = parts[1];
            } else if (currentVal.startsWith("http") || currentVal.startsWith("data:")) {
              dataVal = currentVal;
              displayVal = "Berkas Terlampir";
            } else {
              displayVal = currentVal;
            }

            if (dataVal && (dataVal.startsWith("http") || dataVal.startsWith("data:"))) {
              hasValidFile = true;
            }
          }

          if (!hasValidFile) {
            displayVal = "";
          }

          const badgeBg =
            doc.color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" :
            doc.color === "emerald" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
            doc.color === "rose" ? "bg-rose-50 text-rose-700 border-rose-200" :
            doc.color === "purple" ? "bg-purple-50 text-purple-700 border-purple-200" :
            doc.color === "amber" ? "bg-amber-50 text-amber-700 border-amber-200" :
            "bg-slate-100 text-slate-700 border-slate-200";

          const isVerified = (student.verifiedDocs || []).includes(doc.field);

          return (
            <div
              key={doc.field}
              className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-3 hover:border-indigo-300 hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border shrink-0">
                    #{idx + 1}
                  </span>
                  <span className={`text-[10px] font-mono font-black px-2 py-1 rounded border shrink-0 leading-none uppercase ${badgeBg}`}>
                    {doc.type}
                  </span>
                  <span className={`text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md font-mono shrink-0 ${isVerified ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-amber-700 bg-amber-50 border border-amber-100'}`}>
                    {isVerified ? "✓ VERIFIED" : "⚠ UNVERIFIED"}
                  </span>
                  <span className="font-bold text-slate-800 text-sm truncate flex-1" title={doc.label}>
                    {doc.label}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-50/70 px-3 py-2 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-600 my-1 min-h-[44px]">
                {displayVal ? (
                  <>
                    <span className="shrink-0 text-slate-400 mt-0.5">📄</span>
                    <span className="break-all font-semibold text-slate-700" title={displayVal}>
                      {displayVal}
                    </span>
                  </>
                ) : null}
              </div>

            <div className="flex items-center gap-2 border-t border-slate-100 pt-2.5 mt-1">
              {editMode ? (
                <>
                  <label className={`flex-1 ${uploadingFields[doc.field] ? "opacity-60 pointer-events-none" : ""} bg-slate-50 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 border border-slate-200 hover:border-indigo-300 px-2 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition text-center flex items-center justify-center gap-1.5`}>
                    {uploadingFields[doc.field] ? (
                      <>
                        <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                        <span>Mengunggah...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 shrink-0" />
                        <span>{hasValidFile ? "Ganti" : "Unggah"}</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingFields[doc.field]}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingFields((prev) => ({ ...prev, [doc.field]: true }));
                        try {
                          const downloadUrl = await uploadFileToFirebase(file, "registrations");
                          const updated = {
                            ...student,
                            [doc.field]: `${file.name}|${downloadUrl}`,
                          };
                          await onUpdateState("registeredStudents", "update", updated);
                        } catch (err: any) {
                          console.error(err);
                          alert(`Gagal mengunggah berkas: ${err.message || err}`);
                        } finally {
                          setUploadingFields((prev) => ({ ...prev, [doc.field]: false }));
                        }
                      }}
                    />
                  </label>

                  {hasValidFile && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          const currentVerified = student.verifiedDocs || [];
                          const newVerified = currentVerified.includes(doc.field)
                            ? currentVerified.filter(v => v !== doc.field)
                            : [...currentVerified, doc.field];
                          await onUpdateState("registeredStudents", "update", {
                            ...student,
                            verifiedDocs: newVerified,
                          });
                        }}
                        className={`p-1 px-2 text-[10px] font-extrabold rounded-lg border transition flex items-center gap-1.5 ${
                          isVerified
                            ? "text-amber-600 border-amber-200 hover:bg-amber-55"
                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-55"
                        }`}
                      >
                        {isVerified ? "Batal Verifikasi" : "Verifikasi"}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = {
                            ...student,
                            [doc.field]: "",
                          };
                          await onUpdateState("registeredStudents", "update", updated);
                        }}
                        className="p-1 px-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition font-extrabold text-[10px] flex items-center gap-1.5"
                        title="Hapus Berkas"
                      >
                        <Trash2 className="h-3 w-3 shrink-0" />
                        <span>Hapus</span>
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {hasValidFile ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => onViewDoc && onViewDoc(dataVal, doc.label)}
                        className="flex-1 p-1 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200 transition font-extrabold text-[10px] flex items-center justify-center gap-1.5"
                        title="Lihat Berkas"
                      >
                        <Eye className="h-3 w-3 shrink-0" />
                        <span>Lihat</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const currentVerified = student.verifiedDocs || [];
                          const newVerified = currentVerified.includes(doc.field)
                            ? currentVerified.filter(v => v !== doc.field)
                            : [...currentVerified, doc.field];
                          await onUpdateState("registeredStudents", "update", {
                            ...student,
                            verifiedDocs: newVerified,
                          });
                        }}
                        className={`flex-1 p-1 px-2 text-[10px] font-extrabold rounded-lg border transition flex items-center justify-center gap-1 ${
                          isVerified
                            ? "text-amber-600 border-amber-200 hover:bg-amber-55"
                            : "text-emerald-600 border-emerald-200 hover:bg-emerald-55"
                        }`}
                      >
                        <span>{isVerified ? "Batal" : "Verifikasi"}</span>
                      </button>
                    </div>
                    </div>
                  ) : (
                    <div className="flex-1 p-1 px-2.5 text-slate-400 bg-slate-50 rounded-lg border border-slate-200 text-center font-bold text-[10px]">
                      Belum Diunggah
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

interface AdminViewProps {
  systemState: SystemState;
  currentUser?: UserAccount | null;
  onUpdateState: (
    dataType: string,
    action: string,
    payload: any,
  ) => Promise<boolean>;
  initialSegment?:
    | "siswa"
    | "pembayaran"
    | "inventaris"
    | "pajak"
    | "kustomisasi"
    | "galeri"
    | "joborders"
    | "petasebaran"
    | "informasi"
    | "afiliasi"
    | "kalender"
    | "dataCV"
    | "gaji"
    | "kelas"
    | "manajemen";
}

interface JobScheduleConfigPanelProps {
  job: any;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
}

