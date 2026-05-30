import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createStudentSession } from "@/lib/student-auth";

export const runtime = "nodejs";

const loginSchema = z.object({
  applicationCode: z.string().min(1),
  citizenId: z.string().regex(/^\d{9,12}$/, "Số định danh/CCCD phải gồm 9-12 chữ số"),
  dateOfBirth: z.string().min(1),
});

// Generic error to prevent enumeration attacks
const GENERIC_ERROR = "Không tìm thấy hồ sơ phù hợp. Vui lòng kiểm tra lại mã hồ sơ, số định danh/CCCD và ngày sinh.";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const { applicationCode, citizenId, dateOfBirth } = parsed.data;

    // Parse date in Vietnam format (YYYY-MM-DD from input[type=date])
    const inputDate = new Date(dateOfBirth);
    if (isNaN(inputDate.getTime())) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    const application = await prisma.application.findFirst({
      where: {
        applicationCode: applicationCode.trim().toUpperCase(),
        citizenId: citizenId.trim(),
        deletedAt: null,
      },
      select: { id: true, dateOfBirth: true, fullName: true, applicationCode: true },
    });

    if (!application) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Compare dateOfBirth (year/month/day only)
    const storedDate = new Date(application.dateOfBirth);
    const sameDate =
      storedDate.getUTCFullYear() === inputDate.getUTCFullYear() &&
      storedDate.getUTCMonth() === inputDate.getUTCMonth() &&
      storedDate.getUTCDate() === inputDate.getUTCDate();

    if (!sameDate) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    await createStudentSession(application.id);

    return NextResponse.json({
      applicationCode: application.applicationCode,
      fullName: application.fullName,
    });
  } catch (error) {
    console.error("[student/login]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Lỗi hệ thống. Vui lòng thử lại." }, { status: 500 });
  }
}
