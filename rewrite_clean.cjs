const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

// 1. Add state
code = code.replace(
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");',
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");\n  const [activeTab, setActiveTab] = React.useState<"tambah" | "daftar" | "materi">("daftar");'
);

// 2. Add quick buttons
const quickButtons = `
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
              </div>
`;
code = code.replace(
  '              <StudentActivitySummary systemState={systemState} />',
  '              <StudentActivitySummary systemState={systemState} />\n' + quickButtons
);

// 3. Find the sections based on literal text
let tambahStart = code.indexOf('<h4 className="font-display font-bold text-slate-800 text-sm">\n                      Tambah Kelas Baru');
let tambahContainerStart = code.lastIndexOf('<div className="bg-white border border-slate-200', tambahStart);

let daftarStart = code.indexOf('<h4 className="font-display font-bold text-slate-800 text-sm">\n                      Daftar & Pengaturan Kelas');
let daftarContainerStart = code.lastIndexOf('<div className="bg-white border border-slate-200', daftarStart);
let tambahEnd = code.lastIndexOf('</div>\n                \n\n                {/* Daftar Kelas */}', daftarContainerStart);
if (tambahEnd === -1) {
    tambahEnd = code.lastIndexOf('</div>', daftarContainerStart); // Just before daftar
} else {
    tambahEnd += 6; // include the </div>
}


let materiStart = code.indexOf('<h4 className="font-display font-bold text-slate-800 text-sm">\n                        Pengaturan Bab');
let materiContainerStart = code.lastIndexOf('<div className="bg-white border border-slate-200', materiStart);
let daftarEnd = code.lastIndexOf('</div>', materiContainerStart);

let portalStart = code.indexOf('{selectedClassForChapters && createPortal(');
let materiEnd = code.lastIndexOf('</div>', portalStart);

let part1 = code.substring(tambahContainerStart, tambahEnd).trim();
let part2 = code.substring(daftarContainerStart, daftarEnd).trim();
let part3 = code.substring(materiContainerStart, materiEnd).trim();

// 4. Replace Table with Grid in part2
const listStartStr = '<div className="overflow-x-auto">\n                    <table';
const listEndStr = '                    </table>\n                  </div>';
const sIdx = part2.indexOf(listStartStr);
const eIdx = part2.indexOf(listEndStr) + listEndStr.length;

const listNew = `                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allClasses.map((c) => {
                      return (
                        <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-4 relative overflow-hidden group">
                          {/* Indicator */}
                          <div className={\`absolute top-0 left-0 w-1.5 h-full \${c.type === "alumni" ? "bg-emerald-500" : "bg-blue-500"}\`}></div>
                          
                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs">{c.name}</h5>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border \${
                                  c.type === "alumni"
                                    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                                }\`}>
                                  {c.type === "alumni" ? "Alumni" : "Reguler"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 font-medium mr-1">Aktif</span>
                              <button
                                type="button"
                                onClick={async () => {
                                  const newVal = !c.isActive;
                                  const baseClasses = systemState?.customization?.lmsClasses || [];
                                  const updatedClasses = baseClasses.map(item =>
                                      item.id.toLowerCase() === c.id.toLowerCase()
                                        ? { ...item, isActive: newVal }
                                        : item
                                  );
                                  await onUpdateState("customization", "update", {
                                    ...systemState?.customization,
                                    lmsClasses: updatedClasses
                                  });
                                }}
                                className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer \${
                                  c.isActive ? "bg-indigo-500" : "bg-slate-300"
                                }\`}
                              >
                                <div className={\`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out \${
                                  c.isActive ? "translate-x-5" : "translate-x-0"
                                }\`} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pl-2">
                            <div className="bg-white rounded-lg p-2 border border-slate-150">
                              <span className="block text-[9px] text-slate-400 mb-1">Periode</span>
                              <div className="flex flex-col gap-1">
                                <input
                                  type="date"
                                  value={c.startDate || ""}
                                  onChange={async (e) => {
                                    const newVal = e.target.value;
                                    const baseClasses = systemState?.customization?.lmsClasses || [];
                                    const updatedClasses = baseClasses.map(item =>
                                        item.id.toLowerCase() === c.id.toLowerCase()
                                          ? { ...item, startDate: newVal }
                                          : item
                                    );
                                    await onUpdateState("customization", "update", {
                                      ...systemState?.customization,
                                      lmsClasses: updatedClasses
                                    });
                                  }}
                                  className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <span className="text-[9px] text-slate-400 text-center leading-none">s.d.</span>
                                <input
                                  type="date"
                                  value={c.endDate || ""}
                                  onChange={async (e) => {
                                    const newVal = e.target.value;
                                    const baseClasses = systemState?.customization?.lmsClasses || [];
                                    const updatedClasses = baseClasses.map(item =>
                                        item.id.toLowerCase() === c.id.toLowerCase()
                                          ? { ...item, endDate: newVal }
                                          : item
                                    );
                                    await onUpdateState("customization", "update", {
                                      ...systemState?.customization,
                                      lmsClasses: updatedClasses
                                    });
                                  }}
                                  className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-slate-150 flex flex-col justify-between">
                              <div>
                                <span className="block text-[9px] text-slate-400 mb-1">Metode</span>
                                <select
                                  value={c.method || "Offline"}
                                  onChange={async (e) => {
                                    const newVal = e.target.value;
                                    const baseClasses = systemState?.customization?.lmsClasses || [];
                                    const updatedClasses = baseClasses.map(item =>
                                        item.id.toLowerCase() === c.id.toLowerCase()
                                          ? { ...item, method: newVal }
                                          : item
                                    );
                                    await onUpdateState("customization", "update", {
                                      ...systemState?.customization,
                                      lmsClasses: updatedClasses
                                    });
                                  }}
                                  className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 rounded p-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                                >
                                  <option value="Offline">Offline</option>
                                  <option value="Online">Online</option>
                                  <option value="Hybrid">Hybrid</option>
                                </select>
                              </div>
                              
                              <button
                                type="button"
                                onClick={async () => {
                                  if (window.confirm(\`Yakin ingin menghapus kelas "\${c.name}"?\`)) {
                                    const baseClasses = systemState?.customization?.lmsClasses || [];
                                    const updatedClasses = baseClasses.filter(item => item.id.toLowerCase() !== c.id.toLowerCase());
                                    await onUpdateState("customization", "update", {
                                      ...systemState?.customization,
                                      lmsClasses: updatedClasses
                                    });
                                  }
                                }}
                                className="mt-2 w-full p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-150 transition cursor-pointer flex items-center justify-center gap-1"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Hapus</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>`;
part2 = part2.substring(0, sIdx) + listNew + part2.substring(eIdx);

// 5. Compose back
const newContent = `
{activeTab === "tambah" && (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    ${part1}
  </div>
)}
{activeTab === "daftar" && (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    ${part2}
  </div>
)}
{activeTab === "materi" && (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
    ${part3}
  </div>
)}
`;

const before = code.substring(0, tambahContainerStart);
const after = code.substring(materiEnd);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', before + newContent + after);
console.log("Rewritten successfully!");
