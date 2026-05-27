import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, SUBJECT_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

function statusVariant(status: string): "secondary" | "success" | "warning" | "destructive" {
  if (["HOP_LE", "DA_TIEP_NHAN", "DA_DUYET_XET_TUYEN"].includes(status)) return "success";
  if (status === "CAN_BO_SUNG") return "warning";
  if (status === "KHONG_HOP_LE") return "destructive";
  return "secondary";
}

export default async function AdminDashboardPage() {
  const [total, byStatus, byOption, recent] = await Promise.all([
    prisma.application.count(),
    prisma.application.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.application.groupBy({ by: ["selectedOptionNumber"], _count: { selectedOptionNumber: true } }),
    prisma.application.findMany({ orderBy: { submittedAt: "desc" }, take: 5 }),
  ]);

  return (
    <AdminShell>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Tổng quan</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Dashboard tuyển sinh</h1>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardDescription>Tổng hồ sơ</CardDescription>
          <p className="mt-2 text-4xl font-black text-slate-950">{total}</p>
        </Card>
        {Object.entries(STATUS_LABELS)
          .slice(0, 3)
          .map(([status, label]) => {
            const count = byStatus.find((item) => item.status === status)?._count.status ?? 0;
            return (
              <Card key={status}>
                <CardDescription>{label}</CardDescription>
                <p className="mt-2 text-4xl font-black text-slate-950">{count}</p>
              </Card>
            );
          })}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardTitle>Theo trạng thái</CardTitle>
          <ul className="mt-4 space-y-3 text-sm">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <li key={status} className="flex items-center justify-between gap-3">
                <Badge variant={statusVariant(status)}>{label}</Badge>
                <b>{byStatus.find((item) => item.status === status)?._count.status ?? 0}</b>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Theo phương án môn học</CardTitle>
          <ul className="mt-4 space-y-3 text-sm">
            {SUBJECT_OPTIONS.map((option) => (
              <li key={option.optionNumber} className="flex justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                <span>Phương án {option.optionNumber}</span>
                <b>{byOption.find((item) => item.selectedOptionNumber === option.optionNumber)?._count.selectedOptionNumber ?? 0}</b>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Hồ sơ mới</CardTitle>
          <ul className="mt-4 space-y-3 text-sm">
            {recent.map((app) => (
              <li key={app.id} className="rounded-xl border border-slate-100 p-3">
                <div className="font-semibold text-slate-950">{app.fullName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-500">
                  <span>{app.applicationCode}</span>
                  <Badge variant={statusVariant(app.status)}>{STATUS_LABELS[app.status] ?? app.status}</Badge>
                </div>
              </li>
            ))}
            {recent.length === 0 && <li className="text-slate-500">Chưa có hồ sơ.</li>}
          </ul>
        </Card>
      </div>
    </AdminShell>
  );
}
