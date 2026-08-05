const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

const searchState = '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");';
const replaceState = `  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");
  const [activeTab, setActiveTab] = React.useState<"tambah" | "daftar" | "materi">("daftar");`;

const searchBtns = '              <StudentActivitySummary systemState={systemState} />';
const replaceBtns = `              <StudentActivitySummary systemState={systemState} />

              {/* Quick Access Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('daftar')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'daftar' ? 'bg-indigo-600 text-white shadow-lg border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <BookOpen className={\`h-5 w-5 mx-auto mb-1 \${activeTab === 'daftar' ? 'text-indigo-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">Daftar Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tambah')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'tambah' ? 'bg-violet-600 text-white shadow-lg border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Plus className={\`h-5 w-5 mx-auto mb-1 \${activeTab === 'tambah' ? 'text-violet-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">Tambah Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('materi')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'materi' ? 'bg-blue-600 text-white shadow-lg border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Edit className={\`h-5 w-5 mx-auto mb-1 \${activeTab === 'materi' ? 'text-blue-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block mt-1">Silabus</span>
                </button>
              </div>`;

code = code.replace(searchState, replaceState);
code = code.replace(searchBtns, replaceBtns);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
