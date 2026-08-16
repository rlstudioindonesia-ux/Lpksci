import { describe, it, expect } from "vitest";
import { resolveGoogleSignupRole } from "./googleAuthProvisioning";

describe("resolveGoogleSignupRole", () => {
  it("grants VVIP to an allow-listed VVIP email", () => {
    expect(resolveGoogleSignupRole("rlstudioindonesia@gmail.com", null, null)).toEqual({ role: "VVIP" });
  });

  it("grants Pengajar to an allow-listed Pengajar email", () => {
    expect(resolveGoogleSignupRole("sulisindonesia@gmail.com", null, null)).toEqual({ role: "Pengajar" });
  });

  it("grants Admin to any email containing 'admin'", () => {
    expect(resolveGoogleSignupRole("admin@lpksci.com", null, null)).toEqual({ role: "Admin" });
    expect(resolveGoogleSignupRole("superadmin123@gmail.com", null, null)).toEqual({ role: "Admin" });
  });

  it("grants Admin to the specific hardcoded staff email", () => {
    expect(resolveGoogleSignupRole("sakti.wardana@lpksc.id", null, null)).toEqual({ role: "Admin" });
  });

  it("assigns Siswa with the linked studentId/class for an active, still-studying student", () => {
    const result = resolveGoogleSignupRole(
      "budi@gmail.com",
      { id: "SIS-1", class: "Kelas A", status: "Belajar" },
      null,
    );
    expect(result).toEqual({ role: "Siswa", studentId: "SIS-1", assignedClass: "Kelas A" });
  });

  it("assigns Alumni when the matched active student has graduated (Lulus/Di Jepang)", () => {
    expect(resolveGoogleSignupRole("a@gmail.com", { id: "S1", status: "Lulus" }, null).role).toBe("Alumni");
    expect(resolveGoogleSignupRole("b@gmail.com", { id: "S2", status: "Di Jepang" }, null).role).toBe("Alumni");
  });

  it("assigns Alumni when kategoriPendaftaran marks the student as Alumni regardless of status", () => {
    const result = resolveGoogleSignupRole(
      "c@gmail.com",
      { id: "S3", status: "Belajar", kategoriPendaftaran: "Alumni" },
      null,
    );
    expect(result.role).toBe("Alumni");
  });

  it("assigns Alumni when statusPendaftaran marks the student as Alumni regardless of status", () => {
    // Regression case: records created via RegistrationView only ever set
    // statusPendaftaran, never kategoriPendaftaran.
    const result = resolveGoogleSignupRole(
      "e@gmail.com",
      { id: "S4", status: "Belajar", statusPendaftaran: "Alumni" },
      null,
    );
    expect(result.role).toBe("Alumni");
  });

  it("assigns Siswa with the linked studentId for a registration-only match", () => {
    expect(resolveGoogleSignupRole("d@gmail.com", null, { id: "REG-1" })).toEqual({
      role: "Siswa",
      studentId: "REG-1",
    });
  });

  it("defaults to a bare Siswa role when nothing matches", () => {
    expect(resolveGoogleSignupRole("nobody@gmail.com", null, null)).toEqual({ role: "Siswa" });
  });

  it("checks privilege allow-lists before falling back to student matches", () => {
    // Even if a VVIP email happens to also match an active student record,
    // the privilege role wins - matches the original inline logic's order.
    const result = resolveGoogleSignupRole(
      "rlstudioindonesia@gmail.com",
      { id: "SIS-9", status: "Belajar" },
      null,
    );
    expect(result).toEqual({ role: "VVIP" });
  });
});
