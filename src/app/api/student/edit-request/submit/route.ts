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
      status: { in: ["NHAP", "CAN_BO_SUNG"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!editRequest) {
    return NextResponse.json({ error: "Không tìm thấy yêu cầu chỉnh sửa có thể nộp." }, { status: 404 });
  }

  if (!editRequest.proposedDataJson) {
    return NextResponse.json({ error: "Yêu cầu chỉnh sửa chưa có dữ liệu. Vui lòng điền thông tin trước khi nộp." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.applicationEditRequest.update({
      where: { id: editRequest.id },
      data: {
        status: "CHO_DUYET",
        submittedAt: new Date(),
      },
    }),
    prisma.application.update({
      where: { id: session.applicationId },
      data: { lastEditRequestAt: new Date() },
    }),
    prisma.applicationLog.create({
      data: {
        applicationId: session.applicationId,
        action: "EDIT_REQUEST_SUBMITTED",
        note: `Nộp yêu cầu chỉnh sửa ${editRequest.requestCode}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, message: "Yêu cầu chỉnh sửa đã được gửi đến cán bộ tiếp nhận. Hồ sơ chính sẽ chỉ thay đổi sau khi được nhà trường duyệt." });
}
