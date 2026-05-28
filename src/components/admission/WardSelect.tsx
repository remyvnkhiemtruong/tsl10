"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchableSelect, type SearchableSelectOption } from "@/components/admission/SearchableSelect";
import { type AdministrativeWard, getProvinceCodeByName } from "@/lib/administrative-units";

export function WardSelect({
  provinceName,
  value,
  onChange,
  hasError,
}: {
  provinceName: string;
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
}) {
  const [wards, setWards] = useState<AdministrativeWard[]>([]);
  const [loading, setLoading] = useState(false);
  const provinceCode = getProvinceCodeByName(provinceName);

  useEffect(() => {
    let active = true;
    async function loadWards() {
      if (!provinceCode) {
        setWards([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/administrative-units/wards?provinceCode=${encodeURIComponent(provinceCode)}`);
        const json = (await response.json()) as { wards?: AdministrativeWard[] };
        if (active) setWards(json.wards ?? []);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadWards();
    return () => {
      active = false;
    };
  }, [provinceCode]);

  const options = useMemo<SearchableSelectOption[]>(
    () =>
      wards.map((ward) => ({
        value: ward.code.startsWith("__") ? ward.code : ward.name,
        label: ward.name,
        description: ward.code.startsWith("__") ? undefined : ward.type,
      })),
    [wards]
  );

  return (
    <SearchableSelect
      value={value}
      options={options}
      onChange={onChange}
      placeholder={loading ? "Đang tải xã/phường..." : "Chọn xã/phường"}
      disabled={!provinceCode || loading}
      hasError={hasError}
    />
  );
}

