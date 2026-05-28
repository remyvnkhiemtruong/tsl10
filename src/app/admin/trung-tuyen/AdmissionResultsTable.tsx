"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Megaphone, RotateCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ADMISSION_BATCH_OPTIONS,
  ADMISSION_RESULT_LABELS,
  ADMISSION_RESULT_STATUSES,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export type AdmissionResultRow = {
  id: string;
  applicationCode: string;
  fullName: string;
  dateOfBirth: string;
  secondarySchool: string;
  selectedOptionNumber: number;
  selectedSubjects: string;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  totalScore: number;
  admissionResult: string;
  admissionRank: number | null;
  admissionBatch: string | null;
  admissionPublished: boolean;
  admissionPublishedAt: string | null;
};

function resultVariant(result: string): "secondary" | "success" | "warning" | "destructive" {
  if (result === "TRUNG_TUYEN") return "success";
  if (result === "DU_BI") return "warning";
  if (["KHONG_TRUNG_TUYEN", "HUY_KET_QUA"].includes(result)) return "destructive";
  return "secondary";
}

export function AdmissionResultsTable({ rows }: { rows: AdmissionResultRow[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Partial<AdmissionResultRow>>>({});
  const [message, setMessage] = useState("");

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const selectedRows = useMemo(() => rows.filter((row) => selected.includes(row.id)), [rows, selected]);

  function patchDraft(id: string, patch: Partial<AdmissionResultRow>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  async function saveResult(row: AdmissionResultRow) {
    const draft = drafts[row.id] ?? {};
    const res = await fetch(`/api/admin/applications/${row.id}/admission-result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admissionResult: draft.admissionResult ?? row.admissionResult,
        admissionRank: draft.admissionRank ?? row.admissionRank ?? undefined,
        admissionBatch: draft.admissionBatch ?? row.admissionBatch ?? "",
        snapshotScore: true,
      }),
    });
    setMessage(res.ok ? "Đã lưu kết quả tuyển sinh." : ((await res.json()) as { error?: string }).error ?? "Không thể lưu.");
    if (res.ok) window.location.reload();
  }

  async function publish(row: AdmissionResultRow, publishValue: boolean) {
    const res = await fetch(`/api/admin/applications/${row.id}/publish-admission`, {
      method: publishValue ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotScore: true }),
    });
    setMessage(res.ok ? (publishValue ? "Đã công bố." : "Đã gỡ công bố.") : ((await res.json()) as { error?: string }).error ?? "Không thể cập nhật.");
    if (res.ok) window.location.reload();
  }

  async function bulkPublish(publishValue: boolean) {
    if (selectedRows.length === 0) return;
    const confirmText = publishValue
      ? "Chỉ các hồ sơ TRÚNG TUYỂN được chọn mới được công bố. Tiếp tục?"
      : "Gỡ công bố các hồ sơ đã chọn?";
    if (!window.confirm(confirmText)) return;
    const res = await fetch("/api/admin/admission-results/bulk-publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationIds: selected, publish: publishValue, snapshotScore: true }),
    });
    const json = (await res.json()) as { publishedCount?: number; skippedNonAdmittedCount?: number; skippedUnreviewedCount?: number; error?: string };
    setMessage(
      res.ok
        ? `Đã xử lý ${json.publishedCount ?? 0} hồ sơ. Bỏ qua không trúng tuyển: ${json.skippedNonAdmittedCount ?? 0}, chưa xét: ${json.skippedUnreviewedCount ?? 0}.`
        : json.error ?? "Không thể xử lý hàng loạt."
    );
    if (res.ok) window.location.reload();
  }

  return (
    <div className="space-y-4">
      {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-semibold text-blue-900">{message}</div>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="secondary" onClick={() => bulkPublish(true)} disabled={selected.length === 0}>
          <Megaphone size={16} /> Công bố hàng loạt
        </Button>
        <Button variant="outline" onClick={() => bulkPublish(false)} disabled={selected.length === 0}>
          <RotateCcw size={16} /> Gỡ công bố hàng loạt
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => setSelected(event.target.checked ? rows.map((row) => row.id) : [])}
                />
              </th>
              {["Mã", "Họ tên", "Ngày sinh", "Trường THCS", "A", "B", "C", "Tổng", "Kết quả", "Hạng", "Đợt", "Công bố", "Thao tác"].map((heading) => (
                <th key={heading} className="p-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const draft = drafts[row.id] ?? {};
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id)
                        )
                      }
                    />
                  </td>
                  <td className="p-3 font-semibold text-school-800">{row.applicationCode}</td>
                  <td className="p-3 font-semibold">{row.fullName}</td>
                  <td className="p-3">{formatDate(row.dateOfBirth)}</td>
                  <td className="p-3">{row.secondarySchool}</td>
                  <td className="p-3">{row.scoreA}</td>
                  <td className="p-3">{row.scoreB}</td>
                  <td className="p-3">{row.scoreC}</td>
                  <td className="p-3 font-bold">{row.totalScore}</td>
                  <td className="p-3">
                    <Select
                      value={String(draft.admissionResult ?? row.admissionResult)}
                      onChange={(event) => patchDraft(row.id, { admissionResult: event.target.value })}
                    >
                      {ADMISSION_RESULT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {ADMISSION_RESULT_LABELS[status]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-3">
                    <Input
                      className="w-20"
                      inputMode="numeric"
                      value={draft.admissionRank ?? row.admissionRank ?? ""}
                      onChange={(event) => patchDraft(row.id, { admissionRank: event.target.value ? Number(event.target.value) : null })}
                    />
                  </td>
                  <td className="p-3">
                    <Select
                      value={String(draft.admissionBatch ?? row.admissionBatch ?? "")}
                      onChange={(event) => patchDraft(row.id, { admissionBatch: event.target.value })}
                    >
                      <option value="">Chọn đợt</option>
                      {ADMISSION_BATCH_OPTIONS.map((batch) => (
                        <option key={batch} value={batch}>
                          {batch}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="p-3">
                    <div className="space-y-1">
                      <Badge variant={row.admissionPublished ? "default" : resultVariant(row.admissionResult)}>
                        {row.admissionPublished ? "Đã công bố" : ADMISSION_RESULT_LABELS[row.admissionResult] ?? row.admissionResult}
                      </Badge>
                      {row.admissionPublishedAt && <p className="text-xs text-slate-500">{formatDate(row.admissionPublishedAt)}</p>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => saveResult(row)}>
                        <Save size={14} /> Lưu
                      </Button>
                      {row.admissionPublished ? (
                        <Button size="sm" variant="outline" onClick={() => publish(row, false)}>
                          Gỡ
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => publish(row, true)} disabled={(draft.admissionResult ?? row.admissionResult) !== "TRUNG_TUYEN"}>
                          Công bố
                        </Button>
                      )}
                      <Link href={`/admin/ho-so/${row.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 font-semibold text-school-700 hover:bg-school-50">
                        <Eye size={14} /> Xem
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td className="p-8 text-center text-slate-500" colSpan={14}>
                  Không có hồ sơ phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
