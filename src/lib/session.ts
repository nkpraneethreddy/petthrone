import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getUser, upsertUser } from "./store";
import type { User } from "./types";

export const SESSION_COOKIE = "petthrone_uid";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  secure: process.env.NODE_ENV === "production",
};

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return getUser(id);
}

export function attachSession(res: NextResponse, userId: string) {
  res.cookies.set(SESSION_COOKIE, userId, COOKIE_OPTS);
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.delete(SESSION_COOKIE);
}

export async function loginWithEmail(email: string) {
  const user = await upsertUser(email);
  return user;
}
