---
name: cek-bug
description: Cara mencari bug di LPK SCI saat pemilik meminta "cek bug lainnya" - daftar pola bug yang sudah pernah ditemukan, area yang sudah/belum diperiksa, dan cara melapor. Pakai bersama skill alur-perubahan.
---

# Cek bug LPK SCI

## Pola bug yang terbukti sering muncul (cari ini dulu)
1. **Salinan data usang menimpa data baru** — peramban mengirim seluruh objek (`...student`, seluruh `lmsClasses`/`customization`) atau server menulis seluruh objek dari memori instance lain. Cari: `...student`, `...activeStudent`, `syncEntityToFirestore("activeStudents"` di efek samping.
2. **Pencocokan lewat nama** — `s.name === x.name`, `find(... id || name ...)`. Siswa bernama sama (Muhammad Rizki, Siti Aminah) tertukar.
3. **ID tidak unik** — `Date.now().toString().slice(-N)`, `length + 1`, potongan nama (`slice(0, 6)`), fallback `"SIS-001"`.
4. **Tanggal UTC** — `toISOString().split("T")[0]`, `.startsWith(hari/bulan)` pada timestamp.
5. **Rumus ganda** — hitungan/filter yang ditulis inline di beberapa layar dengan hasil berbeda (status, siswa aktif, alumni, skor).
6. **Data hilang/hidup lagi** — penghapusan yang tidak ikut ke Firestore, atau merge yang mempertahankan item terhapus.
7. **Form yang mengisi default diam-diam** — nilai bawaan (mis. "Laki-laki", status pendaftaran) yang ikut tersimpan.

## Area yang sudah diperiksa (Okt 2026)
Status/jumlah siswa, sinkron antar-instance, CV, berkas & sertifikat, nilai/kuis/essay, ID, Buku Kas/pembayaran, absen/presensi & tanggal, hapus akun/siswa, pendaftaran & persetujuan, Job Order, kelas/pengaturan, inventaris, upload, ETag/resync.

## Belum diperiksa mendalam
Galeri/slideshow, notifikasi (`src/lib/notifications.ts`), Afiliasi/referral, kalender/acara, pajak, Android/PWA, peta sebaran, Alumni dashboard.

## Cara melapor ke pemilik
Tabel "Bug → akibatnya bagi pengguna", bahasa sederhana. Hal yang mengubah aturan bisnis atau berisiko menghapus data: **tanya dulu**, jangan langsung diubah. Masalah login/keamanan: ditunda sampai pemilik setuju.
