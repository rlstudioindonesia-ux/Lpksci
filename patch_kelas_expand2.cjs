const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminKelasSegment.tsx', 'utf8');

// Update state to include 'tambah-alumni'
code = code.replace(
  'const [activeTab, setActiveTab] = React.useState<"daftar" | "tambah">("daftar");',
  'const [activeTab, setActiveTab] = React.useState<"daftar" | "tambah" | "tambah-alumni">("daftar");\n  const [isAlumniSectionExpanded, setIsAlumniSectionExpanded] = React.useState(false);'
);

// Update Quick Access Buttons
const quickAccessRegex = /<div className="grid grid-cols-2 gap-3 max-w-sm mb-6">[\s\S]*?<\/div>\s*<div className="flex flex-col gap-6">/;
const newQuickAccess = `<div className="grid grid-cols-3 gap-3 max-w-lg mb-6">
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
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'tambah' ? 'bg-blue-600 text-white shadow-lg border-blue-600 ring-2 ring-blue-200 ring-offset-1' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Plus className={\`h-5 w-5 mx-auto mb-1.5 \${activeTab === 'tambah' ? 'text-blue-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Tambah Reguler</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tambah-alumni')}
                  className={\`p-3 rounded-2xl border text-center transition-all cursor-pointer \${activeTab === 'tambah-alumni' ? 'bg-emerald-600 text-white shadow-lg border-emerald-600 ring-2 ring-emerald-200 ring-offset-1' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}\`}
                >
                  <Plus className={\`h-5 w-5 mx-auto mb-1.5 \${activeTab === 'tambah-alumni' ? 'text-emerald-200' : 'text-slate-400'}\`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Tambah Alumni</span>
                </button>
              </div>
              
              <div className="flex flex-col gap-6">`;

code = code.replace(quickAccessRegex, newQuickAccess);

// Update "tambah" logic
const tambahFormRegex = /\{activeTab === "tambah" && \([\s\S]*?<\/div>\s*\)\}\s*\{activeTab === "daftar" && \(/;

const newTambahForm = `{activeTab === "tambah" && (
                <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">
                      Tambah Kelas Reguler Baru
                    </h4>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Buat ruang kelas baru untuk menampung plotting siswa dan materi pembelajaran.
                    </p>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const name = (formData.get("className") as string || "").trim();
                      const type = "reguler";
                      const method = formData.get("classMethod") as string;
                      const pMonth = formData.get("classPeriodMonth") as string;
                      const pYear = formData.get("classPeriodYear") as string;
                      const period = \`\${pMonth} \${pYear}\`;
                      if (!name) return;
                      // Check duplicate
                      if (allClasses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                        alert(\`Kelas dengan nama "\${name}" sudah terdaftar.\`);
                        return;
                      }
                      const newClassObj = {
                        id: name,
                        name: name,
                        isActive: true,
                        type: type,
                        method: method,
                        period: period,
                        chapters: CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })),
                        mathChapters: MATH_CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 }))
                      };
                      const updatedLmsClasses = [
                        ...(systemState?.customization?.lmsClasses || []),
                        newClassObj
                      ];
                      const ok = await onUpdateState("customization", "update", {
                        ...systemState?.customization,
                        lmsClasses: updatedLmsClasses
                      });
                      if (ok) {
                        form.reset();
                        alert(\`Kelas "\${name}" berhasil ditambahkan.\`);
                        setActiveTab("daftar");
                      }
                    }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Nama Kelas Reguler
                      </label>
                      <input
                        type="text"
                        name="className"
                        required
                        placeholder="Contoh: Tokyo, Kyoto, Osaka"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Metode Pembelajaran
                      </label>
                      <select
                        name="classMethod"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="Offline">Offline (Luring)</option>
                        <option value="Online">Online (Daring)</option>
                        <option value="Hybrid">Hybrid (Campuran)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Periode Kelas (Bulan & Tahun)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          name="classPeriodMonth"
                          required
                          defaultValue="Juni"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold cursor-pointer font-sans"
                        >
                          {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          name="classPeriodYear"
                          required
                          defaultValue="2026"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-blue-500 text-slate-800 font-semibold cursor-pointer font-sans"
                        >
                          {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Simpan Kelas Reguler Baru
                    </button>
                  </form>
                </div>
                )}
                
                {activeTab === "tambah-alumni" && (
                <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-3xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">
                      Tambah Kelas Alumni Baru
                    </h4>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Buat ruang kelas baru untuk menampung plotting siswa yang sudah lulus.
                    </p>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const formData = new FormData(form);
                      const name = (formData.get("className") as string || "").trim();
                      const type = "alumni";
                      const method = formData.get("classMethod") as string;
                      const pMonth = formData.get("classPeriodMonth") as string;
                      const pYear = formData.get("classPeriodYear") as string;
                      const period = \`\${pMonth} \${pYear}\`;
                      if (!name) return;
                      // Check duplicate
                      if (allClasses.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                        alert(\`Kelas dengan nama "\${name}" sudah terdaftar.\`);
                        return;
                      }
                      const newClassObj = {
                        id: name,
                        name: name,
                        isActive: true,
                        type: type,
                        method: method,
                        period: period,
                        chapters: CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 })),
                        mathChapters: MATH_CHAPTERS_LIST.map((ch: any) => ({ ...ch, isActive: ch.number === 1 }))
                      };
                      const updatedLmsClasses = [
                        ...(systemState?.customization?.lmsClasses || []),
                        newClassObj
                      ];
                      const ok = await onUpdateState("customization", "update", {
                        ...systemState?.customization,
                        lmsClasses: updatedLmsClasses
                      });
                      if (ok) {
                        form.reset();
                        alert(\`Kelas "\${name}" berhasil ditambahkan.\`);
                        setActiveTab("daftar");
                      }
                    }}
                    className="space-y-3.5"
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Nama Kelas Alumni
                      </label>
                      <input
                        type="text"
                        name="className"
                        required
                        placeholder="Contoh: Alumni N3, Alumni Batch 1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-emerald-500 text-slate-800 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Metode Pembelajaran
                      </label>
                      <select
                        name="classMethod"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-emerald-500 text-slate-800 font-semibold cursor-pointer"
                      >
                        <option value="Offline">Offline (Luring)</option>
                        <option value="Online">Online (Daring)</option>
                        <option value="Hybrid">Hybrid (Campuran)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Periode Kelas (Bulan & Tahun)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          name="classPeriodMonth"
                          required
                          defaultValue="Juni"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-emerald-500 text-slate-800 font-semibold cursor-pointer font-sans"
                        >
                          {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select
                          name="classPeriodYear"
                          required
                          defaultValue="2026"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-emerald-500 text-slate-800 font-semibold cursor-pointer font-sans"
                        >
                          {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      Simpan Kelas Alumni Baru
                    </button>
                  </form>
                </div>
                )}
                
                {activeTab === "daftar" && (`;

code = code.replace(tambahFormRegex, newTambahForm);

fs.writeFileSync('src/components/admin/AdminKelasSegment.tsx', code);
