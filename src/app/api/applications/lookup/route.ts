import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSchoolSettings } from "@/lib/school-settings";
import { isRegistrationFormPrintable } from "@/lib/registration-form-access";
import { lookupSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = lookupSchema.safeParse({
    applicationCode: url.searchParams.get("applicationCode") ?? "",
    citizenId: url.searchParams.get("citizenId") ?? "",
    dateOfBirth: url.searchParams.get("dateOfBirth") ?? ""
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Thông tin tra cứu chưa hợp lệ" },
      { status: 400 }
    );
  }

  const [settings, app] = await Promise.all([
    getSchoolSettings(),
    prisma.application.findFirst({
      where: {
        deletedAt: null,
        applicationCode: parsed.data.applicationCode.trim(),
        citizenId: parsed.data.citizenId.trim(),
        dateOfBirth: new Date(parsed.data.dateOfBirth)
      },
      select: {
        applicationCode: true,
        fullName: true,
        dateOfBirth: true,
        secondarySchool: true,
        selectedOptionNumber: true,
        selectedSubjects: true,
        status: true,
        registrationFormNumber: true,
        publicNote: true,
        submittedAt: true,
        physicalDossierStatus: true,
        physicalDossierValidity: true,
        physicalDossierPublicNote: true,
        admissionResult: true,
        admissionPublished: true,
        admissionPublicNote: true,
        admissionBatch: true,
        admissionScoreSnapshot: true
      }
    }),
  ]);

  if (!app) return NextResponse.json({ error: "Không tìm thấy hồ sơ phù hợp" }, { status: 404 });
  const showPersonalAdmissionResult =
    settings.personalResultLookupEnabled && (app.admissionPublished || app.admissionResult !== "CHUA_XET");
  const registrationFormPdfAvailable = isRegistrationFormPrintable(app.status, app.registrationFormNumber);
  return NextResponse.json({
    application: {
      ...app,
      registrationFormPdfAvailable,
      registrationFormNumber: registrationFormPdfAvailable ? app.registrationFormNumber : null,
      admissionResult: showPersonalAdmissionResult ? app.admissionResult : "CHUA_XET",
      admissionPublicNote: showPersonalAdmissionResult ? app.admissionPublicNote : null,
      admissionScoreSnapshot: showPersonalAdmissionResult ? app.admissionScoreSnapshot : null,
      admissionPublished: showPersonalAdmissionResult ? app.admissionPublished : false,
    },
  });
}
