import { NextResponse } from "next/server";
import { EditRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const status = Object.values(EditRequestStatus).includes(statusParam as EditRequestStatus)
    ? (statusParam as EditRequestStatus)
    : undefined;
  const q = searchParams.get("q")?.trim();
  const where: Prisma.ApplicationEditRequestWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          application: {
            OR: [
              { applicationCode: { contains: q, mode: "insensitive" } },
              { fullName: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const requests = await prisma.applicationEditRequest.findMany({
    where,
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      application: {
        select: {
          applicationCode: true,
          fullName: true,
          secondarySchool: true,
          dateOfBirth: true,
        },
      },
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ requests });
}
