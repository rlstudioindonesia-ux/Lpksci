const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf8');

code = code.replace(
  `className="relative overflow-hidden rounded-2xl bg-slate-950 text-white aspect-[4/3] sm:aspect-auto sm:min-h-[220px] border border-slate-200/20 shadow-md flex flex-col justify-between transition-all duration-500"`,
  `className="relative overflow-hidden rounded-2xl bg-slate-950 text-white min-h-[190px] border border-slate-200/20 shadow-md flex flex-col justify-between transition-all duration-500"`
);

code = code.replace(
  `className="absolute inset-0 bg-cover bg-top bg-no-repeat transition-all duration-700 transform scale-102"`,
  `className="absolute inset-0 bg-cover bg-[center_30%] bg-no-repeat transition-all duration-700 transform scale-102"`
);

fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
