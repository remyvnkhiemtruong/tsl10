"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function DeleteApplicationButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function deleteApplication() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteReason }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Không thể xóa hồ sơ");
      router.push("/admin/ho-so");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa hồ sơ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 size={16} /> Xóa hồ sơ
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Xóa hồ sơ</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bạn chắc chắn muốn xóa hồ sơ này? Hồ sơ sẽ bị ẩn khỏi danh sách quản trị.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-4">
              <label className="form-label" htmlFor="deleteReason">
                Lý do xóa
              </label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Nhập lý do xóa hồ sơ"
              />
            </div>
            {error && (
              <Alert variant="destructive" className="mt-4">
                {error}
              </Alert>
            )}
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Hủy
              </Button>
              <Button variant="destructive" onClick={deleteApplication} disabled={loading || !deleteReason.trim()}>
                <Trash2 size={16} /> {loading ? "Đang xóa..." : "Xóa hồ sơ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
