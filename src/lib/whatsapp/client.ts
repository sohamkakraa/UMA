/**
 * WhatsApp Business Cloud API client.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const GRAPH_API = "https://graph.facebook.com/v21.0";

function getConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    throw new Error("WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set");
  }
  return { token, phoneNumberId };
}

async function graphPost(path: string, body: unknown) {
  const { token } = getConfig();
  const res = await fetch(`${GRAPH_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[WhatsApp] Graph API error ${res.status}:`, text);
    throw new Error(`WhatsApp API ${res.status}: ${text}`);
  }
  return res.json();
}

/** Mark a message as "read" (blue ticks). */
export async function markRead(messageId: string) {
  const { phoneNumberId } = getConfig();
  return graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

/** Send a plain text reply. WhatsApp limits messages to 4096 chars. */
export async function sendText(to: string, text: string) {
  const { phoneNumberId } = getConfig();
  const trimmed = text.slice(0, 4096);
  return graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body: trimmed },
  });
}

/**
 * Send a message template (required for proactive/outbound messages
 * outside the 24-hour conversation window).
 */
export async function sendTemplate(
  to: string,
  templateName: string,
  languageCode = "en",
  components?: unknown[],
) {
  const { phoneNumberId } = getConfig();
  return graphPost(`/${phoneNumberId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(components?.length ? { components } : {}),
    },
  });
}

/** Returns true if the required env vars are configured. */
export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}
