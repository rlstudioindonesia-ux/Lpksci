const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const targetClass = "                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition drop-shadow-xs border ${unreadCount > 0 ? 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200 shadow-indigo-100/50' : index === 0 && latestMsgObj ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 shadow-emerald-100/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}";
const replacementClass = "                  className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition drop-shadow-xs border ${unreadCount > 0 ? 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200 shadow-indigo-100/50' : index === 0 && (latestMessageText || latestMessageTimeStr) ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100 shadow-emerald-100/50' : 'bg-white border-slate-200 hover:bg-slate-50'}`}";

code = code.replace(targetClass, replacementClass);

fs.writeFileSync('src/components/ChatView.tsx', code);
