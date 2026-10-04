import { NextResponse } from "next/server";
import { rateLimit, tooMany } from "@/lib/rateLimit";
import { attachSession, clearSessionCookie, getSessionUser, loginWithEmail } from "@/lib/session";
import { getUserPet } from "@/lib/store";
import { isEmail } from "@/lib/site";

export async function GET() {
  const user = await getSessionUser();
  const pet = user ? await getUserPet(user.id) : null;
  return NextResponse.json({ user, pet });
}

export async function POST(req: Request) {
  const limit = rateLimit(req, "auth", 10, 60_000);
  if (!limit.ok) return tooMany(limit.retryAfter);

  const body = (await req.json().catch(() => ({}))) as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  if (!isEmail(email)) {
    return NextResponse.json({ error: "Enter a real email." }, { status: 400 });
  }
  const user = await loginWithEmail(email);
  const pet = await getUserPet(user.id);
  const res = NextResponse.json({ user, pet });
  attachSession(res, user.id);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
