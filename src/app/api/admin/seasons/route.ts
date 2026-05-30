import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seasons = await prisma.admissionSeason.findMany({
    include: {
      academicYear: { select: { name: true, code: true } },
      _count: { select: { applications: true } },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ seasons });
}

const createSchema = z.object({
  academicYearCode: z.string().min(1),
  academicYearName: z.string().min(1),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  code: z.string().min(1).max(50),
  quota: z.number().int().positive().optional(),
  method: z.enum(["XET_TUYEN", "THI_TUYEN", "KET_HOP"]).default("XET_TUYEN"),
  description: z.string().optional(),
  applicationCodePrefix: z.string().max(10).default("VK"),
  registrationOpen: z.boolean().default(false),
  subjectOptions: z
    .array(z.object({ optionNumber: z.number().int(), subjects: z.string(), name: z.string().optional() }))
    .optional(),
});

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() }, { status: 400 });
  }

  const { academicYearCode, academicYearName, subjectOptions, ...seasonData } = parsed.data;

  const season = await prisma.$transaction(async (tx) => {
    // Upsert academic year
    const academicYear = await tx.academicYear.upsert({
      where: { code: academicYearCode },
      update: {},
      create: { code: academicYearCode, name: academicYearName, status: "DANG_MO", isActive: true },
    });

    // Create the season
    const s = await tx.admissionSeason.create({
      data: {
        ...seasonData,
        academicYearId: academicYear.id,
        status: "NHAP",
        isDefault: false,
      },
    });

    // Seed subject options if provided
    if (subjectOptions && subjectOptions.length > 0) {
      await tx.subjectOption.createMany({
        data: subjectOptions.map((opt, i) => ({
          seasonId: s.id,
          optionNumber: opt.optionNumber,
          subjects: opt.subjects,
          name: opt.name ?? `Phương án ${opt.optionNumber}`,
          sortOrder: i,
          isActive: true,
        })),
      });
    }

    return s;
  });

  return NextResponse.json({ season }, { status: 201 });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { id: string; setDefault?: boolean; registrationOpen?: boolean; resultsPublished?: boolean; status?: string };
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updateData: Record<string, unknown> = {};
  if (typeof body.registrationOpen === "boolean") updateData.registrationOpen = body.registrationOpen;
  if (typeof body.resultsPublished === "boolean") updateData.resultsPublished = body.resultsPublished;
  if (body.status) updateData.status = body.status;

  // If setDefault: true, unset all others first
  if (body.setDefault === true) {
    await prisma.$transaction([
      prisma.admissionSeason.updateMany({ where: {}, data: { isDefault: false } }),
      prisma.admissionSeason.update({ where: { id: body.id }, data: { isDefault: true, ...updateData } }),
    ]);
  } else {
    await prisma.admissionSeason.update({ where: { id: body.id }, data: updateData });
  }

  return NextResponse.json({ ok: true });
}
