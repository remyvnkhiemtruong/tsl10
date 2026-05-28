import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const admissionBatch = url.searchParams.get("admissionBatch")?.trim() ?? "";
  const option = Number(url.searchParams.get("selectedOptionNumber") ?? "");

  const where: Prisma.ApplicationWhereInput = {
    deletedAt: null,
    admissionPublished: true,
    admissionResult: "TRUNG_TUYEN",
    ...(admissionBatch ? { admissionBatch } : {}),
    ...(Number.isInteger(option) && option >= 1 && option <= 6 ? { selectedOptionNumber: option } : {}),
    ...(q
      ? {
          OR: [
            { applicationCode: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { secondarySchool: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.application.findMany({
      where,
      orderBy: [
        { admissionBatch: "asc" },
        { admissionRank: "asc" },
        { admissionScoreSnapshot: "desc" },
        { fullName: "asc" },
      ],
      take: 500,
      select: {
        admissionRank: true,
        applicationCode: true,
        fullName: true,
        dateOfBirth: true,
        secondarySchool: true,
        selectedOptionNumber: true,
        selectedSubjects: true,
        admissionBatch: true,
        admissionScoreSnapshot: true,
        admissionPublicNote: true,
      },
    }),
    prisma.application.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      rank: item.admissionRank,
      applicationCode: item.applicationCode,
      fullName: item.fullName,
      dateOfBirth: item.dateOfBirth.toISOString().slice(0, 10),
      secondarySchool: item.secondarySchool,
      selectedOptionNumber: item.selectedOptionNumber,
      selectedSubjects: item.selectedSubjects,
      admissionBatch: item.admissionBatch,
      admissionScore: item.admissionScoreSnapshot,
      publicNote: item.admissionPublicNote,
    })),
    total,
  });
}
