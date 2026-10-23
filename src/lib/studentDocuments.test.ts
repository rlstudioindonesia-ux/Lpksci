import { describe, it, expect } from "vitest";
import { EXTRA_STUDENT_DOCUMENTS, EXTRA_STUDENT_DOCUMENT_FIELDS } from "./studentDocuments";

describe("EXTRA_STUDENT_DOCUMENTS", () => {
  it("adds the six documents requested on top of the original 17", () => {
    expect(EXTRA_STUDENT_DOCUMENTS.map((d) => d.label)).toEqual([
      "Sertifikat JFT / JLPT / NAT",
      "Sertifikat SSW 1",
      "Sertifikat SSW 2",
      "Sertifikat LPK SCI",
      "COE (Certificate of Eligibility)",
      "CV (Curriculum Vitae)",
    ]);
  });

  it("uses unique field names that do not clash with the existing CV parts (docCV1..docCV5)", () => {
    expect(new Set(EXTRA_STUDENT_DOCUMENT_FIELDS).size).toBe(EXTRA_STUDENT_DOCUMENT_FIELDS.length);
    for (const field of EXTRA_STUDENT_DOCUMENT_FIELDS) {
      expect(field.startsWith("doc")).toBe(true);
      expect(/^docCV\d$/.test(field)).toBe(false);
    }
  });
});
