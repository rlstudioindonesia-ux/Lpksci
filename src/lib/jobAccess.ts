import { ActiveStudent, JobOrder } from "../types";

const LULUS_STATUSES: ActiveStudent["status"][] = [
  "Lulus",
  "On Proges Job",
  "On Progres JFT/JLPT/SSW",
  "Diklat SO",
];

const ALUMNI_ONLY_JOB_TYPES = ["Tokutei ginou", "Gijin kouku"];

export interface JobAccessResult {
  isLulus: boolean;
  isRecommendedInThisJob: boolean;
  isAlumni: boolean;
  allowByJobType: boolean;
  /** Status/recommendation + job-type gate a student must pass to apply. */
  meetsAccessRequirement: boolean;
}

/**
 * Status-based access gate for Job Orders: separate from
 * `computeJobEligibility` (which checks scores/measurements), this decides
 * whether a student is even allowed to see/apply to a job based on their
 * program status and, for alumni, the job's type - alumni may only apply to
 * "Tokutei ginou" / "Gijin kouku" job types.
 */
export function computeJobAccess(student: ActiveStudent | null | undefined, job: JobOrder): JobAccessResult {
  const isLulus = !!student && LULUS_STATUSES.includes(student.status);
  const isRecommendedInThisJob = !!student && !!job.recommendations?.includes(student.id);
  const isAlumni = !!student && (student.kategoriPendaftaran === "Alumni" || student.statusPendaftaran === "Alumni");
  const allowByJobType = !isAlumni || ALUMNI_ONLY_JOB_TYPES.includes(job.jobType || "");
  const meetsAccessRequirement = (isLulus || isRecommendedInThisJob) && allowByJobType;

  return { isLulus, isRecommendedInThisJob, isAlumni, allowByJobType, meetsAccessRequirement };
}

/**
 * Whether a job should appear in a student's "Aktif" job list: the job is
 * open (or the student was specifically recommended into it even if
 * closed), they haven't already applied/been approved, and they meet the
 * status/job-type access gate.
 */
export function canStudentViewJob(
  student: ActiveStudent | null | undefined,
  job: JobOrder,
  isAlreadyInMyJobs: boolean,
): boolean {
  const { isRecommendedInThisJob, meetsAccessRequirement } = computeJobAccess(student, job);
  return (job.status === "Aktif" || isRecommendedInThisJob) && !isAlreadyInMyJobs && meetsAccessRequirement;
}
