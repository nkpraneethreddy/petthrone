import { NextResponse } from "next/server";
import { bumpClicks, getPet } from "@/lib/store";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const pet = await getPet(id);
  if (!pet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const clicks = await bumpClicks(id);
  return NextResponse.json({ clicks });
}
