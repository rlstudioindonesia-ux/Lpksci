import { describe, it, expect } from "vitest";
import { mergeRecentLocalItems } from "./recentLocalItems";

describe("mergeRecentLocalItems", () => {
  const now = 1_000_000;

  it("keeps an item this device just saved that the server does not return yet", () => {
    const recent = new Map([["Q-NEW", now - 5_000]]);
    const result = mergeRecentLocalItems([{ id: "Q-1" }], [{ id: "Q-1" }, { id: "Q-NEW" }], recent, now);
    expect(result.map((q) => q.id)).toEqual(["Q-1", "Q-NEW"]);
  });

  it("drops items deleted elsewhere instead of resurrecting them", () => {
    const result = mergeRecentLocalItems([{ id: "Q-1" }], [{ id: "Q-1" }, { id: "Q-DELETED" }], new Map(), now);
    expect(result.map((q) => q.id)).toEqual(["Q-1"]);
  });

  it("stops protecting a local item after the time window", () => {
    const recent = new Map([["Q-OLD", now - 10 * 60 * 1000]]);
    const result = mergeRecentLocalItems([], [{ id: "Q-OLD" }], recent, now);
    expect(result).toEqual([]);
  });
});
