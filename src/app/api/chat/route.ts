import { NextResponse } from "next/server";
import { z } from "zod";
import type { ExtractedDoc, PatientStore, StandardLexiconEntry } from "@/lib/types";
import { extractMedicalPdfFromBuffer } from "@/lib/server/medicalPdfPipeline";

export const runtime = "nodejs";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const AttachmentSchema = z.object({
  fileName: z.string().min(1).max(240),
  mimeType: z.string(),
  dataBase64: z
    .string()
    .min(1)
    .refine((s) => s.length < 18_000_000, "Attachment is too large for chat (max ~12 MB file)."),
});

const BodySchema = z.object({
  question: z.string(),
  store: z.any(),
  messages: z.array(ChatMessageSchema).max(48).optional().default([]),
  attachments: z.array(AttachmentSchema).max(2).optional().default([]),
  /** Second request after user confirms a patient-name mismatch; re-runs extraction without the name gate. */
  skipPatientNameCheck: z.boolean().optional(),
});

type ChatMsg = z.infer<typeof ChatMessageSchema>;

function buildRetrievalContext(store: PatientStore): string {
  const p = store.profile;
  const lines: string[] = [
    "You are the **conversation agent** for UMA (Ur Medical Assistant). A parallel **records agent** may extract data from PDFs the user attaches; you will see a short note about its result appended to your context after you reply is generated — for your first reply, assume extraction may be in progress and speak only from stored records plus the user's words.",
    "You are NOT a doctor. Never diagnose. Use plain language. One focused idea per reply when possible.",
    "Answer from the patient context below. If something is missing, say so.",
    "",
    "=== PATIENT PROFILE ===",
    `Name: ${p.name || "Unknown"}`,
    `DOB: ${p.dob || "Not provided"}`,
    `Sex: ${p.sex || "Not provided"}`,
    `Primary care: ${p.primaryCareProvider || "Not provided"}`,
    `Next visit: ${p.nextVisitDate || "Not scheduled"}`,
    `Conditions: ${p.conditions?.join(", ") || "None recorded"}`,
    `Allergies: ${p.allergies?.join(", ") || "None recorded"}`,
    "",
  ];

  if (store.meds?.length) {
    lines.push("=== MEDICATIONS (merged list) ===");
    store.meds.slice(0, 35).forEach((m) => {
      lines.push(
        `• ${[m.name, m.dose, m.frequency].filter(Boolean).join(" — ")}${m.startDate ? ` (from ${m.startDate})` : ""}`
      );
    });
    lines.push("");
  }

  if (store.labs?.length) {
    lines.push("=== LAB VALUES (deduped timeline, recent first) ===");
    const sorted = [...store.labs].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    sorted.slice(0, 80).forEach((l) => {
      lines.push(
        `• ${l.name}: ${l.value}${l.unit ? ` ${l.unit}` : ""}${l.refRange ? ` (ref ${l.refRange})` : ""}${l.date ? ` @ ${l.date}` : ""}`
      );
    });
    lines.push("");
  }

  if (store.docs?.length) {
    lines.push("=== SAVED DOCUMENTS (titles + summaries + markdown excerpts for retrieval) ===");
    store.docs.slice(0, 28).forEach((d) => {
      lines.push(
        `---\n[${d.type}] ${d.title}${d.dateISO ? ` · ${d.dateISO}` : ""}${d.provider ? ` · ${d.provider}` : ""}\nSummary: ${d.summary}`
      );
      if (d.markdownArtifact) {
        const excerpt = d.markdownArtifact.replace(/\s+/g, " ").trim().slice(0, 1400);
        lines.push(`Markdown excerpt: ${excerpt}${d.markdownArtifact.length > 1400 ? "…" : ""}`);
      }
    });
    lines.push("");
  }

  if (store.standardLexicon?.length) {
    lines.push("=== CUSTOM LAB LABELS (synonyms → canonical) ===");
    store.standardLexicon.slice(0, 40).forEach((e) => {
      lines.push(`• ${e.canonical}: ${e.synonyms.join(", ")}`);
    });
    lines.push("");
  }

  lines.push(
    "If the user asks to add a document to the dashboard or website, tell them they can use **Add to records** after you confirm what was found (the app will show that button when extraction succeeds)."
  );

  return lines.join("\n");
}

function trimHistoryForLlm(history: ChatMsg[]): ChatMsg[] {
  const slice = history.slice(-24).map((m) => ({ role: m.role, content: m.content }));
  let start = 0;
  while (start < slice.length && slice[start].role === "assistant") start += 1;
  return slice.slice(start);
}

async function conversationAgentLLM(
  userContent: string,
  store: PatientStore,
  history: ChatMsg[]
): Promise<string> {
  const systemPrompt = buildRetrievalContext(store);

  const trimmedHistory = trimHistoryForLlm(history);

  if (process.env.ANTHROPIC_API_KEY) {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 900,
      system: systemPrompt,
      messages: [...trimmedHistory, { role: "user", content: userContent }],
    });
    const block = msg.content[0];
    if (block.type === "text") return block.text;
    throw new Error("Unexpected Claude response type");
  }

  if (process.env.OPENAI_API_KEY) {
    const OpenAI = (await import("openai")).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userContent },
      ],
    });
    return completion.choices[0]?.message?.content ?? "I couldn't generate a response.";
  }

  throw new Error("no_llm");
}

function answerFromStore(q: string, store: PatientStore): string {
  const t = q.toLowerCase();

  if (/(med|medication|prescript|pill|dose)/i.test(t)) {
    if (!store.meds.length) return "I don't see any medications stored yet. Upload a prescription PDF or add them on the dashboard.";
    const list = store.meds.slice(0, 12).map((m) => {
      const bits = [m.name, m.dose, m.frequency].filter(Boolean);
      return `• ${bits.join(" — ")}`;
    });
    return `Here are your current stored medications:\n${list.join("\n")}`;
  }

  if (/(lab|result|hba1c|ldl|hdl|cholesterol|glucose|cbc|wbc|rbc|plate)/i.test(t)) {
    if (!store.labs.length) return "I don't see lab results stored yet. Upload a lab report or chat with a PDF attached.";
    const key = /(hba1c|ldl|hdl|glucose|cholesterol|triglycerides)/i.exec(t)?.[1];
    const labs = key
      ? store.labs.filter((l) => l.name.toLowerCase().includes(key.toLowerCase()))
      : store.labs;
    if (!labs.length) return `I don't see any stored lab entries matching "${key}".`;
    const recent = [...labs]
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, 10)
      .map((l) => `• ${l.name}: ${l.value}${l.unit ? ` ${l.unit}` : ""}${l.date ? ` (${l.date})` : ""}`);
    return `Here are the most relevant stored lab results:\n${recent.join("\n")}`;
  }

  if (/(doc|report|timeline|history|visit|imaging|bill|invoice|provider|date)/i.test(t)) {
    if (!store.docs.length) return "No documents stored yet. Upload a PDF from the dashboard or attach one in chat.";
    const recent = store.docs.slice(0, 8).map((d) => `• ${d.type}: ${d.title}${d.dateISO ? ` — ${d.dateISO}` : ""}`);
    return `Here are your most recent stored documents:\n${recent.join("\n")}`;
  }

  if (/(allerg)/i.test(t)) {
    if (!store.profile?.allergies?.length) return "I don't see any allergies recorded yet.";
    return `Allergies on file:\n${store.profile.allergies.map((a) => `• ${a}`).join("\n")}`;
  }
  if (/(condition|diagnos)/i.test(t)) {
    if (!store.profile?.conditions?.length) return "I don't see any conditions recorded yet.";
    return `Conditions on file:\n${store.profile.conditions.map((c) => `• ${c}`).join("\n")}`;
  }

  return "I can help with your saved medications, labs, and documents. Try asking about a specific test or upload a PDF in this chat.";
}

function userAskedToMergeRecords(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return (
    /add (this|it|the file|the report)?\s*(to )?(my )?(records|dashboard|uma|health|profile|page|website)/i.test(q) ||
    /save (this|it|the file)?\s*(to )?(my )?(records|dashboard)/i.test(q) ||
    /put (this|it) on (the )?(dashboard|website|page|site)/i.test(q) ||
    /include (this|it) in (my )?(records|dashboard)/i.test(q) ||
    /^please (add|save|upload)\b/i.test(q)
  );
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const store = body.store as PatientStore;
    const question = body.question.trim();
    const history = body.messages ?? [];
    const attachments = body.attachments ?? [];

    const pdfAttachment = attachments.find((a) => a.mimeType === "application/pdf");
    let userContent = question;
    if (pdfAttachment) {
      userContent = `[Attachment: PDF file "${pdfAttachment.fileName}"]\n\n${question || "The user sent a PDF. Summarize what you can from existing records and say the records agent is processing the file in parallel."}`;
    }

    const existingHashes = (store.docs ?? [])
      .map((d) => d.contentHash)
      .filter((h): h is string => typeof h === "string" && h.length > 0);

    const recordsPromise =
      pdfAttachment && process.env.ANTHROPIC_API_KEY
        ? extractMedicalPdfFromBuffer({
            buffer: Buffer.from(pdfAttachment.dataBase64, "base64"),
            fileName: pdfAttachment.fileName,
            patientName: store.profile?.name?.trim() ?? "",
            typeHint: "",
            clientLexicon: store.standardLexicon ?? [],
            existingContentHashes: existingHashes,
            skipPatientNameCheck: body.skipPatientNameCheck === true,
          })
        : Promise.resolve(null as Awaited<ReturnType<typeof extractMedicalPdfFromBuffer>> | null);

    const conversationPromise = (async () => {
      try {
        return await conversationAgentLLM(userContent, store, history);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === "no_llm") {
          return answerFromStore(question || userContent, store);
        }
        return (
          "I had trouble reaching the AI service. Here's something from your saved records:\n\n" +
          answerFromStore(question || userContent, store)
        );
      }
    })();

    const [recordsResult, convAnswer] = await Promise.all([recordsPromise, conversationPromise]);

    let answer = convAnswer;
    let mergeProposal:
      | {
          doc: ExtractedDoc;
          lexiconPatches: StandardLexiconEntry[];
          nameMismatch?: { namesOnDocument: string[]; profileDisplayName: string };
        }
      | undefined;

    if (recordsResult) {
      if (recordsResult.ok) {
        answer += `\n\n---\n**Records agent (parallel):** I extracted **${pdfAttachment?.fileName ?? "your PDF"}** — ${recordsResult.doc.summary}`;
        mergeProposal = {
          doc: recordsResult.doc,
          lexiconPatches: recordsResult.lexiconPatches,
        };
        const hinted = userAskedToMergeRecords(question);
        answer += hinted
          ? `\n\nI'll add this to your records when you confirm below.`
          : `\n\nTap **Add to records** below to save this to your dashboard, charts, and document list.`;
      } else if (recordsResult.code === "patient_name_mismatch" && recordsResult.doc) {
        answer += `\n\n---\n**Records agent (parallel):** ${recordsResult.message}`;
        answer += `\n\nReview the summary card below. If you still want this file in your records, tap **Add to records** and confirm.`;
        mergeProposal = {
          doc: recordsResult.doc,
          lexiconPatches: recordsResult.lexiconPatches ?? [],
          nameMismatch: {
            namesOnDocument: recordsResult.namesOnDocument ?? [],
            profileDisplayName: recordsResult.profileDisplayName ?? "",
          },
        };
      } else {
        answer += `\n\n---\n**Records agent (parallel):** I could not add this file (${recordsResult.code}). ${recordsResult.message}`;
      }
    }

    return NextResponse.json({
      ok: true,
      answer,
      mergeProposal,
      recordsAgent: recordsResult
        ? recordsResult.ok
          ? { status: "ok" as const, title: recordsResult.doc.title }
          : { status: "error" as const, code: recordsResult.code, message: recordsResult.message }
        : { status: "skipped" as const },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Chat error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
