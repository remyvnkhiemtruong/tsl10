# Hướng dẫn deploy Vercel

## Checklist

1. Đẩy repo lên GitHub.
2. Import project vào Vercel.
3. Tạo PostgreSQL production và đặt `DATABASE_URL`.
4. Tạo Vercel Blob Store private.
5. Đặt `STORAGE_PROVIDER=vercel_blob`, `BLOB_ACCESS=private`, `BLOB_READ_WRITE_TOKEN`.
6. Đặt `JWT_SECRET` mạnh và `NEXT_PUBLIC_APP_URL`.
7. Đặt `RUN_PRISMA_MIGRATE_DEPLOY=true`, `RUN_PRISMA_SEED=true`, `SEED_SAMPLE_DATA=false`.
8. Build command: `npm run vercel-build`.
9. Deploy.
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
RUN_PRISMA_MIGRATE_DEPLOY=true
RUN_PRISMA_SEED=true
SEED_SAMPLE_DATA=false
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=Admin123@
NODE_ENV=production
```

## Migration và seed production

Vercel không lưu database trong repo. Schema được tạo bằng Prisma migration trên PostgreSQL production. Khi bật env ở trên, `npm run vercel-build` sẽ chạy:

```text
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npx next build
```

Nếu bật migration hoặc seed mà thiếu `DATABASE_URL`, build sẽ fail với lỗi rõ ràng.

Admin mặc định sau deploy:

```text
admin@gmail.com
Admin123@
```

## Upload file production

Production phải dùng Vercel Blob private. Local filesystem trên Vercel không phù hợp để lưu hồ sơ lâu dài và app sẽ chặn local storage khi `NODE_ENV=production`.

## PDF trên Vercel

PDF dùng `puppeteer-core` và `@sparticuz/chromium`. Nếu Chromium không render được, API trả về HTML in được để admin vẫn có fallback.
