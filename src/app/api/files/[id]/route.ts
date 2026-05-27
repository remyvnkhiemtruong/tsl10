import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

function safeDownloadName(name: string) {
  return encodeURIComponent(name.replace(/[\r\n"]/g, "_"));
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.uploadedFile.findUnique({ where: { id } });
  if (!file) return NextResponse.json({ error: "Không tìm thấy file" }, { status: 404 });

  const buffer = await readStoredFile(file);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${safeDownloadName(file.originalName)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
