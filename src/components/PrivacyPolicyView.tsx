import React from "react";
import { ShieldCheck, FileText, Lock, Eye, CheckCircle2, Building, Scale, ShieldAlert } from "lucide-react";

export default function PrivacyPolicyView() {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 max-w-4xl mx-auto animate-fade-in text-left">
      
      {/* Decorative Title Block */}
      <div className="bg-gradient-to-r from-indigo-700 to-[#001d3d] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
          <ShieldCheck className="h-48 w-48" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-yellow-400 text-indigo-900 rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="font-sans font-black text-xl uppercase tracking-wider text-yellow-400">
                Kebijakan Privasi
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                LPK Source Course Indonesia (Pati Indo-Japan)
              </p>
            </div>
          </div>
          <span className="bg-white/10 text-white font-mono text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">
            Versi Efektif: Juni 2026
          </span>
        </div>
      </div>

      {/* Intro commitment statement */}
      <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl flex gap-4 items-start">
        <FileText className="h-6 w-6 text-indigo-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Komitmen Utama Kami</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            LPK Source Course Indonesia berkomitmen penuh untuk melindungi privasi data pribadi siswa, alumni, pengajar, dan calon pendaftar sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) yang berlaku di Republik Indonesia. Keamanan data Anda adalah prioritas utama kami untuk mewujudkan proses rekrutmen kerja Jepang yang transparan, aman, dan tepercaya.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-2">
        <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-2xl space-y-2">
          <div className="h-8 w-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
            <Lock className="h-4 w-4" />
          </div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Terenkripsi Aman</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">Seluruh data identitas diri dan berkas digital penting dienkripsi penuh menggunakan teknologi SSL bersertifikat.</p>
        </div>

        <div className="p-4 bg-blue-50/40 border border-blue-100/60 rounded-2xl space-y-2">
          <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
            <Eye className="h-4 w-4" />
          </div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Akses Transparan</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">Siswa memiliki hak penuh melihat hasil nilai belajar, administrasi, dan memperbarui profil melalui pengaturan akun.</p>
        </div>

        <div className="p-4 bg-amber-50/40 border border-amber-100/60 rounded-2xl space-y-2">
          <div className="h-8 w-8 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <Scale className="h-4 w-4" />
          </div>
          <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">Regulasi Resmi</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">Penyaluran berkas untuk proses magang & Tokutei Ginou hanya ditujukan ke mitra terdaftar Kemnaker / BP2MI.</p>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-6 pt-2">
        
        {/* Section 1 */}
        <div className="space-y-3">
          <h3 className="font-sans font-black text-slate-950 text-sm flex items-center gap-2 uppercase tracking-wider border-b pb-1.5 text-indigo-700">
            <span>1.</span> Jenis Data Pribadi Yang Kami Kumpulkan
          </h3>
          <p className="text-xs text-slate-600">
            Saat Anda mendaftar atau menggunakan sistem informasi bimbingan belajar LPK, kami mengumpulkan data yang diperlukan untuk proses administrasi, pelatihan, dan proses keberangkatan ke Jepang:
          </p>
          <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
            <div className="flex gap-2.5 items-start">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                <strong className="text-slate-950">Data Identitas Utama:</strong> Nama lengkap, nomor identitas (KIK/KTP/KK), tempat & tanggal lahir, jenis kelamin, serta foto profil terbaru untuk pencocokan berkas imigrasi.
              </p>
            </div>
            <div className="flex gap-2.5 items-start">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                <strong className="text-slate-950">Informasi Kontak & Komunikasi:</strong> Alamat e-mail, nomor telepon aktif (WhatsApp), alamat domisili di Indonesia, serta kontak darurat keluarga kandung.
              </p>
            </div>
            <div className="flex gap-2.5 items-start">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                <strong className="text-slate-950">Dokumen Akademik & Kompetensi:</strong> Riwayat pendidikan, sertifikat kelulusan JLPT/JFT-Basic, transkrip nilai, sertifikat keahlian Tokutei Ginou, asrama bimbingan, serta nilai kuis harian.
              </p>
            </div>
            <div className="flex gap-2.5 items-start">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600">
                <strong className="text-slate-950">Data Keuangan & Pembayaran:</strong> Riwayat pembayaran program bimbingan, angsuran cicilan pendidikan, dan bukti transfer pembayaran VA/bank.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-3">
          <h3 className="font-sans font-black text-slate-950 text-sm flex items-center gap-2 uppercase tracking-wider border-b pb-1.5 text-indigo-700">
            <span>2.</span> Tujuan Penggunaan Data Anda
          </h3>
          <p className="text-xs text-slate-600">
            Seluruh informasi pribadi yang telah Anda serahkan kepada sistem kami hanya akan digunakan untuk tujuan operasional berikut tanpa ada kompromi:
          </p>
          <ul className="list-decimal pl-5 space-y-2 text-xs text-slate-600">
            <li><strong>Administrasi Akademik internal LPK Pati:</strong> Mengelola absensi harian, nilai kuis modul Kanji, evaluasi ujian kelas, sertifikasi, serta pencatatan status kelulusan diklat prafasilitas.</li>
            <li><strong>Proses Seleksi Kerja & Interview (Mensetsu):</strong> Menyalurkan profil kandidat ke pihak SO (Sending Organization) dan AO di Jepang untuk keperluan pencocokan lowongan kerja (matching job).</li>
            <li><strong>Pelaporan Instansi Resmi Pemerintah:</strong> Melakukan registrasi data calon Pekerja Migran Indonesia (PMI) ke Kemnaker RI, SISKOP2MI, dan dinas tenaga kerja setempat sesuai regulasi yang berlaku.</li>
            <li><strong>Layanan Keuangan Terpadu:</strong> Memvalidasi tagihan biaya diklat, mencatat riwayat cicilan mandiri, dan menerbitkan kwitansi resmi digital berstempel LPK.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="space-y-3">
          <h3 className="font-sans font-black text-slate-950 text-sm flex items-center gap-2 uppercase tracking-wider border-b pb-1.5 text-indigo-700">
            <span>3.</span> Keamanan Data & Kebocoran Informasi
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kami menggunakan infrastruktur penyimpanan server cloud yang terenkripsi SSL dengan pengawasan berlapis. Kami memastikan tidak ada akses pihak ketiga tanpa izin tertulis dari peserta didik. Kami menerapkan kebijakan <strong>Zero-Leaked-Data</strong> untuk menjamin keamanan sertifikat orisinal dan data keluarga peserta.
          </p>
        </div>

        {/* Section 4 */}
        <div className="space-y-3">
          <h3 className="font-sans font-black text-slate-950 text-sm flex items-center gap-2 uppercase tracking-wider border-b pb-1.5 text-indigo-700">
            <span>4.</span> Hak Akses & Penghapusan Data Pengguna
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Siswa dan alumni berhak untuk memperbarui informasi profil mereka kapan saja melalui tab pengaturan akun. Jika Anda ingin mengundurkan diri dan meminta penghapusan permanen atas seluruh berkas digital pendaftaran di LPK kami, Anda dapat menghubungi helpdesk admin resmi kami untuk proses penutupan akun secepatnya.
          </p>
        </div>

      </div>

      {/* Bottom Legal Alert */}
      <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-center">
        <Building className="h-5 w-5 text-indigo-700 shrink-0" />
        <span className="text-[11px] text-slate-600">
          Diterbitkan secara sah oleh jajaran Direksi LPK Source Course Indonesia. Alamat fisik: Jalan Raya Bongsri, Muktiharjo, Kec. Tlogowungu, Kabupaten Pati, Jawa Tengah.
        </span>
      </div>

    </div>
  );
}
