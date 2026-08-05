const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

code = code.replace('{activeTab === "tambah" && (\n                {/* Form Tambah Kelas */}', '{activeTab === "tambah" && (\n                <div className="tab-pane">\n                {/* Form Tambah Kelas */}');
code = code.replace('{activeTab === "daftar" && (\n                {/* Daftar Kelas */}', '{activeTab === "daftar" && (\n                <div className="tab-pane">\n                {/* Daftar Kelas */}');
code = code.replace('{activeTab === "materi" && (\n                {/* Manajemen Silabus & Materi Pembelajaran */}', '{activeTab === "materi" && (\n                <div className="tab-pane">\n                {/* Manajemen Silabus & Materi Pembelajaran */}');

code = code.replace(/<\/div>\n                \)\}\n\n                \{activeTab === "daftar" && \(/, '</div>\n                </div>\n                )}\n\n                {activeTab === "daftar" && (');
code = code.replace(/<\/div>\n                \)\}\n\n                \{activeTab === "materi" && \(/, '</div>\n                </div>\n                )}\n\n                {activeTab === "materi" && (');
code = code.replace(/<\/div>\n                \)\}\n              \{selectedClassForChapters && createPortal\(/, '</div>\n                </div>\n                )}\n              {selectedClassForChapters && createPortal(');

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
