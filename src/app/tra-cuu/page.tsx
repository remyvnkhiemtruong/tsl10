"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { SchoolContactCard } from "@/components/SchoolContactCard";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMISSION_RESULT_LABELS,
  PHYSICAL_DOSSIER_LABELS,
  PHYSICAL_DOSSIER_VALIDITY_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { DEFAULT_SCHOOL_SETTINGS } from "@/lib/school-contact";
import { formatDate } from "@/lib/utils";

type LookupResult = {
  applicationCode: string;
  fullName: string;
  dateOfBirth: string;
  secondarySchool: string;
  selectedOptionNumber: number;
  selectedSubjects: string;
  status: string;
  registrationFormNumber: string | null;
  registrationFormPdfAvailable: boolean;
  publicNote: string | null;
  submittedAt: string;
  physicalDossierStatus: string;
  physicalDossierValidity: string;
  physicalDossierPublicNote: string | null;
  admissionResult: string;
  admissionPublished: boolean;
  admissionPublicNote: string | null;
  admissionBatch: string | null;
  admissionScoreSnapshot: number | null;
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
  const [pdfLoading, setPdfLoading] = useState(false);
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
        throw new Error(json.error ?? "Không tìm thấy hồ sơ phù hợp. Vui lòng kiểm tra lại mã hồ sơ, số định danh/CCCD và ngày sinh.");
      }
      setResult(json.application);
    } catch (lookupError) {
      setError(
        lookupError instanceof Error
          ? lookupError.message
          : "Không tìm thấy hồ sơ phù hợp. Vui lòng kiểm tra lại mã hồ sơ, số định danh/CCCD và ngày sinh."
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf() {
    setPdfLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications/registration-form-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Không thể tải phiếu đăng ký PDF. Vui lòng kiểm tra lại thông tin tra cứu.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `phieu-dang-ky-du-tuyen-lop-10-vvk-2026-${result?.applicationCode ?? "ho-so"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Không thể tải phiếu đăng ký PDF.");
    } finally {
      setPdfLoading(false);
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
            Nhập đúng ba thông tin đã dùng khi đăng ký để xem tình trạng hồ sơ trực tuyến, hồ sơ trực tiếp/bản giấy và kết quả tuyển sinh.
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
              <p className="text-sm text-slate-500">Mã hồ sơ được cấp sau khi nộp hồ sơ trực tuyến thành công.</p>
              <Button onClick={lookup} disabled={loading} className="w-full sm:w-auto">
                <Search size={16} /> {loading ? "Đang tra cứu..." : "Tra cứu hồ sơ"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-5" role="alert">
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
              <Alert variant="success" className="mt-5">
                Hồ sơ trực tuyến đã được ghi nhận.
              </Alert>
              {result.registrationFormNumber && (
                <div className="mt-5 rounded-2xl border border-school-100 bg-school-50 p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-school-700">Số phiếu</p>
                  <p className="mt-1 text-2xl font-black text-school-900">{result.registrationFormNumber}</p>
                </div>
              )}
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <h2 className="font-bold text-slate-950">Tình trạng hồ sơ trực tiếp/bản giấy</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Info label="Trạng thái" value={PHYSICAL_DOSSIER_LABELS[result.physicalDossierStatus] ?? result.physicalDossierStatus} />
                  <Info label="Kiểm tra hồ sơ" value={PHYSICAL_DOSSIER_VALIDITY_LABELS[result.physicalDossierValidity] ?? result.physicalDossierValidity} />
                  {result.physicalDossierPublicNote && <Info label="Ghi chú của nhà trường" value={result.physicalDossierPublicNote} className="sm:col-span-2" />}
                </div>
                {result.physicalDossierStatus === "CHUA_NOP_TRUC_TIEP" && (
                  <Alert variant="warning" className="mt-4">
                    Nhà trường chưa ghi nhận hồ sơ trực tiếp/bản giấy của thí sinh. Phụ huynh/thí sinh vui lòng tải phiếu đăng ký dự tuyển PDF, in ra, ký xác nhận của cha/mẹ hoặc người giám hộ và nộp kèm hồ sơ theo thông báo của nhà trường.
                  </Alert>
                )}
                {result.physicalDossierStatus === "DA_NOP_TRUC_TIEP" && result.physicalDossierValidity === "HOP_LE" && (
                  <Alert variant="success" className="mt-4">
                    Hồ sơ trực tiếp/bản giấy đã được nhà trường tiếp nhận và ghi nhận hợp lệ.
                  </Alert>
                )}
                <p className="mt-3 text-xs font-semibold text-slate-600">
                  Trạng thái hồ sơ hợp lệ không phải là kết quả trúng tuyển. Kết quả tuyển sinh chỉ có giá trị khi được nhà trường công bố chính thức.
                </p>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-200 p-4 text-sm">
                <h2 className="font-bold text-slate-950">Kết quả tuyển sinh</h2>
                {result.admissionResult === "CHUA_XET" ? (
                  <p className="mt-2 text-slate-600">Hồ sơ đã được ghi nhận. Kết quả tuyển sinh chưa được công bố trên hệ thống.</p>
                ) : result.admissionResult === "TRUNG_TUYEN" ? (
                  <Alert variant="success" className="mt-3">
                    Chúc mừng thí sinh đã trúng tuyển. Phụ huynh/thí sinh vui lòng theo dõi thông báo của Trường THPT Võ Văn Kiệt để thực hiện các bước xác nhận nhập học theo thời gian quy định.
                  </Alert>
                ) : (
                  <Alert variant="warning" className="mt-3">
                    Hồ sơ chưa có tên trong danh sách trúng tuyển đã công bố. Phụ huynh/thí sinh vui lòng theo dõi thông báo chính thức của nhà trường.
                  </Alert>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Info label="Kết quả" value={ADMISSION_RESULT_LABELS[result.admissionResult] ?? result.admissionResult} />
                  <Info label="Đợt xét tuyển" value={result.admissionBatch ?? ""} />
                  {result.admissionScoreSnapshot != null && <Info label="Điểm xét tuyển" value={String(result.admissionScoreSnapshot)} />}
                  {result.admissionPublicNote && <Info label="Ghi chú công khai" value={result.admissionPublicNote} className="sm:col-span-2" />}
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  {result.registrationFormPdfAvailable
                    ? "Thí sinh/phụ huynh có thể tải phiếu đăng ký dự tuyển PDF đã điền sẵn thông tin, in ra, ký xác nhận và nộp kèm hồ sơ trực tiếp/bản giấy theo thông báo của Trường THPT Võ Văn Kiệt."
                    : "Phiếu đăng ký dự tuyển PDF chỉ tải được sau khi nhà trường duyệt hồ sơ trực tuyến và cấp số phiếu."}
                </p>
                <Button onClick={downloadPdf} disabled={pdfLoading || !result.registrationFormPdfAvailable}>
                  {pdfLoading ? "Đang tải phiếu..." : "Tải phiếu đăng ký PDF"}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="page-container">
          <SchoolContactCard
            contact={DEFAULT_SCHOOL_SETTINGS.contact}
            leadershipContacts={DEFAULT_SCHOOL_SETTINGS.leadershipContacts}
            publicLeadershipPhones={DEFAULT_SCHOOL_SETTINGS.publicLeadershipPhones}
            compact
          />
        </div>
      </footer>
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
