import { NextResponse } from "next/server";
import { bumpVisitors } from "@/lib/store";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    first?: boolean;
  };
  const counts = await bumpVisitors(body.sessionId, Boolean(body.first));
  return NextResponse.json(counts);
}
