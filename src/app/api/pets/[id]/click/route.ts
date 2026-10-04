import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rateLimit";
import { bumpClicks, getPet } from "@/lib/store";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limit = rateLimit(req, "click", 30, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const { id } = await context.params;
  const pet = await getPet(id);
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const clicks = await bumpClicks(id);
  return NextResponse.json({ clicks });
}
