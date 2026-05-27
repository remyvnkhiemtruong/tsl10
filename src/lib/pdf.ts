import type { Prisma } from "@prisma/client";
import QRCode from "qrcode";
import { ACADEMIC_LEVEL_LABELS, GENDER_LABELS, PRIORITY_LABELS, PRIZE_LABELS, STATUS_LABELS } from "@/lib/constants";

export type PdfApplication = Prisma.ApplicationGetPayload<{
  include: {
    academicRecords: true;
    priorities: true;
    awards: true;
    files: true;
  };
}>;

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function date(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

function rows(values: Array<[string, string]>) {
  return values.map(([label, value]) => `<tr><td class="label">${esc(label)}</td><td>${esc(value)}</td></tr>`).join("");
}

export async function buildApplicationPdfHtml(application: PdfApplication) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const lookupUrl = `${appUrl}/tra-cuu?ma=${encodeURIComponent(application.applicationCode)}`;
  const qr = await QRCode.toDataURL(lookupUrl);
  const priorityText = application.priorities.map((priority) => PRIORITY_LABELS[priority.type] ?? priority.type).join("; ");
  const awardText = application.awards
    .map((award) => `${award.competitionName} - ${PRIZE_LABELS[award.prize] ?? award.prize} (${award.bonusScore} điểm)`)
    .join("; ");

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; font-size: 13px; line-height: 1.45; }
    .page { width: 794px; margin: 0 auto; padding: 30px 36px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    h1 { font-size: 19px; margin: 18px 0 4px; }
    h2 { font-size: 14px; margin: 16px 0 8px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    td, th { border: 1px solid #d1d5db; padding: 6px; vertical-align: top; }
    th { background: #f1f5f9; }
    .label { width: 190px; font-weight: 700; }
    .no-border td { border: none; }
    .qr { width: 92px; height: 92px; }
    .sign { height: 76px; }
  </style>
</head>
<body>
<div class="page">
  <div class="center bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
  <div class="center bold">Độc lập - Tự do - Hạnh phúc</div>
  <h1 class="center">ĐƠN ĐĂNG KÝ DỰ TUYỂN VÀO LỚP 10</h1>
  <div class="center">Năm học 2026 - 2027</div>
  <p>Kính gửi: <b>Hiệu trưởng Trường THPT Võ Văn Kiệt</b></p>

  <h2>I. Thông tin học sinh</h2>
  <table>${rows([
    ["Họ và tên", application.fullName],
    ["Ngày sinh", `${date(application.dateOfBirth)} - Giới tính: ${GENDER_LABELS[application.gender] ?? application.gender}`],
    ["Dân tộc", application.ethnicity],
    ["Nơi sinh", application.birthPlace],
    ["Số định danh/CCCD", application.citizenId],
    ["Ngày cấp/Nơi cấp", `${date(application.issueDate)} ${application.issuePlace ?? ""}`],
  ])}</table>

  <h2>II. Thông tin học tập</h2>
  <p>Học sinh lớp 9 trường: <b>${esc(application.secondarySchool)}</b>, năm học ${esc(application.schoolYear)}.</p>
  <table>
    <tr><th>Lớp</th><th>Văn</th><th>Toán</th><th>Anh</th><th>KHTN</th><th>LS&ĐL</th><th>GDCD</th><th>Công nghệ</th><th>Tin học</th><th>Học lực</th><th>Hạnh kiểm</th></tr>
    ${[...application.academicRecords]
      .sort((a, b) => a.grade - b.grade)
      .map(
        (record) =>
          `<tr><td>${record.grade}</td><td>${record.literature ?? ""}</td><td>${record.math ?? ""}</td><td>${record.english ?? ""}</td><td>${record.naturalScience ?? ""}</td><td>${record.historyGeography ?? ""}</td><td>${record.civicEducation ?? ""}</td><td>${record.technology ?? ""}</td><td>${record.informatics ?? ""}</td><td>${record.academicLevel ? ACADEMIC_LEVEL_LABELS[record.academicLevel] : ""}</td><td>${record.conductLevel ? ACADEMIC_LEVEL_LABELS[record.conductLevel] : ""}</td></tr>`
      )
      .join("")}
  </table>

  <h2>III. Thông tin liên hệ</h2>
  <table>${rows([
    ["Địa chỉ thường trú", application.permanentAddress],
    ["Ấp/khóm - Xã/phường - Tỉnh", [application.hamlet, application.ward, application.province].filter(Boolean).join(" - ")],
    ["Số điện thoại học sinh", application.studentPhone ?? ""],
    ["Email", application.email ?? ""],
    ["Cha/mẹ/người giám hộ", application.guardianName],
    ["Điện thoại liên hệ", application.guardianPhone],
  ])}</table>

  <h2>IV. Đối tượng ưu tiên, khuyến khích</h2>
  <table>${rows([
    ["Đối tượng ưu tiên/khác", priorityText || "Không"],
    ["Giải thưởng", awardText || "Không"],
    ["Điểm khuyến khích", String(application.bonusScore)],
  ])}</table>

  <h2>V. Nguyện vọng học các môn lựa chọn lớp 10</h2>
  <p>Phương án ${esc(application.selectedOptionNumber)}: <b>${esc(application.selectedSubjects)}</b></p>

  <h2>VI. Cam kết</h2>
  <p>Tôi xin cam đoan những thông tin khai trên là đúng sự thật. Nếu trúng tuyển vào lớp 10 của trường, tôi sẽ chấp hành nghiêm túc các quy định của nhà trường.</p>

  <table class="no-border">
    <tr>
      <td style="width: 30%">Mã hồ sơ: <b>${esc(application.applicationCode)}</b><br/>Trạng thái: ${esc(STATUS_LABELS[application.status] ?? application.status)}<br/><img class="qr" src="${qr}" /></td>
      <td class="center">Phước Long, ngày ...... tháng ...... năm 2026<br/><br/><b>XÁC NHẬN CỦA CHA/MẸ/NGƯỜI GIÁM HỘ</b><div class="sign"></div>Ký và ghi rõ họ tên</td>
      <td class="center"><br/><br/><b>NGƯỜI LÀM ĐƠN</b><div class="sign"></div>Ký và ghi rõ họ tên</td>
    </tr>
  </table>
</div>
</body>
</html>`;
}
