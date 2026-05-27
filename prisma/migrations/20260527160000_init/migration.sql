-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMISSION_OFFICER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('CHO_KIEM_TRA', 'DANG_XU_LY', 'CAN_BO_SUNG', 'DA_TIEP_NHAN', 'HOP_LE', 'KHONG_HOP_LE', 'DA_DUYET_XET_TUYEN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('NAM', 'NU', 'KHAC');

-- CreateEnum
CREATE TYPE "AcademicLevel" AS ENUM ('TOT', 'KHA', 'DAT', 'CHUA_DAT');

-- CreateEnum
CREATE TYPE "Prize" AS ENUM ('GIAI_NHAT', 'GIAI_NHI', 'GIAI_BA');

-- CreateEnum
CREATE TYPE "PriorityType" AS ENUM ('CON_THUONG_BINH_LIET_SI', 'DAN_TOC_THIEU_SO', 'CHA_ME_DAN_TOC_THIEU_SO', 'VUNG_DAC_BIET_KHO_KHAN', 'HO_NGHEO', 'HO_CAN_NGHEO', 'MO_COI_CHA_HOAC_ME', 'MO_COI_CHA_LAN_ME');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PHOTO_4X6', 'HOC_BA_THCS', 'HOC_BA_LOP_6', 'HOC_BA_LOP_7', 'HOC_BA_LOP_8', 'HOC_BA_LOP_9', 'GIAY_KHAI_SINH', 'CCCD', 'MINH_CHUNG_UU_TIEN', 'MINH_CHUNG_KHUYEN_KHICH', 'HO_NGHEO_CAN_NGHEO', 'GIAY_TO_KHAC');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('CHUA_KIEM_TRA', 'HOP_LE', 'KHONG_HOP_LE', 'CAN_BO_SUNG');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATED', 'VIEWED', 'STATUS_UPDATED', 'FILE_REVIEWED', 'NOTE_UPDATED', 'REQUESTED_SUPPLEMENT', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMISSION_OFFICER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "applicationCode" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'CHO_KIEM_TRA',
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "ethnicity" TEXT NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "issuePlace" TEXT,
    "secondarySchool" TEXT NOT NULL,
    "schoolYear" TEXT NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "houseNumber" TEXT,
    "hamlet" TEXT,
    "ward" TEXT,
    "province" TEXT,
    "studentPhone" TEXT,
    "email" TEXT,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "selectedOptionNumber" INTEGER NOT NULL,
    "selectedSubjects" TEXT NOT NULL,
    "bonusScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commitmentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "publicNote" TEXT,
    "internalNote" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "literature" DOUBLE PRECISION,
    "math" DOUBLE PRECISION,
    "english" DOUBLE PRECISION,
    "naturalScience" DOUBLE PRECISION,
    "historyGeography" DOUBLE PRECISION,
    "civicEducation" DOUBLE PRECISION,
    "technology" DOUBLE PRECISION,
    "informatics" DOUBLE PRECISION,
    "note" TEXT,
    "academicLevel" "AcademicLevel",
    "conductLevel" "AcademicLevel",

    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriorityRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "PriorityType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "PriorityRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "competitionName" TEXT NOT NULL,
    "field" TEXT,
    "level" TEXT,
    "year" INTEGER,
    "prize" "Prize" NOT NULL,
    "bonusScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AwardRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "awardRecordId" TEXT,
    "fileType" "FileType" NOT NULL,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
    "publicUrl" TEXT,
    "status" "FileStatus" NOT NULL DEFAULT 'CHUA_KIEM_TRA',
    "note" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "LogAction" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_applicationCode_key" ON "Application"("applicationCode");

-- CreateIndex
CREATE UNIQUE INDEX "Application_citizenId_key" ON "Application"("citizenId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_fullName_idx" ON "Application"("fullName");

-- CreateIndex
CREATE INDEX "Application_secondarySchool_idx" ON "Application"("secondarySchool");

-- CreateIndex
CREATE INDEX "Application_selectedOptionNumber_idx" ON "Application"("selectedOptionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicRecord_applicationId_grade_key" ON "AcademicRecord"("applicationId", "grade");

-- AddForeignKey
ALTER TABLE "AcademicRecord" ADD CONSTRAINT "AcademicRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriorityRecord" ADD CONSTRAINT "PriorityRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AwardRecord" ADD CONSTRAINT "AwardRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_awardRecordId_fkey" FOREIGN KEY ("awardRecordId") REFERENCES "AwardRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationLog" ADD CONSTRAINT "ApplicationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
