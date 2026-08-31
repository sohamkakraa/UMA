import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth/sessionToken";
import { checkRateLimitDb } from "@/lib/auth/otpRateLimitDb";
import { requireUserId } from "@/lib/server/authSession";
import {
  hasTrustedMutationOrigin,
  sensitiveResponseHeaders,
} from "@/lib/server/requestSecurity";

export const runtime = "nodejs";

const DeleteSchema = z.object({
  confirmation: z.literal("DELETE MY UMA DATA"),
});

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phoneE164: true,
      whatsappPhone: true,
      whatsappVerified: true,
      createdAt: true,
      updatedAt: true,
      patientRecord: { select: { data: true, updatedAt: true } },
      threads: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          archivedAt: true,
          createdAt: true,
          messages: {
            orderBy: { createdAt: "asc" },
            select: { role: true, content: true, source: true, createdAt: true },
          },
        },
      },
      wellnessLogs: true,
      waterLogs: true,
    },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      exportedAtISO: new Date().toISOString(),
      account: user,
    },
    {
      headers: {
        ...sensitiveResponseHeaders(),
        "Content-Disposition": 'attachment; filename="uma-data-export.json"',
      },
    },
  );
}

export async function DELETE(req: Request) {
  if (!hasTrustedMutationOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Cross-site request blocked." }, { status: 403 });
  }
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }
  if (!(await checkRateLimitDb(`account-delete:${userId}`, 3, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ ok: false, error: "Too many deletion attempts." }, { status: 429 });
  }

  const parsed = DeleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Type "DELETE MY UMA DATA" to confirm.' },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.rateLimit.deleteMany({ where: { key: { contains: userId } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  const response = NextResponse.json(
    { ok: true },
    { headers: sensitiveResponseHeaders() },
  );
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
