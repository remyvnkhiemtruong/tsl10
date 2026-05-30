import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const rejectSchema = z.object({
  rejectionReason: z.string().min(1, "Vui lòng nhập lý do từ chối.").max(2000),
  officerNote: z.string().max(2000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = rejectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const editRequest = await prisma.applicationEditRequest.findUnique({ where: { id } });
  if (!editRequest) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  if (!["CHO_DUYET", "CAN_BO_SUNG"].includes(editRequest.status)) {
    return NextResponse.json({ error: "Không thể từ chối yêu cầu ở trạng thái này." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.applicationEditRequest.update({
      where: { id },
      data: {
        status: "TU_CHOI",
        reviewedAt: new Date(),
        reviewedById: user.id,
        rejectionReason: parsed.data.rejectionReason,
        officerNote: parsed.data.officerNote,
      },
    }),
    prisma.applicationLog.create({
      data: {
        applicationId: editRequest.applicationId,
        userId: user.id,
        action: "EDIT_REQUEST_REJECTED",
        note: `Từ chối yêu cầu chỉnh sửa ${editRequest.requestCode}: ${parsed.data.rejectionReason}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
