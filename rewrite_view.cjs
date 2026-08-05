const fs = require('fs');
let code = fs.readFileSync('src/components/AccountSettingsView.tsx', 'utf-8');

const startIdx = code.indexOf('/* Mode View */');
const endIdx = code.indexOf('                    </div>\n                  );\n                })}\n              </div>');

const replacement = `/* Mode View */
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1 w-full">
                              <div className="relative shrink-0">
                                <img
                                  src={user.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-slate-100"
                                  alt="Avatar"
                                />
                                <div className={\`absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center \${user.status === 'Suspended' ? 'bg-rose-500' : 'bg-emerald-500'}\`}>
                                  {user.status === 'Suspended' ? <X className="h-2 w-2 text-white" /> : <Check className="h-2 w-2 text-white" />}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0 max-w-full">
                                  <span className="font-black text-slate-900 text-xs sm:text-sm leading-tight block truncate max-w-full">
                                    {user.name}
                                  </span>
                                  {isMe && (
                                    <span className="text-[8px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full tracking-wider font-black uppercase shadow-sm shrink-0">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-0.5 font-mono truncate max-w-full overflow-hidden">
                                  @{user.username} • <span className="text-slate-300 font-medium lowercase italic">{user.email}</span>
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                                  <div
                                    className={\`px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider border flex items-center gap-1 whitespace-nowrap shadow-xs \${getRoleBadgeColor(user.role)}\`}
                                  >
                                    {getRoleIcon(user.role)}
                                    <span>{user.role}</span>
                                  </div>
                                  
                                  {user.studentId && (
                                    <div className="bg-slate-50 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono tracking-wider whitespace-nowrap shadow-xs">
                                      ID: {user.studentId}
                                    </div>
                                  )}
                                  
                                  {(user.role === "Siswa" || user.role === "Pengajar") && (
                                    <div className="bg-blue-600 text-white border border-blue-700 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider whitespace-nowrap shadow-xs">
                                      Plot: {user.assignedClass || "Belum ada kelas"}
                                    </div>
                                  )}
                                  {user.role === "Pengajar" && (
                                    <>
                                      <div className="bg-emerald-600 text-white border border-emerald-700 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider whitespace-nowrap shadow-xs">
                                        JLPT/JFT: {user.japaneseLevel || "Belum Diisi"}
                                      </div>
                                      {user.kecakapanSensei && (
                                        <div className="bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded-md text-[8px] sm:text-[9px] font-bold font-sans tracking-wider whitespace-nowrap shadow-xs">
                                          Kecakapan: {user.kecakapanSensei}
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions (Only Admin or VVIP can action) */}
                            {(currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa" || currentUser.role === "VVIP") && (
                              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                                {user.role === "Pengajar" && (
                                  <button
                                    onClick={() => setSelectedSenseiForDocCheck(user)}
                                    className="flex-1 sm:flex-none p-1.5 sm:p-2 sm:px-3 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg sm:rounded-xl border border-emerald-100 hover:border-emerald-600 transition flex items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap"
                                    title="Periksa Dokumen Sensei"
                                  >
                                    <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                    <span>Berkas</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => startEditUser(user)}
                                  className="flex-1 sm:flex-none p-1.5 sm:p-2 sm:px-3 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg sm:rounded-xl border border-indigo-100 hover:border-indigo-600 transition flex items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap"
                                  title="Edit Akun"
                                >
                                  <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Kelola</span>
                                </button>
                                <ConfirmButton
                                  confirmTitle="Hapus Akun Pengguna"
                                  confirmMessage={\`Yakin ingin menghapus permanen akses @\${user.username}?\`}
                                  onConfirmClick={() => handleDeleteUser(user.username)}
                                  disabled={isMe}
                                  className={\`flex-1 sm:flex-none p-1.5 sm:p-2 sm:px-3 rounded-lg sm:rounded-xl border transition flex items-center justify-center gap-1.5 font-black text-[9px] sm:text-[10px] shadow-xs whitespace-nowrap \${
                                    isMe
                                      ? "bg-slate-50 border-slate-100 text-slate-200 cursor-not-allowed opacity-50"
                                      : "bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-100 hover:border-rose-600"
                                  }\`}
                                  title={isMe ? "Keamanan Sistem: Tidak bisa menghapus diri sendiri" : "Hapus Akun"}
                                >
                                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span>Hapus</span>
                                </ConfirmButton>
                              </div>
                            )}
                          </div>

                          {/* Indikator Status Akun & Diferensiasi Sumber Data */}
                          {(() => {
                            const hasNoEmail = !user.email || user.email.trim() === "" || user.email.includes("no-email") || user.email.includes("dummy") || user.email.includes("placeholder");
                            const hasNoPassword = !user.password || user.password.trim() === "" || user.password === "adminadmin" || user.password === "123456" || user.password === "••••••••";
                            const isProfileInput = hasNoEmail || hasNoPassword || user.username.startsWith("temp_") || user.username.startsWith("placeholder_") || (user.role === "Alumni" && hasNoEmail);
                            
                            return (
                              <div className="w-full mt-1 space-y-1.5 border-t border-slate-100/60 pt-2.5 animate-fade-in">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {/* Status Aktivasi Login */}
                                  {hasNoEmail || hasNoPassword ? (
                                    <div className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs flex items-center gap-1 animate-pulse">
                                      <span>⚠️ Belum Aktivasi Login</span>
                                    </div>
                                  ) : (
                                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs flex items-center gap-1">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                      <span>🟢 Login Aktif</span>
                                    </div>
                                  )}
                                  {/* Diferensiasi Sumber Data */}
                                  {isProfileInput ? (
                                    <div className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs">
                                      📂 Input Admin
                                    </div>
                                  ) : (
                                    <div className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wider whitespace-nowrap shadow-3xs">
                                      📝 Registrasi Mandiri
                                    </div>
                                  )}
                                  {/* Indikator Spesifik Data Administrator yang belum lengkap */}
                                  {(user.role === "Admin" || user.role === "Admin Super" || user.role === "Admin Biasa" || user.role === "VVIP") && (hasNoEmail || hasNoPassword) && (
                                    <div className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-3xs animate-bounce">
                                      🚨 Data Belum Lengkap
                                    </div>
                                  )}
                                </div>
                                {/* Informasi Tambahan Pencegah Kebingungan */}
                                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2 text-[9px] leading-relaxed text-slate-600 font-medium space-y-1 shadow-3xs">
                                  {hasNoEmail && (
                                    <p className="text-amber-700 font-bold">
                                      ❌ Email belum valid (Tidak bisa login).
                                    </p>
                                  )}
                                  {hasNoPassword && (
                                    <p className="text-amber-700 font-bold">
                                      ❌ Sandi login belum diatur.
                                    </p>
                                  )}
                                  {!hasNoEmail && !hasNoPassword && (
                                    <p className="text-slate-600">
                                      ✔️ Email & sandi telah aktif. {isProfileInput ? "Diinput oleh admin." : "Didaftarkan secara online."}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/components/AccountSettingsView.tsx', code);
