# UMA standardized health metrics

This file is the **human-readable registry** of canonical keys used for lab values, charts, and document markdown across UMA. The runtime source of truth for matching is `src/lib/standardized.ts` (`DEFAULT_LEXICON`); keep them aligned when you add keys.

## Rules

1. **Canonical key** — Title Case or short clinical label (e.g. `HbA1c`, `LDL`, `RBC`). Charts and trends aggregate by this string exactly (case-insensitive compare after resolution).
2. **Synonyms** — Alternate spellings and report phrasing map to one canonical key.
3. **Panel** — Logical grouping for markdown sections (CBC, Lipid Profile, etc.). Optional.
4. **New keys** — When extraction finds a test name that does not map to any canonical entry, the pipeline proposes a new `{ canonical, synonyms[], panel? }` entry. Those patches are stored in the patient store (`standardLexicon`) and merged here over time for documentation.

## Canonical keys (default)

| Canonical | Panel | Example synonyms |
|-----------|--------|------------------|
| HbA1c | Glucose & HbA1c | Hemoglobin A1c, Glycosylated Hemoglobin |
| LDL | Lipid Profile | LDL Cholesterol, Low Density Lipoprotein |
| HDL | Lipid Profile | HDL Cholesterol, High Density Lipoprotein |
| Triglycerides | Lipid Profile | TG, Triglyceride |
| Total Cholesterol | Lipid Profile | Cholesterol (total) |
| Glucose | Glucose & HbA1c | Fasting Glucose, Random Glucose, Blood Sugar |
| AST | Liver Function | SGOT, Aspartate Aminotransferase |
| ALT | Liver Function | SGPT, Alanine Aminotransferase |
| ALP | Liver Function | Alkaline Phosphatase |
| GGT | Liver Function | Gamma Glutamyl Transferase |
| TSH | Thyroid Profile | Thyroid Stimulating Hormone |
| T3 | Thyroid Profile | Triiodothyronine, TT3 |
| T4 | Thyroid Profile | Thyroxine, TT4 |
| Creatinine | Kidney Function & Electrolytes | — |
| Urea | Kidney Function & Electrolytes | — |
| BUN | Kidney Function & Electrolytes | Blood Urea Nitrogen |
| Uric Acid | Kidney Function & Electrolytes | — |
| Hemoglobin | CBC | Hb, HGB |
| RBC | CBC | Red Blood Cell, Red Blood Cell Count |
| WBC | CBC | White Blood Cell, White Cell Count |
| Platelets | CBC | PLT, Platelet Count |
| Hematocrit | CBC | HCT, Packed Cell Volume |
| MCV | CBC | Mean Corpuscular Volume |
| MCH | CBC | Mean Corpuscular Hemoglobin |
| MCHC | CBC | Mean Corpuscular Hemoglobin Concentration |
| RDW | CBC | Red Cell Distribution Width |
| Sodium | Kidney Function & Electrolytes | Na |
| Potassium | Kidney Function & Electrolytes | K |
| Chloride | Kidney Function & Electrolytes | Cl |
| Calcium | Minerals | Ca |
| Iron | Iron Studies | Serum Iron |
| TIBC | Iron Studies | Total Iron Binding Capacity |
| Transferrin | Iron Studies | — |
| Iron Saturation | Iron Studies | Transferrin Saturation, % Saturation |

## Non-lab document keys

Prescriptions, imaging, and bills use structured sections in per-document markdown rather than this table; medications use medication `name` strings as stored on `ExtractedDoc`.
