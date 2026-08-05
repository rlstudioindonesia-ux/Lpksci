const fs = require('fs');
let code = fs.readFileSync('src/components/AccountSettingsView.tsx', 'utf-8');

const targetStr = `                })}
              </div>
            </div>

            {/* Form Tambah Account Baru */}`;

const paginationUI = `                })}
              </div>
              
              {/* Pagination Controls */}
              {totalUserPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Halaman {userPage} dari {totalUserPages}
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setUserPage(Math.max(1, userPage - 1))}
                      disabled={userPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setUserPage(Math.min(totalUserPages, userPage + 1))}
                      disabled={userPage === totalUserPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Tambah Account Baru */}`;

code = code.replace(targetStr, paginationUI);

// Check if ChevronLeft and ChevronRight are imported from 'lucide-react'
if (!code.includes('ChevronLeft')) {
    code = code.replace('import {', 'import { ChevronLeft, ChevronRight,');
}

fs.writeFileSync('src/components/AccountSettingsView.tsx', code);
