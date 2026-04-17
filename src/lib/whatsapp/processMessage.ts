/**
 * Processes an incoming WhatsApp message: loads patient context,
 * calls the LLM, persists the exchange, and replies.
 */

import { prisma } from "@/lib/prisma";
import { parsePatientStoreJson } from "@/lib/patientStoreApi";
import { createBlankPatientStore } from "@/lib/store";
import type { PatientStore } from "@/lib/types";
import { sendText, markRead } from "./client";

const MAX_HISTORY = 20;

function buildRetrievalContext(store: PatientStore): string {
  const p = store.profile;
  const lines: string[] = [
    "You are UMA (Ur Medical Assistant), responding via WhatsApp.",
    "You are NOT a doctor. Never diagnose. Use plain language.",
    "Keep replies concise — WhatsApp messages should be short and scannable.",
    "Use line breaks and simple formatting (no markdown headers). Emojis are fine sparingly.",
    "Not medical advice. Always recommend speaking to a doctor for clinical decisions.",
    "",
    "### Patient context",
    `Name: ${p.name || "Unknown"}`,
    `DOB: ${p.dob || "Unknown"}, Sex: ${p.sex || "Unknown"}`,
  ];

  if (p.conditions?.length) lines.push(`Conditions: ${p.conditions.join(", ")}`);
  if (p.allergies?.length) lines.push(`Allergies: ${p.allergies.join(", ")}`);

  const activeMeds = (store.meds ?? []).filter((m) => !m.endDate).slice(0, 20);
  if (activeMeds.length) {
    lines.push("", "### Active medications");
    for (const m of activeMeds) {
      lines.push(`- ${m.name}${m.dose ? ` ${m.dose}` : ""}${m.frequency ? ` · ${m.frequency}` : ""}`);
    }
  }

  const recentLabs = (store.labs ?? [])
    .filter((l) => l.value !== undefined && l.value !== null)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 30);
  if (recentLabs.length) {
    lines.push("", "### Recent lab values");
    for (const l of recentLabs) {
      lines.push(`- ${l.name}: ${l.value}${l.unit ? ` ${l.unit}` : ""}${l.date ? ` (${l.date})` : ""}`);
    }
  }

  return lines.join("\n");
}

async function callLLM(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userMessage: string,
): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

    const messages = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userMessage },
    ];

    const res = await client.messages.create({
      model,
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    return res.content
      .filter((b) => b.type === "text")
      .map((b) => ("text" in b ? (b as { text: string }).text : ""))
      .join("");
  }

  if (process.env.OPENAI_API_KEY) {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

    const res = await client.chat.completions.create({
      model,
      max_tokens: 600,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ],
    });

    return res.choices[0]?.message?.content ?? "I could not generate a response.";
  }

  return "UMA is not fully configured yet. Please ask the admin to set up the AI keys.";
}

export async function processIncomingMessage(
  waId: string,
  senderPhone: string,
  messageId: string,
  text: string,
) {
  try {
    await markRead(messageId);
  } catch {
    // non-critical
  }

  const user = await prisma.user.findFirst({
    where: { whatsappPhone: senderPhone, whatsappVerified: true },
  });

  if (!user) {
    await sendText(
      senderPhone,
      "Hi! 👋 I don't recognise this number yet.\n\nTo use UMA on WhatsApp, open your UMA profile page and link your WhatsApp number first.",
    );
    return;
  }

  let store: PatientStore = createBlankPatientStore();
  const record = await prisma.patientRecord.findUnique({ where: { userId: user.id } });
  if (record) {
    store = parsePatientStoreJson(record.data) ?? store;
  }

  const recentMessages = await prisma.whatsAppMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
  });
  const history = recentMessages
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  await prisma.whatsAppMessage.create({
    data: { userId: user.id, waId, role: "user", content: text },
  });

  const systemPrompt = buildRetrievalContext(store);

  const reply = await callLLM(systemPrompt, history, text);

  await prisma.whatsAppMessage.create({
    data: { userId: user.id, waId, role: "assistant", content: reply },
  });

  await sendText(senderPhone, reply);
}
