import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AcademicRecord, Prisma } from "@prisma/client";
import { ACADEMIC_LEVEL_LABELS, GENDER_LABELS, SUBJECT_OPTIONS } from "@/lib/constants";

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
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE = rgb(0.08, 0.08, 0.08);
const BODY = 11.2;
const SMALL = 9.2;

type Fonts = {
  regular: PDFFont;
  bold: PDFFont;
};

function formatDateVi(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function formatLongDateVi(value: Date | string | null | undefined) {
  const date = value ? new Date(value) : new Date();
  return `Phước Long, ngày ${date.getDate()} tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;
}

function score(value: number | null | undefined) {
  if (value == null) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function drawCentered(page: PDFPage, value: string, y: number, font: PDFFont, size: number) {
  const width = font.widthOfTextAtSize(value, size);
  page.drawText(value, { x: (PAGE_WIDTH - width) / 2, y, font, size, color: LINE });
}

function wrap(value: string, font: PDFFont, size: number, maxWidth: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function drawWrapped(page: PDFPage, value: string, x: number, y: number, font: PDFFont, size: number, maxWidth: number, lineGap = 3) {
  const lines = wrap(value, font, size, maxWidth);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * (size + lineGap), font, size, color: LINE }));
  return y - (lines.length - 1) * (size + lineGap);
}

function drawSection(page: PDFPage, title: string, y: number, fonts: Fonts) {
  const nextY = drawWrapped(page, title, MARGIN, y, fonts.bold, 12.4, CONTENT_WIDTH);
  return nextY - 21;
}

function drawFilledField(
  page: PDFPage,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  fonts: Fonts,
  size = BODY
) {
  page.drawText(label, { x, y, font: fonts.regular, size, color: LINE });
  const labelWidth = fonts.regular.widthOfTextAtSize(label, size);
  const valueX = x + labelWidth + 4;
  const cleanValue = text(value);
  if (cleanValue) {
    drawWrapped(page, cleanValue, valueX, y, fonts.bold, size, width - labelWidth - 6);
  }
  return y - 18;
}

function drawCheckbox(page: PDFPage, x: number, y: number, checked: boolean) {
  page.drawRectangle({ x, y: y - 1, width: 9, height: 9, borderColor: LINE, borderWidth: 0.8 });
  if (checked) {
    page.drawLine({ start: { x: x + 1.6, y: y + 3 }, end: { x: x + 4, y: y }, thickness: 1, color: LINE });
    page.drawLine({ start: { x: x + 4, y }, end: { x: x + 8, y: y + 7 }, thickness: 1, color: LINE });
  }
}

function drawCheckboxLine(page: PDFPage, label: string, checked: boolean, x: number, y: number, fonts: Fonts, maxWidth = CONTENT_WIDTH - 20) {
  drawCheckbox(page, x, y, checked);
  return drawWrapped(page, label, x + 15, y, fonts.regular, BODY, maxWidth);
}

function drawCell(
  page: PDFPage,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  font: PDFFont,
  size: number,
  options: { center?: boolean; fill?: boolean } = {}
) {
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    borderColor: LINE,
    borderWidth: 0.45,
    color: options.fill ? rgb(0.95, 0.95, 0.95) : undefined,
  });
  const lines = wrap(value, font, size, width - 6).slice(0, 3);
  const blockHeight = lines.length * size + (lines.length - 1) * 2;
  const startY = y - (height - blockHeight) / 2 - size;
  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: options.center ? x + Math.max(3, (width - lineWidth) / 2) : x + 3,
      y: startY - index * (size + 2),
      font,
      size,
      color: LINE,
    });
  });
}

function drawScoreTable(page: PDFPage, records: AcademicRecord[], y: number, fonts: Fonts) {
  const cols = [28, 45, 38, 45, 60, 65, 40, 45, 45, 112];
  const x0 = MARGIN;
  const titleH = 18;
  const headerH = 28;
  const rowH = 22;
  const subjectWidth = cols.slice(1, 9).reduce((sum, item) => sum + item, 0);
  const noteX = x0 + cols.slice(0, 9).reduce((sum, item) => sum + item, 0);

  drawCell(page, "Lớp", x0, y, cols[0], titleH + headerH, fonts.bold, 8.2, { center: true, fill: true });
  drawCell(page, "Điểm các môn học tính điểm cấp THCS", x0 + cols[0], y, subjectWidth, titleH, fonts.bold, 9, {
    center: true,
    fill: true,
  });
  drawCell(page, "Ghi chú", noteX, y, cols[9], titleH + headerH, fonts.bold, 9, { center: true, fill: true });

  let x = x0 + cols[0];
  ["Ngữ văn", "Toán", "Tiếng Anh", "Khoa học tự nhiên", "Lịch sử và Địa lí", "GDCD", "Công nghệ", "Tin học"].forEach(
    (heading, index) => {
      drawCell(page, heading, x, y - titleH, cols[index + 1], headerH, fonts.bold, 7.8, { center: true, fill: true });
      x += cols[index + 1];
    }
  );

  let currentY = y - titleH - headerH;
  [6, 7, 8, 9].forEach((grade) => {
    const item = records.find((record) => record.grade === grade);
    const values = [
      String(grade),
      score(item?.literature),
      score(item?.math),
      score(item?.english),
      score(item?.naturalScience),
      score(item?.historyGeography),
      score(item?.civicEducation),
      score(item?.technology),
      score(item?.informatics),
      item?.note ?? "",
    ];
    let cellX = x0;
    values.forEach((value, index) => {
      drawCell(page, value, cellX, currentY, cols[index], rowH, index === 0 ? fonts.bold : fonts.regular, 8.6, { center: index !== 9 });
      cellX += cols[index];
    });
    currentY -= rowH;
  });
  return currentY;
}

function drawLevelTable(page: PDFPage, records: AcademicRecord[], y: number, fonts: Fonts) {
  const x0 = MARGIN;
  const first = 45;
  const sub = (CONTENT_WIDTH - first) / 8;
  const row1 = 18;
  const row2 = 18;
  const row3 = 24;

  drawCell(page, "Lớp", x0, y, first, row1 + row2, fonts.bold, 9, { center: true, fill: true });
  [6, 7, 8, 9].forEach((grade, index) => {
    drawCell(page, String(grade), x0 + first + index * sub * 2, y, sub * 2, row1, fonts.bold, 9, { center: true, fill: true });
    drawCell(page, "Học tập", x0 + first + index * sub * 2, y - row1, sub, row2, fonts.bold, 8.3, { center: true, fill: true });
    drawCell(page, "Rèn luyện", x0 + first + index * sub * 2 + sub, y - row1, sub, row2, fonts.bold, 8.3, {
      center: true,
      fill: true,
    });
  });

  const dataY = y - row1 - row2;
  drawCell(page, "Xếp loại", x0, dataY, first, row3, fonts.bold, 8.6, { center: true });
  [6, 7, 8, 9].forEach((grade, index) => {
    const item = records.find((record) => record.grade === grade);
    drawCell(
      page,
      item?.academicLevel ? ACADEMIC_LEVEL_LABELS[item.academicLevel] ?? item.academicLevel : "",
      x0 + first + index * sub * 2,
      dataY,
      sub,
      row3,
      fonts.regular,
      8.8,
      { center: true }
    );
    drawCell(
      page,
      item?.conductLevel ? ACADEMIC_LEVEL_LABELS[item.conductLevel] ?? item.conductLevel : "",
      x0 + first + index * sub * 2 + sub,
      dataY,
      sub,
      row3,
      fonts.regular,
      8.8,
      { center: true }
    );
  });
  return dataY - row3;
}

function hasPriority(application: RegistrationFormPdfApplication, types: string[]) {
  const selected = new Set<string>(application.priorities.map((priority) => priority.type));
  return types.some((type) => selected.has(type));
}

function awardText(application: RegistrationFormPdfApplication, prize: string) {
  const award = application.awards.find((item) => item.prize === prize);
  if (!award) return "";
  return [award.competitionName, award.field, award.level, award.year ? String(award.year) : ""].filter(Boolean).join(", ");
}

function drawOption(page: PDFPage, textValue: string, checked: boolean, y: number, fonts: Fonts) {
  page.drawText(textValue, { x: MARGIN + 18, y, font: fonts.regular, size: BODY, color: LINE });
  drawCheckbox(page, PAGE_WIDTH - MARGIN - 13, y, checked);
}

export async function buildRegistrationFormPdf(application: RegistrationFormPdfApplication) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("Phiếu đăng ký dự tuyển vào lớp 10 năm học 2026-2027");
  doc.setAuthor("Trường THPT Võ Văn Kiệt");
  doc.setSubject("Phiếu đăng ký dự tuyển vào lớp 10 năm học 2026-2027");

  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/LiberationSerif-Regular.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/LiberationSerif-Bold.ttf")),
  ]);
  const fonts: Fonts = {
    regular: await doc.embedFont(regularBytes),
    bold: await doc.embedFont(boldBytes),
  };

  const page1 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawCentered(page1, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", 800, fonts.bold, 13);
  drawCentered(page1, "Độc lập - Tự do - Hạnh phúc", 782, fonts.bold, 12.2);
  page1.drawLine({ start: { x: 226, y: 777 }, end: { x: 369, y: 777 }, thickness: 0.7, color: LINE });
  page1.drawRectangle({ x: PAGE_WIDTH - MARGIN - 118, y: 746, width: 118, height: 24, borderColor: LINE, borderWidth: 0.8 });
  page1.drawText(`Số phiếu: ${text(application.registrationFormNumber)}`, {
    x: PAGE_WIDTH - MARGIN - 111,
    y: 754,
    font: fonts.bold,
    size: 9.8,
    color: LINE,
  });
  drawCentered(page1, "PHIẾU ĐĂNG KÝ DỰ TUYỂN VÀO LỚP 10", 735, fonts.bold, 14.4);
  drawCentered(page1, "Năm học 2026 - 2027", 718, fonts.bold, 12);
  page1.drawLine({ start: { x: 276, y: 711 }, end: { x: 319, y: 711 }, thickness: 0.7, color: LINE });
  page1.drawText("Kính gửi: Hiệu trưởng trường THPT Võ Văn Kiệt", {
    x: MARGIN + 105,
    y: 689,
    font: fonts.bold,
    size: BODY,
    color: LINE,
  });

  let y = drawSection(page1, "I. THÔNG TIN HỌC SINH", 656, fonts);
  page1.drawRectangle({ x: MARGIN, y: 520, width: 82, height: 123, borderColor: LINE, borderWidth: 0.9 });
  page1.drawText("Ảnh 4x6", { x: MARGIN + 22, y: 578, font: fonts.regular, size: 12, color: LINE });
  const infoX = MARGIN + 96;
  y = drawFilledField(page1, "1. Họ và tên (viết in hoa):", application.fullName.toUpperCase(), infoX, y, CONTENT_WIDTH - 96, fonts);
  y = drawFilledField(page1, "2. Ngày, tháng, năm sinh:", formatDateVi(application.dateOfBirth), infoX, y, CONTENT_WIDTH - 96, fonts);
  y = drawFilledField(page1, "3. Giới tính:", GENDER_LABELS[application.gender] ?? application.gender, infoX, y, CONTENT_WIDTH - 96, fonts);
  y = drawFilledField(page1, "4. Dân tộc:", application.ethnicity, infoX, y, CONTENT_WIDTH - 96, fonts);
  y = drawFilledField(page1, "5. Nơi sinh (tỉnh/thành phố):", application.birthPlace, infoX, y, CONTENT_WIDTH - 96, fonts);
  y = drawFilledField(
    page1,
    "6. Số định danh cá nhân (hoặc số CCCD/CC):",
    application.citizenId,
    MARGIN,
    507,
    CONTENT_WIDTH,
    fonts
  );
  const issueLine = `   Ngày cấp: ${text(formatDateVi(application.issueDate))}     Nơi cấp: ${text(application.issuePlace)}`;
  page1.drawText(issueLine, { x: MARGIN, y, font: fonts.regular, size: BODY, color: LINE });

  y = drawSection(page1, "II. THÔNG TIN HỌC TẬP", y - 25, fonts);
  const schoolLine = `1. Học sinh lớp 9 trường THCS ${text(application.secondarySchool)} năm học ${text(application.schoolYear)}`;
  y = drawWrapped(page1, schoolLine, MARGIN, y, fonts.regular, BODY, CONTENT_WIDTH) - 20;
  page1.drawText("2. Kết quả học tập và rèn luyện cấp THCS", { x: MARGIN, y, font: fonts.regular, size: BODY, color: LINE });
  y -= 17;
  page1.drawText("- Điểm trung bình các môn học:", { x: MARGIN, y, font: fonts.regular, size: BODY, color: LINE });
  y -= 9;
  const records = [...application.academicRecords].sort((a, b) => a.grade - b.grade);
  y = drawScoreTable(page1, records, y, fonts) - 16;
  page1.drawText("- Xếp loại học tập và rèn luyện cuối năm các lớp cấp THCS:", {
    x: MARGIN,
    y,
    font: fonts.regular,
    size: BODY,
    color: LINE,
  });
  y -= 9;
  y = drawLevelTable(page1, records, y, fonts) - 20;

  y = drawSection(page1, "III. THÔNG TIN LIÊN HỆ", y, fonts);
  const addressParts = {
    houseNumber: text(application.houseNumber),
    hamlet: text(application.hamlet),
    ward: text(application.ward),
    province: text(application.province),
  };
  const addressLine =
    addressParts.houseNumber || addressParts.hamlet || addressParts.ward || addressParts.province
      ? `1. Địa chỉ thường trú: Số nhà ${addressParts.houseNumber}, ấp/khóm ${addressParts.hamlet}; xã/phường ${addressParts.ward}, tỉnh/thành phố ${addressParts.province}.`
      : `1. Địa chỉ thường trú: ${text(application.permanentAddress)}`;
  drawWrapped(page1, addressLine, MARGIN, y, fonts.regular, BODY, CONTENT_WIDTH);

  const page2 = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  y = 792;
  y = drawFilledField(page2, "2. Số điện thoại thí sinh:", application.studentPhone ?? "", MARGIN, y, CONTENT_WIDTH, fonts);
  y = drawFilledField(page2, "3. Địa chỉ email:", application.email ?? "", MARGIN, y, CONTENT_WIDTH, fonts);
  y = drawFilledField(page2, "4. Họ tên cha mẹ/người giám hộ:", application.guardianName, MARGIN, y, CONTENT_WIDTH, fonts);
  y = drawFilledField(page2, "   Điện thoại liên hệ:", application.guardianPhone, MARGIN + 24, y, CONTENT_WIDTH - 24, fonts);

  y = drawSection(page2, "IV. ĐỐI TƯỢNG ƯU TIÊN, KHUYẾN KHÍCH (nếu có)", y - 10, fonts);
  page2.drawText("1. Đối tượng ưu tiên", { x: MARGIN, y, font: fonts.bold, size: BODY, color: LINE });
  y -= 20;
  y = drawCheckboxLine(
    page2,
    "Con thương binh/liệt sĩ;",
    hasPriority(application, ["CON_THUONG_BINH_LIET_SI", "CON_LIET_SI", "CON_THUONG_BINH_BENH_BINH", "CON_ANH_HUNG_LLD_BA_ME_VNAH"]),
    MARGIN + 26,
    y,
    fonts
  ) - 18;
  y = drawCheckboxLine(page2, "Dân tộc thiểu số (Khơ me, Hoa, dân tộc khác);", hasPriority(application, ["DAN_TOC_THIEU_SO"]), MARGIN + 26, y, fonts) - 18;
  y = drawCheckboxLine(
    page2,
    "Có cha hoặc mẹ là người dân tộc thiểu số;",
    hasPriority(application, ["CHA_ME_DAN_TOC_THIEU_SO"]),
    MARGIN + 26,
    y,
    fonts
  ) - 18;
  y =
    drawCheckboxLine(
      page2,
      "Học sinh ở vùng có điều kiện kinh tế - xã hội đặc biệt khó khăn (ấp Vĩnh Lộc; ấp Vĩnh Phú B; ấp Long Đức).",
      hasPriority(application, ["VUNG_DAC_BIET_KHO_KHAN"]),
      MARGIN + 26,
      y,
      fonts,
      CONTENT_WIDTH - 42
    ) - 22;

  y =
    drawWrapped(
      page2,
      "2. Đối tượng khuyến khích: Đạt giải cấp tỉnh trở lên các môn văn hóa, năng khiếu (ghi thêm môn đạt giải).",
      MARGIN,
      y,
      fonts.bold,
      BODY,
      CONTENT_WIDTH
    ) - 20;
  y = drawFilledField(page2, "- Giải nhất (cộng 1,5 điểm):", awardText(application, "GIAI_NHAT"), MARGIN + 14, y, CONTENT_WIDTH - 14, fonts);
  y = drawFilledField(page2, "- Giải nhì (cộng 1,0 điểm):", awardText(application, "GIAI_NHI"), MARGIN + 14, y, CONTENT_WIDTH - 14, fonts);
  y = drawFilledField(page2, "- Giải ba (cộng 0,5 điểm):", awardText(application, "GIAI_BA"), MARGIN + 14, y, CONTENT_WIDTH - 14, fonts);

  page2.drawText("3. Đối tượng khác cần lưu ý trong công tác tuyển sinh lớp 10:", {
    x: MARGIN,
    y,
    font: fonts.bold,
    size: BODY,
    color: LINE,
  });
  y -= 20;
  const otherOptions = [
    { label: "Hộ nghèo;", types: ["HO_NGHEO"] },
    { label: "Hộ cận nghèo;", types: ["HO_CAN_NGHEO"] },
    { label: "Mồ côi cha hoặc mẹ;", types: ["MO_COI_CHA_HOAC_ME"] },
    { label: "Mồ côi cha lẫn mẹ.", types: ["MO_COI_CHA_LAN_ME"] },
  ];
  otherOptions.forEach((option, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + 18 + col * 245;
    const optionY = y - row * 19;
    drawCheckbox(page2, x, optionY, hasPriority(application, option.types));
    page2.drawText(option.label, { x: x + 13, y: optionY, font: fonts.regular, size: BODY, color: LINE });
  });
  y -= 55;

  y = drawSection(page2, "V. NGUYỆN VỌNG HỌC CÁC MÔN LỰA CHỌN LỚP 10 (nếu trúng tuyển)", y, fonts);
  page2.drawText("Học sinh chọn môn lựa chọn học ở lớp 10, tích dấu X vào Phương án sau:", {
    x: MARGIN,
    y,
    font: fonts.regular,
    size: BODY,
    color: LINE,
  });
  y -= 22;
  SUBJECT_OPTIONS.forEach((option) => {
    drawOption(
      page2,
      `${option.optionNumber}. Phương án ${option.optionNumber}: ${option.subjects}:`,
      option.optionNumber === application.selectedOptionNumber,
      y,
      fonts
    );
    y -= 20;
  });

  y -= 4;
  y =
    drawWrapped(
      page2,
      "Tôi xin cam đoan những thông tin khai trên là đúng sự thật. Nếu trúng tuyển vào lớp 10 của trường, tôi sẽ chấp hành nghiêm túc các quy định của nhà trường.",
      MARGIN,
      y,
      fonts.regular,
      BODY,
      CONTENT_WIDTH
    ) - 35;
  drawCentered(page2, formatLongDateVi(application.submittedAt), y, fonts.regular, BODY);
  y -= 34;
  const leftX = MARGIN + 20;
  const rightX = PAGE_WIDTH / 2 + 38;
  page2.drawText("XÁC NHẬN CỦA CHA/MẸ (NGƯỜI GIÁM HỘ)", { x: leftX - 18, y, font: fonts.bold, size: 10.8, color: LINE });
  page2.drawText("NGƯỜI LÀM ĐƠN", { x: rightX + 32, y, font: fonts.bold, size: 10.8, color: LINE });
  page2.drawText("(Ký và ghi rõ họ tên)", { x: leftX + 38, y: y - 16, font: fonts.regular, size: SMALL, color: LINE });
  page2.drawText("(Ký và ghi rõ họ tên)", { x: rightX + 24, y: y - 16, font: fonts.regular, size: SMALL, color: LINE });

  return doc.save();
}

export function registrationFormPdfFilename(applicationCode: string) {
  return `phieu-dang-ky-du-tuyen-lop-10-vvk-2026-${applicationCode}.pdf`;
}
