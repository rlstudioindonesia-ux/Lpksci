---
name: bug-checker
description: Panduan dan checklist audit bug satu per satu untuk pengujian fitur LMS, REST API, koreksi essay, timer CBT, dan posisi modal di AI Studio.
---

# Skill Audit Bug & Quality Assurance (Cek Bug Satu per Satu)

Dokumen skill ini digunakan untuk menguji dan memverifikasi integritas sistem secara sistematis, satu demi satu module.

## 🛠️ Checklist Pengujian Fitur & REST API

### 1. REST API & Server Endpoints
- **Health Check**: `GET /api/health` harus merespons status `200 OK`.
- **State Synchronization**: `GET /api/state` dan `POST /api/state/update` harus mengirim dan menerima JSON state lengkap tanpa merusak struktur data.
- **Authentication**: `POST /api/login`, `POST /api/register`, dan `POST /api/auth/validate` tervalidasi dengan benar.
- **Broadcast & Uploads**: `POST /api/broadcast-notification`, `GET /api/broadcast-notifications`, `POST /api/upload`.

### 2. Fitur Akses Buka/Tutup Bab (LMS Chapter Lock)
- **Logika Active Chapter**: Menggunakan `handleSetClassActiveChapter(targetCls, chapterNum, setActiveFlag)`.
- **Properti `isActive`**: Memastikan status `isActive: true/false` pada item bab tersimpan di array `chapters` / `mathChapters` kelas di state global `customization.lmsClasses`.
- **Sensitivitas Tombol**: Tombol Sensei untuk "Aktifkan Bab" (`handleActivateChapterInLms`) dan "Tutup Akses Bab" (`handleDeactivateChapterInLms`) secara otomatis meng-update state server via REST API `/api/state/update`.

### 3. Koreksi Essay & Sinkronisasi Nilai
- **Penilaian Fleksibel (`checkEssayAnswer`)**: Mencocokkan jawaban essay siswa dengan kunci jawaban secara toleran terhadap spasi berlebih, kapitalisasi, dan variasi format.
- **Modal Review (`StudentQuizReviewModal`)**: Ketika Sensei mengubah nilai essay atau memilih opsi status benar/salah:
  1. `handleSaveCorrection` memperbarui total skor (`score`, `percentage`).
  2. Mengirim payload `updatedPayload` yang disinkronkan ke `chapterAssessments` dan `studentAssessmentsMap`.
  3. Memanggil `onUpdateState("chapterAssessments", ...)` agar nilai tercatat permanen.

### 4. Pop-Up / Modal Auto-Centering & Visual Clarity
- **Fixed Overlay Centering**: Modal harus memakai container Tailwind `fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto`.
- **Visibility**: Background backdrop gelap semi-transparan membuat pop-up menonjol dan terbaca jelas tanpa terpotong batas layar.

### 5. CBT Timer & Retake Quiz Restart
- **Grace Period Mount**: Timer `CBTTimer` menyertakan toleransi awal saat dipasang agar tidak langsung auto-submit jika timestamp pernah terlewati.
- **Remount On Retake**: Menggunakan `key={cbtEffectiveStartTime}` untuk memastikan timer me-reset hitungan mundur dari durasi penuh ketika siswa memulai ujian ulang (retake).

---

## ⚡ Jalankan Audit Otomatis
Untuk menjalankan pengujian otomatis di terminal server, jalankan command:
```bash
node scripts/audit-bugs.js
```
