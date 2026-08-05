const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const nameClassRegex = /font-black text-sm uppercase tracking-wide truncate \$\{isSelected \? isAlumni \? "text-emerald-900" : "text-blue-900" : "text-slate-800"\}/g;
code = code.replace(nameClassRegex, 'font-black text-[13px] sm:text-sm uppercase tracking-wide truncate ${isSelected ? isAlumni ? "text-emerald-900" : "text-blue-900" : "text-slate-900"}');

fs.writeFileSync('src/components/LmsView.tsx', code);
