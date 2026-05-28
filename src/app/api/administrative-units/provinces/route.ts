import { NextResponse } from "next/server";
import { getProvinceSummaries } from "@/lib/administrative-units";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ provinces: getProvinceSummaries() });
}

