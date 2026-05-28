-- AlterEnum
ALTER TYPE "LogAction" ADD VALUE 'UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "Application"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "deleteReason" TEXT;

-- CreateIndex
CREATE INDEX "Application_deletedAt_idx" ON "Application"("deletedAt");
