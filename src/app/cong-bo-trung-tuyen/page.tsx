import Link from "next/link";
import { Prisma } from "@prisma/client";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ADMISSION_BATCH_OPTIONS, SUBJECT_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicAdmissionRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; admissionBatch?: string; selectedOptionNumber?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const admissionBatch = ADMISSION_BATCH_OPTIONS.includes(params.admissionBatch as (typeof ADMISSION_BATCH_OPTIONS)[number])
    ? params.admissionBatch
    : "";
  const option = Number(params.selectedOptionNumber ?? "");

  const where: Prisma.ApplicationWhereInput = {
    deletedAt: null,
    admissionPublished: true,
    admissionResult: "TRUNG_TUYEN",
    ...(admissionBatch ? { admissionBatch } : {}),
    ...(Number.isInteger(option) && option >= 1 && option <= 6 ? { selectedOptionNumber: option } : {}),
    ...(q
      ? {
          OR: [
            { applicationCode: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { secondarySchool: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: [
      { admissionBatch: "asc" },
      { admissionRank: "asc" },
      { admissionScoreSnapshot: "desc" },
      { fullName: "asc" },
    ],
    take: 500,
    select: {
      admissionRank: true,
      applicationCode: true,
      fullName: true,
      dateOfBirth: true,
      secondarySchool: true,
      selectedOptionNumber: true,
      selectedSubjects: true,
      admissionBatch: true,
      admissionScoreSnapshot: true,
      admissionPublicNote: true,
    },
  });

  return (
    <main className="min-h-screen">
      <PublicHeader />
      <section className="page-container py-10 sm:py-14">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Công bố trúng tuyển</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
            Bảng xếp hạng trúng tuyển lớp 10 THPT Võ Văn Kiệt năm học 2026 - 2027
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Danh sách chỉ bao gồm thí sinh đã được Hội đồng tuyển sinh xác nhận trúng tuyển và đã được nhà trường công bố trên hệ thống.
          </p>
          <Link
            href="/api/public/admission-ranking/export"
            className="mt-5 inline-flex h-10 items-center rounded-xl bg-school-700 px-4 text-sm font-semibold text-white hover:bg-school-900"
          >
            Tải danh sách công khai
          </Link>
        </div>

        <Card className="mt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_240px_auto]">
            <Input name="q" defaultValue={q} placeholder="Tìm theo mã hồ sơ, họ tên, trường THCS" />
            <Select name="admissionBatch" defaultValue={admissionBatch}>
              <option value="">Tất cả đợt</option>
              {ADMISSION_BATCH_OPTIONS.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </Select>
            <Select name="selectedOptionNumber" defaultValue={Number.isInteger(option) ? String(option) : ""}>
              <option value="">Tất cả phương án</option>
              {SUBJECT_OPTIONS.map((item) => (
                <option key={item.optionNumber} value={item.optionNumber}>
                  Phương án {item.optionNumber}
                </option>
              ))}
            </Select>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
              Lọc
            </button>
          </form>
        </Card>

        <Card className="mt-6 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  {["STT", "Thứ hạng", "Mã hồ sơ", "Họ và tên", "Ngày sinh", "Trường THCS", "Phương án", "Đợt", "Điểm", "Ghi chú"].map(
                    (heading) => (
                      <th key={heading} className="p-4 font-semibold">
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {applications.map((app, index) => (
                  <tr key={app.applicationCode} className="border-t border-slate-100">
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4 font-semibold">{app.admissionRank ?? "-"}</td>
                    <td className="p-4 font-semibold text-school-800">{app.applicationCode}</td>
                    <td className="p-4 font-semibold text-slate-950">{app.fullName}</td>
                    <td className="p-4">{formatDate(app.dateOfBirth)}</td>
                    <td className="p-4">{app.secondarySchool}</td>
                    <td className="p-4">PA {app.selectedOptionNumber}</td>
                    <td className="p-4">{app.admissionBatch ?? "-"}</td>
                    <td className="p-4">{app.admissionScoreSnapshot ?? "-"}</td>
                    <td className="p-4">{app.admissionPublicNote ?? ""}</td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-slate-500" colSpan={10}>
                      Hiện chưa có danh sách trúng tuyển được công bố.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Bảo vệ dữ liệu thí sinh</CardTitle>
              <CardDescription className="mt-1">
                Danh sách trúng tuyển được công bố theo quyết định của Hội đồng tuyển sinh Trường THPT Võ Văn Kiệt. Các thông tin cá nhân nhạy cảm được ẩn.
              </CardDescription>
            </div>
            <Badge variant="success">Chỉ hiển thị trúng tuyển</Badge>
          </div>
        </Card>
      </section>
      <PublicFooter />
    </main>
  );
}
