import { NextResponse } from "next/server";
import { hasStripe } from "@/lib/stripe";
import { getCourt } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const court = await getCourt();
    return NextResponse.json({
      ok: true,
      stripe: hasStripe(),
      pets: court.petCount,
      time: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
