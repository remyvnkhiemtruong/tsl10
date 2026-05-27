import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { email, password } = loginSchema.parse(body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "Thông tin đăng nhập không đúng" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Thông tin đăng nhập không đúng" }, { status: 401 });
    }

    await createSession(user.id, user.role);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu đăng nhập chưa hợp lệ" }, { status: 400 });
    }
    return NextResponse.json({ error: "Đăng nhập thất bại" }, { status: 400 });
  }
}
