---
name: alur-perubahan
description: Alur WAJIB setiap perubahan kode LPK SCI (perbaikan bug, fitur, aturan baru) - branch dari main, uji di src/lib, pemeriksaan lokal (tsc, vitest, build), commit Bahasa Indonesia, PR, merge squash, mulai ulang branch. Pakai setiap kali akan mengubah berkas di repo ini.
---

# Alur perubahan LPK SCI

Pemilik meminta: **perbaiki → PR → merge (squash)**, lalu lanjut. Repo ini **tidak punya CI**, jadi pemeriksaan lokal adalah satu-satunya pengaman.

## 1. Siapkan branch
```bash
git fetch origin main
git checkout -B <branch-kerja> origin/main   # PR sebelumnya sudah di-merge -> mulai dari main terbaru
npm install                                   # sekali per sesi; JANGAN commit package-lock.json yang berubah
```
Branch yang hanya berisi riwayat yang sudah di-merge boleh di-push dengan `git push --force-with-lease`.

## 2. Kerjakan perubahan
- Logika (rumus, pencocokan, tanggal, ID, skor) → fungsi murni di `src/lib/<nama>.ts` + tes `src/lib/<nama>.test.ts` (vitest). Komponen/handler hanya memanggil fungsi itu.
- Server: `server.ts` + `server/handlers/*.ts` (semua tulisan lewat `POST /api/state/update`). Server boleh mengimpor `src/lib/*.ts` (pakai akhiran `.ts`).
- Komentar kode: bahasa Inggris seperti berkas sekitarnya, beri tanggal untuk keputusan penting (mis. `23-10-2026 (owner): ...`). Pesan ke pengguna: Bahasa Indonesia.
- Baca skill `aturan-data-siswa` sebelum menyentuh data siswa, nilai, pembayaran, kelas, atau tanggal.

## 3. Pemeriksaan lokal (semua harus lolos)
```bash
npx tsc --noEmit
npx vitest run
npm run build
git status --short   # pastikan tidak ada package-lock.json / dist ikut
```
Jangan pernah menghapus/melewati tes untuk membuat hijau - perbaiki penyebabnya.

## 4. Commit, PR, merge
- Pesan commit Bahasa Indonesia: judul ringkas + daftar apa & mengapa. Tanpa identitas model AI.
- Buat PR ke `main` (GitHub MCP `create_pull_request`): Ringkasan per masalah (gejala → penyebab → perbaikan) + Verifikasi (tsc, vitest, build, "belum diverifikasi live").
- Merge **squash** dengan `expectedHeadSha` = HEAD yang baru di-push.
- Perbarui `docs/SERAH-TERIMA-CLAUDE.md` bila ada aturan baru/keputusan pemilik/tindak lanjut.

## 5. Laporan ke pemilik
Bahasa Indonesia, singkat: apa yang diperbaiki dengan bahasa pengguna (bukan nama fungsi), link PR, apa yang perlu dicek setelah deploy, dan pertanyaan yang butuh keputusan.
