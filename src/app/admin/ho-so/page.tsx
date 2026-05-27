import Link from "next/link";
import { Download, Search } from "lucide-react";
import { Prisma } from "@prisma/client";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = params.status && STATUS_LABELS[params.status] ? params.status : "";
  const where: Prisma.ApplicationWhereInput = {
    ...(status ? { status: status as Prisma.EnumApplicationStatusFilter<"Application"> } : {}),
    ...(q
      ? {
          OR: [
            { applicationCode: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { citizenId: { contains: q } },
            { secondarySchool: { contains: q, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const applications = await prisma.application.findMany({
    where,
    orderBy: { submittedAt: "desc" },
    take: 200
  });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Danh sách hồ sơ</h1>
        <Link className="inline-flex items-center gap-2 rounded-lg bg-school-700 px-4 py-2 text-sm font-semibold text-white" href="/api/admin/export/excel">
          <Download size={16} /> Xuất Excel
        </Link>
      </div>

      <Card className="mt-6">
        <form className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <input name="q" defaultValue={q} className="form-input" placeholder="Tìm theo mã hồ sơ, họ tên, số định danh, trường THCS" />
          <select name="status" defaultValue={status} className="form-select">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
            <Search size={16} /> Lọc
          </button>
        </form>
      </Card>

      <Card className="mt-6 overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              {["Mã", "Họ tên", "Ngày sinh", "Số định danh", "Trường THCS", "PA", "Trạng thái", "Ngày nộp", ""].map((heading) => (
                <th key={heading} className="p-3">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{app.applicationCode}</td>
                <td className="p-3">{app.fullName}</td>
                <td className="p-3">{formatDate(app.dateOfBirth)}</td>
                <td className="p-3">{app.citizenId}</td>
                <td className="p-3">{app.secondarySchool}</td>
                <td className="p-3">{app.selectedOptionNumber}</td>
                <td className="p-3">{STATUS_LABELS[app.status]}</td>
                <td className="p-3">{formatDate(app.submittedAt)}</td>
                <td className="p-3">
                  <Link className="font-semibold text-school-700" href={`/admin/ho-so/${app.id}`}>
                    Xem
                  </Link>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={9}>
                  Không có hồ sơ phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
