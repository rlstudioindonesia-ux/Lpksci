import type { Request, Response } from "express";
import { syncEntityToFirestore, deleteEntityFromFirestore } from "../../src/db/firebase-adapter.ts";

// Inventory items
// Extracted verbatim from the monolithic /api/state/update handler in server.ts.
// Returns a truthy value (the Express Response) if this domain handled the
// (dataType, action) combination and already sent a response; otherwise false,
// so the caller (server/handlers/index.ts) can try the next domain in order.
export function handleInventoryState(req: Request, res: Response, dataType: string, action: string, payload: any, state: any) {


    if (dataType === "inventory" && action === "add") {
      const newItem = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        itemName: payload.itemName,
        code: payload.code || `INV-${payload.itemName.slice(0,3).toUpperCase()}-${Math.floor(Math.random()*90)+10}`,
        amount: Number(payload.amount),
        condition: payload.condition || "Baik",
        location: payload.location || "Kantor"
      };
      state.inventory.unshift(newItem);
      syncEntityToFirestore("inventory", newItem.id, newItem);
      return res.json({ success: true, item: newItem });
    }


    if (dataType === "inventory" && action === "delete") {
      const { id } = payload;
      state.inventory = state.inventory.filter(i => i.id !== id);
      if (id) deleteEntityFromFirestore("inventory", id);
      return res.json({ success: true, id });
    }


    if (dataType === "inventory" && action === "edit") {
      const idx = state.inventory.findIndex(i => i.id === payload.id);
      if (idx !== -1) {
        state.inventory[idx] = {
          ...state.inventory[idx],
          itemName: payload.itemName || state.inventory[idx].itemName,
          amount: Number(payload.amount) || state.inventory[idx].amount,
          condition: payload.condition || state.inventory[idx].condition,
          location: payload.location || state.inventory[idx].location,
        };
        syncEntityToFirestore("inventory", state.inventory[idx].id, state.inventory[idx]);
        return res.json({ success: true });
      }
      return res.status(404).json({ error: "Item not found" });
    }
  return false;
}
