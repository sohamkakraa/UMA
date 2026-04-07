import { NextResponse } from "next/server";
import { z } from "zod";
import type { StandardLexiconEntry } from "@/lib/types";
import {
  extractMedicalPdfFromBuffer,
} from "@/lib/server/medicalPdfPipeline";

export const runtime = "nodejs";

const LexiconEntrySchema = z.object({
  canonical: z.string().min(1).max(200),
  synonyms: z.array(z.string()).max(100),
  panel: z.string().max(120).optional(),
});

function parseJsonField<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  const s = typeof raw === "string" ? raw : String(raw);
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function parseClientStandardLexicon(form: FormData): StandardLexiconEntry[] {
  const raw = parseJsonField<unknown>(form.get("standardLexicon"), []);
  const res = z.array(LexiconEntrySchema).safeParse(raw);
  return res.success ? res.data : [];
}

function parseContentHashes(form: FormData): string[] {
  const raw = parseJsonField<unknown>(form.get("existingContentHashes"), []);
  const res = z.array(z.string()).safeParse(raw);
  return res.success ? res.data : [];
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const typeHint = String(form.get("typeHint") ?? "");
    const patientName = String(form.get("patientName") ?? "").trim();
    const skipPatientNameCheck =
      String(form.get("skipPatientNameCheck") ?? "") === "1" ||
      String(form.get("skipPatientNameCheck") ?? "").toLowerCase() === "true";
    const clientLexicon = parseClientStandardLexicon(form);
    const existingContentHashes = parseContentHashes(form);

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const result = await extractMedicalPdfFromBuffer({
      buffer: buf,
      fileName: file.name,
      patientName,
      typeHint,
      clientLexicon,
      existingContentHashes,
      skipPatientNameCheck,
    });

    if (!result.ok) {
      if (result.code === "patient_name_mismatch" && result.doc) {
        return NextResponse.json(
          {
            error: result.message,
            code: result.code,
            namesOnDocument: result.namesOnDocument ?? [],
            profileDisplayName: result.profileDisplayName ?? "",
            doc: result.doc,
            lexiconPatches: result.lexiconPatches ?? [],
          },
          { status: result.status }
        );
      }
      return NextResponse.json({ error: result.message, code: result.code }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      doc: result.doc,
      lexiconPatches: result.lexiconPatches,
      validation: result.validation,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Extraction failed unexpectedly.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
