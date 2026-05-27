import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SCHOOL_NAME } from "@/lib/constants";

const navItems = [
  { href: "/huong-dan", label: "Hướng dẫn" },
  { href: "/dang-ky", label: "Đăng ký" },
  { href: "/tra-cuu", label: "Tra cứu" },
  { href: "/admin/login", label: "Quản trị" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-900">
          <Image
            src="/LogoVVK.png"
            alt="Logo Trường THPT Võ Văn Kiệt"
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full object-contain"
            priority
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-school-900 sm:text-base">{SCHOOL_NAME}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <ShieldCheck size={14} className="text-school-700" />
              Cổng tuyển sinh lớp 10
            </span>
          </span>
        </Link>
        <nav className="flex max-w-full flex-wrap justify-end gap-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 font-semibold text-slate-700 transition hover:bg-school-50 hover:text-school-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
