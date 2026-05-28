import { NextResponse } from "next/server";
import { WARD_OTHER_OPTION, findProvinceByCode } from "@/lib/administrative-units";
import { getWardsByProvinceCode } from "@/lib/administrative-wards";

export const runtime = "nodejs";

export function GET(request: Request) {
  const url = new URL(request.url);
  const provinceCode = url.searchParams.get("provinceCode") ?? "";
  const province = findProvinceByCode(provinceCode);

  if (!province) {
    return NextResponse.json({ error: "Tỉnh/thành phố không hợp lệ" }, { status: 400 });
  }

  return NextResponse.json({
    province,
    wards: [...getWardsByProvinceCode(province.code), WARD_OTHER_OPTION],
  });
}

