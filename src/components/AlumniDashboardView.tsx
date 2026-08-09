import React, { useState } from "react";
import { 
  GraduationCap, 
  Copy, 
  Check, 
  Compass, 
  MessageSquare, 
  Share2, 
  Sparkles, 
  BookOpen, 
  UserPlus, 
  Info, 
  Users, 
  ArrowRight,
  MapPin,
  Clock,
  Heart,
  Calendar,
  Briefcase
} from "lucide-react";

interface AlumniDashboardViewProps {
  currentUser: any;
  systemState: any;
  onUpdateState: (category: string, action: string, data: any) => Promise<any>;
}

export default function AlumniDashboardView({
  currentUser,
  systemState,
  onUpdateState,
}: AlumniDashboardViewProps) {
  const [copied, setCopied] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionSent, setQuestionSent] = useState(false);

  // Find active student record for details
  const myActiveStudent = systemState?.activeStudents?.find(
    (s: any) => s.id === currentUser?.studentId || s.name === currentUser?.name
  );

  const referralCode = currentUser?.username || "alumni123";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const newMessage = {
      id: "MSG-" + Date.now(),
      senderId: currentUser?.username || "alumni_user",
      senderName: currentUser?.name || "Alumni",
      receiverId: "admin_shared",
      content: `[PERTANYAAN ALUMNI] ${questionText}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    if (onUpdateState) {
      await onUpdateState("messages", "add", newMessage);
    }
    setQuestionText("");
    setQuestionSent(true);
    setTimeout(() => setQuestionSent(false), 5000);
  };

  // Calculate referral stats. Registration stores the code the applicant
  // typed as `referrer` (not `referrerCode` - that field is never written
  // anywhere), and a student cannot be counted as their own referral: some
  // applicants fill the optional "Kode Referral" field with their own email
  // or name, which later resolves back to their own account once their
  // username (their email) exists.
  const myReferrals = systemState?.activeStudents?.filter(
    (s: any) =>
      s.referrer?.toLowerCase().trim() === referralCode.toLowerCase().trim() &&
      s.name?.toLowerCase().trim() !== referralCode.toLowerCase().trim()
  ) || [];

  const activeCount = myReferrals.filter((s: any) => s.status === "Aktif").length;
  const inJapanCount = myReferrals.filter((s: any) => s.status === "Di Jepang").length;

  const jobOrders = (systemState?.jobOrders || []).filter((j: any) => j.status === "Aktif");
  
  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const alumniEvents = React.useMemo(() => {
    return (systemState?.events || [])
      .filter((e: any) => {
        if (e.date && e.date < todayStr) return false;
        return e.targets && (e.targets.includes("Alumni") || e.targets.includes("Umum"));
      })
      .sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [systemState?.events, todayStr]);

  return (
    <div className="space-y-6 font-sans">
      {/* Agenda & Notifikasi Umum */}
      {alumniEvents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm relative overflow-hidden mb-6">
          <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs uppercase tracking-wider mb-4">
            <Calendar className="h-5 w-5" /> Jadwal & Notifikasi Agenda
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {alumniEvents.slice(0, 3).map((ev: any) => (
              <div key={ev.id} className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-lg font-bold">{ev.date}</span>
                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-lg font-bold">{ev.type}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{ev.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-2 line-clamp-3">{ev.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Job & Peluang Karir */}
      {jobOrders.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 shadow-sm relative overflow-hidden mb-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
               <Briefcase className="h-5 w-5" /> Peluang Order Job Terkini (Jepang)
             </div>
             <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">{jobOrders.length} Lowongan</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobOrders.slice(0, 6).map((job: any) => (
              <div key={job.id} className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{job.occupation || job.position || 'Order Job'}</h4>
                      <p className="text-[11px] font-medium text-indigo-600 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {job.location || job.region || 'Jepang'}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-600 space-y-1 mt-3">
                    <div className="flex justify-between"><span>Gaji:</span> <span className="font-bold">{job.salary || '-'}</span></div>
                    <div className="flex justify-between"><span>Kategori:</span> <span className="font-bold">{job.jobType || job.category || 'Tokutei Ginou'}</span></div>
                    <div className="flex justify-between"><span>Batas Apply:</span> <span className="font-bold">{job.scheduleRegistration || job.deadline || '-'}</span></div>
                  </div>
                </div>
                <button onClick={() => window.open(`https://wa.me/6281395090885?text=Halo%20Admin%20LPK%20SCI,%20saya%20${currentUser?.name || "Alumni"}%20tertarik%20dengan%20Job%20${job.occupation || job.position}%20di%20${job.location}.`)} className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold py-2 rounded-xl transition flex justify-center items-center gap-1">
                  Saya Tertarik <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-900/40">
        <div className="absolute -right-10 -bottom-10 opacity-10">
          <GraduationCap className="h-48 w-48 text-indigo-400 rotate-12" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-indigo-500/30 tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-pulse" /> Portal Alumni LPK SCI
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-500/30 tracking-wider">
                Active VIP Member
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight leading-none text-white">
              Selamat Datang Kembali, {currentUser?.name || "Alumni Sukses"}!
            </h1>
            <p className="text-xs text-indigo-200/80 max-w-xl font-medium leading-relaxed">
              Selamat atas kelulusan Anda! Sebagai alumni LPK Source Course Indonesia, Anda memiliki akses prioritas ke program pembelajaran lanjutan (N3-N1), peta sebaran alumni di Jepang, dan program kemitraan afiliasi resmi.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 min-w-[200px] shrink-0 text-left space-y-2">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest leading-none">Kartu Alumni Digital</p>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-300 leading-none">Nomor Induk Alumni:</p>
              <p className="font-mono text-sm font-black text-white">{myActiveStudent?.id || currentUser?.studentId || "ALUM-SCI-2026"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 3 Columns (Main Features, Stats, Questions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Continuing Education Options */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-lg text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-600" /> Kelas Lanjutan Alumni (Bilingual)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Raih level sertifikasi bahasa Jepang yang lebih tinggi untuk karir profesional Anda.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* N3 Card */}
              <div className="bg-slate-50 hover:bg-indigo-50/20 border border-slate-100 hover:border-indigo-100 rounded-2xl p-4 transition duration-200 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Online / Offline</span>
                    <span className="text-[10px] font-bold text-slate-500">3-4 Bulan</span>
                  </div>
                  <h3 className="font-display font-black text-2xl text-indigo-600">Level N3</h3>
                  <p className="text-xs font-bold text-slate-800">Menengah (Chukyu)</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed min-h-[30px]">
                    Kuasai percakapan sehari-hari lebih natural & persiapkan ujian JLPT N3.
                  </p>
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/6281395090885?text=Halo%20Admin%20LPK%20SCI,%20saya%20${currentUser?.name || "Alumni"}%20ingin%20mendaftar%20kelas%20N3.`)}
                  className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black py-2 rounded-xl transition flex items-center justify-center gap-1"
                >
                  Daftar Kelas N3 <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* N2 Card */}
              <div className="bg-slate-50 hover:bg-emerald-50/20 border border-slate-100 hover:border-emerald-100 rounded-2xl p-4 transition duration-200 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Online / Offline</span>
                    <span className="text-[10px] font-bold text-slate-500">4-6 Bulan</span>
                  </div>
                  <h3 className="font-display font-black text-2xl text-emerald-600">Level N2</h3>
                  <p className="text-xs font-bold text-slate-800">Menengah Atas (Chujokyu)</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed min-h-[30px]">
                    Tingkatkan pemahaman bacaan & pendengaran untuk karir mapan di Jepang.
                  </p>
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/6281395090885?text=Halo%20Admin%20LPK%20SCI,%20saya%20${currentUser?.name || "Alumni"}%20ingin%20mendaftar%20kelas%20N2.`)}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black py-2 rounded-xl transition flex items-center justify-center gap-1"
                >
                  Daftar Kelas N2 <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Referral Affiliate Card */}
          <div className="bg-white rounded-3xl border border-rose-100 p-6 space-y-4 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 -z-0 opacity-50" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-rose-600 font-extrabold text-xs uppercase tracking-wider">
                  <Share2 className="h-4 w-4" /> Program Afiliasi Referral Alumni
                </div>
                <h3 className="font-display font-black text-lg text-slate-900 leading-tight">
                  Bagikan Kode Referral & Bantu Teman Sukses!
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                  Ajak teman, kerabat, atau rekan kerja Anda untuk mendaftar di LPK SCI. Dapatkan bonus/reward apresiasi langsung untuk setiap pendaftar yang menggunakan kode referral unik Anda.
                </p>
              </div>

              {/* Promo box */}
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-3 rounded-2xl min-w-[150px] text-center shadow-md">
                <p className="text-[8px] font-black uppercase tracking-wider opacity-90 leading-none">Apresiasi Khusus</p>
                <p className="text-xs font-medium mt-1">Hingga</p>
                <p className="text-lg font-black tracking-tight leading-none">Rp 1.000.000</p>
                <p className="text-[8px] font-bold mt-1 opacity-80 leading-none">Per Rekomendasi</p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-4">
              <div className="md:col-span-2">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest leading-none block mb-1">Kode Referral Unik Anda:</span>
                <div className="flex items-center gap-2">
                  <span className="flex-1 bg-white border border-rose-200 rounded-xl px-4 py-2 font-mono font-black text-slate-800 text-center text-sm select-all">
                    {referralCode}
                  </span>
                  <button 
                    onClick={handleCopy}
                    className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold shadow-sm"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? "Tersalin" : "Salin Kode"}</span>
                  </button>
                </div>
              </div>

              <div className="text-center md:text-right space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500">Statistik Rujukan:</p>
                <div className="flex justify-center md:justify-end gap-3 text-xs font-bold text-slate-800">
                  <div className="bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-2xs">
                    <span className="text-rose-600 block text-sm font-black">{myReferrals.length}</span> Total Teman
                  </div>
                  <div className="bg-white border border-slate-100 px-3 py-1.5 rounded-lg shadow-2xs">
                    <span className="text-teal-600 block text-sm font-black">{activeCount + inJapanCount}</span> Sukses
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Alumni Network and Quick Questions */}
        <div className="space-y-6">
          {/* Alumni Map Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Compass className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-black text-slate-800 text-base">Alumni Network di Jepang</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ribuan alumni LPK SCI telah tersebar di berbagai kota industri di Jepang (Tokyo, Nagoya, Osaka, Chiba, Saitama, dll). Lihat peta sebaran geografis untuk memantau jejaring rekan seangkatan Anda.
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-rose-500" /> Total Kota Sebaran:</span>
                <span className="font-bold text-slate-900">45+ Prefektur</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-700">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-600" /> Total Alumni Terdeteksi:</span>
                <span className="font-bold text-slate-900">150+ Siswa</span>
              </div>
            </div>
          </div>

          {/* Quick Support Message Form */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4 shadow-xl border border-slate-800">
            <div className="flex items-center gap-2 text-yellow-400 font-extrabold text-xs uppercase tracking-wider">
              <MessageSquare className="h-4 w-4" /> Hubungi Admin / Staff SCI
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-black text-sm text-white">Butuh bantuan berkas atau administrasi?</h3>
              <p className="text-[10px] text-slate-300 leading-normal">
                Kirim pesan langsung kepada tim administrasi LPK SCI. Kami akan membalas pesan Anda sesegera mungkin di tab Chat.
              </p>
            </div>

            <form onSubmit={handleSendQuestion} className="space-y-3">
              <textarea 
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Tulis pertanyaan Anda di sini... (contoh: bantuan sertifikat lulus, pengajuan asuransi, dll)"
                rows={3}
                className="w-full text-xs rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                required
              />
              <button 
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-350 active:scale-95 text-slate-950 font-black text-[10px] uppercase py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-md shadow-yellow-500/10"
              >
                Kirim Pertanyaan
              </button>
            </form>

            {questionSent && (
              <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl p-3 text-[10px] font-bold text-center animate-fade-in flex items-center justify-center gap-1">
                <Check className="h-3.5 w-3.5" /> Pertanyaan berhasil terkirim! Silakan cek menu Chat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
