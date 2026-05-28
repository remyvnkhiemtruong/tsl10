import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { physicalDossierUpdateSchema, zodFieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const parsed = physicalDossierUpdateSchema.parse(await request.json());
    const current = await prisma.application.findFirst({ where: { id, deletedAt: null } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const now = new Date();
    const receivedChanged = current.physicalDossierStatus !== parsed.physicalDossierStatus;
    const validityChanged = current.physicalDossierValidity !== parsed.physicalDossierValidity;

    const updated = await prisma.application.update({
      where: { id },
      data: {
        physicalDossierStatus: parsed.physicalDossierStatus,
        physicalDossierValidity: parsed.physicalDossierValidity,
        physicalDossierPublicNote: parsed.physicalDossierPublicNote ?? null,
        physicalDossierInternalNote: parsed.physicalDossierInternalNote ?? null,
        physicalDossierReceivedAt:
          parsed.physicalDossierStatus === "DA_NOP_TRUC_TIEP" && !current.physicalDossierReceivedAt
            ? now
            : current.physicalDossierReceivedAt,
        physicalDossierReceivedById:
          parsed.physicalDossierStatus === "DA_NOP_TRUC_TIEP" && !current.physicalDossierReceivedById
            ? user.id
            : current.physicalDossierReceivedById,
        physicalDossierCheckedAt: validityChanged ? now : current.physicalDossierCheckedAt,
        physicalDossierCheckedById: validityChanged ? user.id : current.physicalDossierCheckedById,
        logs: {
          create: [
            {
              userId: user.id,
              action: receivedChanged ? "PHYSICAL_DOSSIER_RECEIVED" : "PHYSICAL_DOSSIER_STATUS_UPDATED",
              oldValue: `${current.physicalDossierStatus}/${current.physicalDossierValidity}`,
              newValue: `${parsed.physicalDossierStatus}/${parsed.physicalDossierValidity}`,
              note: parsed.physicalDossierPublicNote || parsed.physicalDossierInternalNote,
              metadata: {
                physicalDossierStatus: parsed.physicalDossierStatus,
                physicalDossierValidity: parsed.physicalDossierValidity,
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
      { error: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ trực tiếp" },
      { status: 400 }
    );
  }
}
