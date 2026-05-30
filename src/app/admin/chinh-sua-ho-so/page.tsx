import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { isPrismaTableMissingError } from "@/lib/school-settings";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NHAP: "Nháp",
  CHO_DUYET: "Chờ duyệt",
  CAN_BO_SUNG: "Cần bổ sung",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Bị từ chối",
  DA_HUY: "Đã hủy",
};

function statusVariant(status: string): "secondary" | "success" | "warning" | "destructive" {
  if (status === "DA_DUYET") return "success";
  if (status === "CHO_DUYET" || status === "CAN_BO_SUNG") return "warning";
  if (status === "TU_CHOI") return "destructive";
  return "secondary";
}

async function getEditRequests() {
  try {
    return await prisma.applicationEditRequest.findMany({
      where: { status: { in: ["CHO_DUYET", "CAN_BO_SUNG", "NHAP"] } },
      orderBy: [{ submittedAt: "asc" }],
      include: {
        application: {
          select: { applicationCode: true, fullName: true, dateOfBirth: true, secondarySchool: true },
        },
      },
      take: 200,
    });
  } catch (error) {
    if (isPrismaTableMissingError(error)) return [];
    throw error;
  }
}

export default async function AdminEditRequestsPage() {
  const requests = await getEditRequests();
  const pending = requests.filter((r) => r.status === "CHO_DUYET");
  const supplement = requests.filter((r) => r.status === "CAN_BO_SUNG");
  const draft = requests.filter((r) => r.status === "NHAP");

  return (
    <AdminShell>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Yêu cầu chỉnh sửa</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Duyệt chỉnh sửa hồ sơ</h1>
        <p className="mt-2 text-sm text-slate-500">
          Các yêu cầu do học sinh/phụ huynh gửi qua cổng tra cứu hồ sơ. Duyệt để cập nhật hồ sơ chính.
        </p>
      </div>

      {requests.length === 0 && (
        <Card className="mt-6">
          <p className="text-center text-slate-500">Không có yêu cầu chỉnh sửa đang chờ xử lý.</p>
        </Card>
      )}

      {pending.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-slate-900">Chờ duyệt ({pending.length})</h2>
          <div className="mt-3 grid gap-3">
            {pending.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        </div>
      )}

      {supplement.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-slate-900">Cần bổ sung ({supplement.length})</h2>
          <div className="mt-3 grid gap-3">
            {supplement.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        </div>
      )}

      {draft.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-slate-500 text-sm">Nháp chưa gửi ({draft.length})</h2>
          <div className="mt-3 grid gap-3">
            {draft.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function RequestCard({
  req,
}: {
  req: {
    id: string;
    requestCode: string;
    status: string;
    studentNote: string | null;
    submittedAt: Date | null;
    application: {
      applicationCode: string;
      fullName: string;
      dateOfBirth: Date;
      secondarySchool: string;
    };
  };
}) {
  return (
    <Link
      href={`/admin/chinh-sua-ho-so/${req.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-school-300 hover:bg-school-50 transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-950">{req.application.fullName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {req.application.applicationCode} · {req.application.secondarySchool} ·{" "}
            {formatDate(req.application.dateOfBirth)}
          </p>
        </div>
        <Badge variant={statusVariant(req.status)}>{STATUS_LABELS[req.status] ?? req.status}</Badge>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <span className="font-mono">{req.requestCode}</span>
        {req.submittedAt && <span>Gửi lúc {new Date(req.submittedAt).toLocaleString("vi-VN")}</span>}
        {req.studentNote && <span className="italic">{req.studentNote.slice(0, 80)}...</span>}
      </div>
    </Link>
  );
}
