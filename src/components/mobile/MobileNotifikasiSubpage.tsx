import React from "react";
import { Bell } from "lucide-react";
import { formatDateIndo, getZoomAppLink } from "../MobileDashboardView.tsx";

interface MobileNotifikasiSubpageProps {
  currentUser: any;
  systemState: any;
}

export default function MobileNotifikasiSubpage({ currentUser, systemState }: MobileNotifikasiSubpageProps) {
  return (
    <div className="flex-1 p-4 space-y-4 text-left font-sans animate-fade-in">
                  {(() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    const todayStr = `${year}-${month}-${day}`;
    
                    const displayEvents = (systemState.events || [])
                      .filter((e) => {
                        if (e.date && e.date < todayStr) return false;
                        if (!currentUser) {
                          // untuk masyarakat umum notif ini hanya berkaitan dengan jadwal pembukaan kelas
                          const titleLower = (e.title || "").toLowerCase();
                          const descLower = (e.desc || "").toLowerCase();
                          return titleLower.includes("pembukaan") || 
                                 titleLower.includes("pendaftaran") || 
                                 titleLower.includes("kelas baru") ||
                                 titleLower.includes("angkatan") ||
                                 titleLower.includes("penerimaan") ||
                                 descLower.includes("pembukaan") || 
                                 descLower.includes("pendaftaran") || 
                                 descLower.includes("kelas baru") ||
                                 descLower.includes("angkatan") ||
                                 descLower.includes("penerimaan");
                        }
                        if (!currentUser?.role) return false;
                        const roleMatches = e.targets.includes(currentUser.role) || (currentUser.studentId && e.targets.includes(currentUser.studentId)) || ((currentUser as any).id && e.targets.includes((currentUser as any).id));
                        if (!roleMatches) return false;
                        
                        // Specific class filter for student or teacher
                        if (currentUser.role === "Siswa" || currentUser.role === "Pengajar") {
                          if (e.targetClass && e.targetClass !== "Semua Kelas") {
                            return currentUser.assignedClass === e.targetClass;
                          }
                        }
                        return true;
                      })
                      .sort((a, b) => {
                        const dateA = a.date || "";
                        const dateB = b.date || "";
                        return dateA.localeCompare(dateB);
                      });
    
                    const getSynchronizedNotifications = () => {
                      if (!currentUser) {
                        return [
                          {
                            id: "welcome-guest",
                            title: "Selamat Datang di Portal LPK SCI 🌐",
                            body: "Silakan masuk menggunakan akun Siswa, Pengajar, atau Admin Anda untuk melihat jadwal belajar, penugasan, nilai, dan pesan terintegrasi.",
                            time: "Informasi"
                          }
                        ];
                      }
    
                      const list: any[] = [];
    
                      // Unread chat messages (kept in sync with Chat tab's own inbox id logic)
                      // so new chat activity actually shows up in the notification feed.
                      const myChatId = ["Admin", "Admin Super", "Admin Biasa"].includes(currentUser.role)
                        ? "admin_shared"
                        : currentUser.username;
                      const unreadMessages = (systemState.messages || [])
                        .filter((m) => m.receiverId === myChatId && !m.isRead)
                        .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
                      unreadMessages.forEach((m) => {
                        list.push({
                          id: `chat-${m.id}`,
                          title: `💬 Pesan Baru dari ${m.senderName}`,
                          body: m.fileUrl
                            ? `Mengirim ${m.fileType === "image" ? "foto" : m.fileType === "video" ? "video" : "dokumen"}${m.text ? `: "${m.text}"` : "."}`
                            : `"${m.text}"`,
                          time: "Chat Baru",
                        });
                      });
    
                      if (currentUser.role === "Siswa") {
                        const studentId = currentUser.studentId || "SIS-001";
                        
                        // 1. New Material (from lmsLessons)
                        const lessons = systemState.lmsLessons || [];
                        lessons.forEach((l) => {
                          list.push({
                            id: `lesson-${l.id}`,
                            title: `📚 Materi Baru: ${l.title}`,
                            body: `Materi ${l.subject} (Bab ${l.chapterNumber || 'Umum'}) format ${
                              l.contentType === "video" ? "🎬 Video" :
                              l.contentType === "slide" ? "📽️ Slide PPT" :
                              l.contentType === "buku" ? "📖 Buku Rujukan" :
                              l.contentType === "audio" ? "🎙️ Rekaman Suara" : "📝 Teks"
                            } telah dipublikasikan oleh Sensei.`,
                            time: "Materi Baru"
                          });
                        });
    
                        // 2. Tasks / Chapter Assessments
                        const assessments = (systemState.chapterAssessments || []).filter(
                          (a) => a.studentId === studentId
                        );
                        assessments.forEach((a) => {
                          if (a.isUnlocked) {
                            list.push({
                              id: `task-${a.id}`,
                              title: `📝 Tugas Bab ${a.chapterNumber}: ${a.title}`,
                              body: `Status: ${
                                a.status === "Telah Dinilai" 
                                  ? `✅ Telah Dinilai (Nilai: ${a.score || 0}). Catatan Sensei: "${a.notes || 'Sangat baik'}"` 
                                  : a.status === "Selesai Belajar" 
                                    ? "⏳ Menunggu Ujian Lisan & Penilaian Sensei" 
                                    : "📖 Terbuka - Silakan pelajari materi dan laporkan progress Anda!"
                              }`,
                              time: a.assessedDate || "Jadwal",
                            });
    
                            // 3. Quizzes
                            list.push({
                              id: `quiz-${a.id}`,
                              title: `✏️ Kuis Latihan Bab ${a.chapterNumber}: ${a.title}`,
                              body: `Kuis pilihan ganda interaktif untuk Bab ${a.chapterNumber} telah tersedia di tab Kuis. Uji pemahaman kosakata Anda sekarang!`,
                              time: "Aktif",
                            });
                          }
                        });
                      } else if (currentUser.role === "Pengajar" || currentUser.role === "Admin" || currentUser.role === "VVIP") {
                        // Show alerts for pending payment confirmations if Admin/VVIP
                        if (currentUser.role === "Admin" || currentUser.role === "VVIP") {
                          const pendingPayments = (systemState.registeredStudents || []).filter(
                            (s) => s.paymentStatus === "Pending"
                          );
                          pendingPayments.forEach((s) => {
                            list.push({
                              id: `payment-${s.id}`,
                              title: `💰 Validasi Pembayaran: ${s.name}`,
                              body: `Pendaftar ${s.name} mengirimkan bukti pembayaran sebesar Rp ${(s.paymentAmount || 0).toLocaleString("id-ID")}. Silakan periksa berkas dan setujui pendaftarannya.`,
                              time: "Validasi",
                            });
                          });
                        }
                      }
    
                      return list;
                    };
    
                    const displayMocks = getSynchronizedNotifications();
    
                    return (
                      <div className="space-y-4">
                        {!currentUser && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-[24px] border border-amber-200 text-xs text-amber-900 leading-normal flex items-start gap-2.5 shadow-3xs mb-1">
                            <span className="text-base shrink-0">📢</span>
                            <div>
                              <strong>Info Publik Pengunjung (Masyarakat Umum):</strong>
                              <p className="text-[10.5px] text-amber-800 mt-1 font-normal">
                                Menampilkan informasi resmi seputar <strong>Pembukaan Kelas Baru & Pendaftaran LPK SCI</strong>. Silakan masuk menggunakan akun untuk mendapatkan notifikasi personal yang sesuai dengan kelas & program pelatihan Anda.
                              </p>
                            </div>
                          </div>
                        )}
    
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h3 className="font-sans font-black text-slate-900 text-md">
                            {currentUser ? "Notifikasi Sistem Terpadu" : "Jadwal Pembukaan Kelas"}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {currentUser ? "Pembaruan harian LPK" : "Masyarakat Umum"}
                          </span>
                        </div>
    
                        <div className="space-y-3.5">
                          {/* Dynamic broadcast events */}
                          {displayEvents.map((ev) => {
                            const isStudySchedule = ev.type === "Jadwal Belajar";
                            if (isStudySchedule) {
                              return (
                                <div
                                  key={ev.id}
                                  className="bg-emerald-600 text-white p-4 rounded-[24px] border border-emerald-700 relative overflow-hidden shadow-md transition"
                                >
                                  <div className="absolute top-0 left-0 h-full w-1 bg-yellow-300"></div>
                                  <div className="flex justify-between items-start gap-2">
                                    <div>
                                      <span className="text-[8px] font-black uppercase text-yellow-300 tracking-wider bg-white/10 px-1.5 py-0.5 rounded mr-2 inline-flex items-center gap-1">
                                        <span>📚</span> JADWAL BELAJAR HARIAN
                                      </span>
                                      <h4 className="font-extrabold text-xs text-white mt-1 leading-normal">
                                        {ev.title}
                                      </h4>
                                    </div>
                                    <span className="text-[9px] text-emerald-200 font-mono leading-none whitespace-nowrap">
                                      {formatDateIndo(ev.date)}
                                    </span>
                                  </div>
                                  
                                  <p className="text-[10.5px] text-emerald-50 leading-normal mt-2 font-normal">
                                    {ev.desc}
                                  </p>
    
                                  {/* Study specific details for mobile */}
                                  <div className="bg-emerald-800/50 border border-emerald-500/20 rounded-xl p-2.5 mt-2.5 space-y-1 text-[10px] text-emerald-100">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1">
                                        <span>🕒</span>
                                        <strong>Jam Belajar:</strong> {ev.studyTime || "08:00 - selesai"}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span>🔔</span>
                                        <strong>Notif Pengingat:</strong> {ev.reminderTime || "Tepat waktu"}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span>🏫</span>
                                        <strong>Kelas:</strong> {ev.targetClass || "Semua Kelas"}
                                      </div>
                                    </div>
                                  </div>
    
                                  {/* New fields in mobile study card */}
                                  {(ev.time || ev.location || ev.url || ev.date) && (
                                    <div className="space-y-2 mt-2.5 border-t border-emerald-500/30 pt-2.5">
                                      {/* Tanggal & Waktu Pelaksanaan */}
                                      <div className="bg-emerald-850/60 border border-emerald-700/20 rounded-xl p-2.5 text-[10px] text-emerald-100 font-medium">
                                        <div className="flex flex-col gap-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <span>📅</span>
                                            <strong>Tanggal Pelaksanaan:</strong> {formatDateIndo(ev.date)}
                                          </div>
                                          {ev.time && (
                                            <div className="flex items-center gap-1.5">
                                              <span>🕒</span>
                                              <strong>Waktu:</strong> {ev.time}
                                            </div>
                                          )}
                                          {ev.location && (
                                            <div className="flex items-center gap-1.5">
                                              <span>📍</span>
                                              <strong>Lokasi:</strong> {ev.location}
                                            </div>
                                          )}
                                        </div>
                                      </div>
    
                                      {ev.url && (
                                        <div className="w-full">
                                          {ev.url.toLowerCase().includes("zoom") ? (
                                            <div className="bg-blue-600/95 border border-blue-400/30 rounded-xl p-3 flex flex-col gap-2 text-xs w-full shadow-inner">
                                              <div className="flex items-center gap-2">
                                                <div className="bg-white text-blue-600 p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                                                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                                    <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-9 12a4 4 0 110-8 4 4 0 010 8z" />
                                                  </svg>
                                                </div>
                                                <div>
                                                  <p className="font-extrabold text-yellow-300 text-[10.5px] uppercase tracking-wider">Akses Kelas Virtual Zoom</p>
                                                  <p className="text-[9.5px] text-slate-100 font-medium">Masuk otomatis via Aplikasi Zoom di HP</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 mt-0.5">
                                                <a 
                                                  href={getZoomAppLink(ev.url)} 
                                                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-3 py-2 rounded-xl text-center text-[10.5px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition"
                                                >
                                                  📱 Buka di App Zoom
                                                </a>
                                                <a 
                                                  href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="bg-emerald-700/55 text-white font-bold px-2.5 py-2 rounded-xl text-center text-[9.5px] border border-emerald-500/20"
                                                >
                                                  Browser
                                                </a>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-100 font-bold bg-emerald-850/40 p-2 rounded-xl border border-emerald-500/20">
                                              <span>🔗</span>
                                              <a 
                                                href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="hover:underline flex items-center gap-1"
                                              >
                                                Buka Tautan Acara
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            }
    
                            return (
                              <div
                                key={ev.id}
                                className="bg-indigo-800 text-white p-4 rounded-[24px] border border-slate-900 relative overflow-hidden shadow-md transition"
                              >
                                <div className="absolute top-0 left-0 h-full w-1 bg-yellow-400"></div>
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <span className="text-[8px] font-black uppercase text-yellow-350 tracking-wider bg-white/10 px-1.5 py-0.5 rounded mr-2">
                                      📢 SIARAN UTAMA
                                    </span>
                                    <h4 className="font-extrabold text-xs text-white mt-1 sm:mt-0 leading-normal">
                                      {ev.title}
                                    </h4>
                                  </div>
                                  <span className="text-[9px] text-yellow-300 font-mono leading-none whitespace-nowrap">
                                    {formatDateIndo(ev.date)}
                                  </span>
                                </div>
                                <p className="text-[10.5px] text-slate-200 leading-normal mt-2 font-normal">
                                  {ev.desc}
                                </p>
    
                                {/* Details in standard card */}
                                {(ev.time || ev.location || ev.url || ev.date) && (
                                  <div className="space-y-2 mt-2.5 border-t border-slate-800 pt-2.5">
                                    {/* Tanggal & Waktu Pelaksanaan */}
                                    <div className="bg-indigo-900 border border-slate-850 rounded-xl p-2.5 text-[10px] text-slate-300 font-medium">
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <span>📅</span>
                                          <strong>Tanggal Pelaksanaan:</strong> {formatDateIndo(ev.date)}
                                        </div>
                                        {ev.time && (
                                          <div className="flex items-center gap-1.5">
                                            <span>🕒</span>
                                            <strong>Waktu:</strong> {ev.time}
                                          </div>
                                        )}
                                        {ev.location && (
                                          <div className="flex items-center gap-1.5">
                                            <span>📍</span>
                                            <strong>Lokasi:</strong> {ev.location}
                                          </div>
                                        )}
                                      </div>
                                    </div>
    
                                    {ev.url && (
                                      <div className="w-full">
                                        {ev.url.toLowerCase().includes("zoom") ? (
                                          <div className="bg-blue-600 border border-blue-500/20 rounded-xl p-3 flex flex-col gap-2 text-xs w-full shadow-inner">
                                            <div className="flex items-center gap-2">
                                              <div className="bg-white text-[#0c4a9e] p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                                                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                                                  <path d="M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3a2 2 0 00-2 2v12a2 2 0 002 2h18a2 2 0 002-2V8a2 2 0 00-2-2zm-9 12a4 4 0 110-8 4 4 0 010 8z" />
                                                </svg>
                                              </div>
                                              <div>
                                                <p className="font-extrabold text-yellow-300 text-[10.5px] uppercase tracking-wider">Akses Kelas Virtual Zoom</p>
                                                <p className="text-[9.5px] text-slate-100 font-medium">Masuk otomatis via Aplikasi Zoom di HP</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <a 
                                                href={getZoomAppLink(ev.url)} 
                                                className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black px-3 py-2 rounded-xl text-center text-[10.5px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] active:scale-95 transition"
                                              >
                                                📱 Buka di App Zoom
                                              </a>
                                              <a 
                                                href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="bg-indigo-800 text-white font-bold px-2.5 py-2 rounded-xl text-center text-[9.5px] border border-slate-700"
                                              >
                                                Browser
                                              </a>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5 text-[9.5px] text-slate-300 font-bold bg-indigo-900 p-2 rounded-xl border border-slate-850">
                                            <span>🔗</span>
                                            <a 
                                              href={ev.url.startsWith('http') ? ev.url : `https://${ev.url}`} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="hover:underline flex items-center gap-1 text-yellow-300"
                                            >
                                              Buka Tautan Acara
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
    
                          {displayMocks.map((n) => (
                            <div
                              key={n.id}
                              className="bg-white p-4 rounded-[24px] border border-slate-100/80/90 relative overflow-hidden shadow-xs hover:border-slate-300 transition"
                            >
                              <div className="absolute top-0 left-0 h-full w-1 bg-indigo-700"></div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-extrabold text-xs text-slate-900">
                                  {n.title}
                                </h4>
                                <span className="text-[9px] text-indigo-700 font-mono leading-none whitespace-nowrap">
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-600 leading-normal mt-1.5 font-normal">
                                {n.body}
                              </p>
                            </div>
                          ))}
    
                          {displayEvents.length === 0 && displayMocks.length === 0 && (
                            <div className="bg-white border border-slate-100/80 rounded-3xl p-6 text-center space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                              <div className="h-12 w-12 bg-slate-50 text-slate-450 rounded-[24px] flex items-center justify-center mx-auto">
                                <Bell className="h-6 w-6" />
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                Belum ada jadwal pembukaan kelas terbaru yang dipublikasikan.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
  );
}
