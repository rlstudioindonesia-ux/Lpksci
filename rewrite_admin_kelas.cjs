const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

// 1. Add activeTab state
code = code.replace(
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");',
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");\n  const [activeTab, setActiveTab] = React.useState<"tambah" | "daftar" | "materi">("daftar");'
);

// 2. Add Quick Access Buttons
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

code = code.replace(
  '              <StudentActivitySummary systemState={systemState} />',
  '              <StudentActivitySummary systemState={systemState} />\n' + quickButtons
);

// 3. Wrap "Form Tambah Kelas"
code = code.replace(
  '              {/* Grid Layout: Add Class form vs Class list */}\n              <div className="flex flex-col gap-6">\n                {/* Form Tambah Kelas */}',
  '              {/* Grid Layout: Add Class form vs Class list */}\n              <div className="flex flex-col gap-6">\n                {activeTab === "tambah" && (\n                {/* Form Tambah Kelas */}'
);

// Form Tambah Kelas ends at the first `</form>\n                </div>` and Daftar Kelas begins.
code = code.replace(
  '                    </button>\n                  </form>\n                </div>\n\n                {/* Daftar Kelas */}',
  '                    </button>\n                  </form>\n                </div>\n                )}\n\n                {activeTab === "daftar" && (\n                {/* Daftar Kelas */}'
);

// Daftar Kelas ends at `</table>\n                  </div>\n                </div>\n\n                {/* Manajemen Silabus & Materi Pembelajaran */}`
// Wait, I will just replace the table with Grid anyway.

// First, wrap "Manajemen Silabus". Where does Daftar Kelas end?
// Look at line `                {/* Manajemen Silabus & Materi Pembelajaran */}`
code = code.replace(
  '                {/* Manajemen Silabus & Materi Pembelajaran */}',
  '                )}\n\n                {activeTab === "materi" && (\n                {/* Manajemen Silabus & Materi Pembelajaran */}'
);

// Where does "Manajemen Silabus" end?
// It ends just before `{selectedClassForChapters && createPortal(`
code = code.replace(
  '              {selectedClassForChapters && createPortal(',
  '                )}\n              {selectedClassForChapters && createPortal('
);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
