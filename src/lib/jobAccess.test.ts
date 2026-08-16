import { describe, it, expect } from "vitest";
import { computeJobAccess, canStudentViewJob } from "./jobAccess";
import { ActiveStudent, JobOrder } from "../types";

function makeStudent(overrides: Partial<ActiveStudent> = {}): ActiveStudent {
  return {
    id: "SIS-1",
    name: "Budi Santoso",
    batch: "2026",
    class: "Kelas A",
    status: "Lulus",
    ...overrides,
  } as ActiveStudent;
}

function makeJob(overrides: Partial<JobOrder> = {}): JobOrder {
  return {
    id: "JOB-1",
    noReg: "001",
    partnerName: "PT Mitra",
    occupation: "Kaigo",
    location: "Tokyo",
    salary: "200000 JPY",
    overtime: "ADA",
    allowance: "-",
    contractDuration: "3 tahun",
    status: "Aktif",
    ...overrides,
  } as JobOrder;
}

describe("computeJobAccess", () => {
  it("grants access to a non-alumni student who is Lulus, regardless of job type", () => {
    const result = computeJobAccess(makeStudent({ status: "Lulus" }), makeJob({ jobType: "Caregiver" }));
    expect(result.isLulus).toBe(true);
    expect(result.allowByJobType).toBe(true);
    expect(result.meetsAccessRequirement).toBe(true);
  });

  it("denies a student whose status isn't in the Lulus-equivalent set and isn't recommended", () => {
    const result = computeJobAccess(makeStudent({ status: "Belajar" }), makeJob());
    expect(result.isLulus).toBe(false);
    expect(result.meetsAccessRequirement).toBe(false);
  });

  it("grants access via recommendation even when status isn't Lulus-equivalent", () => {
    const student = makeStudent({ id: "SIS-9", status: "Belajar" });
    const job = makeJob({ recommendations: ["SIS-9"] });
    const result = computeJobAccess(student, job);
    expect(result.isRecommendedInThisJob).toBe(true);
    expect(result.meetsAccessRequirement).toBe(true);
  });

  it("treats each of the Lulus-equivalent statuses as eligible", () => {
    for (const status of ["Lulus", "On Proges Job", "On Progres JFT/JLPT/SSW", "Diklat SO"] as const) {
      const result = computeJobAccess(makeStudent({ status }), makeJob());
      expect(result.isLulus).toBe(true);
    }
  });

  it("restricts alumni to Tokutei ginou / Gijin kouku job types", () => {
    const alumnus = makeStudent({ kategoriPendaftaran: "Alumni", status: "Lulus" });

    const wrongType = computeJobAccess(alumnus, makeJob({ jobType: "Caregiver" }));
    expect(wrongType.isAlumni).toBe(true);
    expect(wrongType.allowByJobType).toBe(false);
    expect(wrongType.meetsAccessRequirement).toBe(false);

    const rightType = computeJobAccess(alumnus, makeJob({ jobType: "Tokutei ginou" }));
    expect(rightType.allowByJobType).toBe(true);
    expect(rightType.meetsAccessRequirement).toBe(true);

    const otherRightType = computeJobAccess(alumnus, makeJob({ jobType: "Gijin kouku" }));
    expect(otherRightType.allowByJobType).toBe(true);
  });

  it("also recognizes statusPendaftaran as an alumni marker (not just kategoriPendaftaran)", () => {
    const alumnus = computeJobAccess(
      makeStudent({ statusPendaftaran: "Alumni", status: "Lulus" }),
      makeJob({ jobType: "Caregiver" }),
    );
    expect(alumnus.isAlumni).toBe(true);
    expect(alumnus.allowByJobType).toBe(false);
  });

  it("returns a safe non-eligible result for a missing student", () => {
    const result = computeJobAccess(null, makeJob());
    expect(result.isLulus).toBe(false);
    expect(result.isRecommendedInThisJob).toBe(false);
    expect(result.meetsAccessRequirement).toBe(false);
  });
});

describe("canStudentViewJob", () => {
  it("shows an active job to an eligible student who hasn't applied yet", () => {
    expect(canStudentViewJob(makeStudent({ status: "Lulus" }), makeJob({ status: "Aktif" }), false)).toBe(true);
  });

  it("hides a closed job unless the student was specifically recommended into it", () => {
    const student = makeStudent({ id: "SIS-2", status: "Lulus" });
    expect(canStudentViewJob(student, makeJob({ status: "Tutup" }), false)).toBe(false);

    const recommended = makeJob({ status: "Tutup", recommendations: ["SIS-2"] });
    expect(canStudentViewJob(student, recommended, false)).toBe(true);
  });

  it("hides a job the student already applied to/was approved for", () => {
    expect(canStudentViewJob(makeStudent({ status: "Lulus" }), makeJob({ status: "Aktif" }), true)).toBe(false);
  });

  it("hides a job from an alumnus when the job type doesn't match, even if the job is active and unapplied", () => {
    const alumnus = makeStudent({ kategoriPendaftaran: "Alumni", status: "Lulus" });
    expect(canStudentViewJob(alumnus, makeJob({ status: "Aktif", jobType: "Caregiver" }), false)).toBe(false);
    expect(canStudentViewJob(alumnus, makeJob({ status: "Aktif", jobType: "Tokutei ginou" }), false)).toBe(true);
  });
});
