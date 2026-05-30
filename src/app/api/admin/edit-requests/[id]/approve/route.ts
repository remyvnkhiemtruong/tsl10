import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const approveSchema = z.object({ officerNote: z.string().max(2000).optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body: unknown = await request.json();
  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const editRequest = await prisma.applicationEditRequest.findUnique({
    where: { id },
    include: { application: true },
  });

  if (!editRequest) return NextResponse.json({ error: "Không tìm thấy yêu cầu" }, { status: 404 });
  if (editRequest.status !== "CHO_DUYET") {
    return NextResponse.json({
      error: "Không thể duyệt vì yêu cầu chỉnh sửa không còn ở trạng thái chờ duyệt.",
    }, { status: 409 });
  }

  const proposed = editRequest.proposedDataJson as Record<string, unknown> | null;
  if (!proposed) {
    return NextResponse.json({ error: "Không có dữ liệu đề nghị chỉnh sửa." }, { status: 400 });
  }

  // Allowed fields to merge from proposed data
  const ALLOWED_FIELDS = [
    "fullName", "dateOfBirth", "gender", "ethnicity", "birthPlace",
    "citizenId", "issueDate", "issuePlace",
    "secondarySchool", "secondarySchoolAddress", "secondarySchoolOldAddress", "schoolYear",
    "permanentAddress", "houseNumber", "hamlet", "ward", "province",
    "studentPhone", "email",
    "guardianName", "guardianPhone",
    "selectedOptionNumber", "selectedSubjects",
    "additionalAwardsNote",
  ] as const;

  const updateData: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in proposed && proposed[field] !== undefined) {
      updateData[field] = proposed[field];
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update the application with approved changes
      await tx.application.update({
        where: { id: editRequest.applicationId },
        data: {
          ...updateData,
          lastEditApprovedAt: new Date(),
        },
      });

      // Mark edit request as approved
      await tx.applicationEditRequest.update({
        where: { id },
        data: {
          status: "DA_DUYET",
          reviewedAt: new Date(),
          reviewedById: user.id,
          officerNote: parsed.data.officerNote,
        },
      });

      // Audit log
      await tx.applicationLog.create({
        data: {
          applicationId: editRequest.applicationId,
          userId: user.id,
          action: "EDIT_REQUEST_APPROVED",
          note: `Duyệt yêu cầu chỉnh sửa ${editRequest.requestCode}`,
          metadata: { editRequestId: id, changedFields: Object.keys(updateData) },
        },
      });

      await tx.applicationLog.create({
        data: {
          applicationId: editRequest.applicationId,
          userId: user.id,
          action: "APPLICATION_UPDATED_FROM_EDIT_REQUEST",
          note: `Cập nhật hồ sơ từ yêu cầu chỉnh sửa ${editRequest.requestCode}`,
          metadata: { changedFields: Object.keys(updateData) },
        },
      });
    });

    return NextResponse.json({ ok: true, message: "Đã duyệt yêu cầu chỉnh sửa. Hồ sơ chính đã được cập nhật." });
  } catch (error) {
    console.error("[edit-request/approve]", error);
    return NextResponse.json({ error: "Lỗi khi cập nhật hồ sơ. Vui lòng thử lại." }, { status: 500 });
  }
}
