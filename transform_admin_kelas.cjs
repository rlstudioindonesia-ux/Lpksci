const fs = require('fs');

let code = fs.readFileSync('/tmp/AdminKelasSegment.tsx.bak', 'utf8');

// We have the file. Let's just find the parts.
const addClassFormStart = code.indexOf('{/* Form Tambah Kelas */}');
const classListStart = code.indexOf('{/* Daftar Kelas */}');
const syllabusStart = code.indexOf('{/* Manajemen Silabus & Materi Pembelajaran */}');
const portalStart = code.indexOf('{selectedClassForChapters && createPortal(');

if (addClassFormStart === -1 || classListStart === -1 || syllabusStart === -1 || portalStart === -1) {
  console.log("Could not find boundaries");
  process.exit(1);
}

const beforeAddClass = code.substring(0, addClassFormStart);
const addClassForm = code.substring(addClassFormStart, classListStart);
const classList = code.substring(classListStart, syllabusStart);
const syllabus = code.substring(syllabusStart, portalStart);
const afterPortal = code.substring(portalStart);

let newBefore = beforeAddClass.replace(
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

const newCode = newBefore + 
  `{activeTab === "tambah" && (<div className="tab-pane">\n` + addClassForm + `</div>)}\n` +
  `{activeTab === "daftar" && (<div className="tab-pane">\n` + classList + `</div>)}\n` +
  `{activeTab === "materi" && (<div className="tab-pane">\n` + syllabus + `</div>)}\n` +
  afterPortal;

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', newCode);
console.log("Transformed successfully");

