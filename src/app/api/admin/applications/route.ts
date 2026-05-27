import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.application.findMany({
    orderBy: { submittedAt: "desc" },
    take: 200,
    include: { files: true, priorities: true, awards: true }
  });
  return NextResponse.json({ applications });
}
