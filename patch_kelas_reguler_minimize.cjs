const fs = require('fs');
const file = 'src/components/admin/AdminKelasSegment.tsx';
let code = fs.readFileSync(file, 'utf-8');

const target1 = `const [activeTab, setActiveTab] = React.useState<"daftar" | "tambah" | "tambah-alumni">("daftar");`;
const replacement1 = `const [activeTab, setActiveTab] = React.useState<"daftar" | "tambah" | "tambah-alumni">("daftar");\n  const [isRegulerSectionExpanded, setIsRegulerSectionExpanded] = React.useState(true);`;

if (!code.includes('isRegulerSectionExpanded')) {
    code = code.replace(target1, replacement1);
}

const target2 = `{/* Bagian Kelas Reguler */}
                  <div className="space-y-3 mt-6">
                    <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <h5 className="font-bold text-slate-800 text-sm">Kelas Reguler</h5>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                        {allClasses.filter(c => c.type !== "alumni").length} Kelas
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;

const replacement2 = `{/* Bagian Kelas Reguler */}
                  <div className="space-y-3 mt-6">
                    <button 
                      onClick={() => setIsRegulerSectionExpanded(!isRegulerSectionExpanded)}
                      className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 border border-blue-200 p-4 rounded-2xl transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <BookOpen className="h-5 w-5 text-blue-700" />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-blue-900 text-sm">Pengaturan Kelas Reguler</h5>
                          <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                            Kelola {allClasses.filter(c => c.type !== "alumni").length} kelas reguler yang ada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-white text-blue-700 rounded-full text-[10px] font-bold border border-blue-100 shadow-sm">
                          {allClasses.filter(c => c.type !== "alumni").length} Kelas
                        </span>
                        <div className={\`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-blue-100 transition-transform duration-300 \${isRegulerSectionExpanded ? "rotate-180" : ""}\`}>
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                    </button>
                    {isRegulerSectionExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300 pt-2">`;

code = code.replace(target2, replacement2);

const target3 = `                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>

                                    {/* Bagian Kelas Alumni */}`;

const replacement3 = `                            )}

                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>

                                    {/* Bagian Kelas Alumni */}`;
code = code.replace(target3, replacement3);

fs.writeFileSync(file, code);
console.log('Patched');
