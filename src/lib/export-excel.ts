import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { calculateAdmissionScoreDetails } from "@/lib/admission-score";
import { STATUS_LABELS } from "@/lib/constants";

type ApplicationExportRow = Prisma.ApplicationGetPayload<{
  include: { academicRecords: true };
}>;

export async function buildApplicationsWorkbook(applications: ApplicationExportRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "THPT Võ Văn Kiệt";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Danh sách hồ sơ");

  sheet.columns = [
    { header: "Mã hồ sơ", key: "applicationCode", width: 18 },
    { header: "Họ tên", key: "fullName", width: 28 },
    { header: "Ngày sinh", key: "dateOfBirth", width: 15 },
    { header: "Số định danh", key: "citizenId", width: 18 },
    { header: "Trường THCS", key: "secondarySchool", width: 28 },
    { header: "Số nhà", key: "houseNumber", width: 18 },
    { header: "Ấp/khóm", key: "hamlet", width: 22 },
    { header: "Xã/phường", key: "ward", width: 20 },
    { header: "Tỉnh/thành phố", key: "province", width: 20 },
    { header: "Địa chỉ thường trú ghép", key: "permanentAddress", width: 38 },
    { header: "Email thí sinh", key: "email", width: 28 },
    { header: "SĐT học sinh", key: "studentPhone", width: 16 },
    { header: "Phụ huynh", key: "guardianName", width: 24 },
    { header: "SĐT phụ huynh", key: "guardianPhone", width: 16 },
    { header: "Phương án", key: "selectedOptionNumber", width: 12 },
    { header: "Môn lựa chọn", key: "selectedSubjects", width: 44 },
    { header: "A", key: "academicAverageSum", width: 10 },
    { header: "B", key: "convertedScoreSum", width: 10 },
    { header: "C", key: "bonusScore", width: 10 },
    { header: "Tổng điểm xét tuyển dự kiến", key: "totalScore", width: 22 },
    { header: "Trạng thái", key: "status", width: 20 },
    { header: "Ngày nộp", key: "submittedAt", width: 18 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1D4ED8" },
  };

  for (const app of applications) {
    const scoreDetails = calculateAdmissionScoreDetails(app.academicRecords, app.bonusScore);
    sheet.addRow({
      applicationCode: app.applicationCode,
      fullName: app.fullName,
      dateOfBirth: app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString("vi-VN") : "",
      citizenId: app.citizenId,
      secondarySchool: app.secondarySchool,
      houseNumber: app.houseNumber ?? "",
      hamlet: app.hamlet ?? "",
      ward: app.ward ?? "",
      province: app.province ?? "",
      permanentAddress: app.permanentAddress,
      email: app.email ?? "",
      studentPhone: app.studentPhone ?? "",
      guardianName: app.guardianName,
      guardianPhone: app.guardianPhone,
      selectedOptionNumber: app.selectedOptionNumber,
      selectedSubjects: app.selectedSubjects,
      academicAverageSum: scoreDetails.academicAverageSum,
      convertedScoreSum: scoreDetails.convertedScoreSum,
      bonusScore: scoreDetails.bonusScore,
      totalScore: scoreDetails.totalScore,
      status: STATUS_LABELS[app.status] ?? app.status,
      submittedAt: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("vi-VN") : "",
    });
  }

  sheet.autoFilter = {
    from: "A1",
    to: "V1",
  };

  return workbook;
}
