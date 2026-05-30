import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { Prisma, PriorityType, Prize } from "@prisma/client";
import { ZodError } from "zod";
import { calculateAdmissionScoreWithBonuses } from "@/lib/admission-score";
import { WARD_OTHER_VALUE } from "@/lib/administrative-units";
import { composePermanentAddress } from "@/lib/address";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  adminApplicationUpdateSchema,
  applicationUpdateSchema,
  prizeScore,
  zodFieldErrors,
} from "@/lib/validation";
import { SUBJECT_OPTIONS } from "@/lib/constants";

export const runtime = "nodejs";

function logAction(status: string) {
  if (status === "DA_DUYET_XET_TUYEN") return "APPROVED" as const;
  if (status === "KHONG_HOP_LE") return "REJECTED" as const;
  if (status === "CAN_BO_SUNG") return "REQUESTED_SUPPLEMENT" as const;
  return "STATUS_UPDATED" as const;
}

function optionalDate(value?: string) {
  return value ? new Date(value) : null;
}

async function registrationFormNumberBelongsToAnotherApplication(
  registrationFormNumber: string | undefined,
  applicationId: string,
  admissionSeasonId: string | null
) {
  if (!registrationFormNumber) return false;
  const duplicate = await prisma.application.findFirst({
    where: {
      registrationFormNumber,
      id: { not: applicationId },
      admissionSeasonId,
    },
    select: { id: true },
  });
  return Boolean(duplicate);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = applicationUpdateSchema.parse(body);
    const current = await prisma.application.findFirst({ where: { id, deletedAt: null } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
    if (await registrationFormNumberBelongsToAnotherApplication(parsed.registrationFormNumber, id, current.admissionSeasonId)) {
      return NextResponse.json({ error: "Số phiếu này đã được cấp cho hồ sơ khác." }, { status: 409 });
    }

    const app = await prisma.application.update({
      where: { id },
      data: {
        status: parsed.status,
        registrationFormNumber: parsed.registrationFormNumber ?? null,
        publicNote: parsed.publicNote ?? null,
        internalNote: parsed.internalNote ?? current.internalNote,
        logs: {
          create: [
            {
              userId: user.id,
              action: logAction(parsed.status),
              oldValue: current.status,
              newValue: parsed.status,
              note: parsed.publicNote || parsed.internalNote
            }
          ]
        }
      }
    });
    return NextResponse.json({ application: app });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Dữ liệu cập nhật chưa hợp lệ" }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Số phiếu hoặc số định danh đã được sử dụng cho hồ sơ khác." }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = adminApplicationUpdateSchema.parse(body);
    const current = await prisma.application.findFirst({
      where: { id, deletedAt: null },
      include: { academicRecords: true, priorities: true, awards: true },
    });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    if (parsed.citizenId !== current.citizenId) {
      const duplicate = await prisma.application.findFirst({
        where: {
          citizenId: parsed.citizenId,
          id: { not: id },
          admissionSeasonId: current.admissionSeasonId,
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Số định danh này đã có hồ sơ đăng ký" }, { status: 409 });
      }
    }
    if (await registrationFormNumberBelongsToAnotherApplication(parsed.registrationFormNumber, id, current.admissionSeasonId)) {
      return NextResponse.json({ error: "Số phiếu này đã được cấp cho hồ sơ khác." }, { status: 409 });
    }

    const selected = SUBJECT_OPTIONS.find((item) => item.optionNumber === parsed.selectedOptionNumber);
    const finalWard = parsed.ward === WARD_OTHER_VALUE ? parsed.wardOther : parsed.ward;
    const permanentAddress = composePermanentAddress({
      houseNumber: parsed.houseNumber,
      hamlet: parsed.hamlet,
      ward: finalWard,
      province: parsed.province,
    });
    const scoreDetails = calculateAdmissionScoreWithBonuses(parsed.academicRecords, parsed.priorities, parsed.awards);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.priorityRecord.deleteMany({ where: { applicationId: id } });
      await tx.awardRecord.deleteMany({ where: { applicationId: id } });
      await tx.academicRecord.deleteMany({ where: { applicationId: id } });

      return tx.application.update({
        where: { id },
        data: {
          status: parsed.status,
          registrationFormNumber: parsed.registrationFormNumber ?? null,
          fullName: parsed.fullName,
          dateOfBirth: new Date(parsed.dateOfBirth),
          gender: parsed.gender,
          ethnicity: parsed.ethnicity,
          birthPlace: parsed.birthPlace,
          citizenId: parsed.citizenId,
          issueDate: optionalDate(parsed.issueDate),
          issuePlace: parsed.issuePlace ?? null,
          secondarySchool: parsed.secondarySchool,
          secondarySchoolOldAddress: parsed.secondarySchoolOldAddress ?? null,
          secondarySchoolAddress: parsed.secondarySchoolAddress ?? null,
          schoolYear: parsed.schoolYear,
          permanentAddress,
          houseNumber: parsed.houseNumber,
          hamlet: parsed.hamlet,
          ward: finalWard,
          province: parsed.province,
          studentPhone: parsed.studentPhone,
          email: parsed.email,
          guardianName: parsed.guardianName,
          guardianPhone: parsed.guardianPhone,
          selectedOptionNumber: parsed.selectedOptionNumber,
          selectedSubjects: selected?.subjects ?? parsed.selectedSubjects,
          bonusScore: scoreDetails.bonusScore,
          additionalAwardsNote: parsed.additionalAwardsNote ?? null,
          publicNote: parsed.publicNote ?? null,
          internalNote: parsed.internalNote ?? null,
          priorities: {
            create: parsed.priorities.map((type) => ({ type: type as PriorityType })),
          },
          awards: {
            create: parsed.awards.map((award) => ({
              competitionName: award.competitionName,
              field: award.field,
              level: award.level,
              year: award.year,
              prize: award.prize as Prize,
              bonusScore: prizeScore(award.prize),
            })),
          },
          academicRecords: {
            create: parsed.academicRecords.map((record) => ({
              grade: record.grade,
              literature: record.literature,
              math: record.math,
              english: record.english,
              naturalScience: record.naturalScience,
              historyGeography: record.historyGeography,
              civicEducation: record.civicEducation,
              technology: record.technology,
              informatics: record.informatics,
              note: record.note,
              academicLevel: record.academicLevel,
              conductLevel: record.conductLevel,
            })),
          },
          logs: {
            create: [
              {
                userId: user.id,
                action: parsed.status === current.status ? "UPDATED" : "STATUS_UPDATED",
                oldValue: current.status,
                newValue: parsed.status,
                note: "Admin chỉnh sửa hồ sơ",
              },
            ],
          },
        },
        include: { academicRecords: true, priorities: true, awards: true },
      });
    });

    return NextResponse.json({ application: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Dữ liệu cập nhật chưa hợp lệ",
          fieldErrors: zodFieldErrors(error),
        },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Số phiếu hoặc số định danh đã được sử dụng cho hồ sơ khác." }, { status: 409 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { deleteReason?: unknown };
    const deleteReason =
      typeof body.deleteReason === "string" && body.deleteReason.trim()
        ? body.deleteReason.trim()
        : "Admin xóa hồ sơ";

    const current = await prisma.application.findFirst({ where: { id, deletedAt: null } });
    if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

    await prisma.application.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: user.id,
        deleteReason,
        logs: {
          create: [
            {
              userId: user.id,
              action: "DELETED",
              oldValue: current.status,
              note: deleteReason,
            },
          ],
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xóa hồ sơ" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  const parsed = applicationUpdateSchema.parse({
    status: String(formData.get("status") ?? ""),
    registrationFormNumber: String(formData.get("registrationFormNumber") ?? ""),
    publicNote: String(formData.get("publicNote") ?? ""),
    internalNote: String(formData.get("internalNote") ?? "")
  });
  const current = await prisma.application.findFirst({ where: { id, deletedAt: null } });
  if (!current) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  if (await registrationFormNumberBelongsToAnotherApplication(parsed.registrationFormNumber, id, current.admissionSeasonId)) {
    return NextResponse.json({ error: "Số phiếu này đã được cấp cho hồ sơ khác." }, { status: 409 });
  }

  await prisma.application.update({
    where: { id },
    data: {
      status: parsed.status,
      registrationFormNumber: parsed.registrationFormNumber ?? null,
      publicNote: parsed.publicNote ?? null,
      internalNote: parsed.internalNote ?? null,
      logs: {
        create: [
          {
            userId: user.id,
            action: logAction(parsed.status),
            oldValue: current.status,
            newValue: parsed.status,
            note: parsed.publicNote || parsed.internalNote
          }
        ]
      }
    }
  });
  redirect(`/admin/ho-so/${id}`);
}
