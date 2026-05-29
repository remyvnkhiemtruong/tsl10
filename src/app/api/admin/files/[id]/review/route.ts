import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { fileReviewSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = fileReviewSchema.parse(body);
    const current = await prisma.uploadedFile.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 404 });

    const file = await prisma.uploadedFile.update({
      where: { id },
      data: {
        status: parsed.status,
        note: parsed.note ?? null,
        reviewedAt: new Date(),
        reviewedById: user.id
      }
    });

    if (file.applicationId) {
      await prisma.applicationLog.create({
        data: {
          applicationId: file.applicationId,
          userId: user.id,
          action: "FILE_REVIEWED",
          oldValue: current.status,
          newValue: parsed.status,
          note: parsed.note
        }
      });
    }

    return NextResponse.json({ file });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu duyệt tệp chưa hợp lệ" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể duyệt tệp" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  const parsed = fileReviewSchema.parse({
    status: String(formData.get("status") ?? ""),
    note: String(formData.get("note") ?? "")
  });
  const current = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Không tìm thấy tệp" }, { status: 404 });

  const file = await prisma.uploadedFile.update({
    where: { id },
    data: {
      status: parsed.status,
      note: parsed.note ?? null,
      reviewedAt: new Date(),
      reviewedById: user.id
    }
  });

  if (file.applicationId) {
    await prisma.applicationLog.create({
      data: {
        applicationId: file.applicationId,
        userId: user.id,
        action: "FILE_REVIEWED",
        oldValue: current.status,
        newValue: parsed.status,
        note: parsed.note
      }
    });
    redirect(`/admin/ho-so/${file.applicationId}`);
  }

  redirect("/admin/ho-so");
}
