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

export async function getSchoolSettings(): Promise<SchoolSettingsValue> {
  const settings = await prisma.schoolSetting.findUnique({ where: { id: "default" } }).catch(() => null);
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
