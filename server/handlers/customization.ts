import type { Request, Response } from "express";
import { syncEntityToFirestore, syncCustomizationToFirestore, syncLmsClassToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// Site customization/branding + landing config
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleCustomizationState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "customization" && action === "update") {
      // Check if lmsClasses is being updated to log
      if (payload.lmsClasses && state.customization.lmsClasses) {
        const oldLen = state.customization.lmsClasses.length;
        const newLen = payload.lmsClasses.length;
        if (oldLen !== newLen) {
           if (!state.logs) state.logs = [];
           const actionDesc = newLen > oldLen ? "Menambahkan Kelas Baru" : "Menghapus Kelas";
           const auditLogEntry = {
              id: `LOG-${Date.now()}`,
              user: req.body.actingUserName ? `[${req.body.userRole || 'Admin'}] ${req.body.actingUserName}` : "Admin/VVIP",
              action: actionDesc,
              target: "Sistem Kelas",
              time: new Date().toISOString(),
              type: "system",
              details: `Total kelas berubah dari ${oldLen} menjadi ${newLen}`
           };
           state.logs.unshift(auditLogEntry);
           if (state.logs.length > 200) state.logs.pop();
           // Sync as its own document - see note above about avoiding the oversized
           // consolidated "audit_trail" document.
           syncEntityToFirestore("logs", auditLogEntry.id, auditLogEntry);
        }
      }

      const { lmsClasses, deletedLmsClassId, renamedClass, ...payloadWithoutClasses } = payload;
      state.customization = {
        ...state.customization,
        ...payloadWithoutClasses
      };
      if (lmsClasses) {
         state.customization.lmsClasses = lmsClasses;
         state.lmsClasses = lmsClasses;
         lmsClasses.forEach(syncLmsClassToFirestore);
      }
      if (deletedLmsClassId) {
         state.lmsClasses = (state.lmsClasses || []).filter((c: any) => c.id !== deletedLmsClassId && (c.name || '').toLowerCase() !== deletedLmsClassId.toLowerCase());
         state.customization.lmsClasses = (state.customization.lmsClasses || []).filter((c: any) => c.id !== deletedLmsClassId && (c.name || '').toLowerCase() !== deletedLmsClassId.toLowerCase());
         deleteEntityFromFirestore("lmsClasses", deletedLmsClassId);
      }

      if (renamedClass && renamedClass.oldName && renamedClass.newName) {
        const { oldName, newName } = renamedClass;
        if (state.activeStudents) {
          state.activeStudents.forEach(s => {
            if (s.class === oldName) {
              s.class = newName;
              syncEntityToFirestore("activeStudents", s.id, s);
            }
          });
        }
        if (state.users) {
          state.users.forEach(u => {
            if (u.assignedClass === oldName) {
              u.assignedClass = newName;
              syncEntityToFirestore("users", u.username, u);
            }
          });
        }
        if (state.registeredStudents) {
          state.registeredStudents.forEach(r => {
            if (r.class === oldName) {
              r.class = newName;
              syncEntityToFirestore("registeredStudents", r.id, r);
            }
          });
        }
        if (state.events) {
          state.events.forEach(e => {
            if (e.targetClass === oldName) {
              e.targetClass = newName;
              syncEntityToFirestore("events", e.id, e);
            }
          });
        }
        if (state.lmsLessons) {
          state.lmsLessons.forEach(l => {
            if (l.targetClass === oldName) {
              l.targetClass = newName;
              syncEntityToFirestore("lmsLessons", l.id, l);
            }
          });
        }
        if (state.lmsQuizzes) {
          state.lmsQuizzes.forEach(q => {
            if (q.targetClass === oldName) {
              q.targetClass = newName;
              syncEntityToFirestore("lmsQuizzes", q.id, q);
            }
          });
        }
      }
      syncCustomizationToFirestore(state.customization);
      return res.json({ success: true, customization: state.customization });
    }
  return false;
}
