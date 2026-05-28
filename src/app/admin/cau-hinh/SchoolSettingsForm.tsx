"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SchoolSettingsValue } from "@/lib/school-contact";

function dateInput(value: string) {
  return value ? new Date(value).toISOString().slice(0, 16) : "";
}

function fromDateInput(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function SchoolSettingsForm({ initial }: { initial: SchoolSettingsValue }) {
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setMessage("");
    setError("");
    const res = await fetch("/api/admin/school-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Không thể lưu cấu hình");
      return;
    }
    setMessage("Đã lưu cấu hình.");
  }

  return (
    <div className="space-y-5">
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="destructive">{error}</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        <Input value={form.contact.schoolName} onChange={(event) => setForm({ ...form, contact: { ...form.contact, schoolName: event.target.value } })} />
        <Input value={form.contact.email} onChange={(event) => setForm({ ...form, contact: { ...form.contact, email: event.target.value } })} />
        <Input value={form.contact.website} onChange={(event) => setForm({ ...form, contact: { ...form.contact, website: event.target.value } })} />
        <Input value={form.contact.phone} placeholder="Điện thoại trường" onChange={(event) => setForm({ ...form, contact: { ...form.contact, phone: event.target.value } })} />
        <Textarea className="md:col-span-2" value={form.contact.address} onChange={(event) => setForm({ ...form, contact: { ...form.contact, address: event.target.value } })} />
        <Textarea className="md:col-span-2" value={form.contact.note} onChange={(event) => setForm({ ...form, contact: { ...form.contact, note: event.target.value } })} />
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.publicLeadershipPhones}
          onChange={(event) => setForm({ ...form, publicLeadershipPhones: event.target.checked })}
        />
        Hiển thị số điện thoại ban giám hiệu công khai
      </label>
      <div className="space-y-3">
        {form.leadershipContacts.map((leader, index) => (
          <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-4">
            <Input value={leader.name} onChange={(event) => {
              const next = [...form.leadershipContacts];
              next[index] = { ...leader, name: event.target.value };
              setForm({ ...form, leadershipContacts: next });
            }} />
            <Input value={leader.title} onChange={(event) => {
              const next = [...form.leadershipContacts];
              next[index] = { ...leader, title: event.target.value };
              setForm({ ...form, leadershipContacts: next });
            }} />
            <Input value={leader.extraRole} placeholder="Vai trò thêm" onChange={(event) => {
              const next = [...form.leadershipContacts];
              next[index] = { ...leader, extraRole: event.target.value };
              setForm({ ...form, leadershipContacts: next });
            }} />
            <Input value={leader.publicContact} placeholder="Số liên hệ" onChange={(event) => {
              const next = [...form.leadershipContacts];
              next[index] = { ...leader, publicContact: event.target.value };
              setForm({ ...form, leadershipContacts: next });
            }} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          type="datetime-local"
          value={dateInput(form.registrationDeadline)}
          onChange={(event) => setForm({ ...form, registrationDeadline: fromDateInput(event.target.value) })}
        />
        <Input
          type="datetime-local"
          value={dateInput(form.admissionRound1PublishAt)}
          onChange={(event) => setForm({ ...form, admissionRound1PublishAt: fromDateInput(event.target.value) })}
        />
        <Input
          type="datetime-local"
          value={dateInput(form.admissionRound2PublishAt)}
          onChange={(event) => setForm({ ...form, admissionRound2PublishAt: fromDateInput(event.target.value) })}
        />
      </div>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.personalResultLookupEnabled}
          onChange={(event) => setForm({ ...form, personalResultLookupEnabled: event.target.checked })}
        />
        Bật tra cứu kết quả cá nhân
      </label>
      <Textarea
        value={form.registrationLockedNote}
        onChange={(event) => setForm({ ...form, registrationLockedNote: event.target.value })}
      />
      <Button onClick={save}>
        <Save size={16} /> Lưu cấu hình
      </Button>
    </div>
  );
}
