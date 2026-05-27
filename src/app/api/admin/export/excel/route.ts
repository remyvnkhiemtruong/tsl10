import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { buildApplicationsWorkbook } from "@/lib/export-excel";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const applications = await prisma.application.findMany({ orderBy: { submittedAt: "desc" } });
  const workbook = await buildApplicationsWorkbook(applications);
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=ds-ho-so-tuyen-sinh-vvk-2026.xlsx"
    }
  });
}
