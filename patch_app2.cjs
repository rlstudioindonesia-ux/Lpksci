const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `      <div className="flex-1 flex flex-col w-full bg-slate-50">
        <div 
          className="w-full bg-slate-50 relative flex-1 flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden sm:rounded-3xl sm:my-4 sm:border sm:border-slate-200"
        >`;

const replacement = `      <div className="flex-1 flex flex-col w-full bg-slate-100/50 sm:p-6 justify-center items-center">
        <div 
          className="w-full bg-slate-50 relative flex-1 flex flex-col max-w-[400px] sm:max-h-[850px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden sm:rounded-[2.5rem] sm:border-[6px] sm:border-white ring-1 ring-slate-200/50"
        >`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
