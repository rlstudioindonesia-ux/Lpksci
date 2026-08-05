const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const targetBtn = `<button 
                  onClick={() => setProgressTabMode("penilaian")} 
                  className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 \${progressTabMode === "penilaian" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}\`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Penilaian Tugas
                </button>`;

const replacementBtn = `<button 
                  onClick={() => setProgressTabMode("penilaian")} 
                  className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 \${progressTabMode === "penilaian" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}\`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Penilaian Tugas
                </button>
                <button 
                  onClick={() => setProgressTabMode("sikap")} 
                  className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 \${progressTabMode === "sikap" ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100"}\`}
                >
                  <Star className="w-3.5 h-3.5" />
                  Penilaian Kelayakan (5S)
                </button>`;

if (code.includes(targetBtn)) {
  code = code.replace(targetBtn, replacementBtn);
  fs.writeFileSync('src/components/LmsView.tsx', code);
  console.log("Patched button successfully");
} else {
  console.log("Could not find button target");
}
