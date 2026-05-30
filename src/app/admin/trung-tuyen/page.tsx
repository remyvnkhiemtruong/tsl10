import { Prisma } from "@prisma/client";
import { AdminShell } from "@/components/AdminShell";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calculateAdmissionScoreFromConfig } from "@/lib/admission-score";
import {
  ADMISSION_BATCH_OPTIONS,
  ADMISSION_RESULT_LABELS,
  STATUS_LABELS,
  SUBJECT_OPTIONS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getActiveScoreFormula } from "@/lib/score-formula";
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
    include: { academicRecords: true, priorities: true, awards: true },
    orderBy: [{ admissionScoreSnapshot: "desc" }, { fullName: "asc" }],
    take: 500,
  });

  const formulaCache = new Map<string, Awaited<ReturnType<typeof getActiveScoreFormula>>>();
  const rows: AdmissionResultRow[] = (await Promise.all(
    applications.map(async (app) => {
      const cacheKey = app.admissionSeasonId ?? "fallback";
      const activeFormula = formulaCache.get(cacheKey) ?? (await getActiveScoreFormula(app.admissionSeasonId));
      formulaCache.set(cacheKey, activeFormula);
      const score = calculateAdmissionScoreFromConfig(
        app.academicRecords,
        app.priorities.map((priority) => priority.type),
        app.awards.map((award) => ({ prize: award.prize })),
        activeFormula.config,
        activeFormula.id
      );
      return {
        id: app.id,
        applicationCode: app.applicationCode,
        fullName: app.fullName,
        dateOfBirth: app.dateOfBirth.toISOString(),
        secondarySchool: app.secondarySchool,
        selectedOptionNumber: app.selectedOptionNumber,
        selectedSubjects: app.selectedSubjects,
        scoreA: score.subjectScoreSum,
        scoreB: score.convertedScoreSum,
        scoreC: score.priorityScore + score.awardBonusScore,
        totalScore: score.totalScore,
        admissionResult: app.admissionResult,
        admissionRank: app.admissionRank,
        admissionBatch: app.admissionBatch,
        admissionPublished: app.admissionPublished,
        admissionPublishedAt: app.admissionPublishedAt?.toISOString() ?? null,
      };
    })))
    .sort((a, b) => b.totalScore - a.totalScore || a.fullName.localeCompare(b.fullName, "vi"));

  return (
    <AdminShell>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Quản lý kết quả</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Danh sách xét/công bố trúng tuyển</h1>
      </div>
      <Alert variant="warning" className="mt-6">
        Hệ thống chỉ hỗ trợ công bố theo quyết định của Hội đồng tuyển sinh. Chỉ hồ sơ có kết quả Trúng tuyển mới được công bố công khai.
      </Alert>
      <Card className="mt-6">
        <form className="grid gap-3 md:grid-cols-4 md:items-end">
          <label className="block">
            <span className="form-label">Từ khóa</span>
            <Input name="q" defaultValue={q} placeholder="Tên, mã hồ sơ, số định danh/CCCD, trường THCS" />
          </label>
          <label className="block">
            <span className="form-label">Trạng thái hồ sơ</span>
            <Select name="status" defaultValue={params.status ?? ""}>
              <option value="">Tất cả trạng thái hồ sơ</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="form-label">Kết quả tuyển sinh</span>
            <Select name="admissionResult" defaultValue={params.admissionResult ?? ""}>
              <option value="">Tất cả kết quả</option>
              {Object.entries(ADMISSION_RESULT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="form-label">Công bố</span>
            <Select name="published" defaultValue={params.published ?? ""}>
              <option value="">Tất cả công bố</option>
              <option value="true">Đã công bố</option>
              <option value="false">Chưa công bố</option>
            </Select>
          </label>
          <label className="block">
            <span className="form-label">Đợt xét tuyển</span>
            <Select name="admissionBatch" defaultValue={params.admissionBatch ?? ""}>
              <option value="">Tất cả đợt</option>
              {ADMISSION_BATCH_OPTIONS.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="form-label">Phương án</span>
            <Select name="selectedOptionNumber" defaultValue={params.selectedOptionNumber ?? ""}>
              <option value="">Tất cả phương án</option>
              {SUBJECT_OPTIONS.map((item) => (
                <option key={item.optionNumber} value={item.optionNumber}>
                  Phương án {item.optionNumber}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="form-label">Trường THCS</span>
            <Input name="secondarySchool" defaultValue={params.secondarySchool ?? ""} placeholder="Tên trường THCS" />
          </label>
          <label className="block">
            <span className="form-label">Xã/phường</span>
            <Input name="ward" defaultValue={params.ward ?? ""} placeholder="Xã/phường thường trú" />
          </label>
          <button className="min-h-11 rounded-xl bg-school-700 px-4 py-2 text-sm font-semibold text-white" type="submit">
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
