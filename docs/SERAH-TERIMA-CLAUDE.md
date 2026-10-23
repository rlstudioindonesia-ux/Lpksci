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
| **"Lulus" tetap siswa**: kelas & sensei tetap, akun tetap Siswa; alumni hanya "Di Jepang" | `isAlumniStatusValue`, `isStudentAlumni` |
| **Rujukan alumni**: kode tidak peka huruf besar/spasi; tidak dihitung: ditolak, rujukan diri sendiri, duplikat pendaftar-siswa; "Sukses" = jadi Siswa Aktif atau Di Jepang; total ikut pendaftar yang menunggu | `src/lib/referrals.ts` |
| 6 berkas tambahan: Sertifikat JFT/JLPT/NAT, SSW 1, SSW 2, LPK SCI, COE, CV | `src/lib/studentDocuments.ts` |
| Tanggal "hari ini" = WIB (peramban: `todayLocalISO`, server: `todayJakartaISO`) | `src/lib/dateUtils.ts` |

## Pola pengaman yang sudah dipasang (jangan dibongkar)

- **Status/data siswa tertimpa antar-instance**: catatan perubahan `system/sync_changes` (`publishEntityChange`, `applyStudentChangeFeed`), baca-sebelum-tulis di update siswa, `mergeEntityFieldsToFirestore` untuk efek samping (hanya kolom yang berubah).
- **Resync**: `loadStateFromFirestore` menjadikan Firestore acuan (item terhapus tidak hidup lagi), kecuali tulisan lokal < 2 menit.
- **Kelas/pengaturan**: App mengirim diff (`lmsClassesDiff`, kunci customization yang berubah), server menerapkan (`src/lib/classListDiff.ts`).
- **Pencocokan siswa**: id → email → nama unik (`src/lib/recordMatching.ts`); jangan mencocokkan lewat nama saja. Data siswa milik akun yang login: `findStudentForUser`; akun milik siswa: `findStudentUserIndex`.
- **ID baru**: `uniqueIdSuffix()` / `nextSequentialId()` (`src/lib/idGenerator.ts`); jangan `Date.now().slice(-4)` atau `length + 1`.
- **ID tagihan bawaan**: `defaultStudentPaymentId` (nama lengkap; nama+ID bila ada siswa bernama sama), `src/lib/paymentIds.ts`.
- **Tagihan milik siswa = `studentId`** (`src/lib/paymentOwner.ts`, 23-10-2026). Aturannya:
  - `paymentMatchesStudent`: cocok lewat ID bila keduanya punya, lewat nama hanya untuk tagihan lama/manual;
  - server mengisi `studentId` saat tagihan dibuat; tagihan lama diisi otomatis saat load bila namanya unik (`linkPaymentsToStudents`);
  - nama di tagihan mengikuti nama siswa terbaru (`syncPaymentStudentNames`);
  - saat pendaftar disetujui, tagihan pindah REG→SIS (`movePaymentsToStudent`);
  - halaman tagihan memisahkan siswa bernama sama ("Nama (SIS-001)", `buildBillingEntries`);
  - siswa melihat tagihannya lewat record siswa (`findStudentForUser`), bukan nama akun.
- **Buku Kas**: entri pemasukan otomatis mengikuti pembayaran (`src/lib/paymentLedger.ts`); entri gaji (kode P1, `salaryId`) otomatis mengikuti data gaji yang Lunas, diubah, atau dihapus (`src/lib/salaryLedger.ts`, di server — jangan tambah entri kas gaji dari peramban).
- Jangan fallback ke `"SIS-001"` untuk akun tanpa studentId.
- Jenis kelamin dinormalisasi lewat `normalizeGender` (`src/lib/gender.ts`).
- **Update pendaftar tidak pernah membuat pendaftar baru** (`src/lib/registrationUpdate.ts`): target = pendaftar (id) → siswa aktif (id) → pendaftar (email/nama unik) → 404. Pendaftar asli hanya lewat `/api/register`.
- **Hapus pendaftar tidak menghapus siswa aktif**; akun login ikut terhapus hanya lewat id/email dan tidak untuk pendaftar yang sudah jadi siswa (`isConvertedRegistration`).
- **Pendaftar yang sudah jadi siswa disembunyikan di server** (`visibleRegistrations`, `hideConvertedRegistrations`); jangan diganti dengan penghapusan otomatis.

## PR yang sudah di-merge di sesi ini

- #63 jumlah siswa, status reset, CV, 6 berkas, ID bentrok, Buku Kas, siswa bernama sama, tanggal WIB, nilai kuis
- #64 data terhapus tidak muncul lagi, ETag per instance, batasi resync paksa
- #65 diff kelas/pengaturan (bab tidak tertutup lagi)
- #66 sertifikat di rapor Admin/VVIP, status tidak tertimpa form edit, jenis kelamin, nilai berbobot, tanpa SIS-001, CV per studentId, rumus Siswa Aktif, dokumen ini
- #67 nilai < 75 ikut rata-rata, essay diperketat, tab Alumni = Di Jepang
- #68 skill `.claude/skills` + `CLAUDE.md`
- #69 pendaftar "hantu" di Siswa Baru (update berkas siswa aktif membuat pendaftar baru), hapus pendaftar tidak lagi menghapus siswa aktif
- #70 pembersihan otomatis pendaftar hantu + tutup celah auto-sync yang menulis ulang siswa aktif sebagai pendaftar
- #71 satu rumus rujukan alumni (Admin/VVIP/dasbor alumni), pengurutan aman untuk data tanpa tanggal/nama
- #72 pendaftar hantu disembunyikan di server (tidak lagi dihapus otomatis berulang)
- #73 akun siswa tidak lagi jadi Alumni karena nama sama (saat server mulai), impor pajak tidak menghitung pemasukan dua kali
- #74 status "Lulus" tetap siswa (kelas/sensei/akun tidak diubah)
- #75 siswa bernama sama tidak lagi melihat/mengubah data siswa lain (`findStudentForUser` di ~20 layar + notifikasi)
- #76 keamanan Tahap 1 (tiket sesi, aturan kata sandi, Google diverifikasi server, audit log-only)
- #77 reset kata sandi lewat email yang benar-benar berlaku (tautan email + server), tutup reset lama yang membocorkan tautan
- #78 keamanan Tahap 2 di balik sakelar (hak akses per peran, data dipangkas per peran, Midtrans simulasi ditutup)
- #79 tagihan ditautkan ke nomor siswa (siswa bernama sama terpisah, ganti nama tidak melepas tagihan, tagihan ikut saat pendaftar disetujui)
- #80 edit Buku Kas tidak lagi mengubah kode jadi "P1 Gaji" / tidak menambah nominal tagihan, Lowongan dibaca ulang sebelum ditulis, panel berkas pendaftar hanya kirim kolom yang berubah
- #81 galeri kosong tetap kosong, agenda/materi/pengaturan/galeri dibaca ulang sebelum ditulis (`server/freshRead.ts`), nilai kuis dihitung server, kunci jawaban tidak dikirim sebelum dikumpulkan
- #82 gaji ↔ Buku Kas sinkron di server, persentase kehadiran ikut koreksi absen
- berikutnya: notifikasi tertarget tidak lagi tersebar ke semua siswa, kirim notifikasi massal khusus staf (saat sakelar), kuota kelas tanpa siswa dikeluarkan & tanpa akun Sensei, data dimuat ulang saat logout

## Tindak lanjut terbuka

1. **Keamanan/login — disetujui pemilik 23-10-2026, dikerjakan BERTAHAP.**
   - **Tahap 1 (selesai):**
     - tiket sesi bertanda tangan (`server/sessions.ts`, header `Authorization: Bearer`, dipasang otomatis oleh `installAuthFetch` di `src/lib/sessionToken.ts`);
     - aturan kata sandi (`src/lib/loginPolicy.ts`): sandi bawaan (123456/adminadmin/admin123) hanya berlaku sampai akun punya `passwordChangedAt`, dan login dengan sandi bawaan WAJIB ganti (`ForcePasswordChangeModal`, `/api/auth/change-password`);
     - login Google diverifikasi server (`/api/auth/google`, `server/googleIdToken.ts`);
     - akun Google tidak bisa login dengan sandi `google-auth-user`;
     - email berisi "admin" tidak lagi otomatis Admin;
     - `/api/auth/validate` memakai tiket bila ada.
     - Permintaan TANPA tiket masih DIIZINKAN tetapi DICATAT (`GET /api/auth/audit`, khusus Admin/VVIP, per instance).
   - **Tahap 2 (kode SELESAI, sakelar MATI):**
     - `src/lib/apiAccess.ts` (`authorizeStateUpdate`): hak akses per peran di `/api/state/update`. Admin/VVIP semua. Pengajar: data mengajar, siswa (update), kelas via `customization` (hanya kunci kelas), izin/laporan/kontrak atas nama sendiri. Siswa/Alumni: data sendiri saja, kolom staf dibuang (status, kelas, nilai, dll.); tagihan hanya unggah bukti dan status dipaksa "Pending".
     - `src/lib/stateScope.ts` (`scopeStateForViewer`): `GET /api/state` dipangkas untuk non-staf. Siswa: data sendiri penuh, data orang lain hanya kolom publik, tanpa jawaban kuis orang lain. Tanpa staff-only (`cashLedger`, `salaries`, `taxes`, `logs`, `inventory`, HR). Pengunjung: data situs publik saja.
     - Middleware menolak tanpa tiket (401 `AUTH_REQUIRED`; peramban otomatis minta login ulang). Tetap terbuka: `GET /api/state` (dipangkas) dan `POST /api/upload` (formulir pendaftaran).
     - **Menyala hanya bila** env `AUTH_ENFORCE=1` **dan** `SESSION_SECRET` (>= 16 karakter) diisi di Cloud Run. Selama mati: penolakan dicatat sebagai "AKAN DITOLAK" di `GET /api/auth/audit`.
     - Urutan menyalakan: isi `SESSION_SECRET` → tunggu semua orang login ulang beberapa hari → cek audit (cari "AKAN DITOLAK" yang ternyata fitur sah, sesuaikan `apiAccess.ts`) → isi `AUTH_ENFORCE=1`.
     - Ikut diperbaiki: tombol Midtrans (simulasi) tidak lagi menandai tagihan LUNAS sendiri; login Google lewat redirect diverifikasi server (tidak lagi memberi Admin ke email berisi "admin" / Pengajar ke "sensei").
     - Kuis: nilai CBT siswa SELALU dihitung ulang di server (`gradeSubmissionOnServer`, `src/lib/quizScoring.ts`; hanya untuk siswa yang teridentifikasi tiket, koreksi Sensei tidak ditimpa). Kunci jawaban (`QUIZ_ANSWER_KEY_FIELDS`) hanya dikirim ke siswa untuk kuis yang sudah ia kumpulkan (berlaku saat sakelar menyala). Sisa: saat ulang kuis, kunci kuis lama masih terlihat.
   - **Tahap 3:**
     - kunci `firestore.rules`. PENTING: server memakai Firebase *client* SDK tanpa login, jadi aturan tidak bisa dikunci sebelum server memakai firebase-admin atau akun layanan;
     - reset kata sandi: SUDAH dikerjakan lebih dulu (pemilik memilih lewat email). Detailnya:
       - `src/lib/emailPasswordReset.ts`: Firebase mengirim tautan masuk lewat email (email-link sign-in), lalu `ResetPasswordView` mengirim ID token terverifikasi ke `/api/auth/reset-with-email`, dan server yang menyimpan sandi baru;
       - `/api/request-reset` dan `/api/reset-password` lama ditutup (410);
       - pemilik WAJIB mengaktifkan "Email link (passwordless sign-in)" di Firebase Console > Authentication > Sign-in method > Email/Password.
2. **Sudah diputuskan pemilik (23-10-2026) dan diterapkan:** nilai < 75 ikut rata-rata, essay diperketat, tab Alumni = Di Jepang. Sisa: rata-rata nilai & kehadiran di peramban masih mencocokkan siswa lewat nama juga (sengaja dibiarkan karena data lama); essay tanpa kunci jawaban tetap dianggap benar (ditinjau Sensei).
3. **Data lama yang mungkin sudah rusak** (perbaikan hanya mencegah kejadian baru): siswa berstatus "Terverifikasi"/"Disetujui" (dari form edit lama), tagihan `PAY-<6 huruf>-…` yang tertukar, entri Buku Kas yang saling menimpa. Bisa dibuat skrip pemeriksa bila pemilik minta.
4. **Pendaftar "hantu" disembunyikan, TIDAK dihapus otomatis** (keputusan pemilik 23-10-2026, menggantikan pembersihan otomatis #70 yang membuat pendaftar muncul-hilang berulang): `hideConvertedRegistrations` membuang dari memori server (bukan dari Firestore) pendaftar yang orangnya sudah siswa aktif (ID sama, atau email DAN nama sama; kecuali pendaftar alumni berstatus "Disetujui") dan pendaftar kosong. Berjalan setelah load, resync, dan change feed. Karena tidak ada di memori, pendaftar itu tidak pernah tampil dan tidak ditulis ulang.
5. **Status "Lulus" = tetap siswa** (pemilik 23-10-2026, diterapkan): kelas/sensei tidak dikosongkan, akun tidak dijadikan Alumni. Siswa Lulus yang SEBELUMNYA sudah terlanjur dikosongkan kelasnya/dijadikan Alumni tidak dipulihkan otomatis; Admin cukup memilih kelasnya lagi (akun otomatis kembali Siswa).
6. Semua perubahan belum diverifikasi langsung di produksi — minta pemilik menguji alur utama setelah deploy.
