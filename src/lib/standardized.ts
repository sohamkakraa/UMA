import type { DocType, StandardLexiconEntry } from "@/lib/types";

/** Default registry — keep in sync with `docs/standardized.md`. */
export const DEFAULT_LEXICON: StandardLexiconEntry[] = [
  { canonical: "HbA1c", synonyms: ["glycosylated hemoglobin", "hemoglobin a1c", "hba1c", "a1c"], panel: "Glucose & HbA1c" },
  { canonical: "LDL", synonyms: ["ldl cholesterol", "low density lipoprotein", "ldl-c"], panel: "Lipid Profile" },
  { canonical: "HDL", synonyms: ["hdl cholesterol", "high density lipoprotein", "hdl-c"], panel: "Lipid Profile" },
  { canonical: "Triglycerides", synonyms: ["triglyceride", "tg"], panel: "Lipid Profile" },
  { canonical: "Total Cholesterol", synonyms: ["total cholesterol", "cholesterol (total)"], panel: "Lipid Profile" },
  { canonical: "Glucose", synonyms: ["fasting glucose", "random glucose", "blood sugar", "plasma glucose"], panel: "Glucose & HbA1c" },
  { canonical: "AST", synonyms: ["aspartate aminotransferase", "sgot"], panel: "Liver Function" },
  { canonical: "ALT", synonyms: ["alanine aminotransferase", "sgpt"], panel: "Liver Function" },
  { canonical: "ALP", synonyms: ["alkaline phosphatase"], panel: "Liver Function" },
  { canonical: "GGT", synonyms: ["gamma glutamyl transferase", "ggtp"], panel: "Liver Function" },
  { canonical: "TSH", synonyms: ["thyroid stimulating hormone"], panel: "Thyroid Profile" },
  { canonical: "T3", synonyms: ["triiodothyronine", "tt3", "total t3"], panel: "Thyroid Profile" },
  { canonical: "T4", synonyms: ["thyroxine", "tt4", "total t4"], panel: "Thyroid Profile" },
  { canonical: "Creatinine", synonyms: ["serum creatinine"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Urea", synonyms: ["blood urea"], panel: "Kidney Function & Electrolytes" },
  { canonical: "BUN", synonyms: ["blood urea nitrogen"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Uric Acid", synonyms: ["uric acid", "urate"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Hemoglobin", synonyms: ["hb", "hgb", "haemoglobin"], panel: "CBC" },
  { canonical: "RBC", synonyms: ["red blood cell", "red blood cell count", "rbc count"], panel: "CBC" },
  { canonical: "WBC", synonyms: ["white blood cell", "white cell count", "wbc count", "leukocyte"], panel: "CBC" },
  { canonical: "Platelets", synonyms: ["platelet", "plt", "platelet count"], panel: "CBC" },
  { canonical: "Hematocrit", synonyms: ["hct", "packed cell volume", "pcv"], panel: "CBC" },
  { canonical: "MCV", synonyms: ["mean corpuscular volume"], panel: "CBC" },
  { canonical: "MCH", synonyms: ["mean corpuscular hemoglobin"], panel: "CBC" },
  { canonical: "MCHC", synonyms: ["mean corpuscular hemoglobin concentration"], panel: "CBC" },
  { canonical: "RDW", synonyms: ["red cell distribution width"], panel: "CBC" },
  { canonical: "Sodium", synonyms: ["na", "serum sodium"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Potassium", synonyms: ["k", "serum potassium"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Chloride", synonyms: ["cl", "serum chloride"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Calcium", synonyms: ["ca", "serum calcium"], panel: "Minerals" },
  { canonical: "Iron", synonyms: ["serum iron"], panel: "Iron Studies" },
  { canonical: "TIBC", synonyms: ["total iron binding capacity"], panel: "Iron Studies" },
  { canonical: "Transferrin", synonyms: [], panel: "Iron Studies" },
  { canonical: "Iron Saturation", synonyms: ["transferrin saturation", "% saturation", "iron saturation"], panel: "Iron Studies" },
];

export const DEFAULT_CANONICAL_KEYS = new Set(
  DEFAULT_LEXICON.map((e) => e.canonical.toLowerCase())
);

function heuristicsNormalize(name: string): string {
  const n = name.toLowerCase().trim();
  if (!n) return name;
  if (n.includes("hba1c") || n.includes("hemoglobin a1c") || n === "a1c") return "HbA1c";
  if (n === "ldl" || n.includes("ldl cholesterol")) return "LDL";
  if (n === "hdl" || n.includes("hdl cholesterol")) return "HDL";
  if (n.includes("triglycer")) return "Triglycerides";
  if (n.includes("total cholesterol")) return "Total Cholesterol";
  if (n === "cholesterol" && !n.includes("hdl") && !n.includes("ldl")) return "Cholesterol";
  if (n.includes("glucose")) return "Glucose";
  if (n.includes("aspartate") || n === "ast" || n.includes("sgot")) return "AST";
  if (n.includes("alanine") || n === "alt" || n.includes("sgpt")) return "ALT";
  if (n.includes("alkaline") || n === "alp") return "ALP";
  if (n.includes("gamma") && n.includes("transfer")) return "GGT";
  if (n === "ggt" || n === "ggtp") return "GGT";
  if (n.includes("tsh")) return "TSH";
  if (n.includes("triiodothyronine") || n === "t3" || n.includes("tt3")) return "T3";
  if (n.includes("thyroxine") || n === "t4" || n.includes("tt4")) return "T4";
  if (n.includes("creatinine")) return "Creatinine";
  if (n.includes("urea") && !n.includes("bun")) return "Urea";
  if (n.includes("bun")) return "BUN";
  if (n.includes("uric")) return "Uric Acid";
  if (n === "wbc" || n.includes("white blood cell")) return "WBC";
  if (n === "rbc" || n.includes("red blood cell")) return "RBC";
  if (n.includes("hemoglobin") || n === "hb" || n === "hgb") return "Hemoglobin";
  if (n.includes("platelet") || n === "plt") return "Platelets";
  if (n.includes("hematocrit") || n === "hct") return "Hematocrit";
  if (n.includes("mcv")) return "MCV";
  if (n.includes("mchc")) return "MCHC";
  if (n.includes("mch") && !n.includes("mchc")) return "MCH";
  if (n.includes("rdw")) return "RDW";
  if (n.includes("sodium") || n === "na") return "Sodium";
  if (n.includes("potassium") || n === "k") return "Potassium";
  if (n.includes("chloride") || n === "cl") return "Chloride";
  if (n.includes("calcium") || n === "ca") return "Calcium";
  if (n.includes("iron saturation") || n.includes("transferrin saturation")) return "Iron Saturation";
  if (n.includes("tibc")) return "TIBC";
  if (n.includes("transferrin") && !n.includes("saturation")) return "Transferrin";
  if (n.includes("iron") && !n.includes("saturation") && !n.includes("tibc")) return "Iron";
  return name.trim();
}

function allEntries(extensions: StandardLexiconEntry[] | undefined) {
  return [...DEFAULT_LEXICON, ...(extensions ?? [])];
}

export function getPanelForCanonical(canonical: string, extensions?: StandardLexiconEntry[]): string {
  for (const e of allEntries(extensions)) {
    if (e.canonical.toLowerCase() === canonical.toLowerCase()) return e.panel ?? "Other Labs";
  }
  return "Other Labs";
}

/** File-style slug prefix (see upload naming convention). */
export function docTypeToArtifactPrefix(type: DocType): string {
  const m: Record<DocType, string> = {
    "Lab report": "bloodReport",
    Prescription: "prescription",
    Bill: "bill",
    Imaging: "imaging",
    Other: "other",
  };
  return m[type] ?? "other";
}

export function formatArtifactDateParts(dateISO?: string): { dd: string; mm: string; yyyy: string } {
  const d = dateISO ? new Date(`${dateISO}T12:00:00`) : new Date();
  const base = Number.isNaN(d.getTime()) ? new Date() : d;
  return {
    dd: String(base.getDate()).padStart(2, "0"),
    mm: String(base.getMonth() + 1).padStart(2, "0"),
    yyyy: String(base.getFullYear()),
  };
}

/** Human-readable file slug: type prefix + document date only (no random id). */
export function buildArtifactSlug(type: DocType, dateISO: string | undefined): string {
  const { dd, mm, yyyy } = formatArtifactDateParts(dateISO);
  return `${docTypeToArtifactPrefix(type)}_${dd}_${mm}_${yyyy}`;
}

/** Resolve a raw test name to a canonical key using lexicon + heuristics. */
export function resolveCanonicalLabName(raw: string, extensions?: StandardLexiconEntry[]): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  const entries = allEntries(extensions);

  for (const e of entries) {
    if (e.canonical.toLowerCase() === lower) return e.canonical;
  }
  for (const e of entries) {
    for (const s of e.synonyms) {
      const sl = s.toLowerCase();
      if (lower === sl) return e.canonical;
      if (sl.length >= 4 && (lower.includes(sl) || sl.includes(lower))) return e.canonical;
    }
  }

  return heuristicsNormalize(trimmed);
}

export function canonicalKeySet(extensions?: StandardLexiconEntry[]): Set<string> {
  const s = new Set(DEFAULT_CANONICAL_KEYS);
  for (const e of extensions ?? []) {
    s.add(e.canonical.toLowerCase());
  }
  return s;
}

/** True if this lab row should count toward a trend chart for `trendMetric` (canonical or synonym). */
export function labMatchesTrendMetric(
  labName: string,
  trendMetric: string,
  extensions?: StandardLexiconEntry[]
): boolean {
  const a = resolveCanonicalLabName(labName, extensions).toLowerCase();
  const b = resolveCanonicalLabName(trendMetric, extensions).toLowerCase();
  return a.length > 0 && a === b;
}

/**
 * Propose new lexicon rows for names that resolve to a canonical not yet in the default or extension list.
 */
export function proposeLexiconPatches(
  rawNames: string[],
  extensions?: StandardLexiconEntry[]
): StandardLexiconEntry[] {
  const known = canonicalKeySet(extensions);
  const patches: StandardLexiconEntry[] = [];
  const seen = new Set<string>();

  for (const raw of rawNames) {
    const r = raw.trim();
    if (r.length < 2) continue;
    const canonical = resolveCanonicalLabName(r, extensions);
    const key = canonical.toLowerCase();
    if (known.has(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    patches.push({
      canonical,
      synonyms: r.toLowerCase() !== canonical.toLowerCase() ? [r] : [],
      panel: "Other Labs",
    });
    known.add(key);
  }
  return patches;
}

export function mergeLexiconPatches(
  existing: StandardLexiconEntry[] | undefined,
  patches: StandardLexiconEntry[]
): StandardLexiconEntry[] {
  const map = new Map<string, StandardLexiconEntry>();
  for (const e of existing ?? []) {
    map.set(e.canonical.toLowerCase(), { ...e, synonyms: [...e.synonyms] });
  }
  for (const p of patches) {
    const k = p.canonical.toLowerCase();
    const cur = map.get(k);
    if (!cur) {
      map.set(k, { ...p, synonyms: [...p.synonyms] });
    } else {
      const syn = new Set([...cur.synonyms, ...p.synonyms, p.canonical]);
      map.set(k, {
        ...cur,
        synonyms: Array.from(syn).filter((s) => s.toLowerCase() !== k),
        panel: cur.panel ?? p.panel,
      });
    }
  }
  return Array.from(map.values());
}
