import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "vvk-admission",
    storageProvider: process.env.STORAGE_PROVIDER ?? (process.env.BLOB_READ_WRITE_TOKEN ? "vercel_blob" : "local"),
    time: new Date().toISOString()
  });
}
