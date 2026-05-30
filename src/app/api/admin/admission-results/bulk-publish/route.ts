import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { calculateAdmissionScoreFromConfig } from "@/lib/admission-score";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveScoreFormula } from "@/lib/score-formula";
import { adminAdmissionPublishSchema, zodFieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = adminAdmissionPublishSchema.parse(await request.json());
    const applications = await prisma.application.findMany({
      where: { id: { in: parsed.applicationIds }, deletedAt: null },
      include: { academicRecords: true, priorities: true, awards: true },
    });

    let publishedCount = 0;
    let skippedNonAdmittedCount = 0;
    let skippedUnreviewedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const app of applications) {
        if (parsed.publish && app.admissionResult === "CHUA_XET") {
          skippedUnreviewedCount += 1;
          continue;
        }
        if (parsed.publish && app.admissionResult !== "TRUNG_TUYEN") {
          skippedNonAdmittedCount += 1;
          continue;
        }

        const activeFormula = await getActiveScoreFormula(app.admissionSeasonId);
        const score = calculateAdmissionScoreFromConfig(
          app.academicRecords,
          app.priorities.map((priority) => priority.type),
          app.awards.map((award) => ({ prize: award.prize })),
          activeFormula.config,
          activeFormula.id
        );
        await tx.application.update({
          where: { id: app.id },
          data: {
            admissionPublished: parsed.publish,
            admissionPublishedAt: parsed.publish ? new Date() : app.admissionPublishedAt,
            admissionPublishedById: parsed.publish ? user.id : app.admissionPublishedById,
            admissionPublicNote: parsed.publicNote ?? app.admissionPublicNote,
            admissionScoreSnapshot:
              parsed.publish && (parsed.snapshotScore || app.admissionScoreSnapshot === null)
                ? score.totalScore
                : app.admissionScoreSnapshot,
            scoreFormulaVersionId:
              parsed.publish && (parsed.snapshotScore || app.admissionScoreSnapshot === null)
                ? activeFormula.id ?? app.scoreFormulaVersionId
                : app.scoreFormulaVersionId,
            scoreBreakdownJson:
              parsed.publish && (parsed.snapshotScore || app.admissionScoreSnapshot === null)
                ? JSON.parse(JSON.stringify(score))
                : app.scoreBreakdownJson,
            logs: {
              create: [
                {
                  userId: user.id,
                  action: parsed.publish ? "ADMISSION_BULK_PUBLISHED" : "ADMISSION_UNPUBLISHED",
                  oldValue: String(app.admissionPublished),
                  newValue: String(parsed.publish),
                  note: parsed.publicNote,
                  metadata: { bulk: true, scoreFormulaVersionId: activeFormula.id, scoreSnapshot: score.totalScore },
                },
              ],
            },
          },
        });
        publishedCount += 1;
      }

      await tx.applicationLog.create({
        data: {
          userId: user.id,
          action: parsed.publish ? "ADMISSION_BULK_PUBLISHED" : "ADMISSION_UNPUBLISHED",
          note: parsed.publicNote,
          metadata: {
            applicationIds: parsed.applicationIds,
            publish: parsed.publish,
            publishedCount,
            skippedNonAdmittedCount,
            skippedUnreviewedCount,
          },
        },
      });
    });

    return NextResponse.json({
      ok: true,
      publishedCount,
      skippedNonAdmittedCount,
      skippedUnreviewedCount,
      errors: [],
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message, fieldErrors: zodFieldErrors(error) }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể công bố hàng loạt" },
      { status: 400 }
    );
  }
}
