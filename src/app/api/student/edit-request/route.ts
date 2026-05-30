import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/student-auth";

export const runtime = "nodejs";

const editRequestSchema = z.object({
  proposedDataJson: z.record(z.string(), z.unknown()),
  studentNote: z.string().max(2000).optional(),
});

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/** GET: fetch current draft/pending edit request */
export async function GET() {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const request = await prisma.applicationEditRequest.findFirst({
    where: { applicationId: session.applicationId, status: { in: ["NHAP", "CHO_DUYET", "CAN_BO_SUNG"] } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ editRequest: request ?? null });
}

/** POST: create a new draft edit request */
export async function POST(request: Request) {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = editRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ", details: parsed.error.flatten() }, { status: 400 });
  }

  const application = await prisma.application.findFirst({
    where: { id: session.applicationId, deletedAt: null },
    include: { editRequests: { where: { status: "CHO_DUYET" }, take: 1 } },
  });

  if (!application) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  if (application.studentEditLocked) {
    return NextResponse.json({ error: "Hồ sơ hiện không mở chỉnh sửa vì đã được nhà trường khóa xử lý." }, { status: 403 });
  }
  if (application.admissionPublished && application.admissionResult === "TRUNG_TUYEN") {
    return NextResponse.json({ error: "Không thể gửi yêu cầu chỉnh sửa vì hồ sơ đã có kết quả tuyển sinh được công bố." }, { status: 403 });
  }
  if (application.editRequests.length > 0) {
    return NextResponse.json({ error: "Hồ sơ đang có yêu cầu chỉnh sửa chờ duyệt. Vui lòng chờ cán bộ tiếp nhận xem xét." }, { status: 409 });
  }

  const code = `CR-${application.applicationCode}-${Date.now()}`;
  const snapshotBefore = {
    fullName: application.fullName,
    dateOfBirth: application.dateOfBirth,
    gender: application.gender,
    ethnicity: application.ethnicity,
    birthPlace: application.birthPlace,
    citizenId: application.citizenId,
    secondarySchool: application.secondarySchool,
    schoolYear: application.schoolYear,
    permanentAddress: application.permanentAddress,
    houseNumber: application.houseNumber,
    hamlet: application.hamlet,
    ward: application.ward,
    province: application.province,
    studentPhone: application.studentPhone,
    email: application.email,
    guardianName: application.guardianName,
    guardianPhone: application.guardianPhone,
    selectedOptionNumber: application.selectedOptionNumber,
    selectedSubjects: application.selectedSubjects,
    additionalAwardsNote: application.additionalAwardsNote,
  };

  const editRequest = await prisma.applicationEditRequest.create({
    data: {
      applicationId: session.applicationId,
      requestCode: code,
      status: "NHAP",
      snapshotBeforeJson: jsonValue(snapshotBefore),
      proposedDataJson: jsonValue(parsed.data.proposedDataJson),
      studentNote: parsed.data.studentNote,
    },
  });

  await prisma.applicationLog.create({
    data: {
      applicationId: session.applicationId,
      action: "EDIT_REQUEST_CREATED",
      note: `Tạo yêu cầu chỉnh sửa ${code}`,
    },
  });

  return NextResponse.json({ editRequest });
}

/** PATCH: update draft edit request */
export async function PATCH(request: Request) {
  const session = await getStudentSession();
  if (!session) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = editRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const editRequest = await prisma.applicationEditRequest.findFirst({
    where: {
      applicationId: session.applicationId,
      status: { in: ["NHAP", "CAN_BO_SUNG"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!editRequest) {
    return NextResponse.json({ error: "Không tìm thấy yêu cầu chỉnh sửa có thể sửa." }, { status: 404 });
  }

  const updated = await prisma.applicationEditRequest.update({
    where: { id: editRequest.id },
    data: {
      proposedDataJson: jsonValue(parsed.data.proposedDataJson),
      studentNote: parsed.data.studentNote,
    },
  });

  return NextResponse.json({ editRequest: updated });
}
