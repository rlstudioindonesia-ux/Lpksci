import { describe, it, expect } from "vitest";
import { uniqueIdSuffix } from "./idGenerator";

describe("uniqueIdSuffix", () => {
  it("does not repeat even when many ids are created in the same millisecond", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => `CAS-${uniqueIdSuffix()}`));
    expect(ids.size).toBe(2000);
  });

  it("keeps the full timestamp so ids still sort by creation time", () => {
    const before = Date.now();
    const suffix = uniqueIdSuffix();
    expect(Number(suffix.slice(0, String(before).length))).toBeGreaterThanOrEqual(before);
  });
});
