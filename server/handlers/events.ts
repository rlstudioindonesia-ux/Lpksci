import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";
import { uniqueIdSuffix } from "../../src/lib/idGenerator.ts";
import { refreshListItem } from "../freshRead.ts";

// Calendar events
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export async function handleEventsState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "events") {
      if (!state.events) {
        state.events = [];
      }
      if (action === "add") {
        const { title, date, desc, targets, type, studyTime, reminderTime, targetClass, time, url, location } = payload;
        const newEvent = {
          id: `EV-${uniqueIdSuffix()}`,
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

        // Also publish to broadcast_notifications in Firestore and state
        const broadcastItem = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: `📅 Agenda / Jadwal Harian Baru: ${title || "Kegiatan LPK"}`,
          body: `Agenda baru untuk tanggal ${date || "hari ini"}: ${title || "Jadwal LPK"}. ${desc ? String(desc).slice(0, 90) : ""}`,
          type: "jadwal_harian",
          url: "/?tab=kalender",
          createdAt: Date.now(),
          timestamp: new Date().toISOString()
        };
        if (!state.broadcastNotifications) state.broadcastNotifications = [];
        state.broadcastNotifications.unshift(broadcastItem);
        if (state.broadcastNotifications.length > 50) {
          state.broadcastNotifications = state.broadcastNotifications.slice(0, 50);
        }
        try {
          syncEntityToFirestore("broadcast_notifications", broadcastItem.id, broadcastItem);
        } catch (e) {
          console.error("Failed to sync broadcast notification for event:", e);
        }

        return res.json({ success: true, item: newEvent });
      }
      if (action === "update") {
        // Latest version first: another instance may have changed this event (server/freshRead.ts).
        await refreshListItem(state, "events", "events", payload?.id);
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
