import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Eye, Pencil } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma";
import { calculateAdmissionScoreDetails } from "@/lib/admission-score";
import {
  ACADEMIC_LEVEL_LABELS,
  ADMISSION_PUBLICATION_LABELS,
  ADMISSION_RESULT_LABELS,
  FILE_STATUS_LABELS,
  FILE_TYPE_LABELS,
  GENDER_LABELS,
  PHYSICAL_DOSSIER_LABELS,
  PHYSICAL_DOSSIER_VALIDITY_LABELS,
  PRIORITY_LABELS,
  PRIZE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { formatDate, formatBytes } from "@/lib/utils";
import { AdmissionResultForm, PhysicalDossierForm } from "./AdminAdmissionPanels";
import { DeleteApplicationButton } from "./DeleteApplicationButton";

export const dynamic = "force-dynamic";

function statusVariant(status: string): "secondary" | "success" | "warning" | "destructive" {
  if (["HOP_LE", "DA_TIEP_NHAN", "DA_DUYET_XET_TUYEN"].includes(status)) return "success";
  if (status === "CAN_BO_SUNG") return "warning";
  if (status === "KHONG_HOP_LE") return "destructive";
  return "secondary";
}

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { id, deletedAt: null },
    include: {
      academicRecords: { orderBy: { grade: "asc" } },
      priorities: true,
      awards: true,
      files: { orderBy: { uploadedAt: "desc" }, include: { reviewedBy: true } },
      logs: { orderBy: { createdAt: "desc" }, take: 40, include: { user: true } },
    },
  });
  if (!app) notFound();
  const scoreDetails = calculateAdmissionScoreDetails(app.academicRecords, app.bonusScore);
  const hasTranscript = app.files.some((file) => file.fileType === "HOC_BA_THCS" || file.fileType.startsWith("HOC_BA_LOP_"));

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Chi tiết hồ sơ</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Hồ sơ {app.applicationCode}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>{app.fullName}</span>
            <Badge variant={statusVariant(app.status)}>{STATUS_LABELS[app.status] ?? app.status}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            href={`/admin/ho-so/${app.id}/chinh-sua`}
          >
            <Pencil size={16} /> Chỉnh sửa hồ sơ
          </Link>
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            href={`/api/admin/applications/${app.id}/registration-form-pdf`}
          >
            <Download size={16} /> Tải đơn PDF
          </Link>
          <DeleteApplicationButton applicationId={app.id} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardTitle>Thông tin học sinh</CardTitle>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Info label="Họ tên" value={app.fullName} />
            <Info label="Ngày sinh" value={formatDate(app.dateOfBirth)} />
            <Info label="Giới tính" value={GENDER_LABELS[app.gender] ?? app.gender} />
            <Info label="Dân tộc" value={app.ethnicity} />
            <Info label="Nơi sinh" value={app.birthPlace} />
            <Info label="Số định danh" value={app.citizenId} />
            <Info label="Ngày cấp" value={formatDate(app.issueDate)} />
            <Info label="Nơi cấp" value={app.issuePlace ?? ""} />
            <Info label="Trường THCS" value={app.secondarySchool} />
            <Info label="Địa chỉ cũ trường THCS" value={app.secondarySchoolOldAddress ?? ""} />
            <Info label="Địa chỉ mới trường THCS" value={app.secondarySchoolAddress ?? ""} />
            <Info label="Phương án" value={`${app.selectedOptionNumber} - ${app.selectedSubjects}`} />
          </div>
        </Card>

        <Card>
          <CardTitle>Cập nhật trạng thái</CardTitle>
          <CardDescription className="mt-1">Ghi chú công khai sẽ hiển thị cho thí sinh khi tra cứu.</CardDescription>
          <form className="mt-4 space-y-3" action={`/api/admin/applications/${app.id}`} method="post">
            <Select name="status" defaultValue={app.status}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Textarea name="publicNote" defaultValue={app.publicNote ?? ""} placeholder="Ghi chú gửi học sinh" />
            <Textarea name="internalNote" defaultValue={app.internalNote ?? ""} placeholder="Ghi chú nội bộ" />
            <Button type="submit">Lưu cập nhật</Button>
          </form>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Tình trạng hồ sơ trực tiếp/bản giấy</CardTitle>
          <div className="mt-4 grid gap-3 text-sm">
            <Info label="Trạng thái" value={PHYSICAL_DOSSIER_LABELS[app.physicalDossierStatus] ?? app.physicalDossierStatus} />
            <Info label="Kiểm tra hồ sơ" value={PHYSICAL_DOSSIER_VALIDITY_LABELS[app.physicalDossierValidity] ?? app.physicalDossierValidity} />
            <Info label="Ngày tiếp nhận" value={formatDate(app.physicalDossierReceivedAt)} />
            <Info label="Ghi chú công khai" value={app.physicalDossierPublicNote ?? ""} />
            <Info label="Ghi chú nội bộ" value={app.physicalDossierInternalNote ?? ""} />
          </div>
          <div className="mt-4">
            <PhysicalDossierForm
              applicationId={app.id}
              initial={{
                physicalDossierStatus: app.physicalDossierStatus,
                physicalDossierValidity: app.physicalDossierValidity,
                physicalDossierPublicNote: app.physicalDossierPublicNote ?? "",
                physicalDossierInternalNote: app.physicalDossierInternalNote ?? "",
              }}
            />
          </div>
        </Card>

        <Card>
          <CardTitle>Kết quả tuyển sinh</CardTitle>
          <div className="mt-4 grid gap-3 text-sm">
            <Info label="Kết quả hiện tại" value={ADMISSION_RESULT_LABELS[app.admissionResult] ?? app.admissionResult} />
            <Info
              label="Trạng thái công bố"
              value={
                app.admissionPublished
                  ? ADMISSION_PUBLICATION_LABELS.DA_CONG_BO
                  : app.admissionPublishedAt
                    ? ADMISSION_PUBLICATION_LABELS.DA_GO_CONG_BO
                    : ADMISSION_PUBLICATION_LABELS.CHUA_CONG_BO
              }
            />
            <Info label="Đợt xét tuyển" value={app.admissionBatch ?? ""} />
            <Info label="Thứ hạng" value={app.admissionRank ? String(app.admissionRank) : ""} />
            <Info label="Điểm snapshot" value={app.admissionScoreSnapshot != null ? String(app.admissionScoreSnapshot) : ""} />
            <Info label="Ghi chú công khai" value={app.admissionPublicNote ?? ""} />
            <Info label="Ghi chú nội bộ" value={app.admissionNote ?? ""} />
          </div>
          <div className="mt-4">
            <AdmissionResultForm
              applicationId={app.id}
              initial={{
                admissionResult: app.admissionResult,
                admissionRank: app.admissionRank,
                admissionBatch: app.admissionBatch ?? "",
                admissionPublicNote: app.admissionPublicNote ?? "",
                admissionNote: app.admissionNote ?? "",
                admissionPublished: app.admissionPublished,
              }}
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>Thông tin liên hệ</CardTitle>
          <div className="mt-4 grid gap-3 text-sm">
            <Info label="Số nhà" value={app.houseNumber ?? ""} />
            <Info label="Ấp/khóm" value={app.hamlet ?? ""} />
            <Info label="Xã/phường" value={app.ward ?? ""} />
            <Info label="Tỉnh/thành phố" value={app.province ?? ""} />
            <Info label="Địa chỉ thường trú ghép" value={app.permanentAddress} />
            <Info label="SĐT học sinh" value={app.studentPhone ?? ""} />
            <Info label="Email" value={app.email ?? ""} />
            <Info label="Phụ huynh/người giám hộ" value={app.guardianName} />
            <Info label="Điện thoại liên hệ" value={app.guardianPhone} />
          </div>
        </Card>

        <Card>
          <CardTitle>Ưu tiên và khuyến khích</CardTitle>
          <div className="mt-4 space-y-4 text-sm">
            <Info
              label="Tình trạng học bạ"
              value={hasTranscript ? "Đã có học bạ" : "Chưa có học bạ - không bắt buộc, khuyến khích bổ sung"}
            />
            <Info
              label="Đối tượng"
              value={
                app.priorities.length > 0
                  ? app.priorities.map((priority) => PRIORITY_LABELS[priority.type] ?? priority.type).join("; ")
                  : "Không"
              }
            />
            <Info
              label="Giải thưởng"
              value={
                app.awards.length > 0
                  ? app.awards
                      .map((award) => `${award.competitionName} - ${PRIZE_LABELS[award.prize] ?? award.prize} (${award.bonusScore} điểm)`)
                      .join("; ")
                  : "Không"
              }
            />
            <Info label="Điểm khuyến khích" value={`${app.bonusScore}`} />
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle>Điểm xét tuyển dự kiến</CardTitle>
        <CardDescription className="mt-1">
          Điểm dự kiến phục vụ hội đồng tuyển sinh; hệ thống không tự kết luận trúng tuyển.
        </CardDescription>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
          <Info label="A - Tổng điểm TB môn THCS" value={`${scoreDetails.academicAverageSum}`} />
          <Info label="B - Điểm quy đổi" value={`${scoreDetails.convertedScoreSum}`} />
          <Info label="C - Điểm ưu tiên/khuyến khích" value={`${scoreDetails.bonusScore}`} />
          <Info label="Tổng điểm xét tuyển dự kiến" value={`${scoreDetails.totalScore}`} />
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="p-6 pb-0">
          <CardTitle>Kết quả học tập</CardTitle>
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                {["Lớp", "Văn", "Toán", "Anh", "KHTN", "LS&ĐL", "GDCD", "Công nghệ", "Tin học", "Học lực", "Hạnh kiểm"].map((heading) => (
                  <th key={heading} className="p-3 font-semibold">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {app.academicRecords.map((record) => (
                <tr key={record.id} className="border-t border-slate-100">
                  <td className="p-3 font-semibold">Lớp {record.grade}</td>
                  <td className="p-3">{record.literature ?? ""}</td>
                  <td className="p-3">{record.math ?? ""}</td>
                  <td className="p-3">{record.english ?? ""}</td>
                  <td className="p-3">{record.naturalScience ?? ""}</td>
                  <td className="p-3">{record.historyGeography ?? ""}</td>
                  <td className="p-3">{record.civicEducation ?? ""}</td>
                  <td className="p-3">{record.technology ?? ""}</td>
                  <td className="p-3">{record.informatics ?? ""}</td>
                  <td className="p-3">{record.academicLevel ? ACADEMIC_LEVEL_LABELS[record.academicLevel] : ""}</td>
                  <td className="p-3">{record.conductLevel ? ACADEMIC_LEVEL_LABELS[record.conductLevel] : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <CardTitle>File đã tải lên</CardTitle>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {app.files.map((file) => (
            <div key={file.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-950">{FILE_TYPE_LABELS[file.fileType]}</p>
                  <p className="mt-1 text-slate-600">
                    {file.originalName} · {formatBytes(file.size)}
                  </p>
                  <p className="mt-2">
                    <Badge variant={statusVariant(file.status)}>{FILE_STATUS_LABELS[file.status] ?? file.status}</Badge>
                  </p>
                  {file.note && <p className="mt-2 text-slate-600">Ghi chú: {file.note}</p>}
                  {file.reviewedBy && (
                    <p className="mt-2 text-slate-500">
                      Duyệt bởi {file.reviewedBy.name} lúc {formatDate(file.reviewedAt)}
                    </p>
                  )}
                </div>
                <Link
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white"
                  href={`/api/files/${file.id}`}
                  target="_blank"
                >
                  <Eye size={14} /> Xem file
                </Link>
              </div>
              <form className="mt-4 grid gap-2 md:grid-cols-[180px_1fr_auto]" action={`/api/admin/files/${file.id}/review`} method="post">
                <Select name="status" defaultValue={file.status}>
                  {Object.entries(FILE_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
                <Input name="note" defaultValue={file.note ?? ""} placeholder="Ghi chú file" />
                <Button type="submit" size="sm">
                  Lưu
                </Button>
              </form>
            </div>
          ))}
          {app.files.length === 0 && <p className="text-sm text-slate-500">Chưa có file.</p>}
        </div>
      </Card>

      <Card className="mt-6">
        <CardTitle>Log xử lý hồ sơ</CardTitle>
        <div className="mt-4 space-y-3 text-sm">
          {app.logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-200 p-3">
              <div className="font-semibold text-slate-950">
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
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value || "-"}</p>
    </div>
  );
}
