import { describe, it, expect } from "vitest";
import { defaultStudentPaymentId, studentPaymentKey } from "./paymentIds";

describe("defaultStudentPaymentId", () => {
  it("gives students who share the first name different bill ids", () => {
    expect(defaultStudentPaymentId("Muhammad Rizki", "T1")).not.toBe(defaultStudentPaymentId("Muhammad Fauzi", "T1"));
  });

  it("is stable for the same student and safe as a document id", () => {
    expect(defaultStudentPaymentId("Siti Nur'aini / B", "AL")).toBe("PAY-SITINURAINIB-AL");
  });

  it("never returns an empty key", () => {
    expect(studentPaymentKey("")).toBe("SISWA");
  });
});
