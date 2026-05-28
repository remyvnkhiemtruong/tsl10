import schools from "@/data/secondary-schools/ca-mau-secondary-schools.json";

export type SecondarySchool = {
  id: string;
  name: string;
  normalizedName: string;
  province: "Cà Mau";
  oldAddress: string;
  newAddress: string;
};

export const SECONDARY_SCHOOL_OTHER_ID = "__OTHER_SECONDARY_SCHOOL__";
export const SECONDARY_SCHOOL_OTHER_LABEL = "Trường khác / nhập thủ công";

export const CA_MAU_SECONDARY_SCHOOLS = schools as SecondarySchool[];

export function normalizeVietnamese(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function findSecondarySchoolById(id: string) {
  return CA_MAU_SECONDARY_SCHOOLS.find((school) => school.id === id);
}

export function searchSecondarySchools(query = "", filters?: { oldAddress?: string; newAddress?: string; limit?: number }) {
  const normalizedQuery = normalizeVietnamese(query);
  const normalizedOldAddress = normalizeVietnamese(filters?.oldAddress ?? "");
  const normalizedNewAddress = normalizeVietnamese(filters?.newAddress ?? "");
  const limit = filters?.limit ?? 50;

  return CA_MAU_SECONDARY_SCHOOLS.filter((school) => {
    const haystack = normalizeVietnamese(`${school.name} ${school.oldAddress} ${school.newAddress}`);
    if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
    if (normalizedOldAddress && !normalizeVietnamese(school.oldAddress).includes(normalizedOldAddress)) return false;
    if (normalizedNewAddress && !normalizeVietnamese(school.newAddress).includes(normalizedNewAddress)) return false;
    return true;
  }).slice(0, limit);
}

export function secondarySchoolOptionLabel(school: SecondarySchool) {
  return `${school.name} - ${school.oldAddress} - ${school.newAddress}`;
}
