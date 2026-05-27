import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white p-5 md:block">
        <div className="font-black text-school-900">Quản trị tuyển sinh</div>
        <div className="mt-1 text-xs text-slate-500">
          {user.name} · {user.role}
        </div>
        <nav className="mt-8 grid gap-2 text-sm">
          <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/admin/ho-so">
            Hồ sơ
          </Link>
          <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/api/admin/export/excel">
            Xuất Excel
          </Link>
        </nav>
        <form className="mt-8" action="/api/auth/logout" method="post">
          <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            Đăng xuất
          </button>
        </form>
      </aside>
      <main className="md:pl-64">
        <div className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="font-bold text-school-900">Quản trị tuyển sinh</div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
