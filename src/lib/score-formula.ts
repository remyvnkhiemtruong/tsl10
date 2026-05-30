import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  DEFAULT_SCORE_FORMULA_CONFIG,
  type ScoreFormulaConfig,
} from "@/lib/admission-score";
import { prisma } from "@/lib/prisma";
import { isPrismaTableMissingError } from "@/lib/school-settings";

const scoreNumber = z.number().finite().min(0).max(1000);

export const scoreFormulaConfigSchema = z.object({
  expressionLabel: z.string().min(1),
  subjects: z
    .array(
      z.object({
        code: z.enum([
          "literature",
          "math",
          "english",
          "naturalScience",
          "historyGeography",
          "civicEducation",
          "technology",
          "informatics",
        ]),
        label: z.string().min(1),
        enabled: z.boolean(),
        weight: z.number().finite().min(0).max(20).optional(),
      })
    )
    .min(1),
  grades: z
    .array(
      z.object({
        grade: z.number().int().min(1).max(12),
        label: z.string().min(1),
        enabled: z.boolean(),
        required: z.boolean().optional(),
      })
    )
    .min(1),
  conversionTable: z
    .array(
      z.object({
        academicLevel: z.enum(["TOT", "KHA", "DAT", "CHUA_DAT", "OTHER"]),
        conductLevel: z.enum(["TOT", "KHA", "DAT", "CHUA_DAT", "OTHER"]),
        score: scoreNumber,
        label: z.string().optional(),
      })
    )
    .min(1),
  priorityScores: z.record(z.string(), scoreNumber),
  awardScores: z.record(z.string(), scoreNumber),
  priorityMode: z.enum(["MAX_ONLY", "SUM"]),
  awardMode: z.enum(["MAX_ONE_AWARD_ONLY", "SUM"]),
  maxCountedAwards: z.number().int().min(1).max(10),
  rounding: z.object({
    finalScoreDecimals: z.number().int().min(0).max(4),
    componentDecimals: z.number().int().min(0).max(4),
    mode: z.enum(["HALF_UP", "FLOOR", "CEIL", "NONE"]),
  }),
  display: z
    .object({
      showScoreToStudent: z.boolean().optional(),
      showBreakdownToStudent: z.boolean().optional(),
    })
    .optional(),
});

export type ActiveScoreFormula = {
  id?: string;
  name: string;
  version: number;
  config: ScoreFormulaConfig;
  source: "db" | "fallback";
};

function parseFormulaConfig(value: Prisma.JsonValue): ScoreFormulaConfig {
  const parsed = scoreFormulaConfigSchema.safeParse(value);
  if (!parsed.success) return DEFAULT_SCORE_FORMULA_CONFIG;
  return parsed.data;
}

export async function getActiveScoreFormula(seasonId?: string | null): Promise<ActiveScoreFormula> {
  try {
    const formula = await prisma.scoreFormulaVersion.findFirst({
      where: {
        status: "ACTIVE",
        ...(seasonId ? { seasonId } : {}),
      },
      orderBy: [{ isDefault: "desc" }, { version: "desc" }, { createdAt: "desc" }],
    });

    if (!formula) {
      return {
        name: "Công thức mặc định",
        version: 1,
        config: DEFAULT_SCORE_FORMULA_CONFIG,
        source: "fallback",
      };
    }

    return {
      id: formula.id,
      name: formula.name,
      version: formula.version,
      config: parseFormulaConfig(formula.configJson),
      source: "db",
    };
  } catch (error) {
    if (isPrismaTableMissingError(error)) {
      return {
        name: "Công thức mặc định",
        version: 1,
        config: DEFAULT_SCORE_FORMULA_CONFIG,
        source: "fallback",
      };
    }
    throw error;
  }
}

export function scoreConfigJson(config: ScoreFormulaConfig = DEFAULT_SCORE_FORMULA_CONFIG) {
  return config as unknown as Prisma.InputJsonValue;
}
