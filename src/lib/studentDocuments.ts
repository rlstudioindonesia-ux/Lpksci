/**
 * Additional student documents (on top of the original 17: KTP ... Kontrak
 * Kerja) requested by LPK SCI for the Japan placement process. Shared by every
 * document list (admin StudentDocsManager, student Account Settings, LMS
 * "Dokumen" tab) and by the server so the files survive the
 * registeredStudents -> activeStudents approval copy.
 */
export interface ExtraStudentDocument {
  field: string;
  label: string;
  type: string;
  color: string;
}

export const EXTRA_STUDENT_DOCUMENTS: ExtraStudentDocument[] = [
  { field: "docSertifikatJFT", label: "Sertifikat JFT / JLPT / NAT", type: "SERT", color: "purple" },
  { field: "docSertifikatSSW1", label: "Sertifikat SSW 1", type: "SERT", color: "purple" },
  { field: "docSertifikatSSW2", label: "Sertifikat SSW 2", type: "SERT", color: "purple" },
  { field: "docSertifikatLPK", label: "Sertifikat LPK SCI", type: "SERT", color: "purple" },
  { field: "docCOE", label: "COE (Certificate of Eligibility)", type: "COE", color: "emerald" },
  { field: "docCV", label: "CV (Curriculum Vitae)", type: "CV", color: "amber" },
];

export const EXTRA_STUDENT_DOCUMENT_FIELDS: string[] = EXTRA_STUDENT_DOCUMENTS.map((d) => d.field);
