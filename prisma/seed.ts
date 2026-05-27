import "dotenv/config";
import { PrismaClient, Role, Gender, AcademicLevel, ApplicationStatus, Prize, PriorityType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { SUBJECT_OPTIONS } from "../src/lib/constants";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/vvk_admission?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const subjectsByOption = Object.fromEntries(
  SUBJECT_OPTIONS.map((option) => [option.optionNumber, option.subjects])
) as Record<number, string>;

async function main() {
  if (process.env.NODE_ENV === "production" && (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD)) {
    throw new Error("Production seed cần SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD rõ ràng, không dùng tài khoản mặc định.");
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@vovankiet.edu.vn";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: "Quản trị tuyển sinh",
      passwordHash,
      role: Role.SUPER_ADMIN
    },
    create: {
      name: "Quản trị tuyển sinh",
      email,
      passwordHash,
      role: Role.SUPER_ADMIN
    }
  });

  const samples = [
    {
      code: "VK2026-000001",
      fullName: "NGUYỄN VĂN AN",
      citizenId: "012345678901",
      status: ApplicationStatus.CHO_KIEM_TRA,
      option: 1,
      bonus: 0,
      priority: PriorityType.DAN_TOC_THIEU_SO
    },
    {
      code: "VK2026-000002",
      fullName: "TRẦN THỊ BÌNH",
      citizenId: "012345678902",
      status: ApplicationStatus.CAN_BO_SUNG,
      option: 4,
      bonus: 0.5,
      award: true
    },
    {
      code: "VK2026-000003",
      fullName: "LÊ MINH KHANG",
      citizenId: "012345678903",
      status: ApplicationStatus.HOP_LE,
      option: 6,
      bonus: 0
    }
  ];

  for (const item of samples) {
    await prisma.application.upsert({
      where: { applicationCode: item.code },
      update: {},
      create: {
        applicationCode: item.code,
        status: item.status,
        fullName: item.fullName,
        dateOfBirth: new Date("2011-01-15"),
        gender: item.fullName.includes("THỊ") ? Gender.NU : Gender.NAM,
        ethnicity: item.priority ? "Khơ me" : "Kinh",
        birthPlace: "Cà Mau",
        citizenId: item.citizenId,
        issueDate: new Date("2025-01-01"),
        issuePlace: "Cục CSQLHC về TTXH",
        secondarySchool: "THCS Võ Văn Kiệt",
        schoolYear: "2025 - 2026",
        permanentAddress: "Ấp Vĩnh Phú B, xã Phước Long, tỉnh Cà Mau",
        houseNumber: "",
        hamlet: "Vĩnh Phú B",
        ward: "Phước Long",
        province: "Cà Mau",
        studentPhone: "0912345678",
        email: "hocsinh@example.com",
        guardianName: "Nguyễn Văn Phụ Huynh",
        guardianPhone: "0987654321",
        selectedOptionNumber: item.option,
        selectedSubjects: subjectsByOption[item.option],
        bonusScore: item.bonus,
        commitmentAccepted: true,
        priorities: item.priority
          ? {
              create: [{ type: item.priority, description: "Dữ liệu mẫu" }]
            }
          : undefined,
        awards: item.award
          ? {
              create: [
                {
                  competitionName: "Học sinh giỏi Tin học cấp tỉnh",
                  field: "Tin học",
                  level: "Tỉnh",
                  year: 2026,
                  prize: Prize.GIAI_BA,
                  bonusScore: 0.5
                }
              ]
            }
          : undefined,
        academicRecords: {
          create: [6, 7, 8, 9].map((grade) => ({
            grade,
            literature: 8,
            math: 8.5,
            english: 7.8,
            naturalScience: 8.2,
            historyGeography: 8.1,
            civicEducation: 9,
            technology: 8.6,
            informatics: 9,
            academicLevel: AcademicLevel.TOT,
            conductLevel: AcademicLevel.TOT
          }))
        },
        logs: { create: [{ action: "CREATED", note: "Dữ liệu mẫu local" }] }
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
