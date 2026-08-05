const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

const alumniListRegex = /\{\/\* Bagian Kelas Alumni \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\{selectedClassForChapters/m;

const replacement = `                  {/* Bagian Kelas Alumni */}
                  <div className="space-y-3 mt-8">
                    <button 
                      onClick={() => setIsAlumniSectionExpanded(!isAlumniSectionExpanded)}
                      className="w-full flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-4 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <GraduationCap className="h-5 w-5 text-emerald-700" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-emerald-900 text-sm">Pengaturan Kelas Alumni</h5>
                          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Kelola {allClasses.filter(c => c.type === "alumni").length} kelas alumni yang ada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-white text-emerald-700 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm">
                          {allClasses.filter(c => c.type === "alumni").length} Kelas
                        </span>
                        <div className={\`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-emerald-100 transition-transform duration-300 \${isAlumniSectionExpanded ? "rotate-180" : ""}\`}>
                          <ChevronDown className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                    </button>

                    {isAlumniSectionExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300 pt-2">
                        {allClasses.filter(c => c.type === "alumni").map((c) => {
                          const isEditing = editingClassId === c.id;
                          const isExpanded = expandedClassIds.includes(c.id);
                          return (
                            <div key={c.id} className="bg-white rounded-2xl p-4 border border-emerald-200 flex flex-col gap-3 relative overflow-hidden group shadow-sm hover:shadow-md transition">
                              {/* Indicator */}
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                              
                              <div className="flex justify-between items-start pl-2">
                                <div>
                                  <h5 className="font-bold text-slate-800 text-sm mb-1">{c.name}</h5>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-150">
                                      Alumni
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
                                      c.isActive ? "bg-emerald-500" : "bg-slate-200"
                                    }\`}
                                    title={c.isActive ? "Nonaktifkan" : "Aktifkan"}
                                  >
                                    <div className={\`w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out \${
                                      c.isActive ? "translate-x-6" : "translate-x-0"
                                    }\`} />
                                  </button>
                                </div>
                              </div>

                              {/* Detail Toggle */}
                              <button 
                                 onClick={() => toggleExpand(c.id)} 
                                 className="ml-2 mt-1 w-full text-left flex items-center justify-between p-2 rounded-xl bg-emerald-50/50 hover:bg-emerald-100 border border-emerald-100 transition cursor-pointer text-emerald-800 font-semibold text-xs group/btn"
                              >
                                 <span>{isExpanded ? "Sembunyikan Detail" : "Lihat Detail"}</span>
                                 <ChevronDown className={\`w-4 h-4 transition-transform group-hover/btn:scale-110 \${isExpanded ? "rotate-180" : ""}\`} />
                              </button>

                              {isExpanded && (
                                 <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                  <div className="grid grid-cols-2 gap-3 pl-2">
                                    <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jadwal / Periode</span>
                                        <button onClick={() => setEditingClassId(isEditing ? null : c.id)} className="text-emerald-600 hover:text-emerald-800 transition cursor-pointer p-1"><Edit className="w-3 h-3"/></button>
                                      </div>
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

                                        return isEditing ? (
                                          <div className="flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
                                            <select
                                              value={selectedMonth}
                                              onChange={async (e) => await updatePeriod(e.target.value, selectedYear)}
                                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                                            >
                                              {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                                                <option key={m} value={m}>{m}</option>
                                              ))}
                                            </select>
                                            <select
                                              value={selectedYear}
                                              onChange={async (e) => await updatePeriod(selectedMonth, e.target.value)}
                                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                                            >
                                              {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                                                <option key={y} value={y}>{y}</option>
                                              ))}
                                            </select>
                                          </div>
                                        ) : (
                                          <span className="text-xs font-bold text-emerald-900">{c.period || "Juni 2026"}</span>
                                        );
                                      })()}
                                    </div>

                                    <div className="bg-emerald-50/30 rounded-xl p-3 border border-emerald-100 flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Metode</span>
                                          <button onClick={() => setEditingClassId(isEditing ? null : c.id)} className="text-emerald-600 hover:text-emerald-800 transition cursor-pointer p-1"><Edit className="w-3 h-3"/></button>
                                        </div>
                                        {isEditing ? (
                                          <div className="animate-in fade-in zoom-in-95 duration-200">
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
                                              className="w-full bg-white border border-emerald-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-emerald-800 focus:outline-none focus:border-emerald-400 transition cursor-pointer"
                                            >
                                              <option value="Offline">Offline</option>
                                              <option value="Online">Online</option>
                                              <option value="Hybrid">Hybrid</option>
                                            </select>
                                          </div>
                                        ) : (
                                          <span className="text-xs font-bold text-emerald-900">{c.method || "Offline"}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex gap-2 pl-2 pt-2 border-t border-emerald-100/50">
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
                                        className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-[10px] uppercase cursor-pointer transition flex flex-col items-center justify-center gap-0.5"
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
                                        className="w-10 h-10 flex items-center justify-center bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl border border-emerald-200 hover:border-red-200 transition cursor-pointer"
                                        title="Hapus Kelas"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                  </div>
                                 </div>
                              )}

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>

              {selectedClassForChapters`;

code = code.replace(alumniListRegex, replacement);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
console.log("Patch AdminKelasSegment Expand 3 done!");
