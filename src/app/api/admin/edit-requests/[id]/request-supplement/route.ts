import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const schema = z.object({ officerNote: z.string().min(1).max(2000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Vui lòng nhập nội dung yêu cầu bổ sung." }, { status: 400 });

  const editRequest = await prisma.applicationEditRequest.findUnique({ where: { id } });
  if (!editRequest) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  if (editRequest.status !== "CHO_DUYET") {
    return NextResponse.json({ error: "Không thể yêu cầu bổ sung ở trạng thái này." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.applicationEditRequest.update({
      where: { id },
      data: {
        status: "CAN_BO_SUNG",
        officerNote: parsed.data.officerNote,
      },
    }),
    prisma.applicationLog.create({
      data: {
        applicationId: editRequest.applicationId,
        userId: user.id,
        action: "EDIT_REQUEST_SUPPLEMENT_REQUESTED",
        note: `Yêu cầu bổ sung cho ${editRequest.requestCode}: ${parsed.data.officerNote}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
