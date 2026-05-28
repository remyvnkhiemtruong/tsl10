import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/AdminShell";
import { prisma } from "@/lib/prisma";
import { WARD_OTHER_VALUE } from "@/lib/administrative-units";
import { isKnownWardName } from "@/lib/administrative-wards";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { EditApplicationForm, type AdminEditFormValue } from "./EditApplicationForm";

export const dynamic = "force-dynamic";

function dateInput(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function EditAdminApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await prisma.application.findFirst({
    where: { id, deletedAt: null },
    include: {
      academicRecords: { orderBy: { grade: "asc" } },
      priorities: true,
      awards: true,
    },
  });
  if (!app) notFound();

  const existingWard = app.ward ?? "";
  const hasKnownWard = Boolean(existingWard) && isKnownWardName(app.province, existingWard);
  const initial: AdminEditFormValue = {
    id: app.id,
    fullName: app.fullName,
    dateOfBirth: dateInput(app.dateOfBirth),
    gender: app.gender,
    ethnicity: app.ethnicity,
    birthPlace: app.birthPlace,
    citizenId: app.citizenId,
    issueDate: dateInput(app.issueDate),
    issuePlace: app.issuePlace ?? "",
    secondarySchool: app.secondarySchool,
    secondarySchoolOldAddress: app.secondarySchoolOldAddress ?? "",
    secondarySchoolAddress: app.secondarySchoolAddress ?? "",
    schoolYear: app.schoolYear,
    houseNumber: app.houseNumber ?? "",
    hamlet: app.hamlet ?? "",
    province: app.province ?? "Cà Mau",
    ward: existingWard ? (hasKnownWard ? existingWard : WARD_OTHER_VALUE) : "",
    wardOther: existingWard && !hasKnownWard ? existingWard : "",
    studentPhone: app.studentPhone ?? "",
    email: app.email ?? "",
    guardianName: app.guardianName,
    guardianPhone: app.guardianPhone,
    selectedOptionNumber: app.selectedOptionNumber,
    selectedSubjects:
      SUBJECT_OPTIONS.find((option) => option.optionNumber === app.selectedOptionNumber)?.subjects ?? app.selectedSubjects,
    priorities: app.priorities.map((priority) => priority.type),
    awards: app.awards.map((award) => ({
      competitionName: award.competitionName,
      field: award.field ?? "",
      level: award.level ?? "",
      year: award.year ?? undefined,
      prize: award.prize,
    })),
    additionalAwardsNote: app.additionalAwardsNote ?? "",
    academicRecords: app.academicRecords.map((record) => ({
      grade: record.grade,
      literature: record.literature ?? undefined,
      math: record.math ?? undefined,
      english: record.english ?? undefined,
      naturalScience: record.naturalScience ?? undefined,
      historyGeography: record.historyGeography ?? undefined,
      civicEducation: record.civicEducation ?? undefined,
      technology: record.technology ?? undefined,
      informatics: record.informatics ?? undefined,
      note: record.note ?? "",
      academicLevel: record.academicLevel ?? "TOT",
      conductLevel: record.conductLevel ?? "TOT",
    })),
    status: app.status,
    publicNote: app.publicNote ?? "",
    internalNote: app.internalNote ?? "",
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-school-700">Chỉnh sửa hồ sơ</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">{app.applicationCode}</h1>
          <p className="mt-1 text-sm text-slate-600">{app.fullName}</p>
        </div>
        <Link
          href={`/admin/ho-so/${app.id}`}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
        >
          Quay lại chi tiết
        </Link>
      </div>
      <EditApplicationForm initial={initial} />
    </AdminShell>
  );
}
