import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/server/authSession";
import { parsePatientStoreJson, patientStoreForApiPayload } from "@/lib/patientStoreApi";
import { randomUUID } from "crypto";
import type { ClaimCorrespondence, InsuranceClaim } from "@/lib/types";
import { Resend } from "resend";
import { checkRateLimitDb } from "@/lib/auth/otpRateLimitDb";
import { hasTrustedMutationOrigin } from "@/lib/server/requestSecurity";

export const runtime = "nodejs";

const SendSchema = z.object({
  claimId: z.string(),
  toEmail: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(30000),
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);
}

export async function POST(req: Request) {
  if (!hasTrustedMutationOrigin(req)) {
    return NextResponse.json({ ok: false, error: "Cross-site request blocked." }, { status: 403 });
  }
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  if (process.env.ENABLE_INSURANCE_EMAIL_SEND !== "1") {
    return NextResponse.json(
      { ok: false, error: "Claim email sending is disabled during the closed beta." },
      { status: 403 },
    );
  }
  if (!(await checkRateLimitDb(`claim-email:${userId}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json(
      { ok: false, error: "Too many claim emails. Try again later." },
      { status: 429 },
    );
  }

  const parsed = SendSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const { claimId, toEmail, subject, body } = parsed.data;

  const row = await prisma.patientRecord.findUnique({ where: { userId } });
  const store = parsePatientStoreJson(row?.data ?? null);
  if (!store) return NextResponse.json({ ok: false, error: "Store not found." }, { status: 404 });

  const claims: InsuranceClaim[] = store.insuranceClaims ?? [];
  const claimIdx = claims.findIndex((c) => c.id === claimId);
  if (claimIdx < 0) return NextResponse.json({ ok: false, error: "Claim not found." }, { status: 404 });
  const claim = claims[claimIdx]!;
  const plan = (store.insurancePlans ?? []).find((candidate) => candidate.id === claim.planId);
  const verifiedRecipient = plan?.claimEmailAddress?.trim().toLowerCase();
  if (!verifiedRecipient || verifiedRecipient !== toEmail.trim().toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "The recipient must match the claim email saved on this insurance plan." },
      { status: 400 },
    );
  }
  if (claim.draftEmailSubject !== subject || claim.draftEmailBody !== body) {
    return NextResponse.json(
      { ok: false, error: "Review and save the claim draft before sending it." },
      { status: 409 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  const replyTo = user?.email ?? undefined;
  const profileName = [store.profile.firstName, store.profile.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || store.profile.name?.trim();
  const safeFromName = profileName?.replace(/[^\p{L}\p{M} .'-]/gu, "").slice(0, 100);

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const fromAddress = process.env.AUTH_EMAIL_FROM?.trim();
  let deliveryWarning: string | undefined;

  if (resendKey && fromAddress) {
    const resend = new Resend(resendKey);
    const displayFrom = safeFromName ? `${safeFromName} via UMA <${fromAddress}>` : fromAddress;
    try {
      const { error } = await resend.emails.send({
        from: displayFrom,
        to: toEmail,
        replyTo: replyTo,
        subject,
        text: body,
        html: body
          .split("\n\n")
          .map((para) => `<p style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;margin:0 0 12px">${
            escapeHtml(para).replace(/\n/g, "<br>")
          }</p>`)
          .join(""),
      });
      if (error) {
        deliveryWarning = `Email could not be delivered: ${error.name}. The correspondence has been recorded.`;
      }
    } catch {
      deliveryWarning = "Email delivery failed due to a network error. The correspondence has been recorded.";
    }
  } else {
    deliveryWarning = "Email not sent (RESEND_API_KEY or AUTH_EMAIL_FROM not set). Correspondence recorded.";
  }

  if (deliveryWarning) {
    return NextResponse.json({ ok: false, error: deliveryWarning }, { status: 502 });
  }

  const now = new Date().toISOString();
  const correspondence: ClaimCorrespondence = {
    id: randomUUID(),
    direction: "outgoing",
    subject,
    body,
    toEmail,
    sentAtISO: now,
  };

  const updatedClaim: InsuranceClaim = {
    ...claims[claimIdx]!,
    status: "submitted",
    sentToEmail: toEmail,
    sentAtISO: now,
    correspondence: [...(claims[claimIdx]!.correspondence ?? []), correspondence],
    updatedAtISO: now,
  };
  claims[claimIdx] = updatedClaim;

  const updated = { ...store, insuranceClaims: claims, updatedAtISO: now };
  const payload = patientStoreForApiPayload(updated);
  await prisma.patientRecord.update({ where: { userId }, data: { data: payload as object } });

  return NextResponse.json({ ok: true, claim: updatedClaim });
}
