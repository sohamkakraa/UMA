import { createHash } from "crypto";

/** Fingerprint uploaded PDF bytes for duplicate detection (no text extraction). */
export function hashPdfBuffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[\s,.'’_-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

export function patientNameMatches(expected: string, foundOnDocument: string[]): boolean {
  const exp = nameTokens(expected);
  if (!exp.length) return false;
  return foundOnDocument.some((f) => {
    const ft = nameTokens(f);
    if (!ft.length) return false;
    const overlap = exp.filter((t) => ft.includes(t)).length;
    if (exp.length === 1) return ft.includes(exp[0]);
    return overlap >= Math.min(2, exp.length);
  });
}

/**
 * If the profile has a name and the document lists patient names, they must align.
 * If the document lists no patient name, verification is skipped (cannot confirm).
 */
export function verifyPatientNameOnDocument(
  expectedPatientName: string,
  namesOnDocument: string[]
): { ok: boolean; skipped?: boolean } {
  const exp = expectedPatientName.trim();
  if (!exp) return { ok: true, skipped: true };
  if (!namesOnDocument.length) return { ok: true, skipped: true };
  return { ok: patientNameMatches(exp, namesOnDocument) };
}
