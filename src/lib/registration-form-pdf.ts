import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Prisma } from "@prisma/client";
import { ACADEMIC_LEVEL_LABELS, PRIORITY_LABELS, PRIZE_LABELS, PRIZE_SCORES, SUBJECT_OPTIONS } from "@/lib/constants";
import { readStoredFile } from "@/lib/storage";

export type RegistrationFormPdfApplication = Prisma.ApplicationGetPayload<{
  include: {
    academicRecords: true;
    priorities: true;
    awards: true;
    files: true;
  };
}>;

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 36;
const LINE = rgb(0.15, 0.18, 0.23);
const LIGHT = rgb(0.82, 0.85, 0.9);

function date(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("vi-VN");
}

function valueOrDots(value: unknown, dots = "................................................") {
  const text = String(value ?? "").trim();
  return text || dots;
}

function drawText(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size = 10, options?: { bold?: boolean; maxWidth?: number }) {
  const maxWidth = options?.maxWidth;
  if (!maxWidth) {
    page.drawText(text, { x, y, font, size, color: LINE });
    return y;
  }

  const words = text.split(/\s+/);
  let line = "";
  let currentY = y;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      page.drawText(line, { x, y: currentY, font, size, color: LINE });
      currentY -= size + 3;
      line = word;
    } else {
      line = next;
    }
  }
  if (line) page.drawText(line, { x, y: currentY, font, size, color: LINE });
  return currentY;
}

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, font, size, color: LINE });
}

function drawSection(page: PDFPage, title: string, y: number, bold: PDFFont) {
  page.drawText(title, { x: MARGIN, y, font: bold, size: 11, color: LINE });
  page.drawLine({ start: { x: MARGIN, y: y - 4 }, end: { x: PAGE_WIDTH - MARGIN, y: y - 4 }, thickness: 0.5, color: LIGHT });
  return y - 18;
}

function drawField(page: PDFPage, label: string, value: unknown, x: number, y: number, width: number, regular: PDFFont, bold: PDFFont) {
  page.drawText(`${label}:`, { x, y, font: bold, size: 9.5, color: LINE });
  drawText(page, valueOrDots(value), x + bold.widthOfTextAtSize(`${label}: `, 9.5), y, regular, 9.5, { maxWidth: width });
  return y - 15;
}

function drawCheckbox(page: PDFPage, label: string, checked: boolean, x: number, y: number, regular: PDFFont) {
  page.drawRectangle({ x, y: y - 1, width: 8, height: 8, borderColor: LINE, borderWidth: 0.8 });
  if (checked) {
    page.drawLine({ start: { x: x + 1.5, y: y + 1 }, end: { x: x + 7, y: y + 6 }, thickness: 1, color: LINE });
    page.drawLine({ start: { x: x + 7, y: y + 1 }, end: { x: x + 1.5, y: y + 6 }, thickness: 1, color: LINE });
  }
  drawText(page, label, x + 12, y, regular, 9, { maxWidth: 225 });
}

function drawTable(
  page: PDFPage,
  rows: string[][],
  x: number,
  y: number,
  widths: number[],
  rowHeight: number,
  regular: PDFFont,
  bold: PDFFont,
  headerRows = 1
) {
  let currentY = y;
  rows.forEach((row, rowIndex) => {
    let currentX = x;
    row.forEach((cell, index) => {
      page.drawRectangle({
        x: currentX,
        y: currentY - rowHeight,
        width: widths[index],
        height: rowHeight,
        borderColor: LIGHT,
        borderWidth: 0.7,
        color: rowIndex < headerRows ? rgb(0.96, 0.97, 0.99) : undefined,
      });
      drawText(page, cell, currentX + 3, currentY - 12, rowIndex < headerRows ? bold : regular, 7.2, {
        maxWidth: widths[index] - 6,
      });
      currentX += widths[index];
    });
    currentY -= rowHeight;
  });
  return currentY;
}

async function embedPhoto(doc: PDFDocument, page: PDFPage, application: RegistrationFormPdfApplication, x: number, y: number, font: PDFFont) {
  const photo = application.files.find((file) => file.fileType === "PHOTO_4X6" && file.status === "HOP_LE" && file.mimeType.startsWith("image/"));
  page.drawRectangle({ x, y, width: 75, height: 100, borderColor: LINE, borderWidth: 0.8 });
  if (!photo) {
    page.drawText("Ảnh 4x6", { x: x + 18, y: y + 46, font, size: 10, color: LINE });
    return;
  }
  try {
    const buffer = await readStoredFile(photo);
    const image = photo.mimeType === "image/png" ? await doc.embedPng(buffer) : await doc.embedJpg(buffer);
    page.drawImage(image, { x: x + 2, y: y + 2, width: 71, height: 96 });
  } catch {
    page.drawText("Ảnh 4x6", { x: x + 18, y: y + 46, font, size: 10, color: LINE });
  }
}

export async function buildRegistrationFormPdf(application: RegistrationFormPdfApplication) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("Đơn đăng ký dự tuyển vào lớp 10 năm học 2026-2027");
  doc.setAuthor("Trường THPT Võ Văn Kiệt");
  doc.setSubject("Đơn đăng ký dự tuyển vào lớp 10 năm học 2026-2027");

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf")),
  ]);
  const regular = await doc.embedFont(regularBytes);
  const bold = await doc.embedFont(boldBytes);

  const page1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawCentered(page1, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 796, bold, 12);
  drawCentered(page1, "Độc lập - Tự do - Hạnh phúc", 779, bold, 11);
  page1.drawText(`Mã phiếu: ${application.applicationCode}`, { x: 438, y: 748, font: bold, size: 10, color: LINE });
  drawCentered(page1, "ĐƠN ĐĂNG KÝ DỰ TUYỂN VÀO LỚP 10", 742, bold, 14);
  drawCentered(page1, "Năm học 2026 - 2027", 724, regular, 11);
  drawText(page1, "Kính gửi: Hiệu trưởng trường THPT Võ Văn Kiệt", MARGIN + 88, 697, regular, 10.5);
  await embedPhoto(doc, page1, application, MARGIN, 612, regular);

  let y = drawSection(page1, "I. THÔNG TIN HỌC SINH", 674, bold);
  const infoX = MARGIN + 88;
  y = drawField(page1, "Họ và tên", application.fullName.toUpperCase(), infoX, y, 380, regular, bold);
  y = drawField(page1, "Ngày, tháng, năm sinh", date(application.dateOfBirth), infoX, y, 300, regular, bold);
  y = drawField(page1, "Giới tính", application.gender, infoX, y, 300, regular, bold);
  y = drawField(page1, "Dân tộc", application.ethnicity, infoX, y, 300, regular, bold);
  y = drawField(page1, "Nơi sinh", application.birthPlace, infoX, y, 380, regular, bold);
  y = drawField(page1, "Số định danh/CCCD/CC", application.citizenId, infoX, y, 350, regular, bold);
  y = drawField(page1, "Ngày cấp", date(application.issueDate), infoX, y, 350, regular, bold);
  y = drawField(page1, "Nơi cấp", application.issuePlace ?? "", infoX, y, 350, regular, bold);

  y = drawSection(page1, "II. THÔNG TIN HỌC TẬP", y - 6, bold);
  drawText(
    page1,
    `Học sinh lớp 9 trường THCS ${valueOrDots(application.secondarySchool, "........................")} năm học ${valueOrDots(application.schoolYear, "20.... - 20....")}.`,
    MARGIN,
    y,
    regular,
    9.5,
    { maxWidth: PAGE_WIDTH - MARGIN * 2 }
  );
  y -= 18;
  const records = [...application.academicRecords].sort((a, b) => a.grade - b.grade);
  y = drawTable(
    page1,
    [
      ["Lớp", "Ngữ văn", "Toán", "Tiếng Anh", "KHTN", "LS&ĐL", "GDCD", "Công nghệ", "Tin học", "Ghi chú"],
      ...[6, 7, 8, 9].map((grade) => {
        const item = records.find((record) => record.grade === grade);
        return [
          String(grade),
          String(item?.literature ?? ""),
          String(item?.math ?? ""),
          String(item?.english ?? ""),
          String(item?.naturalScience ?? ""),
          String(item?.historyGeography ?? ""),
          String(item?.civicEducation ?? ""),
          String(item?.technology ?? ""),
          String(item?.informatics ?? ""),
          item?.note ?? "",
        ];
      }),
    ],
    MARGIN,
    y,
    [28, 50, 44, 54, 45, 45, 42, 55, 45, 95],
    24,
    regular,
    bold
  );
  y -= 12;
  drawTable(
    page1,
    [
      ["Lớp", "Học tập", "Rèn luyện"],
      ...[6, 7, 8, 9].map((grade) => {
        const item = records.find((record) => record.grade === grade);
        return [
          String(grade),
          item?.academicLevel ? ACADEMIC_LEVEL_LABELS[item.academicLevel] ?? item.academicLevel : "",
          item?.conductLevel ? ACADEMIC_LEVEL_LABELS[item.conductLevel] ?? item.conductLevel : "",
        ];
      }),
    ],
    MARGIN,
    y,
    [70, 220, 220],
    22,
    regular,
    bold
  );

  const page2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  y = drawSection(page2, "III. THÔNG TIN LIÊN HỆ", 792, bold);
  y = drawField(page2, "Địa chỉ thường trú", application.permanentAddress, MARGIN, y, 480, regular, bold);
  y = drawField(page2, "Số điện thoại thí sinh", application.studentPhone ?? "", MARGIN, y, 430, regular, bold);
  y = drawField(page2, "Email", application.email ?? "", MARGIN, y, 430, regular, bold);
  y = drawField(page2, "Cha/mẹ/người giám hộ", application.guardianName, MARGIN, y, 430, regular, bold);
  y = drawField(page2, "Điện thoại liên hệ", application.guardianPhone, MARGIN, y, 430, regular, bold);

  y = drawSection(page2, "IV. ĐỐI TƯỢNG ƯU TIÊN, KHUYẾN KHÍCH NẾU CÓ", y - 8, bold);
  const priorityTypes = new Set<string>(application.priorities.map((priority) => priority.type));
  const priorityOptions = [
    "CON_THUONG_BINH_LIET_SI",
    "DAN_TOC_THIEU_SO",
    "CHA_ME_DAN_TOC_THIEU_SO",
    "VUNG_DAC_BIET_KHO_KHAN",
    "HO_NGHEO",
    "HO_CAN_NGHEO",
    "MO_COI_CHA_HOAC_ME",
    "MO_COI_CHA_LAN_ME",
  ];
  priorityOptions.forEach((type, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    drawCheckbox(page2, PRIORITY_LABELS[type] ?? type, priorityTypes.has(type), MARGIN + col * 260, y - row * 22, regular);
  });
  y -= 106;
  const award = application.awards[0];
  drawCheckbox(page2, "Đạt giải cấp tỉnh trở lên các môn văn hóa, năng khiếu", Boolean(award), MARGIN, y, regular);
  y -= 16;
  if (award) {
    const awardText = `${award.competitionName}${award.field ? ` - ${award.field}` : ""}; ${PRIZE_LABELS[award.prize] ?? award.prize}; cộng ${PRIZE_SCORES[award.prize] ?? award.bonusScore} điểm`;
    drawText(page2, awardText, MARGIN + 12, y, regular, 9, { maxWidth: 500 });
  } else {
    drawText(page2, "Giải nhất: cộng 1,5 điểm; Giải nhì: cộng 1,0 điểm; Giải ba: cộng 0,5 điểm", MARGIN + 12, y, regular, 9);
  }

  y = drawSection(page2, "V. NGUYỆN VỌNG HỌC CÁC MÔN LỰA CHỌN LỚP 10 NẾU TRÚNG TUYỂN", y - 28, bold);
  SUBJECT_OPTIONS.forEach((option, index) => {
    drawCheckbox(
      page2,
      `Phương án ${option.optionNumber}: ${option.subjects}`,
      option.optionNumber === application.selectedOptionNumber,
      MARGIN,
      y - index * 20,
      regular
    );
  });

  y -= 148;
  drawText(
    page2,
    "Tôi xin cam đoan những thông tin khai trên là đúng sự thật. Nếu trúng tuyển vào lớp 10 của trường, tôi sẽ chấp hành nghiêm túc các quy định của nhà trường.",
    MARGIN,
    y,
    regular,
    10,
    { maxWidth: PAGE_WIDTH - MARGIN * 2 }
  );
  y -= 48;
  drawCentered(page2, "Phước Long, ngày .... tháng .... năm 2026", y, regular, 10);
  y -= 28;
  drawCentered(page2, "XÁC NHẬN CỦA CHA/MẸ (NGƯỜI GIÁM HỘ)", y, bold, 9.5);
  page2.drawText("NGƯỜI LÀM ĐƠN", { x: 390, y, font: bold, size: 9.5, color: LINE });
  drawCentered(page2, "(Ký và ghi rõ họ tên)", y - 14, regular, 9);
  page2.drawText("(Ký và ghi rõ họ tên)", { x: 372, y: y - 14, font: regular, size: 9, color: LINE });

  return doc.save();
}

export function registrationFormPdfFilename(applicationCode: string) {
  return `don-dang-ky-du-tuyen-lop-10-vvk-2026-${applicationCode}.pdf`;
}
