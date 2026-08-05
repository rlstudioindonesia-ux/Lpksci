const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf-8');

const target = `          <div className="sticky top-0 z-50 bg-indigo-900/95 backdrop-blur-md text-white p-3.5 flex items-center justify-between gap-3 border-b border-white/10 shadow-lg">`;

const replacement = `          <div className="sticky top-0 z-50 bg-indigo-900/95 backdrop-blur-xl text-white p-4 flex items-center justify-between gap-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)] border-b border-white/10 rounded-b-3xl mb-2">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
