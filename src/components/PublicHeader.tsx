import Link from "next/link";
import { SCHOOL_NAME } from "@/lib/constants";

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="font-bold text-school-900">
          {SCHOOL_NAME}
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm text-slate-700">
          <Link href="/huong-dan">Hướng dẫn</Link>
          <Link href="/dang-ky">Đăng ký</Link>
          <Link href="/tra-cuu">Tra cứu</Link>
          <Link href="/admin/login">Quản trị</Link>
        </nav>
      </div>
    </header>
  );
}
