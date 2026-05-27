"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function statusVariant(status: string): "secondary" | "success" | "warning" | "destructive" {
  if (["HOP_LE", "DA_TIEP_NHAN", "DA_DUYET_XET_TUYEN"].includes(status)) return "success";
  if (status === "CAN_BO_SUNG") return "warning";
  if (status === "KHONG_HOP_LE") return "destructive";
  return "secondary";
}

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
    <main className="min-h-screen">
      <PublicHeader />
      <section className="page-container py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Tra cứu hồ sơ</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Kiểm tra trạng thái xử lý</h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Nhập đúng ba thông tin đã dùng khi đăng ký để xem tình trạng tiếp nhận hồ sơ.
          </p>

          <Card className="mt-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-3 lg:col-span-1">
                <Label htmlFor="applicationCode">Mã hồ sơ</Label>
                <Input
                  id="applicationCode"
                  placeholder="VK2026-00001"
                  value={query.applicationCode}
                  onChange={(event) => setQuery({ ...query, applicationCode: event.target.value.trim().toUpperCase() })}
                />
              </div>
              <div>
                <Label htmlFor="citizenId">Số định danh/CCCD</Label>
                <Input
                  id="citizenId"
                  inputMode="numeric"
                  placeholder="Nhập 9-12 chữ số"
                  value={query.citizenId}
                  onChange={(event) => setQuery({ ...query, citizenId: event.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={query.dateOfBirth}
                  onChange={(event) => setQuery({ ...query, dateOfBirth: event.target.value })}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Mã hồ sơ được cấp sau khi nộp thành công.</p>
              <Button onClick={lookup} disabled={loading} className="w-full sm:w-auto">
                <Search size={16} /> {loading ? "Đang tra cứu..." : "Tra cứu"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-5">
                {error}
              </Alert>
            )}
          </Card>

          {result && (
            <Card className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{result.fullName}</CardTitle>
                  <CardDescription>Mã hồ sơ: {result.applicationCode}</CardDescription>
                </div>
                <Badge variant={statusVariant(result.status)}>{STATUS_LABELS[result.status] ?? result.status}</Badge>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                <Info label="Ngày sinh" value={formatDate(result.dateOfBirth)} />
                <Info label="Trường THCS" value={result.secondarySchool} />
                <Info label="Phương án" value={`${result.selectedOptionNumber} - ${result.selectedSubjects}`} />
                <Info label="Ngày nộp" value={formatDate(result.submittedAt)} />
                {result.publicNote && <Info label="Ghi chú" value={result.publicNote} className="sm:col-span-2" />}
              </div>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}
