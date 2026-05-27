# Hướng dẫn deploy Vercel

## Checklist

1. Đẩy repo lên GitHub.
2. Import project vào Vercel.
3. Tạo PostgreSQL production và đặt `DATABASE_URL`.
4. Tạo Vercel Blob Store private.
5. Đặt `STORAGE_PROVIDER=vercel_blob`, `BLOB_ACCESS=private`, `BLOB_READ_WRITE_TOKEN`.
6. Đặt `JWT_SECRET` mạnh và `NEXT_PUBLIC_APP_URL`.
7. Deploy.
8. Chạy `npx prisma migrate deploy` cho production database.
9. Tạo admin production bằng seed thủ công nếu cần.
10. Kiểm tra `/api/health`, `/dang-ky`, `/tra-cuu`, `/admin/login`.

## Environment Variables trên Vercel

```text
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
JWT_SECRET=replace-with-a-long-random-production-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
STORAGE_PROVIDER=vercel_blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxx
BLOB_ACCESS=private
MAX_UPLOAD_MB=25
RUN_PRISMA_MIGRATE_DEPLOY=false
NODE_ENV=production
```

## Migration production

Khuyến nghị chạy migration thủ công từ máy local/CI có quyền truy cập database:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" npx prisma migrate deploy
```

Chỉ dùng `RUN_PRISMA_MIGRATE_DEPLOY=true` khi chấp nhận migration chạy trong build Vercel.

## Upload file production

Production phải dùng Vercel Blob private. Local filesystem trên Vercel không phù hợp để lưu hồ sơ lâu dài và app sẽ chặn local storage khi `NODE_ENV=production`.

## PDF trên Vercel

PDF dùng `puppeteer-core` và `@sparticuz/chromium`. Nếu Chromium không render được, API trả về HTML in được để admin vẫn có fallback.
