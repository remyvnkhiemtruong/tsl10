import { prisma } from "@/lib/prisma";

export async function generateApplicationCode() {
  const latest = await prisma.application.findFirst({
    orderBy: { applicationCode: "desc" },
    select: { applicationCode: true }
  });
  const latestNumber = latest?.applicationCode.match(/^VK2026-(\d{6})$/)?.[1];
  const next = latestNumber ? Number(latestNumber) + 1 : 1;
  return `VK2026-${String(next).padStart(6, "0")}`;
}
