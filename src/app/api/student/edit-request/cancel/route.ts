import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/student-auth";

export const runtime = "nodejs";

export async function POST() {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const editRequest = await prisma.applicationEditRequest.findFirst({
    where: {
      applicationId: session.applicationId,
      status: { in: ["NHAP", "CHO_DUYET"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!editRequest) {
    return NextResponse.json({ error: "Không tìm thấy yêu cầu chỉnh sửa có thể hủy." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.applicationEditRequest.update({
      where: { id: editRequest.id },
      data: { status: "DA_HUY" },
    }),
    prisma.applicationLog.create({
      data: {
        applicationId: session.applicationId,
        action: "EDIT_REQUEST_CANCELLED",
        note: `Hủy yêu cầu chỉnh sửa ${editRequest.requestCode}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
