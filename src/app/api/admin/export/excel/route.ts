import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { buildApplicationsWorkbook } from "@/lib/export-excel";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const applications = await prisma.application.findMany({
    where: { deletedAt: null },
    orderBy: { submittedAt: "desc" },
    include: { academicRecords: true, priorities: true, awards: true, files: true }
  });
  const workbook = await buildApplicationsWorkbook(applications);
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=noi-bo-ket-qua-tuyen-sinh-vvk-2026.xlsx"
    }
  });
}
