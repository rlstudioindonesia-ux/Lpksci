import type { Request, Response } from "express";
import { syncEntityToFirestore, syncCustomizationToFirestore, syncGalleriesToFirestore } from "../../src/db/firebase-adapter.ts";
import { refreshGalleries } from "../freshRead.ts";

// Slideshows and galleries
export async function handleMediaState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {
  const normAction = (action || "").toLowerCase();

  if (dataType === "slideshows" || dataType === "slideshow") {
    const isSaveAction = normAction === "update" || normAction === "upsert" || normAction === "edit" || normAction === "add" || normAction === "save";
    if (isSaveAction) {
      const list = Array.isArray(payload) ? payload : (payload.data || payload.slideshows || []);
      state.slideshows = list;
      syncEntityToFirestore("system", "slideshows", { data: state.slideshows, slideshows: state.slideshows });
      return res.json({ success: true, item: { id: "slideshows", data: state.slideshows } });
    }
  }

  if (dataType === "galleries" || dataType === "gallery") {
    // Normalizer to ensure consistent and complete photo structures
    const normalizeItem = (item: any, idx: number) => {
      let cleanId = item.id;
      if (!cleanId || cleanId === "null" || (typeof cleanId !== "string" && typeof cleanId !== "number")) {
        if (item.image && typeof item.image === "string" && item.image.includes("%2F")) {
          const filePart = item.image.split("%2F")[1]?.split("?")[0]?.replace(/[^a-zA-Z0-9_-]/g, "_");
          cleanId = "gal_" + filePart;
        } else {
          cleanId = "gal_" + (idx + 1) + "_" + Math.random().toString(36).slice(2, 7);
        }
      }
      return {
        id: String(cleanId),
        title: item.title !== undefined && item.title !== null && String(item.title).trim() !== ""
          ? String(item.title).trim()
          : "Dokumentasi Kegiatan LPK",
        image: item.image || item.img || item.url || "",
        tag: item.tag !== undefined && item.tag !== null && String(item.tag).trim() !== ""
          ? String(item.tag).trim()
          : "GALERI LPK",
        description: item.description !== undefined && item.description !== null
          ? String(item.description).trim()
          : ""
      };
    };

    // Deltas (delete / add / one photo) are applied to the latest list, so two
    // admins editing the gallery at once do not undo each other (server/freshRead.ts).
    const isDelta = normAction === "delete" || normAction === "remove" || normAction === "add" || normAction === "create" ||
      (!Array.isArray(payload) && payload && typeof payload === "object" && !Array.isArray(payload.data) && payload.id);
    if (isDelta) await refreshGalleries(state);

    // Ensure state.galleries is an initialized array
    if (!Array.isArray(state.galleries)) {
      state.galleries = [];
    }

    if (normAction === "delete" || normAction === "remove") {
      const targetId = payload?.id || (typeof payload === "string" ? payload : null);
      if (targetId) {
        state.galleries = state.galleries.filter((it: any) => String(it.id) !== String(targetId));
      }
    } else if (normAction === "add" || normAction === "create") {
      const newItem = normalizeItem(payload, state.galleries.length);
      state.galleries = [newItem, ...state.galleries.filter((it: any) => it.id !== newItem.id)];
    } else {
      // Full list update or single item update
      if (Array.isArray(payload)) {
        const normalized = payload.map(normalizeItem);
        // Safety guard: if payload was completely empty but state has items, do not wipe unless explicitly action === "clear"
        if (normalized.length > 0 || normAction === "clear") {
          state.galleries = normalized;
        }
      } else if (payload && typeof payload === "object") {
        if (Array.isArray(payload.data)) {
          state.galleries = payload.data.map(normalizeItem);
        } else if (payload.id) {
          const updatedItem = normalizeItem(payload, 0);
          const idx = state.galleries.findIndex((it: any) => String(it.id) === String(updatedItem.id));
          if (idx >= 0) {
            state.galleries[idx] = { ...state.galleries[idx], ...updatedItem };
          } else {
            state.galleries.unshift(updatedItem);
          }
        }
      }
    }

    // 23-10-2026: an emptied gallery stays empty (it used to refill itself with
    // the sample photos). `galleriesCleared` keeps it empty across restarts.
    state.galleriesCleared = state.galleries.length === 0;

    // Persist to state and Firestore
    if (state.customization) {
      state.customization.gallery = state.galleries;
      syncCustomizationToFirestore(state.customization);
    }
    syncGalleriesToFirestore(state.galleries);

    return res.json({ success: true, item: { id: "galleries", data: state.galleries } });
  }

  return false;
}
