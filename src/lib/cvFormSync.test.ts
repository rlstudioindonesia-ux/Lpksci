import { describe, it, expect } from "vitest";
import { shouldReloadCvForm } from "./cvFormSync";

describe("shouldReloadCvForm", () => {
  it("loads the form the first time a student is opened", () => {
    expect(shouldReloadCvForm({ previousStudentId: null, nextStudentId: "SIS-001", hasUnsavedChanges: false })).toBe(true);
  });

  it("keeps what the student is typing when the background refetch delivers a new object for the same student", () => {
    expect(shouldReloadCvForm({ previousStudentId: "SIS-001", nextStudentId: "SIS-001", hasUnsavedChanges: true })).toBe(false);
  });

  it("refreshes from the server when there are no unsaved edits", () => {
    expect(shouldReloadCvForm({ previousStudentId: "SIS-001", nextStudentId: "SIS-001", hasUnsavedChanges: false })).toBe(true);
  });

  it("always reloads when switching to a different student, even with unsaved edits", () => {
    expect(shouldReloadCvForm({ previousStudentId: "SIS-001", nextStudentId: "SIS-002", hasUnsavedChanges: true })).toBe(true);
  });

  it("does nothing without a student id", () => {
    expect(shouldReloadCvForm({ previousStudentId: "SIS-001", nextStudentId: undefined, hasUnsavedChanges: false })).toBe(false);
  });
});
