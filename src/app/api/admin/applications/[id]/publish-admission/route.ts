import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { calculateAdmissionScoreFromConfig } from "@/lib/admission-score";
import { requireAdmin } from "@/lib/auth";
import { canPublishAdmissionResult } from "@/lib/admission-result";
import { prisma } from "@/lib/prisma";
import { getActiveScoreFormula } from "@/lib/score-formula";
import { admissionPublicationSchema, zodFieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const parsed = admissionPublicationSchema.parse(await request.json().catch(() => ({})));
    const current = await prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: { academicRecords: true, priorities: true, awards: true },
    });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
    if (!canPublishAdmissionResult(current.admissionResult)) {
      return NextResponse.json(
        { error: "Không thể công bố hồ sơ này vì kết quả tuyển sinh chưa phải là Trúng tuyển." },
        { status: 400 }
      );
    }

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
        admissionPublished: true,
        admissionPublishedAt: new Date(),
        admissionPublishedById: user.id,
        admissionPublicNote: parsed.publicNote ?? current.admissionPublicNote,
        admissionScoreSnapshot:
          parsed.snapshotScore || current.admissionScoreSnapshot === null ? score.totalScore : current.admissionScoreSnapshot,
        scoreFormulaVersionId:
          parsed.snapshotScore || current.admissionScoreSnapshot === null ? activeFormula.id ?? current.scoreFormulaVersionId : current.scoreFormulaVersionId,
        scoreBreakdownJson:
          parsed.snapshotScore || current.admissionScoreSnapshot === null ? JSON.parse(JSON.stringify(score)) : current.scoreBreakdownJson,
        logs: {
          create: [
            {
              userId: user.id,
              action: "ADMISSION_PUBLISHED",
              oldValue: String(current.admissionPublished),
              newValue: "true",
              note: parsed.publicNote,
              metadata: { scoreFormulaVersionId: activeFormula.id, scoreSnapshot: score.totalScore },
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
      { error: error instanceof Error ? error.message : "Không thể công bố kết quả" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = admissionPublicationSchema.safeParse(await request.json().catch(() => ({})));
  const current = await prisma.application.findFirst({ where: { id, deletedAt: null } });
  if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  const updated = await prisma.application.update({
    where: { id },
    data: {
      admissionPublished: false,
      logs: {
        create: [
          {
            userId: user.id,
            action: "ADMISSION_UNPUBLISHED",
            oldValue: String(current.admissionPublished),
            newValue: "false",
            note: parsed.success ? parsed.data.reason || parsed.data.publicNote : undefined,
          },
        ],
      },
    },
  });

  return NextResponse.json({ application: updated });
}
