export type PermanentAddressParts = {
  houseNumber?: string | null;
  hamlet?: string | null;
  ward?: string | null;
  province?: string | null;
};

export function composePermanentAddress({ houseNumber, hamlet, ward, province }: PermanentAddressParts) {
  return [houseNumber, hamlet, ward, province]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(", ");
}

