const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

// 1. Remove the old button
code = code.replace(
  /                    \{\(currentUser\?.role === "Admin" \|\| currentUser\?.role === "Admin Super" \|\| currentUser\?.role === "VVIP"\) && \(\s*<button\s*onClick=\{\(\) => setShowCostConfig\(true\)\}\s*className="px-3 py-1\.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-\[10px\] font-bold font-sans tracking-wider transition-colors flex items-center gap-1\.5"\s*>\s*<DollarSign className="w-3\.5 h-3\.5" \/>\s*Setel SOP Biaya Resmi\s*<\/button>\s*\)\}/s,
  ''
);

// 2. Modify Quick Nav
code = code.replace(
  '                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">',
  `                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <button 
                        onClick={() => setShowCostConfig(true)}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-slate-600 transition-all active:scale-95 group text-center"
                      >
                        <DollarSign className="h-5 w-5 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight">SOP BIAYA<br/>RESMI LPK</span>
                      </button>`
);

code = code.replace(
  /onClick=\{\(\) => document\.getElementById\('feature-riwayat-dana'\)\?\.scrollIntoView\(\{behavior: 'smooth'\}\)\}/g,
  `onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'riwayat-dana' ? null : 'riwayat-dana')}`
);
code = code.replace(
  /onClick=\{\(\) => document\.getElementById\('feature-konfirmasi-transfer'\)\?\.scrollIntoView\(\{behavior: 'smooth'\}\)\}/g,
  `onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'konfirmasi-transfer' ? null : 'konfirmasi-transfer')}`
);
code = code.replace(
  /onClick=\{\(\) => document\.getElementById\('feature-kas-masuk-manual'\)\?\.scrollIntoView\(\{behavior: 'smooth'\}\)\}/g,
  `onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'kas-masuk' ? null : 'kas-masuk')}`
);
code = code.replace(
  /onClick=\{\(\) => document\.getElementById\('feature-pengaturan-rekening'\)\?\.scrollIntoView\(\{behavior: 'smooth'\}\)\}/g,
  `onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'pengaturan-rekening' ? null : 'pengaturan-rekening')}`
);

// We need to style the active state of buttons.
// Button 1: Riwayat Dana
code = code.replace(
  `className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 text-slate-600 transition-all active:scale-95 group text-center"`,
  `className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'riwayat-dana' ? 'bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 text-slate-600'}\`}`
);
// Button 2: Verifikasi Bukti
code = code.replace(
  `className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600 transition-all active:scale-95 group text-center"`,
  `className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'konfirmasi-transfer' ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600'}\`}`
);
// Button 3: Kas Masuk Manual
code = code.replace(
  `className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600 transition-all active:scale-95 group text-center"`,
  `className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'kas-masuk' ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600'}\`}`
);
// Button 4: Pengaturan Rekening
code = code.replace(
  `className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600 transition-all active:scale-95 group text-center"`,
  `className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'pengaturan-rekening' ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600'}\`}`
);

// 3. Wrap sections
code = code.replace(
  '<div id="feature-riwayat-dana"',
  '{activeKeuanganFeature === "riwayat-dana" && (\n<div id="feature-riwayat-dana"'
);
code = code.replace(
  '                      </div>\n                    </div>\n\n                    {/* FEATURE 2: VERIFIKASI BUKTI TRANSFER MANUAL */}',
  '                      </div>\n                    </div>\n                    )}\n\n                    {/* FEATURE 2: VERIFIKASI BUKTI TRANSFER MANUAL */}'
);

code = code.replace(
  '<div id="feature-konfirmasi-transfer"',
  '{activeKeuanganFeature === "konfirmasi-transfer" && (\n<div id="feature-konfirmasi-transfer"'
);
code = code.replace(
  '                      </div>\n                    </div>\n\n                    {/* FEATURE 3: KAS MASUK MANUAL (OFFLINE) */}',
  '                      </div>\n                    </div>\n                    )}\n\n                    {/* FEATURE 3: KAS MASUK MANUAL (OFFLINE) */}'
);

code = code.replace(
  '<div id="feature-kas-masuk-manual"',
  '{activeKeuanganFeature === "kas-masuk" && (\n<div id="feature-kas-masuk-manual"'
);
code = code.replace(
  '                      </div>\n                    </div>\n\n                    {/* FEATURE 4: PENGATURAN REKENING LPK */}',
  '                      </div>\n                    </div>\n                    )}\n\n                    {/* FEATURE 4: PENGATURAN REKENING LPK */}'
);

code = code.replace(
  '<div id="feature-pengaturan-rekening"',
  '{activeKeuanganFeature === "pengaturan-rekening" && (\n<div id="feature-pengaturan-rekening"'
);
code = code.replace(
  '                        </div>\n                      </div>\n                    </div>\n                  </div>\n                </div>',
  '                        </div>\n                      </div>\n                    </div>\n                    )}\n                  </div>\n                </div>'
);

fs.writeFileSync('src/components/AdminView.tsx', code);
console.log("Patch AdminView.tsx done!");
