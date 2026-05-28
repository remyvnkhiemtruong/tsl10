import {
  ADMISSION_ROUND_1_PUBLISH_AT,
  ADMISSION_ROUND_2_PUBLISH_AT,
  REGISTRATION_CLOSE_AT,
} from "@/lib/constants";

export type SchoolContact = {
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  note: string;
};

export type SchoolLeadershipContact = {
  name: string;
  title: string;
  extraRole: string;
  publicContact: string;
  sortOrder: number;
};

export type SchoolSettingsValue = {
  contact: SchoolContact;
  leadershipContacts: SchoolLeadershipContact[];
  publicLeadershipPhones: boolean;
  registrationDeadline: string;
  admissionRound1PublishAt: string;
  admissionRound2PublishAt: string;
  personalResultLookupEnabled: boolean;
  registrationLockedNote: string;
};

export const SCHOOL_CONTACT: SchoolContact = {
  schoolName: "Trường THPT Võ Văn Kiệt",
  address: "Số 10B - Ấp Long Hòa - Xã Phước Long - Tỉnh Cà Mau",
  phone: "",
  email: "c3vovankiet@camau.edu.vn",
  website: "https://thptvovankiet.sgdcamau.edu.vn/",
  note:
    "Thông tin liên hệ lấy từ website chính thức của Trường THPT Võ Văn Kiệt Cà Mau; cho phép admin chỉnh sửa trong cấu hình nếu nhà trường cập nhật.",
};

export const SCHOOL_LEADERSHIP_CONTACTS = [
  {
    name: "Trần Quang Điện",
    title: "Hiệu trưởng",
    extraRole: "Bí thư Đảng bộ, Chủ tịch Hội đồng trường",
    publicContact: "0913631226",
    sortOrder: 1,
  },
  {
    name: "Đoàn Vũ Phượng",
    title: "Phó Hiệu trưởng",
    extraRole: "",
    publicContact: "0944340345",
    sortOrder: 2,
  },
  {
    name: "Lâm Bảo Toàn",
    title: "Phó Hiệu trưởng",
    extraRole: "",
    publicContact: "0977937211",
    sortOrder: 3,
  },
] as const satisfies SchoolLeadershipContact[];

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettingsValue = {
  contact: SCHOOL_CONTACT,
  leadershipContacts: [...SCHOOL_LEADERSHIP_CONTACTS],
  publicLeadershipPhones: true,
  registrationDeadline: REGISTRATION_CLOSE_AT,
  admissionRound1PublishAt: ADMISSION_ROUND_1_PUBLISH_AT,
  admissionRound2PublishAt: ADMISSION_ROUND_2_PUBLISH_AT,
  personalResultLookupEnabled: true,
  registrationLockedNote:
    "Cổng đăng ký trực tuyến đã hết thời gian tiếp nhận. Vui lòng theo dõi thông báo của Trường THPT Võ Văn Kiệt.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function normalizeSchoolContact(value: unknown): SchoolContact {
  if (!isRecord(value)) return SCHOOL_CONTACT;
  return {
    schoolName: text(value.schoolName, SCHOOL_CONTACT.schoolName),
    address: text(value.address, SCHOOL_CONTACT.address),
    phone: text(value.phone, SCHOOL_CONTACT.phone),
    email: text(value.email, SCHOOL_CONTACT.email),
    website: text(value.website, SCHOOL_CONTACT.website),
    note: text(value.note, SCHOOL_CONTACT.note),
  };
}

export function normalizeLeadershipContacts(value: unknown): SchoolLeadershipContact[] {
  if (!Array.isArray(value)) return [...SCHOOL_LEADERSHIP_CONTACTS];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      name: text(item.name),
      title: text(item.title),
      extraRole: text(item.extraRole),
      publicContact: text(item.publicContact),
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : index + 1,
    }))
    .filter((item) => item.name && item.title)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
