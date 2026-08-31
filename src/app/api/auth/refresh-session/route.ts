import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionSigningFailureHint,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth/sessionToken";
import { prisma } from "@/lib/prisma";
import { hasTrustedMutationOrigin } from "@/lib/server/requestSecurity";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasTrustedMutationOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Cross-site request blocked." }, { status: 403 });
  }
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const cur = await verifySessionToken(raw);
  if (!cur?.sub) {
    return NextResponse.json({ ok: false, error: "Session expired." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: cur.sub } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  const token = await signSessionToken({
    sub: user.id,
    email: user.email ?? undefined,
    phoneE164: user.phoneE164 ?? undefined,
  });
  if (!token) {
    return NextResponse.json({ ok: false, error: sessionSigningFailureHint() }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
