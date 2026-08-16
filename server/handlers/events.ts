import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// Calendar events
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleEventsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "events") {
      if (!state.events) {
        state.events = [];
      }
      if (action === "add") {
        const { title, date, desc, targets, type, studyTime, reminderTime, targetClass, time, url, location } = payload;
        const newEvent = {
          id: `EV-${Date.now().toString().slice(-4)}`,
          title,
          date,
          desc,
          targets: targets || ["Siswa", "Pengajar", "Admin", "VVIP"],
          type: type || "Kegiatan",
          studyTime: studyTime || "",
          reminderTime: reminderTime || "",
          targetClass: targetClass || "",
          time: time || "",
          url: url || "",
          location: location || ""
        };
        state.events.push(newEvent);
        try {
          syncEntityToFirestore("events", newEvent.id, newEvent);
        } catch (e) {
          console.error("Failed to sync newly added event to Firestore:", e);
        }
        return res.json({ success: true, item: newEvent });
      }
      if (action === "update") {
        const { id, title, date, desc, targets, type, studyTime, reminderTime, targetClass, time, url, location } = payload;
        const index = state.events.findIndex(e => e.id === id);
        if (index !== -1) {
          state.events[index] = {
            ...state.events[index],
            title: title !== undefined ? title : state.events[index].title,
            date: date !== undefined ? date : state.events[index].date,
            desc: desc !== undefined ? desc : state.events[index].desc,
            targets: targets !== undefined ? targets : state.events[index].targets,
            type: type !== undefined ? type : state.events[index].type,
            studyTime: studyTime !== undefined ? studyTime : state.events[index].studyTime,
            reminderTime: reminderTime !== undefined ? reminderTime : state.events[index].reminderTime,
            targetClass: targetClass !== undefined ? targetClass : state.events[index].targetClass,
            time: time !== undefined ? time : state.events[index].time,
            url: url !== undefined ? url : state.events[index].url,
            location: location !== undefined ? location : state.events[index].location,
          };
          try {
            syncEntityToFirestore("events", id, state.events[index]);
          } catch (e) {
            console.error("Failed to sync updated event to Firestore:", e);
          }
          return res.json({ success: true, item: state.events[index] });
        }
        return res.status(404).json({ error: "Event not found" });
      }
      if (action === "delete") {
        const { id } = payload;
        state.events = state.events.filter(e => e.id !== id);
        try {
          deleteEntityFromFirestore("events", id);
        } catch (e) {
          console.error("Failed to delete event from Firestore:", e);
        }
        return res.json({ success: true, id });
      }
    }
  return false;
}
