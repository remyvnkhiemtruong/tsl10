import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { calculateAdmissionScoreFromConfig } from "@/lib/admission-score";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveScoreFormula } from "@/lib/score-formula";
import { admissionResultSchema, zodFieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const parsed = admissionResultSchema.parse(await request.json());
    const current = await prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: { academicRecords: true, priorities: true, awards: true },
    });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const activeFormula = await getActiveScoreFormula(current.admissionSeasonId);
    const score = calculateAdmissionScoreFromConfig(
      current.academicRecords,
      current.priorities.map((priority) => priority.type),
      current.awards.map((award) => ({ prize: award.prize })),
      activeFormula.config,
      activeFormula.id
    );
    const updated = await prisma.application.update({
      where: { id },
      data: {
        admissionResult: parsed.admissionResult,
        admissionRank: parsed.admissionRank ?? null,
        admissionBatch: parsed.admissionBatch || null,
        admissionPublicNote: parsed.admissionPublicNote ?? null,
        admissionNote: parsed.admissionNote ?? null,
        admissionDecisionAt: new Date(),
        admissionDecisionById: user.id,
        admissionScoreSnapshot: parsed.snapshotScore ? score.totalScore : current.admissionScoreSnapshot,
        scoreFormulaVersionId: parsed.snapshotScore ? activeFormula.id ?? current.scoreFormulaVersionId : current.scoreFormulaVersionId,
        scoreBreakdownJson: parsed.snapshotScore ? JSON.parse(JSON.stringify(score)) : current.scoreBreakdownJson,
        status: parsed.admissionResult === "TRUNG_TUYEN" ? "DA_DUYET_XET_TUYEN" : current.status,
        logs: {
          create: [
            {
              userId: user.id,
              action: "ADMISSION_RESULT_UPDATED",
              oldValue: current.admissionResult,
              newValue: parsed.admissionResult,
              note: parsed.admissionNote || parsed.admissionPublicNote,
              metadata: {
                admissionRank: parsed.admissionRank,
                admissionBatch: parsed.admissionBatch,
                scoreFormulaVersionId: activeFormula.id,
                scoreSnapshot: parsed.snapshotScore ? score.totalScore : current.admissionScoreSnapshot,
              },
            },
          ],
        },
      },
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message, fieldErrors: zodFieldErrors(error) }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật kết quả tuyển sinh" },
      { status: 400 }
    );
  }
}
