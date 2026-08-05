const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const targetCode = `            {filteredContacts.map(contact => {
              // Count unread messages from this contact
              const isGroup = "isGroup" in contact && contact.isGroup;
              const unreadCount = isGroup ? 0 : (systemState.messages?.filter(m => m.senderId === contact.username && m.receiverId === myChatId && !m.isRead).length || 0);
              
              return (
                <div 
                  key={contact.username}`;

const replacementCode = `            {filteredContacts.map(contact => {
              // Count unread messages from this contact
              const isGroup = "isGroup" in contact && contact.isGroup;
              const unreadCount = isGroup ? 0 : (systemState.messages?.filter(m => m.senderId === contact.username && m.receiverId === myChatId && !m.isRead).length || 0);
              
              // Get latest message text
              let latestMessageText = "";
              let latestMessageTimeStr = "";
              if (systemState.messages) {
                let latestMsgObj = null;
                if (isGroup) {
                  const msgs = systemState.messages.filter(m => m.receiverId === contact.username);
                  if (msgs.length > 0) latestMsgObj = msgs.reduce((prev, current) => (new Date(prev.timestamp).getTime() > new Date(current.timestamp).getTime()) ? prev : current);
                } else {
                  const msgs = systemState.messages.filter(m => 
                    (m.senderId === contact.username && m.receiverId === myChatId) ||
                    (m.senderId === myChatId && m.receiverId === contact.username)
                  );
                  if (msgs.length > 0) latestMsgObj = msgs.reduce((prev, current) => (new Date(prev.timestamp).getTime() > new Date(current.timestamp).getTime()) ? prev : current);
                }
                
                if (latestMsgObj) {
                  latestMessageText = latestMsgObj.content;
                  if (!latestMessageText && latestMsgObj.fileUrl) latestMessageText = "📷 Mengirim lampiran";
                  const dateObj = new Date(latestMsgObj.timestamp);
                  latestMessageTimeStr = dateObj.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
                }
              }
              
              return (
                <div 
                  key={contact.username}`;

code = code.replace(targetCode, replacementCode);

const layoutTarget = `<div className="text-[10px] text-slate-500 font-medium">
                        {contact.isGroup ? \`\${(systemState.users.filter(u => u.assignedClass === contact.name.replace("Kelas: ", "")).length)} Anggota\` : \`@\${contact.username}\`}
                      </div>`;

const layoutReplacement = `<div className="text-[10px] text-slate-500 font-medium max-w-[150px] sm:max-w-[180px] truncate">
                        {latestMessageText || (contact.isGroup ? \`\${(systemState.users.filter(u => u.assignedClass === contact.name.replace("Kelas: ", "")).length)} Anggota\` : \`@\${contact.username}\`)}
                      </div>`;

code = code.replace(layoutTarget, layoutReplacement);

const unreadTarget = `                  <div className="flex flex-col items-end gap-1">
                    <span className={\`text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase \${
                      (contact.role === "Admin" || contact.role === "Admin Super" || contact.role === "Admin Biasa") ? "bg-amber-100 text-amber-700" :`;

const unreadReplacement = `                  <div className="flex flex-col items-end gap-1">
                    {latestMessageTimeStr && (
                      <span className="text-[9px] text-slate-400 font-medium">{latestMessageTimeStr}</span>
                    )}
                    <span className={\`text-[8.5px] px-2 py-0.5 rounded-md font-bold uppercase \${
                      (contact.role === "Admin" || contact.role === "Admin Super" || contact.role === "Admin Biasa") ? "bg-amber-100 text-amber-700" :`;

code = code.replace(unreadTarget, unreadReplacement);

fs.writeFileSync('src/components/ChatView.tsx', code);
