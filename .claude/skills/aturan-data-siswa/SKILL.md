---
name: aturan-data-siswa
description: Aturan bisnis & pengaman data LPK SCI yang sudah disepakati pemilik - rumus Siswa Aktif, grup status, tab Alumni, nilai kuis (tidak dihapus, nilai terbaik, berbobot, < 75 ikut rata-rata, essay ketat), berkas siswa, tanggal WIB, pencocokan siswa, ID, sinkron antar-instance. Pakai sebelum mengubah apa pun yang menyentuh siswa, nilai, kuis, pembayaran, kelas, tanggal, atau sinkron data.
---

# Aturan data siswa LPK SCI

Semua aturan ini sudah ada di `src/lib` dan dijaga tes. **Pakai fungsinya, jangan menulis ulang rumus inline.**

## Status & hitungan siswa — `src/lib/studentStatusGroups.ts`
- Status resmi: `Belajar`, `On Proges Job` (ejaan resmi), `On Progres JFT/JLPT/SSW`, `Diklat SO`, `Lulus`, `Di Jepang`, `Dikeluarkan`.
- `getStudentStatusGroup`: Lulus → grup Sertifikasi JFT/JLPT/SSW; "On Progres Job" (salah eja lama) → On Proges Job; "Berhenti" → Dikeluarkan; kosong/tak dikenal → Belajar.
- **Siswa Aktif** (pemilik): Belajar + On Progres Job + On Progres JFT + Lulus sertifikasi → `isActiveStudent` / `countActiveStudents`. Bukan Diklat SO, Di Jepang, Dikeluarkan.
- **Tab Alumni** = hanya Di Jepang → `isAlumniTabStudent`.
- **"Lulus" tetap siswa** (pemilik, 23-10-2026): kelas & sensei TIDAK dikosongkan, akun tetap Siswa. Hanya "Di Jepang" yang menjadikan alumni → `isAlumniStatusValue` (server), `isStudentAlumni` (tanpa "Lulus"). Jangan pakai `["Lulus", "Di Jepang"]` untuk menentukan alumni.
- Tabel per status/kelas: `countStudentsByStatusGroup`, filter: `studentMatchesStatusGroup`.
- Form edit Admin/VVIP: status PENDAFTARAN (`status`) terpisah dari status PROGRES siswa (`studentStatus`). Jangan pernah menyalin status pendaftaran ke siswa aktif.

## Nilai & kuis
- **Nilai tidak pernah dihapus** (termasuk saat jadwal kuis diubah).
- Ulang kuis: rekaman ditimpa, **nilai terbaik** disimpan → `src/lib/quizRetake.ts`. Koreksi Sensei boleh menurunkan nilai.
- Skor CBT berbobot `points` per soal → `src/lib/quizScoring.ts` (sama dengan modal koreksi).
- Rata-rata: `isGradedAssessment` menghitung "Telah/Sudah Dinilai" **dan "Selesai Belajar" yang punya skor** (nilai < 75 ikut).
- Essay: `src/lib/essayAnswer.ts` — sama dengan kunci/varian (`,` `;` `/` `|`), tanpa "mengandung kunci"; typo 1 huruf hanya untuk ≥ 5 huruf; tanpa kunci = diterima (ditinjau Sensei).
- Simpan kuis (batch) hanya mengganti soal di kelas & sub-judul yang sama → `src/lib/quizBatchScope.ts`.

## Berkas siswa — `src/lib/studentDocuments.ts`
17 berkas asli + Sertifikat JFT/JLPT/NAT, SSW 1, SSW 2, LPK SCI, COE, CV. Daftar berkas baru tambahkan di `EXTRA_STUDENT_DOCUMENTS` (dipakai pengelola Admin, Pengaturan Akun, tab Dokumen LMS, rapor Admin/VVIP, dan server).

## Tanggal — `src/lib/dateUtils.ts`
"Hari ini" = WIB: peramban `todayLocalISO()` / `toLocalISODate()`, server `todayJakartaISO()`. Jangan `new Date().toISOString().split("T")[0]` dan jangan `timestamp.startsWith(tanggal)`.

## Identitas & pencocokan
- Cari siswa: `findRecordIndex` (`src/lib/recordMatching.ts`) = id → email → nama **unik**. Jangan mencocokkan lewat nama saja.
- Jangan fallback ke `"SIS-001"` atau ID acak untuk akun tanpa studentId.
- ID baru: `uniqueIdSuffix()`; ID berurutan SIS-/JOB-: `nextSequentialId` + `collectUsedStudentIds` (`src/lib/idGenerator.ts`). Jangan `Date.now().slice(-4)` atau `length + 1`.
- ID tagihan bawaan: `defaultStudentPaymentId` (nama lengkap) — `src/lib/paymentIds.ts`.
- Jenis kelamin: `normalizeGender` (`src/lib/gender.ts`); jangan default "Laki-laki".

## Keuangan
Entri pemasukan Buku Kas otomatis mengikuti pembayarannya (`planLedgerSyncForPayment`, `src/lib/paymentLedger.ts`): dihapus bila pembayaran batal/dihapus, diperbarui bila nominal berubah.

## Sinkron data (Cloud Run banyak instance, state di memori)
- Efek samping server yang mengubah sebagian kolom siswa → `mergeEntityFieldsToFirestore`, bukan menulis ulang seluruh objek.
- Update siswa membaca data terbaru dari Firestore dulu; perubahan siswa disiarkan lewat `system/sync_changes`.
- Peramban mengirim **hanya kolom yang diubah** (jangan `...student`); kelas/pengaturan dikirim sebagai diff (`src/lib/classListDiff.ts`).
- Resync: Firestore acuan (item terhapus tidak hidup lagi); ETag `/api/state` berisi ID instance.

## Ditunda (jangan dikerjakan tanpa persetujuan pemilik)
Login/keamanan: password `123456`/`adminadmin` diterima untuk akun apa pun, server tanpa autentikasi, `/api/request-reset` mengembalikan tautan reset, `firestore.rules` terbuka. Lihat `docs/SERAH-TERIMA-CLAUDE.md`.

## Tagihan (23-10-2026)
- Tagihan milik siswa ditentukan oleh `studentId`; `studentName` hanya untuk tampilan & data lama → `paymentMatchesStudent` (`src/lib/paymentOwner.ts`). Jangan memfilter tagihan dengan `p.studentName === nama` lagi.
- Tagihan baru selalu membawa `studentId`; nama yang dimiliki beberapa siswa tidak pernah ditebak.
