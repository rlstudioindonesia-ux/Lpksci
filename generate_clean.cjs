const fs = require('fs');

let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

// The file is a mess of conditionals, but the actual components (form, table/grid, silabus) are mostly intact inside it.
// Let's strip EVERYTHING related to activeTab.

code = code.replace(/\{activeTab === "tambah" && \(\s*/g, '');
code = code.replace(/\{activeTab === "daftar" && \(\s*/g, '');
code = code.replace(/\{activeTab === "materi" && \(\s*/g, '');
code = code.replace(/<\/>\n/g, '');
code = code.replace(/\s*\)\}\n/g, '\n');

// Also strip the `const [activeTab, setActiveTab]` lines
code = code.replace(/const \[activeTab, setActiveTab\] = React.useState<"tambah" \| "daftar" \| "materi">.*?\n/g, '');

// Also strip Quick Access Buttons
let quickBtnStart = code.indexOf('{/* Quick Access Buttons */}');
if (quickBtnStart !== -1) {
  let quickBtnEnd = code.indexOf('              <div className="flex flex-col gap-6">');
  if (quickBtnEnd !== -1) {
    code = code.substring(0, quickBtnStart) + code.substring(quickBtnEnd);
  }
}

fs.writeFileSync('/tmp/AdminKelasSegment.tsx.clean', code);
