"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { SCHOOL_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/huong-dan", label: "Hướng dẫn" },
  { href: "/dang-ky", label: "Đăng ký" },
  { href: "/tra-cuu", label: "Tra cứu" },
  { href: "/cong-bo-trung-tuyen", label: "Công bố trúng tuyển" },
  { href: "/admin", label: "Quản trị" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname.startsWith("/admin");
  return pathname === href;
}

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-slate-900" onClick={() => setOpen(false)}>
          <Image
            src="/LogoVVK.png"
            alt="Logo Trường THPT Võ Văn Kiệt"
            width={48}
            height={48}
            className="h-11 w-11 shrink-0 rounded-full object-contain sm:h-12 sm:w-12"
            priority
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-black text-school-900 sm:text-base">{SCHOOL_NAME}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <ShieldCheck size={14} className="text-school-700" />
              Cổng đăng ký lớp 10
            </span>
          </span>
        </Link>

        <nav className="hidden max-w-full justify-end gap-2 text-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-2 font-semibold text-slate-700 transition hover:bg-school-50 hover:text-school-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100",
                isActive(pathname, item.href) && "bg-school-50 text-school-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm md:hidden"
          aria-label={open ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
          Menu
        </button>
      </div>

      {open && (
        <nav id="public-mobile-menu" className="border-t border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-school-50 hover:text-school-800",
                  isActive(pathname, item.href) && "bg-school-50 text-school-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
