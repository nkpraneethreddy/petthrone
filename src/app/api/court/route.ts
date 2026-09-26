import { NextResponse } from "next/server";
import { getCourt } from "@/lib/store";

export async function GET() {
  const court = await getCourt();
  return NextResponse.json(court);
}
