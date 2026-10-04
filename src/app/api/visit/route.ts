import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rateLimit";
import { bumpVisitors } from "@/lib/store";

export async function POST(req: Request) {
  const limit = rateLimit(req, "visit", 20, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const body = (await req.json().catch(() => ({}))) as {
    sessionId?: string;
    first?: boolean;
  };
  const sessionId =
    typeof body.sessionId === "string" && /^[a-zA-Z0-9-]{8,64}$/.test(body.sessionId)
      ? body.sessionId
      : undefined;
  const counts = await bumpVisitors(sessionId, Boolean(body.first));
  return NextResponse.json(counts);
}
