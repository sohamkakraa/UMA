import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server/authSession";
import { patientStoreForApiPayload, parsePatientStoreJson } from "@/lib/patientStoreApi";

export const runtime = "nodejs";

const PutSchema = z.object({
  store: z.unknown(),
});

/** Stay under typical serverless body limits; embedded PDFs are stripped before upload. */
const MAX_JSON_CHARS = 4_000_000;

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  try {
    const row = await prisma.patientRecord.findUnique({ where: { userId } });
    const store = row?.data ? parsePatientStoreJson(row.data) : null;
    return NextResponse.json({ ok: true, store });
  } catch {
    return NextResponse.json({ ok: false, error: "Database unavailable." }, { status: 503 });
  }
}

export async function PUT(req: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = PutSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  const jsonStr = JSON.stringify(parsed.data.store);
  if (jsonStr.length > MAX_JSON_CHARS) {
    return NextResponse.json({ ok: false, error: "Store payload is too large." }, { status: 413 });
  }

  const store = parsePatientStoreJson(parsed.data.store);
  if (!store) {
    return NextResponse.json({ ok: false, error: "Invalid patient store shape." }, { status: 400 });
  }

  const payload = patientStoreForApiPayload(store);
  payload.updatedAtISO = new Date().toISOString();

  try {
    await prisma.patientRecord.upsert({
      where: { userId },
      create: { userId, data: payload as object },
      update: { data: payload as object },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save." }, { status: 503 });
  }
}
