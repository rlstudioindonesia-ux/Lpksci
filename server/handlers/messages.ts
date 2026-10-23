import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage } from "../../src/db/firebase-adapter.ts";

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
        let fileUrl = payload.fileUrl || "";

        const processMessage = async () => {
          if (fileUrl && typeof fileUrl === "string" && fileUrl.startsWith("data:")) {
            try {
              const commaIdx = fileUrl.indexOf(",");
              const semiIdx = fileUrl.indexOf(";");
              const mime = (semiIdx !== -1 && commaIdx !== -1) ? fileUrl.substring(5, semiIdx) : "application/octet-stream";
              const b64 = commaIdx !== -1 ? fileUrl.substring(commaIdx + 1) : fileUrl;
              const buf = Buffer.from(b64, "base64");
              const ext = mime.split("/")[1] || "dat";
              const safeName = payload.fileName ? payload.fileName.replace(/[^a-zA-Z0-9._-]/g, "_") : `chat_${Date.now()}.${ext}`;
              fileUrl = await uploadBufferToFirebaseStorage(buf, safeName, mime, "chat_attachments");
            } catch (storageErr) {
              console.warn("[Firebase Storage] Note during chat attachment upload:", storageErr);
            }
          }

          const newMessage = {
            id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            senderId: payload.senderId,
            senderName: payload.senderName,
            senderRole: payload.senderRole,
            receiverId: payload.receiverId,
            text: payload.text,
            fileUrl: fileUrl,
            fileType: payload.fileType || "",
            fileName: payload.fileName || "",
            timestamp: new Date().toISOString(),
            isRead: false
          };
          state.messages.push(newMessage);
          syncEntityToFirestore("messages", newMessage.id, newMessage);
          return res.json({ success: true, item: newMessage });
        };

        processMessage().catch((err) => {
          console.error("Error sending message:", err);
          return res.status(500).json({ error: "Failed to send message" });
        });
        return true;
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
