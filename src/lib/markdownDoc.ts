import type { ExtractedDoc, StandardLexiconEntry } from "@/lib/types";
import { buildDocumentMarkdown } from "@/lib/documentMarkdown";

/** Pull the ## Overview section from agent-generated markdown (source of truth for display when present). */
export function parseOverviewSection(markdown: string): string | null {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const match = normalized.match(/^##\s+Overview\s*\n([\s\S]*?)(?=^##\s[^\n#]|\n##\s|$)/m);
  if (!match) return null;
  const body = match[1].trim();
  return body.length ? body : null;
}

/** Prefer overview from markdown; fall back to stored summary. */
export function displaySummaryForDoc(doc: Pick<ExtractedDoc, "summary" | "markdownArtifact">): string {
  if (doc.markdownArtifact) {
    const fromMd = parseOverviewSection(doc.markdownArtifact);
    if (fromMd) {
      const oneLine = fromMd.replace(/\s+/g, " ").trim();
      return oneLine.length > 280 ? `${oneLine.slice(0, 277)}…` : oneLine;
    }
  }
  const s = (doc.summary ?? "").replace(/\s+/g, " ").trim();
  return s.length > 280 ? `${s.slice(0, 277)}…` : s;
}

/** Legacy / offline-friendly export when no agent markdown was stored. */
export function buildSyntheticMarkdownArtifact(
  doc: ExtractedDoc,
  meta: { originalFileName: string; uploadedAtISO: string },
  extensions?: StandardLexiconEntry[]
): string {
  return buildDocumentMarkdown(doc, meta, extensions);
}
