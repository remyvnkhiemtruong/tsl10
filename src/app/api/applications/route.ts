import { NextResponse } from "next/server";
import { Prisma, FileType, PriorityType, Prize } from "@prisma/client";
import { ZodError } from "zod";
import { generateApplicationCode } from "@/lib/application-code";
import { SUBJECT_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { applicationCreateSchema, prizeScore } from "@/lib/validation";

export const runtime = "nodejs";

function zodMessage(error: ZodError) {
  return error.issues.map((issue) => issue.message).join("; ");
}

function optionalDate(value?: string) {
  return value ? new Date(value) : null;
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = applicationCreateSchema.parse(json);
    const duplicate = await prisma.application.findUnique({ where: { citizenId: parsed.citizenId } });
    if (duplicate) {
      return NextResponse.json({ error: "Số định danh này đã có hồ sơ đăng ký" }, { status: 409 });
    }

    const selected = SUBJECT_OPTIONS.find((item) => item.optionNumber === parsed.selectedOptionNumber);
    const bonusScore = parsed.awards.reduce((sum, award) => sum + prizeScore(award.prize), 0);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = await generateApplicationCode();
      try {
        const created = await prisma.application.create({
          data: {
            applicationCode: code,
            fullName: parsed.fullName,
            dateOfBirth: new Date(parsed.dateOfBirth),
            gender: parsed.gender,
            ethnicity: parsed.ethnicity,
            birthPlace: parsed.birthPlace,
            citizenId: parsed.citizenId,
            issueDate: optionalDate(parsed.issueDate),
            issuePlace: parsed.issuePlace,
            secondarySchool: parsed.secondarySchool,
            schoolYear: parsed.schoolYear,
            permanentAddress: parsed.permanentAddress,
            houseNumber: parsed.houseNumber,
            hamlet: parsed.hamlet,
            ward: parsed.ward,
            province: parsed.province,
            studentPhone: parsed.studentPhone,
            email: parsed.email || null,
            guardianName: parsed.guardianName,
            guardianPhone: parsed.guardianPhone,
            selectedOptionNumber: parsed.selectedOptionNumber,
            selectedSubjects: selected?.subjects ?? parsed.selectedSubjects,
            bonusScore,
            commitmentAccepted: parsed.commitmentAccepted,
            priorities: {
              create: parsed.priorities.map((type) => ({ type: type as PriorityType }))
            },
            awards: {
              create: parsed.awards.map((award) => ({
                competitionName: award.competitionName,
                field: award.field,
                level: award.level,
                year: award.year,
                prize: award.prize as Prize,
                bonusScore: prizeScore(award.prize)
              }))
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
                conductLevel: record.conductLevel
              }))
            },
            files: {
              create: parsed.uploadedFiles.map((file) => ({
                fileType: file.fileType as FileType,
                originalName: file.originalName,
                storedName: file.storedName,
                mimeType: file.mimeType,
                size: file.size,
                storageKey: file.storageKey,
                storageProvider: file.storageProvider ?? "LOCAL",
                publicUrl: file.publicUrl || null
              }))
            },
            logs: { create: [{ action: "CREATED", note: "Học sinh nộp hồ sơ trực tuyến" }] }
          }
        });

        return NextResponse.json({ id: created.id, applicationCode: created.applicationCode });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002" && String(error.meta?.target).includes("citizenId")) {
            return NextResponse.json({ error: "Số định danh này đã có hồ sơ đăng ký" }, { status: 409 });
          }
          if (error.code === "P2002" && attempt < 2) continue;
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Không thể sinh mã hồ sơ, vui lòng thử lại" }, { status: 500 });
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      return NextResponse.json({ error: zodMessage(error) }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể tạo hồ sơ" },
      { status: 400 }
    );
  }
}
