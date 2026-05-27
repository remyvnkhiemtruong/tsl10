import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { get, put } from "@vercel/blob";
import { ALLOWED_MIME_TYPES, FILE_SIZE_LIMITS_MB } from "@/lib/constants";

export const DEFAULT_UPLOAD_DIR = process.env.UPLOAD_DIR ?? ".data/uploads";

export type SavedUpload = {
  fileType: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  storageProvider: "LOCAL" | "VERCEL_BLOB";
  publicUrl?: string;
};

export type StoredFileRef = {
  storageProvider?: string | null;
  storageKey: string;
  publicUrl?: string | null;
};

export function assertAllowedFile(file: File, fileType: string) {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new Error("Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG hoặc PDF.");
  }

  if (fileType === "PHOTO_4X6" && !file.type.startsWith("image/")) {
    throw new Error("Ảnh 4x6 phải là file JPG, JPEG hoặc PNG.");
  }

  if (fileType === "HOC_BA_THCS" && file.type !== "application/pdf") {
    throw new Error("Học bạ THCS dạng tổng hợp phải là file PDF.");
  }

  if (fileType.startsWith("HOC_BA_LOP_") && !file.type.startsWith("image/")) {
    throw new Error("Ảnh học bạ từng lớp phải là file JPG, JPEG hoặc PNG.");
  }

  const maxMb = FILE_SIZE_LIMITS_MB[fileType] ?? Number(process.env.MAX_UPLOAD_MB ?? 25);
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`File vượt quá dung lượng tối đa ${maxMb}MB.`);
  }
}

function safeExtension(file: File) {
  const ext = path.extname(file.name).toLowerCase();
  if ([".jpg", ".jpeg", ".png", ".pdf"].includes(ext)) return ext;
  if (file.type === "application/pdf") return ".pdf";
  if (file.type === "image/png") return ".png";
  return ".jpg";
}

function normalizedProvider() {
  const configured = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (configured === "vercel_blob") return "vercel_blob";
  if (configured === "local") return "local";
  return process.env.BLOB_READ_WRITE_TOKEN ? "vercel_blob" : "local";
}

export async function saveUploadedFile(file: File, fileType: string): Promise<SavedUpload> {
  assertAllowedFile(file, fileType);
  const provider = normalizedProvider();

  if (provider === "vercel_blob") return saveVercelBlobFile(file, fileType);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Production phải dùng Vercel Blob hoặc storage tương thích, không dùng local filesystem.");
  }
  return saveLocalFile(file, fileType);
}

export async function saveLocalFile(file: File, fileType: string): Promise<SavedUpload> {
  assertAllowedFile(file, fileType);
  const ext = safeExtension(file);
  const storedName = `${fileType}-${Date.now()}-${randomUUID()}${ext}`;
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), DEFAULT_UPLOAD_DIR);
  const dir = path.resolve(/*turbopackIgnore: true*/ root, fileType);
  await mkdir(dir, { recursive: true });

  const storageKey = `${fileType}/${storedName}`;
  const target = path.resolve(/*turbopackIgnore: true*/ root, storageKey);
  if (!target.startsWith(root)) {
    throw new Error("Đường dẫn lưu file không hợp lệ.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(target, buffer);
  return {
    fileType,
    originalName: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
    storageKey,
    storageProvider: "LOCAL"
  };
}

export async function saveVercelBlobFile(file: File, fileType: string): Promise<SavedUpload> {
  assertAllowedFile(file, fileType);
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Thiếu BLOB_READ_WRITE_TOKEN. Vui lòng tạo Vercel Blob Store private và cấu hình biến môi trường.");
  }
  if ((process.env.BLOB_ACCESS ?? "private") !== "private") {
    throw new Error("Hồ sơ tuyển sinh phải dùng Vercel Blob private. Vui lòng đặt BLOB_ACCESS=private.");
  }

  const ext = safeExtension(file);
  const dateFolder = new Date().toISOString().slice(0, 10);
  const pathname = `admission-uploads/${fileType.toLowerCase()}/${dateFolder}/${Date.now()}-${randomUUID()}${ext}`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: file.type,
    multipart: file.size > 10 * 1024 * 1024
  });

  return {
    fileType,
    originalName: file.name,
    storedName: blob.pathname,
    mimeType: file.type,
    size: file.size,
    storageKey: blob.pathname,
    storageProvider: "VERCEL_BLOB"
  };
}

export async function readStoredFile(file: StoredFileRef) {
  const provider = file.storageProvider?.toUpperCase();
  if (provider === "VERCEL_BLOB") {
    const result = await get(file.storageKey || file.publicUrl || "", { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) {
      throw new Error("Không thể đọc file từ Vercel Blob");
    }
    return streamToBuffer(result.stream);
  }

  if (file.storageKey.startsWith("http") || file.publicUrl) {
    const response = await fetch(file.publicUrl || file.storageKey, {
      headers: process.env.BLOB_READ_WRITE_TOKEN
        ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
        : undefined,
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Không thể đọc file từ storage");
    return Buffer.from(await response.arrayBuffer());
  }

  return readLocalFile(file.storageKey);
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export async function readLocalFile(storageKey: string) {
  const root = path.resolve(/*turbopackIgnore: true*/ process.cwd(), DEFAULT_UPLOAD_DIR);
  const target = path.resolve(/*turbopackIgnore: true*/ root, storageKey);
  if (!target.startsWith(root)) {
    throw new Error("Đường dẫn file không hợp lệ.");
  }
  return readFile(target);
}
