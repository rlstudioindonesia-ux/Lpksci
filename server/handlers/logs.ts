import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore, uploadBufferToFirebaseStorage } from "../../src/db/firebase-adapter.ts";

// Audit trail logs
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleLogsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "logs") {
      if (!state.logs) {
        state.logs = [];
      }
      if (action === "add") {
        const logId = payload.id || `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const timeStr = payload.timestamp || payload.time || new Date().toISOString();
        
        let photoUrl = payload.photoUrl || "";
        
        // Handle asynchronous storage upload if raw base64 data was passed
        const processLog = async () => {
          if (photoUrl && typeof photoUrl === "string" && photoUrl.startsWith("data:image")) {
            try {
              const commaIdx = photoUrl.indexOf(",");
              const semiIdx = photoUrl.indexOf(";");
              const mime = (semiIdx !== -1 && commaIdx !== -1) ? photoUrl.substring(5, semiIdx) : "image/jpeg";
              const b64 = commaIdx !== -1 ? photoUrl.substring(commaIdx + 1) : photoUrl;
              const buf = Buffer.from(b64, "base64");
              const filename = `absen_${payload.username || payload.user || "staff"}_${Date.now()}.jpg`;
              photoUrl = await uploadBufferToFirebaseStorage(buf, filename, mime, "attendance_photos");
            } catch (storageErr) {
              console.warn("[Firebase Storage] Note during attendance log upload:", storageErr);
            }
          }

          const newLog = {
            id: logId,
            user: payload.user || payload.username || "System",
            username: payload.username || payload.user || "",
            role: payload.role || "",
            action: payload.action || payload.type || "Presensi",
            type: payload.type || "info",
            details: payload.description || payload.details || "",
            target: payload.target || "",
            time: timeStr,
            timestamp: timeStr,
            notes: payload.notes || "",
            description: payload.description || payload.details || "",
            clockType: payload.clockType || "",
            workMode: payload.workMode || "",
            latitude: payload.latitude || "",
            longitude: payload.longitude || "",
            location: payload.location || "",
            photoUrl: photoUrl,
            ip: payload.ip || "",
            device: payload.device || "",
            status: payload.status || ""
          };

          const existingIndex = state.logs.findIndex((l: any) => l.id === logId);
          if (existingIndex !== -1) {
            state.logs[existingIndex] = newLog;
          } else {
            state.logs.unshift(newLog);
          }
          if (state.logs.length > 500) {
            state.logs.pop();
          }
          
          // Sync as its own document only - packing the whole array into one "audit_trail"
          // doc can exceed Firestore's 1MB/doc limit once entries carry embedded photos.
          syncEntityToFirestore("logs", logId, newLog);
          return res.json({ success: true, item: newLog });
        };

        processLog().catch((err) => {
          console.error("Error processing log:", err);
          return res.status(500).json({ error: "Failed to process log" });
        });
        return true;
      }

      if (action === "delete") {
        const { id } = payload;
        if (id) {
          state.logs = state.logs.filter((l: any) => l.id !== id);
          deleteEntityFromFirestore("logs", id);
        }
        return res.json({ success: true, id });
      }
    }
  return false;
}
