import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

const DATABASE_READY_HINT =
  "Database chưa sẵn sàng. Hãy chạy npx prisma migrate dev && npm run prisma:seed, hoặc kiểm tra DATABASE_URL trên Vercel.";

function looksLikeDatabaseSetupError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ["P1000", "P1001", "P1002", "P1003", "P1010", "P2021", "P2022", "ECONNREFUSED"].includes(error.code);
  }
  if (!(error instanceof Error)) return false;
  const errorWithCode = error as Error & { code?: unknown };
  const code = typeof errorWithCode.code === "string" ? errorWithCode.code : "";
  return (
    /P1001|P2021|P2022|ECONNREFUSED/i.test(code) ||
    /relation|does not exist|Can't reach database server|ECONNREFUSED|database|connect/i.test(error.message)
  );
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
          return NextResponse.json({ error: DATABASE_READY_HINT }, { status: 503 });
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
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Dữ liệu đăng nhập chưa hợp lệ" }, { status: 400 });
    }
    if (looksLikeDatabaseSetupError(error)) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[auth/login]", error);
      }
      return NextResponse.json({ error: DATABASE_READY_HINT }, { status: 503 });
    }
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth/login]", error);
    }
    return NextResponse.json({ error: "Đăng nhập thất bại" }, { status: 500 });
  }
}
