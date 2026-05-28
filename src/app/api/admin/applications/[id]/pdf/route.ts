import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { buildApplicationPdfHtml } from "@/lib/pdf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { deletedAt: null, OR: [{ id }, { applicationCode: id }] },
    include: { academicRecords: true, priorities: true, awards: true, files: true }
  });

  if (!app) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  const html = await buildApplicationPdfHtml(app);
  try {
    const puppeteer = await import("puppeteer-core");
    const chromium = (await import("@sparticuz/chromium")).default;
    const browser = await puppeteer.default.launch({
      args: chromium.args,
      defaultViewport: { width: 794, height: 1123 },
      executablePath: await chromium.executablePath(),
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await browser.close();
    const pdfBody = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
    return new NextResponse(pdfBody, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=${app.applicationCode}.pdf`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    console.error("PDF render failed, returning printable HTML fallback", error);
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" }
    });
  }
}
