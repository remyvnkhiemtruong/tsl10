import { NextResponse } from "next/server";
import { ALL_FILE_TYPES } from "@/lib/constants";
import { saveUploadedFile } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const fileType = String(formData.get("fileType") ?? "");

    if (!ALL_FILE_TYPES.includes(fileType)) {
      return NextResponse.json({ error: "Loại tài liệu tải lên không hợp lệ" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Không có file được tải lên" }, { status: 400 });
    }

    const saved = await saveUploadedFile(file, fileType);
    return NextResponse.json({ file: saved });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload thất bại" }, { status: 400 });
  }
}
