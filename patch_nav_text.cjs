const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf8');

// Replace bottom text
code = code.replace(
  /<span className="text-\[9px\] tracking-tight whitespace-nowrap">{menu\.name}<\/span>/g,
  '<span className={`text-[9px] tracking-tight whitespace-nowrap ${isActive ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : "text-slate-500 font-bold"}`}>{menu.name}</span>'
);

// Replace top text
code = code.replace(
  /<span className="text-\[9\.5px\] whitespace-nowrap">{menu\.name}<\/span>/g,
  '<span className={`text-[9.5px] whitespace-nowrap ${isActive ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 font-extrabold" : "text-slate-500 font-bold"}`}>{menu.name}</span>'
);

fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
