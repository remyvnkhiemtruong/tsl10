-- AlterTable
ALTER TABLE "Application"
ADD COLUMN "registrationFormNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Application_registrationFormNumber_key" ON "Application"("registrationFormNumber");
