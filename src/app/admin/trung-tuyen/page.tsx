import { Prisma } from "@prisma/client";
import { AdminShell } from "@/components/AdminShell";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calculateAdmissionScoreDetails } from "@/lib/admission-score";
import {
  ADMISSION_BATCH_OPTIONS,
  ADMISSION_RESULT_LABELS,
  STATUS_LABELS,
  SUBJECT_OPTIONS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { AdmissionResultsTable, type AdmissionResultRow } from "./AdmissionResultsTable";

export const dynamic = "force-dynamic";

export default async function AdminAdmissionResultsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    admissionResult?: string;
    published?: string;
    admissionBatch?: string;
    selectedOptionNumber?: string;
    secondarySchool?: string;
    ward?: string;
  }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const option = Number(params.selectedOptionNumber ?? "");
  const where: Prisma.ApplicationWhereInput = {
    deletedAt: null,
    ...(params.status && STATUS_LABELS[params.status] ? { status: params.status as Prisma.EnumApplicationStatusFilter<"Application"> } : {}),
    ...(params.admissionResult && ADMISSION_RESULT_LABELS[params.admissionResult] ? { admissionResult: params.admissionResult } : {}),
    ...(params.published === "true" ? { admissionPublished: true } : params.published === "false" ? { admissionPublished: false } : {}),
    ...(params.admissionBatch && ADMISSION_BATCH_OPTIONS.includes(params.admissionBatch as (typeof ADMISSION_BATCH_OPTIONS)[number])
      ? { admissionBatch: params.admissionBatch }
      : {}),
    ...(Number.isInteger(option) && option >= 1 && option <= 6 ? { selectedOptionNumber: option } : {}),
    ...(params.secondarySchool ? { secondarySchool: { contains: params.secondarySchool, mode: "insensitive" } } : {}),
    ...(params.ward ? { ward: { contains: params.ward, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { applicationCode: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { citizenId: { contains: q } },
            { secondarySchool: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const applications = await prisma.application.findMany({
    where,
    include: { academicRecords: true },
    orderBy: [{ admissionScoreSnapshot: "desc" }, { fullName: "asc" }],
    take: 500,
  });

  const rows: AdmissionResultRow[] = applications
    .map((app) => {
      const score = calculateAdmissionScoreDetails(app.academicRecords, app.bonusScore);
      return {
        id: app.id,
        applicationCode: app.applicationCode,
        fullName: app.fullName,
        dateOfBirth: app.dateOfBirth.toISOString(),
        secondarySchool: app.secondarySchool,
        selectedOptionNumber: app.selectedOptionNumber,
        selectedSubjects: app.selectedSubjects,
        scoreA: score.academicAverageSum,
        scoreB: score.convertedScoreSum,
        scoreC: score.bonusScore,
        totalScore: score.totalScore,
        admissionResult: app.admissionResult,
        admissionRank: app.admissionRank,
        admissionBatch: app.admissionBatch,
        admissionPublished: app.admissionPublished,
        admissionPublishedAt: app.admissionPublishedAt?.toISOString() ?? null,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore || a.fullName.localeCompare(b.fullName, "vi"));

  return (
    <AdminShell>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Quản lý kết quả</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Danh sách xét/công bố trúng tuyển</h1>
      </div>
      <Alert variant="warning" className="mt-6">
        Hệ thống chỉ hỗ trợ công bố theo quyết định của Hội đồng tuyển sinh. Chỉ các hồ sơ có kết quả TRÚNG TUYỂN mới xuất hiện trên bảng xếp hạng công khai.
      </Alert>
      <Card className="mt-6">
        <form className="grid gap-3 md:grid-cols-4">
          <Input name="q" defaultValue={q} placeholder="Tên, mã hồ sơ, CCCD, trường THCS" />
          <Select name="status" defaultValue={params.status ?? ""}>
            <option value="">Tất cả trạng thái hồ sơ</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="admissionResult" defaultValue={params.admissionResult ?? ""}>
            <option value="">Tất cả kết quả</option>
            {Object.entries(ADMISSION_RESULT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="published" defaultValue={params.published ?? ""}>
            <option value="">Tất cả công bố</option>
            <option value="true">Đã công bố</option>
            <option value="false">Chưa công bố</option>
          </Select>
          <Select name="admissionBatch" defaultValue={params.admissionBatch ?? ""}>
            <option value="">Tất cả đợt</option>
            {ADMISSION_BATCH_OPTIONS.map((batch) => (
              <option key={batch} value={batch}>
                {batch}
              </option>
            ))}
          </Select>
          <Select name="selectedOptionNumber" defaultValue={params.selectedOptionNumber ?? ""}>
            <option value="">Tất cả phương án</option>
            {SUBJECT_OPTIONS.map((item) => (
              <option key={item.optionNumber} value={item.optionNumber}>
                Phương án {item.optionNumber}
              </option>
            ))}
          </Select>
          <Input name="secondarySchool" defaultValue={params.secondarySchool ?? ""} placeholder="Trường THCS" />
          <Input name="ward" defaultValue={params.ward ?? ""} placeholder="Xã/phường" />
          <button className="rounded-xl bg-school-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
            Lọc danh sách
          </button>
        </form>
      </Card>
      <Card className="mt-6 overflow-hidden p-0">
        <AdmissionResultsTable rows={rows} />
      </Card>
    </AdminShell>
  );
}
