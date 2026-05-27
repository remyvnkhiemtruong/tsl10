import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Eye } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  ACADEMIC_LEVEL_LABELS,
  FILE_STATUS_LABELS,
  FILE_TYPE_LABELS,
  GENDER_LABELS,
  PRIORITY_LABELS,
  PRIZE_LABELS,
  STATUS_LABELS
} from "@/lib/constants";
import { formatDate, formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      academicRecords: { orderBy: { grade: "asc" } },
      priorities: true,
      awards: true,
      files: { orderBy: { uploadedAt: "desc" }, include: { reviewedBy: true } },
      logs: { orderBy: { createdAt: "desc" }, take: 40, include: { user: true } }
    }
  });
  if (!app) notFound();

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Hồ sơ {app.applicationCode}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {app.fullName} · {STATUS_LABELS[app.status] ?? app.status}
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
          href={`/api/admin/applications/${app.id}/pdf`}
        >
          <Download size={16} /> Xuất PDF
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <h2 className="text-xl font-bold">Thông tin học sinh</h2>
          <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
            <Info label="Họ tên" value={app.fullName} />
            <Info label="Ngày sinh" value={formatDate(app.dateOfBirth)} />
            <Info label="Giới tính" value={GENDER_LABELS[app.gender] ?? app.gender} />
            <Info label="Dân tộc" value={app.ethnicity} />
            <Info label="Nơi sinh" value={app.birthPlace} />
            <Info label="Số định danh" value={app.citizenId} />
            <Info label="Ngày cấp" value={formatDate(app.issueDate)} />
            <Info label="Nơi cấp" value={app.issuePlace ?? ""} />
            <Info label="Trường THCS" value={app.secondarySchool} />
            <Info label="Phương án" value={`${app.selectedOptionNumber} - ${app.selectedSubjects}`} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Cập nhật trạng thái</h2>
          <form className="mt-4 space-y-3" action={`/api/admin/applications/${app.id}`} method="post">
            <select name="status" defaultValue={app.status} className="form-select">
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <textarea name="publicNote" className="form-textarea" defaultValue={app.publicNote ?? ""} placeholder="Ghi chú gửi học sinh" />
            <textarea name="internalNote" className="form-textarea" defaultValue={app.internalNote ?? ""} placeholder="Ghi chú nội bộ" />
            <button className="rounded-lg bg-school-700 px-4 py-2 text-sm font-semibold text-white">Lưu cập nhật</button>
          </form>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold">Thông tin liên hệ</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <Info label="Địa chỉ thường trú" value={app.permanentAddress} />
            <Info label="Ấp/khóm" value={app.hamlet ?? ""} />
            <Info label="Xã/phường" value={app.ward ?? ""} />
            <Info label="Tỉnh/thành phố" value={app.province ?? ""} />
            <Info label="SĐT học sinh" value={app.studentPhone ?? ""} />
            <Info label="Email" value={app.email ?? ""} />
            <Info label="Phụ huynh/người giám hộ" value={app.guardianName} />
            <Info label="Điện thoại liên hệ" value={app.guardianPhone} />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold">Ưu tiên và khuyến khích</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <b>Đối tượng:</b>{" "}
              {app.priorities.length > 0
                ? app.priorities.map((priority) => PRIORITY_LABELS[priority.type] ?? priority.type).join("; ")
                : "Không"}
            </div>
            <div>
              <b>Giải thưởng:</b>{" "}
              {app.awards.length > 0
                ? app.awards
                    .map((award) => `${award.competitionName} - ${PRIZE_LABELS[award.prize] ?? award.prize} (${award.bonusScore} điểm)`)
                    .join("; ")
                : "Không"}
            </div>
            <div>
              <b>Điểm khuyến khích:</b> {app.bonusScore}
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-x-auto">
        <h2 className="text-xl font-bold">Kết quả học tập</h2>
        <table className="mt-4 w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              {["Lớp", "Văn", "Toán", "Anh", "KHTN", "LS&ĐL", "GDCD", "Công nghệ", "Tin học", "Học lực", "Hạnh kiểm"].map((heading) => (
                <th key={heading} className="p-2">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {app.academicRecords.map((record) => (
              <tr key={record.id} className="border-t border-slate-100">
                <td className="p-2 font-semibold">{record.grade}</td>
                <td className="p-2">{record.literature ?? ""}</td>
                <td className="p-2">{record.math ?? ""}</td>
                <td className="p-2">{record.english ?? ""}</td>
                <td className="p-2">{record.naturalScience ?? ""}</td>
                <td className="p-2">{record.historyGeography ?? ""}</td>
                <td className="p-2">{record.civicEducation ?? ""}</td>
                <td className="p-2">{record.technology ?? ""}</td>
                <td className="p-2">{record.informatics ?? ""}</td>
                <td className="p-2">{record.academicLevel ? ACADEMIC_LEVEL_LABELS[record.academicLevel] : ""}</td>
                <td className="p-2">{record.conductLevel ? ACADEMIC_LEVEL_LABELS[record.conductLevel] : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">File đã tải lên</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {app.files.map((file) => (
            <div key={file.id} className="rounded-lg border border-slate-200 p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{FILE_TYPE_LABELS[file.fileType]}</p>
                  <p className="mt-1 text-slate-600">
                    {file.originalName} · {formatBytes(file.size)}
                  </p>
                  <p className="mt-1">
                    Trạng thái: <b>{FILE_STATUS_LABELS[file.status] ?? file.status}</b>
                  </p>
                  {file.note && <p className="mt-1 text-slate-600">Ghi chú: {file.note}</p>}
                  {file.reviewedBy && (
                    <p className="mt-1 text-slate-500">
                      Duyệt bởi {file.reviewedBy.name} lúc {formatDate(file.reviewedAt)}
                    </p>
                  )}
                </div>
                <Link
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white"
                  href={`/api/files/${file.id}`}
                  target="_blank"
                >
                  <Eye size={14} /> Xem file
                </Link>
              </div>
              <form className="mt-4 grid gap-2 md:grid-cols-[180px_1fr_auto]" action={`/api/admin/files/${file.id}/review`} method="post">
                <select name="status" defaultValue={file.status} className="form-select">
                  {Object.entries(FILE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input name="note" defaultValue={file.note ?? ""} className="form-input" placeholder="Ghi chú file" />
                <button className="rounded-lg bg-school-700 px-3 py-2 text-sm font-semibold text-white">Lưu</button>
              </form>
            </div>
          ))}
          {app.files.length === 0 && <p className="text-sm text-slate-500">Chưa có file.</p>}
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-xl font-bold">Log xử lý hồ sơ</h2>
        <div className="mt-4 space-y-3 text-sm">
          {app.logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-slate-200 p-3">
              <div className="font-semibold">
                {log.action} · {formatDate(log.createdAt)} · {log.user?.name ?? "Hệ thống"}
              </div>
              <div className="mt-1 text-slate-600">
                {log.oldValue && <span>Từ: {log.oldValue}. </span>}
                {log.newValue && <span>Sang: {log.newValue}. </span>}
                {log.note && <span>Ghi chú: {log.note}</span>}
              </div>
            </div>
          ))}
          {app.logs.length === 0 && <p className="text-slate-500">Chưa có log.</p>}
        </div>
      </Card>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <b>{label}:</b> {value || "-"}
    </p>
  );
}
