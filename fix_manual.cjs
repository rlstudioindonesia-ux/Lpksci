const fs = require('fs');

let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

// The file has:
// {activeTab === "tambah" && (
// <>
// <div ...> (Form Tambah Kelas)
// </form>
// </div>
// </>
// )}
//
// {activeTab === "daftar" && (
// <>
// <div ...> (Daftar Kelas)
// </table>
// </div>
// </div>
// </div>
// ... wait, the table closing tags were mismatched!

code = code.replace(
  '{activeTab === "tambah" && (\n                <>\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">',
  '<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">'
);
code = code.replace(
  '                </>\n                )}\n\n                {activeTab === "daftar" && (\n                <>\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">',
  '                \n\n                {/* Daftar Kelas */}\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">'
);

// For Silabus, it starts at `{/* Manajemen Silabus & Materi Pembelajaran */}`
// But what is right before it?
// Let's find it using substring!
let silabusStart = code.indexOf('{/* Manajemen Silabus & Materi Pembelajaran */}');
code = code.substring(0, silabusStart) + '\n                ' + code.substring(silabusStart);

// Let's just remove the tab states
code = code.replace(/const \[activeTab, setActiveTab\] = React.useState<"tambah" \| "daftar" \| "materi">.*?\n/g, '');

let quickBtnStart = code.indexOf('{/* Quick Access Buttons */}');
let quickBtnEnd = code.indexOf('              <div className="flex flex-col gap-6">');
if (quickBtnStart !== -1 && quickBtnEnd !== -1) {
  code = code.substring(0, quickBtnStart) + code.substring(quickBtnEnd);
}

fs.writeFileSync('/tmp/AdminKelasSegment.clean2.tsx', code);
