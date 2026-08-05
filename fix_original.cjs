const fs = require('fs');
let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

code = code.replace('{activeTab === "tambah" && (\n', '');
code = code.replace('{activeTab === "daftar" && (\n', '');
code = code.replace('                )}\n\n                {/* Daftar Kelas */}', '                {/* Daftar Kelas */}');

fs.writeFileSync('/tmp/AdminKelasSegment_original.tsx', code);
