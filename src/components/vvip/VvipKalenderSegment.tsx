import React from "react";
import { Calendar } from "lucide-react";
import CalendarView from "../CalendarView";

interface VvipKalenderSegmentProps {
  currentUser: any;
  onUpdateState: any;
  systemState: any;
}

export default function VvipKalenderSegment({ currentUser, onUpdateState, systemState }: VvipKalenderSegmentProps) {
  return (
    <section className="bg-white border border-slate-200/60 rounded-[2rem] p-5 sm:p-8 space-y-8 animate-fade-in text-slate-800 shadow-xs" id="vvip-kalender-section">
              <div className="border-b border-slate-100 pb-5">
                <h3 className="font-sans font-black text-slate-900 text-lg flex items-center gap-3 uppercase tracking-tight">
                  <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6" />
                  </div>
                  Manajemen Jadwal LPK
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-medium max-w-2xl leading-relaxed">
                  Pantau dan kelola seluruh agenda kegiatan, jadwal belajar, dan pengumuman penting LPK Source Course Indonesia. Anda memiliki akses penuh untuk menambah, mengubah, atau menghapus agenda.
                </p>
              </div>
              <CalendarView
                systemState={systemState}
                currentUser={currentUser || null}
                onUpdateState={onUpdateState}
                adminMode={true}
              />
            </section>
  );
}
