import wards1 from "@/data/administrative-units/wards/1.json";
import wards4 from "@/data/administrative-units/wards/4.json";
import wards8 from "@/data/administrative-units/wards/8.json";
import wards11 from "@/data/administrative-units/wards/11.json";
import wards12 from "@/data/administrative-units/wards/12.json";
import wards14 from "@/data/administrative-units/wards/14.json";
import wards15 from "@/data/administrative-units/wards/15.json";
import wards19 from "@/data/administrative-units/wards/19.json";
import wards20 from "@/data/administrative-units/wards/20.json";
import wards22 from "@/data/administrative-units/wards/22.json";
import wards24 from "@/data/administrative-units/wards/24.json";
import wards25 from "@/data/administrative-units/wards/25.json";
import wards31 from "@/data/administrative-units/wards/31.json";
import wards33 from "@/data/administrative-units/wards/33.json";
import wards37 from "@/data/administrative-units/wards/37.json";
import wards38 from "@/data/administrative-units/wards/38.json";
import wards40 from "@/data/administrative-units/wards/40.json";
import wards42 from "@/data/administrative-units/wards/42.json";
import wards44 from "@/data/administrative-units/wards/44.json";
import wards46 from "@/data/administrative-units/wards/46.json";
import wards48 from "@/data/administrative-units/wards/48.json";
import wards51 from "@/data/administrative-units/wards/51.json";
import wards52 from "@/data/administrative-units/wards/52.json";
import wards56 from "@/data/administrative-units/wards/56.json";
import wards66 from "@/data/administrative-units/wards/66.json";
import wards68 from "@/data/administrative-units/wards/68.json";
import wards75 from "@/data/administrative-units/wards/75.json";
import wards79 from "@/data/administrative-units/wards/79.json";
import wards80 from "@/data/administrative-units/wards/80.json";
import wards82 from "@/data/administrative-units/wards/82.json";
import wards86 from "@/data/administrative-units/wards/86.json";
import wards91 from "@/data/administrative-units/wards/91.json";
import wards92 from "@/data/administrative-units/wards/92.json";
import wards96 from "@/data/administrative-units/wards/96.json";
import {
  type AdministrativeProvince,
  type AdministrativeWard,
  WARD_OTHER_OPTION,
  findProvinceByCode,
  findProvinceByName,
} from "@/lib/administrative-units";

const wardMap: Record<string, AdministrativeWard[]> = {
  "1": wards1 as AdministrativeWard[],
  "4": wards4 as AdministrativeWard[],
  "8": wards8 as AdministrativeWard[],
  "11": wards11 as AdministrativeWard[],
  "12": wards12 as AdministrativeWard[],
  "14": wards14 as AdministrativeWard[],
  "15": wards15 as AdministrativeWard[],
  "19": wards19 as AdministrativeWard[],
  "20": wards20 as AdministrativeWard[],
  "22": wards22 as AdministrativeWard[],
  "24": wards24 as AdministrativeWard[],
  "25": wards25 as AdministrativeWard[],
  "31": wards31 as AdministrativeWard[],
  "33": wards33 as AdministrativeWard[],
  "37": wards37 as AdministrativeWard[],
  "38": wards38 as AdministrativeWard[],
  "40": wards40 as AdministrativeWard[],
  "42": wards42 as AdministrativeWard[],
  "44": wards44 as AdministrativeWard[],
  "46": wards46 as AdministrativeWard[],
  "48": wards48 as AdministrativeWard[],
  "51": wards51 as AdministrativeWard[],
  "52": wards52 as AdministrativeWard[],
  "56": wards56 as AdministrativeWard[],
  "66": wards66 as AdministrativeWard[],
  "68": wards68 as AdministrativeWard[],
  "75": wards75 as AdministrativeWard[],
  "79": wards79 as AdministrativeWard[],
  "80": wards80 as AdministrativeWard[],
  "82": wards82 as AdministrativeWard[],
  "86": wards86 as AdministrativeWard[],
  "91": wards91 as AdministrativeWard[],
  "92": wards92 as AdministrativeWard[],
  "96": wards96 as AdministrativeWard[],
};

export function getWardsByProvinceCode(code: string | number | null | undefined, includeOther = false) {
  const wards = wardMap[String(code ?? "")] ?? [];
  return includeOther ? [...wards, WARD_OTHER_OPTION] : wards;
}

export function getWardsByProvinceName(name: string | null | undefined, includeOther = false) {
  const province = findProvinceByName(name);
  return getWardsByProvinceCode(province?.code, includeOther);
}

export function getProvinceWithWards(code: string | number | null | undefined): AdministrativeProvince | null {
  const province = findProvinceByCode(code);
  if (!province) return null;
  return {
    code: province.code,
    name: province.name,
    type: province.type,
    wards: getWardsByProvinceCode(province.code),
  };
}

export function isKnownWardName(provinceName: string | null | undefined, wardName: string | null | undefined) {
  const normalizedWard = String(wardName ?? "").trim();
  if (!normalizedWard) return false;
  return getWardsByProvinceName(provinceName).some((ward) => ward.name === normalizedWard);
}

