import ExcelJS from "exceljs";
import type { Application } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/constants";

type ApplicationExportRow = Pick<
  Application,
  | "applicationCode"
  | "fullName"
  | "dateOfBirth"
  | "citizenId"
  | "secondarySchool"
  | "ward"
  | "studentPhone"
  | "guardianName"
  | "guardianPhone"
  | "selectedOptionNumber"
  | "selectedSubjects"
  | "bonusScore"
  | "status"
  | "submittedAt"
>;

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
    { header: "Xã/phường", key: "ward", width: 20 },
    { header: "SĐT học sinh", key: "studentPhone", width: 16 },
    { header: "Phụ huynh", key: "guardianName", width: 24 },
    { header: "SĐT phụ huynh", key: "guardianPhone", width: 16 },
    { header: "Phương án", key: "selectedOptionNumber", width: 12 },
    { header: "Môn lựa chọn", key: "selectedSubjects", width: 44 },
    { header: "Điểm KK", key: "bonusScore", width: 10 },
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
    sheet.addRow({
      applicationCode: app.applicationCode,
      fullName: app.fullName,
      dateOfBirth: app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString("vi-VN") : "",
      citizenId: app.citizenId,
      secondarySchool: app.secondarySchool,
      ward: app.ward ?? "",
      studentPhone: app.studentPhone ?? "",
      guardianName: app.guardianName,
      guardianPhone: app.guardianPhone,
      selectedOptionNumber: app.selectedOptionNumber,
      selectedSubjects: app.selectedSubjects,
      bonusScore: app.bonusScore,
      status: STATUS_LABELS[app.status] ?? app.status,
      submittedAt: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("vi-VN") : "",
    });
  }

  sheet.autoFilter = {
    from: "A1",
    to: "N1",
  };

  return workbook;
}
