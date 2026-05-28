import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

const DEV_DATABASE_HINT =
  "Chưa khởi tạo database hoặc chưa seed tài khoản admin. Hãy chạy npx prisma migrate dev && npm run prisma:seed";

function looksLikeDatabaseSetupError(error: unknown) {
  if (process.env.NODE_ENV === "production" || !(error instanceof Error)) return false;
  const errorWithCode = error as Error & { code?: unknown };
  const code = typeof errorWithCode.code === "string" ? errorWithCode.code : "";
  return /P1001|P2021|ECONNREFUSED/i.test(code) || /P1001|P2021|does not exist|relation|database|connect|ECONNREFUSED/i.test(error.message);
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const { email, password } = loginSchema.parse(body);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      if (process.env.NODE_ENV !== "production" && email === "admin@gmail.com") {
        const userCount = await prisma.user.count();
        if (userCount === 0) {
          return NextResponse.json({ error: DEV_DATABASE_HINT }, { status: 503 });
        }
      }
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
    if (looksLikeDatabaseSetupError(error)) {
      return NextResponse.json({ error: DEV_DATABASE_HINT }, { status: 503 });
    }
    return NextResponse.json({ error: "Đăng nhập thất bại" }, { status: 400 });
  }
}
