const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const oldNav = `                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <button 
                        onClick={() => setShowCostConfig(true)}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-slate-600 transition-all active:scale-95 group text-center"
                      >
                        <DollarSign className="h-5 w-5 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight">SOP BIAYA<br/>RESMI LPK</span>
                      </button>
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'riwayat-dana' ? null : 'riwayat-dana')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'riwayat-dana' ? 'bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-700 text-slate-600'}\`}
                      >
                        <Calculator className="h-5 w-5 group-hover:text-yellow-500 transition-colors" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight">RIWAYAT DANA<br/>SISWA SPESIFIK</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'konfirmasi-transfer' ? null : 'konfirmasi-transfer')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'konfirmasi-transfer' ? 'bg-indigo-50 border-indigo-400 text-indigo-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 text-slate-600'}\`}
                      >
                        <Landmark className="h-5 w-5 group-hover:text-indigo-500 transition-colors" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight">VERIFIKASI BUKTI<br/>TRANSFER MANUAL</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'kas-masuk' ? null : 'kas-masuk')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'kas-masuk' ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-slate-600'}\`}
                      >
                        <CreditCard className="h-5 w-5 group-hover:text-blue-500 transition-colors" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight">INPUT KWITANSI &<br/>KAS MASUK</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'pengaturan-rekening' ? null : 'pengaturan-rekening')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all active:scale-95 group text-center \${activeKeuanganFeature === 'pengaturan-rekening' ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-sm' : 'bg-slate-50 border-slate-100 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-slate-600'}\`}
                      >
                        <Wallet className="h-5 w-5 group-hover:text-rose-500 transition-colors" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight">PENGATURAN<br/>REKENING LPK</span>
                      </button>
                    </div>`;

const newNav = `                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <button 
                        onClick={() => setShowCostConfig(true)}
                        className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 border border-transparent text-white transition-all hover:scale-105 active:scale-95 shadow-md shadow-emerald-200 text-center"
                      >
                        <DollarSign className="h-5 w-5 text-white" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight drop-shadow-sm">SOP BIAYA<br/>RESMI LPK</span>
                      </button>
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'riwayat-dana' ? null : 'riwayat-dana')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 text-center \${activeKeuanganFeature === 'riwayat-dana' ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-transparent shadow-md shadow-amber-200 ring-2 ring-yellow-400 ring-offset-2' : 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white border-transparent shadow-md shadow-amber-200'}\`}
                      >
                        <Calculator className="h-5 w-5 text-white" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight drop-shadow-sm">RIWAYAT DANA<br/>SISWA SPESIFIK</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'konfirmasi-transfer' ? null : 'konfirmasi-transfer')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 text-center \${activeKeuanganFeature === 'konfirmasi-transfer' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-200 ring-2 ring-indigo-500 ring-offset-2' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-transparent shadow-md shadow-indigo-200'}\`}
                      >
                        <Landmark className="h-5 w-5 text-white" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight drop-shadow-sm">VERIFIKASI BUKTI<br/>TRANSFER MANUAL</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'kas-masuk' ? null : 'kas-masuk')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 text-center \${activeKeuanganFeature === 'kas-masuk' ? 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-transparent shadow-md shadow-blue-200 ring-2 ring-blue-400 ring-offset-2' : 'bg-gradient-to-br from-blue-400 to-cyan-500 text-white border-transparent shadow-md shadow-blue-200'}\`}
                      >
                        <CreditCard className="h-5 w-5 text-white" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight drop-shadow-sm">INPUT KWITANSI &<br/>KAS MASUK</span>
                      </button>
                      
                      <button 
                        onClick={() => setActiveKeuanganFeature(activeKeuanganFeature === 'pengaturan-rekening' ? null : 'pengaturan-rekening')}
                        className={\`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 active:scale-95 text-center \${activeKeuanganFeature === 'pengaturan-rekening' ? 'bg-gradient-to-br from-rose-400 to-pink-500 text-white border-transparent shadow-md shadow-rose-200 ring-2 ring-rose-400 ring-offset-2' : 'bg-gradient-to-br from-rose-400 to-pink-500 text-white border-transparent shadow-md shadow-rose-200'}\`}
                      >
                        <Wallet className="h-5 w-5 text-white" />
                        <span className="text-[9px] font-extrabold font-sans leading-tight drop-shadow-sm">PENGATURAN<br/>REKENING LPK</span>
                      </button>
                    </div>`;

code = code.replace(oldNav, newNav);

const ledgerStart = "{/* GLOBAL PAYMENTS LEDGER TABLE */}";
const ledgerEndStr = "                      })()}\n                    </div>\n";
const pIndex = code.indexOf(ledgerStart);
const pEndIndex = code.indexOf(ledgerEndStr, pIndex) + ledgerEndStr.length;
const ledgerBlock = code.substring(pIndex, pEndIndex);

code = code.slice(0, pIndex) + code.slice(pEndIndex);

const target1 = '                    </div>\n                  )}\n\n                  {/* FEATURE 2:';
const target2 = '</div>\n                  )}\n\n                  {/* FEATURE 2:';

if (code.includes(target1)) {
  code = code.replace(target1, '                    </div>\n                    ' + ledgerBlock + '\n                  </div>\n                  )}\n\n                  {/* FEATURE 2:');
} else if (code.includes(target2)) {
  code = code.replace(target2, '</div>\n                    ' + ledgerBlock + '\n                  </div>\n                  )}\n\n                  {/* FEATURE 2:');
} else {
  // Let's use regex
  const regex = /(<\/div>\s*)\)}\s*({\/\* FEATURE 2:)/;
  code = code.replace(regex, (match, p1, p2) => {
    return p1 + ledgerBlock + "\n                  </div>\n                  )}\n" + p2;
  });
}

// Ensure activeKeuanganFeature starts as 'riwayat-dana' instead of null if it's currently initialized as something else.
// Actually it's probably initialized in state.
code = code.replace(/const \[activeKeuanganFeature, setActiveKeuanganFeature\] = useState<string \| null>\(null\);/g, "const [activeKeuanganFeature, setActiveKeuanganFeature] = useState<string | null>('riwayat-dana');");

fs.writeFileSync('src/components/AdminView.tsx', code);
