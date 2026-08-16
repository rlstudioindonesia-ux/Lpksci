import type { Request, Response } from "express";
import { syncEntityToFirestore, syncCustomizationToFirestore } from "../../src/db/firebase-adapter.ts";

// Slideshows and galleries
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleMediaState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "slideshows" && action === "update") {
      state.slideshows = payload;
      syncEntityToFirestore("system", "slideshows", { data: state.slideshows });
      return res.json({ success: true, item: { id: "slideshows", data: state.slideshows } });
    }

    if (dataType === "galleries" && action === "update") {
      state.galleries = payload;
      if (state.customization) {
        state.customization.gallery = payload;
        syncCustomizationToFirestore(state.customization);
      }
      syncEntityToFirestore("system", "galleries", { data: state.galleries });
      return res.json({ success: true, item: { id: "galleries", data: state.galleries } });
    }
  return false;
}
