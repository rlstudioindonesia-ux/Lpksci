const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const targetCode = `        <div className="flex flex-col h-full bg-slate-100 absolute inset-0 z-20 overflow-hidden">
          <div className="bg-[#00204a] text-white p-3 flex items-center gap-3 drop-shadow-md z-20 shrink-0">
            <button onClick={() => setActiveChatUser(null)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 transition"><ArrowLeft className="h-4 w-4" /></button>
            <div className="flex items-center gap-2">
              <img src={activeChatUser.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="h-8 w-8 rounded-md object-cover border border-[#003566]" alt=""/>
              <div>
                <h4 className="font-bold text-xs text-white leading-none">{activeChatUser.name}</h4>
                <p className="text-[9px] text-yellow-400/90 font-mono mt-0.5 uppercase tracking-wide">{activeChatUser.role}</p>
              </div>
            </div>
          </div>`;

const replacementCode = `        <div className="flex flex-col h-full bg-slate-100 absolute inset-0 z-20 overflow-hidden">
          <div className="bg-[#00204a] text-white p-3 flex items-center justify-between drop-shadow-md z-20 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveChatUser(null)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-200 transition"><ArrowLeft className="h-4 w-4" /></button>
              <div className="flex items-center gap-2">
                <img src={activeChatUser.profilePicture || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} className="h-8 w-8 rounded-md object-cover border border-[#003566]" alt=""/>
                <div>
                  <h4 className="font-bold text-xs text-white leading-none">{activeChatUser.name}</h4>
                  <p className="text-[9px] text-yellow-400/90 font-mono mt-0.5 uppercase tracking-wide">{activeChatUser.role}</p>
                </div>
              </div>
            </div>
            {((currentUser.role === "Admin" || currentUser.role === "Admin Super" || currentUser.role === "Admin Biasa") || !("isGroup" in activeChatUser && activeChatUser.isGroup)) && (
              <button 
                onClick={async () => {
                  if (window.confirm("Apakah Anda yakin ingin membersihkan seluruh pesan di obrolan ini? Tindakan ini tidak dapat dibatalkan.")) {
                    await onUpdateState("messages", "clear_chat", { 
                      myChatId, 
                      otherChatId: activeChatUser.username, 
                      isGroup: "isGroup" in activeChatUser && activeChatUser.isGroup 
                    });
                  }
                }}
                className="p-1.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg text-slate-300 transition"
                title="Bersihkan Chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>`;

code = code.replace(targetCode, replacementCode);
fs.writeFileSync('src/components/ChatView.tsx', code);
