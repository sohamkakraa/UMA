/**
 * Normalize raw unit strings from labs/PDFs to consistent display forms.
 * Does not convert numeric magnitude (e.g. mmol/L → mg/dL); see labInterpret for comparisons.
 */

function squash(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, "")
    .replace(/µ/g, "u")
    .replace(/μ/g, "u");
}

/** Collapse common OCR / regional spellings to a canonical display token. */
export function normalizeLabUnitString(raw: string | undefined, _canonicalLabName?: string): string {
  if (!raw?.trim()) return "";
  const u = squash(raw.toLowerCase());

  const rules: [RegExp, string][] = [
    [/10\^6\/(cu\.?mm|cumm|ul|µl|u\.?l)/i, "M/µL"],
    [/10\^3\/(cu\.?mm|cumm|ul|µl|u\.?l)/i, "K/µL"],
    [/^mill\/(cu\.?mm|ul)$/i, "M/µL"],
    [/^thou\/(cu\.?mm|ul)$/i, "K/µL"],
    [/^(x)?10\^12\/?l$/i, "×10¹²/L"],
    [/^mg\/dl$/i, "mg/dL"],
    [/^g\/dl$/i, "g/dL"],
    [/^mmol\/l$/i, "mmol/L"],
    [/^µ?mol\/l$/i, "µmol/L"],
    [/^meq\/l$/i, "mEq/L"],
    [/^iu\/l$/i, "IU/L"],
    [/^uiu\/ml$/i, "µIU/mL"],
    [/^miu\/l$/i, "mIU/L"],
    [/^ng\/ml$/i, "ng/mL"],
    [/^pg\/ml$/i, "pg/mL"],
    [/^%$/, "%"],
    [/^\^?10\^?6\/?(cu\.?mm|ul)$/i, "M/µL"],
  ];

  for (const [re, out] of rules) {
    if (typeof out === "string") {
      if (re.test(u)) return out;
    }
  }

  // Title-case common patterns: mg/dl → mg/dL
  const t = raw.trim();
  if (/^mg\/dl$/i.test(t)) return "mg/dL";
  if (/^g\/dl$/i.test(t)) return "g/dL";
  if (/^mmol\/l$/i.test(t)) return "mmol/L";

  return raw.trim();
}
