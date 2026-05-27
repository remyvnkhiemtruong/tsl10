import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS, SUBJECT_OPTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [total, byStatus, byOption, recent] = await Promise.all([
    prisma.application.count(),
    prisma.application.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.application.groupBy({ by: ["selectedOptionNumber"], _count: { selectedOptionNumber: true } }),
    prisma.application.findMany({ orderBy: { submittedAt: "desc" }, take: 5 })
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl font-black">Dashboard tuyển sinh</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">Tổng hồ sơ</p>
          <p className="mt-2 text-3xl font-black">{total}</p>
        </Card>
        {Object.entries(STATUS_LABELS)
          .slice(0, 3)
          .map(([status, label]) => {
            const count = byStatus.find((item) => item.status === status)?._count.status ?? 0;
            return (
              <Card key={status}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black">{count}</p>
              </Card>
            );
          })}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-bold">Theo trạng thái</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <li key={status} className="flex justify-between">
                <span>{label}</span>
                <b>{byStatus.find((item) => item.status === status)?._count.status ?? 0}</b>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-bold">Theo phương án môn học</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {SUBJECT_OPTIONS.map((option) => (
              <li key={option.optionNumber} className="flex justify-between">
                <span>Phương án {option.optionNumber}</span>
                <b>{byOption.find((item) => item.selectedOptionNumber === option.optionNumber)?._count.selectedOptionNumber ?? 0}</b>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-bold">Hồ sơ mới</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {recent.map((app) => (
              <li key={app.id} className="border-b border-slate-100 pb-2 last:border-0">
                <div className="font-semibold">{app.fullName}</div>
                <div className="text-slate-500">
                  {app.applicationCode} · {STATUS_LABELS[app.status] ?? app.status}
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
