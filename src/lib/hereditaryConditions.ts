/**
 * Hereditary Conditions Database
 *
 * Maps canonical condition names (lowercased) to their hereditary properties.
 * Each entry describes:
 *  - canonicalName: the primary display name
 *  - synonyms: alternate spellings / abbreviations that map to this entry
 *  - transmissionDirection: which relationships carry risk
 *     "vertical"    — parent → child (and grandparent → grandchild, two-hop)
 *     "bilateral"   — any blood relative (siblings count too)
 *     "none"        — not heritable (included so we can suppress false positives)
 *  - riskLevel: how strong the heritable signal is
 *  - note: short plain-language explanation shown in the risk notification
 */

import type { FamilyRelation } from "@/lib/types";

export type TransmissionDirection = "vertical" | "bilateral" | "none";
export type RiskLevel = "high" | "moderate" | "low";

export type HereditaryConditionEntry = {
  canonicalName: string;
  synonyms: string[];
  transmissionDirection: TransmissionDirection;
  riskLevel: RiskLevel;
  note: string;
};

export const HEREDITARY_CONDITIONS: HereditaryConditionEntry[] = [
  // ── Cardiovascular ─────────────────────────────────────────────────────────
  {
    canonicalName: "Coronary Artery Disease",
    synonyms: ["cad", "coronary heart disease", "ischemic heart disease", "ihd", "heart disease"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "A family history of coronary artery disease significantly raises your own lifetime risk.",
  },
  {
    canonicalName: "Hypertension",
    synonyms: ["high blood pressure", "htn", "arterial hypertension"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Hypertension runs in families — close blood relatives with this condition raise your risk.",
  },
  {
    canonicalName: "Hypercholesterolaemia",
    synonyms: [
      "high cholesterol",
      "familial hypercholesterolemia",
      "familial hypercholesterolaemia",
      "fh",
      "hyperlipidemia",
      "hyperlipidaemia",
      "dyslipidemia",
      "dyslipidaemia",
    ],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Familial hypercholesterolaemia is directly inherited and can be passed to children.",
  },
  {
    canonicalName: "Atrial Fibrillation",
    synonyms: ["afib", "af", "atrial fibrillation"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Atrial fibrillation has a heritable component — first-degree relatives have elevated risk.",
  },
  {
    canonicalName: "Cardiomyopathy",
    synonyms: ["dilated cardiomyopathy", "hypertrophic cardiomyopathy", "hcm", "dcm"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Hypertrophic and dilated cardiomyopathies are often caused by genetic mutations that can be passed to children.",
  },
  {
    canonicalName: "Stroke",
    synonyms: ["cerebrovascular accident", "cva", "ischemic stroke", "haemorrhagic stroke", "hemorrhagic stroke"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "A family history of stroke raises your own risk, partly through shared genetic factors.",
  },

  // ── Metabolic / Endocrine ───────────────────────────────────────────────────
  {
    canonicalName: "Type 2 Diabetes",
    synonyms: [
      "diabetes mellitus type 2",
      "t2dm",
      "t2d",
      "type ii diabetes",
      "non-insulin-dependent diabetes",
      "niddm",
      "diabetes",
    ],
    transmissionDirection: "bilateral",
    riskLevel: "high",
    note: "Type 2 diabetes has strong hereditary links — having a parent or sibling with it significantly raises your risk.",
  },
  {
    canonicalName: "Type 1 Diabetes",
    synonyms: ["diabetes mellitus type 1", "t1dm", "t1d", "type i diabetes", "insulin-dependent diabetes", "iddm"],
    transmissionDirection: "vertical",
    riskLevel: "moderate",
    note: "Type 1 diabetes has a genetic component; children of affected parents have higher risk.",
  },
  {
    canonicalName: "Obesity",
    synonyms: ["morbid obesity", "overweight", "bmi > 30"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Obesity risk has a heritable component alongside lifestyle factors shared across households.",
  },
  {
    canonicalName: "Hypothyroidism",
    synonyms: ["underactive thyroid", "hashimoto's thyroiditis", "hashimotos", "autoimmune thyroid"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Autoimmune thyroid disorders cluster in families and can be passed across generations.",
  },
  {
    canonicalName: "Hyperthyroidism",
    synonyms: ["overactive thyroid", "graves' disease", "graves disease"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Graves' disease and other autoimmune hyperthyroidism have familial clustering.",
  },

  // ── Cancer ──────────────────────────────────────────────────────────────────
  {
    canonicalName: "Breast Cancer",
    synonyms: ["brca", "breast carcinoma", "mammary cancer"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Breast cancer — especially with BRCA1/BRCA2 mutations — is strongly heritable through the maternal and paternal line.",
  },
  {
    canonicalName: "Colorectal Cancer",
    synonyms: [
      "colon cancer",
      "rectal cancer",
      "bowel cancer",
      "colorectal carcinoma",
      "lynch syndrome",
      "familial adenomatous polyposis",
      "fap",
    ],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Colorectal cancer can be caused by inherited mutations (Lynch syndrome, FAP) passed from parent to child.",
  },
  {
    canonicalName: "Ovarian Cancer",
    synonyms: ["ovarian carcinoma", "brca ovarian"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Ovarian cancer is closely linked to BRCA gene variants that can be inherited from either parent.",
  },
  {
    canonicalName: "Prostate Cancer",
    synonyms: ["prostate carcinoma"],
    transmissionDirection: "vertical",
    riskLevel: "moderate",
    note: "Prostate cancer risk is elevated if a father or brother has been diagnosed.",
  },
  {
    canonicalName: "Melanoma",
    synonyms: ["skin cancer", "malignant melanoma", "familial melanoma"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Familial melanoma has a genetic basis — relatives of affected individuals should monitor their skin regularly.",
  },

  // ── Neurological ────────────────────────────────────────────────────────────
  {
    canonicalName: "Alzheimer's Disease",
    synonyms: ["alzheimers", "apoe4", "dementia", "early-onset alzheimer"],
    transmissionDirection: "vertical",
    riskLevel: "moderate",
    note: "Having a parent with Alzheimer's disease — particularly early-onset — raises your own risk.",
  },
  {
    canonicalName: "Parkinson's Disease",
    synonyms: ["parkinsons", "parkinsonism", "lrrk2"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Some forms of Parkinson's disease are linked to inherited gene variants.",
  },
  {
    canonicalName: "Epilepsy",
    synonyms: ["seizure disorder", "convulsions"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Certain epilepsy syndromes have a genetic basis; the risk is higher if a first-degree relative is affected.",
  },
  {
    canonicalName: "Migraine",
    synonyms: ["migraines", "hemiplegic migraine", "migraine with aura"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Migraines — especially hemiplegic types — have a strong familial pattern.",
  },

  // ── Autoimmune ──────────────────────────────────────────────────────────────
  {
    canonicalName: "Rheumatoid Arthritis",
    synonyms: ["ra", "rheumatoid arthritis", "inflammatory arthritis"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Rheumatoid arthritis has a significant genetic component shared across family lines.",
  },
  {
    canonicalName: "Lupus",
    synonyms: ["sle", "systemic lupus erythematosus"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Lupus can cluster in families; siblings and children of people with lupus are at higher risk.",
  },
  {
    canonicalName: "Crohn's Disease",
    synonyms: ["crohns", "inflammatory bowel disease", "ibd", "crohn disease"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Crohn's disease has a heritable component — children of affected parents have elevated risk.",
  },
  {
    canonicalName: "Ulcerative Colitis",
    synonyms: ["uc", "ulcerative colitis", "colitis"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Ulcerative colitis clusters in families, particularly in first-degree relatives.",
  },
  {
    canonicalName: "Psoriasis",
    synonyms: ["plaque psoriasis", "psoriatic disease"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Psoriasis has a well-established genetic basis and often runs in families.",
  },
  {
    canonicalName: "Celiac Disease",
    synonyms: ["coeliac disease", "celiac", "coeliac", "gluten intolerance"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Celiac disease is strongly heritable — first-degree relatives of people with celiac should consider testing.",
  },

  // ── Blood Disorders ─────────────────────────────────────────────────────────
  {
    canonicalName: "Sickle Cell Disease",
    synonyms: ["sickle cell anaemia", "sickle cell anemia", "scd", "hbs"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Sickle cell disease is an autosomal recessive genetic condition — if both parents carry the trait, each child has a 25% chance of the disease.",
  },
  {
    canonicalName: "Thalassaemia",
    synonyms: ["thalassemia", "beta thalassemia", "alpha thalassemia", "mediterranean anaemia"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Thalassaemia is inherited from both parents — if both are carriers, each child may be affected.",
  },
  {
    canonicalName: "Haemophilia",
    synonyms: ["hemophilia", "haemophilia a", "haemophilia b", "factor viii deficiency", "factor ix deficiency"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Haemophilia is an X-linked inherited bleeding disorder passed from parent to child.",
  },

  // ── Mental Health ───────────────────────────────────────────────────────────
  {
    canonicalName: "Bipolar Disorder",
    synonyms: ["bipolar", "manic depression", "bipolar i", "bipolar ii"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Bipolar disorder has a strong heritable component — children of an affected parent have elevated risk.",
  },
  {
    canonicalName: "Depression",
    synonyms: ["major depressive disorder", "mdd", "clinical depression", "major depression"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Major depression has a heritable component alongside environmental factors.",
  },
  {
    canonicalName: "Schizophrenia",
    synonyms: ["psychosis", "schizoaffective disorder"],
    transmissionDirection: "bilateral",
    riskLevel: "high",
    note: "Schizophrenia has a significant genetic basis — the risk for children and siblings of affected individuals is substantially elevated.",
  },

  // ── Kidney ──────────────────────────────────────────────────────────────────
  {
    canonicalName: "Polycystic Kidney Disease",
    synonyms: ["pkd", "adpkd", "arpkd", "autosomal dominant polycystic kidney disease"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "ADPKD is directly inherited — each child of an affected parent has a 50% chance of inheriting the gene.",
  },
  {
    canonicalName: "Chronic Kidney Disease",
    synonyms: ["ckd", "renal failure", "kidney failure", "kidney disease"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Chronic kidney disease can have familial risk factors, especially when linked to diabetes or hypertension.",
  },

  // ── Musculoskeletal ─────────────────────────────────────────────────────────
  {
    canonicalName: "Osteoporosis",
    synonyms: ["bone loss", "osteopenia", "low bone density"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Osteoporosis is partly heritable — if a parent fractured a hip or has osteoporosis, your own risk is higher.",
  },
  {
    canonicalName: "Gout",
    synonyms: ["hyperuricemia", "uric acid", "gouty arthritis"],
    transmissionDirection: "bilateral",
    riskLevel: "low",
    note: "Gout has a heritable component; it tends to run in families.",
  },

  // ── Respiratory ─────────────────────────────────────────────────────────────
  {
    canonicalName: "Asthma",
    synonyms: ["bronchial asthma", "reactive airway disease"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Asthma has a heritable component — children of parents with asthma or eczema are at higher risk.",
  },
  {
    canonicalName: "Cystic Fibrosis",
    synonyms: ["cf", "cftr mutation"],
    transmissionDirection: "vertical",
    riskLevel: "high",
    note: "Cystic fibrosis is a recessive genetic condition — if both parents are carriers, each child has a 25% chance of being affected.",
  },

  // ── Eye ─────────────────────────────────────────────────────────────────────
  {
    canonicalName: "Glaucoma",
    synonyms: ["open-angle glaucoma", "angle-closure glaucoma", "ocular hypertension"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "Glaucoma has a genetic basis — first-degree relatives of someone with glaucoma should have regular eye checks.",
  },
  {
    canonicalName: "Age-Related Macular Degeneration",
    synonyms: ["amd", "macular degeneration", "macular dystrophy"],
    transmissionDirection: "bilateral",
    riskLevel: "moderate",
    note: "AMD has heritable risk factors — family history is a significant predictor.",
  },
];

/* ─── Lookup helpers ─────────────────────────────────────────────────────── */

/** Build a flat lookup map: any alias → entry (created once at module load). */
const _lookup = new Map<string, HereditaryConditionEntry>();
for (const entry of HEREDITARY_CONDITIONS) {
  _lookup.set(entry.canonicalName.toLowerCase(), entry);
  for (const syn of entry.synonyms) {
    _lookup.set(syn.toLowerCase(), entry);
  }
}

/**
 * Check if a condition string matches any known hereditary condition.
 * Returns the matched entry or null if not heritable.
 */
export function findHereditaryEntry(condition: string): HereditaryConditionEntry | null {
  const lc = condition.trim().toLowerCase();
  if (!lc) return null;
  if (_lookup.has(lc)) return _lookup.get(lc)!;

  // Partial / substring match as fallback (minimum 4 chars to avoid noise)
  if (lc.length >= 4) {
    for (const [key, entry] of _lookup.entries()) {
      if (key.length >= 4 && (lc.includes(key) || key.includes(lc))) return entry;
    }
  }
  return null;
}

/* ─── Relationship direction helpers ────────────────────────────────────── */

/**
 * Returns true if this relation is an ancestor (parent/grandparent direction)
 * relative to the primary account holder.
 */
export function isAncestorRelation(rel: FamilyRelation): boolean {
  return ["mother", "father", "grandfather", "grandmother"].includes(rel);
}

/**
 * Returns true if this relation is a descendant (child direction).
 */
export function isDescendantRelation(rel: FamilyRelation): boolean {
  return ["son", "daughter", "child"].includes(rel);
}

/**
 * Returns true if this relation is a lateral blood relative (sibling direction).
 */
export function isLateralRelation(rel: FamilyRelation): boolean {
  return ["brother", "sister"].includes(rel);
}

/**
 * Returns true if this relation is a non-blood link (spouse/partner).
 */
export function isSpouseRelation(rel: FamilyRelation): boolean {
  return ["spouse", "husband", "wife"].includes(rel);
}

/**
 * Returns true if the relation carries blood-line hereditary risk relevant for
 * "vertical" transmission (parent ↔ child direction).
 */
export function isVerticalBloodRelation(rel: FamilyRelation): boolean {
  return isAncestorRelation(rel) || isDescendantRelation(rel);
}

/**
 * Returns true if the relation carries risk for "bilateral" conditions
 * (any blood relative — vertical or lateral).
 */
export function isBloodRelation(rel: FamilyRelation): boolean {
  return isVerticalBloodRelation(rel) || isLateralRelation(rel);
}
