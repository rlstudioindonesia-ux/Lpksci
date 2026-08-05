const fs = require('fs');
let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

// The wrapper is `              <div className="flex flex-col gap-6">`
// It ends just before `{selectedClassForChapters && createPortal(` with a `</div>`

// 1. Fix the duplicate activeTab
let newBefore = code.substring(0, code.indexOf('{/* Form Tambah Kelas */}'));
newBefore = newBefore.replace(
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");',
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");\n  const [activeTab, setActiveTab] = React.useState<"tambah" | "daftar" | "materi">("daftar");'
);

const quickButtons = `
              {/* Quick Access Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('daftar')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'daftar' ? 'bg-indigo-600 text-white shadow-lg border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <BookOpen className={\`h-5 w-5 mx-auto mb-1 \${activeTab === 'daftar' ? 'text-indigo-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Daftar Kelas</span>
                </button>
                <button
                  onClick={() => setActiveTab('tambah')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'tambah' ? 'bg-violet-600 text-white shadow-lg border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Plus className={\`h-5 w-5 mx-auto mb-1 \${activeTab === 'tambah' ? 'text-violet-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Tambah Kelas</span>
                </button>
                <button
                  onClick={() => setActiveTab('materi')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'materi' ? 'bg-blue-600 text-white shadow-lg border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Edit className={\`h-5 w-5 mx-auto mb-1 \${activeTab === 'materi' ? 'text-blue-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Silabus</span>
                </button>
              </div>
`;

newBefore = newBefore.replace(
  '              <StudentActivitySummary systemState={systemState} />',
  '              <StudentActivitySummary systemState={systemState} />\n' + quickButtons
);

const addClassFormStart = code.indexOf('{/* Form Tambah Kelas */}');
const classListStart = code.indexOf('{/* Daftar Kelas */}');
const syllabusStart = code.indexOf('{/* Manajemen Silabus & Materi Pembelajaran */}');
const portalStart = code.indexOf('{selectedClassForChapters && createPortal(');

// addClassForm is the div. Ends before classList
let addClassForm = code.substring(addClassFormStart, classListStart).trim();
// it has `</div>\n` at the end or so. But actually the div is just closed.
let classList = code.substring(classListStart, syllabusStart).trim();
let syllabus = code.substring(syllabusStart, portalStart).trim();

// syllabus ends with `</div>` (the closing of the syllabus div) and then ANOTHER `</div>` (the closing of flex container).
// Let's strip the last `</div>` from syllabus.
syllabus = syllabus.replace(/<\/div>\s*<\/div>\s*$/, '</div>'); // just remove the outer flex container closing div.

const newCode = newBefore + 
  `{activeTab === "tambah" && (\n<div className="tab-pane">\n` + addClassForm + `\n</div>\n)}\n` +
  `{activeTab === "daftar" && (\n<div className="tab-pane">\n` + classList + `\n</div>\n)}\n` +
  `{activeTab === "materi" && (\n<div className="tab-pane">\n` + syllabus + `\n</div>\n)}\n` +
  `</div>\n` + // Close the flex container
  code.substring(portalStart);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', newCode);
