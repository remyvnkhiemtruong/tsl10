import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const applications = await prisma.application.findMany({
    where: { deletedAt: null, admissionPublished: true, admissionResult: "TRUNG_TUYEN" },
    orderBy: [
      { admissionBatch: "asc" },
      { admissionRank: "asc" },
      { admissionScoreSnapshot: "desc" },
      { fullName: "asc" },
    ],
    select: {
      admissionRank: true,
      applicationCode: true,
      fullName: true,
      dateOfBirth: true,
      secondarySchool: true,
      selectedOptionNumber: true,
      selectedSubjects: true,
      admissionBatch: true,
      admissionScoreSnapshot: true,
      admissionPublicNote: true,
    },
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Trường THPT Võ Văn Kiệt";
  const sheet = workbook.addWorksheet("Trung tuyển");
  sheet.columns = [
    { header: "STT", key: "index", width: 8 },
    { header: "Thứ hạng", key: "rank", width: 12 },
    { header: "Mã hồ sơ", key: "applicationCode", width: 18 },
    { header: "Họ và tên", key: "fullName", width: 28 },
    { header: "Ngày sinh", key: "dateOfBirth", width: 15 },
    { header: "Trường THCS", key: "secondarySchool", width: 32 },
    { header: "Phương án", key: "selectedOptionNumber", width: 12 },
    { header: "Môn lựa chọn", key: "selectedSubjects", width: 44 },
    { header: "Đợt xét tuyển", key: "admissionBatch", width: 16 },
    { header: "Điểm xét tuyển", key: "admissionScore", width: 16 },
    { header: "Ghi chú công khai", key: "publicNote", width: 36 },
  ];
  applications.forEach((app, index) => {
    sheet.addRow({
      index: index + 1,
      rank: app.admissionRank ?? "",
      applicationCode: app.applicationCode,
      fullName: app.fullName,
      dateOfBirth: app.dateOfBirth.toLocaleDateString("vi-VN"),
      secondarySchool: app.secondarySchool,
      selectedOptionNumber: app.selectedOptionNumber,
      selectedSubjects: app.selectedSubjects,
      admissionBatch: app.admissionBatch ?? "",
      admissionScore: app.admissionScoreSnapshot ?? "",
      publicNote: app.admissionPublicNote ?? "",
    });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=bang-xep-hang-trung-tuyen-vvk-2026.xlsx",
    },
  });
}
