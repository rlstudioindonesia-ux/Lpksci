const fs = require('fs');
let code = fs.readFileSync('src/components/ChatView.tsx', 'utf-8');

const getLatestCode = `  const getLatestMessageTime = (contactUsername: string, isGroup: boolean) => {
    if (!systemState.messages) return 0;
    
    let latestMsg = 0;
    if (isGroup) {
      const msgs = systemState.messages.filter((m: any) => m.receiverId === contactUsername);
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        latestMsg = new Date(lastMsg.timestamp).getTime();
      }
    } else {
      const msgs = systemState.messages.filter((m: any) => 
        (m.senderId === contactUsername && m.receiverId === myChatId) ||
        (m.senderId === myChatId && m.receiverId === contactUsername)
      );
      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        latestMsg = new Date(lastMsg.timestamp).getTime();
      }
    }
    return latestMsg;
  };

  const filteredContacts = (selectedTab === "personal" ? personalContacts : groupContacts)
    .filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = getLatestMessageTime(a.username, "isGroup" in a ? a.isGroup : false);
      const timeB = getLatestMessageTime(b.username, "isGroup" in b ? b.isGroup : false);
      return timeB - timeA;
    });`;

const origFiltered = `  const filteredContacts = (selectedTab === "personal" ? personalContacts : groupContacts).filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.username.toLowerCase().includes(searchTerm.toLowerCase())
  );`;

code = code.replace(origFiltered, getLatestCode);
fs.writeFileSync('src/components/ChatView.tsx', code);
