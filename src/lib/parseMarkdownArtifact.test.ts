import { describe, expect, it } from "vitest";
import {
  applyParsedMarkdownToDoc,
  enrichDocFromMarkdown,
  extractMarkdownTables,
  parseStructuredFromMarkdown,
} from "./parseMarkdownArtifact";

const SAMPLE_LAB_MD = `
# Lab panel

| Field | Value |
| --- | --- |
| File name | report.pdf |
| File type | Lab report |
| Doctors | Dr. Smith |
| Hospital / clinic | Acme Lab |
| Date of document | 2026-01-15 |
| Date of upload | 2026-04-07T12:00:00.000Z |

## Overview

Routine blood work.

### Lipid Profile

| Standard key | Value | Unit | Reference | Date |
| --- | --- | --- | --- | --- |
| LDL | 120 | mg/dL | <100 | 2026-01-15 |
| HDL | 55 | mg/dL | >40 | 2026-01-15 |
| HbA1c | 5.7 | % | <5.7 | — |
`;

const SAMPLE_RX_MD = `
# Rx

| Field | Value |
| --- | --- |
| Date of document | 2026-02-01 |

## Details

| Medication | Dose | Frequency |
| --- | --- | --- |
| Metformin | 500 mg | BID |
| Atorvastatin | 20 mg | nightly |
`;

describe("extractMarkdownTables", () => {
  it("finds pipe tables including metadata and lab panel", () => {
    const tables = extractMarkdownTables(SAMPLE_LAB_MD);
    expect(tables.length).toBeGreaterThanOrEqual(2);
    const fieldTable = tables.find((t) => t[0].some((c) => c.trim().toLowerCase() === "field"));
    expect(fieldTable).toBeDefined();
  });
});

describe("parseStructuredFromMarkdown", () => {
  it("extracts labs, canonical names, and document date from metadata", () => {
    const p = parseStructuredFromMarkdown(SAMPLE_LAB_MD, undefined, []);
    expect(p.labs.length).toBeGreaterThanOrEqual(3);
    const ldl = p.labs.find((l) => l.name === "LDL");
    expect(ldl?.value).toBe("120");
    expect(ldl?.unit).toBe("mg/dL");
    expect(ldl?.date).toBe("2026-01-15");
    const hba1c = p.labs.find((l) => l.name === "HbA1c");
    expect(hba1c?.value).toBe("5.7");
    expect(p.doctors).toContain("Dr. Smith");
    expect(p.facilityName).toBe("Acme Lab");
    expect(p.rawLabNames.some((n) => /ldl/i.test(n))).toBe(true);
  });

  it("extracts medications from prescription-style tables", () => {
    const p = parseStructuredFromMarkdown(SAMPLE_RX_MD, "2026-02-01", []);
    expect(p.medications.length).toBe(2);
    const m = p.medications.find((x) => x.name === "Metformin");
    expect(m?.dose).toBe("500 mg");
    expect(m?.frequency).toBe("BID");
  });
});

describe("applyParsedMarkdownToDoc", () => {
  it("fills doc.labs from markdown when base doc has none", () => {
    const p = parseStructuredFromMarkdown(SAMPLE_LAB_MD, undefined, []);
    const doc = applyParsedMarkdownToDoc(
      {
        id: "x",
        type: "Lab report",
        title: "T",
        summary: "S",
        markdownArtifact: SAMPLE_LAB_MD,
      },
      p
    );
    expect(doc.labs?.length).toBeGreaterThanOrEqual(3);
    expect(doc.doctors?.[0]).toBe("Dr. Smith");
  });
});

describe("enrichDocFromMarkdown", () => {
  it("parses inline when markdownArtifact is set", () => {
    const doc = enrichDocFromMarkdown({
      id: "y",
      type: "Lab report",
      title: "T",
      summary: "S",
      dateISO: "2026-01-15",
      markdownArtifact: SAMPLE_LAB_MD,
    });
    expect(doc.labs?.some((l) => l.name === "LDL")).toBe(true);
  });
});

const SAMPLE_ALLERGY_MD = `
# Visit

## Allergies

- Penicillin
- Latex

## Conditions

- Hypertension
`;

describe("bullet sections", () => {
  it("extracts allergies and conditions from headings", () => {
    const p = parseStructuredFromMarkdown(SAMPLE_ALLERGY_MD, undefined, []);
    expect(p.allergies).toContain("Penicillin");
    expect(p.conditions).toContain("Hypertension");
  });
});
