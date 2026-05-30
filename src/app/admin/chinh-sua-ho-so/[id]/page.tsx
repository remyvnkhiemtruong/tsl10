"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, MessageSquare, Loader2 } from "lucide-react";

type EditRequest = {
  id: string;
  requestCode: string;
  status: string;
  snapshotBeforeJson: Record<string, unknown> | null;
  proposedDataJson: Record<string, unknown> | null;
  studentNote: string | null;
  officerNote: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
  application: {
    applicationCode: string;
    fullName: string;
    secondarySchool: string;
  };
};

const FIELD_LABELS: Record<string, string> = {
  guardianName: "Họ tên phụ huynh",
  guardianPhone: "SĐT phụ huynh",
  studentPhone: "SĐT học sinh",
  email: "Email",
  houseNumber: "Số nhà",
  hamlet: "Ấp/khóm",
  ward: "Xã/phường",
  province: "Tỉnh/thành phố",
  permanentAddress: "Địa chỉ thường trú",
  additionalAwardsNote: "Ghi chú giải thưởng",
};

export default function AdminEditRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<EditRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"approve" | "reject" | "supplement" | null>(null);
  const [officerNote, setOfficerNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/edit-requests/${id}`)
      .then((r) => r.json() as Promise<{ editRequest?: EditRequest }>)
      .then(({ editRequest }) => {
        if (!editRequest) { router.replace("/admin/chinh-sua-ho-so"); return; }
        setReq(editRequest);
        setLoading(false);
      })
      .catch(() => router.replace("/admin/chinh-sua-ho-so"));
  }, [id, router]);

  async function handleAction(actionType: "approve" | "reject" | "supplement") {
    if (!req) return;
    setSubmitting(true);
    setMessage(null);

    const endpoint = `/api/admin/edit-requests/${req.id}/${actionType === "supplement" ? "request-supplement" : actionType}`;
    const body =
      actionType === "approve" ? { officerNote } :
      actionType === "reject" ? { rejectionReason, officerNote } :
      { officerNote };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Lỗi xử lý");
      setMessage({ type: "success", text: data.message ?? "Đã xử lý thành công." });
      setAction(null);
      setTimeout(() => router.push("/admin/chinh-sua-ho-so"), 2000);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Lỗi hệ thống." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-school-700" size={32} />
    </div>
  );
  if (!req) return null;

  const before = req.snapshotBeforeJson ?? {};
  const proposed = req.proposedDataJson ?? {};
  const changedFields = Object.keys(proposed).filter((k) => String(proposed[k] ?? "") !== String(before[k] ?? ""));

  const canProcess = req.status === "CHO_DUYET";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/admin/chinh-sua-ho-so" className="flex items-center gap-1 text-sm font-semibold text-school-700 hover:underline">
            <ArrowLeft size={16} /> Danh sách
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-700">{req.requestCode}</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        {message && (
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${message.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">{req.requestCode}</p>
          <h1 className="mt-1 text-xl font-black text-slate-950">{req.application.fullName}</h1>
          <p className="text-sm text-slate-500">{req.application.applicationCode} · {req.application.secondarySchool}</p>
          {req.submittedAt && (
            <p className="mt-2 text-xs text-slate-400">Gửi lúc {new Date(req.submittedAt).toLocaleString("vi-VN")}</p>
          )}
          {req.studentNote && (
            <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p className="font-semibold text-slate-700">Ghi chú của học sinh/phụ huynh:</p>
              <p className="mt-1 text-slate-600">{req.studentNote}</p>
            </div>
          )}
        </div>

        {/* Changed fields diff */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">So sánh thay đổi</h2>
          {changedFields.length === 0 ? (
            <p className="mt-3 text-sm text-slate-400">Không phát hiện thay đổi nào.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {changedFields.map((field) => (
                <div key={field} className="rounded-xl border border-slate-100 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {FIELD_LABELS[field] ?? field}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-red-50 px-3 py-2">
                      <p className="text-xs text-red-400">Trước</p>
                      <p className="mt-0.5 font-medium text-red-800">{String(before[field] ?? "—")}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 px-3 py-2">
                      <p className="text-xs text-green-400">Sau (đề nghị)</p>
                      <p className="mt-0.5 font-medium text-green-800">{String(proposed[field] ?? "—")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action panel */}
        {canProcess && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">Xử lý yêu cầu</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setAction(action === "approve" ? null : "approve")}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <Check size={16} /> Duyệt
              </button>
              <button
                onClick={() => setAction(action === "supplement" ? null : "supplement")}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                <MessageSquare size={16} /> Yêu cầu bổ sung
              </button>
              <button
                onClick={() => setAction(action === "reject" ? null : "reject")}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <X size={16} /> Từ chối
              </button>
            </div>

            {action === "approve" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="form-label">Ghi chú cho học sinh (tuỳ chọn)</span>
                  <textarea className="form-textarea" rows={2} value={officerNote} onChange={(e) => setOfficerNote(e.target.value)} placeholder="VD: Đã cập nhật số điện thoại phụ huynh theo yêu cầu." />
                </label>
                <button onClick={() => handleAction("approve")} disabled={submitting} className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Xác nhận duyệt
                </button>
              </div>
            )}
            {action === "supplement" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="form-label">Nội dung yêu cầu bổ sung *</span>
                  <textarea className="form-textarea" rows={2} value={officerNote} onChange={(e) => setOfficerNote(e.target.value)} placeholder="VD: Vui lòng xác nhận lại địa chỉ thường trú và cung cấp ấp/khóm cụ thể." />
                </label>
                <button onClick={() => handleAction("supplement")} disabled={submitting || !officerNote.trim()} className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                  Gửi yêu cầu bổ sung
                </button>
              </div>
            )}
            {action === "reject" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="form-label">Lý do từ chối *</span>
                  <textarea className="form-textarea" rows={2} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="VD: Thông tin đề nghị không khớp với giấy tờ đã nộp." />
                </label>
                <label className="block">
                  <span className="form-label">Ghi chú thêm (tuỳ chọn)</span>
                  <textarea className="form-textarea" rows={2} value={officerNote} onChange={(e) => setOfficerNote(e.target.value)} />
                </label>
                <button onClick={() => handleAction("reject")} disabled={submitting || !rejectionReason.trim()} className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                  Xác nhận từ chối
                </button>
              </div>
            )}
          </div>
        )}

        {!canProcess && (
          <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
            Yêu cầu này đã được xử lý (trạng thái: {req.status}).{" "}
            {req.officerNote && <span>Ghi chú: {req.officerNote}</span>}
            {req.rejectionReason && <span className="text-red-600"> Lý do từ chối: {req.rejectionReason}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
