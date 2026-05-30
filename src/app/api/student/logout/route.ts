import { NextResponse } from "next/server";
import { clearStudentSession } from "@/lib/student-auth";

export const runtime = "nodejs";

export async function POST() {
  await clearStudentSession();
  return NextResponse.json({ ok: true });
}
