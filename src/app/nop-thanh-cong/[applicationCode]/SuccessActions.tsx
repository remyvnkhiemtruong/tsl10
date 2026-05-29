"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function SuccessActions({ applicationCode }: { applicationCode: string }) {
  const [message, setMessage] = useState("");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(applicationCode);
      setMessage("Đã sao chép mã hồ sơ.");
    } catch {
      setMessage("Không thể sao chép tự động. Vui lòng bôi đen và sao chép mã hồ sơ.");
    }
  }

  return (
    <div className="mt-6 space-y-4">
      {message && (
        <Alert className="text-left" role="status" aria-live="polite">
          {message}
        </Alert>
      )}
      <Alert variant="warning" className="text-left">
        Phiếu đăng ký dự tuyển PDF chỉ tải được sau khi nhà trường duyệt hồ sơ trực tuyến và cấp số phiếu.
      </Alert>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button variant="secondary" onClick={copyCode} className="w-full sm:w-auto">
          <Copy size={16} /> Sao chép mã hồ sơ
        </Button>
        <Link
          href="/tra-cuu"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-school-700 px-4 text-sm font-semibold text-white transition hover:bg-school-900 sm:w-auto"
        >
          <Search size={16} /> Tra cứu hồ sơ
        </Link>
      </div>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/dang-ky"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:w-auto"
        >
          Nộp hồ sơ khác
        </Link>
      </div>
    </div>
  );
}
