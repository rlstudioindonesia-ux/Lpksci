import { describe, it, expect } from "vitest";
import { uniqueIdSuffix, nextSequentialId, collectUsedStudentIds } from "./idGenerator";

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

describe("nextSequentialId", () => {
  it("continues after the highest id instead of list length + 1", () => {
    // JOB-001 was deleted: length + 1 would give JOB-003 and overwrite it.
    expect(nextSequentialId("JOB", ["JOB-002", "JOB-003"])).toBe("JOB-004");
  });

  it("never re-uses a deleted student's id that is still referenced", () => {
    const state = {
      activeStudents: [{ id: "SIS-001" }],
      attendance: [{ studentId: "SIS-002" }],
      chapterAssessments: [{ studentId: "SIS-003" }],
      jobOrders: [{ recommendations: ["SIS-004"], applicantDocuments: { "SIS-005": {} } }],
    };
    expect(nextSequentialId("SIS", collectUsedStudentIds(state))).toBe("SIS-006");
  });

  it("starts at 001 and ignores unrelated ids", () => {
    expect(nextSequentialId("SIS", ["REG-123", "admin", undefined])).toBe("SIS-001");
  });
});
