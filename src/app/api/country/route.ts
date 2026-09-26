import { NextResponse } from "next/server";
import { getCountryBoard } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = searchParams.get("country") || undefined;
  const data = await getCountryBoard(country);
  return NextResponse.json(data);
}
