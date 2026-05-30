import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentSession } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";
import {
  STATUS_LABELS,
  ADMISSION_RESULT_LABELS,
  PHYSICAL_DOSSIER_LABELS,
  PHYSICAL_DOSSIER_VALIDITY_LABELS,
  GENDER_LABELS,
  ACADEMIC_LEVEL_LABELS,
  PRIZE_LABELS,
  PRIORITY_LABELS,
  FILE_TYPE_LABELS,
  FILE_STATUS_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const EDIT_REQUEST_STATUS_LABELS: Record<string, string> = {
  NHAP: "Nháp",
  CHO_DUYET: "Chờ duyệt",
  CAN_BO_SUNG: "Cần bổ sung",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Bị từ chối",
  DA_HUY: "Đã hủy",
};

export default async function StudentDossierPage() {
  const session = await getStudentSession();
  if (!session) redirect("/hoc-sinh/dang-nhap");

  const app = await prisma.application.findFirst({
    where: { id: session.applicationId, deletedAt: null },
    include: {
      academicRecords: { orderBy: { grade: "asc" } },
      priorities: true,
      awards: true,
      files: { orderBy: { uploadedAt: "asc" } },
      editRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!app) redirect("/hoc-sinh/dang-nhap");

  const hasPendingRequest = app.editRequests.some((r) =>
    ["NHAP", "CHO_DUYET", "CAN_BO_SUNG"].includes(r.status)
  );

  const canRequestEdit =
    !app.studentEditLocked &&
    !hasPendingRequest &&
    !(app.admissionPublished && app.admissionResult === "TRUNG_TUYEN");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-school-700 hover:underline">
            ← Trang chủ
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Hồ sơ: <strong>{app.applicationCode}</strong>
            </span>
            <form action="/api/student/logout" method="POST">
              <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-school-700">Hồ sơ dự tuyển</p>
            <h1 className="mt-1 text-2xl font-black text-slate-950">{app.fullName}</h1>
            <p className="mt-1 text-sm text-slate-500">Mã hồ sơ: <strong>{app.applicationCode}</strong></p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              app.status === "HOP_LE" || app.status === "DA_DUYET_XET_TUYEN" ? "bg-green-100 text-green-800" :
              app.status === "CAN_BO_SUNG" ? "bg-amber-100 text-amber-800" :
              app.status === "KHONG_HOP_LE" ? "bg-red-100 text-red-800" :
              "bg-slate-100 text-slate-600"
            }`}>
              {STATUS_LABELS[app.status] ?? app.status}
            </span>
            {app.publicNote && (
              <p className="max-w-xs text-right text-xs text-slate-500">{app.publicNote}</p>
            )}
          </div>
        </div>

        {/* Admission result (if published) */}
        {app.admissionPublished && (
          <div className={`rounded-2xl p-5 ${
            app.admissionResult === "TRUNG_TUYEN" ? "bg-green-50 border border-green-200" : "bg-slate-100 border border-slate-200"
          }`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kết quả tuyển sinh</p>
            <p className={`mt-1 text-xl font-black ${app.admissionResult === "TRUNG_TUYEN" ? "text-green-700" : "text-slate-700"}`}>
              {ADMISSION_RESULT_LABELS[app.admissionResult] ?? app.admissionResult}
              {app.admissionRank ? ` – Hạng ${app.admissionRank}` : ""}
              {app.admissionScoreSnapshot != null ? ` – ${app.admissionScoreSnapshot} điểm` : ""}
            </p>
            {app.admissionBatch && <p className="mt-1 text-sm text-slate-600">Đợt: {app.admissionBatch}</p>}
            {app.admissionPublicNote && <p className="mt-1 text-sm text-slate-600">{app.admissionPublicNote}</p>}
          </div>
        )}

        {/* Physical dossier status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">Nộp hồ sơ trực tiếp</h2>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Trạng thái nộp</p>
              <p className="font-semibold">{PHYSICAL_DOSSIER_LABELS[app.physicalDossierStatus] ?? app.physicalDossierStatus}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Tính hợp lệ</p>
              <p className="font-semibold">{PHYSICAL_DOSSIER_VALIDITY_LABELS[app.physicalDossierValidity] ?? app.physicalDossierValidity}</p>
            </div>
            {app.physicalDossierPublicNote && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Ghi chú</p>
                <p className="font-semibold">{app.physicalDossierPublicNote}</p>
              </div>
            )}
          </div>
        </section>

        {/* Personal info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">I. Thông tin học sinh</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Họ và tên" value={app.fullName} />
            <InfoRow label="Ngày sinh" value={formatDate(app.dateOfBirth)} />
            <InfoRow label="Giới tính" value={GENDER_LABELS[app.gender] ?? app.gender} />
            <InfoRow label="Dân tộc" value={app.ethnicity} />
            <InfoRow label="Nơi sinh" value={app.birthPlace} />
            <InfoRow label="Số định danh/CCCD" value={app.citizenId} />
            {app.issueDate && <InfoRow label="Ngày cấp" value={formatDate(app.issueDate)} />}
            {app.issuePlace && <InfoRow label="Nơi cấp" value={app.issuePlace} />}
          </dl>
        </section>

        {/* School info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">II. Thông tin học tập</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Trường THCS" value={app.secondarySchool} />
            <InfoRow label="Năm học lớp 9" value={app.schoolYear} />
            <InfoRow label="Phương án môn học" value={`Phương án ${app.selectedOptionNumber}: ${app.selectedSubjects}`} />
          </dl>
          {app.academicRecords.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    {["Lớp", "Văn", "Toán", "Anh", "KHTN", "LS&ĐL", "GDCD", "CN", "TH", "Học tập", "Rèn luyện"].map((h) => (
                      <th key={h} className="p-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {app.academicRecords.map((r) => (
                    <tr key={r.grade} className="border-t border-slate-100">
                      <td className="p-2 font-bold">Lớp {r.grade}</td>
                      {([r.literature, r.math, r.english, r.naturalScience, r.historyGeography, r.civicEducation, r.technology, r.informatics] as (number | null | undefined)[]).map((v, i) => (
                        <td key={i} className="p-2">{v ?? "-"}</td>
                      ))}
                      <td className="p-2">{r.academicLevel ? ACADEMIC_LEVEL_LABELS[r.academicLevel] : "-"}</td>
                      <td className="p-2">{r.conductLevel ? ACADEMIC_LEVEL_LABELS[r.conductLevel] : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Contact info */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">III. Địa chỉ và liên hệ</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <InfoRow label="Địa chỉ thường trú" value={app.permanentAddress} />
            {app.studentPhone && <InfoRow label="Điện thoại thí sinh" value={app.studentPhone} />}
            {app.email && <InfoRow label="Email" value={app.email} />}
            <InfoRow label="Họ tên phụ huynh/giám hộ" value={app.guardianName} />
            <InfoRow label="Điện thoại phụ huynh" value={app.guardianPhone} />
          </dl>
        </section>

        {/* Priorities */}
        {app.priorities.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">IV. Diện ưu tiên</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {app.priorities.map((p) => (
                <li key={p.id} className="flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-school-500" />
                  {PRIORITY_LABELS[p.type] ?? p.type}
                  {p.description && <span className="text-slate-500">– {p.description}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Awards */}
        {app.awards.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">V. Giải thưởng / Khuyến khích</h2>
            {app.awards.map((a) => (
              <div key={a.id} className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-semibold">{a.competitionName}</p>
                <p className="mt-1 text-slate-600">
                  {PRIZE_LABELS[a.prize] ?? a.prize}
                  {a.field ? ` – ${a.field}` : ""}
                  {a.level ? ` – ${a.level}` : ""}
                  {a.year ? ` (${a.year})` : ""}
                  {" – "}<span className="text-school-700 font-semibold">+{a.bonusScore} điểm</span>
                </p>
              </div>
            ))}
          </section>
        )}

        {/* Uploaded files */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">VI. Tệp hồ sơ đã tải lên</h2>
          {app.files.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Chưa có tệp nào.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {app.files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2">
                  <div>
                    <p className="font-medium">{FILE_TYPE_LABELS[f.fileType] ?? f.fileType}</p>
                    <p className="text-xs text-slate-400">{f.originalName}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    f.status === "HOP_LE" ? "bg-green-100 text-green-700" :
                    f.status === "KHONG_HOP_LE" ? "bg-red-100 text-red-700" :
                    f.status === "CAN_BO_SUNG" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {FILE_STATUS_LABELS[f.status] ?? f.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Edit requests */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">VII. Yêu cầu chỉnh sửa</h2>
            {canRequestEdit && (
              <Link
                href="/hoc-sinh/ho-so/chinh-sua"
                className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-school-700 px-4 text-sm font-semibold text-white hover:bg-school-900"
              >
                Gửi yêu cầu chỉnh sửa
              </Link>
            )}
          </div>

          {app.studentEditLocked && (
            <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Hồ sơ hiện đang bị khóa chỉnh sửa do nhà trường đang xử lý.
            </div>
          )}

          {hasPendingRequest && !app.studentEditLocked && (
            <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Có yêu cầu chỉnh sửa đang chờ cán bộ xem xét. Hồ sơ chính sẽ chỉ thay đổi sau khi được duyệt.
            </div>
          )}

          {app.editRequests.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">Chưa có yêu cầu chỉnh sửa nào.</p>
          )}
          {app.editRequests.map((req) => (
            <div key={req.id} className="mt-3 rounded-xl border border-slate-100 p-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-slate-500">{req.requestCode}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  req.status === "DA_DUYET" ? "bg-green-100 text-green-700" :
                  req.status === "TU_CHOI" ? "bg-red-100 text-red-700" :
                  req.status === "CHO_DUYET" ? "bg-blue-100 text-blue-700" :
                  req.status === "CAN_BO_SUNG" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-500"
                }`}>
                  {EDIT_REQUEST_STATUS_LABELS[req.status] ?? req.status}
                </span>
              </div>
              {req.officerNote && (
                <p className="mt-2 text-slate-700">
                  <span className="font-semibold">Ghi chú cán bộ:</span> {req.officerNote}
                </p>
              )}
              {req.rejectionReason && (
                <p className="mt-2 text-red-600">
                  <span className="font-semibold">Lý do từ chối:</span> {req.rejectionReason}
                </p>
              )}
              {req.submittedAt && (
                <p className="mt-1 text-xs text-slate-400">
                  Gửi lúc {new Date(req.submittedAt).toLocaleString("vi-VN")}
                </p>
              )}

              {["CAN_BO_SUNG", "NHAP"].includes(req.status) && (
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/hoc-sinh/ho-so/chinh-sua"
                    className="rounded-lg border border-school-200 bg-school-50 px-3 py-1.5 text-xs font-semibold text-school-700 hover:bg-school-100"
                  >
                    Chỉnh sửa lại
                  </Link>
                  <form action="/api/student/edit-request/cancel" method="POST">
                    <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100">
                      Hủy yêu cầu
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Legal notice */}
        <div className="rounded-2xl bg-slate-100 px-5 py-4 text-xs text-slate-500">
          <p className="font-semibold">🔒 Bảo vệ dữ liệu cá nhân</p>
          <p className="mt-1">
            Dữ liệu hồ sơ của học sinh được bảo mật theo Nghị định 13/2023/NĐ-CP. Nhà trường không
            chia sẻ thông tin cá nhân với bên thứ ba. Để thay đổi thông tin hồ sơ, vui lòng sử dụng
            chức năng &quot;Gửi yêu cầu chỉnh sửa&quot; và chờ xác nhận từ cán bộ tuyển sinh.
          </p>
        </div>
      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value || "—"}</dd>
    </div>
  );
}
