-- Migration: multi_year_edit_requests
-- Safe: uses IF NOT EXISTS / IF EXISTS throughout. No DROP of existing columns.
-- Adds: AcademicYear, AdmissionSeason, AdmissionRound, SubjectOption,
--        AdmissionLegalDocument, DossierRequirement, ContentBlock, ConfigOption,
--        SiteSetting, ScoreFormulaVersion, ApplicationEditRequest,
--        new columns on Application, new LogAction values, EditRequestStatus enum.

-- ── Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "EditRequestStatus" AS ENUM (
    'NHAP', 'CHO_DUYET', 'CAN_BO_SUNG', 'DA_DUYET', 'TU_CHOI', 'DA_HUY'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- Add new LogAction values (PostgreSQL enums must add values individually)
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_CREATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_UPDATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_SUBMITTED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_CANCELLED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_APPROVED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_REJECTED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'EDIT_REQUEST_SUPPLEMENT_REQUESTED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'APPLICATION_UPDATED_FROM_EDIT_REQUEST'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'CONFIG_UPDATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'SEASON_CREATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'SEASON_UPDATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'SEASON_ACTIVATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'SCORE_FORMULA_UPDATED'; EXCEPTION WHEN others THEN NULL; END; $$;
DO $$ BEGIN ALTER TYPE "LogAction" ADD VALUE IF NOT EXISTS 'SCORE_RECALCULATED'; EXCEPTION WHEN others THEN NULL; END; $$;

-- ── AcademicYear ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AcademicYear" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "code"         TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "startDate"    TIMESTAMP(3),
  "endDate"      TIMESTAMP(3),
  "status"       TEXT NOT NULL DEFAULT 'NHAP',
  "isActive"     BOOLEAN NOT NULL DEFAULT false,
  "publicNote"   TEXT,
  "internalNote" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AcademicYear_code_key" ON "AcademicYear"("code");

-- ── AdmissionSeason ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AdmissionSeason" (
  "id"                       TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "academicYearId"            TEXT NOT NULL,
  "code"                     TEXT NOT NULL,
  "slug"                     TEXT NOT NULL,
  "name"                     TEXT NOT NULL,
  "gradeLevel"               INTEGER NOT NULL DEFAULT 10,
  "quota"                    INTEGER,
  "method"                   TEXT NOT NULL DEFAULT 'XET_TUYEN',
  "principle"                TEXT,
  "description"              TEXT,
  "announcementHtml"         TEXT,
  "registrationOpen"         BOOLEAN NOT NULL DEFAULT false,
  "resultsPublished"         BOOLEAN NOT NULL DEFAULT false,
  "isDefault"                BOOLEAN NOT NULL DEFAULT false,
  "status"                   TEXT NOT NULL DEFAULT 'NHAP',
  "publicNote"               TEXT,
  "internalNote"             TEXT,
  "applicationCodePrefix"    TEXT DEFAULT 'VK',
  "createdAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdmissionSeason_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdmissionSeason_code_key" ON "AdmissionSeason"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "AdmissionSeason_slug_key" ON "AdmissionSeason"("slug");
CREATE INDEX IF NOT EXISTS "AdmissionSeason_academicYearId_idx" ON "AdmissionSeason"("academicYearId");
CREATE INDEX IF NOT EXISTS "AdmissionSeason_isDefault_idx" ON "AdmissionSeason"("isDefault");

DO $$ BEGIN
  ALTER TABLE "AdmissionSeason"
    ADD CONSTRAINT "AdmissionSeason_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── AdmissionRound ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AdmissionRound" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"        TEXT NOT NULL,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "receiveStartAt"  TIMESTAMP(3),
  "receiveEndAt"    TIMESTAMP(3),
  "resultPublishAt" TIMESTAMP(3),
  "quota"           INTEGER,
  "conditionNote"   TEXT,
  "status"          TEXT NOT NULL DEFAULT 'CHUA_MO',
  "sortOrder"       INTEGER NOT NULL DEFAULT 0,
  "publicNote"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdmissionRound_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdmissionRound_seasonId_idx" ON "AdmissionRound"("seasonId");
DO $$ BEGIN
  ALTER TABLE "AdmissionRound"
    ADD CONSTRAINT "AdmissionRound_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── SubjectOption ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SubjectOption" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"     TEXT NOT NULL,
  "optionNumber" INTEGER NOT NULL,
  "name"         TEXT,
  "subjects"     TEXT NOT NULL,
  "description"  TEXT,
  "capacity"     INTEGER,
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubjectOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SubjectOption_seasonId_optionNumber_key" ON "SubjectOption"("seasonId", "optionNumber");
CREATE INDEX IF NOT EXISTS "SubjectOption_seasonId_idx" ON "SubjectOption"("seasonId");
DO $$ BEGIN
  ALTER TABLE "SubjectOption"
    ADD CONSTRAINT "SubjectOption_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── AdmissionLegalDocument ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "AdmissionLegalDocument" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"       TEXT,
  "documentType"   TEXT NOT NULL,
  "documentNumber" TEXT NOT NULL,
  "issuedDate"     TIMESTAMP(3),
  "issuingAgency"  TEXT,
  "summary"        TEXT NOT NULL,
  "url"            TEXT,
  "fileStorageKey" TEXT,
  "isPublic"       BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdmissionLegalDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdmissionLegalDocument_seasonId_idx" ON "AdmissionLegalDocument"("seasonId");
DO $$ BEGIN
  ALTER TABLE "AdmissionLegalDocument"
    ADD CONSTRAINT "AdmissionLegalDocument_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── DossierRequirement ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "DossierRequirement" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"      TEXT NOT NULL,
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "quantity"      TEXT,
  "specification" TEXT,
  "isRequired"    BOOLEAN NOT NULL DEFAULT true,
  "conditionNote" TEXT,
  "showOnPublic"  BOOLEAN NOT NULL DEFAULT true,
  "showOnPdf"     BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DossierRequirement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "DossierRequirement_seasonId_idx" ON "DossierRequirement"("seasonId");
DO $$ BEGIN
  ALTER TABLE "DossierRequirement"
    ADD CONSTRAINT "DossierRequirement_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── ContentBlock ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ContentBlock" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"     TEXT,
  "pageKey"      TEXT NOT NULL,
  "blockKey"     TEXT NOT NULL,
  "title"        TEXT,
  "subtitle"     TEXT,
  "body"         TEXT,
  "metadata"     JSONB,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isEnabled"    BOOLEAN NOT NULL DEFAULT true,
  "updatedById"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentBlock_seasonId_pageKey_blockKey_key"
  ON "ContentBlock"("seasonId", "pageKey", "blockKey");
CREATE INDEX IF NOT EXISTS "ContentBlock_pageKey_idx" ON "ContentBlock"("pageKey");
CREATE INDEX IF NOT EXISTS "ContentBlock_seasonId_idx" ON "ContentBlock"("seasonId");
DO $$ BEGIN
  ALTER TABLE "ContentBlock"
    ADD CONSTRAINT "ContentBlock_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── ConfigOption ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ConfigOption" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"     TEXT,
  "groupKey"     TEXT NOT NULL,
  "value"        TEXT NOT NULL,
  "label"        TEXT NOT NULL,
  "shortLabel"   TEXT,
  "description"  TEXT,
  "helpText"     TEXT,
  "metadata"     JSONB,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "isEnabled"    BOOLEAN NOT NULL DEFAULT true,
  "isDefault"    BOOLEAN NOT NULL DEFAULT false,
  "isSystem"     BOOLEAN NOT NULL DEFAULT false,
  "updatedById"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConfigOption_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConfigOption_seasonId_groupKey_value_key"
  ON "ConfigOption"("seasonId", "groupKey", "value");
CREATE INDEX IF NOT EXISTS "ConfigOption_groupKey_idx" ON "ConfigOption"("groupKey");
CREATE INDEX IF NOT EXISTS "ConfigOption_seasonId_idx" ON "ConfigOption"("seasonId");
DO $$ BEGIN
  ALTER TABLE "ConfigOption"
    ADD CONSTRAINT "ConfigOption_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── SiteSetting ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "SiteSetting" (
  "id"              TEXT NOT NULL DEFAULT 'default',
  "schoolName"      TEXT NOT NULL DEFAULT 'Trường THPT Võ Văn Kiệt',
  "schoolShortName" TEXT,
  "schoolAddress"   TEXT,
  "schoolPhone"     TEXT,
  "schoolEmail"     TEXT,
  "schoolWebsite"   TEXT,
  "principalName"   TEXT,
  "principalTitle"  TEXT,
  "logoUrl"         TEXT,
  "primaryColor"    TEXT,
  "secondaryColor"  TEXT,
  "footerJson"      JSONB,
  "navItemsJson"    JSONB,
  "publicThemeJson" JSONB,
  "updatedById"     TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- ── ScoreFormulaVersion ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ScoreFormulaVersion" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId"      TEXT,
  "name"          TEXT NOT NULL,
  "description"   TEXT,
  "version"       INTEGER NOT NULL DEFAULT 1,
  "status"        TEXT NOT NULL DEFAULT 'DRAFT',
  "configJson"    JSONB NOT NULL DEFAULT '{}',
  "isDefault"     BOOLEAN NOT NULL DEFAULT false,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo"   TIMESTAMP(3),
  "createdById"   TEXT,
  "updatedById"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScoreFormulaVersion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ScoreFormulaVersion_seasonId_idx" ON "ScoreFormulaVersion"("seasonId");
CREATE INDEX IF NOT EXISTS "ScoreFormulaVersion_status_idx" ON "ScoreFormulaVersion"("status");
DO $$ BEGIN
  ALTER TABLE "ScoreFormulaVersion"
    ADD CONSTRAINT "ScoreFormulaVersion_seasonId_fkey"
    FOREIGN KEY ("seasonId") REFERENCES "AdmissionSeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── Application: new columns ───────────────────────────────────────────────

ALTER TABLE "Application"
  ADD COLUMN IF NOT EXISTS "admissionSeasonId"  TEXT,
  ADD COLUMN IF NOT EXISTS "studentEditLocked"  BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "lastEditRequestAt"  TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastEditApprovedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Application_admissionSeasonId_idx" ON "Application"("admissionSeasonId");

DO $$ BEGIN
  ALTER TABLE "Application"
    ADD CONSTRAINT "Application_admissionSeasonId_fkey"
    FOREIGN KEY ("admissionSeasonId") REFERENCES "AdmissionSeason"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;

-- ── ApplicationEditRequest ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "ApplicationEditRequest" (
  "id"                 TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "applicationId"      TEXT NOT NULL,
  "requestCode"        TEXT NOT NULL,
  "status"             "EditRequestStatus" NOT NULL DEFAULT 'NHAP',
  "snapshotBeforeJson" JSONB,
  "proposedDataJson"   JSONB,
  "proposedFilesJson"  JSONB,
  "changedFieldsJson"  JSONB,
  "studentNote"        TEXT,
  "officerNote"        TEXT,
  "rejectionReason"    TEXT,
  "submittedAt"        TIMESTAMP(3),
  "reviewedAt"         TIMESTAMP(3),
  "reviewedById"       TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationEditRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ApplicationEditRequest_requestCode_key"
  ON "ApplicationEditRequest"("requestCode");
CREATE INDEX IF NOT EXISTS "ApplicationEditRequest_applicationId_idx" ON "ApplicationEditRequest"("applicationId");
CREATE INDEX IF NOT EXISTS "ApplicationEditRequest_status_idx" ON "ApplicationEditRequest"("status");
CREATE INDEX IF NOT EXISTS "ApplicationEditRequest_submittedAt_idx" ON "ApplicationEditRequest"("submittedAt");

DO $$ BEGIN
  ALTER TABLE "ApplicationEditRequest"
    ADD CONSTRAINT "ApplicationEditRequest_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
DO $$ BEGIN
  ALTER TABLE "ApplicationEditRequest"
    ADD CONSTRAINT "ApplicationEditRequest_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END; $$;
