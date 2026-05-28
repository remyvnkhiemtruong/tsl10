# Bootstrap database trên Vercel

## Nguyên tắc

Dự án dùng Prisma và PostgreSQL nên không upload database vào source code. Repo chỉ chứa schema, migrations và seed script. Database thật nằm ở Vercel Postgres, Neon, Supabase hoặc PostgreSQL tương thích.

## Build command

Vercel dùng:

```text
npm run vercel-build
```

Script build chạy:

```text
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npx next build
```

Migration chỉ chạy khi `RUN_PRISMA_MIGRATE_DEPLOY=true`. Seed chỉ chạy khi `RUN_PRISMA_SEED=true`. Nếu bật một trong hai bước này mà thiếu `DATABASE_URL`, build sẽ fail với thông báo rõ ràng.

## Biến môi trường tối thiểu

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
STORAGE_PROVIDER=vercel_blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BLOB_ACCESS=private
RUN_PRISMA_MIGRATE_DEPLOY=true
RUN_PRISMA_SEED=true
SEED_SAMPLE_DATA=false
SEED_ADMIN_EMAIL=admin@gmail.com
SEED_ADMIN_PASSWORD=Admin123@
```

## Seed admin

`prisma/seed.ts` upsert admin mặc định:

```text
admin@gmail.com
Admin123@
```

Có thể đổi bằng `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD`. Seed không xóa dữ liệu cũ và chỉ tạo hồ sơ mẫu khi `SEED_SAMPLE_DATA=true`.

## Kiểm tra sau deploy

Mở:

```text
/api/health
```

Kết quả thành công có `database: "ok"`, `adminUserExists: true`, `storageProvider` và `timestamp`. Nếu database chưa sẵn sàng, API trả 500 với hướng dẫn kiểm tra migration/seed hoặc `DATABASE_URL`.
