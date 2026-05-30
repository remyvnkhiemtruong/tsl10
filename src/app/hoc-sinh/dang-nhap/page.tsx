"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";

export default function StudentLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ applicationCode: "", citizenId: "", dateOfBirth: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Không tìm thấy hồ sơ phù hợp.");
        return;
      }
      router.push("/hoc-sinh/ho-so");
    } catch {
      setError("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-school-700 hover:underline">
            ← Trang chủ
          </Link>
          <span className="text-xs text-slate-400">Cổng tra cứu hồ sơ dự tuyển</span>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-school-700 shadow-lg">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="mt-5 text-2xl font-black text-slate-950">Tra cứu hồ sơ dự tuyển</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Đăng nhập bằng mã hồ sơ, số định danh/CCCD và ngày sinh của học sinh để xem và yêu cầu
              chỉnh sửa thông tin hồ sơ.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <label className="block">
              <span className="form-label">Mã hồ sơ</span>
              <input
                className="form-input"
                placeholder="VK2026-000001"
                value={form.applicationCode}
                onChange={(e) => setForm((f) => ({ ...f, applicationCode: e.target.value.toUpperCase() }))}
                required
                autoComplete="off"
                autoFocus
              />
            </label>

            <label className="block">
              <span className="form-label">Số định danh/CCCD</span>
              <input
                className="form-input"
                inputMode="numeric"
                placeholder="012345678901"
                value={form.citizenId}
                onChange={(e) => setForm((f) => ({ ...f, citizenId: e.target.value.replace(/\D/g, "") }))}
                required
                autoComplete="off"
                maxLength={12}
              />
            </label>

            <label className="block">
              <span className="form-label">Ngày sinh</span>
              <input
                className="form-input"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-school-700 font-semibold text-white transition hover:bg-school-900 disabled:opacity-60"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Đang xác thực..." : "Xem hồ sơ"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Thông tin đăng nhập không được lưu trữ sau khi đóng trình duyệt.{" "}
            <Link href="/tra-cuu" className="text-school-600 underline">
              Tra cứu công khai
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
