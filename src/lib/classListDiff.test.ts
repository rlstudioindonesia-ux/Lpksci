import { describe, it, expect } from "vitest";
import { diffClassList, applyClassListDiff, diffShallowObject } from "./classListDiff";

const A = { id: "KLS-A", name: "Kelas A", chapters: [{ number: 1, isActive: true }, { number: 2, isActive: false }] };
const B = { id: "KLS-B", name: "Kelas B", chapters: [{ number: 1, isActive: true }, { number: 2, isActive: false }] };

describe("class list diff", () => {
  it("does not close another Sensei's freshly opened chapter", () => {
    // Device 1 (stale copy) opens Bab 2 for Kelas A.
    const device1Base = [A, B];
    const device1Next = [{ ...A, chapters: [A.chapters[0], { number: 2, isActive: true }] }, B];
    // Meanwhile the server already has Bab 2 opened for Kelas B by device 2.
    const server = [A, { ...B, chapters: [B.chapters[0], { number: 2, isActive: true }] }];

    const merged = applyClassListDiff(server, diffClassList(device1Base, device1Next));
    expect(merged.find((c) => c.id === "KLS-A")!.chapters[1].isActive).toBe(true);
    expect(merged.find((c) => c.id === "KLS-B")!.chapters[1].isActive).toBe(true);
  });

  it("applies deletions and additions", () => {
    const diff = diffClassList([A, B], [A, { id: "KLS-C", name: "Kelas C" }]);
    expect(diff.changed.map((c) => c.id)).toEqual(["KLS-C"]);
    const merged = applyClassListDiff([A, B], diff);
    expect(merged.map((c) => c.id)).toEqual(["KLS-A", "KLS-C"]);
  });

  it("does not treat assigning an id to an id-less class as a deletion", () => {
    const base = [{ name: "Kelas Lama" }];
    const next = [{ id: "KLS-1", name: "Kelas Lama" }];
    const merged = applyClassListDiff(base, diffClassList(base, next));
    expect(merged).toEqual([{ id: "KLS-1", name: "Kelas Lama" }]);
  });
});

describe("diffShallowObject", () => {
  it("only returns the keys the device actually changed", () => {
    const base = { runningText: "lama", landingConfig: { a: 1 }, logoText: "LPK" };
    const next = { ...base, runningText: "baru" };
    expect(diffShallowObject(base, next)).toEqual({ runningText: "baru" });
  });

  it("skips listed keys", () => {
    expect(diffShallowObject({}, { lmsClasses: [], x: 1 }, ["lmsClasses"])).toEqual({ x: 1 });
  });
});
