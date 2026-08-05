const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

code = code.replace('{activeTab === "tambah" && (\n                {/* Form Tambah Kelas */}', '{activeTab === "tambah" && (\n                <>');
code = code.replace('{activeTab === "daftar" && (\n                {/* Daftar Kelas */}', '{activeTab === "daftar" && (\n                <>');
code = code.replace('{activeTab === "materi" && (\n                {/* Manajemen Silabus & Materi Pembelajaran */}', '{activeTab === "materi" && (\n                <>');

code = code.replace(/<\/div>\n                \)}\n/g, '</div>\n                </>\n                )}\n');

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
