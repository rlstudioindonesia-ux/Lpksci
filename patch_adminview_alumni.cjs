const fs = require('fs');

let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

// Add state
code = code.replace(
  'const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);',
  'const [expandedJobIds, setExpandedJobIds] = useState<string[]>([]);\n  const [expandedAlumniClassIds, setExpandedAlumniClassIds] = useState<string[]>([]);'
);

const alumniListRegex = /\{\/\* Alumni Classes Editor \*\/\}\s*<div className="space-y-2 ">[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex justify-end pt-4 border-t border-slate-100">/;

const newAlumniList = `{/* Alumni Classes Editor */}
                    <div className="space-y-2 ">
                      <label className="text-xs font-bold text-slate-700 block">Daftar Kelas Alumni</label>
                      <div className="space-y-3">
                        {custLandingConfig.alumniClasses?.map((cls: any, idx: number) => {
                          const clsId = cls.id || String(idx);
                          const isExpanded = expandedAlumniClassIds.includes(clsId);
                          return (
                          <div key={clsId} className="border border-slate-200 rounded-xl bg-white relative overflow-hidden group shadow-sm transition-shadow hover:shadow-md">
                            {/* Indicator */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                            
                            {/* Header (Always Visible) */}
                            <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedAlumniClassIds(prev => prev.includes(clsId) ? prev.filter(i => i !== clsId) : [...prev, clsId])}>
                              <div className="flex items-center gap-3 pl-2">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                  <span className="text-xl">{cls.emoji || "⛩️"}</span>
                                </div>
                                <div>
                                  <h5 className="font-bold text-slate-800 text-sm">{cls.title || \`Kelas Alumni \${idx + 1}\`}</h5>
                                  <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">{cls.level || "Level"}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase">{cls.method || "Metode"}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button type="button" onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm("Yakin ingin menghapus kelas ini?")) {
                                    const newItems = custLandingConfig.alumniClasses.filter((_: any, i: number) => i !== idx);
                                    setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                  }
                                }} className="text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 p-2 rounded-lg text-xs font-bold transition border border-slate-200 hover:border-rose-200 shadow-sm">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <div className={\`w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-500 transition-transform duration-300 \${isExpanded ? 'rotate-180 bg-indigo-50 text-indigo-600 border-indigo-200' : ''}\`}>
                                  <ChevronDown className="h-4 w-4" />
                                </div>
                              </div>
                            </div>

                            {/* Body (Collapsible) */}
                            {isExpanded && (
                            <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                                <div className="md:col-span-4 space-y-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Metode</label>
                                    <input type="text" value={cls.method || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, method: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Online & Offline" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level</label>
                                    <input type="text" value={cls.level || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, level: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 uppercase transition shadow-sm font-medium" placeholder="N3" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Warna/Tema</label>
                                    <select value={cls.colorScheme || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, colorScheme: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden cursor-pointer focus:border-indigo-500 transition shadow-sm font-medium">
                                      <option value="emerald">Emerald (Hijau)</option>
                                      <option value="blue">Blue (Biru)</option>
                                      <option value="purple">Purple (Ungu)</option>
                                      <option value="orange">Orange (Oranye)</option>
                                      <option value="rose">Rose (Merah Muda)</option>
                                    </select>
                                  </div>
                                </div>
                                <div className="md:col-span-8 space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Judul Kelas</label>
                                      <input type="text" value={cls.title || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, title: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Level N3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Emoji & Durasi</label>
                                      <div className="flex gap-2">
                                        <input type="text" value={cls.emoji || ""} onChange={(e) => {
                                          const newItems = [...custLandingConfig.alumniClasses];
                                          newItems[idx] = { ...cls, emoji: e.target.value };
                                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                        }} className="w-16 text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm text-center font-medium" placeholder="⛩️" />
                                        <input type="text" value={cls.duration || ""} onChange={(e) => {
                                          const newItems = [...custLandingConfig.alumniClasses];
                                          newItems[idx] = { ...cls, duration: e.target.value };
                                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                        }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Durasi: 3-4 Bulan" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Pendaftar (Registered)</label>
                                      <input type="number" value={cls.registered ?? 0} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, registered: Number(e.target.value) };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="8" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kuota Kelas (Quota Limit)</label>
                                      <input type="number" value={cls.quota ?? 10} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, quota: Number(e.target.value) };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="10" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Open Class</label>
                                      <input type="text" value={cls.openClass || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, openClass: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Contoh: 19 Agustus 2026" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Persentase Diskon (Opsional)</label>
                                      <input type="text" value={cls.discount || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, discount: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Contoh: 20%" />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teks Diskon</label>
                                      <input type="text" value={cls.discountText || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, discountText: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Contoh: Hemat 200.000" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Harga Coret (Asli)</label>
                                      <input type="text" value={cls.originalPrice || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, originalPrice: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} onBlur={(e) => {
                                        const formatted = formatRupiah(e.target.value);
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, originalPrice: formatted };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Rp 1.200.000" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Harga Akhir</label>
                                      <input type="text" value={cls.finalPrice || ""} onChange={(e) => {
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, finalPrice: e.target.value };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} onBlur={(e) => {
                                        const formatted = formatRupiah(e.target.value);
                                        const newItems = [...custLandingConfig.alumniClasses];
                                        newItems[idx] = { ...cls, finalPrice: formatted };
                                        setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                      }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" placeholder="Rp 1.000.000" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deskripsi</label>
                                    <textarea value={cls.description || ""} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, description: e.target.value };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" rows={2} />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fitur (Pisahkan dengan koma)</label>
                                    <textarea value={(cls.features || []).join(', ')} onChange={(e) => {
                                      const newItems = [...custLandingConfig.alumniClasses];
                                      newItems[idx] = { ...cls, features: e.target.value.split(',').map((f: string) => f.trim()).filter(Boolean) };
                                      setCustLandingConfig({ ...custLandingConfig, alumniClasses: newItems });
                                    }} className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 outline-hidden focus:border-indigo-500 transition shadow-sm font-medium" rows={2} placeholder="Kosakata & Tata Bahasa Dasar, Percakapan Sehari-hari" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-start mt-4">
                        <button type="button" onClick={() => {
                          const newItem = {
                            id: "al_" + Date.now(),
                            method: "Online & Offline",
                            level: "N4",
                            emoji: "⛩️",
                            title: "Level N4",
                            description: "Deskripsi program alumni.",
                            features: ["Fitur 1", "Fitur 2"],
                            duration: "Durasi: 3 Bulan",
                            colorScheme: "emerald",
                            registered: 0,
                            quota: 10
                          };
                          setCustLandingConfig({ ...custLandingConfig, alumniClasses: [...(custLandingConfig.alumniClasses || []), newItem] });
                          setExpandedAlumniClassIds([...expandedAlumniClassIds, newItem.id]);
                        }} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-sm border border-indigo-700">
                          <Plus className="h-4 w-4" /> Tambah Kelas Alumni VIP
                        </button>
                      </div>
                    </div>
                  </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-slate-100">`;

code = code.replace(alumniListRegex, newAlumniList);

fs.writeFileSync('src/components/AdminView.tsx', code);
