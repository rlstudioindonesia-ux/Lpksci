const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `      {/* Mobile view: full custom landing portal as requested */}
      {isMobile && (
      <div className="flex-1 flex flex-col w-full">
        <div 
          className="w-full bg-white relative flex-1 flex flex-col"
        >
          <div className="w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col">`;

const replacement = `      {/* Mobile view: full custom landing portal as requested */}
      {isMobile && (
      <div className="flex-1 flex flex-col w-full bg-slate-50">
        <div 
          className="w-full bg-slate-50 relative flex-1 flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden sm:rounded-3xl sm:my-4 sm:border sm:border-slate-200"
        >
          <div className="w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col bg-slate-50">`;

code = code.replace(target, replacement);
fs.writeFileSync('src/App.tsx', code);
