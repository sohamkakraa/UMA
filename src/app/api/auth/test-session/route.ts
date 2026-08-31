import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSessionToken,
} from "@/lib/auth/sessionToken";
import { ensureTestUser } from "@/lib/server/ensureTestUser";

export const runtime = "nodejs";

const BodySchema = z
  .object({
    sub: z.string().regex(/^(?:e2e|eval|test)-[a-z0-9-]{1,56}$/).optional(),
    email: z.string().email().refine(
      (value) => value.endsWith("@uma.local") || value.endsWith(".invalid"),
      "Test identities must use a reserved test domain.",
    ).optional(),
  })
  .optional();

function secretMatches(req: Request): boolean {
  const expected = process.env.UMA_TEST_AUTH_SECRET?.trim() ?? "";
  const actual = req.headers.get("x-uma-test-auth")?.trim() ?? "";
  if (expected.length < 32 || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

/**
 * Development / automated-testing only — issues a signed mv_session cookie.
 * Disabled in production. Opt-in on preview via UMA_ENABLE_TEST_AUTH=1.
 */
export async function POST(req: Request) {
  const isProductionDeployment = process.env.VERCEL_ENV === "production";
  const isLocalDevelopment = process.env.NODE_ENV !== "production";
  const isProtectedAutomation =
    process.env.UMA_ENABLE_TEST_AUTH === "1" &&
    (process.env.VERCEL_ENV === "preview" || process.env.CI === "true") &&
    secretMatches(req);

  if (isProductionDeployment || (!isLocalDevelopment && !isProtectedAutomation)) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  let body: z.infer<typeof BodySchema> = undefined;
  try {
    const raw = await req.json();
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid test identity." }, { status: 400 });
    }
    body = parsed.data;
  } catch {
    body = undefined;
  }

  const sub = body?.sub ?? "test-session";
  const email = body?.email ?? "test-agent@uma.local";

  try {
    await ensureTestUser(sub, { email });
  } catch {
    return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
  }

  const token = await signSessionToken({ sub, email });
  if (!token) {
    return NextResponse.json({ ok: false, error: "Session signing unavailable" }, { status: 503 });
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
