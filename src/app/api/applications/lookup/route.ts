import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lookupSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = lookupSchema.safeParse({
    applicationCode: url.searchParams.get("applicationCode") ?? "",
    citizenId: url.searchParams.get("citizenId") ?? "",
    dateOfBirth: url.searchParams.get("dateOfBirth") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Thông tin tra cứu chưa hợp lệ" },
      { status: 400 }
    );
  }

  const app = await prisma.application.findFirst({
    where: {
      applicationCode: parsed.data.applicationCode.trim(),
      citizenId: parsed.data.citizenId.trim(),
      dateOfBirth: new Date(parsed.data.dateOfBirth)
    },
    select: {
      applicationCode: true,
      fullName: true,
      dateOfBirth: true,
      secondarySchool: true,
      selectedOptionNumber: true,
      selectedSubjects: true,
      status: true,
      publicNote: true,
      submittedAt: true
    }
  });

  if (!app) return NextResponse.json({ error: "Không tìm thấy hồ sơ phù hợp" }, { status: 404 });
  return NextResponse.json({ application: app });
}
