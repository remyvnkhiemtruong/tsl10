"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

type LookupResult = {
  applicationCode: string;
  fullName: string;
  dateOfBirth: string;
  secondarySchool: string;
  selectedOptionNumber: number;
  selectedSubjects: string;
  status: string;
  publicNote: string | null;
  submittedAt: string;
};

export default function LookupPage() {
  const [query, setQuery] = useState({ applicationCode: "", citizenId: "", dateOfBirth: "" });
  const [result, setResult] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup() {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams(query).toString();
      const res = await fetch(`/api/applications/lookup?${params}`);
      const json = (await res.json()) as { application?: LookupResult; error?: string };
      if (!res.ok || !json.application) {
        setResult(null);
        throw new Error(json.error ?? "Không tìm thấy hồ sơ");
      }
      setResult(json.application);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Không tìm thấy hồ sơ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-black">Tra cứu hồ sơ</h1>
        <Card className="mt-6 space-y-4">
          <input
            className="form-input"
            placeholder="Mã hồ sơ, ví dụ VK2026-000001"
            value={query.applicationCode}
            onChange={(event) => setQuery({ ...query, applicationCode: event.target.value.trim().toUpperCase() })}
          />
          <input
            className="form-input"
            placeholder="Số định danh/CCCD"
            value={query.citizenId}
            onChange={(event) => setQuery({ ...query, citizenId: event.target.value.replace(/\D/g, "") })}
          />
          <input
            type="date"
            className="form-input"
            value={query.dateOfBirth}
            onChange={(event) => setQuery({ ...query, dateOfBirth: event.target.value })}
          />
          <Button onClick={lookup} disabled={loading}>
            <Search size={16} /> {loading ? "Đang tra cứu..." : "Tra cứu"}
          </Button>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        </Card>
        {result && (
          <Card className="mt-6">
            <h2 className="text-xl font-bold">{result.fullName}</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>
                <b>Mã hồ sơ:</b> {result.applicationCode}
              </p>
              <p>
                <b>Ngày sinh:</b> {formatDate(result.dateOfBirth)}
              </p>
              <p>
                <b>Trường THCS:</b> {result.secondarySchool}
              </p>
              <p>
                <b>Phương án:</b> {result.selectedOptionNumber} - {result.selectedSubjects}
              </p>
              <p>
                <b>Trạng thái:</b> {STATUS_LABELS[result.status] ?? result.status}
              </p>
              <p>
                <b>Ngày nộp:</b> {formatDate(result.submittedAt)}
              </p>
              {result.publicNote && (
                <p>
                  <b>Ghi chú:</b> {result.publicNote}
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
