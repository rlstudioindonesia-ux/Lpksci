import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// Chat messages
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleMessagesState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "messages") {
      if (!state.messages) {
        state.messages = [];
      }
      if (action === "send") {
        const newMessage = {
          id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          senderId: payload.senderId,
          senderName: payload.senderName,
          senderRole: payload.senderRole,
          receiverId: payload.receiverId,
          text: payload.text,
          fileUrl: payload.fileUrl || "",
          fileType: payload.fileType || "",
          fileName: payload.fileName || "",
          timestamp: new Date().toISOString(),
          isRead: false
        };
        state.messages.push(newMessage);
        syncEntityToFirestore("messages", newMessage.id, newMessage);
        return res.json({ success: true, item: newMessage });
      }
      if (action === "mark_read") {
        const { id } = payload;
        const msgIndex = state.messages.findIndex(m => m.id === id);
        if (msgIndex !== -1) {
          state.messages[msgIndex].isRead = true;
          syncEntityToFirestore("messages", id, state.messages[msgIndex]);
          return res.json({ success: true, updated: state.messages[msgIndex] });
        }
      }
      if (action === "mark_read_all") {
        const { senderId, receiverId } = payload;
        let updatedCount = 0;
        state.messages.forEach((m, idx) => {
          if (m.senderId === senderId && m.receiverId === receiverId && !m.isRead) {
            state.messages[idx].isRead = true;
            syncEntityToFirestore("messages", m.id, state.messages[idx]);
            updatedCount++;
          }
        });
        return res.json({ success: true, updatedCount });
      }
      if (action === "delete") {
        const { id } = payload;
        state.messages = state.messages.filter(m => m.id !== id);
        if (id) deleteEntityFromFirestore("messages", id);
        return res.json({ success: true, id });
      }
      if (action === "clear_chat") {
        const { myChatId, otherChatId, isGroup } = payload;
        const toRemove = isGroup
          ? state.messages.filter(m => m.receiverId === otherChatId)
          : state.messages.filter(m => (
              (m.senderId === myChatId && m.receiverId === otherChatId) ||
              (m.senderId === otherChatId && m.receiverId === myChatId)
            ));
        const removeIds = new Set(toRemove.map(m => m.id));
        state.messages = state.messages.filter(m => !removeIds.has(m.id));
        toRemove.forEach(m => deleteEntityFromFirestore("messages", m.id));
        return res.json({ success: true });
      }
    }
  return false;
}
