-- Final multi-year/config additions. Forward-only and data preserving.

CREATE TABLE IF NOT EXISTS "SecondarySchool" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "oldAddress" TEXT,
  "newAddress" TEXT,
  "province" TEXT,
  "ward" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSeedData" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecondarySchool_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SecondarySchool_code_key" ON "SecondarySchool"("code");
CREATE INDEX IF NOT EXISTS "SecondarySchool_name_idx" ON "SecondarySchool"("name");
CREATE INDEX IF NOT EXISTS "SecondarySchool_isActive_idx" ON "SecondarySchool"("isActive");
CREATE INDEX IF NOT EXISTS "SecondarySchool_isSeedData_idx" ON "SecondarySchool"("isSeedData");

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "admissionRoundId" TEXT,
  ADD COLUMN IF NOT EXISTS "scoreFormulaVersionId" TEXT,
  ADD COLUMN IF NOT EXISTS "scoreBreakdownJson" JSONB,
  ADD COLUMN IF NOT EXISTS "isSeedData" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "UploadedFile"
  ADD COLUMN IF NOT EXISTS "isSeedData" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ApplicationEditRequest"
  ADD COLUMN IF NOT EXISTS "isSeedData" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Application_admissionRoundId_idx" ON "Application"("admissionRoundId");
CREATE INDEX IF NOT EXISTS "Application_scoreFormulaVersionId_idx" ON "Application"("scoreFormulaVersionId");
CREATE INDEX IF NOT EXISTS "Application_isSeedData_idx" ON "Application"("isSeedData");
CREATE INDEX IF NOT EXISTS "ApplicationEditRequest_isSeedData_idx" ON "ApplicationEditRequest"("isSeedData");

-- Create a default 2026-2027 season for legacy records if seed has not run yet.
INSERT INTO "AcademicYear" (
  "id", "code", "name", "startDate", "endDate", "status", "isActive", "createdAt", "updatedAt"
) VALUES (
  'ay_2026_2027_vvk',
  '2026-2027',
  'Năm học 2026 - 2027',
  '2026-06-01T00:00:00.000Z',
  '2027-05-31T23:59:59.000Z',
  'DANG_TUYEN_SINH',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "AdmissionSeason" (
  "id", "academicYearId", "code", "slug", "name", "gradeLevel", "quota", "method",
  "principle", "registrationOpen", "resultsPublished", "isDefault", "status",
  "applicationCodePrefix", "createdAt", "updatedAt"
)
SELECT
  'season_tsl10_2026_2027_vvk',
  "id",
  'TSL10_2026_2027_VVK',
  'tuyen-sinh-lop-10-2026-2027',
  'Tuyển sinh lớp 10 Trường THPT Võ Văn Kiệt năm học 2026 - 2027',
  10,
  950,
  'XET_TUYEN',
  'Xét tuyển theo điểm xét tuyển từ cao xuống thấp cho đến khi đủ chỉ tiêu.',
  true,
  false,
  true,
  'DANG_TUYEN_SINH',
  'VVK26',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "AcademicYear"
WHERE "code" = '2026-2027'
ON CONFLICT ("code") DO UPDATE SET
  "academicYearId" = EXCLUDED."academicYearId",
  "name" = EXCLUDED."name",
  "quota" = EXCLUDED."quota",
  "method" = EXCLUDED."method",
  "principle" = EXCLUDED."principle",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "Application"
SET "admissionSeasonId" = (
  SELECT "id" FROM "AdmissionSeason" WHERE "code" = 'TSL10_2026_2027_VVK' LIMIT 1
)
WHERE "admissionSeasonId" IS NULL;

DO $$ BEGIN
  ALTER TABLE "Application"
    ADD CONSTRAINT "Application_admissionRoundId_fkey"
    FOREIGN KEY ("admissionRoundId") REFERENCES "AdmissionRound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

DO $$ BEGIN
  ALTER TABLE "Application"
    ADD CONSTRAINT "Application_scoreFormulaVersionId_fkey"
    FOREIGN KEY ("scoreFormulaVersionId") REFERENCES "ScoreFormulaVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- Move uniqueness to season scope so a student can register in later years.
DROP INDEX IF EXISTS "Application_citizenId_key";
DROP INDEX IF EXISTS "Application_registrationFormNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Application_admissionSeasonId_citizenId_key"
  ON "Application"("admissionSeasonId", "citizenId");
CREATE UNIQUE INDEX IF NOT EXISTS "Application_admissionSeasonId_registrationFormNumber_key"
  ON "Application"("admissionSeasonId", "registrationFormNumber");
