import { PRIORITY_SCORES, PRIZE_SCORES } from "@/lib/constants";

export type AcademicConductLevel = "TOT" | "KHA" | "DAT" | "CHUA_DAT" | "Tốt" | "Khá" | "Đạt" | "Chưa đạt";

export type AdmissionScoreRecord = {
  grade?: number | null;
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

export type ScoreSubjectConfig = {
  code: keyof Pick<
    AdmissionScoreRecord,
    | "literature"
    | "math"
    | "english"
    | "naturalScience"
    | "historyGeography"
    | "civicEducation"
    | "technology"
    | "informatics"
  >;
  label: string;
  enabled: boolean;
  weight?: number;
};

export type ScoreGradeConfig = {
  grade: number;
  label: string;
  enabled: boolean;
  required?: boolean;
};

export type ConversionRuleConfig = {
  academicLevel: "TOT" | "KHA" | "DAT" | "CHUA_DAT" | "OTHER";
  conductLevel: "TOT" | "KHA" | "DAT" | "CHUA_DAT" | "OTHER";
  score: number;
  label?: string;
};

export type ScoreFormulaConfig = {
  expressionLabel: string;
  subjects: ScoreSubjectConfig[];
  grades: ScoreGradeConfig[];
  conversionTable: ConversionRuleConfig[];
  priorityScores: Record<string, number>;
  awardScores: Record<string, number>;
  priorityMode: "MAX_ONLY" | "SUM";
  awardMode: "MAX_ONE_AWARD_ONLY" | "SUM";
  maxCountedAwards: number;
  rounding: {
    finalScoreDecimals: number;
    componentDecimals: number;
    mode: "HALF_UP" | "FLOOR" | "CEIL" | "NONE";
  };
  display?: {
    showScoreToStudent?: boolean;
    showBreakdownToStudent?: boolean;
  };
};

export type ScoreBreakdown = {
  formulaVersionId?: string;
  subjectScoreSum: number;
  convertedScoreSum: number;
  priorityScore: number;
  awardBonusScore: number;
  manualAdjustmentScore: number;
  totalBeforeRounding: number;
  totalScore: number;
  appliedPriority?: { type: string; score: number };
  appliedAward?: { prize: string; score: number };
  warnings: string[];
};

export type AdmissionScoreDetails = {
  academicAverageSum: number;
  convertedScoreSum: number;
  priorityScore: number;
  awardBonusScore: number;
  bonusScore: number;
  totalScore: number;
};

export const DEFAULT_SCORE_FORMULA_CONFIG: ScoreFormulaConfig = {
  expressionLabel: "Điểm xét tuyển = A + B + C",
  subjects: [
    { code: "literature", label: "Ngữ văn", enabled: true, weight: 1 },
    { code: "math", label: "Toán", enabled: true, weight: 1 },
    { code: "english", label: "Tiếng Anh", enabled: true, weight: 1 },
    { code: "naturalScience", label: "Khoa học tự nhiên", enabled: true, weight: 1 },
    { code: "historyGeography", label: "Lịch sử và Địa lí", enabled: true, weight: 1 },
    { code: "civicEducation", label: "GDCD", enabled: true, weight: 1 },
    { code: "technology", label: "Công nghệ", enabled: true, weight: 1 },
    { code: "informatics", label: "Tin học", enabled: true, weight: 1 },
  ],
  grades: [6, 7, 8, 9].map((grade) => ({ grade, label: `Lớp ${grade}`, enabled: true, required: true })),
  conversionTable: [
    { academicLevel: "TOT", conductLevel: "TOT", score: 10 },
    { academicLevel: "TOT", conductLevel: "KHA", score: 9 },
    { academicLevel: "TOT", conductLevel: "DAT", score: 7 },
    { academicLevel: "KHA", conductLevel: "TOT", score: 9 },
    { academicLevel: "KHA", conductLevel: "KHA", score: 8 },
    { academicLevel: "KHA", conductLevel: "DAT", score: 6 },
    { academicLevel: "DAT", conductLevel: "TOT", score: 7 },
    { academicLevel: "DAT", conductLevel: "KHA", score: 6 },
    { academicLevel: "OTHER", conductLevel: "OTHER", score: 5 },
  ],
  priorityScores: PRIORITY_SCORES,
  awardScores: PRIZE_SCORES,
  priorityMode: "MAX_ONLY",
  awardMode: "MAX_ONE_AWARD_ONLY",
  maxCountedAwards: 1,
  rounding: { finalScoreDecimals: 2, componentDecimals: 2, mode: "HALF_UP" },
  display: { showScoreToStudent: true, showBreakdownToStudent: false },
};

function roundByConfig(value: number, decimals = 2, mode: ScoreFormulaConfig["rounding"]["mode"] = "HALF_UP") {
  if (!Number.isFinite(value)) return 0;
  if (mode === "NONE") return value;
  const factor = 10 ** decimals;
  if (mode === "FLOOR") return Math.floor(value * factor) / factor;
  if (mode === "CEIL") return Math.ceil(value * factor) / factor;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function normalizeLevel(level: AcademicConductLevel | null | undefined) {
  if (level === "TOT" || level === "Tốt") return "TOT";
  if (level === "KHA" || level === "Khá") return "KHA";
  if (level === "DAT" || level === "Đạt") return "DAT";
  return "CHUA_DAT";
}

function enabledGrades(config: ScoreFormulaConfig) {
  return config.grades.filter((grade) => grade.enabled).map((grade) => grade.grade);
}

function recordByGrade(records: AdmissionScoreRecord[], grade: number) {
  return records.find((record) => record.grade === grade);
}

export function calculateAdmissionScoreFromConfig(
  records: AdmissionScoreRecord[],
  priorityTypes: string[],
  awards: Array<{ prize: string }>,
  scoreConfig: ScoreFormulaConfig = DEFAULT_SCORE_FORMULA_CONFIG,
  formulaVersionId?: string
): ScoreBreakdown {
  const warnings: string[] = [];
  const grades = enabledGrades(scoreConfig);
  const subjects = scoreConfig.subjects.filter((subject) => subject.enabled);
  let subjectScoreSum = 0;
  let convertedScoreSum = 0;

  for (const grade of grades) {
    const record = recordByGrade(records, grade);
    if (!record) {
      warnings.push(`Thiếu kết quả học tập lớp ${grade}.`);
      continue;
    }

    for (const subject of subjects) {
      const raw = record[subject.code];
      if (typeof raw !== "number" || !Number.isFinite(raw)) {
        warnings.push(`Thiếu điểm ${subject.label} lớp ${grade}.`);
        continue;
      }
      subjectScoreSum += raw * (subject.weight ?? 1);
    }

    convertedScoreSum += convertAcademicConductScoreFromConfig(record.academicLevel, record.conductLevel, scoreConfig);
  }

  const appliedPriorities = priorityTypes
    .map((type) => ({ type, score: scoreConfig.priorityScores[type] ?? 0 }))
    .filter((item) => Number.isFinite(item.score));
  const appliedPriority =
    scoreConfig.priorityMode === "SUM"
      ? undefined
      : [...appliedPriorities].sort((a, b) => b.score - a.score)[0];
  const priorityScore =
    scoreConfig.priorityMode === "SUM"
      ? appliedPriorities.reduce((sum, item) => sum + item.score, 0)
      : appliedPriority?.score ?? 0;

  const scoredAwards = awards
    .map((award) => ({ prize: award.prize, score: scoreConfig.awardScores[award.prize] ?? 0 }))
    .filter((item) => Number.isFinite(item.score));
  const appliedAward =
    scoreConfig.awardMode === "SUM"
      ? undefined
      : [...scoredAwards].sort((a, b) => b.score - a.score)[0];
  const awardBonusScore =
    scoreConfig.awardMode === "SUM"
      ? scoredAwards
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.max(1, scoreConfig.maxCountedAwards))
          .reduce((sum, item) => sum + item.score, 0)
      : appliedAward?.score ?? 0;

  const componentDecimals = scoreConfig.rounding.componentDecimals;
  const mode = scoreConfig.rounding.mode;
  const roundedSubjectScoreSum = roundByConfig(subjectScoreSum, componentDecimals, mode);
  const roundedConvertedScoreSum = roundByConfig(convertedScoreSum, componentDecimals, mode);
  const roundedPriorityScore = roundByConfig(priorityScore, componentDecimals, mode);
  const roundedAwardScore = roundByConfig(awardBonusScore, componentDecimals, mode);
  const manualAdjustmentScore = 0;
  const totalBeforeRounding =
    roundedSubjectScoreSum + roundedConvertedScoreSum + roundedPriorityScore + roundedAwardScore + manualAdjustmentScore;

  return {
    formulaVersionId,
    subjectScoreSum: roundedSubjectScoreSum,
    convertedScoreSum: roundedConvertedScoreSum,
    priorityScore: roundedPriorityScore,
    awardBonusScore: roundedAwardScore,
    manualAdjustmentScore,
    totalBeforeRounding: roundByConfig(totalBeforeRounding, componentDecimals, mode),
    totalScore: roundByConfig(totalBeforeRounding, scoreConfig.rounding.finalScoreDecimals, mode),
    appliedPriority,
    appliedAward,
    warnings,
  };
}

export function convertAcademicConductScoreFromConfig(
  academicLevel: AcademicConductLevel | null | undefined,
  conductLevel: AcademicConductLevel | null | undefined,
  scoreConfig: ScoreFormulaConfig = DEFAULT_SCORE_FORMULA_CONFIG
) {
  const academic = normalizeLevel(academicLevel);
  const conduct = normalizeLevel(conductLevel);
  const exact = scoreConfig.conversionTable.find(
    (rule) => rule.academicLevel === academic && rule.conductLevel === conduct
  );
  if (exact) return exact.score;
  const fallback = scoreConfig.conversionTable.find(
    (rule) => rule.academicLevel === "OTHER" && rule.conductLevel === "OTHER"
  );
  return fallback?.score ?? 0;
}

export function calculateAcademicAverageSum(records: AdmissionScoreRecord[]) {
  return calculateAdmissionScoreFromConfig(records, [], [], DEFAULT_SCORE_FORMULA_CONFIG).subjectScoreSum;
}

export function convertAcademicConductScore(
  academicLevel: AcademicConductLevel | null | undefined,
  conductLevel: AcademicConductLevel | null | undefined
) {
  return convertAcademicConductScoreFromConfig(academicLevel, conductLevel, DEFAULT_SCORE_FORMULA_CONFIG);
}

export function calculateConvertedScoreSum(records: AdmissionScoreRecord[]) {
  return calculateAdmissionScoreFromConfig(records, [], [], DEFAULT_SCORE_FORMULA_CONFIG).convertedScoreSum;
}

export function calculateAdmissionScore(records: AdmissionScoreRecord[], bonusScore = 0) {
  return calculateAdmissionScoreDetails(records, bonusScore).totalScore;
}

export function calculateAdmissionScoreDetails(records: AdmissionScoreRecord[], bonusScore = 0): AdmissionScoreDetails {
  const base = calculateAdmissionScoreFromConfig(records, [], [], DEFAULT_SCORE_FORMULA_CONFIG);
  const normalizedBonusScore = roundByConfig(Number.isFinite(bonusScore) ? bonusScore : 0);
  return {
    academicAverageSum: base.subjectScoreSum,
    convertedScoreSum: base.convertedScoreSum,
    priorityScore: 0,
    awardBonusScore: normalizedBonusScore,
    bonusScore: normalizedBonusScore,
    totalScore: roundByConfig(base.subjectScoreSum + base.convertedScoreSum + normalizedBonusScore),
  };
}

export function calculatePriorityScore(priorityTypes: string[]) {
  return calculateAdmissionScoreFromConfig([], priorityTypes, [], DEFAULT_SCORE_FORMULA_CONFIG).priorityScore;
}

export function calculateAwardBonusScore(awards: Array<{ prize: string }>) {
  return calculateAdmissionScoreFromConfig([], [], awards, DEFAULT_SCORE_FORMULA_CONFIG).awardBonusScore;
}

export function calculateCombinedBonusScore(priorityTypes: string[], awards: Array<{ prize: string }>) {
  const score = calculateAdmissionScoreFromConfig([], priorityTypes, awards, DEFAULT_SCORE_FORMULA_CONFIG);
  return roundByConfig(score.priorityScore + score.awardBonusScore);
}

export function calculateAdmissionScoreWithBonuses(
  records: AdmissionScoreRecord[],
  priorityTypes: string[],
  awards: Array<{ prize: string }>
) {
  const score = calculateAdmissionScoreFromConfig(records, priorityTypes, awards, DEFAULT_SCORE_FORMULA_CONFIG);
  const bonusScore = roundByConfig(score.priorityScore + score.awardBonusScore);
  return {
    academicAverageSum: score.subjectScoreSum,
    convertedScoreSum: score.convertedScoreSum,
    priorityScore: score.priorityScore,
    awardBonusScore: score.awardBonusScore,
    bonusScore,
    totalScore: score.totalScore,
  };
}
