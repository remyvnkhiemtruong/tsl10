# Cổng đăng ký dự tuyển vào lớp 10 THPT Võ Văn Kiệt

Hệ thống web đăng ký dự tuyển lớp 10 trực tuyến cho **Trường THPT Võ Văn Kiệt**, năm học **2026 - 2027**. App dùng Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, JWT cookie auth, Vercel Blob private upload, ExcelJS và Puppeteer Core + Sparticuz Chromium.

## Chức năng chính

- Form đăng ký nhiều bước, validate bằng Zod.
- Upload ảnh 4x6, học bạ, giấy khai sinh/CCCD, minh chứng ưu tiên/khuyến khích.
- Chống nộp trùng theo số định danh/CCCD.
- Tra cứu hồ sơ bằng mã hồ sơ, số định danh và ngày sinh.
- Admin đăng nhập, xem danh sách/chi tiết hồ sơ, duyệt file, cập nhật trạng thái và ghi log xử lý.
- Xuất Excel danh sách hồ sơ và PDF phiếu đăng ký.
- `/api/health` để kiểm tra deploy.

## Chạy local

```bash
npm install
cp .env.example .env
npm run prisma:generate
```

Chạy PostgreSQL bằng Docker:

```bash
docker compose up -d
```

Tạo schema và seed dữ liệu local:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

Chạy dev server:

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Tài khoản admin local

Seed local mặc định:

```text
Email: admin@vovankiet.edu.vn
Password: Admin@123456
```

Có thể đổi bằng:

```bash
SEED_ADMIN_EMAIL="admin@example.com" SEED_ADMIN_PASSWORD="MatKhauManh" npm run prisma:seed
```

Không seed tài khoản mặc định trong production. Nếu cần tạo admin production lần đầu, chạy seed thủ công với email/mật khẩu mạnh.

## Biến môi trường

Local xem `.env.example`. Vercel xem `.env.vercel.example`.

Biến Vercel tối thiểu:

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

## Deploy Vercel

1. Import repo vào Vercel.
2. Tạo PostgreSQL production và đặt `DATABASE_URL`.
3. Tạo Vercel Blob Store, đặt `BLOB_READ_WRITE_TOKEN`, `STORAGE_PROVIDER=vercel_blob`, `BLOB_ACCESS=private`.
4. Đặt `JWT_SECRET` mạnh và `NEXT_PUBLIC_APP_URL`.
5. Build command giữ nguyên trong `vercel.json`: `npm run vercel-build`.
6. Chạy migration production thủ công:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require" npx prisma migrate deploy
```

Script Vercel build luôn chạy `npx prisma generate` trước `next build`. Chỉ bật `RUN_PRISMA_MIGRATE_DEPLOY=true` nếu chủ động muốn migration chạy trong build.

## Kiểm tra trước khi bàn giao

```bash
npm run lint
npm run build
npx prisma generate
```

Sau deploy, kiểm tra:

- `/api/health`
- `/dang-ky`
- `/tra-cuu`
- `/admin/login`
- Xuất Excel tại `/api/admin/export/excel`
