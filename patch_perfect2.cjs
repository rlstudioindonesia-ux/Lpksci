const fs = require('fs');

let code = fs.readFileSync('/tmp/AdminKelasSegment.clean2.tsx', 'utf8');

// Add activeTab
code = code.replace(
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");',
  '  const [currCurriculumSubject, setCurrCurriculumSubject] = React.useState<"Bahasa Jepang" | "SSW">("Bahasa Jepang");\n  const [activeTab, setActiveTab] = React.useState<"daftar" | "tambah">("daftar");'
);

const quickBtns = `
              {/* Quick Access Buttons */}
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
              </div>`;

code = code.replace(
  '              <StudentActivitySummary systemState={systemState} />\n\n              <div className="flex flex-col gap-6">',
  '              <StudentActivitySummary systemState={systemState} />\n\n' + quickBtns + '\n              <div className="flex flex-col gap-6">'
);

// Wrap Form Tambah
code = code.replace(
  '<div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">\n                  <div>\n                    <h4 className="font-display font-bold text-slate-800 text-sm">\n                      Tambah Kelas Baru',
  '{activeTab === "tambah" && (\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in zoom-in-95 duration-200">\n                  <div>\n                    <h4 className="font-display font-bold text-slate-800 text-sm">\n                      Tambah Kelas Baru'
);

code = code.replace(
  '                  </form>\n                </div>\n                \n\n                {/* Daftar Kelas */}',
  '                  </form>\n                </div>\n                )}\n                \n\n                {/* Daftar Kelas */}'
);

// Wrap Daftar Kelas
code = code.replace(
  '                {/* Daftar Kelas */}\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4">',
  '                {/* Daftar Kelas */}\n                {activeTab === "daftar" && (\n                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in zoom-in-95 duration-200">'
);

// New Grid layout for list
const listNew = `                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allClasses.map((c) => {
                      return (
                        <div key={c.id} className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-4 relative overflow-hidden group shadow-sm hover:shadow-md transition">
                          {/* Indicator */}
                          <div className={\`absolute top-0 left-0 w-1.5 h-full \${c.type === "alumni" ? "bg-emerald-500" : "bg-blue-500"}\`}></div>
                          
                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm mb-1">{c.name}</h5>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border \${
                                  c.type === "alumni"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                    : "bg-blue-50 text-blue-700 border-blue-150"
                                }\`}>
                                  {c.type === "alumni" ? "Alumni" : "Reguler"}
                                </span>
                                <span className={\`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border \${
                                  c.isActive
                                    ? "bg-green-50 text-green-700 border-green-150"
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                }\`}>
                                  {c.isActive ? "Aktif" : "Nonaktif"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Power Toggle */}
                              <button
                                type="button"
                                onClick={async () => {
                                  const baseClasses = systemState?.customization?.lmsClasses || [];
                                  const updatedClasses = [...baseClasses];
                                  const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === c.id.toLowerCase());
                                  if (targetIdx !== -1) {
                                    updatedClasses[targetIdx] = {
                                      ...updatedClasses[targetIdx],
                                      isActive: !updatedClasses[targetIdx].isActive
                                    };
                                  } else {
                                    updatedClasses.push({
                                      id: c.id,
                                      name: c.name,
                                      isActive: !c.isActive,
                                      type: c.type
                                    });
                                  }
                                  await onUpdateState("customization", "update", {
                                    ...systemState?.customization,
                                    lmsClasses: updatedClasses
                                  });
                                }}
                                className={\`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer \${
                                  c.isActive ? "bg-indigo-500" : "bg-slate-200"
                                }\`}
                                title={c.isActive ? "Nonaktifkan" : "Aktifkan"}
                              >
                                <div className={\`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out \${
                                  c.isActive ? "translate-x-6" : "translate-x-0"
                                }\`} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pl-2">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
                              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Jadwal / Periode</span>
                              {(() => {
                                let selectedMonth = "Juni";
                                let selectedYear = "2026";
                                if (c.period) {
                                  const parts = c.period.split(" ");
                                  if (parts.length === 2) {
                                    selectedMonth = parts[0];
                                    selectedYear = parts[1];
                                  }
                                }
                                
                                const updatePeriod = async (m, y) => {
                                  const baseClasses = systemState?.customization?.lmsClasses || [];
                                  const updatedClasses = [...baseClasses];
                                  const targetIdx = updatedClasses.findIndex(item => item.id.toLowerCase() === c.id.toLowerCase());
                                  const newPeriod = \`\${m} \${y}\`;
                                  if (targetIdx !== -1) {
                                    updatedClasses[targetIdx] = {
                                      ...updatedClasses[targetIdx],
                                      period: newPeriod
                                    };
                                  } else {
                                    updatedClasses.push({
                                      id: c.id,
                                      name: c.name,
                                      isActive: c.isActive,
                                      type: c.type,
                                      period: newPeriod
                                    });
                                  }
                                  await onUpdateState("customization", "update", {
                                    ...systemState?.customization,
                                    lmsClasses: updatedClasses
                                  });
                                };

                                return (
                                  <div className="flex flex-col gap-1.5">
                                    <select
                                      value={selectedMonth}
                                      onChange={async (e) => await updatePeriod(e.target.value, selectedYear)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-300 transition cursor-pointer"
                                    >
                                      {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={selectedYear}
                                      onChange={async (e) => await updatePeriod(selectedMonth, e.target.value)}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-300 transition cursor-pointer"
                                    >
                                      {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })()}
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 flex flex-col justify-between">
                              <div>
                                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Metode</span>
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
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-300 transition cursor-pointer"
                                >
                                  <option value="Offline">Offline</option>
                                  <option value="Online">Online</option>
                                  <option value="Hybrid">Hybrid</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-2 pl-2 pt-2 border-t border-slate-100">
                             <button
                                type="button"
                                onClick={() => {
                                  // @ts-ignore
                                  const classChapters = c.chapters || (typeof CHAPTERS_LIST !== 'undefined' ? CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })) : []);
                                  // @ts-ignore
                                  const classMathChapters = c.mathChapters || (typeof MATH_CHAPTERS_LIST !== 'undefined' ? MATH_CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })) : []);
                                  
                                  setSelectedClassForChapters({
                                    ...c,
                                    chapters: classChapters,
                                    mathChapters: classMathChapters
                                  });
                                  
                                  const nextNum = classChapters.length > 0
                                     ? Math.max(...classChapters.map((ch: any) => ch.number)) + 1
                                     : 1;
                                  setNewChapterNumber(nextNum);
                                  setNewChapterTitle("");
                                  setNewChapterJapaneseTitle("");
                                  setNewChapterDesc("");
                                  setEditingChapterNumber(null);
                                }}
                                className="flex-1 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl font-bold text-[10px] uppercase cursor-pointer transition flex flex-col items-center justify-center gap-0.5"
                              >
                                <span className="flex items-center gap-1.5"><BookOpen className="h-3 w-3"/> Silabus & Materi</span>
                                <span className="text-[8.5px] opacity-75 capitalize">
                                  {/* @ts-ignore */}
                                  {(c.chapters || (typeof CHAPTERS_LIST !== 'undefined' ? CHAPTERS_LIST : [])).filter((ch: any) => ch.isActive !== false).length} Bab JP • {(c.mathChapters || (typeof MATH_CHAPTERS_LIST !== 'undefined' ? MATH_CHAPTERS_LIST : [])).filter((ch: any) => ch.isActive !== false).length} Bab SSW
                                </span>
                              </button>
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
                                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-slate-200 hover:border-red-200 transition cursor-pointer"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>`;
                  
code = code.replace(/<div className="overflow-x-auto">[\s\S]*?<\/table>\s*<\/div>/, listNew);

// Because we wrapped Daftar Kelas in `{activeTab === "daftar" && (`, we need to close it.
// We close it right before `              </div>\n\n              {selectedClassForChapters && createPortal(`
code = code.replace(
  '                </div>\n              </div>\n\n              {selectedClassForChapters && createPortal(',
  '                </div>\n                )}\n              </div>\n\n              {selectedClassForChapters && createPortal('
);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
console.log("Rewrite complete!");
