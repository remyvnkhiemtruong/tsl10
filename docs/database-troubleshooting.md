# Database troubleshooting

## Safe commands

Use these commands for normal local/Vercel deployment without deleting data:

```powershell
npm install
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma migrate deploy
npm run dev
```

If Next.js is serving stale generated code, clear the local build cache:

```powershell
rmdir /s /q .next
npx prisma generate
npm run dev
```

## Schema drift

Do not run `prisma migrate reset` on a real admission database. It drops data.

For a real database:

```powershell
npx prisma migrate deploy
```

For a disposable local database only:

```powershell
npx prisma migrate reset
npm run prisma:seed
```

To create demo applications in local/staging, opt in explicitly:

```powershell
$env:SEED_DEMO_DATA="true"
npm run prisma:seed
```

The seed script is idempotent and does not insert default dropdown options. Dropdowns use code/schema defaults until an admin creates an override.

## Duplicate init migration note

The migration `20260528145500_init` is intentionally a no-op because the same base schema already exists in `20260527160000_init`. This avoids a fresh deploy trying to create all base tables twice.

If a database already applied the old duplicate migration before this change, Prisma may report a checksum mismatch. In that case, do not reset production data. Inspect the database, then resolve the migration history only after confirming the actual schema already matches the intended state.

## Local connection error

If Prisma reports `P1001` or `ECONNREFUSED` for `localhost:5432`, start PostgreSQL or update `DATABASE_URL` in `.env`, then run:

```powershell
npx prisma migrate deploy
npm run prisma:seed
```
