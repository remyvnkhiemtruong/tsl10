export type AcademicConductLevel = "TOT" | "KHA" | "DAT" | "CHUA_DAT" | "Tốt" | "Khá" | "Đạt" | "Chưa đạt";

export type AdmissionScoreRecord = {
  literature?: number | null;
  math?: number | null;
  english?: number | null;
  naturalScience?: number | null;
  historyGeography?: number | null;
  civicEducation?: number | null;
  technology?: number | null;
  informatics?: number | null;
  academicLevel?: AcademicConductLevel | null;
  conductLevel?: AcademicConductLevel | null;
};

export type AdmissionScoreDetails = {
  academicAverageSum: number;
  convertedScoreSum: number;
  priorityScore: number;
  awardBonusScore: number;
  bonusScore: number;
  totalScore: number;
};

const scoreKeys = [
  "literature",
  "math",
  "english",
  "naturalScience",
  "historyGeography",
  "civicEducation",
  "technology",
  "informatics",
] as const satisfies ReadonlyArray<keyof AdmissionScoreRecord>;

function roundScore(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeLevel(level: AcademicConductLevel | null | undefined) {
  if (level === "TOT" || level === "Tốt") return "TOT";
  if (level === "KHA" || level === "Khá") return "KHA";
  if (level === "DAT" || level === "Đạt") return "DAT";
  return "CHUA_DAT";
}

export function calculateAcademicAverageSum(records: AdmissionScoreRecord[]) {
  return roundScore(
    records.reduce(
      (recordSum, record) =>
        recordSum +
        scoreKeys.reduce((subjectSum, key) => {
          const value = record[key];
          return subjectSum + (typeof value === "number" && Number.isFinite(value) ? value : 0);
        }, 0),
      0
    )
  );
}

export function convertAcademicConductScore(
  academicLevel: AcademicConductLevel | null | undefined,
  conductLevel: AcademicConductLevel | null | undefined
) {
  const academic = normalizeLevel(academicLevel);
  const conduct = normalizeLevel(conductLevel);

  if (academic === "TOT" && conduct === "TOT") return 10;
  if ((academic === "TOT" && conduct === "KHA") || (academic === "KHA" && conduct === "TOT")) return 9;
  if (academic === "TOT" && conduct === "DAT") return 7;
  if (academic === "KHA" && conduct === "KHA") return 8;
  if (academic === "KHA" && conduct === "DAT") return 6;
  if (academic === "DAT" && conduct === "TOT") return 7;
  if (academic === "DAT" && conduct === "KHA") return 6;
  return 5;
}

export function calculateConvertedScoreSum(records: AdmissionScoreRecord[]) {
  return roundScore(
    records.reduce(
      (sum, record) => sum + convertAcademicConductScore(record.academicLevel, record.conductLevel),
      0
    )
  );
}

export function calculateAdmissionScore(records: AdmissionScoreRecord[], bonusScore = 0) {
  return calculateAdmissionScoreDetails(records, bonusScore).totalScore;
}

export function calculateAdmissionScoreDetails(records: AdmissionScoreRecord[], bonusScore = 0): AdmissionScoreDetails {
  const academicAverageSum = calculateAcademicAverageSum(records);
  const convertedScoreSum = calculateConvertedScoreSum(records);
  const normalizedBonusScore = roundScore(Number.isFinite(bonusScore) ? bonusScore : 0);
  return {
    academicAverageSum,
    convertedScoreSum,
    priorityScore: 0,
    awardBonusScore: normalizedBonusScore,
    bonusScore: normalizedBonusScore,
    totalScore: roundScore(academicAverageSum + convertedScoreSum + normalizedBonusScore),
  };
}

export function calculatePriorityScore(priorityTypes: string[]) {
  return roundScore(priorityTypes.reduce((max, type) => Math.max(max, PRIORITY_SCORES[type] ?? 0), 0));
}

export function calculateAwardBonusScore(awards: Array<{ prize: string }>) {
  const countedAward = [...awards].sort((a, b) => (PRIZE_SCORES[b.prize] ?? 0) - (PRIZE_SCORES[a.prize] ?? 0))[0];
  return roundScore(countedAward ? PRIZE_SCORES[countedAward.prize] ?? 0 : 0);
}

export function calculateCombinedBonusScore(priorityTypes: string[], awards: Array<{ prize: string }>) {
  return roundScore(calculatePriorityScore(priorityTypes) + calculateAwardBonusScore(awards));
}

export function calculateAdmissionScoreWithBonuses(
  records: AdmissionScoreRecord[],
  priorityTypes: string[],
  awards: Array<{ prize: string }>
) {
  const priorityScore = calculatePriorityScore(priorityTypes);
  const awardBonusScore = calculateAwardBonusScore(awards);
  const bonusScore = roundScore(priorityScore + awardBonusScore);
  const details = calculateAdmissionScoreDetails(records, bonusScore);
  return { ...details, priorityScore, awardBonusScore, bonusScore, totalScore: details.totalScore };
}
import { PRIORITY_SCORES, PRIZE_SCORES } from "@/lib/constants";
