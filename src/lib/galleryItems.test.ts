import { describe, it, expect } from "vitest";
import { pickGalleryItems } from "./galleryItems";

describe("pickGalleryItems", () => {
  it("prefers saved photos, stays empty once cleared, otherwise falls back", () => {
    expect(pickGalleryItems([1], [2], true, [9])).toEqual([1]);
    expect(pickGalleryItems([], [2], true, [9])).toEqual([]);
    expect(pickGalleryItems([], [2], false, [9])).toEqual([2]);
    expect(pickGalleryItems(undefined, undefined, false, [9])).toEqual([9]);
  });
});
