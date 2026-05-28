-- AlterEnum
ALTER TYPE "PriorityType" ADD VALUE 'CON_LIET_SI';
ALTER TYPE "PriorityType" ADD VALUE 'CON_THUONG_BINH_BENH_BINH';
ALTER TYPE "PriorityType" ADD VALUE 'CON_ANH_HUNG_LLD_BA_ME_VNAH';

-- AlterEnum
ALTER TYPE "LogAction" ADD VALUE 'ADMISSION_RESULT_UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'ADMISSION_PUBLISHED';
ALTER TYPE "LogAction" ADD VALUE 'ADMISSION_UNPUBLISHED';
ALTER TYPE "LogAction" ADD VALUE 'ADMISSION_BULK_PUBLISHED';
ALTER TYPE "LogAction" ADD VALUE 'PUBLIC_RANKING_EXPORTED';
ALTER TYPE "LogAction" ADD VALUE 'CONTACT_UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'REGISTRATION_FORM_PDF_EXPORTED';
ALTER TYPE "LogAction" ADD VALUE 'PHYSICAL_DOSSIER_RECEIVED';
ALTER TYPE "LogAction" ADD VALUE 'PHYSICAL_DOSSIER_STATUS_UPDATED';

-- AlterTable
ALTER TABLE "Application"
ADD COLUMN "secondarySchoolAddress" TEXT,
ADD COLUMN "secondarySchoolOldAddress" TEXT,
ADD COLUMN "additionalAwardsNote" TEXT,
ADD COLUMN "admissionResult" TEXT NOT NULL DEFAULT 'CHUA_XET',
ADD COLUMN "admissionPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "admissionPublishedAt" TIMESTAMP(3),
ADD COLUMN "admissionPublishedById" TEXT,
ADD COLUMN "admissionDecisionAt" TIMESTAMP(3),
ADD COLUMN "admissionDecisionById" TEXT,
ADD COLUMN "admissionNote" TEXT,
ADD COLUMN "admissionPublicNote" TEXT,
ADD COLUMN "admissionRank" INTEGER,
ADD COLUMN "admissionBatch" TEXT,
ADD COLUMN "admissionScoreSnapshot" DOUBLE PRECISION,
ADD COLUMN "physicalDossierStatus" TEXT NOT NULL DEFAULT 'CHUA_NOP_TRUC_TIEP',
ADD COLUMN "physicalDossierValidity" TEXT NOT NULL DEFAULT 'CHUA_KIEM_TRA',
ADD COLUMN "physicalDossierReceivedAt" TIMESTAMP(3),
ADD COLUMN "physicalDossierReceivedById" TEXT,
ADD COLUMN "physicalDossierCheckedAt" TIMESTAMP(3),
ADD COLUMN "physicalDossierCheckedById" TEXT,
ADD COLUMN "physicalDossierPublicNote" TEXT,
ADD COLUMN "physicalDossierInternalNote" TEXT,
ADD COLUMN "registrationFormPdfPrintedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ApplicationLog"
ALTER COLUMN "applicationId" DROP NOT NULL,
ADD COLUMN "metadata" JSONB;

-- CreateTable
CREATE TABLE "SchoolSetting" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "schoolContactJson" JSONB,
  "leadershipContactsJson" JSONB,
  "publicLeadershipPhones" BOOLEAN NOT NULL DEFAULT true,
  "registrationDeadline" TIMESTAMP(3),
  "admissionRound1PublishAt" TIMESTAMP(3),
  "admissionRound2PublishAt" TIMESTAMP(3),
  "personalResultLookupEnabled" BOOLEAN NOT NULL DEFAULT true,
  "registrationLockedNote" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_admissionResult_idx" ON "Application"("admissionResult");
CREATE INDEX "Application_admissionPublished_idx" ON "Application"("admissionPublished");
CREATE INDEX "Application_admissionBatch_idx" ON "Application"("admissionBatch");
CREATE INDEX "Application_physicalDossierStatus_idx" ON "Application"("physicalDossierStatus");
CREATE INDEX "Application_physicalDossierValidity_idx" ON "Application"("physicalDossierValidity");
CREATE INDEX "ApplicationLog_action_idx" ON "ApplicationLog"("action");
CREATE INDEX "ApplicationLog_createdAt_idx" ON "ApplicationLog"("createdAt");
