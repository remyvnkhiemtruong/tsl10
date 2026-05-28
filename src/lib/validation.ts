import { z } from "zod";
import {
  ALLOWED_MIME_TYPES,
  ADMISSION_BATCH_OPTIONS,
  ADMISSION_RESULT_STATUSES,
  ALL_FILE_TYPES,
  ALL_PRIORITY_TYPES,
  FILE_SIZE_LIMITS_MB,
  ISSUE_PLACE_OPTIONS,
  PHYSICAL_DOSSIER_STATUSES,
  PHYSICAL_DOSSIER_VALIDITY_STATUSES,
  PRIZE_SCORES,
  SCHOOL_YEAR_OPTIONS,
  SUBJECT_OPTIONS,
} from "@/lib/constants";
import { PROVINCES_2025, WARD_OTHER_VALUE, isKnownProvinceName } from "@/lib/administrative-units";
import { isKnownWardName } from "@/lib/administrative-wards";

const fileTypeSchema = z.enum(ALL_FILE_TYPES as [string, ...string[]]);
const priorityTypeSchema = z.enum(ALL_PRIORITY_TYPES as [string, ...string[]]);
const provinceSchema = z.enum(PROVINCES_2025, { error: "Tỉnh/thành phố không hợp lệ" });
const schoolYearSchema = z.enum(SCHOOL_YEAR_OPTIONS, { error: "Năm học lớp 9 không hợp lệ" });
const academicLevelSchema = z.enum(["TOT", "KHA", "DAT", "CHUA_DAT"]);
const applicationStatusSchema = z.enum([
  "CHO_KIEM_TRA",
  "DANG_XU_LY",
  "CAN_BO_SUNG",
  "DA_TIEP_NHAN",
  "HOP_LE",
  "KHONG_HOP_LE",
  "DA_DUYET_XET_TUYEN",
]);
const fileStatusSchema = z.enum(["CHUA_KIEM_TRA", "HOP_LE", "KHONG_HOP_LE", "CAN_BO_SUNG"]);
const admissionResultStatusSchema = z.enum(ADMISSION_RESULT_STATUSES);
const admissionBatchSchema = z.enum(ADMISSION_BATCH_OPTIONS).optional().or(z.literal(""));
const physicalDossierStatusSchema = z.enum(PHYSICAL_DOSSIER_STATUSES);
const physicalDossierValiditySchema = z.enum(PHYSICAL_DOSSIER_VALIDITY_STATUSES);

const requiredText = (label: string) => z.string().trim().min(1, `${label} là thông tin bắt buộc`);

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Ngày cấp không hợp lệ")
  .transform((value) => value || undefined);

const dateString = (label: string) =>
  requiredText(label).refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} không hợp lệ`);

function normalizePhoneValue(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

const requiredScore = (label: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    },
    z
      .number({ error: `${label} là thông tin bắt buộc` })
      .min(0, "Điểm tối thiểu là 0")
      .max(10, "Điểm tối đa là 10")
  );

const phoneSchema = (label: string) =>
  requiredText(label)
    .refine((value) => /^\+?[\d\s.-]+$/.test(value), `${label} chưa hợp lệ`)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 9 && digits.length <= 15;
    }, `${label} chưa hợp lệ`)
    .transform(normalizePhoneValue);

const requiredEmail = z
  .string()
  .trim()
  .min(1, "Email thí sinh là thông tin bắt buộc")
  .email("Email thí sinh không hợp lệ")
  .transform((value) => value.toLowerCase());

export const uploadedFileInputSchema = z
  .object({
    fileType: fileTypeSchema,
    originalName: requiredText("Tên file"),
    storedName: requiredText("Tên lưu trữ"),
    mimeType: requiredText("Định dạng file"),
    size: z.number().int().positive(),
    storageKey: requiredText("Mã lưu trữ file"),
    storageProvider: z.enum(["LOCAL", "VERCEL_BLOB"]).optional(),
    publicUrl: z.string().url().optional().or(z.literal("")),
  })
  .superRefine((file, ctx) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
      ctx.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: "Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG hoặc PDF.",
      });
    }

    const maxMb = FILE_SIZE_LIMITS_MB[file.fileType] ?? 25;
    if (file.size > maxMb * 1024 * 1024) {
      ctx.addIssue({
        code: "custom",
        path: ["size"],
        message: `File vượt quá dung lượng tối đa ${maxMb}MB.`,
      });
    }

    if (file.fileType === "PHOTO_4X6" && !file.mimeType.startsWith("image/")) {
      ctx.addIssue({ code: "custom", path: ["mimeType"], message: "Ảnh 4x6 phải là JPG, JPEG hoặc PNG." });
    }
    if (file.fileType === "HOC_BA_THCS" && file.mimeType !== "application/pdf") {
      ctx.addIssue({ code: "custom", path: ["mimeType"], message: "Học bạ THCS tổng hợp phải là file PDF." });
    }
    if (file.fileType.startsWith("HOC_BA_LOP_") && !file.mimeType.startsWith("image/")) {
      ctx.addIssue({ code: "custom", path: ["mimeType"], message: "Học bạ từng lớp phải là file ảnh." });
    }
  });

export type UploadedFileInput = z.infer<typeof uploadedFileInputSchema>;

export const academicRecordInputSchema = z.object({
  grade: z.number().int().min(6).max(9),
  literature: requiredScore("Điểm Văn"),
  math: requiredScore("Điểm Toán"),
  english: requiredScore("Điểm Anh"),
  naturalScience: requiredScore("Điểm KHTN"),
  historyGeography: requiredScore("Điểm LS&ĐL"),
  civicEducation: requiredScore("Điểm GDCD"),
  technology: requiredScore("Điểm Công nghệ"),
  informatics: requiredScore("Điểm Tin học"),
  note: optionalText,
  academicLevel: academicLevelSchema,
  conductLevel: academicLevelSchema,
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
  prize: z.enum(["GIAI_NHAT", "GIAI_NHI", "GIAI_BA"]),
});

export type AwardInput = z.infer<typeof awardInputSchema>;

export const applicationCreateSchema = z
  .object({
    fullName: requiredText("Họ và tên viết in hoa")
      .min(2, "Họ và tên quá ngắn")
      .transform((value) => value.toUpperCase()),
    dateOfBirth: dateString("Ngày sinh"),
    gender: z.enum(["NAM", "NU", "KHAC"]),
    ethnicity: requiredText("Dân tộc"),
    birthPlace: provinceSchema,
    citizenId: z.string().trim().regex(/^\d{9,12}$/, "Số định danh/CCCD phải gồm 9-12 chữ số"),
    issueDate: optionalDateString,
    issuePlace: optionalText,
    secondarySchool: requiredText("Trường THCS"),
    secondarySchoolOldAddress: optionalText,
    secondarySchoolAddress: optionalText,
    schoolYear: schoolYearSchema,
    permanentAddress: optionalText,
    houseNumber: requiredText("Số nhà"),
    hamlet: requiredText("Ấp/khóm"),
    ward: requiredText("Xã/phường"),
    wardOther: optionalText,
    province: provinceSchema,
    studentPhone: phoneSchema("Số điện thoại thí sinh"),
    email: requiredEmail,
    guardianName: requiredText("Họ tên cha/mẹ/người giám hộ"),
    guardianPhone: phoneSchema("Số điện thoại phụ huynh/người giám hộ"),
    priorities: z.array(priorityTypeSchema).default([]),
    awards: z.array(awardInputSchema).max(1, "Chỉ được chọn tối đa 01 giải thưởng để cộng điểm khuyến khích").default([]),
    additionalAwardsNote: optionalText,
    academicRecords: z.array(academicRecordInputSchema).length(4, "Cần đủ điểm lớp 6, 7, 8, 9"),
    selectedOptionNumber: z.number().int().min(1).max(6),
    selectedSubjects: requiredText("Phương án môn học"),
    uploadedFiles: z.array(uploadedFileInputSchema).default([]),
    commitmentAccepted: z.literal(true, { error: "Cần xác nhận cam kết trước khi nộp" }),
  })
  .superRefine((value, ctx) => {
    if (value.issueDate && !value.issuePlace) {
      ctx.addIssue({ code: "custom", path: ["issuePlace"], message: "Nếu có ngày cấp thì cần chọn nơi cấp" });
    }
    if (value.issuePlace && !ISSUE_PLACE_OPTIONS.includes(value.issuePlace as (typeof ISSUE_PLACE_OPTIONS)[number])) {
      ctx.addIssue({ code: "custom", path: ["issuePlace"], message: "Nơi cấp không hợp lệ" });
    }

    if (!isKnownProvinceName(value.province) || !isKnownProvinceName(value.birthPlace)) {
      ctx.addIssue({ code: "custom", path: ["province"], message: "Tỉnh/thành phố không hợp lệ" });
    }

    if (value.ward === WARD_OTHER_VALUE) {
      if (!value.wardOther || value.wardOther.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["wardOther"], message: "Vui lòng nhập xã/phường khác" });
      }
    } else if (!isKnownWardName(value.province, value.ward)) {
      ctx.addIssue({ code: "custom", path: ["ward"], message: "Xã/phường không thuộc tỉnh/thành phố đã chọn" });
    }

    const selected = SUBJECT_OPTIONS.find((option) => option.optionNumber === value.selectedOptionNumber);
    if (!selected || selected.subjects !== value.selectedSubjects) {
      ctx.addIssue({
        code: "custom",
        path: ["selectedOptionNumber"],
        message: "Phương án môn học không hợp lệ",
      });
    }

    const grades = new Set(value.academicRecords.map((record) => record.grade));
    for (const grade of [6, 7, 8, 9]) {
      if (!grades.has(grade)) {
        ctx.addIssue({
          code: "custom",
          path: ["academicRecords"],
          message: `Thiếu kết quả học tập lớp ${grade}`,
        });
      }
    }

    const fileTypes = new Set(value.uploadedFiles.map((file) => file.fileType));

    if (!fileTypes.has("PHOTO_4X6")) {
      ctx.addIssue({ code: "custom", path: ["uploadedFiles", "PHOTO_4X6"], message: "Cần tải lên ảnh 4x6" });
    }
    if (!fileTypes.has("GIAY_KHAI_SINH") && !fileTypes.has("CCCD")) {
      ctx.addIssue({
        code: "custom",
        path: ["uploadedFiles", "GIAY_KHAI_SINH"],
        message: "Cần tải lên giấy khai sinh hoặc CCCD/số định danh",
      });
    }
  });

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;

export const adminApplicationUpdateSchema = z
  .object({
    fullName: requiredText("Họ và tên")
      .min(2, "Họ và tên quá ngắn")
      .transform((value) => value.toUpperCase()),
    dateOfBirth: dateString("Ngày sinh"),
    gender: z.enum(["NAM", "NU", "KHAC"]),
    ethnicity: requiredText("Dân tộc"),
    birthPlace: provinceSchema,
    citizenId: z.string().trim().regex(/^\d{9,12}$/, "Số định danh/CCCD phải gồm 9-12 chữ số"),
    issueDate: optionalDateString,
    issuePlace: optionalText,
    secondarySchool: requiredText("Trường THCS"),
    secondarySchoolOldAddress: optionalText,
    secondarySchoolAddress: optionalText,
    schoolYear: schoolYearSchema,
    houseNumber: requiredText("Số nhà"),
    hamlet: requiredText("Ấp/khóm"),
    ward: requiredText("Xã/phường"),
    wardOther: optionalText,
    province: provinceSchema,
    studentPhone: phoneSchema("Số điện thoại thí sinh"),
    email: requiredEmail,
    guardianName: requiredText("Họ tên cha/mẹ/người giám hộ"),
    guardianPhone: phoneSchema("Số điện thoại phụ huynh/người giám hộ"),
    priorities: z.array(priorityTypeSchema).default([]),
    awards: z.array(awardInputSchema).max(1, "Chỉ được chọn tối đa 01 giải thưởng để cộng điểm khuyến khích").default([]),
    additionalAwardsNote: optionalText,
    academicRecords: z.array(academicRecordInputSchema).length(4, "Cần đủ điểm lớp 6, 7, 8, 9"),
    selectedOptionNumber: z.number().int().min(1).max(6),
    selectedSubjects: requiredText("Phương án môn học"),
    status: applicationStatusSchema,
    publicNote: optionalText,
    internalNote: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.issueDate && !value.issuePlace) {
      ctx.addIssue({ code: "custom", path: ["issuePlace"], message: "Nếu có ngày cấp thì cần chọn nơi cấp" });
    }
    if (value.issuePlace && !ISSUE_PLACE_OPTIONS.includes(value.issuePlace as (typeof ISSUE_PLACE_OPTIONS)[number])) {
      ctx.addIssue({ code: "custom", path: ["issuePlace"], message: "Nơi cấp không hợp lệ" });
    }
    if (!isKnownProvinceName(value.province) || !isKnownProvinceName(value.birthPlace)) {
      ctx.addIssue({ code: "custom", path: ["province"], message: "Tỉnh/thành phố không hợp lệ" });
    }
    if (value.ward === WARD_OTHER_VALUE) {
      if (!value.wardOther || value.wardOther.trim().length < 2) {
        ctx.addIssue({ code: "custom", path: ["wardOther"], message: "Vui lòng nhập xã/phường khác" });
      }
    } else if (!isKnownWardName(value.province, value.ward)) {
      ctx.addIssue({ code: "custom", path: ["ward"], message: "Xã/phường không thuộc tỉnh/thành phố đã chọn" });
    }
    const selected = SUBJECT_OPTIONS.find((option) => option.optionNumber === value.selectedOptionNumber);
    if (!selected || selected.subjects !== value.selectedSubjects) {
      ctx.addIssue({
        code: "custom",
        path: ["selectedOptionNumber"],
        message: "Phương án môn học không hợp lệ",
      });
    }
    const grades = new Set(value.academicRecords.map((record) => record.grade));
    for (const grade of [6, 7, 8, 9]) {
      if (!grades.has(grade)) {
        ctx.addIssue({
          code: "custom",
          path: ["academicRecords"],
          message: `Thiếu kết quả học tập lớp ${grade}`,
        });
      }
    }
  });

export type AdminApplicationUpdateInput = z.infer<typeof adminApplicationUpdateSchema>;

export const lookupSchema = z.object({
  applicationCode: requiredText("Mã hồ sơ"),
  citizenId: z.string().trim().min(9, "Số định danh chưa hợp lệ"),
  dateOfBirth: dateString("Ngày sinh"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ").transform((value) => value.toLowerCase()),
  password: z.string().min(1, "Mật khẩu là thông tin bắt buộc"),
});

export const applicationUpdateSchema = z.object({
  status: applicationStatusSchema,
  publicNote: z.string().trim().optional(),
  internalNote: z.string().trim().optional(),
});

export const fileReviewSchema = z.object({
  status: fileStatusSchema,
  note: z.string().trim().optional(),
});

export const physicalDossierUpdateSchema = z
  .object({
    physicalDossierStatus: physicalDossierStatusSchema,
    physicalDossierValidity: physicalDossierValiditySchema,
    physicalDossierPublicNote: optionalText,
    physicalDossierInternalNote: optionalText,
  })
  .superRefine((value, ctx) => {
    if (
      value.physicalDossierStatus === "CHUA_NOP_TRUC_TIEP" &&
      value.physicalDossierValidity === "HOP_LE"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["physicalDossierValidity"],
        message: "Chưa nộp hồ sơ trực tiếp thì không thể ghi nhận hợp lệ",
      });
    }
    if (
      ["CHUA_HOP_LE", "CAN_BO_SUNG"].includes(value.physicalDossierValidity) &&
      !value.physicalDossierPublicNote &&
      !value.physicalDossierInternalNote
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["physicalDossierPublicNote"],
        message: "Nên nhập ghi chú khi hồ sơ trực tiếp chưa hợp lệ hoặc cần bổ sung",
      });
    }
  });

export const admissionResultSchema = z.object({
  admissionResult: admissionResultStatusSchema,
  admissionRank: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().int().positive().optional()
  ),
  admissionBatch: admissionBatchSchema,
  admissionPublicNote: optionalText,
  admissionNote: optionalText,
  snapshotScore: z.boolean().default(true),
});

export const admissionPublicationSchema = z.object({
  publicNote: optionalText,
  reason: optionalText,
  snapshotScore: z.boolean().default(true),
});

export const adminAdmissionPublishSchema = z.object({
  applicationIds: z.array(z.string().trim().min(1)).min(1),
  publish: z.boolean().default(true),
  snapshotScore: z.boolean().default(true),
  publicNote: optionalText,
});

export const registrationFormPdfRequestSchema = lookupSchema;

export const schoolContactSchema = z.object({
  contact: z.object({
    schoolName: requiredText("Tên trường"),
    address: requiredText("Địa chỉ trường"),
    phone: z.string().trim().optional().default(""),
    email: z.string().trim().email("Email trường không hợp lệ"),
    website: z.string().trim().url("Website trường không hợp lệ"),
    note: z.string().trim().optional().default(""),
  }),
  leadershipContacts: z
    .array(
      z.object({
        name: requiredText("Tên lãnh đạo"),
        title: requiredText("Chức vụ"),
        extraRole: z.string().trim().optional().default(""),
        publicContact: z.string().trim().optional().default(""),
        sortOrder: z.number().int().positive(),
      })
    )
    .default([]),
  publicLeadershipPhones: z.boolean().default(true),
  registrationDeadline: dateString("Hạn khóa đăng ký"),
  admissionRound1PublishAt: dateString("Ngày công bố đợt 1"),
  admissionRound2PublishAt: dateString("Ngày công bố đợt 2"),
  personalResultLookupEnabled: z.boolean().default(true),
  registrationLockedNote: z.string().trim().optional().default(""),
});

export function prizeScore(prize: string) {
  return PRIZE_SCORES[prize] ?? 0;
}

export function zodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
