# AGENTS.md

## Project

Cổng đăng ký dự tuyển vào lớp 10 THPT Võ Văn Kiệt, năm học 2026 - 2027.

## Deployment target

This project must run on Vercel.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui style components
- Prisma
- PostgreSQL
- JWT cookie auth
- Vercel Blob for production uploads
- Local storage only for development
- ExcelJS export
- Puppeteer Core + Sparticuz Chromium for PDF on Vercel

## Commands

Use npm unless the project already uses another package manager.

Required checks before finishing:

- npm run lint
- npm run build
- npx prisma generate

Vercel build command:

- npm run vercel-build

## Engineering rules

- Use TypeScript strictly.
- Validate all user input with Zod.
- Never expose uploaded private files directly in the UI.
- On Vercel production, use Vercel Blob or an S3-compatible provider, never local filesystem for persistent uploads.
- Do not hardcode secrets.
- Put all required environment variables in `.env.example` and `.env.vercel.example`.
- Keep components small and reusable.
- Keep business logic out of UI components where practical.
- Use clear Vietnamese labels in the UI.
- Use professional, school-appropriate interface design.
- Make the project deployable on Vercel without custom servers.

## Done means

A task is complete only when:

- The app runs locally.
- The app can be deployed to Vercel.
- The database schema is created.
- Admin can log in.
- Student can submit an application.
- Files can be uploaded in local development and via Vercel Blob in production.
- Admin can view and update application status.
- Excel/PDF export works or has a clearly documented fallback.
- Lint and build pass.
