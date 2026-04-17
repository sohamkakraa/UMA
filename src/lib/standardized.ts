import type { DocType, StandardLexiconEntry } from "@/lib/types";

/** Default registry — keep in sync with `docs/standardized.md`. */
export const DEFAULT_LEXICON: StandardLexiconEntry[] = [
  // ── Glucose & HbA1c ──────────────────────────────────────────
  { canonical: "HbA1c", synonyms: ["glycosylated hemoglobin", "hemoglobin a1c", "hba1c", "a1c"], panel: "Glucose & HbA1c" },
  { canonical: "Glucose", synonyms: ["fasting glucose", "random glucose", "blood sugar", "plasma glucose", "fasting blood sugar", "fbs"], panel: "Glucose & HbA1c" },
  { canonical: "Average Blood Glucose", synonyms: ["estimated average glucose", "eag", "mean blood glucose"], panel: "Glucose & HbA1c" },

  // ── Lipid Profile ────────────────────────────────────────────
  // IMPORTANT: Non-HDL, VLDL, and ratio entries MUST come before HDL/LDL
  // so that exact/synonym matching catches them first and the substring
  // matcher in resolveCanonicalLabName never misclassifies them.
  { canonical: "Non-HDL Cholesterol", synonyms: ["non hdl cholesterol", "non-hdl cholesterol", "non hdl", "non-hdl", "cholesterol non-hdl", "cholesterol non hdl"], panel: "Lipid Profile" },
  { canonical: "VLDL", synonyms: ["vldl cholesterol", "very low density lipoprotein", "vldl-c", "cholesterol vldl", "cholesterol-vldl"], panel: "Lipid Profile" },
  { canonical: "Total Cholesterol:HDL Ratio", synonyms: ["cholesterol : hdl", "cholesterol:hdl", "cholesterol / hdl", "tc:hdl ratio", "tc/hdl ratio", "tc:hdl", "cholesterol:hdl ratio", "chol/hdl ratio", "total cholesterol / hdl cholesterol", "chol : hdl ratio"], panel: "Lipid Profile" },
  { canonical: "LDL:HDL Ratio", synonyms: ["ldl : hdl ratio", "ldl:hdl ratio", "ldl/hdl ratio", "ldl : hdl", "ldl:hdl", "ldl / hdl ratio", "ldl cholesterol / hdl cholesterol"], panel: "Lipid Profile" },
  { canonical: "LDL", synonyms: ["ldl cholesterol", "low density lipoprotein", "ldl-c", "ldl cholesterol (direct)", "ldl direct", "cholesterol ldl", "cholesterol-ldl", "cholesterol - ldl"], panel: "Lipid Profile" },
  { canonical: "HDL", synonyms: ["hdl cholesterol", "high density lipoprotein", "hdl-c", "cholesterol - hdl", "hdl cholesterol (direct)", "hdl direct", "cholesterol hdl", "cholesterol-hdl"], panel: "Lipid Profile" },
  { canonical: "Triglycerides", synonyms: ["triglyceride", "tg", "serum triglycerides", "triglycerides serum"], panel: "Lipid Profile" },
  { canonical: "Total Cholesterol", synonyms: ["total cholesterol", "cholesterol (total)", "serum cholesterol", "cholesterol total", "cholesterol serum"], panel: "Lipid Profile" },

  // ── Liver Function ───────────────────────────────────────────
  { canonical: "AST", synonyms: ["aspartate aminotransferase", "sgot", "ast (sgot)"], panel: "Liver Function" },
  { canonical: "ALT", synonyms: ["alanine aminotransferase", "sgpt", "alt (sgpt)"], panel: "Liver Function" },
  { canonical: "ALP", synonyms: ["alkaline phosphatase"], panel: "Liver Function" },
  { canonical: "GGT", synonyms: ["gamma glutamyl transferase", "ggtp", "gamma gt"], panel: "Liver Function" },
  { canonical: "Total Bilirubin", synonyms: ["bilirubin total", "bilirubin (total)", "total bilirubin", "serum bilirubin", "bilirubin - total"], panel: "Liver Function" },
  { canonical: "Direct Bilirubin", synonyms: ["bilirubin direct", "bilirubin (direct)", "conjugated bilirubin", "bilirubin - direct"], panel: "Liver Function" },
  { canonical: "Indirect Bilirubin", synonyms: ["bilirubin indirect", "bilirubin (indirect)", "unconjugated bilirubin", "bilirubin - indirect"], panel: "Liver Function" },
  { canonical: "Total Protein", synonyms: ["total protein", "serum total protein", "protein total", "protein - total"], panel: "Liver Function" },
  { canonical: "Albumin", synonyms: ["serum albumin"], panel: "Liver Function" },
  { canonical: "Globulin", synonyms: ["serum globulin"], panel: "Liver Function" },
  { canonical: "A/G Ratio", synonyms: ["albumin/globulin ratio", "a:g ratio", "a/g ratio", "albumin globulin ratio", "ag ratio"], panel: "Liver Function" },

  // ── Thyroid Profile ──────────────────────────────────────────
  { canonical: "TSH", synonyms: ["thyroid stimulating hormone", "tsh ultrasensitive"], panel: "Thyroid Profile" },
  { canonical: "T3", synonyms: ["triiodothyronine", "tt3", "total t3"], panel: "Thyroid Profile" },
  { canonical: "T4", synonyms: ["thyroxine", "tt4", "total t4"], panel: "Thyroid Profile" },
  { canonical: "Free T3", synonyms: ["ft3", "free triiodothyronine"], panel: "Thyroid Profile" },
  { canonical: "Free T4", synonyms: ["ft4", "free thyroxine"], panel: "Thyroid Profile" },

  // ── Kidney Function & Electrolytes ───────────────────────────
  { canonical: "Creatinine", synonyms: ["serum creatinine"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Urea", synonyms: ["blood urea"], panel: "Kidney Function & Electrolytes" },
  { canonical: "BUN", synonyms: ["blood urea nitrogen", "bun/urea"], panel: "Kidney Function & Electrolytes" },
  { canonical: "BUN/Creatinine Ratio", synonyms: ["bun creatinine ratio", "bun:creatinine", "bun / creatinine"], panel: "Kidney Function & Electrolytes" },
  { canonical: "eGFR", synonyms: ["estimated gfr", "glomerular filtration rate", "egfr", "gfr"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Uric Acid", synonyms: ["uric acid", "urate", "serum uric acid"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Sodium", synonyms: ["na", "serum sodium"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Potassium", synonyms: ["k", "serum potassium"], panel: "Kidney Function & Electrolytes" },
  { canonical: "Chloride", synonyms: ["cl", "serum chloride"], panel: "Kidney Function & Electrolytes" },

  // ── CBC ───────────────────────────────────────────────────────
  { canonical: "Hemoglobin", synonyms: ["hb", "hgb", "haemoglobin"], panel: "CBC" },
  { canonical: "RBC", synonyms: ["red blood cell", "red blood cell count", "rbc count"], panel: "CBC" },
  { canonical: "WBC", synonyms: ["white blood cell", "white cell count", "wbc count", "leukocyte", "total leucocyte count", "tlc"], panel: "CBC" },
  { canonical: "Platelets", synonyms: ["platelet", "plt", "platelet count"], panel: "CBC" },
  { canonical: "Hematocrit", synonyms: ["hct", "packed cell volume", "pcv"], panel: "CBC" },
  { canonical: "MCV", synonyms: ["mean corpuscular volume"], panel: "CBC" },
  { canonical: "MCH", synonyms: ["mean corpuscular hemoglobin"], panel: "CBC" },
  { canonical: "MCHC", synonyms: ["mean corpuscular hemoglobin concentration"], panel: "CBC" },
  { canonical: "RDW", synonyms: ["red cell distribution width", "rdw-cv"], panel: "CBC" },
  { canonical: "MPV", synonyms: ["mean platelet volume"], panel: "CBC" },
  { canonical: "Neutrophils", synonyms: ["neutrophil", "neutrophil count", "neutrophils %", "neutrophils (absolute)"], panel: "CBC" },
  { canonical: "Lymphocytes", synonyms: ["lymphocyte", "lymphocyte count", "lymphocytes %", "lymphocytes (absolute)"], panel: "CBC" },
  { canonical: "Monocytes", synonyms: ["monocyte", "monocyte count", "monocytes %", "monocytes (absolute)"], panel: "CBC" },
  { canonical: "Eosinophils", synonyms: ["eosinophil", "eosinophil count", "eosinophils %", "eosinophils (absolute)"], panel: "CBC" },
  { canonical: "Basophils", synonyms: ["basophil", "basophil count", "basophils %", "basophils (absolute)"], panel: "CBC" },
  { canonical: "ESR", synonyms: ["erythrocyte sedimentation rate", "esr westergren"], panel: "CBC" },

  // ── Minerals ─────────────────────────────────────────────────
  { canonical: "Calcium", synonyms: ["ca", "serum calcium"], panel: "Minerals" },
  { canonical: "Phosphorus", synonyms: ["phosphate", "serum phosphorus", "inorganic phosphorus"], panel: "Minerals" },
  { canonical: "Magnesium", synonyms: ["serum magnesium", "mg (mineral)"], panel: "Minerals" },

  // ── Iron Studies ─────────────────────────────────────────────
  { canonical: "Iron", synonyms: ["serum iron"], panel: "Iron Studies" },
  { canonical: "TIBC", synonyms: ["total iron binding capacity"], panel: "Iron Studies" },
  { canonical: "UIBC", synonyms: ["unsaturated iron binding capacity"], panel: "Iron Studies" },
  { canonical: "Transferrin", synonyms: [], panel: "Iron Studies" },
  { canonical: "Iron Saturation", synonyms: ["transferrin saturation", "% saturation", "iron saturation"], panel: "Iron Studies" },
  { canonical: "Ferritin", synonyms: ["serum ferritin"], panel: "Iron Studies" },

  // ── Vitamins ─────────────────────────────────────────────────
  { canonical: "Vitamin D", synonyms: ["25-hydroxy vitamin d", "25-oh vitamin d", "vitamin d total", "vitamin d (25-oh)", "25 hydroxy cholecalciferol"], panel: "Vitamins" },
  { canonical: "Vitamin B12", synonyms: ["cobalamin", "cyanocobalamin", "b12"], panel: "Vitamins" },
  { canonical: "Folate", synonyms: ["folic acid", "serum folate"], panel: "Vitamins" },

  // ── Cardiac ──────────────────────────────────────────────────
  { canonical: "hs-CRP", synonyms: ["high sensitivity crp", "high sensitivity c-reactive protein", "hs crp", "hscrp", "c-reactive protein (quantitative)"], panel: "Cardiac" },
  { canonical: "CRP", synonyms: ["c-reactive protein", "c reactive protein"], panel: "Cardiac" },
  { canonical: "Homocysteine", synonyms: ["serum homocysteine"], panel: "Cardiac" },
  { canonical: "Lipoprotein(a)", synonyms: ["lp(a)", "lipoprotein a", "lpa"], panel: "Cardiac" },
  { canonical: "Apolipoprotein B", synonyms: ["apo b", "apolipoprotein-b", "apob"], panel: "Cardiac" },
  { canonical: "Apolipoprotein A1", synonyms: ["apo a1", "apolipoprotein-a1", "apoa1"], panel: "Cardiac" },

  // ── Pancreas ─────────────────────────────────────────────────
  { canonical: "Lipase", synonyms: ["serum lipase"], panel: "Pancreas" },
  { canonical: "Amylase", synonyms: ["serum amylase"], panel: "Pancreas" },

  // ── Urine ────────────────────────────────────────────────────
  { canonical: "Urine pH", synonyms: ["urine ph", "ph (urine)"], panel: "Urine" },
  { canonical: "Urine Specific Gravity", synonyms: ["specific gravity (urine)", "urine specific gravity", "sp. gravity"], panel: "Urine" },
  { canonical: "Urine Protein", synonyms: ["protein (urine)", "urine protein"], panel: "Urine" },
  { canonical: "Urine Glucose", synonyms: ["glucose (urine)", "urine glucose", "urine sugar"], panel: "Urine" },
];

export const DEFAULT_CANONICAL_KEYS = new Set(
  DEFAULT_LEXICON.map((e) => e.canonical.toLowerCase())
);

function heuristicsNormalize(name: string): string {
  const n = name.toLowerCase().trim();
  if (!n) return name;

  // ── Glucose & HbA1c ──────────────────────────────────────────
  if (n.includes("hba1c") || n.includes("hemoglobin a1c") || n === "a1c") return "HbA1c";
  if (/average.*blood.*glucose|estimated.*average.*glucose|^eag$/i.test(n)) return "Average Blood Glucose";
  if (n.includes("glucose") && !n.includes("urine")) return "Glucose";

  // ── Lipid Profile ────────────────────────────────────────────
  // CRITICAL: match compound/ratio terms BEFORE simple HDL/LDL to
  // prevent "Non HDL Cholesterol" → "HDL" misclassification.
  if (/non[\s\-]?hdl/i.test(n)) return "Non-HDL Cholesterol";
  if (/vldl/i.test(n)) return "VLDL";
  if (/ldl\s*[:/]\s*hdl|ldl\s*hdl\s*ratio/i.test(n)) return "LDL:HDL Ratio";
  // NOTE: only colon (:) and slash (/) indicate ratios. A dash (-) means
  // "Cholesterol - HDL" = HDL Cholesterol (category–subcategory notation).
  if (/cholesterol\s*[:/]\s*hdl|tc\s*[:/]\s*hdl|total\s*cholesterol\s*[:/]\s*hdl/i.test(n)) return "Total Cholesterol:HDL Ratio";
  if (n.includes("total cholesterol") || /cholesterol\s*\(?\s*total\s*\)?/.test(n)) return "Total Cholesterol";
  if (n.includes("triglycer")) return "Triglycerides";
  // "LDL" / "LDL Cholesterol" / "Cholesterol-LDL" — NOT if already matched as ratio/non-hdl
  if (/^ldl\b|ldl[\s\-]?cholesterol|cholesterol[\s\-]?ldl|ldl[\s\-]?c\b|low\s*density/i.test(n)) return "LDL";
  // "HDL" / "HDL Cholesterol" / "Cholesterol-HDL"
  if (/^hdl\b|hdl[\s\-]?cholesterol|cholesterol[\s\-]?hdl|hdl[\s\-]?c\b|high\s*density/i.test(n)) return "HDL";
  if (n === "cholesterol") return "Total Cholesterol";

  // ── Liver Function ───────────────────────────────────────────
  if (n.includes("aspartate") || n === "ast" || n.includes("sgot")) return "AST";
  if (n.includes("alanine") || n === "alt" || n.includes("sgpt")) return "ALT";
  if (n.includes("alkaline") || n === "alp") return "ALP";
  if (n.includes("gamma") && n.includes("transfer")) return "GGT";
  if (n === "ggt" || n === "ggtp") return "GGT";
  if (/direct\s*bilirubin|bilirubin.*direct|conjugated\s*bilirubin/i.test(n)) return "Direct Bilirubin";
  if (/indirect\s*bilirubin|bilirubin.*indirect|unconjugated\s*bilirubin/i.test(n)) return "Indirect Bilirubin";
  if (/total\s*bilirubin|bilirubin.*total|serum\s*bilirubin/i.test(n)) return "Total Bilirubin";
  if (n === "bilirubin") return "Total Bilirubin";
  if (/a\s*[:/]\s*g\s*ratio|albumin.*globulin\s*ratio/i.test(n)) return "A/G Ratio";
  if (n.includes("albumin") && !n.includes("globulin")) return "Albumin";
  if (n.includes("globulin") && !n.includes("albumin")) return "Globulin";
  if (/total\s*protein/i.test(n)) return "Total Protein";

  // ── Thyroid Profile ──────────────────────────────────────────
  if (n.includes("tsh")) return "TSH";
  if (/free\s*t3|ft3|free\s*triiodo/i.test(n)) return "Free T3";
  if (/free\s*t4|ft4|free\s*thyrox/i.test(n)) return "Free T4";
  if (n.includes("triiodothyronine") || n === "t3" || n.includes("tt3")) return "T3";
  if (n.includes("thyroxine") || n === "t4" || n.includes("tt4")) return "T4";

  // ── Kidney Function ──────────────────────────────────────────
  if (/bun\s*[:/]\s*creatinine|bun\s*creatinine\s*ratio/i.test(n)) return "BUN/Creatinine Ratio";
  if (/creatinine/i.test(n) && !n.includes("bun")) return "Creatinine";
  if (n.includes("bun") || n.includes("blood urea nitrogen")) return "BUN";
  if (n.includes("urea")) return "Urea";
  if (/egfr|glomerular\s*filtration/i.test(n)) return "eGFR";
  if (n.includes("uric")) return "Uric Acid";

  // ── CBC ───────────────────────────────────────────────────────
  if (n === "wbc" || n.includes("white blood cell") || n.includes("total leucocyte") || n === "tlc") return "WBC";
  if (n === "rbc" || n.includes("red blood cell")) return "RBC";
  if (n.includes("hemoglobin") || n === "hb" || n === "hgb" || n === "haemoglobin") return "Hemoglobin";
  if (n.includes("platelet") || n === "plt") return "Platelets";
  if (n.includes("hematocrit") || n === "hct" || n.includes("packed cell") || n === "pcv") return "Hematocrit";
  if (n.includes("mcv") || n.includes("mean corpuscular volume")) return "MCV";
  if (n.includes("mchc") || n.includes("mean corpuscular hemoglobin concentration")) return "MCHC";
  if (n.includes("mch") && !n.includes("mchc")) return "MCH";
  if (n.includes("rdw")) return "RDW";
  if (n.includes("mpv") || n.includes("mean platelet volume")) return "MPV";
  if (n.includes("neutrophil")) return "Neutrophils";
  if (n.includes("lymphocyte")) return "Lymphocytes";
  if (n.includes("monocyte")) return "Monocytes";
  if (n.includes("eosinophil")) return "Eosinophils";
  if (n.includes("basophil")) return "Basophils";
  if (/^esr\b|erythrocyte\s*sedimentation/i.test(n)) return "ESR";

  // ── Electrolytes / Minerals ──────────────────────────────────
  if (n.includes("sodium") || n === "na") return "Sodium";
  if (n.includes("potassium") || n === "k") return "Potassium";
  if (n.includes("chloride") || n === "cl") return "Chloride";
  if (n.includes("calcium") || n === "ca") return "Calcium";
  if (n.includes("phosph")) return "Phosphorus";
  if (n.includes("magnesium")) return "Magnesium";

  // ── Iron Studies ─────────────────────────────────────────────
  if (n.includes("iron saturation") || n.includes("transferrin saturation")) return "Iron Saturation";
  if (n.includes("ferritin")) return "Ferritin";
  if (n.includes("tibc")) return "TIBC";
  if (n.includes("uibc")) return "UIBC";
  if (n.includes("transferrin") && !n.includes("saturation")) return "Transferrin";
  if (n.includes("iron") && !n.includes("saturation") && !n.includes("tibc") && !n.includes("uibc")) return "Iron";

  // ── Vitamins ─────────────────────────────────────────────────
  if (/vitamin\s*d|25.*hydroxy|cholecalciferol/i.test(n)) return "Vitamin D";
  if (/vitamin\s*b\s*12|cobalamin|cyanocobalamin|^b12$/i.test(n)) return "Vitamin B12";
  if (/folate|folic\s*acid/i.test(n)) return "Folate";

  // ── Cardiac ──────────────────────────────────────────────────
  if (/hs[\s\-]?crp|high\s*sensitivity.*c[\s\-]?reactive/i.test(n)) return "hs-CRP";
  if (/c[\s\-]?reactive\s*protein|^crp$/i.test(n)) return "CRP";
  if (n.includes("homocysteine")) return "Homocysteine";
  if (/lipoprotein\s*\(?\s*a\s*\)?|^lp\s*\(\s*a\s*\)$/i.test(n)) return "Lipoprotein(a)";
  if (/apolipoprotein\s*b|^apo\s*b$/i.test(n)) return "Apolipoprotein B";
  if (/apolipoprotein\s*a|^apo\s*a1$/i.test(n)) return "Apolipoprotein A1";

  // ── Pancreas ─────────────────────────────────────────────────
  if (n.includes("lipase")) return "Lipase";
  if (n.includes("amylase")) return "Amylase";

  // ── Urine ────────────────────────────────────────────────────
  if (/urine.*ph|ph.*urine/i.test(n)) return "Urine pH";
  if (/specific\s*gravity|sp\.\s*gravity/i.test(n) && n.includes("urine")) return "Urine Specific Gravity";
  if (/urine.*protein|protein.*urine/i.test(n)) return "Urine Protein";
  if (/urine.*glucose|urine.*sugar/i.test(n)) return "Urine Glucose";

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
function toWordBag(s: string): Set<string> {
  return new Set(
    s.replace(/[()[\]:,\-–—\/]/g, " ")
      .split(/\s+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0)
  );
}

function wordBagsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const w of a) if (!b.has(w)) return false;
  return true;
}

export function resolveCanonicalLabName(raw: string, extensions?: StandardLexiconEntry[]): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  const entries = allEntries(extensions);

  // ── Pass 1: exact match on canonical name ─────────────────────
  for (const e of entries) {
    if (e.canonical.toLowerCase() === lower) return e.canonical;
  }

  // ── Pass 2: exact match on synonym ────────────────────────────
  for (const e of entries) {
    for (const s of e.synonyms) {
      if (lower === s.toLowerCase()) return e.canonical;
    }
  }

  // ── Pass 3: normalized fuzzy match (strip common noise) ───────
  const normalised = lower
    .replace(/[()[\]:,\-–—\/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const e of entries) {
    for (const s of e.synonyms) {
      const sNorm = s.toLowerCase()
        .replace(/[()[\]:,\-–—\/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (sNorm.length >= 4 && normalised === sNorm) return e.canonical;
    }
  }

  // ── Pass 4: word-bag match (order-independent) ─────────────────
  // "Cholesterol-LDL" → words {"cholesterol","ldl"} matches
  // synonym "LDL Cholesterol" → {"ldl","cholesterol"}
  const inputBag = toWordBag(normalised);
  if (inputBag.size >= 2) {
    for (const e of entries) {
      const canonBag = toWordBag(e.canonical.toLowerCase());
      if (wordBagsEqual(inputBag, canonBag)) return e.canonical;
      for (const s of e.synonyms) {
        const sBag = toWordBag(
          s.toLowerCase().replace(/[()[\]:,\-–—\/]/g, " ").replace(/\s+/g, " ").trim()
        );
        if (sBag.size >= 2 && wordBagsEqual(inputBag, sBag)) return e.canonical;
      }
    }
  }

  // ── Pass 5: heuristics fallback (well-known patterns) ─────────
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
