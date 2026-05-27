import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { applicationUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

function logAction(status: string) {
  if (status === "DA_DUYET_XET_TUYEN") return "APPROVED" as const;
  if (status === "KHONG_HOP_LE") return "REJECTED" as const;
  if (status === "CAN_BO_SUNG") return "REQUESTED_SUPPLEMENT" as const;
  return "STATUS_UPDATED" as const;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = applicationUpdateSchema.parse(body);
    const current = await prisma.application.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    const app = await prisma.application.update({
      where: { id },
      data: {
        status: parsed.status,
        publicNote: parsed.publicNote ?? null,
        internalNote: parsed.internalNote ?? current.internalNote,
        logs: {
          create: [
            {
              userId: user.id,
              action: logAction(parsed.status),
              oldValue: current.status,
              newValue: parsed.status,
              note: parsed.publicNote || parsed.internalNote
            }
          ]
        }
      }
    });
    return NextResponse.json({ application: app });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu cập nhật chưa hợp lệ" }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  const parsed = applicationUpdateSchema.parse({
    status: String(formData.get("status") ?? ""),
    publicNote: String(formData.get("publicNote") ?? ""),
    internalNote: String(formData.get("internalNote") ?? "")
  });
  const current = await prisma.application.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  await prisma.application.update({
    where: { id },
    data: {
      status: parsed.status,
      publicNote: parsed.publicNote ?? null,
      internalNote: parsed.internalNote ?? null,
      logs: {
        create: [
          {
            userId: user.id,
            action: logAction(parsed.status),
            oldValue: current.status,
            newValue: parsed.status,
            note: parsed.publicNote || parsed.internalNote
          }
        ]
      }
    }
  });
  redirect(`/admin/ho-so/${id}`);
}
