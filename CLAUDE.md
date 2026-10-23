# CLAUDE.md — LPK SCI

- Jawab pemilik dalam **Bahasa Indonesia**, ringkas, dengan bahasa pengguna (bukan nama fungsi).
- Baca **`docs/SERAH-TERIMA-CLAUDE.md`** di awal sesi (status terkini, keputusan pemilik, tindak lanjut terbuka).
- Skill proyek di `.claude/skills/` (dimuat otomatis):
  - `alur-perubahan` — setiap perubahan: uji di `src/lib`, `tsc` + `vitest` + `build`, PR, merge squash;
  - `aturan-data-siswa` — aturan bisnis & pengaman data (Siswa Aktif, nilai kuis, berkas, tanggal WIB, pencocokan siswa, ID, sinkron);
  - `cek-bug` — pola bug yang sering muncul dan cara melapor.
- Jangan menyertakan identitas model AI di commit, PR, atau kode.
- Masalah login/keamanan **ditunda** sampai pemilik setuju.
