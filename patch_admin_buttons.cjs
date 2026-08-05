const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const oldCode = `<div className="space-y-0.5 pt-0.5">
                              <div className="font-bold text-xs text-slate-900">
                                {s.name}
                              </div>
                              <div className="flex flex-col gap-1 mt-1">
                                <label className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm w-fit">
                                  <Camera className="h-3.5 w-3.5" /> Ganti Foto
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            const url = await uploadFileToFirebase(file, "profile_pictures");
                                            await onUpdateState(
                                              "activeStudents",
                                              "update_status",
                                              {
                                                id: s.id,
                                                profilePicture: url,
                                              },
                                            );
                                          } catch (err) {
                                            console.error(err);
                                            alert("Gagal mengunggah foto profil");
                                          }
                                    }}
                                  />
                                </label>
                                <button
                                  onClick={() => startAdminEditReg(s.id)}
                                  className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm w-fit mt-1"
                                >
                                  <FileText className="h-3.5 w-3.5" /> Detail Biodata
                                </button>
                                <button
                                  onClick={() => setViewingCvStudentId(s.id)}
                                  className="px-2.5 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm w-fit mt-1"
                                >
                                  <FileText className="h-3.5 w-3.5" /> CV Jepang
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Data Siswa"
                                  confirmMessage={\`Hapus data siswa \${s.name} permanen?\`}
                                  onConfirmClick={() => onUpdateState("activeStudents", "delete", { id: s.id })}
                                  className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-sm w-fit mt-1"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                                </ConfirmButton>
                              </div>
                            </div>`;

const newCode = `<div className="space-y-1.5 pt-0.5 w-full overflow-hidden">
                              <div className="font-bold text-xs text-slate-900 truncate">
                                {s.name}
                              </div>
                              <div className="grid grid-cols-2 gap-1.5 w-full">
                                <label className="w-full justify-center px-1.5 py-1.5 bg-blue-50/80 border border-blue-100 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95">
                                  <Camera className="h-3 w-3 shrink-0" /> <span className="truncate">Ganti Foto</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          try {
                                            const url = await uploadFileToFirebase(file, "profile_pictures");
                                            await onUpdateState(
                                              "activeStudents",
                                              "update_status",
                                              {
                                                id: s.id,
                                                profilePicture: url,
                                              },
                                            );
                                          } catch (err) {
                                            console.error(err);
                                            alert("Gagal mengunggah foto profil");
                                          }
                                    }}
                                  />
                                </label>
                                <button
                                  onClick={() => startAdminEditReg(s.id)}
                                  className="w-full justify-center px-1.5 py-1.5 bg-indigo-50/80 border border-indigo-100 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                                >
                                  <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">Biodata</span>
                                </button>
                                <button
                                  onClick={() => setViewingCvStudentId(s.id)}
                                  className="w-full justify-center px-1.5 py-1.5 bg-violet-50/80 border border-violet-100 text-violet-700 hover:bg-violet-100 hover:text-violet-800 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                                >
                                  <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">CV Jepang</span>
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Data Siswa"
                                  confirmMessage={\`Hapus data siswa \${s.name} permanen?\`}
                                  onConfirmClick={() => onUpdateState("activeStudents", "delete", { id: s.id })}
                                  className="w-full justify-center px-1.5 py-1.5 bg-rose-50/80 border border-rose-100 text-rose-600 hover:bg-rose-100 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
                                  title="Hapus Data"
                                >
                                  <Trash2 className="h-3 w-3 shrink-0" /> <span className="truncate">Hapus</span>
                                </ConfirmButton>
                              </div>
                            </div>`;

code = code.replace(oldCode, newCode);

fs.writeFileSync('src/components/AdminView.tsx', code);
