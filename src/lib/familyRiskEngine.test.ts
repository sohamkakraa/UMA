import { describe, expect, it } from "vitest";
import type { PatientStore, FamilyMemberMeta } from "@/lib/types";
import { defaultHealthLogs } from "@/lib/healthLogs";
import {
  buildFamilyGraph,
  evaluateFamilyRisks,
  signalNotifKey,
  buildRiskNotifTitle,
  relationDisplayLabel,
  type FamilyNode,
} from "@/lib/familyRiskEngine";
import {
  findHereditaryEntry,
  isAncestorRelation,
  isDescendantRelation,
  isLateralRelation,
  isSpouseRelation,
  isVerticalBloodRelation,
  isBloodRelation,
} from "@/lib/hereditaryConditions";

/* ─── Helpers ─────────────────────────────────────────────── */

function blankStore(overrides: Partial<PatientStore> = {}): PatientStore {
  return {
    docs: [],
    meds: [],
    labs: [],
    healthLogs: defaultHealthLogs(),
    profile: { name: "User", allergies: [], conditions: [] },
    preferences: { theme: "light" },
    updatedAtISO: new Date().toISOString(),
    ...overrides,
  } as PatientStore;
}

function memberMeta(
  id: string,
  relation: FamilyMemberMeta["relation"],
  displayName?: string
): FamilyMemberMeta {
  return { id, relation, displayName: displayName ?? relation, addedAtISO: new Date().toISOString() };
}

/* ─── findHereditaryEntry ─────────────────────────────────── */

describe("findHereditaryEntry", () => {
  it("matches canonical name exactly (case-insensitive)", () => {
    const entry = findHereditaryEntry("Type 2 Diabetes");
    expect(entry).not.toBeNull();
    expect(entry!.canonicalName).toBe("Type 2 Diabetes");
  });

  it("matches a known synonym", () => {
    expect(findHereditaryEntry("t2dm")).not.toBeNull();
    expect(findHereditaryEntry("high cholesterol")).not.toBeNull();
    expect(findHereditaryEntry("cad")).not.toBeNull();
    expect(findHereditaryEntry("brca")).not.toBeNull();
  });

  it("matches common misspellings / abbreviations", () => {
    expect(findHereditaryEntry("fh")).not.toBeNull();        // familial hypercholesterolemia
    expect(findHereditaryEntry("afib")).not.toBeNull();     // atrial fibrillation
    expect(findHereditaryEntry("pkd")).not.toBeNull();      // polycystic kidney disease
    expect(findHereditaryEntry("sle")).not.toBeNull();      // lupus
  });

  it("returns null for non-heritable or unknown conditions", () => {
    expect(findHereditaryEntry("common cold")).toBeNull();
    expect(findHereditaryEntry("broken arm")).toBeNull();
    expect(findHereditaryEntry("")).toBeNull();
    expect(findHereditaryEntry("xyz_unknown_condition")).toBeNull();
  });

  it("does partial/substring match as fallback", () => {
    // "coronary artery disease" contained in full phrase
    const entry = findHereditaryEntry("known coronary artery disease");
    expect(entry).not.toBeNull();
  });
});

/* ─── Relationship direction helpers ─────────────────────── */

describe("relationship direction helpers", () => {
  it("correctly classifies ancestors", () => {
    expect(isAncestorRelation("mother")).toBe(true);
    expect(isAncestorRelation("father")).toBe(true);
    expect(isAncestorRelation("grandfather")).toBe(true);
    expect(isAncestorRelation("grandmother")).toBe(true);
    expect(isAncestorRelation("son")).toBe(false);
    expect(isAncestorRelation("spouse")).toBe(false);
  });

  it("correctly classifies descendants", () => {
    expect(isDescendantRelation("son")).toBe(true);
    expect(isDescendantRelation("daughter")).toBe(true);
    expect(isDescendantRelation("child")).toBe(true);
    expect(isDescendantRelation("father")).toBe(false);
  });

  it("correctly classifies laterals (siblings)", () => {
    expect(isLateralRelation("brother")).toBe(true);
    expect(isLateralRelation("sister")).toBe(true);
    expect(isLateralRelation("mother")).toBe(false);
    expect(isLateralRelation("son")).toBe(false);
  });

  it("correctly classifies spouses", () => {
    expect(isSpouseRelation("spouse")).toBe(true);
    expect(isSpouseRelation("husband")).toBe(true);
    expect(isSpouseRelation("wife")).toBe(true);
    expect(isSpouseRelation("brother")).toBe(false);
  });

  it("vertical blood relation includes ancestors + descendants but not spouse", () => {
    expect(isVerticalBloodRelation("mother")).toBe(true);
    expect(isVerticalBloodRelation("daughter")).toBe(true);
    expect(isVerticalBloodRelation("spouse")).toBe(false);
    expect(isVerticalBloodRelation("brother")).toBe(false);
  });

  it("blood relation includes ancestors, descendants, and siblings", () => {
    expect(isBloodRelation("mother")).toBe(true);
    expect(isBloodRelation("son")).toBe(true);
    expect(isBloodRelation("sister")).toBe(true);
    expect(isBloodRelation("spouse")).toBe(false);
    expect(isBloodRelation("husband")).toBe(false);
  });
});

/* ─── buildFamilyGraph ────────────────────────────────────── */

describe("buildFamilyGraph", () => {
  it("always includes self node even with no family members", () => {
    const primary = blankStore({ profile: { name: "Alice", conditions: ["hypertension"], allergies: [] } });
    const graph = buildFamilyGraph(primary, () => blankStore());
    expect(graph).toHaveLength(1);
    expect(graph[0].id).toBe("self");
    expect(graph[0].relation).toBe("self");
    expect(graph[0].conditions).toContain("hypertension");
  });

  it("includes all family members with their conditions", () => {
    const primary = blankStore({
      profile: { name: "Alice", conditions: [], allergies: [] },
      familyMembers: [
        memberMeta("fm1", "mother", "Mum"),
        memberMeta("fm2", "son", "Bob"),
      ],
    });

    const memberStores: Record<string, PatientStore> = {
      fm1: blankStore({ profile: { name: "Mum", conditions: ["Type 2 Diabetes", "Hypertension"], allergies: [] } }),
      fm2: blankStore({ profile: { name: "Bob", conditions: [], allergies: [] } }),
    };

    const graph = buildFamilyGraph(primary, (id) => memberStores[id] ?? blankStore());
    expect(graph).toHaveLength(3);

    const mum = graph.find((n) => n.id === "fm1");
    expect(mum).toBeDefined();
    expect(mum!.relation).toBe("mother");
    expect(mum!.conditions).toContain("type 2 diabetes");

    const bob = graph.find((n) => n.id === "fm2");
    expect(bob).toBeDefined();
    expect(bob!.conditions).toHaveLength(0);
  });

  it("normalises condition strings to lowercase", () => {
    const primary = blankStore({
      profile: { name: "User", conditions: ["BREAST CANCER", "Coronary Artery Disease"], allergies: [] },
    });
    const graph = buildFamilyGraph(primary, () => blankStore());
    expect(graph[0].conditions).toContain("breast cancer");
    expect(graph[0].conditions).toContain("coronary artery disease");
  });
});

/* ─── evaluateFamilyRisks ─────────────────────────────────── */

describe("evaluateFamilyRisks — no family members", () => {
  it("returns empty signals when only self node exists", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: ["diabetes"] },
    ];
    expect(evaluateFamilyRisks(nodes)).toHaveLength(0);
  });
});

describe("evaluateFamilyRisks — parent → self (vertical)", () => {
  it("flags heritable vertical condition from mother to self", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["breast cancer"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    expect(signals.length).toBeGreaterThan(0);
    const s = signals[0];
    expect(s.sourceId).toBe("fm1");
    expect(s.targetId).toBe("self");
    expect(s.condition.canonicalName).toBe("Breast Cancer");
    expect(s.riskLevel).toBe("high");
  });

  it("flags heritable condition from grandfather to self", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Grandpa", relation: "grandfather", conditions: ["coronary artery disease"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    expect(signals.some((s) => s.condition.canonicalName === "Coronary Artery Disease")).toBe(true);
  });

  it("does NOT flag non-heritable condition from parent", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["common cold", "broken arm"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    expect(signals).toHaveLength(0);
  });

  it("does NOT flag vertical condition from spouse (not a blood relative)", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Husband", relation: "husband", conditions: ["coronary artery disease"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    // Coronary artery disease is vertical — spouse should not trigger it
    expect(signals.filter((s) => s.condition.canonicalName === "Coronary Artery Disease")).toHaveLength(0);
  });
});

describe("evaluateFamilyRisks — bilateral (sibling → self)", () => {
  it("flags bilateral condition from sibling to self", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Brother", relation: "brother", conditions: ["type 2 diabetes"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    expect(signals.some((s) => s.condition.canonicalName === "Type 2 Diabetes" && s.targetId === "self")).toBe(true);
  });

  it("does NOT flag bilateral condition from spouse", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Spouse", relation: "spouse", conditions: ["type 2 diabetes"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    expect(signals).toHaveLength(0);
  });
});

describe("evaluateFamilyRisks — self → child", () => {
  it("flags heritable condition from self to child", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: ["breast cancer"] },
      { id: "fm1", displayName: "Daughter", relation: "daughter", conditions: [] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    const childSignal = signals.find((s) => s.targetId === "fm1");
    expect(childSignal).toBeDefined();
    expect(childSignal!.condition.canonicalName).toBe("Breast Cancer");
    expect(childSignal!.sourceId).toBe("self");
  });

  it("does NOT flag self conditions to a sibling (self → sibling is not emitted)", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: ["breast cancer"] },
      { id: "fm1", displayName: "Sister", relation: "sister", conditions: [] },
    ];
    // Self → sibling: pass 2 only covers descendants
    const signals = evaluateFamilyRisks(nodes);
    const siblingSignal = signals.find((s) => s.targetId === "fm1");
    expect(siblingSignal).toBeUndefined();
  });
});

describe("evaluateFamilyRisks — ancestor → descendant member (two-hop)", () => {
  it("flags ancestor condition to descendant member (grandfather → grandchild member)", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Grandpa", relation: "grandfather", conditions: ["polycystic kidney disease"] },
      { id: "fm2", displayName: "Son", relation: "son", conditions: [] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    const twoHop = signals.find((s) => s.sourceId === "fm1" && s.targetId === "fm2");
    expect(twoHop).toBeDefined();
    expect(twoHop!.condition.canonicalName).toBe("Polycystic Kidney Disease");
  });
});

describe("evaluateFamilyRisks — deduplication", () => {
  it("does not produce duplicate signals for same condition", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["type 2 diabetes", "t2dm"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    // Both "type 2 diabetes" and "t2dm" resolve to the same canonical entry — should dedupe
    const diabetesSignals = signals.filter(
      (s) => s.condition.canonicalName === "Type 2 Diabetes" && s.targetId === "self"
    );
    expect(diabetesSignals).toHaveLength(1);
  });

  it("handles empty conditions on all nodes", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: [] },
      { id: "fm2", displayName: "Dad", relation: "father", conditions: [] },
    ];
    expect(evaluateFamilyRisks(nodes)).toHaveLength(0);
  });
});

describe("evaluateFamilyRisks — multiple conditions and members", () => {
  it("produces correct count with multiple members and conditions", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["breast cancer", "hypothyroidism"] },
      { id: "fm2", displayName: "Dad", relation: "father", conditions: ["coronary artery disease", "type 2 diabetes"] },
      { id: "fm3", displayName: "Daughter", relation: "daughter", conditions: [] },
    ];
    const signals = evaluateFamilyRisks(nodes);

    // Mum → self: breast cancer (vertical ✓), hypothyroidism (bilateral ✓)
    // Dad → self: coronary artery disease (vertical ✓), t2d (bilateral ✓)
    // Mum (ancestor) → daughter (descendant): breast cancer (vertical ✓), hypothyroidism (bilateral ✓)
    // Dad (ancestor) → daughter (descendant): cad (vertical ✓), t2d (bilateral ✓)
    // self → daughter: self has no conditions, so 0
    expect(signals.length).toBeGreaterThanOrEqual(6);

    // All signals targeting self or the daughter (no sibling→sibling or spouse nonsense)
    const targets = new Set(signals.map((s) => s.targetId));
    expect(targets.has("self")).toBe(true);
    expect(targets.has("fm3")).toBe(true);
    expect(targets.has("fm1")).toBe(false); // mother should not be target
    expect(targets.has("fm2")).toBe(false); // father should not be target
  });
});

/* ─── Utility functions ───────────────────────────────────── */

describe("signalNotifKey", () => {
  it("produces a stable unique key per (source, target, condition) triple", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["breast cancer"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    expect(signals).toHaveLength(1);
    const key = signalNotifKey(signals[0]);
    expect(key).toBe("fm1|self|Breast Cancer");
  });
});

describe("buildRiskNotifTitle", () => {
  it("uses ⚠️ prefix for high risk", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["breast cancer"] },
    ];
    const signal = evaluateFamilyRisks(nodes)[0];
    const title = buildRiskNotifTitle(signal);
    expect(title).toContain("⚠️");
    expect(title).toContain("Breast Cancer");
  });

  it("uses 🧬 prefix for moderate risk", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["hypertension"] },
    ];
    const signal = evaluateFamilyRisks(nodes)[0];
    const title = buildRiskNotifTitle(signal);
    expect(title).toContain("🧬");
    expect(title).toContain("Hypertension");
  });
});

describe("relationDisplayLabel", () => {
  it("returns friendly label for all supported relations", () => {
    expect(relationDisplayLabel("mother")).toBe("mother");
    expect(relationDisplayLabel("grandfather")).toBe("grandfather");
    expect(relationDisplayLabel("other")).toBe("family member");
    expect(relationDisplayLabel("self")).toBe("you");
  });
});

/* ─── Edge cases ──────────────────────────────────────────── */

describe("evaluateFamilyRisks — edge cases", () => {
  it("handles nodes list with no self node gracefully", () => {
    const nodes: FamilyNode[] = [
      { id: "fm1", displayName: "Mum", relation: "mother", conditions: ["diabetes"] },
    ];
    // No "self" node → should return empty (safe)
    expect(evaluateFamilyRisks(nodes)).toHaveLength(0);
  });

  it("handles a single self node with conditions but no family members", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: ["breast cancer", "hypertension"] },
    ];
    expect(evaluateFamilyRisks(nodes)).toHaveLength(0);
  });

  it("includes the condition name in the reason string", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Dad", relation: "father", conditions: ["type 2 diabetes"] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    const signal = signals.find((s) => s.condition.canonicalName === "Type 2 Diabetes");
    expect(signal).toBeDefined();
    expect(signal!.reason).toContain("Type 2 Diabetes");
    expect(signal!.reason).toContain("Dad");
  });

  it("handles 'child' relation as descendant", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: ["cystic fibrosis"] },
      { id: "fm1", displayName: "Child", relation: "child", conditions: [] },
    ];
    const signals = evaluateFamilyRisks(nodes);
    const toChild = signals.find((s) => s.targetId === "fm1");
    expect(toChild).toBeDefined();
  });

  it("does not emit signals if condition is bilateral but member is spouse", () => {
    const nodes: FamilyNode[] = [
      { id: "self", displayName: "Alice", relation: "self", conditions: [] },
      { id: "fm1", displayName: "Husband", relation: "husband", conditions: ["type 2 diabetes", "hypertension"] },
    ];
    // Both diabetes and hypertension are bilateral — but husband is not a blood relative
    const signals = evaluateFamilyRisks(nodes);
    expect(signals).toHaveLength(0);
  });
});
