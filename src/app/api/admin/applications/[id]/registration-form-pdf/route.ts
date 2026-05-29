import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildRegistrationFormPdf, registrationFormPdfFilename } from "@/lib/registration-form-pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { deletedAt: null, OR: [{ id }, { applicationCode: id }] },
    include: { academicRecords: true, priorities: true, awards: true, files: true },
  });
  if (!app) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  if (!app.registrationFormNumber) {
    return NextResponse.json({ error: "Vui lòng nhập số phiếu trước khi xuất phiếu đăng ký PDF." }, { status: 400 });
  }

  const pdf = await buildRegistrationFormPdf(app);
  await prisma.application.update({
    where: { id: app.id },
    data: {
      registrationFormPdfPrintedAt: new Date(),
      logs: {
        create: [{ userId: user.id, action: "REGISTRATION_FORM_PDF_EXPORTED", note: "Admin tải phiếu đăng ký dự tuyển PDF" }],
      },
    },
  });

  const buffer = Buffer.from(pdf);
  const body = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${registrationFormPdfFilename(app.applicationCode)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
