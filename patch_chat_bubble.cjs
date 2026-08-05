const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const target1 = `                      <div className={\`px-4 py-2.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed shadow-xs \${
                        isMe 
                          ? 'bg-[#003566] text-white rounded-tr-sm' 
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                      }\`}>`;

const replacement1 = `                      <div className={\`px-4 py-2.5 rounded-2xl max-w-[85%] text-[11px] leading-relaxed shadow-xs \${
                        isMe 
                          ? (msg.isRead ? 'bg-[#003566] text-white rounded-tr-sm' : 'bg-slate-600 text-white rounded-tr-sm') 
                          : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                      }\`}>`;

code = code.replace(target1, replacement1);

const target2 = `                    <div className={\`flex items-center gap-1.5 px-1 \${isMe ? 'flex-row-reverse' : 'flex-row'}\`}>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        {timeStr}
                      </span>
                      {(isMe || currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") && (`;

const replacement2 = `                    <div className={\`flex items-center gap-1.5 px-1 \${isMe ? 'flex-row-reverse' : 'flex-row'}\`}>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        {timeStr}
                      </span>
                      {isMe && (
                        <span className="text-[10px]" title={msg.isRead ? "Dibaca" : "Terkirim"}>
                          {msg.isRead ? <CheckCheck className="h-3 w-3 text-blue-500" /> : <Check className="h-3 w-3 text-slate-400" />}
                        </span>
                      )}
                      {(isMe || currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") && (`;

code = code.replace(target2, replacement2);

fs.writeFileSync('src/components/ChatView.tsx', code);
