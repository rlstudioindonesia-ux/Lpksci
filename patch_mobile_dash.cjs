const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf-8');

const target = `                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        PEMBAYARAN
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        Dashboard & Tagihan
                      </p>
                    </div>`;

const replacement = `                    <div className="space-y-1 text-center w-full px-1">
                      <span className="text-[10px] font-extrabold text-slate-800 leading-tight block truncate">
                        {currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin") || currentUser?.role === "VVIP" ? "PRESENSI & PERSONALIA" : "PEMBAYARAN"}
                      </span>
                      <p className="text-[8px] text-slate-500 font-medium block leading-tight truncate">
                        {currentUser?.role === "Pengajar" || currentUser?.role?.startsWith("Admin") || currentUser?.role === "VVIP" ? "Data Kehadiran & Staf" : "Dashboard & Tagihan"}
                      </p>
                    </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
