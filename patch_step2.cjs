const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

// 1. Wrap Tambah Kelas Baru
code = code.replace(
  '                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">\n                  <div>\n                    <h4 className="font-display font-bold text-slate-800 text-sm">\n                      Tambah Kelas Baru',
  '                {activeTab === "tambah" && (\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">\n                  <div>\n                    <h4 className="font-display font-bold text-slate-800 text-sm">\n                      Tambah Kelas Baru'
);

code = code.replace(
  '                  </form>\n                </div>\n                \n\n                {/* Daftar Kelas */}',
  '                  </form>\n                </div>\n                )}\n\n                {/* Daftar Kelas */}'
);

// 2. Wrap Daftar Kelas & Grid Rewrite
let daftarBlockStart = code.indexOf('                {/* Daftar Kelas */}\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">');
if (daftarBlockStart !== -1) {
  code = code.replace(
    '                {/* Daftar Kelas */}\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">',
    '                {activeTab === "daftar" && (\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">'
  );
}

const listStartStr = '<div className="overflow-x-auto">\n                    <table';
const listEndStr = '                    </table>\n                  </div>';
const sIdx = code.indexOf(listStartStr);
const eIdx = code.indexOf(listEndStr) + listEndStr.length;

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
code = code.substring(0, sIdx) + listNew + code.substring(eIdx);

// Wrap Silabus
let closingDivBeforeSilabus = code.lastIndexOf('</div>', code.indexOf('{/* Manajemen Silabus & Materi Pembelajaran */}'));
code = code.substring(0, closingDivBeforeSilabus) + '</div>\n                )}\n' + code.substring(closingDivBeforeSilabus + 6);


let silabusStartStr = '{/* Manajemen Silabus & Materi Pembelajaran */}\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">';
if (code.includes(silabusStartStr)) {
  code = code.replace(
    silabusStartStr,
    '{activeTab === "materi" && (\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">'
  );
} else {
  console.log("Silabus not found");
}

let closingDivBeforePortal = code.lastIndexOf('</div>', code.indexOf('{selectedClassForChapters && createPortal('));
code = code.substring(0, closingDivBeforePortal) + '</div>\n                )}\n' + code.substring(closingDivBeforePortal + 6);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
