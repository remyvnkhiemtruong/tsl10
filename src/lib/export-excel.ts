import ExcelJS from "exceljs";
import type { Prisma } from "@prisma/client";
import { calculateAdmissionScoreDetails } from "@/lib/admission-score";
import {
  ADMISSION_PUBLICATION_LABELS,
  ADMISSION_RESULT_LABELS,
  GENDER_LABELS,
  PHYSICAL_DOSSIER_LABELS,
  PHYSICAL_DOSSIER_VALIDITY_LABELS,
  PRIORITY_LABELS,
  PRIZE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";

type ApplicationExportRow = Prisma.ApplicationGetPayload<{
  include: { academicRecords: true; priorities: true; awards: true; files: true };
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
    { header: "Giới tính", key: "gender", width: 12 },
    { header: "Nơi sinh", key: "birthPlace", width: 20 },
    { header: "Số định danh", key: "citizenId", width: 18 },
    { header: "Nơi cấp", key: "issuePlace", width: 32 },
    { header: "Trường THCS", key: "secondarySchool", width: 28 },
    { header: "Địa chỉ cũ trường THCS", key: "secondarySchoolOldAddress", width: 36 },
    { header: "Địa chỉ mới trường THCS", key: "secondarySchoolAddress", width: 36 },
    { header: "Năm học lớp 9", key: "schoolYear", width: 16 },
    { header: "Số nhà", key: "houseNumber", width: 18 },
    { header: "Ấp/khóm", key: "hamlet", width: 22 },
    { header: "Xã/phường", key: "ward", width: 20 },
    { header: "Tỉnh/thành phố", key: "province", width: 20 },
    { header: "Địa chỉ thường trú ghép", key: "permanentAddress", width: 38 },
    { header: "Email thí sinh", key: "email", width: 28 },
    { header: "Số điện thoại thí sinh", key: "studentPhone", width: 20 },
    { header: "Phụ huynh", key: "guardianName", width: 24 },
    { header: "Số điện thoại phụ huynh", key: "guardianPhone", width: 22 },
    { header: "Phương án", key: "selectedOptionNumber", width: 12 },
    { header: "Môn lựa chọn", key: "selectedSubjects", width: 44 },
    { header: "Diện ưu tiên", key: "priorities", width: 42 },
    { header: "Giải thưởng được cộng điểm", key: "award", width: 36 },
    { header: "Ghi chú giải thưởng khác", key: "additionalAwardsNote", width: 36 },
    { header: "Tình trạng học bạ", key: "transcriptStatus", width: 26 },
    { header: "A", key: "academicAverageSum", width: 10 },
    { header: "B", key: "convertedScoreSum", width: 10 },
    { header: "C", key: "bonusScore", width: 10 },
    { header: "Tổng điểm xét tuyển dự kiến", key: "totalScore", width: 22 },
    { header: "Trạng thái", key: "status", width: 20 },
    { header: "Kết quả tuyển sinh", key: "admissionResult", width: 20 },
    { header: "Trạng thái công bố", key: "admissionPublished", width: 18 },
    { header: "Trạng thái nộp hồ sơ trực tiếp", key: "physicalDossierStatus", width: 28 },
    { header: "Trạng thái hợp lệ hồ sơ trực tiếp", key: "physicalDossierValidity", width: 28 },
    { header: "Ngày tiếp nhận hồ sơ trực tiếp", key: "physicalDossierReceivedAt", width: 24 },
    { header: "Ghi chú công khai hồ sơ trực tiếp", key: "physicalDossierPublicNote", width: 36 },
    { header: "Ghi chú nội bộ hồ sơ trực tiếp", key: "physicalDossierInternalNote", width: 36 },
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
    const award = app.awards[0];
    const hasTranscript = app.files.some((file) => file.fileType === "HOC_BA_THCS" || file.fileType.startsWith("HOC_BA_LOP_"));
    sheet.addRow({
      applicationCode: app.applicationCode,
      fullName: app.fullName,
      dateOfBirth: app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString("vi-VN") : "",
      gender: GENDER_LABELS[app.gender] ?? app.gender,
      birthPlace: app.birthPlace,
      citizenId: app.citizenId,
      issuePlace: app.issuePlace ?? "",
      secondarySchool: app.secondarySchool,
      secondarySchoolOldAddress: app.secondarySchoolOldAddress ?? "",
      secondarySchoolAddress: app.secondarySchoolAddress ?? "",
      schoolYear: app.schoolYear,
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
      priorities: app.priorities.map((priority) => PRIORITY_LABELS[priority.type] ?? priority.type).join("; "),
      award: award ? `${award.competitionName} - ${PRIZE_LABELS[award.prize] ?? award.prize} (${award.bonusScore} điểm)` : "",
      additionalAwardsNote: app.additionalAwardsNote ?? "",
      transcriptStatus: hasTranscript ? "Đã có học bạ" : "Chưa có học bạ - không bắt buộc",
      academicAverageSum: scoreDetails.academicAverageSum,
      convertedScoreSum: scoreDetails.convertedScoreSum,
      bonusScore: scoreDetails.bonusScore,
      totalScore: scoreDetails.totalScore,
      status: STATUS_LABELS[app.status] ?? app.status,
      admissionResult: ADMISSION_RESULT_LABELS[app.admissionResult] ?? app.admissionResult,
      admissionPublished: app.admissionPublished
        ? ADMISSION_PUBLICATION_LABELS.DA_CONG_BO
        : app.admissionPublishedAt
          ? ADMISSION_PUBLICATION_LABELS.DA_GO_CONG_BO
          : ADMISSION_PUBLICATION_LABELS.CHUA_CONG_BO,
      physicalDossierStatus: PHYSICAL_DOSSIER_LABELS[app.physicalDossierStatus] ?? app.physicalDossierStatus,
      physicalDossierValidity: PHYSICAL_DOSSIER_VALIDITY_LABELS[app.physicalDossierValidity] ?? app.physicalDossierValidity,
      physicalDossierReceivedAt: app.physicalDossierReceivedAt ? new Date(app.physicalDossierReceivedAt).toLocaleDateString("vi-VN") : "",
      physicalDossierPublicNote: app.physicalDossierPublicNote ?? "",
      physicalDossierInternalNote: app.physicalDossierInternalNote ?? "",
      submittedAt: app.submittedAt ? new Date(app.submittedAt).toLocaleDateString("vi-VN") : "",
    });
  }

  sheet.autoFilter = {
    from: "A1",
    to: "AO1",
  };

  return workbook;
}
