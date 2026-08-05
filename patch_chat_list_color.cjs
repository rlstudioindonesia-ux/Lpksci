const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const targetCode = `                  className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition drop-shadow-xs"`;
const replacementCode = `                  className={\`p-3 rounded-xl flex items-center justify-between cursor-pointer transition drop-shadow-xs border \${unreadCount > 0 ? 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100' : 'bg-white border-slate-200 hover:bg-slate-50'}\`}`;

code = code.replace(targetCode, replacementCode);
fs.writeFileSync('src/components/ChatView.tsx', code);
