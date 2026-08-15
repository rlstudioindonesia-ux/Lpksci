import React, { useState } from "react";
import { Activity, ChevronDown, ChevronUp, Clock } from "lucide-react";

const STAGE_STYLES: Record<string, string> = {
  "Tertarik": "bg-slate-100 text-slate-600 border-slate-200",
  "Seleksi Awal": "bg-amber-50 text-amber-700 border-amber-200",
  "Interview": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Lolos Interview": "bg-teal-50 text-teal-700 border-teal-200",
  "Lolos Akhir": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Ditolak": "bg-rose-50 text-rose-700 border-rose-200",
  "Direkomendasikan": "bg-slate-100 text-slate-600 border-slate-200",
  "Disetujui": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Tertarik (Menunggu ACC)": "bg-amber-50 text-amber-700 border-amber-200",
};

export const StudentActivitySummary = ({ systemState }: { systemState: any }) => {
  const users = systemState?.users || [];
  const activeStudents = systemState?.activeStudents || [];
  const jobOrders = systemState?.jobOrders || [];

  // Persist collapse state in localStorage so the preference is remembered
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("student_recap_collapsed");
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    try {
      localStorage.setItem("student_recap_collapsed", JSON.stringify(nextVal));
    } catch (e) {
      console.error(e);
    }
  };

  // This recap tracks Job Order progress, so it only makes sense for students
  // who have actually finished studying - "Belajar" students aren't in the
  // job pipeline yet, and "Dikeluarkan" (expelled) students never will be.
  // Staff accounts (Pengajar/Admin/VVIP) are excluded too since they aren't
  // students at all.
  const filteredStudents = activeStudents.filter((st: any) => {
    if (st.status === "Belajar" || st.status === "Dikeluarkan") return false;
    const matchedUser = users.find((u: any) =>
      u.studentId === st.id ||
      (u.name && st.name && u.name.trim().toLowerCase() === st.name.trim().toLowerCase())
    );
    if (matchedUser) {
      const role = matchedUser.role;
      if (role === "Pengajar" || role === "Admin" || role === "Admin Super" || role === "Admin Biasa" || role === "VVIP") {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mt-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-500 animate-pulse" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <h4 className="font-bold text-slate-800 text-sm">Rekap Aktivitas & Progres Siswa</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/50 w-fit">
              {filteredStudents.length} Siswa Non-Belajar
            </span>
          </div>
        </div>
        <button
          onClick={toggleCollapse}
          className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0"
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>Tampilkan</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Sembunyikan</span>
            </>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
          Daftar siswa yang sudah lulus tahap belajar (alumni & yang sedang berproses Job Order), lengkap dengan tahapan seleksi dan jadwal terdekat yang diinput di Job Order.
        </p>
      )}

      {!isCollapsed && (
        <div className="space-y-2.5">
          {filteredStudents.length === 0 && (
            <p className="p-6 text-center text-slate-400 italic text-xs border border-dashed border-slate-200 rounded-2xl">
              Belum ada siswa di luar status Belajar.
            </p>
          )}
          {filteredStudents.map((st: any) => {
            // find jobs for this student
            const jobs = jobOrders.filter((j: any) =>
              j.recommendations?.includes(st.id) ||
              j.interestedStudents?.includes(st.id) ||
              j.approvedApplicants?.includes(st.id) ||
              j.applicantDocuments?.[st.id]
            );

            const validClasses = systemState.customization?.lmsClasses || [];
            const isClassValid = validClasses.some((c: any) => c.name === st.class);
            const displayClass = (st.class && isClassValid) ? st.class : "Belum ada kelas";

            const matchedUser = users.find((u: any) =>
              u.studentId === st.id ||
              (u.name && st.name && u.name.trim().toLowerCase() === st.name.trim().toLowerCase())
            );
            const isAlumni =
              st.statusPendaftaran === "Alumni" ||
              st.kategoriPendaftaran === "Alumni" ||
              st.status === "Di Jepang" ||
              st.status === "Lulus" ||
              matchedUser?.role === "Alumni" ||
              (st.class && st.class.toLowerCase().includes("alumni"));
            const categoryLabel = isAlumni ? "Alumni" : "Siswa Reguler";

            // Nearest upcoming schedule across all this student's job stages -
            // synced directly from the same "JADWAL" field the admin fills in
            // per-applicant in the Job Order panel above.
            const scheduleEntries = jobs
              .map((j: any) => ({
                job: j,
                scheduleDate: j.applicantDocuments?.[st.id]?.scheduleDate || "",
              }))
              .filter((e: any) => e.scheduleDate);

            return (
              <div key={st.id} className="p-3.5 bg-slate-50 hover:bg-white border border-slate-150 rounded-2xl transition space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">{st.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${isAlumni ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {categoryLabel}
                      </span>
                      <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                        {st.status || "-"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${displayClass === "Belum ada kelas" ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"}`}>
                        {displayClass}
                      </span>
                    </div>
                  </div>
                </div>

                {jobs.length > 0 ? (
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/70">
                    {jobs.map((j: any) => {
                      let stage = "Terdaftar";
                      if (j.applicantDocuments?.[st.id]?.stage) {
                        stage = j.applicantDocuments[st.id].stage;
                      } else if (j.approvedApplicants?.includes(st.id)) {
                        stage = "Disetujui";
                      } else if (j.interestedStudents?.includes(st.id)) {
                        stage = "Tertarik (Menunggu ACC)";
                      } else if (j.recommendations?.includes(st.id)) {
                        stage = "Direkomendasikan";
                      }
                      const stageStyle = STAGE_STYLES[stage] || "bg-slate-100 text-slate-600 border-slate-200";
                      return (
                        <div key={j.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-2 rounded-lg border border-slate-150 gap-1.5">
                          <span className="font-semibold text-slate-700 text-[10.5px] truncate" title={j.partnerName + ' - ' + j.occupation}>
                            {j.partnerName} - {j.occupation}
                          </span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border shrink-0 self-start sm:self-auto ${stageStyle}`}>
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[10.5px] pt-1 border-t border-slate-200/70">Belum ada progres job</p>
                )}

                {scheduleEntries.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/70">
                    {scheduleEntries.map((e: any) => (
                      <div key={e.job.id} className="flex items-center gap-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-150 rounded-lg px-2 py-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          <strong>{e.job.partnerName}:</strong> {e.scheduleDate}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
