import { NextResponse } from "next/server";
import { searchSecondarySchools } from "@/lib/secondary-schools";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const oldAddress = url.searchParams.get("oldAddress") ?? "";
  const newAddress = url.searchParams.get("newAddress") ?? "";
  const items = searchSecondarySchools(q, { oldAddress, newAddress, limit: 80 }).map((school) => ({
    id: school.id,
    name: school.name,
    oldAddress: school.oldAddress,
    newAddress: school.newAddress,
  }));

  return NextResponse.json({ items, total: items.length });
}
