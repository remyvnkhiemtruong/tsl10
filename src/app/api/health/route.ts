import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function storageProviderLabel() {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase() || (process.env.BLOB_READ_WRITE_TOKEN ? "vercel_blob" : "local");
  return provider === "vercel_blob" ? "VERCEL_BLOB" : "LOCAL";
}

export async function GET() {
  try {
    const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@gmail.com";
    await prisma.user.count();
    const adminUserExists = Boolean(
      await prisma.user.findUnique({
        where: { email: adminEmail },
        select: { id: true },
      })
    );

    return NextResponse.json({
      ok: true,
      database: "ok",
      storageProvider: storageProviderLabel(),
      adminUserExists,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[health]", error);
    }
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        storageProvider: storageProviderLabel(),
        adminUserExists: false,
        error:
          "Database chưa sẵn sàng. Hãy chạy npx prisma migrate dev && npm run prisma:seed, hoặc kiểm tra DATABASE_URL trên Vercel.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
