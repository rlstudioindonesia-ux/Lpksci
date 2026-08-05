import React, { useState } from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";

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

  // Filter out any user with non-student roles (e.g. Pengajar, Admin, Admin Super, Admin Biasa, VVIP)
  const filteredStudents = activeStudents.filter((st: any) => {
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
              {filteredStudents.length} Terdaftar
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
          Gunakan panel rekapitulasi di bawah ini untuk melihat daftar siswa reguler dan alumni serta tahapan Job Order yang sedang mereka jalani secara real-time.
        </p>
      )}

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] sm:text-xs text-slate-600">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Nama Siswa</th>
              <th className="p-3">Kelas</th>
              <th className="p-3">Status</th>
              <th className="p-3">Job Order & Tahapan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((st: any) => {
              // find jobs for this student
              const jobs = jobOrders.filter((j: any) => 
                j.recommendations?.includes(st.id) ||
                j.interestedStudents?.includes(st.id) ||
                j.approvedApplicants?.includes(st.id) ||
                j.applicantDocuments?.[st.id]
              );
              return (
                <tr key={st.id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3 font-bold text-slate-800">{st.name}</td>
                  <td className="p-3">
                    {(() => {
                      const validClasses = systemState.customization?.lmsClasses || [];
                      const isClassValid = validClasses.some((c: any) => c.name === st.class);
                      const displayClass = (st.class && isClassValid) ? st.class : "Belum ada kelas";
                      return (
                        <span className={`px-2 py-1 rounded-md font-bold ${displayClass === "Belum ada kelas" ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"}`}>
                          {displayClass}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3">
                    {(() => {
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
                      
                      return (
                        <div className="flex flex-col gap-1.5 text-left">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold w-fit text-center ${
                            isAlumni 
                              ? "bg-purple-50 text-purple-700 border border-purple-200" 
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}>
                            {categoryLabel}
                          </span>
                          <span className="bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full text-[9px] font-semibold w-fit text-center">
                            {st.status || "-"}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3">
                    {jobs.length > 0 ? (
                      <div className="space-y-1.5">
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
                          return (
                            <div key={j.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-2 rounded-lg border border-slate-100 gap-1.5">
                              <span className="font-semibold text-slate-700 truncate w-full sm:max-w-[200px]" title={j.partnerName + ' - ' + j.occupation}>
                                {j.partnerName} - {j.occupation}
                              </span>
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold shrink-0 self-start sm:self-auto">
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Belum ada progres job</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                  Belum ada data siswa
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};
