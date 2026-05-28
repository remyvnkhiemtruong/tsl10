import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSchoolSettings, upsertSchoolSettings } from "@/lib/school-settings";
import { schoolContactSchema, zodFieldErrors } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ settings: await getSchoolSettings() });
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = schoolContactSchema.parse(await request.json());
    await upsertSchoolSettings(parsed, user.id);
    await prisma.applicationLog.create({
      data: {
        userId: user.id,
        action: "CONTACT_UPDATED",
        note: "Admin cập nhật cấu hình liên hệ và lịch tuyển sinh",
        metadata: parsed,
      },
    });
    return NextResponse.json({ ok: true, settings: await getSchoolSettings() });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message, fieldErrors: zodFieldErrors(error) }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật cấu hình" },
      { status: 400 }
    );
  }
}
