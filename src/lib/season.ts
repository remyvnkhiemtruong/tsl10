/**
 * Helpers to load the currently active/default AdmissionSeason
 * and its related data (rounds, subject options, dossier requirements, legal docs).
 *
 * Falls back to hardcoded constants when DB is not ready (dev only).
 */
import { prisma } from "@/lib/prisma";
import { isPrismaTableMissingError } from "@/lib/school-settings";
import {
  SUBJECT_OPTIONS as FALLBACK_SUBJECT_OPTIONS,
  ADMISSION_BATCH_OPTIONS,
} from "@/lib/constants";

export type SeasonSummary = {
  id: string;
  code: string;
  slug: string;
  name: string;
  quota: number | null;
  method: string;
  principle: string | null;
  description: string | null;
  announcementHtml: string | null;
  registrationOpen: boolean;
  resultsPublished: boolean;
  applicationCodePrefix: string | null;
  academicYear: { name: string };
  rounds: Array<{
    id: string;
    name: string;
    receiveStartAt: Date | null;
    receiveEndAt: Date | null;
    resultPublishAt: Date | null;
    status: string;
    sortOrder: number;
    publicNote: string | null;
  }>;
  subjectOptions: Array<{
    id: string;
    optionNumber: number;
    name: string | null;
    subjects: string;
    isActive: boolean;
    sortOrder: number;
  }>;
  dossierRequirements: Array<{
    id: string;
    title: string;
    description: string | null;
    quantity: string | null;
    specification: string | null;
    isRequired: boolean;
    conditionNote: string | null;
    showOnPublic: boolean;
    showOnPdf: boolean;
    sortOrder: number;
  }>;
  legalDocuments: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    issuedDate: Date | null;
    issuingAgency: string | null;
    summary: string;
    isPublic: boolean;
    sortOrder: number;
  }>;
};

const FALLBACK_SEASON: SeasonSummary = {
  id: "fallback",
  code: "2026-2027",
  slug: "tuyen-sinh-lop-10-2026-2027",
  name: "Tuyển sinh lớp 10 năm học 2026 - 2027",
  quota: 950,
  method: "XET_TUYEN",
  principle: "Xét tuyển theo điểm từ cao xuống thấp đến khi đủ chỉ tiêu.",
  description: null,
  announcementHtml: null,
  registrationOpen: true,
  resultsPublished: false,
  applicationCodePrefix: "VK",
  academicYear: { name: "Năm học 2026 - 2027" },
  rounds: ADMISSION_BATCH_OPTIONS.map((name, i) => ({
    id: `fallback-round-${i + 1}`,
    name,
    receiveStartAt: i === 0 ? new Date("2026-06-18") : new Date("2026-07-19"),
    receiveEndAt: i === 0 ? new Date("2026-07-16") : new Date("2026-07-24"),
    resultPublishAt: i === 0 ? new Date("2026-07-18") : new Date("2026-07-25"),
    status: "CHUA_MO",
    sortOrder: i,
    publicNote: null,
  })),
  subjectOptions: FALLBACK_SUBJECT_OPTIONS.map((opt, i) => ({
    id: `fallback-opt-${opt.optionNumber}`,
    optionNumber: opt.optionNumber,
    name: `Phương án ${opt.optionNumber}`,
    subjects: opt.subjects,
    isActive: true,
    sortOrder: i,
  })),
  dossierRequirements: [
    { id: "dr1", title: "Đơn xin dự tuyển theo mẫu của trường (phiếu đăng ký dự tuyển đã in, ký)", description: null, quantity: "01 bản", specification: null, isRequired: true, conditionNote: null, showOnPublic: true, showOnPdf: true, sortOrder: 0 },
    { id: "dr2", title: "Ảnh chân dung", description: "Ảnh 4×6 cm, chụp không quá 06 tháng", quantity: "02 ảnh", specification: "4×6 cm", isRequired: true, conditionNote: null, showOnPublic: true, showOnPdf: true, sortOrder: 1 },
    { id: "dr3", title: "Học bạ THCS", description: "Bản chính, có xác nhận hoàn thành chương trình THCS của Hiệu trưởng (học sinh lớp 9 năm học 2025-2026)", quantity: "01 bản chính", specification: null, isRequired: true, conditionNote: "Học sinh lớp 9 năm học 2025 - 2026", showOnPublic: true, showOnPdf: true, sortOrder: 2 },
    { id: "dr4", title: "Giấy khai sinh", description: "Bản sao giấy khai sinh hợp lệ", quantity: "01 bản sao", specification: null, isRequired: true, conditionNote: null, showOnPublic: true, showOnPdf: true, sortOrder: 3 },
    { id: "dr5", title: "Giấy tờ định danh cá nhân", description: "Bản photo Căn cước/CCCD hoặc Thông báo số định danh cá nhân hoặc Giấy xác nhận thông tin cư trú. Có bản chính đối chiếu khi cần.", quantity: "01 bản photo", specification: null, isRequired: true, conditionNote: null, showOnPublic: true, showOnPdf: true, sortOrder: 4 },
    { id: "dr6", title: "Giấy xác nhận ưu tiên, khuyến khích", description: "Do cơ quan có thẩm quyền cấp", quantity: "01 bản", specification: null, isRequired: false, conditionNote: "Nếu có diện ưu tiên hoặc giải thưởng khuyến khích", showOnPublic: true, showOnPdf: true, sortOrder: 5 },
    { id: "dr7", title: "Bằng tốt nghiệp THCS", description: "Bản chính hoặc bản sao", quantity: "01 bản", specification: null, isRequired: false, conditionNote: "Học sinh đã tốt nghiệp THCS từ năm học 2024-2025 trở về trước", showOnPublic: true, showOnPdf: true, sortOrder: 6 },
  ],
  legalDocuments: [
    { id: "ld1", documentType: "Thông tư", documentNumber: "30/2024/TT-BGDĐT", issuedDate: new Date("2024-12-31"), issuingAgency: "Bộ Giáo dục và Đào tạo", summary: "Thông tư ban hành Quy chế tuyển sinh THCS và THPT", isPublic: true, sortOrder: 0 },
    { id: "ld2", documentType: "Quyết định", documentNumber: "292/QĐ-SGDĐT", issuedDate: new Date("2026-04-24"), issuingAgency: "Sở GD&ĐT Cà Mau", summary: "Quyết định giao chỉ tiêu tuyển sinh lớp 10 năm học 2026-2027", isPublic: true, sortOrder: 1 },
    { id: "ld3", documentType: "Công văn", documentNumber: "3054/SGDĐT-GDTrH", issuedDate: new Date("2026-04-29"), issuingAgency: "Sở GD&ĐT Cà Mau", summary: "Hướng dẫn công tác tuyển sinh lớp 10 THPT năm học 2026-2027", isPublic: true, sortOrder: 2 },
  ],
};

/** Get the currently active/default AdmissionSeason with all relations. */
export async function getActiveSeason(): Promise<SeasonSummary> {
  try {
    const season = await prisma.admissionSeason.findFirst({
      where: { isDefault: true },
      include: {
        academicYear: { select: { name: true } },
        rounds: { orderBy: { sortOrder: "asc" } },
        subjectOptions: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        dossierRequirements: { orderBy: { sortOrder: "asc" } },
        legalDocuments: { where: { isPublic: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!season) return FALLBACK_SEASON;
    return {
      ...season,
      subjectOptions: season.subjectOptions.length > 0 ? season.subjectOptions : FALLBACK_SEASON.subjectOptions,
      dossierRequirements:
        season.dossierRequirements.length > 0 ? season.dossierRequirements : FALLBACK_SEASON.dossierRequirements,
      legalDocuments: season.legalDocuments.length > 0 ? season.legalDocuments : FALLBACK_SEASON.legalDocuments,
      rounds: season.rounds.length > 0 ? season.rounds : FALLBACK_SEASON.rounds,
    };
  } catch (error) {
    if (isPrismaTableMissingError(error)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[season] DB schema not ready. Using fallback season data.");
      }
      return FALLBACK_SEASON;
    }
    throw error;
  }
}

/** Get all seasons (for admin selector). */
export async function getAllSeasons() {
  try {
    return await prisma.admissionSeason.findMany({
      include: { academicYear: { select: { name: true, code: true } } },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  } catch (error) {
    if (isPrismaTableMissingError(error)) return [];
    throw error;
  }
}

/** Get a ContentBlock by page + block key (with optional season). */
export async function getContentBlock(
  pageKey: string,
  blockKey: string,
  seasonId?: string | null
): Promise<{ title: string | null; body: string | null; subtitle: string | null } | null> {
  try {
    const block = await prisma.contentBlock.findFirst({
      where: {
        pageKey,
        blockKey,
        isEnabled: true,
        ...(seasonId ? { seasonId } : { seasonId: null }),
      },
    });
    return block ?? null;
  } catch (error) {
    if (isPrismaTableMissingError(error)) return null;
    throw error;
  }
}

/** Get all content blocks for a page. */
export async function getContentBlocks(
  pageKey: string,
  seasonId?: string | null
): Promise<Array<{ blockKey: string; title: string | null; subtitle: string | null; body: string | null; isEnabled: boolean; displayOrder: number }>> {
  try {
    return await prisma.contentBlock.findMany({
      where: {
        pageKey,
        ...(seasonId !== undefined ? { seasonId: seasonId ?? null } : {}),
      },
      orderBy: { displayOrder: "asc" },
    });
  } catch (error) {
    if (isPrismaTableMissingError(error)) return [];
    throw error;
  }
}

export { FALLBACK_SEASON };
