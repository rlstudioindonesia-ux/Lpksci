import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface JobScheduleConfigPanelProps { job: any; onUpdateState: any; }

export const JobScheduleConfigPanel: React.FC<JobScheduleConfigPanelProps> = ({ job, onUpdateState }) => {
  const [scheduleRegistration, setScheduleRegistration] = useState(job.scheduleRegistration || "");
  const [scheduleDocumentSelection, setScheduleDocumentSelection] = useState(job.scheduleDocumentSelection || "");
  const [interviewDate, setInterviewDate] = useState(job.interviewDate || "");
  const [scheduleAnnouncement, setScheduleAnnouncement] = useState(job.scheduleAnnouncement || "");
  const [scheduleMcu, setScheduleMcu] = useState(job.scheduleMcu || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if job changes on parent re-renders
  React.useEffect(() => {
    setScheduleRegistration(job.scheduleRegistration || "");
    setScheduleDocumentSelection(job.scheduleDocumentSelection || "");
    setInterviewDate(job.interviewDate || "");
    setScheduleAnnouncement(job.scheduleAnnouncement || "");
    setScheduleMcu(job.scheduleMcu || "");
  }, [job]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const success = await onUpdateState("jobOrders", "edit", {
      id: job.id,
      updates: {
        scheduleRegistration,
        scheduleDocumentSelection,
        interviewDate,
        scheduleAnnouncement,
        scheduleMcu,
      },
    });
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="bg-indigo-50/50 p-3 mt-1.5 rounded-xl border border-indigo-100 text-left space-y-2">
      <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center justify-between">
        <span>⚙️ Pengaturan Jadwal Proses (Sinkron LMS Siswa)</span>
        {saveSuccess && (
          <span className="text-[9px] text-green-600 font-bold animate-pulse">
            ✓ Berhasil Disimpan
          </span>
        )}
      </h5>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">1. Pendaftaran</label>
          <input
            type="text"
            placeholder="Contoh: 1-10 Mei 2026"
            value={scheduleRegistration}
            onChange={(e) => setScheduleRegistration(e.target.value)}
            className="w-full text-[9px] p-1.5 rounded border border-slate-200 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">2. Seleksi Dokumen</label>
          <input
            type="text"
            placeholder="Contoh: 11-14 Mei 2026"
            value={scheduleDocumentSelection}
            onChange={(e) => setScheduleDocumentSelection(e.target.value)}
            className="w-full text-[9px] p-1.5 rounded border border-slate-200 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">3. Interview</label>
          <input
            type="text"
            placeholder="Contoh: 15-20 Mei 2026"
            value={interviewDate}
            onChange={(e) => setInterviewDate(e.target.value)}
            className="w-full text-[9px] p-1.5 rounded border border-slate-200 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">4. Pengumuman</label>
          <input
            type="text"
            placeholder="Contoh: 25 Mei 2026"
            value={scheduleAnnouncement}
            onChange={(e) => setScheduleAnnouncement(e.target.value)}
            className="w-full text-[9px] p-1.5 rounded border border-slate-200 bg-white"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase">5. MCU</label>
          <input
            type="text"
            placeholder="Contoh: 26-30 Mei 2026"
            value={scheduleMcu}
            onChange={(e) => setScheduleMcu(e.target.value)}
            className="w-full text-[9px] p-1.5 rounded border border-slate-200 bg-white"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="w-full text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm disabled:opacity-50 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-1 h-[27px]"
          >
            {isSaving ? "Menyimpan..." : "Simpan Jadwal"}
          </button>
        </div>
      </div>
    </div>
  );
};

