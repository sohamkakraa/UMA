import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/sessionToken";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set("mv_auth", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
