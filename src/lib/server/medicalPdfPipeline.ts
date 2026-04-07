import { nanoid } from "nanoid";
import { z } from "zod";
import type { DocType, ExtractedDoc, ExtractedMedication, StandardLexiconEntry } from "@/lib/types";
import { hashPdfBuffer, verifyPatientNameOnDocument } from "@/lib/extractGuards";
import { buildArtifactSlug, proposeLexiconPatches } from "@/lib/standardized";
import { applyParsedMarkdownToDoc, parseStructuredFromMarkdown } from "@/lib/parseMarkdownArtifact";

import { APIError } from "@anthropic-ai/sdk";

/**
 * Model for Messages API calls that include a PDF `document` block (base64).
 * Separate from `ANTHROPIC_MODEL` (chat) so uploads can use a stronger model while chat stays lighter.
 */
const ANTHROPIC_PDF_MODEL =
  (process.env.ANTHROPIC_PDF_MODEL ?? "claude-sonnet-4-5-20250929").trim() || "claude-sonnet-4-5-20250929";

/** Small JSON in a fenced block — avoids Anthropic structured-output limits on union/nullable schema fields. */
const PdfMetaSchema = z.object({
  is_medical_document: z.boolean(),
  type: z.enum(["Lab report", "Prescription", "Bill", "Imaging", "Other"]),
  patient_names_on_document: z.array(z.string()),
  ordering_physicians: z.array(z.string()),
  facility_name: z.string().nullable(),
  dateISO: z.string().nullable(),
  provider: z.string().nullable(),
  summary: z.string(),
  title: z.string(),
});

function sanitizePdfFilename(name: string): string {
  const n = name.trim() || "document.pdf";
  const base = n.toLowerCase().endsWith(".pdf") ? n : `${n}.pdf`;
  return base.replace(/[^\w.\-]+/g, "_").slice(0, 120) || "document.pdf";
}

function normalizeMarkdownH1(markdown: string, artifactSlug: string): string {
  const t = markdown.trimStart();
  if (/^#\s+/m.test(t)) return t.replace(/^#\s+.*$/m, `# ${artifactSlug}`);
  return `# ${artifactSlug}\n\n${t}`;
}

type LlmExtract = {
  type: DocType;
  title: string;
  dateISO?: string | null;
  provider?: string | null;
  summary: string;
  markdown_artifact: string;
  is_medical_document: boolean;
  patient_names_on_document: string[];
  ordering_physicians: string[];
  facility_name: string | null;
  medications: ExtractedMedication[];
  allergies: string[];
  conditions: string[];
  sections: { title: string; items: string[] }[];
};

function assistantTextContent(message: { content: Array<{ type: string; text?: string }> }): string {
  return message.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("");
}

/**
 * Expected shape: opening ```uma-meta\n{...json}\n``` then the markdown body.
 * If the fence is missing, we treat the whole reply as markdown and use permissive defaults (charts/lab merge stay empty).
 */
function parsePdfAgentResponse(raw: string): LlmExtract {
  const t = raw.trim();
  const fence = /^```uma-meta\s*\n([\s\S]*?)\n```\s*/;
  const m = t.match(fence);
  let markdownBody: string;
  let meta: z.infer<typeof PdfMetaSchema>;

  if (m) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(m[1].trim());
    } catch {
      throw new Error("Could not parse JSON inside the ```uma-meta block.");
    }
    const zRes = PdfMetaSchema.safeParse(parsedJson);
    if (!zRes.success) {
      throw new Error("Metadata JSON does not match the required shape (type, title, summary, flags, arrays).");
    }
    meta = zRes.data;
    markdownBody = t.slice(m[0].length).trim();
  } else {
    const h1 = /^#\s+(.+)$/m.exec(t);
    markdownBody = t;
    meta = {
      is_medical_document: true,
      type: "Other",
      patient_names_on_document: [],
      ordering_physicians: [],
      facility_name: null,
      dateISO: null,
      provider: null,
      summary: "See the markdown below.",
      title: h1 ? h1[1].trim() : "",
    };
  }

  if (!markdownBody || markdownBody.length < 24) {
    throw new Error("Model returned no markdown body after the uma-meta block.");
  }

  return {
    type: meta.type,
    title: meta.title,
    dateISO: meta.dateISO,
    provider: meta.provider,
    summary: meta.summary,
    markdown_artifact: markdownBody,
    is_medical_document: meta.is_medical_document,
    patient_names_on_document: meta.patient_names_on_document,
    ordering_physicians: meta.ordering_physicians,
    facility_name: meta.facility_name,
    medications: [],
    allergies: [],
    conditions: [],
    sections: [],
  };
}

async function extractWithAnthropicFromPdf(
  pdfBuffer: Buffer,
  fileName: string,
  typeHint: string,
  uploadISO: string
) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const safeName = sanitizePdfFilename(fileName);
  const b64 = pdfBuffer.toString("base64");

  const metaKeys = [
    "is_medical_document (boolean)",
    "type (string: Lab report | Prescription | Bill | Imaging | Other)",
    "title (string, short)",
    "dateISO (string YYYY-MM-DD or null)",
    "provider (string or null)",
    "facility_name (string or null)",
    "summary (string: ONE sentence, max ~200 characters — see SUMMARY rules below)",
    "patient_names_on_document (string[])",
    "ordering_physicians (string[])",
  ].join(", ");

  const prompt = [
    "You are UMA's medical document agent. The user attached one PDF. Read the entire document (all pages), including charts, tables, and images.",
    "Your reply MUST start with exactly one fenced code block tagged uma-meta containing a single JSON object (no markdown inside the fence except the raw JSON).",
    "Then output the full markdown record (no code fence around the whole markdown).",
    "",
    "The JSON object must include ONLY these keys: " + metaKeys + ".",
    "Use null only where noted. Use [] for empty arrays. Dates ISO YYYY-MM-DD when printed; else null.",
    "is_medical_document: true only for real clinical or medical-administrative PDFs; false otherwise.",
    "",
    "SUMMARY (field: summary) — single sentence, max ~200 characters, plain language:",
    "- First clause: what this file is (e.g. lab report from X / prescription / bill).",
    "- Second clause (after a comma or em dash): the one main impression or headline finding (abnormal labs, medication change, imaging conclusion, etc.). Not a formal diagnosis; no filler (“please discuss with your doctor”) unless the PDF itself says so.",
    "No extra sentences, no lists, no hedging paragraphs.",
    "",
    "CONTEXT FROM APP",
    `- Uploaded file name: ${fileName}`,
    `- Upload timestamp (ISO, use verbatim in the markdown metadata table): ${uploadISO}`,
    `- Type hint (may be wrong): ${typeHint || "none"}`,
    "",
    "MARKDOWN BODY (after the uma-meta fence)",
    "1. First line: # <short title, max ~80 characters>",
    "2. Blank line, then | Field | Value | table: File name; File type; Doctors; Hospital / clinic; Date of document; Date of upload (exact upload timestamp above).",
    "3. ## Overview — one short line only: copy the same meaning as the summary field (no extra sentences, no dump of raw text).",
    "4. ## Details — type-specific: lab panels with pipe tables (canonical names: HbA1c, LDL, HDL, TSH, Glucose, Creatinine, etc.); prescriptions as tables; imaging/bills/other as clear sections.",
    "5. --- then italic: _Not medical advice._",
    "Escape pipes in cells. Use — for missing cells.",
    "",
    "Rules: only facts from the PDF; supportive tone; do not invent values.",
    "",
    "Example opening (structure only):",
    "```uma-meta",
    '{"is_medical_document":true,"type":"Lab report","title":"...","dateISO":null,"provider":null,"facility_name":null,"summary":"...","patient_names_on_document":[],"ordering_physicians":[]}',
    "```",
  ].join("\n");

  const message = await client.messages.create({
    model: ANTHROPIC_PDF_MODEL,
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            title: safeName,
            citations: { enabled: true },
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: b64,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const output = assistantTextContent(message).trim();
  if (!output) throw new Error("Empty LLM response");
  return parsePdfAgentResponse(output);
}

function docTypeFromHint(typeHint: string): DocType | undefined {
  const h = typeHint.toLowerCase();
  if (h.includes("lab")) return "Lab report";
  if (h.includes("pres")) return "Prescription";
  if (h.includes("bill")) return "Bill";
  if (h.includes("imag")) return "Imaging";
  return undefined;
}

function buildTitle({
  fileName,
  type,
  dateISO,
  provider,
}: {
  fileName: string;
  type: DocType;
  dateISO?: string;
  provider?: string;
}) {
  const cleanedName = fileName.replace(/\.pdf$/i, "").trim();
  const parts = [type, provider, dateISO].filter(Boolean).join(" · ");
  if (parts) return parts;
  return cleanedName || `${type} document`;
}

export type ExtractMedicalPdfInput = {
  buffer: Buffer;
  fileName: string;
  patientName: string;
  typeHint: string;
  clientLexicon: StandardLexiconEntry[];
  existingContentHashes: string[];
  /** When true, skip patient-name verification (user confirmed mismatch on client). */
  skipPatientNameCheck?: boolean;
};

export type ExtractMedicalPdfSuccess = {
  ok: true;
  doc: ExtractedDoc;
  lexiconPatches: StandardLexiconEntry[];
  validation: { patientNameCheck: string };
};

export type ExtractMedicalPdfFailure = {
  ok: false;
  code: string;
  message: string;
  status: number;
  /** Present when code is patient_name_mismatch — lets the client show details and merge after explicit consent. */
  profileDisplayName?: string;
  namesOnDocument?: string[];
  doc?: ExtractedDoc;
  lexiconPatches?: StandardLexiconEntry[];
};

/**
 * Shared PDF → ExtractedDoc pipeline (Claude + PDF document block + citations + markdown).
 * Labs/meds/allergies/conditions are filled from `markdownArtifact` via `parseStructuredFromMarkdown` after generation.
 * Used by /api/extract and the chat records agent.
 */
export async function extractMedicalPdfFromBuffer(
  inp: ExtractMedicalPdfInput
): Promise<ExtractMedicalPdfSuccess | ExtractMedicalPdfFailure> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return {
        ok: false,
        code: "no_anthropic_key",
        message:
          "UMA reads PDFs with Anthropic Claude. Set ANTHROPIC_API_KEY in your environment to upload documents.",
        status: 503,
      };
    }

    const buf = inp.buffer;
    if (!buf || buf.length === 0) {
      return { ok: false, code: "empty_file", message: "Uploaded PDF was empty.", status: 400 };
    }

    const maxPdf = 50 * 1024 * 1024;
    if (buf.length > maxPdf) {
      return {
        ok: false,
        code: "too_large",
        message: "This PDF is larger than 50 MB. Try a smaller export or split the file.",
        status: 400,
      };
    }

    const contentHash = hashPdfBuffer(buf);
    if (inp.existingContentHashes.includes(contentHash)) {
      return {
        ok: false,
        code: "duplicate_document",
        message:
          "This PDF file matches one already in your records (same file bytes). It was not added again to avoid duplicates.",
        status: 409,
      };
    }

    const uploadISO = new Date().toISOString();
    const typeHint = inp.typeHint;
    const patientName = inp.patientName.trim();
    const clientLexicon = inp.clientLexicon;

    let llm: Awaited<ReturnType<typeof extractWithAnthropicFromPdf>>;
    try {
      llm = await extractWithAnthropicFromPdf(buf, inp.fileName, typeHint, uploadISO);
    } catch (e: unknown) {
      let detail = "";
      if (e instanceof APIError && typeof e.message === "string" && e.message.length > 0 && e.message.length < 400) {
        detail = ` ${e.message}`;
      }
      return {
        ok: false,
        code: "extract_failed",
        message: `UMA could not read this PDF with the AI service. Check your API key and try again.${detail} PDF extraction uses ANTHROPIC_PDF_MODEL (default claude-sonnet-4-5-20250929), separate from ANTHROPIC_MODEL.`,
        status: 502,
      };
    }

    const llmType = llm.type ?? docTypeFromHint(typeHint) ?? "Other";
    const autoTitle = buildTitle({
      fileName: inp.fileName,
      type: llmType,
      dateISO: llm.dateISO || undefined,
      provider: llm.provider || undefined,
    });
    const facility = llm.facility_name?.trim() || undefined;
    const provider = llm.provider?.trim() || facility || undefined;

    let summary = (llm.summary ?? "").replace(/\s+/g, " ").trim();
    if (summary.length > 220) summary = `${summary.slice(0, 217)}…`;

    const docCore = {
      type: llmType,
      title: (llm.title && llm.title.trim().length > 3 ? llm.title : autoTitle) || autoTitle,
      dateISO: llm.dateISO || undefined,
      provider,
      summary,
      medications: llm.medications?.length ? llm.medications : undefined,
      allergies: llm.allergies?.length ? llm.allergies : undefined,
      conditions: llm.conditions?.length ? llm.conditions : undefined,
      sections: llm.sections?.length ? llm.sections : undefined,
      doctors: llm.ordering_physicians?.length ? llm.ordering_physicians : undefined,
      facilityName: facility,
      patientNamesOnDoc: llm.patient_names_on_document ?? [],
    };

    if (!llm.is_medical_document) {
      return {
        ok: false,
        code: "not_medical_document",
        message:
          "This file does not look like a medical document UMA can store. Try a lab report, prescription, imaging summary, or clinic bill.",
        status: 422,
      };
    }

    const id = nanoid();
    const artifactSlug = buildArtifactSlug(docCore.type, docCore.dateISO);

    const rawMd = llm.markdown_artifact.trim();
    if (!rawMd || rawMd.length < 24) {
      return {
        ok: false,
        code: "empty_markdown",
        message:
          "The AI did not return a usable markdown record for this PDF. Try again, or set ANTHROPIC_PDF_MODEL to another Claude model that supports PDFs.",
        status: 502,
      };
    }
    const markdownArtifact = normalizeMarkdownH1(rawMd, artifactSlug);
    const parsedMd = parseStructuredFromMarkdown(markdownArtifact, docCore.dateISO, clientLexicon);
    const lexiconPatches = proposeLexiconPatches(parsedMd.rawLabNames, clientLexicon);

    const baseDoc: ExtractedDoc = {
      id,
      type: docCore.type,
      title: docCore.title,
      dateISO: docCore.dateISO,
      provider: docCore.provider,
      summary: docCore.summary,
      medications: docCore.medications,
      allergies: docCore.allergies,
      conditions: docCore.conditions,
      sections: docCore.sections,
      tags: [typeHint || docCore.type].filter(Boolean),
      originalFileName: inp.fileName,
      uploadedAtISO: uploadISO,
      contentHash,
      artifactSlug,
      doctors: docCore.doctors,
      facilityName: docCore.facilityName,
      markdownArtifact,
    };
    const doc = applyParsedMarkdownToDoc(baseDoc, parsedMd, clientLexicon);

    const nameCheck = verifyPatientNameOnDocument(patientName, docCore.patientNamesOnDoc);
    if (!nameCheck.ok && !inp.skipPatientNameCheck) {
      const profileLabel = patientName.trim() ? `"${patientName.trim()}"` : "not set on your profile";
      const listed =
        docCore.patientNamesOnDoc.length > 0
          ? docCore.patientNamesOnDoc.map((n) => `"${n.trim()}"`).join(", ")
          : "(no patient name detected on the document)";
      return {
        ok: false,
        code: "patient_name_mismatch",
        message: `Your profile name is ${profileLabel}, but this PDF lists the patient as ${listed}. If this is still your record (nickname, maiden name, or a scan for someone you care for), you can add it anyway after confirming below.`,
        status: 422,
        profileDisplayName: patientName.trim(),
        namesOnDocument: docCore.patientNamesOnDoc,
        doc,
        lexiconPatches,
      };
    }

    return {
      ok: true,
      doc,
      lexiconPatches,
      validation: {
        patientNameCheck:
          inp.skipPatientNameCheck && !nameCheck.ok
            ? "user_confirmed_mismatch"
            : nameCheck.skipped
              ? "skipped_no_name_on_document"
              : "verified_or_aligned",
      },
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Extraction failed unexpectedly.";
    return { ok: false, code: "internal_error", message: msg, status: 500 };
  }
}
