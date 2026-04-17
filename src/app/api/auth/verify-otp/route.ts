import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { verifyAndConsumeOtpDb } from "@/lib/auth/otpDb";
import { normalizeLoginIdentifier } from "@/lib/auth/identifiers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionSigningFailureHint,
  signSessionToken,
} from "@/lib/auth/sessionToken";
import { checkRateLimitDb } from "@/lib/auth/otpRateLimitDb";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Fixed VULN-005: rate-limit OTP verify attempts to prevent brute-force.
// A 6-digit OTP has only 1M combinations — without this, all can be tried
// within the 10-minute TTL window at modest request rates.
const VERIFY_RATE_KEY_PREFIX = "otp-verify:";

function clientIp(req: Request): string {
  const xf = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim() || "unknown";
  return "unknown";
}

const bodySchema = z.object({
  identifier: z.string().min(3).max(320),
  code: z.string().regex(/^\d{6}$/),
  phoneCountryCode: z.string().max(8).optional(),
});

export async function POST(req: Request) {
  // Fixed VULN-005 + VULN-007: DB-backed rate limit on verify (10 per 15 min per IP)
  const ip = clientIp(req);
  if (!(await checkRateLimitDb(`${VERIFY_RATE_KEY_PREFIX}${ip}`, 10, 15 * 60 * 1000))) {
    return NextResponse.json(
      { ok: false, error: "Too many verification attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const { identifier, code, phoneCountryCode } = parsed.data;
  const norm = normalizeLoginIdentifier(identifier, phoneCountryCode);
  if (!norm) {
    return NextResponse.json({ ok: false, error: "Invalid email address." }, { status: 400 });
  }

  if (norm.kind === "phone") {
    return NextResponse.json(
      {
        ok: false,
        error: "Sign-in with phone is not available yet. Please use your email address.",
      },
      { status: 400 },
    );
  }

  let otpOk = false;
  try {
    otpOk = await verifyAndConsumeOtpDb(norm.key, code);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Sign-in service is unavailable. Check DATABASE_URL and migrations." },
      { status: 503 },
    );
  }
  if (!otpOk) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Incorrect or expired code. Check the latest email we sent, or tap Send code to get a new one.",
      },
      { status: 401 },
    );
  }

  let user: { id: string; email: string | null; phoneE164: string | null };
  try {
    let u = await prisma.user.findUnique({ where: { email: norm.display } });
    if (!u) u = await prisma.user.create({ data: { email: norm.display } });
    user = u;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "That identifier is already linked. Try signing in with the other method." },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: "Could not create account." }, { status: 503 });
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
