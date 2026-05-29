import Link from "next/link";
import { Download, Eye, Search } from "lucide-react";
import { Prisma } from "@prisma/client";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusVariant(status: string): "secondary" | "success" | "warning" | "destructive" {
  if (["HOP_LE", "DA_TIEP_NHAN", "DA_DUYET_XET_TUYEN"].includes(status)) return "success";
  if (status === "CAN_BO_SUNG") return "warning";
  if (status === "KHONG_HOP_LE") return "destructive";
  return "secondary";
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status && STATUS_LABELS[params.status] ? params.status : "";
  const where: Prisma.ApplicationWhereInput = {
    deletedAt: null,
    ...(status ? { status: status as Prisma.EnumApplicationStatusFilter<"Application"> } : {}),
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
    orderBy: { submittedAt: "desc" },
    take: 200,
  });

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Quản lý hồ sơ</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Danh sách hồ sơ</h1>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-school-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-school-900"
          href="/api/admin/export/excel"
        >
          <Download size={16} /> Xuất Excel
        </Link>
      </div>

      <Card className="mt-6">
        <form className="grid gap-3 md:grid-cols-[1fr_240px_auto] md:items-end">
          <label className="block">
            <span className="form-label">Từ khóa</span>
            <Input name="q" defaultValue={q} placeholder="Mã hồ sơ, họ tên, số định danh, trường THCS" />
          </label>
          <label className="block">
            <span className="form-label">Trạng thái</span>
            <Select name="status" defaultValue={status}>
              <option value="">Tất cả trạng thái</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit" variant="secondary">
            <Search size={16} /> Lọc
          </Button>
        </form>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                {["Mã", "Họ tên", "Ngày sinh", "Số định danh", "Trường THCS", "PA", "Trạng thái", "Ngày nộp", ""].map((heading) => (
                  <th key={heading} className="p-4 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-t border-slate-100">
                  <td className="p-4 font-semibold text-school-800">{app.applicationCode}</td>
                  <td className="p-4 font-semibold text-slate-950">{app.fullName}</td>
                  <td className="p-4">{formatDate(app.dateOfBirth)}</td>
                  <td className="p-4">{app.citizenId}</td>
                  <td className="p-4">{app.secondarySchool}</td>
                  <td className="p-4">{app.selectedOptionNumber}</td>
                  <td className="p-4">
                    <Badge variant={statusVariant(app.status)}>{STATUS_LABELS[app.status]}</Badge>
                  </td>
                  <td className="p-4">{formatDate(app.submittedAt)}</td>
                  <td className="p-4">
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-school-700 transition hover:bg-school-50"
                      href={`/admin/ho-so/${app.id}`}
                    >
                      <Eye size={15} /> Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-slate-500" colSpan={9}>
                    Không có hồ sơ phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 p-4 md:hidden">
          {applications.map((app) => (
            <article key={app.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-school-800">{app.applicationCode}</p>
                  <h2 className="mt-1 text-base font-black text-slate-950">{app.fullName}</h2>
                </div>
                <Badge variant={statusVariant(app.status)}>{STATUS_LABELS[app.status]}</Badge>
              </div>
              <div className="mt-4 grid gap-3 text-slate-700">
                <AdminApplicationInfo label="Ngày sinh" value={formatDate(app.dateOfBirth)} />
                <AdminApplicationInfo label="Trường THCS" value={app.secondarySchool} />
                <AdminApplicationInfo label="Số định danh/CCCD" value={app.citizenId} />
                <AdminApplicationInfo label="Phương án" value={`Phương án ${app.selectedOptionNumber}`} />
                <AdminApplicationInfo label="Ngày nộp" value={formatDate(app.submittedAt)} />
              </div>
              <Link
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-school-700 px-4 text-sm font-semibold text-white transition hover:bg-school-900"
                href={`/admin/ho-so/${app.id}`}
              >
                <Eye size={16} /> Xem chi tiết
              </Link>
            </article>
          ))}
          {applications.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-4 text-center text-sm text-slate-600">
              Không tìm thấy hồ sơ phù hợp. Vui lòng điều chỉnh bộ lọc và thử lại.
            </p>
          )}
        </div>
      </Card>
    </AdminShell>
  );
}

function AdminApplicationInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value || "-"}</p>
    </div>
  );
}
