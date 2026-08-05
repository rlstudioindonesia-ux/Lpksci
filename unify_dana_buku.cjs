const fs = require('fs');
let code = fs.readFileSync('src/components/AdminView.tsx', 'utf8');

const riwayatDanaDivStart = '<div id="feature-riwayat-dana" className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-4 text-left scroll-mt-24">';

if (code.includes(riwayatDanaDivStart)) {
  const newStart = `<div className="bg-slate-900 rounded-3xl border border-slate-800 p-1 sm:p-2 shadow-2xl space-y-2 animate-fade-in scroll-mt-24" id="feature-riwayat-dana">
  <div className="text-white p-4 sm:p-5 space-y-4 text-left">`;
  
  code = code.replace(riwayatDanaDivStart, newStart);
}

// Now we need to close the first inner div before the ledger starts.
// The ledger is preceded by </div> which previously closed feature-riwayat-dana.
// But wait, the ledger block is:
//                     </div>
//                     <div className="bg-white rounded-2xl border border-slate-200 text-left space-y-4 shadow-xs overflow-hidden">
//                       <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
//                         <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-slate-650 block">

// And after the ledger block, there's `                  </div>` and `)}`.
// We need to just change how the ledger block is integrated.

fs.writeFileSync('src/components/AdminView.tsx', code);
