const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf8');

const textColors = [
  "text-sky-600",
  "text-rose-600",
  "text-emerald-600",
  "text-amber-600",
  "text-violet-600"
];

code = code.replace(
  /<span className={`text-\[9px\] tracking-tight whitespace-nowrap \$\{isActive \? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : "text-slate-500 font-bold"}`}>{menu\.name}<\/span>/g,
  '<span className={`text-[9px] tracking-tight whitespace-nowrap ${isActive ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : `font-bold ${["text-sky-600","text-rose-600","text-emerald-600","text-amber-600","text-violet-600"][idx % 5]}`}`}>{menu.name}</span>'
);

code = code.replace(
  /<span className={`text-\[9\.5px\] whitespace-nowrap \$\{isActive \? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : "text-slate-500 font-bold"}`}>{menu\.name}<\/span>/g,
  '<span className={`text-[9.5px] whitespace-nowrap ${isActive ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : `font-bold ${["text-sky-600","text-rose-600","text-emerald-600","text-amber-600","text-violet-600"][idx % 5]}`}`}>{menu.name}</span>'
);

fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
