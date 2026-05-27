import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { clearSession } from "@/lib/auth";

export async function POST(request: Request) {
  await clearSession();
  if (request.headers.get("accept")?.includes("text/html")) {
    redirect("/admin/login");
  }
  return NextResponse.json({ ok: true });
}
