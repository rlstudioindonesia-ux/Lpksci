/**
 * Name part of a student's default bill id (PAY-<KEY>-<suffix>).
 *
 * It used to be the first 6 letters of the name, so "Muhammad Rizki" and
 * "Muhammad Fauzi" both became PAY-MUHAMM-...: paying one student's default
 * bill created/overwrote a payment with the SAME id as the other student's,
 * moving that record (and its "Lunas" status) to the wrong student. Existing
 * records are still found by category within the student's own payments, so
 * the longer key does not orphan them.
 */
export function studentPaymentKey(studentName: string | null | undefined): string {
  return String(studentName || "").toUpperCase().replace(/[^A-Z0-9]/g, "") || "SISWA";
}

export function defaultStudentPaymentId(studentName: string | null | undefined, suffix: string): string {
  return `PAY-${studentPaymentKey(studentName)}-${suffix}`;
}
