const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');
// Remove the wrappers I added
code = code.replace(/\{activeTab === "tambah" && \(\s*<div className="tab-pane">/g, '');
code = code.replace(/\{activeTab === "daftar" && \(\s*<div className="tab-pane">/g, '');
code = code.replace(/\{activeTab === "materi" && \(\s*<div className="tab-pane">/g, '');

code = code.replace(/<\/div>\s*<\/div>\s*\)\}\s*(<div className="bg-white border)/g, '</div>\n                $1');
code = code.replace(/<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>/g, '</div>\n              </div>'); // Just clean up the end manually later.
fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
