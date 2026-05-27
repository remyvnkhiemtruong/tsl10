import { z } from "zod";
import {
  ALL_FILE_TYPES,
  ALL_PRIORITY_TYPES,
  PRIZE_SCORES,
  SUBJECT_OPTIONS
} from "@/lib/constants";

const fileTypeSchema = z.enum(ALL_FILE_TYPES as [string, ...string[]]);
const priorityTypeSchema = z.enum(ALL_PRIORITY_TYPES as [string, ...string[]]);
const applicationStatusSchema = z.enum([
  "CHO_KIEM_TRA",
  "DANG_XU_LY",
  "CAN_BO_SUNG",
  "DA_TIEP_NHAN",
  "HOP_LE",
  "KHONG_HOP_LE",
  "DA_DUYET_XET_TUYEN"
]);
const fileStatusSchema = z.enum(["CHUA_KIEM_TRA", "HOP_LE", "KHONG_HOP_LE", "CAN_BO_SUNG"]);

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} là thông tin bắt buộc`);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const dateString = (label: string) =>
  requiredText(label).refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} không hợp lệ`);

const number0to10 = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return Number(value);
}, z.number().min(0, "Điểm tối thiểu là 0").max(10, "Điểm tối đa là 10").optional());

export const uploadedFileInputSchema = z.object({
  fileType: fileTypeSchema,
  originalName: requiredText("Tên file"),
  storedName: requiredText("Tên lưu trữ"),
  mimeType: requiredText("Định dạng file"),
  size: z.number().int().positive(),
  storageKey: requiredText("Mã lưu trữ file"),
  storageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]).optional(),
  publicUrl: z.string().url().optional().or(z.literal(""))
});

export type UploadedFileInput = z.infer<typeof uploadedFileInputSchema>;

export const academicRecordInputSchema = z.object({
  grade: z.number().int().min(6).max(9),
  literature: number0to10,
  math: number0to10,
  english: number0to10,
  naturalScience: number0to10,
  historyGeography: number0to10,
  civicEducation: number0to10,
  technology: number0to10,
  informatics: number0to10,
  note: optionalText,
  academicLevel: z.enum(["TOT", "KHA", "DAT", "CHUA_DAT"]).optional(),
  conductLevel: z.enum(["TOT", "KHA", "DAT", "CHUA_DAT"]).optional()
});

export type AcademicRecordInput = z.infer<typeof academicRecordInputSchema>;

export const awardInputSchema = z.object({
  competitionName: requiredText("Tên cuộc thi/giải thưởng"),
  field: optionalText,
  level: optionalText,
  year: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    return Number(value);
  }, z.number().int().min(2000).max(2100).optional()),
  prize: z.enum(["GIAI_NHAT", "GIAI_NHI", "GIAI_BA"])
});

export type AwardInput = z.infer<typeof awardInputSchema>;

export const applicationCreateSchema = z
  .object({
    fullName: requiredText("Họ và tên").min(2, "Họ và tên quá ngắn").transform((value) => value.toUpperCase()),
    dateOfBirth: dateString("Ngày sinh"),
    gender: z.enum(["NAM", "NU", "KHAC"]),
    ethnicity: requiredText("Dân tộc"),
    birthPlace: requiredText("Nơi sinh"),
    citizenId: z.string().trim().regex(/^\d{9,12}$/, "Số định danh/CCCD phải gồm 9-12 chữ số"),
    issueDate: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Ngày cấp không hợp lệ"),
    issuePlace: optionalText,
    secondarySchool: requiredText("Trường THCS"),
    schoolYear: requiredText("Năm học"),
    permanentAddress: requiredText("Địa chỉ thường trú"),
    houseNumber: optionalText,
    hamlet: optionalText,
    ward: optionalText,
    province: optionalText,
    studentPhone: optionalText,
    email: z.string().trim().email("Email không hợp lệ").optional().or(z.literal("")),
    guardianName: requiredText("Cha/mẹ/người giám hộ"),
    guardianPhone: z.string().trim().min(8, "Số điện thoại liên hệ chưa hợp lệ"),
    priorities: z.array(priorityTypeSchema).default([]),
    awards: z.array(awardInputSchema).default([]),
    academicRecords: z.array(academicRecordInputSchema).length(4, "Cần đủ điểm lớp 6, 7, 8, 9"),
    selectedOptionNumber: z.number().int().min(1).max(6),
    selectedSubjects: requiredText("Phương án môn học"),
    uploadedFiles: z.array(uploadedFileInputSchema).default([]),
    commitmentAccepted: z.literal(true, { error: "Cần xác nhận cam kết trước khi nộp" })
  })
  .superRefine((value, ctx) => {
    const selected = SUBJECT_OPTIONS.find((option) => option.optionNumber === value.selectedOptionNumber);
    if (!selected || selected.subjects !== value.selectedSubjects) {
      ctx.addIssue({
        code: "custom",
        path: ["selectedOptionNumber"],
        message: "Phương án môn học không hợp lệ"
      });
    }

    const grades = new Set(value.academicRecords.map((record) => record.grade));
    for (const grade of [6, 7, 8, 9]) {
      if (!grades.has(grade)) {
        ctx.addIssue({
          code: "custom",
          path: ["academicRecords"],
          message: `Thiếu kết quả học tập lớp ${grade}`
        });
      }
    }

    const fileTypes = new Set(value.uploadedFiles.map((file) => file.fileType));
    const hasFullAcademicPdf = fileTypes.has("HOC_BA_THCS");
    const hasAllGradeImages = [6, 7, 8, 9].every((grade) => fileTypes.has(`HOC_BA_LOP_${grade}`));

    if (!fileTypes.has("PHOTO_4X6")) {
      ctx.addIssue({ code: "custom", path: ["uploadedFiles"], message: "Cần tải lên ảnh 4x6" });
    }
    if (!hasFullAcademicPdf && !hasAllGradeImages) {
      ctx.addIssue({
        code: "custom",
        path: ["uploadedFiles"],
        message: "Cần tải học bạ THCS dạng PDF hoặc đủ ảnh học bạ lớp 6, 7, 8, 9"
      });
    }
    if (!fileTypes.has("GIAY_KHAI_SINH") && !fileTypes.has("CCCD")) {
      ctx.addIssue({
        code: "custom",
        path: ["uploadedFiles"],
        message: "Cần tải lên giấy khai sinh hoặc CCCD/số định danh"
      });
    }
    if (value.priorities.length > 0 && !fileTypes.has("MINH_CHUNG_UU_TIEN")) {
      ctx.addIssue({
        code: "custom",
        path: ["uploadedFiles"],
        message: "Cần tải minh chứng cho đối tượng ưu tiên/đối tượng khác đã chọn"
      });
    }
    if (
      (value.priorities.includes("HO_NGHEO") || value.priorities.includes("HO_CAN_NGHEO")) &&
      !fileTypes.has("HO_NGHEO_CAN_NGHEO")
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["uploadedFiles"],
        message: "Cần tải giấy xác nhận hộ nghèo/cận nghèo"
      });
    }
    if (value.awards.length > 0 && !fileTypes.has("MINH_CHUNG_KHUYEN_KHICH")) {
      ctx.addIssue({
        code: "custom",
        path: ["uploadedFiles"],
        message: "Cần tải minh chứng điểm khuyến khích"
      });
    }
  });

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;

export const lookupSchema = z.object({
  applicationCode: requiredText("Mã hồ sơ"),
  citizenId: z.string().trim().min(9, "Số định danh chưa hợp lệ"),
  dateOfBirth: dateString("Ngày sinh")
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu là thông tin bắt buộc")
});

export const applicationUpdateSchema = z.object({
  status: applicationStatusSchema,
  publicNote: z.string().trim().optional(),
  internalNote: z.string().trim().optional()
});

export const fileReviewSchema = z.object({
  status: fileStatusSchema,
  note: z.string().trim().optional()
});

export function prizeScore(prize: string) {
  return PRIZE_SCORES[prize] ?? 0;
}
