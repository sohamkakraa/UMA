import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy route: sign-in is OTP-only. */
export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Password sign-in is no longer used. Request a one-time code on the login page instead." },
    { status: 410 },
  );
}
