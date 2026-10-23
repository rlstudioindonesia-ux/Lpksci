# Serah Terima untuk Sesi Claude Berikutnya (LPK SCI)

Terakhir diperbarui: 23-10-2026. Baca berkas ini dulu sebelum melanjutkan pekerjaan di repo `rlstudioindonesia-ux/Lpksci`.

Skill Claude Code ada di `.claude/skills/` (`alur-perubahan`, `aturan-data-siswa`, `cek-bug`) dan `CLAUDE.md` di akar repo.

## Cara kerja dengan pemilik

- Pemilik berkomunikasi dalam **Bahasa Indonesia**; jawab dalam Bahasa Indonesia, ringkas, tanpa istilah teknis berlebihan.
- Alur yang diminta pemilik: **perbaiki → PR → merge (squash)**. Pemilik sudah meminta "kalau sudah, PR dan merge dulu".
- Setelah PR di-merge, mulai ulang branch kerja dari `main` terbaru (nama branch sama, `git push --force-with-lease` boleh karena isinya hanya riwayat yang sudah di-merge).
- Repo ini **tidak punya CI**. Sebelum push selalu jalankan:
  ```bash
  npm install            # sekali per sesi (package-lock tidak di-commit ulang)
  npx tsc --noEmit
  npx vitest run
  npm run build
  ```
- Jangan menyertakan identitas model AI di commit/PR/kode.
- Komentar kode: bahasa Inggris (mengikuti gaya berkas), pesan ke pengguna: Bahasa Indonesia, tanggal di komentar penting (mis. `23-10-2026`).

## Arsitektur singkat

- `server.ts` + `server/handlers/*.ts`: Express di Cloud Run, **beberapa instance**, masing-masing menyimpan seluruh state di memori; Firestore = sumber kebenaran.
- Semua tulisan lewat `POST /api/state/update` (`dataType`, `action`, `payload`) → `server/handlers/index.ts`.
- Peramban: `src/App.tsx` mem-polling `GET /api/state` tiap ~25 detik (ETag per instance), `handleUpdateState` mengirim perubahan.
- Logika murni + tes ada di `src/lib/*.ts` (`*.test.ts`, vitest). Tambahkan logika baru di sana agar bisa diuji.

## Aturan bisnis yang sudah disepakati pemilik

| Aturan | Lokasi |
|---|---|
| **Siswa Aktif = Belajar + On Progres Job + On Progres JFT + Lulus sertifikasi JFT/JLPT** (bukan Diklat SO, Di Jepang, Dikeluarkan) | `src/lib/studentStatusGroups.ts` (`isActiveStudent`, `countActiveStudents`) |
| Hitungan per status: "Lulus" masuk grup Sertifikasi JFT/JLPT/SSW; status kosong/tak dikenal = Belajar; "On Progres Job" (salah eja) = "On Proges Job" | `getStudentStatusGroup` |
| **Nilai kuis tidak pernah dihapus**; ulang kuis menimpa rekaman yang sama, **nilai terbaik** yang disimpan; koreksi Sensei boleh menurunkan nilai | `src/lib/quizRetake.ts`, `server/handlers/lms.ts` |
| Nilai CBT berbobot poin per soal (sama dengan modal koreksi Sensei) | `src/lib/quizScoring.ts` |
| Simpan kuis hanya mengganti soal di kelas & sub-judul yang sama | `src/lib/quizBatchScope.ts` |
| Rata-rata nilai **ikut menghitung nilai < 75** (status "Selesai Belajar" dengan skor) | `src/lib/scoreAveraging.ts` (`isGradedAssessment`) |
| Essay ketat: harus sama dengan kunci/varian (abaikan huruf besar, spasi, tanda baca), typo 1 huruf untuk jawaban >= 5 huruf; "mengandung kunci" TIDAK lagi benar | `src/lib/essayAnswer.ts` |
| Tab **Alumni** = hanya siswa **Di Jepang** | `isAlumniTabStudent` |
| **Rujukan alumni**: kode tidak peka huruf besar/spasi; tidak dihitung: ditolak, rujukan diri sendiri, duplikat pendaftar-siswa; "Sukses" = jadi Siswa Aktif atau Di Jepang; total ikut pendaftar yang menunggu | `src/lib/referrals.ts` |
| 6 berkas tambahan: Sertifikat JFT/JLPT/NAT, SSW 1, SSW 2, LPK SCI, COE, CV | `src/lib/studentDocuments.ts` |
| Tanggal "hari ini" = WIB (peramban: `todayLocalISO`, server: `todayJakartaISO`) | `src/lib/dateUtils.ts` |

## Pola pengaman yang sudah dipasang (jangan dibongkar)

- **Status/data siswa tertimpa antar-instance**: catatan perubahan `system/sync_changes` (`publishEntityChange`, `applyStudentChangeFeed`), baca-sebelum-tulis di update siswa, `mergeEntityFieldsToFirestore` untuk efek samping (hanya kolom yang berubah).
- **Resync**: `loadStateFromFirestore` menjadikan Firestore acuan (item terhapus tidak hidup lagi), kecuali tulisan lokal < 2 menit.
- **Kelas/pengaturan**: App mengirim diff (`lmsClassesDiff`, kunci customization yang berubah), server menerapkan (`src/lib/classListDiff.ts`).
- **Pencocokan siswa**: id → email → nama unik (`src/lib/recordMatching.ts`); jangan mencocokkan lewat nama saja.
- **ID baru**: `uniqueIdSuffix()` / `nextSequentialId()` (`src/lib/idGenerator.ts`); jangan `Date.now().slice(-4)` atau `length + 1`.
- **ID tagihan bawaan**: `defaultStudentPaymentId` (nama lengkap), `src/lib/paymentIds.ts`.
- **Buku Kas**: entri pemasukan otomatis mengikuti pembayaran (`src/lib/paymentLedger.ts`).
- Jangan fallback ke `"SIS-001"` untuk akun tanpa studentId.
- Jenis kelamin dinormalisasi lewat `normalizeGender` (`src/lib/gender.ts`).
- **Update pendaftar tidak pernah membuat pendaftar baru** (`src/lib/registrationUpdate.ts`): target = pendaftar (id) → siswa aktif (id) → pendaftar (email/nama unik) → 404. Pendaftar asli hanya lewat `/api/register`.
- **Hapus pendaftar tidak menghapus siswa aktif**; akun login ikut terhapus hanya lewat id/email dan tidak untuk pendaftar "hantu" (id sama dengan siswa aktif, `isPhantomRegistration`).

## PR yang sudah di-merge di sesi ini

- #63 jumlah siswa, status reset, CV, 6 berkas, ID bentrok, Buku Kas, siswa bernama sama, tanggal WIB, nilai kuis
- #64 data terhapus tidak muncul lagi, ETag per instance, batasi resync paksa
- #65 diff kelas/pengaturan (bab tidak tertutup lagi)
- #66 sertifikat di rapor Admin/VVIP, status tidak tertimpa form edit, jenis kelamin, nilai berbobot, tanpa SIS-001, CV per studentId, rumus Siswa Aktif, dokumen ini
- #67 nilai < 75 ikut rata-rata, essay diperketat, tab Alumni = Di Jepang
- #68 skill `.claude/skills` + `CLAUDE.md`
- #69 pendaftar "hantu" di Siswa Baru (update berkas siswa aktif membuat pendaftar baru), hapus pendaftar tidak lagi menghapus siswa aktif
- #70 pembersihan otomatis pendaftar hantu + tutup celah auto-sync yang menulis ulang siswa aktif sebagai pendaftar
- berikutnya: satu rumus rujukan alumni (Admin/VVIP/dasbor alumni), pengurutan aman untuk data tanpa tanggal/nama

## Tindak lanjut terbuka

1. **Keamanan/login (DITUNDA atas permintaan pemilik — jangan dikerjakan tanpa persetujuan):**
   - login menerima `123456`/`adminadmin` untuk akun apa pun; email VVIP/username admin + `123456` masuk sebagai VVIP/Admin;
   - server tanpa autentikasi (`/api/state`, `/api/state/update` terbuka untuk siapa pun);
   - `/api/request-reset` mengembalikan tautan reset langsung ke peminta;
   - `firestore.rules` terbuka penuh.
2. **Sudah diputuskan pemilik (23-10-2026) dan diterapkan:** nilai < 75 ikut rata-rata, essay diperketat, tab Alumni = Di Jepang. Sisa: rata-rata nilai & kehadiran di peramban masih mencocokkan siswa lewat nama juga (sengaja dibiarkan karena data lama); essay tanpa kunci jawaban tetap dianggap benar (ditinjau Sensei).
3. **Data lama yang mungkin sudah rusak** (perbaikan hanya mencegah kejadian baru): siswa berstatus "Terverifikasi"/"Disetujui" (dari form edit lama), tagihan `PAY-<6 huruf>-…` yang tertukar, entri Buku Kas yang saling menimpa. Bisa dibuat skrip pemeriksa bila pemilik minta.
4. **Pendaftar "hantu" dibersihkan otomatis** (disetujui pemilik 23-10-2026): `cleanupPhantomRegistrations` berjalan setiap server memuat/resync data; menghapus pendaftar yang ID-nya sama dengan siswa aktif atau tanpa nama/email/HP. Hanya pendaftar yang dihapus, siswa aktif & akun tidak disentuh. Jumlahnya tercatat di log server (`[Cleanup]`).
5. Semua perubahan belum diverifikasi langsung di produksi — minta pemilik menguji alur utama setelah deploy.
