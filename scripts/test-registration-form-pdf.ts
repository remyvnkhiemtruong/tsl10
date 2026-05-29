import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildRegistrationFormPdf } from "../src/lib/registration-form-pdf";

function academicRecords(overrides: Partial<Record<number, { literature?: number | null; note?: string }>> = {}) {
  return [6, 7, 8, 9].map((grade) => ({
    id: `record-${grade}`,
    applicationId: "test",
    grade,
    literature: overrides[grade]?.literature ?? 8,
    math: 8,
    english: 8,
    naturalScience: 8,
    historyGeography: 8,
    civicEducation: 8,
    technology: 8,
    informatics: 8,
    note: overrides[grade]?.note ?? "",
    academicLevel: "TOT",
    conductLevel: "TOT",
  }));
}

function baseApplication() {
  return {
    id: "test",
    applicationCode: "VK2026-000001",
    registrationFormNumber: "001",
    status: "CHO_KIEM_TRA",
    fullName: "NGUYỄN VĂN A",
    dateOfBirth: new Date("2011-01-01"),
    gender: "NAM",
    ethnicity: "Kinh",
    birthPlace: "Cà Mau",
    citizenId: "012345678901",
    issueDate: new Date("2025-01-01"),
    issuePlace: "Bộ Công an",
    secondarySchool: "THCS Phan Bội Châu",
    secondarySchoolOldAddress: "Phường 1/2, TP Cà Mau, Cà Mau cũ",
    secondarySchoolAddress: "Phường An Xuyên, tỉnh Cà Mau",
    schoolYear: "2025 - 2026",
    permanentAddress: "Số 1, Ấp Long Hòa, Xã Phước Long, Cà Mau",
    houseNumber: "Số 1",
    hamlet: "Ấp Long Hòa",
    ward: "Xã Phước Long",
    province: "Cà Mau",
    studentPhone: "0912345678",
    email: "hocsinh@example.com",
    guardianName: "Nguyễn Văn B",
    guardianPhone: "0987654321",
    selectedOptionNumber: 1,
    selectedSubjects: "Vật lí; Hoá học; Tin học; Công nghệ Công nghiệp",
    bonusScore: 1.5,
    additionalAwardsNote: "",
    commitmentAccepted: true,
    publicNote: null,
    internalNote: null,
    deletedAt: null,
    deletedById: null,
    deleteReason: null,
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    admissionResult: "CHUA_XET",
    admissionPublished: false,
    admissionPublishedAt: null,
    admissionPublishedById: null,
    admissionDecisionAt: null,
    admissionDecisionById: null,
    admissionNote: null,
    admissionPublicNote: null,
    admissionRank: null,
    admissionBatch: null,
    admissionScoreSnapshot: null,
    physicalDossierStatus: "CHUA_NOP_TRUC_TIEP",
    physicalDossierValidity: "CHUA_KIEM_TRA",
    physicalDossierReceivedAt: null,
    physicalDossierReceivedById: null,
    physicalDossierCheckedAt: null,
    physicalDossierCheckedById: null,
    physicalDossierPublicNote: null,
    physicalDossierInternalNote: null,
    registrationFormPdfPrintedAt: null,
    academicRecords: academicRecords(),
    priorities: [],
    awards: [],
    files: [],
    logs: [],
  };
}

const cases = [
  {
    name: "full-option-1",
    app: {
      ...baseApplication(),
      priorities: [{ id: "p1", applicationId: "test", type: "VUNG_DAC_BIET_KHO_KHAN", description: null }],
      awards: [
        {
          id: "award",
          applicationId: "test",
          competitionName: "Học sinh giỏi cấp tỉnh",
          field: "Tin học",
          level: "Tỉnh",
          year: 2026,
          prize: "GIAI_NHAT",
          bonusScore: 1.5,
        },
      ],
    },
  },
  {
    name: "missing-optional",
    app: {
      ...baseApplication(),
      registrationFormNumber: "002",
      applicationCode: "VK2026-000002",
      issueDate: null,
      issuePlace: null,
      email: null,
      studentPhone: null,
      academicRecords: academicRecords({ 8: { literature: null, note: "Thiếu điểm" } }),
    },
  },
  {
    name: "priority-award",
    app: {
      ...baseApplication(),
      registrationFormNumber: "003",
      applicationCode: "VK2026-000003",
      priorities: [
        { id: "p1", applicationId: "test", type: "DAN_TOC_THIEU_SO", description: null },
        { id: "p2", applicationId: "test", type: "HO_NGHEO", description: null },
        { id: "p3", applicationId: "test", type: "MO_COI_CHA_HOAC_ME", description: null },
      ],
      awards: [
        {
          id: "award",
          applicationId: "test",
          competitionName: "Cuộc thi khoa học kỹ thuật",
          field: "Khoa học tự nhiên",
          level: "Tỉnh",
          year: 2025,
          prize: "GIAI_BA",
          bonusScore: 0.5,
        },
      ],
    },
  },
  {
    name: "option-6",
    app: {
      ...baseApplication(),
      registrationFormNumber: "004",
      applicationCode: "VK2026-000004",
      selectedOptionNumber: 6,
      selectedSubjects: "GDKT&PL; Mĩ thuật; Tin học; Địa lí",
    },
  },
];

const outputDir = path.join(process.cwd(), ".data", "pdf-tests");
await mkdir(outputDir, { recursive: true });

for (const item of cases) {
  const pdf = await buildRegistrationFormPdf(item.app as never);
  const header = Buffer.from(pdf.slice(0, 4)).toString("utf8");
  if (header !== "%PDF") throw new Error(`${item.name}: PDF header không hợp lệ`);
  if (pdf.length < 20000) throw new Error(`${item.name}: PDF quá nhỏ, có thể sinh lỗi`);
  await writeFile(path.join(outputDir, `${item.name}.pdf`), pdf);
  console.log(`${item.name}: OK (${pdf.length} bytes)`);
}

console.log(`registration-form-pdf OK (${cases.length} files in ${outputDir})`);
