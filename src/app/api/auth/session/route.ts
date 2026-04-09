import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/sessionToken";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  const claims = await verifySessionToken(raw);
  if (!claims?.sub) {
    return NextResponse.json({ ok: false, error: "Session expired." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: claims.sub } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Account not found." }, { status: 401 });
    }
    return NextResponse.json({
      ok: true,
      email: user.email ?? null,
      phoneE164: user.phoneE164 ?? null,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
  }
}
