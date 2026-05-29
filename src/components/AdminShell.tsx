import Image from "next/image";
import Link from "next/link";
import { BarChart3, FileSpreadsheet, Files, LogOut, Megaphone, Settings } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { SCHOOL_NAME } from "@/lib/constants";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/ho-so", label: "Hồ sơ", icon: Files },
  { href: "/admin/trung-tuyen", label: "Trúng tuyển", icon: Megaphone },
  { href: "/admin/cau-hinh", label: "Cấu hình", icon: Settings },
  { href: "/api/admin/export/excel", label: "Xuất Excel", icon: FileSpreadsheet },
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage();
  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white p-5 shadow-sm md:block">
        <div className="flex items-center gap-3">
          <Image src="/LogoVVK.png" alt="Logo Trường THPT Võ Văn Kiệt" width={44} height={44} className="h-11 w-11 rounded-full object-contain" />
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-school-900">Quản trị tuyển sinh</div>
            <div className="truncate text-xs text-slate-500">{SCHOOL_NAME}</div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-slate-50 p-3 text-sm">
          <div className="font-semibold text-slate-900">{user.name}</div>
          <div className="mt-1 text-xs uppercase tracking-wide text-slate-500">{user.role}</div>
        </div>
        <nav className="mt-6 grid gap-2 text-sm">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                className="inline-flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold text-slate-700 transition hover:bg-school-50 hover:text-school-800"
                href={item.href}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form className="mt-8" action="/api/auth/logout" method="post">
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
            <LogOut size={16} /> Đăng xuất
          </button>
        </form>
      </aside>
      <main className="md:pl-72">
        <div className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div className="flex items-center gap-3">
            <Image src="/LogoVVK.png" alt="Logo Trường THPT Võ Văn Kiệt" width={36} height={36} className="h-9 w-9 rounded-full object-contain" />
            <div className="font-bold text-school-900">Quản trị tuyển sinh</div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-3 font-semibold text-slate-700 transition hover:bg-school-50 hover:text-school-800"
                  href={item.href}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
