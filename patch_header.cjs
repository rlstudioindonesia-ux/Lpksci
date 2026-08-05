const fs = require('fs');
let code = fs.readFileSync('src/components/MobileDashboardView.tsx', 'utf-8');

const target = `      {/* HEADER SECTION - Matches screenshot logo, title and unread bell badge */}
      <header className="bg-white text-slate-900 p-3.5 flex items-center justify-between shadow-sm relative border-b border-slate-100 sticky top-0 z-50">`;

const replacement = `      {/* HEADER SECTION - Matches screenshot logo, title and unread bell badge */}
      <header className="bg-white/80 backdrop-blur-xl text-slate-900 p-4 flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative border-b border-slate-200/50 sticky top-0 z-50 rounded-b-2xl mb-1">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/MobileDashboardView.tsx', code);
