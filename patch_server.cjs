const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf-8');

const targetCode = `      if (action === "delete") {
        const { id } = payload;
        state.messages = state.messages.filter(m => m.id !== id);
        return res.json({ success: true });
      }`;

const replacementCode = `      if (action === "delete") {
        const { id } = payload;
        state.messages = state.messages.filter(m => m.id !== id);
        return res.json({ success: true });
      }
      if (action === "clear_chat") {
        const { myChatId, otherChatId, isGroup } = payload;
        if (isGroup) {
          state.messages = state.messages.filter(m => m.receiverId !== otherChatId);
        } else {
          state.messages = state.messages.filter(m => !(
            (m.senderId === myChatId && m.receiverId === otherChatId) ||
            (m.senderId === otherChatId && m.receiverId === myChatId)
          ));
        }
        return res.json({ success: true });
      }`;

code = code.replace(targetCode, replacementCode);
fs.writeFileSync('server.ts', code);
