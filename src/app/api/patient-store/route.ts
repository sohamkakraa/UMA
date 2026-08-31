import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server/authSession";
import { patientStoreForApiPayload, parsePatientStoreJson } from "@/lib/patientStoreApi";
import { checkRateLimitDb } from "@/lib/auth/otpRateLimitDb";
import {
  hasTrustedMutationOrigin,
  sensitiveResponseHeaders,
} from "@/lib/server/requestSecurity";

export const runtime = "nodejs";

const PutSchema = z.object({
  store: z.unknown(),
  baseVersion: z.string().datetime({ offset: true }).nullable().optional(),
});

/** Stay under typical serverless body limits; embedded PDFs are stripped before upload. */
const MAX_JSON_CHARS = 4_000_000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: sensitiveResponseHeaders(),
  });
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return json({ ok: false, error: "Not signed in." }, 401);
  }

  try {
    const row = await prisma.patientRecord.findUnique({ where: { userId } });
    const store = row?.data ? parsePatientStoreJson(row.data) : null;
    return json({ ok: true, store, version: row?.updatedAt.toISOString() ?? null });
  } catch {
    return json({ ok: false, error: "Database unavailable." }, 503);
  }
}

export async function PUT(req: Request) {
  if (!hasTrustedMutationOrigin(req)) {
    return json({ ok: false, error: "Cross-site request blocked." }, 403);
  }
  const userId = await requireUserId();
  if (!userId) {
    return json({ ok: false, error: "Not signed in." }, 401);
  }
  if (!(await checkRateLimitDb(`patient-store:${userId}`, 120, 60 * 60 * 1000))) {
    return json({ ok: false, error: "Too many saves. Wait a moment and try again." }, 429);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400);
  }

  const parsed = PutSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: "Invalid body." }, 400);
  }

  const jsonStr = JSON.stringify(parsed.data.store);
  if (jsonStr.length > MAX_JSON_CHARS) {
    return json({ ok: false, error: "Store payload is too large." }, 413);
  }

  const store = parsePatientStoreJson(parsed.data.store);
  if (!store) {
    return json({ ok: false, error: "Invalid patient store shape." }, 400);
  }

  const payload = patientStoreForApiPayload(store);
  payload.updatedAtISO = new Date().toISOString();

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const existing = await tx.patientRecord.findUnique({ where: { userId } });
      if (existing) {
        if (
          parsed.data.baseVersion &&
          existing.updatedAt.toISOString() !== parsed.data.baseVersion
        ) {
          return { conflict: true as const, version: existing.updatedAt.toISOString() };
        }
        const updated = await tx.patientRecord.update({
          where: { userId },
          data: { data: payload as object },
        });
        return { conflict: false as const, version: updated.updatedAt.toISOString() };
      }
      if (parsed.data.baseVersion) {
        return { conflict: true as const, version: null };
      }
      const created = await tx.patientRecord.create({
        data: { userId, data: payload as object },
      });
      return { conflict: false as const, version: created.updatedAt.toISOString() };
    });
    if (outcome.conflict) {
      return json(
        {
          ok: false,
          error: "Your records changed in another session. Refresh before saving again.",
          code: "STORE_CONFLICT",
          version: outcome.version,
        },
        409,
      );
    }
    return json({ ok: true, version: outcome.version });
  } catch {
    return json({ ok: false, error: "Could not save." }, 503);
  }
}
