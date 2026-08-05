const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const target1 = `                      {/* Delete Button (Visible on Hover/Long Press) */}
                      {isMe && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}`;
                      
code = code.replace(target1, ``);

const target2 = `                    </div>
                    <span className="text-[8.5px] font-mono text-slate-400 px-1">
                      {timeStr}
                    </span>
                  </div>`;

const replacement2 = `                    </div>
                    <div className={\`flex items-center gap-1.5 px-1 \${isMe ? 'flex-row-reverse' : 'flex-row'}\`}>
                      <span className="text-[8.5px] font-mono text-slate-400">
                        {timeStr}
                      </span>
                      {(isMe || currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-0.5 active:scale-95"
                          title="Hapus Pesan"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>`;

code = code.replace(target2, replacement2);
fs.writeFileSync('src/components/ChatView.tsx', code);
