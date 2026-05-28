# Cổng đăng ký dự tuyển lớp 10 THPT Võ Văn Kiệt

Hệ thống đăng ký dự tuyển vào lớp 10 cho **Trường THPT Võ Văn Kiệt**, năm học **2026 - 2027**. Ứng dụng dùng Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, JWT cookie auth, Vercel Blob private upload, ExcelJS và Puppeteer Core + Sparticuz Chromium.

## Chức năng chính

- Form đăng ký nhiều bước, validate bằng Zod ở server.
- Dropdown hành chính 34 tỉnh/thành và xã/phường theo sắp xếp năm 2025.
- Upload ảnh 4x6, học bạ, giấy khai sinh/CCCD, minh chứng ưu tiên/khuyến khích.
- Tính điểm xét tuyển dự kiến A + B + C phục vụ hội đồng tuyển sinh, không tự kết luận trúng tuyển.
- Tra cứu hồ sơ bằng mã hồ sơ, số định danh và ngày sinh.
- Admin đăng nhập, xem danh sách/chi tiết hồ sơ, duyệt file, cập nhật trạng thái, chỉnh sửa/xóa mềm hồ sơ và xuất Excel/PDF.

## Chạy local

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Nếu cần PostgreSQL local bằng Docker:

```bash
docker compose up -d
```

Mở `http://localhost:3000`.

## Tài khoản admin

Seed mặc định tạo tài khoản:

```text
Email: admin@gmail.com
Password: Admin123@
```

Có thể đổi bằng biến môi trường khi seed:

```bash
SEED_ADMIN_EMAIL="admin@example.com" SEED_ADMIN_PASSWORD="MatKhauManh" npm run prisma:seed
```

Nếu dùng tài khoản mặc định ở production, hãy đổi mật khẩu sau lần đăng nhập đầu tiên khi hệ thống có màn đổi mật khẩu.

## Upload file

- Development dùng local storage trong `.data/uploads`.
- Vercel production phải dùng Vercel Blob private hoặc storage tương thích, không dùng local filesystem để lưu hồ sơ lâu dài.
- File hồ sơ riêng tư không được public trực tiếp; admin xem file qua route kiểm tra quyền.
- Chỉ nhận JPG/JPEG/PNG/PDF theo giới hạn dung lượng trong `src/lib/constants.ts`.

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
RUN_PRISMA_MIGRATE_DEPLOY=true
RUN_PRISMA_SEED=true
SEED_SAMPLE_DATA=false
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=Admin123@
NODE_ENV=production
```

## Deploy Vercel dùng ngay

1. Import repo vào Vercel.
2. Tạo PostgreSQL hoặc liên kết Vercel Postgres/Neon/Supabase.
3. Tạo Vercel Blob Store.
4. Set env:

```text
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORAGE_PROVIDER=vercel_blob
BLOB_ACCESS=private
RUN_PRISMA_MIGRATE_DEPLOY=true
RUN_PRISMA_SEED=true
SEED_SAMPLE_DATA=false
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=Admin123@
```

5. Build command trong `vercel.json`: `npm run vercel-build`.
6. Khi build, script chạy `npx prisma generate`, `npx prisma migrate deploy`, `npm run prisma:seed`, rồi `npx next build`.
7. Sau deploy kiểm tra:
   - `/api/health`
   - `/admin/login`
   - `/dang-ky`
   - `/tra-cuu`
8. Admin login: `admin@gmail.com` / `Admin123@`.

## Kiểm tra trước deploy

```bash
npm run lint
npm run build
npx prisma generate
```

Sau deploy, kiểm tra:

- `/api/health`
- `/admin/login`
- `/dang-ky`
- `/tra-cuu`
- Xuất Excel tại `/api/admin/export/excel`

## Tài liệu nghiệp vụ

- `docs/quy-che-tuyen-sinh-2026-2027.md`
- `docs/danh-muc-hanh-chinh-34-tinh-thanh-2025.md`
- `docs/vercel-database-bootstrap.md`
