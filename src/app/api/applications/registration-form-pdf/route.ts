import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { buildRegistrationFormPdf, registrationFormPdfFilename } from "@/lib/registration-form-pdf";
import { registrationFormPdfRequestSchema, zodFieldErrors } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const parsed = registrationFormPdfRequestSchema.parse(await request.json());
    const app = await prisma.application.findFirst({
      where: {
        deletedAt: null,
        applicationCode: parsed.applicationCode.trim(),
        citizenId: parsed.citizenId.trim(),
        dateOfBirth: new Date(parsed.dateOfBirth),
      },
      include: { academicRecords: true, priorities: true, awards: true, files: true },
    });
    if (!app) return NextResponse.json({ error: "Không tìm thấy hồ sơ phù hợp" }, { status: 404 });

    const pdf = await buildRegistrationFormPdf(app);
    await prisma.application.update({
      where: { id: app.id },
      data: {
        registrationFormPdfPrintedAt: new Date(),
        logs: { create: [{ action: "REGISTRATION_FORM_PDF_EXPORTED", note: "Thí sinh tải đơn đăng ký PDF" }] },
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
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message, fieldErrors: zodFieldErrors(error) }, { status: 400 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Không thể xuất PDF" }, { status: 400 });
  }
}
