import { describe, it, expect } from "vitest";
import { authorizeStateUpdate } from "./apiAccess";

const ctx = {
  activeStudents: [
    { id: "SIS-001", name: "Budi", email: "budi@x.id" },
    { id: "SIS-002", name: "Sari", email: "sari@x.id" },
  ],
  registeredStudents: [{ id: "REG-9", name: "Andi", email: "andi@x.id" }],
  payments: [
    { id: "PAY-1", studentName: "Budi", status: "Belum Bayar" },
    { id: "PAY-2", studentName: "Sari", status: "Belum Bayar" },
  ],
  messages: [{ id: "M1", senderId: "budi@x.id" }],
};
const budi = { username: "budi@x.id", role: "Siswa", name: "Budi", email: "budi@x.id", studentId: "SIS-001" };
const sensei = { username: "sensei1", role: "Pengajar", name: "Sensei Tanaka" };
const admin = { username: "admin", role: "Admin" };

describe("authorizeStateUpdate", () => {
  it("rejects anonymous requests and allows admins everything", () => {
    expect(authorizeStateUpdate(null, "payments", "status", {}, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(admin, "payments", "status", { id: "PAY-1", status: "Lunas" }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate({ username: "v", role: "VVIP" }, "users", "delete", {}, ctx).allowed).toBe(true);
  });

  it("students change only their own data and cannot change privileged fields", () => {
    const own = authorizeStateUpdate(budi, "activeStudents", "update", { id: "SIS-001", phone: "0812", status: "Di Jepang", class: "X" }, ctx);
    expect(own.allowed).toBe(true);
    expect(own.payload).toEqual({ id: "SIS-001", phone: "0812" });
    expect(authorizeStateUpdate(budi, "activeStudents", "update", { id: "SIS-002", phone: "1" }, ctx).allowed).toBe(false);
    const acc = authorizeStateUpdate(budi, "users", "edit", { username: "budi@x.id", name: "Budi S", role: "VVIP", status: "Active" }, ctx);
    expect(acc.payload).toEqual({ username: "budi@x.id", name: "Budi S" });
    expect(authorizeStateUpdate(budi, "users", "edit", { username: "admin", password: "x" }, ctx).allowed).toBe(false);
  });

  it("students cannot mark their own bill as paid, nor touch other bills", () => {
    const d = authorizeStateUpdate(budi, "payments", "update_payment", { id: "PAY-1", status: "Lunas", isSigned: true, proofOfPayment: "url" }, ctx);
    expect(d.allowed).toBe(true);
    expect(d.payload).toEqual({ id: "PAY-1", status: "Pending", proofOfPayment: "url" });
    expect(authorizeStateUpdate(budi, "payments", "update_payment", { id: "PAY-2" }, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(budi, "payments", "status", { id: "PAY-1", status: "Lunas" }, ctx).allowed).toBe(false);
  });

  it("students submit only their own quiz, attendance and job interest", () => {
    expect(authorizeStateUpdate(budi, "chapterAssessments", "update", { studentId: "SIS-001" }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(budi, "chapterAssessments", "update", { studentId: "SIS-002" }, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(budi, "attendance", "add", { studentId: "SIS-001" }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(budi, "jobOrders", "express_interest", { studentId: "SIS-002" }, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(budi, "users", "add", { username: "x", role: "Admin" }, ctx).allowed).toBe(false);
  });

  it("messages are sent and deleted only as yourself", () => {
    expect(authorizeStateUpdate(budi, "messages", "send", { senderId: "budi@x.id" }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(budi, "messages", "send", { senderId: "admin" }, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(budi, "messages", "delete", { id: "M1" }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(sensei, "messages", "delete", { id: "M1" }, ctx).allowed).toBe(false);
  });

  it("teachers manage teaching data but not money, accounts or site settings", () => {
    expect(authorizeStateUpdate(sensei, "attendance", "edit", {}, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(sensei, "chapterAssessments", "delete", {}, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(sensei, "activeStudents", "update_status", { id: "SIS-002" }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(sensei, "customization", "update", { lmsClassesDiff: {} }, ctx).allowed).toBe(true);
    expect(authorizeStateUpdate(sensei, "customization", "update", { landingConfig: {} }, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(sensei, "payments", "status", {}, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(sensei, "activeStudents", "delete", {}, ctx).allowed).toBe(false);
    expect(authorizeStateUpdate(sensei, "teacherLeaves", "add", { teacherName: "Orang Lain" }, ctx).payload.teacherName).toBe("Sensei Tanaka");
    expect(authorizeStateUpdate(sensei, "teacherContracts", "sign", { teacherName: "Orang Lain" }, ctx).allowed).toBe(false);
  });
});
