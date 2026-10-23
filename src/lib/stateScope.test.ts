import { describe, it, expect } from "vitest";
import { scopeStateForViewer } from "./stateScope";

const payload = {
  activeStudents: [
    { id: "SIS-001", name: "Budi", email: "budi@x.id", phone: "0811", docKTP: "ktp|url", class: "A", referrer: "alumni1" },
    { id: "SIS-002", name: "Sari", email: "sari@x.id", phone: "0822", docKTP: "ktp2|url", class: "A" },
  ],
  registeredStudents: [
    { id: "REG-1", name: "Andi", phone: "0833", referrer: "alumni1", status: "Pending" },
    { id: "REG-2", name: "Dewi", phone: "0844", status: "Pending" },
  ],
  users: [
    { username: "budi@x.id", name: "Budi", role: "Siswa", email: "budi@x.id", bankAccount: "123" },
    { username: "sari@x.id", name: "Sari", role: "Siswa", email: "sari@x.id", bankAccount: "456" },
    { username: "sensei1", name: "Tanaka", role: "Pengajar", email: "t@x.id", bankAccount: "789" },
  ],
  payments: [
    { id: "P1", studentName: "Budi", amount: 100 },
    { id: "P2", studentName: "Sari", amount: 200 },
  ],
  attendance: [{ id: "A1", studentId: "SIS-001" }, { id: "A2", studentId: "SIS-002" }],
  chapterAssessments: [
    { id: "C1", studentId: "SIS-001", score: 80, studentQuizAnswers: ["a"] },
    { id: "C2", studentId: "SIS-002", score: 90, studentQuizAnswers: ["b"] },
  ],
  messages: [
    { id: "M1", senderId: "budi@x.id", receiverId: "sensei1" },
    { id: "M2", senderId: "sari@x.id", receiverId: "sensei1" },
    { id: "M3", senderId: "sari@x.id", receiverId: "kelas_A" },
  ],
  cashLedger: [{ id: "K1" }],
  salaries: [{ id: "G1" }],
  customization: { themeColor: "blue" },
};

describe("scopeStateForViewer", () => {
  it("gives staff everything", () => {
    expect(scopeStateForViewer(payload, { username: "admin", role: "Admin" })).toBe(payload);
    expect(scopeStateForViewer(payload, { username: "sensei1", role: "Pengajar" })).toBe(payload);
  });

  it("gives a student their own records in full and only public fields of others", () => {
    const s = scopeStateForViewer(payload, { username: "budi@x.id", role: "Siswa", studentId: "SIS-001", name: "Budi" });
    expect(s.activeStudents[0].phone).toBe("0811");
    expect(s.activeStudents[1]).toEqual({ id: "SIS-002", name: "Sari", class: "A" });
    expect(s.payments.map((p: any) => p.id)).toEqual(["P1"]);
    expect(s.attendance.map((a: any) => a.id)).toEqual(["A1"]);
    expect(s.chapterAssessments[1].studentQuizAnswers).toBeUndefined();
    expect(s.chapterAssessments[0].studentQuizAnswers).toEqual(["a"]);
    expect(s.users.find((u: any) => u.username === "sari@x.id").bankAccount).toBeUndefined();
    expect(s.users.find((u: any) => u.username === "budi@x.id").bankAccount).toBe("123");
    expect(s.messages.map((m: any) => m.id)).toEqual(["M1", "M3"]);
    expect(s.cashLedger).toEqual([]);
    expect(s.salaries).toEqual([]);
    expect(s.registeredStudents).toEqual([{ id: "REG-1", name: "Andi", referrer: "alumni1", status: "Pending" }]);
  });

  it("gives visitors only what the public website needs", () => {
    const v = scopeStateForViewer(payload, null);
    expect(v.activeStudents[0].email).toBeUndefined();
    expect(v.registeredStudents).toEqual([]);
    expect(v.users.map((u: any) => u.username)).toEqual(["sensei1"]);
    expect(v.users[0].email).toBeUndefined();
    expect(v.payments).toEqual([]);
    expect(v.messages).toEqual([]);
    expect(v.customization).toEqual({ themeColor: "blue" });
  });
});
