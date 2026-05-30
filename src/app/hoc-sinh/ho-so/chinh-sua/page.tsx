"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Send } from "lucide-react";

type Application = {
  applicationCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  ethnicity: string;
  birthPlace: string;
  citizenId: string;
  issueDate: string | null;
  issuePlace: string | null;
  secondarySchool: string;
  schoolYear: string;
  permanentAddress: string;
  houseNumber: string | null;
  hamlet: string | null;
  ward: string | null;
  province: string | null;
  studentPhone: string | null;
  email: string | null;
  guardianName: string;
  guardianPhone: string;
  additionalAwardsNote: string | null;
  studentEditLocked: boolean;
};

type EditFormData = {
  guardianName: string;
  guardianPhone: string;
  studentPhone: string;
  email: string;
  houseNumber: string;
  hamlet: string;
  ward: string;
  province: string;
  permanentAddress: string;
  additionalAwardsNote: string;
};

export default function StudentEditRequestPage() {
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [form, setForm] = useState<EditFormData | null>(null);
  const [studentNote, setStudentNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/student/application");
      if (!res.ok) {
        router.replace("/hoc-sinh/dang-nhap");
        return;
      }
      const data = (await res.json()) as { application: Application };
      const a = data.application;
      if (a.studentEditLocked) {
        router.replace("/hoc-sinh/ho-so");
        return;
      }
      setApp(a);
      setForm({
        guardianName: a.guardianName,
        guardianPhone: a.guardianPhone,
        studentPhone: a.studentPhone ?? "",
        email: a.email ?? "",
        houseNumber: a.houseNumber ?? "",
        hamlet: a.hamlet ?? "",
        ward: a.ward ?? "",
        province: a.province ?? "",
        permanentAddress: a.permanentAddress,
        additionalAwardsNote: a.additionalAwardsNote ?? "",
      });
      setLoading(false);
    }
    load().catch(() => router.replace("/hoc-sinh/dang-nhap"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Create or update draft
      const draftRes = await fetch("/api/student/edit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedDataJson: form, studentNote }),
      });
      const draftData = (await draftRes.json()) as { error?: string; editRequest?: { id: string } };

      if (!draftRes.ok) {
        // If conflict (existing draft), try PATCH
        if (draftRes.status === 409) {
          const patchRes = await fetch("/api/student/edit-request", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proposedDataJson: form, studentNote }),
          });
          if (!patchRes.ok) {
            const pd = (await patchRes.json()) as { error?: string };
            throw new Error(pd.error ?? "Không thể cập nhật yêu cầu");
          }
        } else {
          throw new Error(draftData.error ?? "Không thể tạo yêu cầu chỉnh sửa");
        }
      }

      // Submit the draft
      const submitRes = await fetch("/api/student/edit-request/submit", { method: "POST" });
      const submitData = (await submitRes.json()) as { error?: string; message?: string };
      if (!submitRes.ok) throw new Error(submitData.error ?? "Không thể gửi yêu cầu");

      setSuccess(submitData.message ?? "Yêu cầu đã được gửi thành công.");
      setTimeout(() => router.push("/hoc-sinh/ho-so"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi hệ thống.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-school-700" size={32} />
      </div>
    );
  }

  if (!app || !form) return null;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/hoc-sinh/ho-so" className="flex items-center gap-1 text-sm font-semibold text-school-700 hover:underline">
            <ArrowLeft size={16} /> Hồ sơ
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-700">Gửi yêu cầu chỉnh sửa</span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm text-amber-800 mb-6">
          <p className="font-semibold">⚠️ Lưu ý quan trọng</p>
          <p className="mt-1">
            Yêu cầu chỉnh sửa sẽ được gửi đến cán bộ tuyển sinh để xem xét. Thông tin trong hồ sơ chính
            <strong> chỉ được thay đổi sau khi cán bộ duyệt</strong>. Bạn chỉ có thể chỉnh sửa
            các trường liên hệ và địa chỉ. Để thay đổi điểm học tập hoặc giấy tờ định danh, vui lòng
            liên hệ trực tiếp nhà trường.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-4 text-sm text-green-800">
              <p className="font-semibold">✓ {success}</p>
              <p className="mt-1">Đang chuyển hướng về trang hồ sơ...</p>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Thông tin liên hệ và địa chỉ</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="form-label">Họ tên phụ huynh/giám hộ</span>
                <input
                  className="form-input"
                  value={form.guardianName}
                  onChange={(e) => setForm((f) => f ? { ...f, guardianName: e.target.value } : f)}
                  required
                />
              </label>
              <label className="block">
                <span className="form-label">SĐT phụ huynh</span>
                <input
                  className="form-input"
                  inputMode="tel"
                  value={form.guardianPhone}
                  onChange={(e) => setForm((f) => f ? { ...f, guardianPhone: e.target.value } : f)}
                  required
                />
              </label>
              <label className="block">
                <span className="form-label">SĐT học sinh</span>
                <input
                  className="form-input"
                  inputMode="tel"
                  value={form.studentPhone}
                  onChange={(e) => setForm((f) => f ? { ...f, studentPhone: e.target.value } : f)}
                />
              </label>
              <label className="block">
                <span className="form-label">Email</span>
                <input
                  className="form-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => f ? { ...f, email: e.target.value } : f)}
                />
              </label>
              <label className="block">
                <span className="form-label">Số nhà</span>
                <input
                  className="form-input"
                  value={form.houseNumber}
                  onChange={(e) => setForm((f) => f ? { ...f, houseNumber: e.target.value } : f)}
                />
              </label>
              <label className="block">
                <span className="form-label">Ấp/khóm</span>
                <input
                  className="form-input"
                  value={form.hamlet}
                  onChange={(e) => setForm((f) => f ? { ...f, hamlet: e.target.value } : f)}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="form-label">Địa chỉ thường trú đầy đủ (nếu cần sửa thêm)</span>
                <input
                  className="form-input"
                  value={form.permanentAddress}
                  onChange={(e) => setForm((f) => f ? { ...f, permanentAddress: e.target.value } : f)}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="form-label">Ghi chú thêm về giải thưởng (nếu cần sửa)</span>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={form.additionalAwardsNote}
                  onChange={(e) => setForm((f) => f ? { ...f, additionalAwardsNote: e.target.value } : f)}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Ghi chú của học sinh/phụ huynh</h2>
            <textarea
              className="form-textarea mt-3"
              rows={3}
              placeholder="Mô tả ngắn gọn lý do cần chỉnh sửa, ví dụ: Nhập sai số điện thoại phụ huynh..."
              value={studentNote}
              onChange={(e) => setStudentNote(e.target.value)}
              maxLength={2000}
            />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hoc-sinh/ho-so"
              className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting || !!success}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-school-700 px-4 text-sm font-semibold text-white transition hover:bg-school-900 disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? "Đang gửi..." : "Gửi yêu cầu chỉnh sửa"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
