const fs = require('fs');
let code = fs.readFileSync('src/components/mobile/MobileBottomNav.tsx', 'utf-8');

const target = `    <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-[9990] pb-safe drop-shadow-[0_-4px_12px_rgba(0,0,0,0.03)] font-sans">`;

const replacement = `    <div className="fixed bottom-4 inset-x-4 bg-white/90 backdrop-blur-2xl border border-slate-100 z-[9990] rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] pb-safe font-sans overflow-hidden">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/mobile/MobileBottomNav.tsx', code);
