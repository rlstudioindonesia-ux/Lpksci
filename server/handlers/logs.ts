import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

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
        const newLog = {
          id: logId,
          user: payload.user || "System",
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
          photoUrl: payload.photoUrl || ""
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
