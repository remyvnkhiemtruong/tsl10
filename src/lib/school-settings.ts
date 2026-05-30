import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SCHOOL_SETTINGS,
  normalizeLeadershipContacts,
  normalizeSchoolContact,
  type SchoolSettingsValue,
} from "@/lib/school-contact";

function dateToIso(value: Date | null | undefined, fallback: string) {
  return value ? value.toISOString() : fallback;
}

/**
 * Returns true when the Prisma error is a table/column not found error,
 * which means migrations haven't been applied yet.
 */
export function isPrismaTableMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  // P2021: table does not exist, P2022: column does not exist
  return (
    msg.includes("p2021") ||
    msg.includes("p2022") ||
    msg.includes("does not exist") ||
    msg.includes("relation") ||
    msg.includes("no such table") ||
    msg.includes("invalid_catalog_name")
  );
}

export async function getSchoolSettings(): Promise<SchoolSettingsValue> {
  try {
    const settings = await prisma.schoolSetting.findUnique({ where: { id: "default" } });
    if (!settings) return DEFAULT_SCHOOL_SETTINGS;

    return {
      contact: normalizeSchoolContact(settings.schoolContactJson),
      leadershipContacts: normalizeLeadershipContacts(settings.leadershipContactsJson),
      publicLeadershipPhones: settings.publicLeadershipPhones,
      registrationDeadline: dateToIso(settings.registrationDeadline, DEFAULT_SCHOOL_SETTINGS.registrationDeadline),
      admissionRound1PublishAt: dateToIso(settings.admissionRound1PublishAt, DEFAULT_SCHOOL_SETTINGS.admissionRound1PublishAt),
      admissionRound2PublishAt: dateToIso(settings.admissionRound2PublishAt, DEFAULT_SCHOOL_SETTINGS.admissionRound2PublishAt),
      personalResultLookupEnabled: settings.personalResultLookupEnabled,
      registrationLockedNote: settings.registrationLockedNote ?? DEFAULT_SCHOOL_SETTINGS.registrationLockedNote,
    };
  } catch (error) {
    if (isPrismaTableMissingError(error)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[school-settings] DB schema not ready (migration not applied?). Using default settings.\n" +
          "  → Run: npx prisma migrate deploy && npm run dev"
        );
      } else {
        // In production a missing table is a real error – rethrow so it surfaces
        throw error;
      }
    } else {
      console.error("[school-settings] Unexpected DB error:", error);
    }
    return DEFAULT_SCHOOL_SETTINGS;
  }
}

export async function upsertSchoolSettings(data: SchoolSettingsValue, updatedById?: string) {
  return prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {
      schoolContactJson: data.contact as unknown as Prisma.InputJsonValue,
      leadershipContactsJson: data.leadershipContacts as unknown as Prisma.InputJsonValue,
      publicLeadershipPhones: data.publicLeadershipPhones,
      registrationDeadline: new Date(data.registrationDeadline),
      admissionRound1PublishAt: new Date(data.admissionRound1PublishAt),
      admissionRound2PublishAt: new Date(data.admissionRound2PublishAt),
      personalResultLookupEnabled: data.personalResultLookupEnabled,
      registrationLockedNote: data.registrationLockedNote,
      updatedById,
    },
    create: {
      id: "default",
      schoolContactJson: data.contact as unknown as Prisma.InputJsonValue,
      leadershipContactsJson: data.leadershipContacts as unknown as Prisma.InputJsonValue,
      publicLeadershipPhones: data.publicLeadershipPhones,
      registrationDeadline: new Date(data.registrationDeadline),
      admissionRound1PublishAt: new Date(data.admissionRound1PublishAt),
      admissionRound2PublishAt: new Date(data.admissionRound2PublishAt),
      personalResultLookupEnabled: data.personalResultLookupEnabled,
      registrationLockedNote: data.registrationLockedNote,
      updatedById,
    },
  });
}
