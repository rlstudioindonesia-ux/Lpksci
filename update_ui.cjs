const fs = require('fs');
let code = fs.readFileSync('src/components/LmsView.tsx', 'utf8');

const filterRegex = /\{\(currentUser\?\.role === "Admin" \|\| currentUser\?\.role === "Admin Super" \|\| currentUser\?\.role === "Admin Biasa" \|\| currentUser\?\.role === "VVIP" \|\| currentUser\?\.role === "Pengajar"\) && \([\s\S]*?\)\(\)\}\n\s*<\/div>\n\s*\)\}/g;

code = code.replace(filterRegex, '');

const nameClassRegex = /font-black text-xs uppercase tracking-wide truncate \$\{isSelected \? isAlumni \? "text-emerald-900" : "text-blue-900" : "text-slate-800"\}/g;
code = code.replace(nameClassRegex, 'font-black text-sm uppercase tracking-wide truncate ${isSelected ? isAlumni ? "text-emerald-900" : "text-blue-900" : "text-slate-800"}');

fs.writeFileSync('src/components/LmsView.tsx', code);
