"use client";

import { SearchableSelect } from "@/components/admission/SearchableSelect";
import { getProvinceSummaries } from "@/lib/administrative-units";

const provinceOptions = getProvinceSummaries().map((province) => ({
  value: province.name,
  label: province.name,
  description: `${province.type} · ${province.wardCount} xã/phường`,
}));

export function ProvinceSelect({
  value,
  onChange,
  placeholder = "Chọn tỉnh/thành phố",
  hasError,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
}) {
  return <SearchableSelect value={value} options={provinceOptions} onChange={onChange} placeholder={placeholder} hasError={hasError} />;
}

