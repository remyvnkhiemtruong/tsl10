"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ADMISSION_BATCH_OPTIONS,
  ADMISSION_RESULT_LABELS,
  ADMISSION_RESULT_STATUSES,
  PHYSICAL_DOSSIER_LABELS,
  PHYSICAL_DOSSIER_STATUSES,
  PHYSICAL_DOSSIER_VALIDITY_LABELS,
  PHYSICAL_DOSSIER_VALIDITY_STATUSES,
} from "@/lib/constants";

export function PhysicalDossierForm({
  applicationId,
  initial,
}: {
  applicationId: string;
  initial: {
    physicalDossierStatus: string;
    physicalDossierValidity: string;
    physicalDossierPublicNote: string;
    physicalDossierInternalNote: string;
  };
}) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  async function save() {
    const res = await fetch(`/api/admin/applications/${applicationId}/physical-dossier`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(res.ok ? "Đã cập nhật hồ sơ trực tiếp." : ((await res.json()) as { error?: string }).error ?? "Không thể cập nhật.");
    if (res.ok) window.location.reload();
  }
  return (
    <div className="space-y-3">
      {message && <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">{message}</p>}
      <Select value={form.physicalDossierStatus} onChange={(event) => setForm({ ...form, physicalDossierStatus: event.target.value })}>
        {PHYSICAL_DOSSIER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PHYSICAL_DOSSIER_LABELS[status]}
          </option>
        ))}
      </Select>
      <Select value={form.physicalDossierValidity} onChange={(event) => setForm({ ...form, physicalDossierValidity: event.target.value })}>
        {PHYSICAL_DOSSIER_VALIDITY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {PHYSICAL_DOSSIER_VALIDITY_LABELS[status]}
          </option>
        ))}
      </Select>
      <Textarea
        value={form.physicalDossierPublicNote}
        onChange={(event) => setForm({ ...form, physicalDossierPublicNote: event.target.value })}
        placeholder="Ghi chú công khai cho thí sinh"
      />
      <Textarea
        value={form.physicalDossierInternalNote}
        onChange={(event) => setForm({ ...form, physicalDossierInternalNote: event.target.value })}
        placeholder="Ghi chú nội bộ"
      />
      <Button onClick={save}>Lưu hồ sơ trực tiếp</Button>
    </div>
  );
}

export function AdmissionResultForm({
  applicationId,
  initial,
}: {
  applicationId: string;
  initial: {
    admissionResult: string;
    admissionRank: number | null;
    admissionBatch: string;
    admissionPublicNote: string;
    admissionNote: string;
    admissionPublished: boolean;
  };
}) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  async function save() {
    const res = await fetch(`/api/admin/applications/${applicationId}/admission-result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, snapshotScore: true }),
    });
    setMessage(res.ok ? "Đã cập nhật kết quả tuyển sinh." : ((await res.json()) as { error?: string }).error ?? "Không thể cập nhật.");
    if (res.ok) window.location.reload();
  }
  async function publish(publishValue: boolean) {
    const res = await fetch(`/api/admin/applications/${applicationId}/publish-admission`, {
      method: publishValue ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshotScore: true }),
    });
    setMessage(res.ok ? (publishValue ? "Đã công bố." : "Đã gỡ công bố.") : ((await res.json()) as { error?: string }).error ?? "Không thể cập nhật.");
    if (res.ok) window.location.reload();
  }
  return (
    <div className="space-y-3">
      {message && <p className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-900">{message}</p>}
      <Select value={form.admissionResult} onChange={(event) => setForm({ ...form, admissionResult: event.target.value })}>
        {ADMISSION_RESULT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {ADMISSION_RESULT_LABELS[status]}
          </option>
        ))}
      </Select>
      <Input
        inputMode="numeric"
        value={form.admissionRank ?? ""}
        onChange={(event) => setForm({ ...form, admissionRank: event.target.value ? Number(event.target.value) : null })}
        placeholder="Thứ hạng"
      />
      <Select value={form.admissionBatch} onChange={(event) => setForm({ ...form, admissionBatch: event.target.value })}>
        <option value="">Chọn đợt xét tuyển</option>
        {ADMISSION_BATCH_OPTIONS.map((batch) => (
          <option key={batch} value={batch}>
            {batch}
          </option>
        ))}
      </Select>
      <Textarea
        value={form.admissionPublicNote}
        onChange={(event) => setForm({ ...form, admissionPublicNote: event.target.value })}
        placeholder="Ghi chú công khai"
      />
      <Textarea
        value={form.admissionNote}
        onChange={(event) => setForm({ ...form, admissionNote: event.target.value })}
        placeholder="Ghi chú nội bộ"
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={save}>Cập nhật kết quả</Button>
        {initial.admissionPublished ? (
          <Button variant="outline" onClick={() => publish(false)}>
            Gỡ công bố
          </Button>
        ) : (
          <Button onClick={() => publish(true)} disabled={form.admissionResult !== "TRUNG_TUYEN"}>
            Công bố kết quả
          </Button>
        )}
      </div>
      {form.admissionResult === "CHUA_XET" && <p className="text-sm font-semibold text-amber-700">Cần cập nhật kết quả tuyển sinh trước khi công bố.</p>}
    </div>
  );
}
