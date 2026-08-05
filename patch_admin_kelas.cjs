const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

// Replace StudentActivitySummary with Quick Buttons
code = code.replace(
  /<StudentActivitySummary systemState=\{systemState\} \/>/g,
  `{/* Quick Access Buttons */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('daftar')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'daftar' ? 'bg-indigo-600 text-white shadow-lg border-indigo-600 ring-2 ring-indigo-200 ring-offset-1' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <BookOpen className={\`h-5 w-5 mx-auto mb-1.5 \${activeTab === 'daftar' ? 'text-indigo-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Daftar Kelas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tambah')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'tambah' ? 'bg-violet-600 text-white shadow-lg border-violet-600 ring-2 ring-violet-200 ring-offset-1' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Plus className={\`h-5 w-5 mx-auto mb-1.5 \${activeTab === 'tambah' ? 'text-violet-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Tambah Kelas</span>
                </button>
              </div>`
);

// We need to restore the forms for Tambah Kelas Baru (Nama Kelas, Tipe Kelas, Metode Pembelajaran, Periode, Tahun).
// Since we might have deleted it, let's see what's in the form right now.
fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
console.log("Patch admin kelas done!");
