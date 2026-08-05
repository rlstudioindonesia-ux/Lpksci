const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

code = code.replace(
  'className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-95 cursor-pointer ring-1 ring-white/20 shadow-sm"',
  'className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl transition-all active:scale-95 cursor-pointer border border-white/20 shadow-lg shadow-indigo-500/30"'
);

fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
