import { prisma } from "@/lib/prisma";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function defaultPrefixFromSeason(season?: { applicationCodePrefix?: string | null; academicYear?: { code?: string | null } }) {
  if (season?.applicationCodePrefix?.trim()) return season.applicationCodePrefix.trim();
  const year = season?.academicYear?.code?.match(/\d{4}/)?.[0] ?? "2026";
  return `VK${year}-`;
}

export async function generateApplicationCode(season?: {
  id?: string | null;
  applicationCodePrefix?: string | null;
  academicYear?: { code?: string | null };
}) {
  const prefix = defaultPrefixFromSeason(season);
  const numberWidth = prefix.endsWith("-") ? 6 : 4;
  const latest = await prisma.application.findFirst({
    where: season?.id ? { admissionSeasonId: season.id } : {},
    orderBy: { applicationCode: "desc" },
    select: { applicationCode: true }
  });
  const latestNumber = latest?.applicationCode.match(new RegExp(`^${escapeRegExp(prefix)}(\\d+)$`))?.[1];
  const next = latestNumber ? Number(latestNumber) + 1 : 1;
  return `${prefix}${String(next).padStart(numberWidth, "0")}`;
}
