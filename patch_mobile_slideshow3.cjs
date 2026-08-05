const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

code = code.replace(
  `className="relative overflow-hidden rounded-2xl bg-slate-950 text-white min-h-[190px] border border-slate-200/20 shadow-md flex flex-col justify-between transition-all duration-500"`,
  `className="relative overflow-hidden rounded-2xl bg-slate-950 text-white min-h-[190px] aspect-[4/3] sm:aspect-auto border border-slate-200/20 shadow-md flex flex-col justify-between transition-all duration-500"`
);

fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
