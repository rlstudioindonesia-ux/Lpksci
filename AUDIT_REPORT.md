# 📋 Laporan Audit Bug & Perbaikan Sistem (LMS & REST API)

Dokumen ini mencatat temuan audit, analisis bug, dan langkah perbaikan yang telah diterapkan secara bertahap pada sistem LMS dan REST API.

---

## 🔍 Ringkasan Temuan & Perbaikan

### 1. 🔓 Bug Akses Buka / Tutup Bab (LMS Chapter Lock)
- **Gejala Bug**: TombolSensei "Aktifkan Bab" (`handleActivateChapterInLms`) tidak dapat membuka akses Bab tertentu (misalnya Bab 2, 5, atau 21) bagi siswa. Bab tetap terkunci meskipun Sensei sudah mengklik tombol aktifkan.
- **Penyebab Utama**:
  1. Di `LmsView.tsx`, fungsi `getClassChaptersList` memetakan bab default dengan `isActive: ch.number === 1`.
  2. Di `LmsBabSegment.tsx`, kondisi `isChapterUnlocked` awalnya ditulis:
     `const isChapterUnlocked = chapter.isActive !== false && Number(chapter.number) <= Number(classActiveChapter);`
     Kondisi ini mewajibkan nomor bab harus `<= classActiveChapter`. Jika Sensei mengaktifkan Bab 21 tetapi `classActiveChapter` bernilai 1, maka evaluasi `21 <= 1` bernilai `false`, sehingga bab tetap dianggap terkunci.
- **Perbaikan Diterapkan**:
  1. Di `LmsView.tsx` (`getClassChaptersList`), fallback template bab diubah agar `isActive: true` secara default, sehingga semua bab tersedia untuk diatur oleh Sensei.
  2. Di `LmsBabSegment.tsx` (baris 544 & 788), logika `isChapterUnlocked` diperbarui menjadi:
     `const isChapterUnlocked = chapter.isActive === true || (chapter.isActive !== false && Number(chapter.number) <= Number(classActiveChapter || 1));`
     Bab yang diaktifkan secara eksplisit (`isActive === true`) oleh Sensei kini **selalu terbuka (unlocked)** tanpa terhalang nomor bab.

---

### 2. 📝 Sinkronisasi Koreksi Essay & Perhitungan Nilai
- **Gejala Bug**: Hasil koreksi jawaban essay oleh Sensei di modal review kadang tidak memperbarui skor total atau hilang saat halaman direfresh.
- **Penyebab Utama**:
  Perhitungan nilai essay secara otomatis di modal review hanya menggunakan pencocokan string secara kaku (*exact match*), tanpa toleransi variasi spasi atau tanda baca.
- **Perbaikan Diterapkan**:
  1. Menambahkan helper `checkEssayAnswer` di `StudentQuizReviewModal.tsx` untuk pencocokan jawaban essay dengan toleransi spasi, kapitalisasi, dan berbagai opsi kunci jawaban (dipisahkan koma/titik koma/garis miring).
  2. Memastikan `handleSaveCorrection` menyusun payload `updatedPayload` lengkap dan mengirimnya ke `server.ts` via `onUpdateState("chapterAssessments", "update", ...)` untuk memperbarui `chapterAssessments` dan `studentAssessmentsMap`.

---

### 3. 🖼️ Tampilan Pop-Up / Modal Auto-Centering & Kejelasan Visual
- **Gejala Bug**: Pada layar tertentu, modal review kuis tergeser ke atas atau terpotong pada tampilan perangkat seluler.
- **Penyebab Utama**:
  Pembungkus modal (*overlay container*) membutuhkan pengaturan posisi `fixed inset-0` yang eksplisit dengan flex centering dan penanganan scroll bawaan.
- **Perbaikan Diterapkan**:
  Modal `StudentQuizReviewModal.tsx` menggunakan `fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto` dengan container dalam `max-w-4xl h-[92vh]` dan area isi `overflow-y-auto flex-1`. Tampilan kini otomatis terpusat (*auto-center*) dan responsif di semua perangkat.

---

### 4. ⏱️ CBT Timer & Restart Quiz
- **Gejala Bug**: Pengulangan kuis (*retake*) kadang mempertahankan timestamp awal sehingga timer kuis langsung habis (auto-submit).
- **Perbaikan Diterapkan**:
  1. Komponen `CBTTimer` diberi toleransi waktu mount (*grace period*).
  2. Penganggilan `<CBTTimer>` di `LmsView.tsx` diberikan atribut `key={cbtEffectiveStartTime}` untuk memastikan komponen me-remount secara bersih dengan durasi penuh saat retake dimulai.

---

### 5. 📡 REST API & Health Checking
- **Status Endpoint**:
  - `GET /api/health` — OK (200)
  - `GET /api/state` — OK (200)
  - `POST /api/state/update` — OK (200)
  - `GET /api/broadcast-notifications` — OK (200)
- **Script Pengujian Otomatis**:
  Telah dibuat script `/scripts/audit-bugs.js`. Jalankan perintah berikut kapan saja untuk memverifikasi ulang seluruh fungsi di atas:
  ```bash
  node scripts/audit-bugs.js
  ```
