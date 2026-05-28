import provincesData from "@/data/administrative-units/provinces.json";

export type AdministrativeWard = {
  code: string;
  name: string;
  type: "phường" | "xã" | "đặc khu" | "thị trấn" | "khác";
};

export type AdministrativeProvince = {
  code: string;
  name: string;
  type: "thành phố" | "tỉnh";
  wards: AdministrativeWard[];
};

export type AdministrativeProvinceSummary = Omit<AdministrativeProvince, "wards"> & {
  wardCount: number;
};

export const WARD_OTHER_VALUE = "__OTHER_WARD__";
export const WARD_OTHER_LABEL = "Khác / bổ sung theo thông báo của địa phương";

export const WARD_OTHER_OPTION: AdministrativeWard = {
  code: WARD_OTHER_VALUE,
  name: WARD_OTHER_LABEL,
  type: "khác",
};

export const PROVINCES_2025 = [
  "Hà Nội",
  "Huế",
  "Lai Châu",
  "Điện Biên",
  "Sơn La",
  "Lạng Sơn",
  "Quảng Ninh",
  "Thanh Hóa",
  "Nghệ An",
  "Hà Tĩnh",
  "Cao Bằng",
  "Tuyên Quang",
  "Lào Cai",
  "Thái Nguyên",
  "Phú Thọ",
  "Bắc Ninh",
  "Hưng Yên",
  "Hải Phòng",
  "Ninh Bình",
  "Quảng Trị",
  "Đà Nẵng",
  "Quảng Ngãi",
  "Gia Lai",
  "Khánh Hòa",
  "Lâm Đồng",
  "Đắk Lắk",
  "Thành phố Hồ Chí Minh",
  "Đồng Nai",
  "Tây Ninh",
  "Cần Thơ",
  "Vĩnh Long",
  "Đồng Tháp",
  "Cà Mau",
  "An Giang",
] as const;

export const administrativeProvinces = provincesData as AdministrativeProvinceSummary[];

export function getProvinceSummaries() {
  return administrativeProvinces;
}

export function findProvinceByCode(code: string | number | null | undefined) {
  const normalizedCode = String(code ?? "");
  return administrativeProvinces.find((province) => province.code === normalizedCode);
}

export function findProvinceByName(name: string | null | undefined) {
  const normalizedName = String(name ?? "").trim();
  return administrativeProvinces.find((province) => province.name === normalizedName);
}

export function isKnownProvinceName(name: string | null | undefined) {
  return Boolean(findProvinceByName(name));
}

export function getProvinceCodeByName(name: string | null | undefined) {
  return findProvinceByName(name)?.code;
}

