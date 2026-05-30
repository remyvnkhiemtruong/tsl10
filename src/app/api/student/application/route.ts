import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Returns the application for the current student session (no sensitive admin fields). */
export async function GET() {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const app = await prisma.application.findFirst({
    where: { id: session.applicationId, deletedAt: null },
    select: {
      id: true,
      applicationCode: true,
      status: true,
      fullName: true,
      dateOfBirth: true,
      gender: true,
      ethnicity: true,
      birthPlace: true,
      citizenId: true,
      issueDate: true,
      issuePlace: true,
      secondarySchool: true,
      secondarySchoolAddress: true,
      secondarySchoolOldAddress: true,
      schoolYear: true,
      permanentAddress: true,
      houseNumber: true,
      hamlet: true,
      ward: true,
      province: true,
      studentPhone: true,
      email: true,
      guardianName: true,
      guardianPhone: true,
      selectedOptionNumber: true,
      selectedSubjects: true,
      bonusScore: true,
      additionalAwardsNote: true,
      publicNote: true,
      admissionResult: true,
      admissionPublished: true,
      admissionPublicNote: true,
      admissionRank: true,
      admissionBatch: true,
      admissionScoreSnapshot: true,
      physicalDossierStatus: true,
      physicalDossierValidity: true,
      physicalDossierPublicNote: true,
      studentEditLocked: true,
      lastEditRequestAt: true,
      lastEditApprovedAt: true,
      submittedAt: true,
      academicRecords: {
        orderBy: { grade: "asc" },
      },
      priorities: true,
      awards: true,
      files: {
        select: {
          id: true,
          fileType: true,
          originalName: true,
          mimeType: true,
          size: true,
          status: true,
          uploadedAt: true,
        },
      },
      editRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          requestCode: true,
          status: true,
          studentNote: true,
          officerNote: true,
          rejectionReason: true,
          submittedAt: true,
          reviewedAt: true,
          changedFieldsJson: true,
        },
      },
    },
  });

  if (!app) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  return NextResponse.json({ application: app });
}
