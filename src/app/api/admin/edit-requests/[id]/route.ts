import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const editRequest = await prisma.applicationEditRequest.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          academicRecords: { orderBy: { grade: "asc" } },
          priorities: true,
          awards: true,
        },
      },
      reviewedBy: { select: { name: true } },
    },
  });

  if (!editRequest) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  return NextResponse.json({ editRequest });
}
