import { ActiveStudent, ChapterAssessment, JobOrder } from "../types";
import { calculateAge } from "./dateUtils";
import { resolveAttendanceScore } from "./attendanceMetrics";

export interface JobEligibilityResult {
  isEligible: boolean;
  autoRejectNote: string;
  mathScore: number;
  fiveSScore: number;
  ethicsScore: number;
  attendanceScore: number;
  reqMath: number;
  reqFiveS: number;
  reqEthics: number;
  reqAttendance: number;
  minTB: number;
  maxTB: number;
  myTB: number;
  minBB: number;
  maxBB: number;
  myBB: number;
  minAge: number;
  maxAge: number;
  myAge: number;
  minJpn: number;
  myJpn: number;
  reqGender: string;
  myGender: string;
}

function emptyResult(): JobEligibilityResult {
  return {
    isEligible: true,
    autoRejectNote: "",
    mathScore: 0,
    fiveSScore: 0,
    ethicsScore: 0,
    attendanceScore: 0,
    reqMath: 0,
    reqFiveS: 0,
    reqEthics: 0,
    reqAttendance: 0,
    minTB: 0,
    maxTB: 0,
    myTB: 0,
    minBB: 0,
    maxBB: 0,
    myBB: 0,
    minAge: 0,
    maxAge: 0,
    myAge: 0,
    minJpn: 0,
    myJpn: 0,
    reqGender: "",
    myGender: "",
  };
}

/**
 * Computes whether a student meets a Job Order's requirements (score, body
 * measurements, age, Japanese chapter level, gender), plus a human-readable
 * note listing every unmet requirement.
 *
 * Bahasa Jepang & Matematika scores are recomputed here from real chapter
 * assessments (rather than read from student.mathScore/japaneseScore) since
 * those stored fields are display-only and never get written back once
 * assessments exist - reading them directly would show a stale/zero score.
 * Attendance score is likewise recomputed live from attendance records
 * whenever any exist, only falling back to student.attendanceScore when
 * there are none to compute from - see resolveAttendanceScore.
 */
export function computeJobEligibility(
  student: ActiveStudent | null | undefined,
  job: JobOrder | null | undefined,
  attendanceRecords: { studentName?: string; studentId?: string; status?: string }[],
  chapterAssessments: ChapterAssessment[],
): JobEligibilityResult {
  const result = emptyResult();
  if (!student || !job) return result;

  const myAssessments = (chapterAssessments || []).filter(
    (a) => a.studentId === student.id || (a.studentName && a.studentName === student.name),
  );
  const jpnAssessments = myAssessments.filter(
    (a) =>
      (a.subject || "Bahasa Jepang") === "Bahasa Jepang" &&
      (a.status === "Telah Dinilai" || a.status === "Sudah Dinilai") &&
      typeof a.score === "number" &&
      !isNaN(a.score),
  );
  const mathAssessments = myAssessments.filter(
    (a: any) =>
      (a.subject === "SSW" || a.subject === "Matematika" || a.subject === "SSW Matematika") &&
      (a.status === "Telah Dinilai" || a.status === "Sudah Dinilai") &&
      typeof a.score === "number" &&
      !isNaN(a.score),
  );

  result.mathScore =
    mathAssessments.length > 0
      ? Math.round(mathAssessments.reduce((acc, curr) => acc + (curr.score || 0), 0) / mathAssessments.length)
      : (student.mathScore ?? 0);
  result.fiveSScore = student.fiveSScore ?? 0;
  result.ethicsScore = student.ethicsScore ?? 0;

  result.attendanceScore = resolveAttendanceScore(student, attendanceRecords);

  result.reqMath = parseInt((job.minMathScore || "90").toString().replace(/\D/g, ""));
  result.reqFiveS = parseInt((job.minFiveSScore || "80").toString().replace(/\D/g, ""));
  result.reqEthics = parseInt((job.minEthicsScore || "80").toString().replace(/\D/g, ""));
  result.reqAttendance = parseInt((job.minAttendanceScore || "80").toString().replace(/\D/g, ""));

  const tbMatches = job.tbRequirement?.match(/(\d+)/g);
  if (tbMatches && tbMatches.length >= 1) {
    result.minTB = parseInt(tbMatches[0]);
    if (tbMatches.length >= 2) result.maxTB = parseInt(tbMatches[1]);
  }
  result.myTB = student.tb || 0;

  const bbMatches = job.bbRequirement?.match(/(\d+)/g);
  if (bbMatches && bbMatches.length >= 1) {
    result.minBB = parseInt(bbMatches[0]);
    if (bbMatches.length >= 2) result.maxBB = parseInt(bbMatches[1]);
  }
  result.myBB = student.bb || 0;

  const ageMatches = job.ageRequirement?.match(/(\d+)/g);
  if (ageMatches && ageMatches.length >= 1) {
    result.minAge = parseInt(ageMatches[0]);
    if (ageMatches.length >= 2) result.maxAge = parseInt(ageMatches[1]);
  }
  result.myAge = calculateAge(student.birthDate) ?? student.age ?? 0;

  const jpnMatches = (job.minJapaneseScore || "BAB 15").toString().match(/(\d+)/);
  if (jpnMatches && jpnMatches[1]) result.minJpn = parseInt(jpnMatches[1]);
  result.myJpn =
    jpnAssessments.length > 0
      ? Math.round(jpnAssessments.reduce((acc, curr) => acc + (curr.score || 0), 0) / jpnAssessments.length)
      : (student.japaneseScore || 0);

  result.reqGender = job.gender?.toUpperCase() || "";
  result.myGender = student.gender?.toUpperCase() || "";

  if (result.reqMath > 0 && result.mathScore < result.reqMath) {
    result.isEligible = false;
    result.autoRejectNote += `MTK (${result.mathScore} < ${result.reqMath}). `;
  }
  if (result.reqFiveS > 0 && result.fiveSScore < result.reqFiveS) {
    result.isEligible = false;
    result.autoRejectNote += `5S (${result.fiveSScore} < ${result.reqFiveS}). `;
  }
  if (result.reqEthics > 0 && result.ethicsScore < result.reqEthics) {
    result.isEligible = false;
    result.autoRejectNote += `Etika (${result.ethicsScore} < ${result.reqEthics}). `;
  }
  if (result.reqAttendance > 0 && result.attendanceScore < result.reqAttendance) {
    result.isEligible = false;
    result.autoRejectNote += `Absensi (${result.attendanceScore}% < ${result.reqAttendance}%). `;
  }
  if (result.minTB > 0 && result.myTB > 0 && result.myTB < result.minTB) {
    result.isEligible = false;
    result.autoRejectNote += `TB (${result.myTB}cm < ${result.minTB}cm). `;
  }
  if (result.maxTB > 0 && result.myTB > 0 && result.myTB > result.maxTB) {
    result.isEligible = false;
    result.autoRejectNote += `TB (${result.myTB}cm > ${result.maxTB}cm). `;
  }
  if (result.minBB > 0 && result.myBB > 0 && result.myBB < result.minBB) {
    result.isEligible = false;
    result.autoRejectNote += `BB (${result.myBB}kg < ${result.minBB}kg). `;
  }
  if (result.maxBB > 0 && result.myBB > 0 && result.myBB > result.maxBB) {
    result.isEligible = false;
    result.autoRejectNote += `BB (${result.myBB}kg > ${result.maxBB}kg). `;
  }
  if (result.minAge > 0 && result.myAge > 0 && result.myAge < result.minAge) {
    result.isEligible = false;
    result.autoRejectNote += `Usia (${result.myAge}th < ${result.minAge}th). `;
  }
  if (result.maxAge > 0 && result.myAge > 0 && result.myAge > result.maxAge) {
    result.isEligible = false;
    result.autoRejectNote += `Usia (${result.myAge}th > ${result.maxAge}th). `;
  }
  if (result.minJpn > 0 && result.myJpn > 0 && result.myJpn < result.minJpn) {
    result.isEligible = false;
    result.autoRejectNote += `B.Jepang (Bab ${result.myJpn} < Bab ${result.minJpn}). `;
  }
  if (
    result.reqGender &&
    result.reqGender !== "LAKI/PEREMPUAN" &&
    result.reqGender !== "LAKI-LAKI/PEREMPUAN" &&
    result.myGender
  ) {
    if (!result.reqGender.includes(result.myGender)) {
      result.isEligible = false;
      result.autoRejectNote += `Gender (${student.gender} tdk sesuai). `;
    }
  }

  return result;
}
