import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageKey = searchParams.get("pageKey");
  const seasonId = searchParams.get("seasonId");

  const blocks = await prisma.contentBlock.findMany({
    where: {
      ...(pageKey ? { pageKey } : {}),
      ...(seasonId ? { seasonId } : {}),
    },
    orderBy: [{ pageKey: "asc" }, { displayOrder: "asc" }],
  });
  return NextResponse.json({ blocks });
}

const upsertSchema = z.object({
  seasonId: z.string().optional().nullable(),
  pageKey: z.string().min(1),
  blockKey: z.string().min(1),
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  isEnabled: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

export async function PUT(request: Request) {
  const user = await requireAdmin();
  if (!user || user.role === "VIEWER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const { seasonId, pageKey, blockKey, ...data } = parsed.data;

  const existing = await prisma.contentBlock.findFirst({
    where: { seasonId: seasonId ?? null, pageKey, blockKey },
    select: { id: true },
  });
  const block = existing
    ? await prisma.contentBlock.update({
        where: { id: existing.id },
        data: { ...data, updatedById: user.id },
      })
    : await prisma.contentBlock.create({
        data: { seasonId: seasonId ?? null, pageKey, blockKey, ...data, updatedById: user.id },
      });

  return NextResponse.json({ block });
}
