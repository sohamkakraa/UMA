import { NextResponse } from "next/server";
import { z } from "zod";
import { setOtpDb } from "@/lib/auth/otpDb";
import { checkOtpRateLimit } from "@/lib/auth/otpRateLimit";
import { normalizeLoginIdentifier } from "@/lib/auth/identifiers";
import { getBetaDemoConfig, isBetaDemoIdentifier, shouldExposeBetaDemoOtp } from "@/lib/auth/betaDemo";

export const runtime = "nodejs";

const bodySchema = z.object({
  identifier: z.string().min(3).max(320),
  phoneCountryCode: z.string().max(8).optional(),
});

function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const { identifier, phoneCountryCode } = parsed.data;
  const ip = clientIp(req);
  if (!checkOtpRateLimit(`otp:${ip}`)) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again later." }, { status: 429 });
  }

  const norm = normalizeLoginIdentifier(identifier, phoneCountryCode);
  if (!norm) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email or phone number with country code." },
      { status: 400 },
    );
  }

  const betaCfg = getBetaDemoConfig();
  const code =
    betaCfg && isBetaDemoIdentifier(norm) ? betaCfg.otp : String(Math.floor(100000 + Math.random() * 900000));
  try {
    await setOtpDb(norm.key, code);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Sign-in service is unavailable. Check DATABASE_URL and run database migrations." },
      { status: 503 },
    );
  }

  // Local dev: NODE_ENV=development. Vercel Preview: VERCEL_ENV=preview (NODE_ENV is still "production").
  const devReturn =
    process.env.AUTH_DEV_RETURN_OTP === "1" &&
    (process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview");
  const betaExpose = isBetaDemoIdentifier(norm) && shouldExposeBetaDemoOtp();

  return NextResponse.json({
    ok: true,
    channel: norm.kind,
    ...(devReturn ? { devOtp: code } : {}),
    ...(betaExpose ? { betaDemoOtp: code } : {}),
    message:
      "This app does not send SMS or email yet—the code is only stored on the server. For local dev or a Vercel Preview deploy, set AUTH_DEV_RETURN_OTP=1 to show the code on this screen after Send code. For a shared test account, use AUTH_BETA_DEMO_* (see README). Real launches need a provider (e.g. Resend, SendGrid, Twilio).",
  });
}
