import "dotenv/config";
import {
  AcademicLevel,
  ApplicationStatus,
  EditRequestStatus,
  FileStatus,
  FileType,
  Gender,
  Prisma,
  PrismaClient,
  Prize,
  PriorityType,
  Role,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { calculateAdmissionScoreFromConfig, DEFAULT_SCORE_FORMULA_CONFIG } from "../src/lib/admission-score";
import { SUBJECT_OPTIONS } from "../src/lib/constants";
import { resolveDatabaseUrl } from "../src/lib/database-url";
import { DEFAULT_SCHOOL_SETTINGS } from "../src/lib/school-contact";
import { scoreConfigJson } from "../src/lib/score-formula";

const connectionString = resolveDatabaseUrl(process.env, true);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const demoEnabled = process.env.SEED_DEMO_DATA === "true" || process.env.SEED_SAMPLE_DATA === "true";
const isProduction = process.env.NODE_ENV === "production";

const subjectsByOption = Object.fromEntries(SUBJECT_OPTIONS.map((option) => [option.optionNumber, option.subjects])) as Record<
  number,
  string
>;

function jsonValue<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

async function seedUser(email: string, password: string, name: string, role: Role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({ where: { email }, data: { name, role } });
    return { created: false };
  }
  await prisma.user.create({
    data: {
      email,
      name,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  return { created: true };
}

async function seedUsers() {
  const defaultEmail = process.env.SEED_ADMIN_EMAIL?.trim() || "admin@gmail.com";
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD?.trim() || "Admin123@";
  const admin = await seedUser(defaultEmail, defaultPassword, "Quản trị tuyển sinh", Role.SUPER_ADMIN);

  const devUsers =
    !isProduction || demoEnabled
      ? [
          ["superadmin@vvk.local", "VVK@2026!Super", "Quản trị hệ thống VVK", Role.SUPER_ADMIN] as const,
          ["officer@vvk.local", "VVK@2026!Officer", "Cán bộ tuyển sinh VVK", Role.ADMISSION_OFFICER] as const,
          ["viewer@vvk.local", "VVK@2026!Viewer", "Tài khoản xem báo cáo VVK", Role.VIEWER] as const,
        ]
      : [];

  let created = admin.created ? 1 : 0;
  for (const [email, password, name, role] of devUsers) {
    const result = await seedUser(email, password, name, role);
    if (result.created) created += 1;
  }
  return created;
}

async function seedSchoolSettings() {
  await prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {
      schoolContactJson: DEFAULT_SCHOOL_SETTINGS.contact as unknown as Prisma.InputJsonValue,
      leadershipContactsJson: DEFAULT_SCHOOL_SETTINGS.leadershipContacts as unknown as Prisma.InputJsonValue,
      publicLeadershipPhones: DEFAULT_SCHOOL_SETTINGS.publicLeadershipPhones,
      registrationDeadline: new Date(DEFAULT_SCHOOL_SETTINGS.registrationDeadline),
      admissionRound1PublishAt: new Date(DEFAULT_SCHOOL_SETTINGS.admissionRound1PublishAt),
      admissionRound2PublishAt: new Date("2026-07-25T08:00:00+07:00"),
      personalResultLookupEnabled: DEFAULT_SCHOOL_SETTINGS.personalResultLookupEnabled,
      registrationLockedNote: DEFAULT_SCHOOL_SETTINGS.registrationLockedNote,
    },
    create: {
      id: "default",
      schoolContactJson: DEFAULT_SCHOOL_SETTINGS.contact as unknown as Prisma.InputJsonValue,
      leadershipContactsJson: DEFAULT_SCHOOL_SETTINGS.leadershipContacts as unknown as Prisma.InputJsonValue,
      publicLeadershipPhones: DEFAULT_SCHOOL_SETTINGS.publicLeadershipPhones,
      registrationDeadline: new Date(DEFAULT_SCHOOL_SETTINGS.registrationDeadline),
      admissionRound1PublishAt: new Date(DEFAULT_SCHOOL_SETTINGS.admissionRound1PublishAt),
      admissionRound2PublishAt: new Date("2026-07-25T08:00:00+07:00"),
      personalResultLookupEnabled: DEFAULT_SCHOOL_SETTINGS.personalResultLookupEnabled,
      registrationLockedNote: DEFAULT_SCHOOL_SETTINGS.registrationLockedNote,
    },
  });

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    update: {
      schoolName: "Trường THPT Võ Văn Kiệt",
      schoolShortName: "THPT Võ Văn Kiệt",
      schoolAddress: "Số 10B, ấp Long Hòa, xã Phước Long, tỉnh Cà Mau",
      schoolPhone: "0291.3864308",
      logoUrl: "/LogoVVK.png",
      principalName: "Trần Quang Điện",
      principalTitle: "Hiệu trưởng",
      navItemsJson: jsonValue([
        { href: "/huong-dan", label: "Hướng dẫn", enabled: true },
        { href: "/dang-ky", label: "Đăng ký", enabled: true },
        { href: "/tra-cuu", label: "Tra cứu", enabled: true },
        { href: "/cong-bo-trung-tuyen", label: "Công bố trúng tuyển", enabled: true },
        { href: "/admin", label: "Quản trị", enabled: true },
      ]),
    },
    create: {
      id: "default",
      schoolName: "Trường THPT Võ Văn Kiệt",
      schoolShortName: "THPT Võ Văn Kiệt",
      schoolAddress: "Số 10B, ấp Long Hòa, xã Phước Long, tỉnh Cà Mau",
      schoolPhone: "0291.3864308",
      logoUrl: "/LogoVVK.png",
      principalName: "Trần Quang Điện",
      principalTitle: "Hiệu trưởng",
      navItemsJson: jsonValue([
        { href: "/huong-dan", label: "Hướng dẫn", enabled: true },
        { href: "/dang-ky", label: "Đăng ký", enabled: true },
        { href: "/tra-cuu", label: "Tra cứu", enabled: true },
        { href: "/cong-bo-trung-tuyen", label: "Công bố trúng tuyển", enabled: true },
        { href: "/admin", label: "Quản trị", enabled: true },
      ]),
    },
  });
}

async function seedSeason() {
  const academicYear = await prisma.academicYear.upsert({
    where: { code: "2026-2027" },
    update: { name: "Năm học 2026 - 2027", status: "DANG_TUYEN_SINH", isActive: true },
    create: {
      code: "2026-2027",
      name: "Năm học 2026 - 2027",
      startDate: new Date("2026-06-01T00:00:00+07:00"),
      endDate: new Date("2027-05-31T23:59:59+07:00"),
      status: "DANG_TUYEN_SINH",
      isActive: true,
    },
  });

  await prisma.admissionSeason.updateMany({ where: { isDefault: true, code: { not: "TSL10_2026_2027_VVK" } }, data: { isDefault: false } });

  const season = await prisma.admissionSeason.upsert({
    where: { code: "TSL10_2026_2027_VVK" },
    update: {
      academicYearId: academicYear.id,
      slug: "tuyen-sinh-lop-10-2026-2027",
      name: "Tuyển sinh lớp 10 Trường THPT Võ Văn Kiệt năm học 2026 - 2027",
      gradeLevel: 10,
      quota: 950,
      method: "XET_TUYEN",
      principle: "Xét tuyển theo điểm xét tuyển từ cao xuống thấp cho đến khi đủ chỉ tiêu.",
      description:
        "Hệ thống hỗ trợ thí sinh/phụ huynh kê khai hồ sơ trực tuyến, tra cứu trạng thái và theo dõi kết quả khi nhà trường công bố chính thức.",
      registrationOpen: true,
      resultsPublished: true,
      isDefault: true,
      status: "DANG_MO",
      applicationCodePrefix: "VVK26",
    },
    create: {
      academicYearId: academicYear.id,
      code: "TSL10_2026_2027_VVK",
      slug: "tuyen-sinh-lop-10-2026-2027",
      name: "Tuyển sinh lớp 10 Trường THPT Võ Văn Kiệt năm học 2026 - 2027",
      gradeLevel: 10,
      quota: 950,
      method: "XET_TUYEN",
      principle: "Xét tuyển theo điểm xét tuyển từ cao xuống thấp cho đến khi đủ chỉ tiêu.",
      description:
        "Hệ thống hỗ trợ thí sinh/phụ huynh kê khai hồ sơ trực tuyến, tra cứu trạng thái và theo dõi kết quả khi nhà trường công bố chính thức.",
      registrationOpen: true,
      resultsPublished: true,
      isDefault: true,
      status: "DANG_MO",
      applicationCodePrefix: "VVK26",
    },
  });

  await seedRounds(season.id);
  await seedLegalDocuments(season.id);
  await seedDossierRequirements(season.id);
  await seedContentBlocks(season.id);
  await seedScoreFormula(season.id);
  return season;
}

async function seedRounds(seasonId: string) {
  const rounds = [
    {
      name: "Đợt 1",
      receiveStartAt: new Date("2026-06-18T00:00:00+07:00"),
      receiveEndAt: new Date("2026-07-16T23:59:59+07:00"),
      resultPublishAt: new Date("2026-07-18T08:00:00+07:00"),
      status: "DA_CONG_BO",
      sortOrder: 1,
      publicNote: "Nhận hồ sơ đợt 1 từ ngày 18/6/2026 đến ngày 16/7/2026. Công bố kết quả đợt 1 ngày 18/7/2026.",
    },
    {
      name: "Đợt 2",
      receiveStartAt: new Date("2026-07-19T00:00:00+07:00"),
      receiveEndAt: new Date("2026-07-24T23:59:59+07:00"),
      resultPublishAt: new Date("2026-07-25T08:00:00+07:00"),
      status: "DA_CONG_BO",
      sortOrder: 2,
      publicNote:
        "Nhận hồ sơ đợt 2 nếu chưa đủ chỉ tiêu, từ ngày 19/7/2026 đến ngày 24/7/2026. Theo thông báo trường, công bố kết quả đợt 2 ngày 25/7/2026.",
    },
  ];

  for (const round of rounds) {
    const existing = await prisma.admissionRound.findFirst({ where: { seasonId, name: round.name } });
    if (existing) await prisma.admissionRound.update({ where: { id: existing.id }, data: round });
    else await prisma.admissionRound.create({ data: { seasonId, ...round } });
  }
}

async function seedLegalDocuments(seasonId: string) {
  const docs = [
    ["Thông tư", "TT30/2024/TT-BGDĐT", "2024-12-30", "Bộ Giáo dục và Đào tạo", "Thông tư số 30/2024/TT-BGDĐT ban hành Quy chế tuyển sinh THCS và THPT"],
    ["Quyết định", "292/QĐ-SGDĐT", "2026-04-24", "Sở Giáo dục và Đào tạo Cà Mau", "Quyết định giao chỉ tiêu tuyển sinh lớp 10 năm học 2026 - 2027"],
    ["Công văn", "3054/SGDĐT-GDTrH", "2026-04-29", "Sở Giáo dục và Đào tạo Cà Mau", "Hướng dẫn công tác tuyển sinh lớp 10 THPT năm học 2026 - 2027"],
    ["Thông báo", "41/TB-THPTVVK", "2026-05-12", "Trường THPT Võ Văn Kiệt", "Thông báo tuyển sinh vào lớp 10 năm học 2026 - 2027"],
  ] as const;

  for (const [documentType, documentNumber, issuedDate, issuingAgency, summary] of docs) {
    const existing = await prisma.admissionLegalDocument.findFirst({ where: { seasonId, documentNumber } });
    const data = { documentType, documentNumber, issuedDate: new Date(issuedDate), issuingAgency, summary, isPublic: true };
    if (existing) await prisma.admissionLegalDocument.update({ where: { id: existing.id }, data });
    else await prisma.admissionLegalDocument.create({ data: { seasonId, ...data } });
  }
}

async function seedDossierRequirements(seasonId: string) {
  const items = [
    ["PHIEU_DANG_KY_DU_TUYEN", "Phiếu đăng ký dự tuyển theo mẫu của trường", "Phiếu PDF được hệ thống điền sẵn thông tin, in ra và ký xác nhận.", "01 bản", null, true],
    ["ANH_4X6", "02 ảnh cỡ 4x6cm", "Ảnh chụp không quá 06 tháng.", "02 ảnh", "4x6cm", true],
    ["HOC_BA_THCS_BAN_CHINH", "Bản chính học bạ cấp THCS", "Có xác nhận hoàn thành chương trình giáo dục THCS của Hiệu trưởng.", "01 bản chính", null, true],
    ["GIAY_KHAI_SINH_HOP_LE", "Bản sao giấy khai sinh hợp lệ", "Giấy khai sinh phải khớp với Căn cước và hồ sơ tuyển sinh.", "01 bản sao", null, true],
    ["GIAY_TO_DINH_DANH_CU_TRU", "Bản photo giấy tờ định danh/cư trú", "Căn cước/CCCD, thông báo số định danh hoặc giấy xác nhận thông tin cư trú; có bản chính đối chiếu khi cần.", "01 bản photo", null, true],
    ["MINH_CHUNG_UU_TIEN_KHUYEN_KHICH", "Giấy xác nhận chế độ ưu tiên, khuyến khích", "Do cơ quan có thẩm quyền cấp, nếu có.", "01 bản", null, false],
    ["BANG_TOT_NGHIEP_THCS_CU", "Bằng tốt nghiệp THCS", "Áp dụng với học sinh đã tốt nghiệp THCS từ năm học 2024 - 2025 trở về trước.", "01 bản", null, false],
  ] as const;

  for (const [code, title, description, quantity, specification, isRequired] of items) {
    const existing = await prisma.dossierRequirement.findFirst({ where: { seasonId, title } });
    const data = {
      title,
      description,
      quantity,
      specification,
      isRequired,
      conditionNote:
        code === "MINH_CHUNG_UU_TIEN_KHUYEN_KHICH"
          ? "Nếu thí sinh có khai đối tượng ưu tiên/khuyến khích."
          : code === "BANG_TOT_NGHIEP_THCS_CU"
            ? "Áp dụng với học sinh đã tốt nghiệp THCS từ năm học 2024 - 2025 trở về trước."
            : null,
      showOnPublic: true,
      showOnPdf: true,
      sortOrder: items.findIndex((item) => item[0] === code) + 1,
    };
    if (existing) await prisma.dossierRequirement.update({ where: { id: existing.id }, data });
    else await prisma.dossierRequirement.create({ data: { seasonId, ...data } });
  }
}

async function upsertContent(seasonId: string, pageKey: string, blockKey: string, data: { title?: string; subtitle?: string; body?: string; displayOrder?: number }) {
  const existing = await prisma.contentBlock.findFirst({ where: { seasonId, pageKey, blockKey } });
  if (existing) await prisma.contentBlock.update({ where: { id: existing.id }, data: { ...data, isEnabled: true } });
  else await prisma.contentBlock.create({ data: { seasonId, pageKey, blockKey, ...data, isEnabled: true } });
}

async function seedContentBlocks(seasonId: string) {
  await upsertContent(seasonId, "home", "hero", {
    title: "Cổng đăng ký tuyển sinh lớp 10 Trường THPT Võ Văn Kiệt",
    subtitle: "Năm học 2026 - 2027",
    body: "Hệ thống hỗ trợ thí sinh/phụ huynh kê khai hồ sơ trực tuyến, tra cứu trạng thái hồ sơ và theo dõi kết quả tuyển sinh khi nhà trường công bố chính thức.",
  });
  await upsertContent(seasonId, "dang-ky", "intro", {
    title: "Đăng ký hồ sơ tuyển sinh lớp 10",
    body: "Hồ sơ trực tuyến giúp nhà trường kiểm tra thông tin ban đầu; thí sinh vẫn cần nộp hồ sơ trực tiếp/bản giấy theo thông báo.",
  });
  await upsertContent(seasonId, "tra-cuu", "intro", {
    title: "Tra cứu hồ sơ tuyển sinh",
    body: "Nhập mã hồ sơ, số định danh/CCCD và ngày sinh để tra cứu trạng thái hồ sơ.",
  });
  await upsertContent(seasonId, "cong-bo-trung-tuyen", "intro", {
    title: "Danh sách trúng tuyển lớp 10 Trường THPT Võ Văn Kiệt",
    subtitle: "Năm học 2026 - 2027",
    body: "Danh sách chỉ bao gồm thí sinh đã được Hội đồng tuyển sinh xác nhận trúng tuyển và được nhà trường công bố trên hệ thống.",
  });
  await upsertContent(seasonId, "pdf", "template", {
    title: "ĐƠN ĐĂNG KÝ DỰ TUYỂN VÀO LỚP 10",
    subtitle: "Năm học 2026 - 2027",
    body: "Tôi xin cam đoan những thông tin khai trên là đúng sự thật. Nếu trúng tuyển vào lớp 10 của trường, tôi sẽ chấp hành nghiêm túc các quy định của nhà trường.",
  });
}

async function seedScoreFormula(seasonId: string) {
  const existing = await prisma.scoreFormulaVersion.findFirst({
    where: { seasonId, name: "Công thức xét tuyển THPT Cà Mau 2026 - 2027", version: 1 },
  });
  const data = {
    description: "Điểm xét tuyển = A + B + C; mặc định theo kế hoạch tuyển sinh lớp 10 năm học 2026 - 2027.",
    status: "ACTIVE",
    isDefault: true,
    configJson: scoreConfigJson(DEFAULT_SCORE_FORMULA_CONFIG),
  };
  if (existing) {
    await prisma.scoreFormulaVersion.update({ where: { id: existing.id }, data });
    return existing.id;
  }
  const created = await prisma.scoreFormulaVersion.create({
    data: {
      seasonId,
      name: "Công thức xét tuyển THPT Cà Mau 2026 - 2027",
      version: 1,
      ...data,
    },
  });
  return created.id;
}

async function seedSecondarySchools() {
  const existingCount = await prisma.secondarySchool.count();
  if (existingCount > 0) return 0;
  const schools = [
    ["THCS_MAU_01", "Trường THCS mẫu 01 - Phước Long", "Địa chỉ cũ mẫu", "Xã Phước Long, tỉnh Cà Mau"],
    ["THCS_MAU_02", "Trường THCS mẫu 02 - Long Hòa", "Địa chỉ cũ mẫu", "Ấp Long Hòa, xã Phước Long, tỉnh Cà Mau"],
    ["THCS_MAU_03", "Trường THCS mẫu 03 - Vĩnh Lộc", "Địa chỉ cũ mẫu", "Ấp Vĩnh Lộc, tỉnh Cà Mau"],
    ["THCS_MAU_04", "Trường THCS mẫu 04 - Vĩnh Phú B", "Địa chỉ cũ mẫu", "Ấp Vĩnh Phú B, tỉnh Cà Mau"],
    ["THCS_MAU_05", "Trường THCS mẫu 05 - Long Đức", "Địa chỉ cũ mẫu", "Ấp Long Đức, tỉnh Cà Mau"],
    ["THCS_MAU_06", "Trường THCS mẫu 06 - Cà Mau", "Địa chỉ cũ mẫu", "Tỉnh Cà Mau"],
  ];
  await prisma.secondarySchool.createMany({
    data: schools.map(([code, name, oldAddress, newAddress]) => ({
      code,
      name,
      oldAddress,
      newAddress,
      province: "Cà Mau",
      isSeedData: true,
    })),
    skipDuplicates: true,
  });
  return schools.length;
}

function demoAcademicRecords(profile: "excellent" | "good" | "average" | "needsReview") {
  const base =
    profile === "excellent" ? 9.1 : profile === "good" ? 8.0 : profile === "average" ? 6.6 : 5.8;
  return [6, 7, 8, 9].map((grade, index) => ({
    grade,
    literature: Number((base + index * 0.1).toFixed(1)),
    math: Number((base + 0.2 + index * 0.1).toFixed(1)),
    english: Number((base - 0.1 + index * 0.1).toFixed(1)),
    naturalScience: Number((base + 0.1).toFixed(1)),
    historyGeography: Number((base + 0.05).toFixed(1)),
    civicEducation: Number((base + 0.4).toFixed(1)),
    technology: Number((base + 0.3).toFixed(1)),
    informatics: Number((base + 0.35).toFixed(1)),
    academicLevel: profile === "average" || profile === "needsReview" ? AcademicLevel.KHA : AcademicLevel.TOT,
    conductLevel: profile === "needsReview" ? AcademicLevel.DAT : profile === "average" ? AcademicLevel.KHA : AcademicLevel.TOT,
  }));
}

type DemoApplication = {
  applicationCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  ethnicity: string;
  citizenId: string;
  secondarySchool: string;
  schoolYear: string;
  selectedOptionNumber: number;
  priorities?: PriorityType[];
  award?: { prize: Prize; competitionName: string; field: string; level: string; year: number };
  status: ApplicationStatus;
  physicalDossierStatus: string;
  physicalDossierValidity: string;
  physicalDossierPublicNote?: string;
  admissionResult: string;
  admissionPublished: boolean;
  admissionBatch?: string;
  admissionRank?: number;
  registrationFormNumber?: string | null;
  profile: "excellent" | "good" | "average" | "needsReview";
};

const demoApplications: DemoApplication[] = [
  { applicationCode: "VVK260001", fullName: "NGUYỄN MINH ANH", gender: Gender.NU, dateOfBirth: "2011-03-15", ethnicity: "Kinh", citizenId: "079000000001", secondarySchool: "Trường THCS mẫu 01 - Phước Long", schoolYear: "2025 - 2026", selectedOptionNumber: 1, award: { prize: Prize.GIAI_NHAT, competitionName: "Học sinh giỏi cấp tỉnh", field: "Ngữ văn", level: "Cấp tỉnh", year: 2026 }, status: ApplicationStatus.HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "TRUNG_TUYEN", admissionPublished: true, admissionBatch: "Đợt 1", admissionRank: 1, registrationFormNumber: "001", profile: "excellent" },
  { applicationCode: "VVK260002", fullName: "TRẦN QUỐC BẢO", gender: Gender.NAM, dateOfBirth: "2011-07-22", ethnicity: "Khmer", citizenId: "079000000002", secondarySchool: "Trường THCS mẫu 03 - Vĩnh Lộc", schoolYear: "2025 - 2026", selectedOptionNumber: 2, priorities: [PriorityType.DAN_TOC_THIEU_SO, PriorityType.VUNG_DAC_BIET_KHO_KHAN], status: ApplicationStatus.HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "TRUNG_TUYEN", admissionPublished: true, admissionBatch: "Đợt 1", admissionRank: 2, registrationFormNumber: "002", profile: "excellent" },
  { applicationCode: "VVK260003", fullName: "LÊ KHÁNH CHI", gender: Gender.NU, dateOfBirth: "2011-11-02", ethnicity: "Kinh", citizenId: "079000000003", secondarySchool: "Trường THCS mẫu 02 - Long Hòa", schoolYear: "2025 - 2026", selectedOptionNumber: 3, award: { prize: Prize.GIAI_NHI, competitionName: "Cuộc thi khoa học kỹ thuật cấp tỉnh", field: "Khoa học kỹ thuật", level: "Cấp tỉnh", year: 2026 }, status: ApplicationStatus.HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "TRUNG_TUYEN", admissionPublished: true, admissionBatch: "Đợt 1", admissionRank: 3, registrationFormNumber: "003", profile: "excellent" },
  { applicationCode: "VVK260004", fullName: "PHẠM GIA HUY", gender: Gender.NAM, dateOfBirth: "2011-05-09", ethnicity: "Kinh", citizenId: "079000000004", secondarySchool: "Trường THCS mẫu 04 - Vĩnh Phú B", schoolYear: "2025 - 2026", selectedOptionNumber: 4, priorities: [PriorityType.VUNG_DAC_BIET_KHO_KHAN], award: { prize: Prize.GIAI_BA, competitionName: "Học sinh giỏi cấp tỉnh", field: "Toán", level: "Cấp tỉnh", year: 2026 }, status: ApplicationStatus.DA_DUYET_XET_TUYEN, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "TRUNG_TUYEN", admissionPublished: true, admissionBatch: "Đợt 1", admissionRank: 4, registrationFormNumber: "004", profile: "good" },
  { applicationCode: "VVK260005", fullName: "VÕ THẢO NGUYÊN", gender: Gender.NU, dateOfBirth: "2011-09-12", ethnicity: "Hoa", citizenId: "079000000005", secondarySchool: "Trường THCS mẫu 05 - Long Đức", schoolYear: "2025 - 2026", selectedOptionNumber: 5, priorities: [PriorityType.DAN_TOC_THIEU_SO], status: ApplicationStatus.HOP_LE, physicalDossierStatus: "CHUA_NOP_TRUC_TIEP", physicalDossierValidity: "CHUA_KIEM_TRA", admissionResult: "DU_BI", admissionPublished: false, admissionBatch: "Đợt 1", admissionRank: 20, registrationFormNumber: "005", profile: "good" },
  { applicationCode: "VVK260006", fullName: "ĐẶNG HOÀNG NAM", gender: Gender.NAM, dateOfBirth: "2010-12-21", ethnicity: "Kinh", citizenId: "079000000006", secondarySchool: "Trường THCS mẫu 06 - Cà Mau", schoolYear: "2024 - 2025", selectedOptionNumber: 6, status: ApplicationStatus.CAN_BO_SUNG, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "CAN_BO_SUNG", physicalDossierPublicNote: "Cần bổ sung bằng tốt nghiệp THCS bản chính hoặc bản sao do thí sinh đã tốt nghiệp từ năm học 2024 - 2025 trở về trước.", admissionResult: "CHUA_XET", admissionPublished: false, registrationFormNumber: null, profile: "needsReview" },
  { applicationCode: "VVK260007", fullName: "HUỲNH BẢO TRÂN", gender: Gender.NU, dateOfBirth: "2011-01-28", ethnicity: "Kinh", citizenId: "079000000007", secondarySchool: "Trường THCS mẫu 01 - Phước Long", schoolYear: "2025 - 2026", selectedOptionNumber: 1, priorities: [PriorityType.HO_NGHEO], status: ApplicationStatus.DANG_XU_LY, physicalDossierStatus: "CHUA_NOP_TRUC_TIEP", physicalDossierValidity: "CHUA_KIEM_TRA", admissionResult: "CHUA_XET", admissionPublished: false, profile: "average" },
  { applicationCode: "VVK260008", fullName: "BÙI ĐỨC MẠNH", gender: Gender.NAM, dateOfBirth: "2011-04-04", ethnicity: "Kinh", citizenId: "079000000008", secondarySchool: "Trường THCS mẫu 02 - Long Hòa", schoolYear: "2025 - 2026", selectedOptionNumber: 2, priorities: [PriorityType.CON_THUONG_BINH_BENH_BINH], status: ApplicationStatus.KHONG_HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "CHUA_HOP_LE", physicalDossierPublicNote: "Thông tin giấy khai sinh chưa khớp với số định danh/CCCD. Vui lòng liên hệ văn phòng trường để được hướng dẫn.", admissionResult: "CHUA_XET", admissionPublished: false, profile: "average" },
  { applicationCode: "VVK260009", fullName: "MAI ANH THƯ", gender: Gender.NU, dateOfBirth: "2011-08-18", ethnicity: "Kinh", citizenId: "079000000009", secondarySchool: "Trường THCS mẫu 03 - Vĩnh Lộc", schoolYear: "2025 - 2026", selectedOptionNumber: 3, priorities: [PriorityType.MO_COI_CHA_HOAC_ME], status: ApplicationStatus.HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "KHONG_TRUNG_TUYEN", admissionPublished: false, admissionBatch: "Đợt 1", registrationFormNumber: "009", profile: "average" },
  { applicationCode: "VVK260010", fullName: "CAO TUẤN KIỆT", gender: Gender.NAM, dateOfBirth: "2011-10-10", ethnicity: "Kinh", citizenId: "079000000010", secondarySchool: "Trường THCS mẫu 04 - Vĩnh Phú B", schoolYear: "2025 - 2026", selectedOptionNumber: 4, status: ApplicationStatus.CHO_KIEM_TRA, physicalDossierStatus: "CHUA_NOP_TRUC_TIEP", physicalDossierValidity: "CHUA_KIEM_TRA", admissionResult: "CHUA_XET", admissionPublished: false, profile: "needsReview" },
  { applicationCode: "VVK260011", fullName: "ĐỖ NGỌC HÂN", gender: Gender.NU, dateOfBirth: "2011-02-06", ethnicity: "Kinh", citizenId: "079000000011", secondarySchool: "Trường THCS mẫu 05 - Long Đức", schoolYear: "2025 - 2026", selectedOptionNumber: 5, priorities: [PriorityType.HO_CAN_NGHEO], award: { prize: Prize.GIAI_BA, competitionName: "Hội thi tin học trẻ", field: "Tin học", level: "Cấp tỉnh", year: 2026 }, status: ApplicationStatus.HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "TRUNG_TUYEN", admissionPublished: true, admissionBatch: "Đợt 2", admissionRank: 35, registrationFormNumber: "011", profile: "good" },
  { applicationCode: "VVK260012", fullName: "TRƯƠNG MINH PHÚC", gender: Gender.NAM, dateOfBirth: "2011-06-30", ethnicity: "Kinh", citizenId: "079000000012", secondarySchool: "Trường THCS mẫu 06 - Cà Mau", schoolYear: "2025 - 2026", selectedOptionNumber: 6, status: ApplicationStatus.HOP_LE, physicalDossierStatus: "DA_NOP_TRUC_TIEP", physicalDossierValidity: "HOP_LE", admissionResult: "TRUNG_TUYEN", admissionPublished: false, admissionBatch: "Đợt 2", admissionRank: 36, registrationFormNumber: "012", profile: "good" },
];

async function seedDemoApplications(seasonId: string, formulaId?: string) {
  let createdOrUpdated = 0;
  for (const item of demoApplications) {
    const existing = await prisma.application.findUnique({ where: { applicationCode: item.applicationCode } });
    if (existing && !existing.isSeedData) continue;

    const academicRecords = demoAcademicRecords(item.profile);
    const priorities = item.priorities ?? [];
    const awards = item.award ? [{ prize: item.award.prize }] : [];
    const score = calculateAdmissionScoreFromConfig(academicRecords, priorities, awards, DEFAULT_SCORE_FORMULA_CONFIG, formulaId);
    const data = {
      admissionSeasonId: seasonId,
      applicationCode: item.applicationCode,
      fullName: item.fullName,
      dateOfBirth: new Date(`${item.dateOfBirth}T00:00:00+07:00`),
      gender: item.gender,
      ethnicity: item.ethnicity,
      birthPlace: "Cà Mau",
      citizenId: item.citizenId,
      issueDate: new Date("2025-01-01T00:00:00+07:00"),
      issuePlace: "Cục Cảnh sát Quản lý Hành chính về Trật tự xã hội",
      secondarySchool: item.secondarySchool,
      schoolYear: item.schoolYear,
      permanentAddress: "Số nhà mẫu, ấp Long Hòa, xã Phước Long, tỉnh Cà Mau",
      houseNumber: "Không có",
      hamlet: "Long Hòa",
      ward: "Phước Long",
      province: "Cà Mau",
      studentPhone: `09000000${item.applicationCode.slice(-2)}`,
      email: `${item.applicationCode.toLowerCase()}@example.test`,
      guardianName: `Phụ huynh ${item.fullName}`,
      guardianPhone: `09000001${item.applicationCode.slice(-2)}`,
      selectedOptionNumber: item.selectedOptionNumber,
      selectedSubjects: subjectsByOption[item.selectedOptionNumber],
      bonusScore: score.priorityScore + score.awardBonusScore,
      scoreFormulaVersionId: formulaId,
      scoreBreakdownJson: jsonValue(score),
      commitmentAccepted: true,
      status: item.status,
      physicalDossierStatus: item.physicalDossierStatus,
      physicalDossierValidity: item.physicalDossierValidity,
      physicalDossierPublicNote: item.physicalDossierPublicNote,
      admissionResult: item.admissionResult,
      admissionPublished: item.admissionPublished,
      admissionPublishedAt: item.admissionPublished ? new Date("2026-07-18T08:00:00+07:00") : null,
      admissionBatch: item.admissionBatch,
      admissionRank: item.admissionRank,
      admissionScoreSnapshot: ["TRUNG_TUYEN", "KHONG_TRUNG_TUYEN", "DU_BI"].includes(item.admissionResult) ? score.totalScore : null,
      registrationFormNumber: item.registrationFormNumber ?? null,
      isSeedData: true,
    };

    const app = existing
      ? await prisma.application.update({ where: { id: existing.id }, data })
      : await prisma.application.create({ data });

    await prisma.$transaction([
      prisma.academicRecord.deleteMany({ where: { applicationId: app.id } }),
      prisma.priorityRecord.deleteMany({ where: { applicationId: app.id } }),
      prisma.awardRecord.deleteMany({ where: { applicationId: app.id } }),
      prisma.uploadedFile.deleteMany({ where: { applicationId: app.id, isSeedData: true } }),
      prisma.applicationEditRequest.deleteMany({ where: { applicationId: app.id, isSeedData: true } }),
    ]);

    await prisma.academicRecord.createMany({ data: academicRecords.map((record) => ({ applicationId: app.id, ...record })) });
    if (priorities.length > 0) {
      await prisma.priorityRecord.createMany({ data: priorities.map((type) => ({ applicationId: app.id, type, description: "Dữ liệu mẫu seed." })) });
    }
    if (item.award) {
      await prisma.awardRecord.create({
        data: {
          applicationId: app.id,
          competitionName: item.award.competitionName,
          field: item.award.field,
          level: item.award.level,
          year: item.award.year,
          prize: item.award.prize,
          bonusScore: DEFAULT_SCORE_FORMULA_CONFIG.awardScores[item.award.prize] ?? 0,
        },
      });
    }

    await prisma.uploadedFile.createMany({
      data: [
        {
          applicationId: app.id,
          fileType: FileType.PHOTO_4X6,
          originalName: "seed-photo-4x6.jpg",
          storedName: "seed-photo-4x6.jpg",
          mimeType: "image/jpeg",
          size: 102400,
          storageKey: "seed/seed-photo-4x6.jpg",
          storageProvider: "LOCAL",
          status: FileStatus.HOP_LE,
          note: "Tệp mẫu phục vụ kiểm thử, không có nội dung tệp thật.",
          isSeedData: true,
        },
        {
          applicationId: app.id,
          fileType: FileType.GIAY_KHAI_SINH,
          originalName: "seed-giay-khai-sinh.pdf",
          storedName: "seed-giay-khai-sinh.pdf",
          mimeType: "application/pdf",
          size: 204800,
          storageKey: "seed/seed-giay-khai-sinh.pdf",
          storageProvider: "LOCAL",
          status: FileStatus.HOP_LE,
          note: "Tệp mẫu phục vụ kiểm thử, không có nội dung tệp thật.",
          isSeedData: true,
        },
      ],
    });

    await prisma.applicationLog.create({
      data: {
        applicationId: app.id,
        action: "CREATED",
        note: "Dữ liệu mẫu seed 2026 - 2027.",
        metadata: jsonValue({ seed: true, score }),
      },
    });
    createdOrUpdated += 1;
  }
  return createdOrUpdated;
}

async function seedDemoEditRequests() {
  const scenarios = [
    ["VVK260007", EditRequestStatus.CHO_DUYET, "Bổ sung minh chứng hộ nghèo và điều chỉnh số điện thoại phụ huynh.", "guardianPhone", "0900000007", "0900000107"],
    ["VVK260008", EditRequestStatus.TU_CHOI, "Yêu cầu chỉnh ngày sinh nhưng chưa có giấy tờ đối chiếu hợp lệ.", "dateOfBirth", "2011-04-04", "2011-04-05"],
    ["VVK260010", EditRequestStatus.DA_DUYET, "Sửa email liên hệ.", "email", "vvk260010@example.test", "phuhuynh.vvk260010@example.test"],
  ] as const;

  let count = 0;
  for (const [applicationCode, status, studentNote, field, oldValue, newValue] of scenarios) {
    const app = await prisma.application.findUnique({ where: { applicationCode } });
    if (!app?.isSeedData) continue;
    await prisma.applicationEditRequest.upsert({
      where: { requestCode: `SEED-EDIT-${applicationCode}` },
      update: {
        status,
        studentNote,
        snapshotBeforeJson: jsonValue({ [field]: oldValue }),
        proposedDataJson: jsonValue({ [field]: newValue }),
        changedFieldsJson: jsonValue([field]),
        rejectionReason: status === EditRequestStatus.TU_CHOI ? "Từ chối do thiếu minh chứng hợp lệ." : null,
        officerNote: status === EditRequestStatus.DA_DUYET ? "Đã đối chiếu với phụ huynh qua điện thoại." : null,
        submittedAt: new Date("2026-06-25T08:00:00+07:00"),
        reviewedAt: status === EditRequestStatus.CHO_DUYET ? null : new Date("2026-06-26T08:00:00+07:00"),
        isSeedData: true,
      },
      create: {
        applicationId: app.id,
        requestCode: `SEED-EDIT-${applicationCode}`,
        status,
        studentNote,
        snapshotBeforeJson: jsonValue({ [field]: oldValue }),
        proposedDataJson: jsonValue({ [field]: newValue }),
        changedFieldsJson: jsonValue([field]),
        rejectionReason: status === EditRequestStatus.TU_CHOI ? "Từ chối do thiếu minh chứng hợp lệ." : null,
        officerNote: status === EditRequestStatus.DA_DUYET ? "Đã đối chiếu với phụ huynh qua điện thoại." : null,
        submittedAt: new Date("2026-06-25T08:00:00+07:00"),
        reviewedAt: status === EditRequestStatus.CHO_DUYET ? null : new Date("2026-06-26T08:00:00+07:00"),
        isSeedData: true,
      },
    });
    count += 1;
  }
  return count;
}

async function main() {
  if (isProduction && demoEnabled) {
    throw new Error("SEED_DEMO_DATA không được bật trong production.");
  }

  const usersCreated = await seedUsers();
  await seedSchoolSettings();
  const season = await seedSeason();
  const formula = await prisma.scoreFormulaVersion.findFirst({ where: { seasonId: season.id, status: "ACTIVE" } });

  let schools = 0;
  let apps = 0;
  let editRequests = 0;
  if (demoEnabled) {
    schools = await seedSecondarySchools();
    apps = await seedDemoApplications(season.id, formula?.id);
    editRequests = await seedDemoEditRequests();
  }

  console.log("Seed completed:");
  console.log(`- Users created: ${usersCreated}`);
  console.log(`- Admission season: ${season.code}`);
  console.log(`- Score formula: ${formula?.name ?? "fallback"}`);
  console.log(`- Demo secondary schools: ${schools}`);
  console.log(`- Demo applications: ${apps}`);
  console.log(`- Demo edit requests: ${editRequests}`);
  console.log("- Dropdown overrides: 0 (defaults remain code/schema fallback until admin edits)");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code) : "";
    const message = error instanceof Error ? error.message : String(error);
    if (code === "P1001" || code === "ECONNREFUSED" || message.includes("Can't reach database server")) {
      console.error(
        "Seed failed: cannot connect to the configured PostgreSQL database. Start PostgreSQL or update DATABASE_URL, then run `npx prisma migrate deploy` and `npm run prisma:seed` again."
      );
    } else {
      console.error(error);
    }
    await prisma.$disconnect();
    process.exit(1);
  });
