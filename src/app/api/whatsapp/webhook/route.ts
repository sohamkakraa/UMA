/**
 * WhatsApp Business Cloud API webhook.
 *
 * GET  — Meta verification handshake (called once when you register the webhook URL).
 * POST — Incoming messages, status updates, and other notifications.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/whatsapp/processMessage";
import { isWhatsAppConfigured } from "@/lib/whatsapp/client";

export const runtime = "nodejs";

/**
 * Webhook verification (Meta handshake).
 * Meta sends: GET ?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=RANDOM
 * We must return the challenge value as plain text if the token matches.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken && verifyToken) {
    console.log("[WhatsApp] Webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * Incoming webhook events from Meta.
 * Always return 200 quickly — process messages asynchronously.
 */
export async function POST(req: NextRequest) {
  if (!isWhatsAppConfigured()) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 503 });
  }

  let body: WebhookPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta requires a 200 response within a few seconds; process in background.
  // In serverless (Vercel), we use waitUntil if available.
  const processing = handlePayload(body);

  // @ts-expect-error — waitUntil is a Vercel/Edge runtime extension
  if (typeof globalThis.waitUntil === "function") {
    // @ts-expect-error
    globalThis.waitUntil(processing);
  } else {
    processing.catch((err) => console.error("[WhatsApp] Processing error:", err));
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

// ─── Types (subset of Meta webhook payload) ──────────────────────────────────

type WebhookPayload = {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: {
        messaging_product?: string;
        metadata?: { phone_number_id: string; display_phone_number: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          text?: { body: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
};

async function handlePayload(body: WebhookPayload) {
  if (body.object !== "whatsapp_business_account") return;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;
      const { messages, contacts } = change.value;
      if (!messages?.length) continue;

      for (const msg of messages) {
        if (msg.type !== "text" || !msg.text?.body) continue;

        const senderPhone = msg.from;
        const waId = contacts?.[0]?.wa_id ?? senderPhone;
        const text = msg.text.body.trim();

        if (!text) continue;

        try {
          await processIncomingMessage(waId, senderPhone, msg.id, text);
        } catch (err) {
          console.error(`[WhatsApp] Failed to process message ${msg.id}:`, err);
        }
      }
    }
  }
}
