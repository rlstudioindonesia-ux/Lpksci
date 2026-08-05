import React, { useState } from "react";
import { ConfirmForm } from "./ConfirmForm";
import { ConfirmButton } from "./ConfirmButton";
import { 
  Calendar, Plus, Trash2, Users, BookOpen, Shield, Award, 
  Bell, CheckCircle2, Megaphone, Info, AlertCircle, ArrowRight,
  ChevronLeft, ChevronRight, Edit2, ExternalLink, MapPin, Clock
} from "lucide-react";
import { SystemState, UserAccount, CalendarEvent } from "../types";

interface CalendarViewProps {
  systemState: SystemState;
  currentUser: UserAccount | null;
  onUpdateState: (dataType: string, action: string, payload: any) => Promise<boolean>;
  isMobile?: boolean;
  adminMode?: boolean;
}

export default function CalendarView({ 
  systemState, 
  currentUser, 
  onUpdateState, 
  isMobile = false,
  adminMode = false
}: CalendarViewProps) {
  const getZoomAppLink = (webUrl: string) => {
    if (!webUrl) return "";
    const trimmed = webUrl.trim();
    if (trimmed.startsWith("zoomus://")) return trimmed;
    
    try {
      let urlString = trimmed;
      if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
        urlString = "https://" + urlString;
      }
      // Basic check to see if it even looks like a URL before parsing to avoid predictable throw
      if (urlString.includes(".") && !urlString.includes(" ")) {
        const parsed = new URL(urlString);
        if (parsed.hostname.includes("zoom.us")) {
          const pathname = parsed.pathname;
          const match = pathname.match(/\/j\/([0-9]+)/);
          if (match && match[1]) {
            const meetingId = match[1];
            const pwd = parsed.searchParams.get("pwd");
            return `zoomus://zoom.us/join?confno=${meetingId}${pwd ? `&pwd=${pwd}` : ""}`;
          }
        }
      }
    } catch (e) {
      // Ignore parsing errors for invalid URL strings
    }
    
    if (trimmed.includes("zoom.us")) {
      return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    }
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

  // Helper to format local date as "YYYY-MM-DD"
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const events: CalendarEvent[] = [...(systemState.events || [])]
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Form State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr);
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"Kegiatan" | "Jadwal Belajar" | "Libur">("Kegiatan");
  const [studyTime, setStudyTime] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [targetClass, setTargetClass] = useState("Semua Kelas");
  const [time, setTime] = useState("");
  const [url, setUrl] = useState("");
  const [location, setLocation] = useState("");
  
  // Selected targets for broadcast
  const [targetSiswa, setTargetSiswa] = useState(true);
  const [targetPengajar, setTargetPengajar] = useState(true);
  const [targetAdmin, setTargetAdmin] = useState(true);
  const [targetVvip, setTargetVvip] = useState(false);
  const [targetAlumni, setTargetAlumni] = useState(true);
  const [targetUmum, setTargetUmum] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [inboxPage, setInboxPage] = useState(1);
  const [showPastInbox, setShowPastInbox] = useState(false);


  // Filtered Notifications based on current user role
  // If not logged in, show all. If logged in, only show if target role is matching.
  const myRole = currentUser?.role; // "Admin" | "VVIP" | "Siswa" | "Pengajar"
  const isAdminModeActive = (currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && adminMode;
  
  const filteredEventsForMe = events.filter(e => {
    // Exclude confusing events with "strategi", "strategik" or "pemantauan" to keep calendar clear
    const titleLower = (e.title || "").toLowerCase();
    const descLower = (e.desc || "").toLowerCase();
    if (
      titleLower.includes("strategi") ||
      descLower.includes("strategi") ||
      titleLower.includes("strategik") ||
      descLower.includes("strategik") ||
      titleLower.includes("pemantauan") ||
      descLower.includes("pemantauan")
    ) {
      return false;
    }

    // Perbaikan info jadwal terdekat: yang sudah lewat tidak perlu ditampilkan untuk siswa, alumni, sensei
    if (!isAdminModeActive && e.date && e.date < todayStr) {
      return false;
    }

    // Filter by targets if not admin
    if (!isAdminModeActive && currentUser) {
      const role = currentUser.role; // "Siswa" | "Pengajar" | "Alumni"
      const matchesTarget = e.targets && e.targets.includes(role);
      
      // Also match class if specified and it's student or teacher
      let matchesClass = true;
      if (e.targetClass && e.targetClass !== "Semua Kelas") {
        const userClass = currentUser.assignedClass || "";
        if (userClass && userClass.trim().toLowerCase() !== e.targetClass.trim().toLowerCase()) {
          matchesClass = false;
        }
      }
      return matchesTarget && matchesClass;
    }

    return true;
  });

  // Check how many are targeted for current role

  const inboxEvents = React.useMemo(() => {
    let list = [...filteredEventsForMe];
    const todayStrForInbox = new Date().toISOString().split("T")[0];
    
    // Sort logic
    if (showPastInbox) {
      // Past events: keep those before today, sort descending (closest past first)
      list = list.filter(e => e.date < todayStrForInbox);
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      // Upcoming events: keep those today or later, sort ascending (closest upcoming first)
      list = list.filter(e => e.date >= todayStrForInbox);
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    
    return list;
  }, [filteredEventsForMe, showPastInbox]);

  const INBOX_ITEMS_PER_PAGE = 10;
  const totalInboxPages = Math.max(1, Math.ceil(inboxEvents.length / INBOX_ITEMS_PER_PAGE));
  const currentInboxEvents = inboxEvents.slice((inboxPage - 1) * INBOX_ITEMS_PER_PAGE, inboxPage * INBOX_ITEMS_PER_PAGE);

  const unreadCount = filteredEventsForMe.length;


  const handleEditClick = (ev: CalendarEvent) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setDate(ev.date);
    setDesc(ev.desc);
    setType(ev.type || "Kegiatan");
    setStudyTime(ev.studyTime || "");
    setReminderTime(ev.reminderTime || "");
    setTargetClass(ev.targetClass || "Semua Kelas");
    setTime(ev.time || "");
    setUrl(ev.url || "");
    setLocation(ev.location || "");
    setTargetSiswa(ev.targets.includes("Siswa"));
    setTargetPengajar(ev.targets.includes("Pengajar"));
    setTargetAdmin(ev.targets.includes("Admin"));
    setTargetVvip(ev.targets.includes("VVIP"));
    setTargetAlumni(ev.targets.includes("Alumni"));
    setTargetUmum(ev.targets.includes("Umum"));
    
    // Scroll to form
    const formElement = document.getElementById("calendar-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setTitle("");
    setDesc("");
    setStudyTime("");
    setReminderTime("");
    setTime("");
    setUrl("");
    setLocation("");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !desc) {
      setErrorMsg("Mohon lengkapi semua baris input sebelum menyimpan.");
      return;
    }

    const selectedTargets: string[] = [];
    if (targetSiswa) selectedTargets.push("Siswa");
    if (targetPengajar) selectedTargets.push("Pengajar");
    if (targetAdmin) selectedTargets.push("Admin");
    if (targetVvip) selectedTargets.push("VVIP");
    if (targetAlumni) selectedTargets.push("Alumni");
    if (targetUmum) selectedTargets.push("Umum");

    if (selectedTargets.length === 0) {
      setErrorMsg("Pilih minimal satu target disebar untuk menyiarkan agenda.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const payload = {
      ...(editingEventId ? { id: editingEventId } : {}),
      title,
      date,
      desc,
      targets: selectedTargets,
      type,
      studyTime: type === "Jadwal Belajar" ? studyTime : "",
      reminderTime: type === "Jadwal Belajar" ? reminderTime : "",
      targetClass: targetClass || "Semua Kelas",
      time,
      url,
      location
    };

    const action = editingEventId ? "update" : "add";
    const ok = await onUpdateState("events", action, payload);
    setIsLoading(false);
    if (ok) {
      setSuccessMsg(editingEventId ? "Agenda kegiatan sukses diperbarui!" : "Agenda kegiatan sukses disimpan & disebarkan ke notifikasi target!");
      if (!editingEventId) {
        setTitle("");
        setDesc("");
        setStudyTime("");
        setReminderTime("");
        setTime("");
        setUrl("");
        setLocation("");
      } else {
        setEditingEventId(null);
        setTitle("");
        setDesc("");
        setStudyTime("");
        setReminderTime("");
        setTime("");
        setUrl("");
        setLocation("");
      }
    } else {
      setErrorMsg("Terjadi kesalahan teknis saat menyimpan agenda.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await onUpdateState("events", "delete", { id });
  };

  // Helper to format date nicely
  const formatDateIndo = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length !== 3) return dateStr;
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${monthNames[monthIdx]} ${year}`;
    } catch {
      return dateStr;
    }
  };

  // State for interactive month calendar selection
  const [currentDate, setCurrentDate] = useState(new Date()); // Default to current date
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  // Helper to check if a day in current view has an event
  const getEventsForDay = (dayNo: number) => {
    const monthStr = (currentMonth + 1).toString().padStart(2, "0");
    const dayStr = dayNo.toString().padStart(2, "0");
    const targetDate = `${currentYear}-${monthStr}-${dayStr}`;
    const sourceEvents = filteredEventsForMe;
    return sourceEvents.filter(e => e.date === targetDate);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)

  const hasAccessToAdmin = (currentUser?.role === "Admin" || currentUser?.role === "Admin Super" || currentUser?.role === "Admin Biasa" || currentUser?.role === "VVIP") && adminMode;

  return (
    <div className={`w-full font-sans ${isMobile ? "p-1" : "space-y-6"}`} id="calendar-view-container">
      
      {/* Title block */}
      {!isMobile && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white text-left shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="bg-indigo-650 text-indigo-100 text-[9.5px] font-mono tracking-widest px-3 py-1 rounded-full font-extrabold uppercase ring-4 ring-indigo-500/10">
                Sains Kalender & Diseminasi Terpadu
              </span>
              <h2 className="text-2xl font-sans font-black tracking-tight mt-2 text-white">Kalender Kegiatan & Diseminasi Notifikasi</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Kelola agenda akademik LPK Source Course secara real-time. Bagikan notifikasi kegiatan instan spesifik ke segmentasi Siswa, Sensei (Pengajar), Admin, maupun VVIP.
              </p>
            </div>
            
            {currentUser && (
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-5 w-5 text-yellow-300 animate-bounce-slow" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 text-white font-extrabold text-[8px] flex items-center justify-center rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider leading-none">Login Sebagai:</p>
                  <p className="text-xs text-white font-bold leading-normal mt-0.5">{currentUser.name} ({currentUser.role})</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid Layout Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
        
        {/* LEFT COLUMN: INTERACTIVE MONTH GRAPHICS & LISTING (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-900" />
                  <h3 className="font-sans font-black text-slate-900 text-sm">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                </div>
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  <button 
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-white hover:shadow-sm rounded-md transition cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-white hover:shadow-sm rounded-md transition cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-indigo-900/15 text-indigo-900 px-3 py-1 rounded-full font-mono uppercase">
                Interactive Grid
              </span>
            </div>

            {/* Calendar grid widget */}
            <div className="space-y-3">
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-400 uppercase tracking-wider select-none font-mono">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, dIdx) => (
                  <div key={dIdx} className="text-[9.5px] py-1 border-b text-slate-400">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2 text-center text-xs">
                {/* Empty grids for offset start of month */}
                {[...Array(firstDayOfMonth)].map((_, i) => (
                  <div key={`empty-${i}`} className="py-2.5 rounded-lg text-slate-200">-</div>
                ))}

                {[...Array(daysInMonth)].map((_, i) => {
                  const dayNo = i + 1;
                  const dayEvents = getEventsForDay(dayNo);
                  const isSelected = selectedDay === dayNo;
                  const hasEvents = dayEvents.length > 0;
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(dayNo)}
                      className={`relative py-3 rounded-2xl transition duration-150 flex flex-col items-center justify-center font-bold text-xs select-none cursor-pointer border ${
                        isSelected 
                          ? "bg-yellow-400 text-indigo-900 shadow-md ring-2 ring-indigo-500/30 font-extrabold scale-105 border-transparent" 
                          : hasEvents 
                            ? "bg-indigo-50 hover:bg-indigo-100/70 text-indigo-900 border-indigo-150" 
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-transparent"
                      }`}
                    >
                      <span className="font-semibold text-xs">{dayNo}</span>
                      
                      {/* Event alert dots */}
                      {hasEvents && (
                        <span className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${isSelected ? "bg-indigo-900" : "bg-indigo-600 animate-pulse"}`}></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-400 border-t pt-2.5 leading-relaxed font-medium">
                *Klik pada angka tanggal yang memiliki penanda <span className="text-indigo-600 font-bold">Dot Biru</span> untuk memfilter langsung detail notifikasi rincian agenda.
              </p>
            </div>
          </div>

          {/* EVENTS LISTED FOR SELECTED DAY */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
            <h4 className="text-[10.5px] uppercase font-black tracking-wider text-slate-400 mb-3 font-mono">
              Agenda Pada {selectedDay ? `Tanggal ${selectedDay} ${monthNames[currentMonth]} ${currentYear}` : `Seluruh Bulan ${monthNames[currentMonth]}`}
            </h4>

            {(() => {
              const sourceEvents = filteredEventsForMe;
              const displayDayEvents = selectedDay ? getEventsForDay(selectedDay) : sourceEvents;
              
              if (displayDayEvents.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-150 border-dashed space-y-2">
                    <Info className="h-6 w-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-850">Tidak Ada Agenda Kegiatan Khusus</p>
                    <p className="text-[10px] text-slate-400 leading-snug">
                      Klik pada tanggal lain di kalender yang memiliki indikator agenda untuk membaca notifikasi terlampir.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {displayDayEvents.map((ev) => {
                    const isStudySchedule = ev.type === "Jadwal Belajar";
                    return (
                      <div key={ev.id} className={`relative p-4 rounded-2xl border transition hover:shadow-2xs ${
                        isStudySchedule 
                          ? "bg-emerald-50/75 border-emerald-200" 
                          : "bg-slate-50/70 border-slate-150"
                      } flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:bg-opacity-100`}>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[8.5px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                              isStudySchedule 
                                ? "bg-emerald-600 text-white" 
                                : "bg-indigo-900 text-yellow-300"
                            }`}>
                              {formatDateIndo(ev.date)}
                            </span>
                            <span className={`text-[8px] font-mono leading-none font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              isStudySchedule 
                                ? "bg-emerald-100 text-emerald-800" 
                                : "bg-indigo-50 text-indigo-700"
                            }`}>
                              {isStudySchedule ? "📚 JADWAL BELAJAR" : "📅 KEGIATAN"}
                            </span>
                            <span className="text-[8px] font-mono leading-none font-extrabold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded uppercase">
                              ID: {ev.id}
                            </span>
                          </div>
                          
                          <h5 className="font-extrabold text-xs text-slate-900 pt-1 leading-snug">{ev.title}</h5>
                          <p className="text-[10.5px] text-slate-550 leading-relaxed font-normal">{ev.desc}</p>
                          
                          {/* Tanggal & Waktu Pelaksanaan */}
                          <div className="space-y-2 mt-2 w-full">
                            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-800 font-extrabold bg-slate-100/90 px-3 py-2 rounded-xl inline-flex w-full">
                              <span className="text-indigo-650">📅 Tanggal:</span>
                              <span className="text-indigo-950 font-black">{formatDateIndo(ev.date)}</span>
                              {ev.time && (
                                <>
                                  <span className="text-slate-300 mx-1">|</span>
                                  <span className="text-indigo-600">🕒 Jam:</span>
                                  <span className="text-indigo-950 font-black">{ev.time}</span>
                                </>
                              )}
                              {ev.location && (
                                <>
                                  <span className="text-slate-300 mx-1">|</span>
                                  <span className="text-rose-600">📍 Lokasi:</span>
                                  <span className="text-rose-950 font-black">{ev.location}</span>
                                </>
                              )}
                            </div>

                            {ev.url && (
                              <div className="space-y-1.5 w-full">
                                {ev.url.toLowerCase().includes("zoom") ? (
                                  <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs w-full shadow-2xs">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-blue-600 text-white p-2 rounded-xl shrink-0">
                                        <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                          <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-9 12a4 4 0 110-8 4 4 0 010 8z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="font-extrabold text-blue-900 text-[11px] uppercase tracking-wider">Akses Kelas Virtual Zoom</p>
                                        <p className="text-[10px] text-blue-700 font-medium">Klik tombol untuk masuk via Aplikasi Zoom di HP</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <a 
                                        href={getZoomAppLink(ev.url)} 
                                        className="bg-blue-600 text-white font-black px-3 py-1.5 rounded-xl hover:bg-blue-700 transition active:scale-95 text-center text-[11px] uppercase tracking-wider inline-flex items-center gap-1 shadow-md shadow-blue-500/10 cursor-pointer"
                                      >
                                        📱 Buka di App Zoom
                                      </a>
                                      <a 
                                        href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-700 hover:underline text-[10px] font-bold px-2 py-1"
                                      >
                                        Browser
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[10px] text-indigo-650 font-bold bg-indigo-50/50 p-2 rounded-lg">
                                    <span className="text-indigo-500">🔗</span>
                                    <a 
                                      href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline flex items-center gap-1"
                                    >
                                      Buka Tautan Acara <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Study Schedule Specific Metadata */}
                          {isStudySchedule && (
                            <div className="bg-white/80 border border-emerald-100/50 rounded-xl p-2.5 mt-2 space-y-1 text-[10px] text-emerald-950 font-medium">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <span className="text-emerald-600">🕒</span>
                                  <strong>Waktu Belajar:</strong> {ev.studyTime || "08:00 - selesai"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="text-emerald-600">🔔</span>
                                  <strong>Pengingat:</strong> {ev.reminderTime || "Tepat waktu"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="text-emerald-600">🏫</span>
                                  <strong>Kelas:</strong> {ev.targetClass || "Semua Kelas"}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Selected targets badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Notifikasi Disebarkan Ke:</span>
                            {ev.targets.map((t) => {
                              let pillStyle = "bg-slate-100 text-slate-600";
                              if (t === "Siswa") pillStyle = "bg-blue-100 text-blue-800";
                              if (t === "Pengajar") pillStyle = "bg-emerald-100 text-emerald-800";
                              if (t === "Admin") pillStyle = "bg-amber-100 text-amber-800";
                              if (t === "VVIP") pillStyle = "bg-rose-100 text-rose-800";
                              
                              return (
                                <span key={t} className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tight ${pillStyle}`}>
                                  {t}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                      {hasAccessToAdmin && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => handleEditClick(ev)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-transform active:scale-95 cursor-pointer"
                            title="Edit Agenda"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <ConfirmButton
                            confirmTitle="Hapus Agenda"
                            confirmMessage="Apakah Anda yakin ingin menghapus agenda kegiatan ini? Notifikasi siswa & sensei juga akan ditarik."
                            onConfirmClick={() => handleDeleteEvent(ev.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-transform active:scale-95 cursor-pointer"
                            title="Hapus / Tarik Diseminasi"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmButton>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT COLUMN: RECIPIENT NOTIFICATIONS VIEW OR CREATOR DASHBOARD FORM (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* CREATOR PANEL: ADMIN / VVIP FORM TO ADD & BROADCAST */}
          {hasAccessToAdmin ? (
            <div id="calendar-form" className="bg-slate-900 text-white rounded-3xl border border-slate-950 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  {editingEventId ? <Edit2 className="h-5 w-5 text-indigo-400" /> : <Megaphone className="h-5 w-5 text-yellow-300 animate-pulse" />}
                  <div>
                    <h3 className="font-sans font-black text-white text-xs uppercase tracking-wider">
                      {editingEventId ? "Mode Edit Agenda" : "Pusat Siaran & Broadcast LPK"}
                    </h3>
                    <p className="text-[9.5px] text-slate-400">
                      {editingEventId ? "Perbarui informasi agenda kegiatan" : "Tambah kegiatan baru & sebar notifikasi target"}
                    </p>
                  </div>
                </div>
                {editingEventId && (
                  <button 
                    onClick={handleCancelEdit}
                    className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full font-bold transition cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
              </div>

              {successMsg && (
                <div className="bg-emerald-500/20 text-emerald-300 p-3 rounded-2xl text-[10.5px] font-bold border border-emerald-500/30 flex items-start gap-2 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-500/20 text-rose-300 p-3 rounded-2xl text-[10.5px] font-bold border border-rose-500/30 flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <ConfirmForm confirmTitle={editingEventId ? "Update Acara" : "Tambah Acara"} confirmMessage={editingEventId ? "Simpan perubahan pada agenda ini?" : "Broadcast pengumuman ini ke kalender pengguna terkait?"} onSubmit={handleAddEvent} className="space-y-3.5 text-xs">
                
                {/* Form Input: Tipe Agenda */}
                <div className="space-y-1 text-left">
                  <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">Tipe Agenda</label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const val = e.target.value as "Kegiatan" | "Jadwal Belajar";
                      setType(val);
                      if (val === "Jadwal Belajar") {
                        setTargetSiswa(true);
                        setTargetPengajar(true);
                        setTargetAdmin(false);
                        setTargetVvip(false);
                        setTargetAlumni(false);
                        setTargetUmum(false);
                      } else {
                        setTargetSiswa(true);
                        setTargetPengajar(true);
                        setTargetAdmin(true);
                        setTargetVvip(true);
                        setTargetAlumni(true);
                        setTargetUmum(true);
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Kegiatan">📅 Kegiatan Umum / Pengumuman</option>
                    <option value="Jadwal Belajar">📚 Jadwal Belajar Harian</option>
                  </select>
                </div>

                {/* Form Input: Title */}
                <div className="space-y-1 text-left">
                  <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">
                    {type === "Jadwal Belajar" ? "Materi Pembelajaran / Mata Pelajaran" : "Judul Agenda Kegiatan"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={type === "Jadwal Belajar" ? "Contoh: Bab 12 - Kosakata & Pola Kalimat (~Te Kara)" : "Contoh: Pembinaan Karakter & Jasmani Pra-Keberangkatan"}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Form Input: Date */}
                  <div className="space-y-1 text-left">
                    <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">Tanggal Agenda</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Form Input: Jam */}
                  <div className="space-y-1 text-left">
                    <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">Jam Kegiatan</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="Contoh: 13:00 - 15:00"
                      className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  {/* Form Input: Lokasi */}
                  <div className="space-y-1 text-left">
                    <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">Lokasi / Ruangan</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Contoh: Aula Lt. 2"
                      className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Form Input: URL */}
                  <div className="space-y-1 text-left">
                    <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">URL / Tautan (Opsional)</label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Contoh: zoom.us/j/..."
                      className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Study Schedule Specific Input Row */}
                {type === "Jadwal Belajar" && (
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1 text-left">
                      <label className="font-extrabold text-[10px] uppercase text-emerald-400 tracking-wider">Waktu Belajar (LMS)</label>
                      <input
                        type="text"
                        value={studyTime}
                        onChange={(e) => setStudyTime(e.target.value)}
                        placeholder="Contoh: 08:00 - 10:30"
                        className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="font-extrabold text-[10px] uppercase text-emerald-400 tracking-wider">Notif Pengingat</label>
                      <input
                        type="text"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        placeholder="Contoh: 07:30 (30m sblm)"
                        className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="font-extrabold text-[10px] uppercase text-emerald-400 tracking-wider">Kelas Target</label>
                  <select
                    value={targetClass}
                    onChange={(e) => setTargetClass(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Semua Kelas">🏫 Semua Kelas</option>
                    {(systemState.customization?.lmsClasses || []).map(cls => (
                      <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                {/* Form Input: Description */}
                <div className="space-y-1 text-left">
                  <label className="font-extrabold text-[10px] uppercase text-slate-300 tracking-wider">
                    {type === "Jadwal Belajar" ? "Petunjuk Pembelajaran / Tugas Mandiri" : "Deskripsi Lengkap Notifikasi"}
                  </label>
                  <textarea
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder={type === "Jadwal Belajar" ? "Contoh: Persiapkan modul halaman 45-50. Jangan lupa presensi kehadiran tepat waktu sebelum masuk kelas virtual." : "Deskripsikan dengan rinci dokumen apa yang harus dibawa siswa, rute lokasi, koordinat jam masuk..."}
                    className="w-full bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* BROADCAST TARGET SELECTIONS checkboxes */}
                <div className="bg-slate-950/70 border border-slate-850 p-3 rounded-2xl text-left space-y-2">
                  <label className="font-extrabold text-[9.5px] uppercase text-yellow-350 tracking-wider block">
                    Pilih Target Penerima Notifikasi (Sebar Ke):
                  </label>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {/* Target: Siswa */}
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg select-none">
                      <input 
                        type="checkbox" 
                        checked={targetSiswa} 
                        onChange={(e) => setTargetSiswa(e.target.checked)}
                        className="rounded-sm accent-indigo-500 cursor-pointer h-4 w-4"
                      />
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase">Siswa Aktif</span>
                    </label>

                    {/* Target: Sensei */}
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg select-none">
                      <input 
                        type="checkbox" 
                        checked={targetPengajar} 
                        onChange={(e) => setTargetPengajar(e.target.checked)}
                        className="rounded-sm accent-emerald-500 cursor-pointer h-4 w-4"
                      />
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase">Sensei / Guru</span>
                    </label>

                    {/* Target: Admin */}
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg select-none">
                      <input 
                        type="checkbox" 
                        checked={targetAdmin} 
                        onChange={(e) => setTargetAdmin(e.target.checked)}
                        className="rounded-sm accent-amber-500 cursor-pointer h-4 w-4"
                      />
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase">Admin Desk</span>
                    </label>
                    {/* Target: Alumni */}
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg select-none">
                      <input 
                        type="checkbox" 
                        checked={targetAlumni} 
                        onChange={(e) => setTargetAlumni(e.target.checked)}
                        className="rounded-sm accent-purple-500 cursor-pointer h-4 w-4"
                      />
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase">Alumni</span>
                    </label>
                    {/* Target: Umum */}
                    <label className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-white/5 rounded-lg select-none">
                      <input 
                        type="checkbox" 
                        checked={targetUmum} 
                        onChange={(e) => setTargetUmum(e.target.checked)}
                        className="rounded-sm accent-blue-500 cursor-pointer h-4 w-4"
                      />
                      <span className="text-[10px] font-extrabold text-slate-300 uppercase">Umum</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-yellow-400 hover:bg-yellow-350 text-slate-950 font-black uppercase text-xs py-3 rounded-2xl cursor-pointer transition-all duration-200 active:scale-95 text-center shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <span className="h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Megaphone className="h-4 w-4 stroke-[2.5]" />
                      <span>Simpan & Broadcast Notifikasi</span>
                    </>
                  )}
                </button>

              </ConfirmForm>
            </div>
          ) : null}

          {/* MY PERSONALIZED NOTIFICATIONS SCREEN PANEL */}
          {(!isMobile || currentUser) && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs text-left">
            <div className="flex items-center justify-between border-b pb-2 mb-3.5">
              <div className="flex items-center gap-2">
                <Bell className="h-4.5 w-4.5 text-indigo-600" />
                <h3 className="font-sans font-black text-slate-900 text-xs uppercase tracking-wider">Kotak Masuk Notifikasi</h3>
              </div>
              <span className="text-[9px] font-mono leading-none bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold uppercase">
                {currentUser ? `${currentUser.role} Scope` : "Semua Sasaran"}
              </span>
            </div>

            {currentUser ? (
              <p className="text-[10px] text-slate-400 mb-3 leading-normal font-sans">
                Berikut adalah rekap info diseminasi agenda terbaru khusus yang disebarkan ke segmentasi akun berhak Anda:
              </p>
            ) : (
              <div className="bg-amber-50 p-3 rounded-2xl text-[9.5px] text-amber-900 font-bold border border-amber-200 flex items-start gap-1.5 mb-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
                <span>
                  Anda sedang mengakses Kalender Publik. Silakan login sebagai <b>Siswa, Pengajar, atau Admin</b> untuk menerima update notifikasi spesifik sesuai status.
                </span>
              </div>
            )}

            <div className="mb-3">
              <div className="flex gap-2">
                <button 
                  onClick={() => { setShowPastInbox(false); setInboxPage(1); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition ${!showPastInbox ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'}`}
                >
                  Jadwal Mendatang
                </button>
                <button 
                  onClick={() => { setShowPastInbox(true); setInboxPage(1); }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition ${showPastInbox ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'}`}
                >
                  Jadwal Lampau
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentInboxEvents.length === 0 ? (
                <div className="py-6 text-center text-slate-450 border border-dashed rounded-2xl space-y-1">
                  <CheckCircle2 className="h-6 w-6 text-slate-350 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Notifikasi Kosong</p>
                  <p className="text-[9.5px] text-slate-450">Belum ada agenda spesifik baru untuk tipe akun Anda.</p>
                </div>
              ) : (
                currentInboxEvents.map((n) => {
                  const isStudySchedule = n.type === "Jadwal Belajar";
                  return (
                    <div key={n.id} className={`relative bg-white p-3.5 rounded-2xl border ${
                      isStudySchedule ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200"
                    } hover:border-slate-300 transition-colors shadow-3xs overflow-hidden flex items-start gap-3`}>
                      <div className={`absolute top-0 left-0 h-full w-1 ${
                        isStudySchedule ? "bg-emerald-500" : "bg-indigo-900"
                      }`}></div>
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isStudySchedule ? "bg-emerald-50 text-emerald-700" : "bg-indigo-50 text-indigo-700"
                      }`}>
                        {isStudySchedule ? <BookOpen className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2.5">
                          <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${
                            isStudySchedule ? "bg-emerald-100 text-emerald-800" : "bg-indigo-900/10 text-indigo-900"
                          }`}>
                            {formatDateIndo(n.date)}
                          </span>
                          <span className={`text-[7.5px] font-mono leading-none ${
                            isStudySchedule ? "text-emerald-600 font-extrabold" : "text-slate-400"
                          }`}>
                            {isStudySchedule ? "📚 PENGINGAT BELAJAR" : "REALTIME NOTIF"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-[11.5px] text-slate-900 leading-snug pt-0.5">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 font-normal leading-normal">{n.desc}</p>
                        
                        {/* New Fields: Time, URL, Location */}
                        {(n.time || n.location || n.url || n.date) && (
                          <div className="space-y-2 mt-2 w-full">
                            {/* Tanggal & Waktu Pelaksanaan */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] text-slate-800 font-extrabold bg-slate-100/70 px-2.5 py-1.5 rounded-lg inline-flex w-full">
                              <span className="text-indigo-650">📅 Tanggal:</span>
                              <span className="text-indigo-950 font-black">{formatDateIndo(n.date)}</span>
                              {n.time && (
                                <>
                                  <span className="text-slate-300 mx-1">|</span>
                                  <span className="text-indigo-600">🕒 Jam:</span>
                                  <span className="text-indigo-950 font-black">{n.time}</span>
                                </>
                              )}
                              {n.location && (
                                <>
                                  <span className="text-slate-300 mx-1">|</span>
                                  <span className="text-rose-600">📍 Lokasi:</span>
                                  <span className="text-rose-950 font-black">{n.location}</span>
                                </>
                              )}
                            </div>

                            {n.url && (
                              <div className="space-y-1.5 w-full">
                                {n.url.toLowerCase().includes("zoom") ? (
                                  <div className="bg-blue-50/90 border border-blue-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs w-full shadow-2xs">
                                    <div className="flex items-center gap-2">
                                      <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
                                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                          <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-9 12a4 4 0 110-8 4 4 0 010 8z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="font-extrabold text-blue-900 text-[10px] uppercase tracking-wider">Akses Kelas Virtual Zoom</p>
                                        <p className="text-[9px] text-blue-700 font-medium">Klik untuk masuk via Aplikasi Zoom di HP</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <a 
                                        href={getZoomAppLink(n.url)} 
                                        className="bg-blue-600 text-white font-black px-2.5 py-1 rounded-lg hover:bg-blue-700 transition active:scale-95 text-center text-[10px] uppercase tracking-wider inline-flex items-center gap-1 shadow-sm cursor-pointer"
                                      >
                                        📱 Buka di App Zoom
                                      </a>
                                      <a 
                                        href={n.url.startsWith('http') ? n.url : `https://${n.url}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-700 hover:underline text-[9.5px] font-bold px-1 py-0.5"
                                      >
                                        Browser
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[9.5px] text-indigo-650 font-bold bg-indigo-50/50 p-1.5 rounded-lg">
                                    <span className="text-indigo-500">🔗</span>
                                    <a 
                                      href={n.url.startsWith('http') ? n.url : `https://${n.url}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline flex items-center gap-1"
                                    >
                                      Buka Tautan Acara <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {isStudySchedule && (
                          <div className="bg-white/80 border border-emerald-100/55 rounded-lg p-2 mt-1.5 space-y-1 text-[9.5px] text-emerald-950 font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>🕒 {n.studyTime || "08:00 - selesai"}</span>
                              <span>•</span>
                              <span>🔔 Pengingat: {n.reminderTime || "Tepat waktu"}</span>
                              {n.targetClass && (
                                <>
                                  <span>•</span>
                                  <span>🏫 Kelas: {n.targetClass}</span>
                                </>
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
          )}

        </div>

      </div>

    </div>
  );
}
