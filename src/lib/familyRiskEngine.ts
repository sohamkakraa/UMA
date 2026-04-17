/**
 * Family Risk Engine
 *
 * Traverses the family member graph stored in localStorage and checks whether
 * any heritable conditions documented for one member represent a risk for others.
 *
 * Design constraints:
 *  - Pure, side-effect-free functions (testable without DOM)
 *  - The runner component (FamilyRiskRunner) calls these and pushes notifications —
 *    this file never calls pushNotification or touches localStorage directly.
 *  - Works with the existing PatientStore isolation model (one key per member).
 */

import type { FamilyMemberMeta, FamilyRelation, PatientStore } from "@/lib/types";
import {
  findHereditaryEntry,
  isBloodRelation,
  isVerticalBloodRelation,
  isAncestorRelation,
  isDescendantRelation,
  type HereditaryConditionEntry,
  type RiskLevel,
} from "@/lib/hereditaryConditions";

/* ─── Graph types ─────────────────────────────────────────── */

/**
 * A node in the family graph.
 * "self" = the primary account holder.
 * All others reference a FamilyMemberMeta by id.
 */
export type FamilyNode = {
  id: string;             // "self" | member id
  displayName: string;
  relation: FamilyRelation;
  conditions: string[];   // conditions on their profile (lowercased)
};

/**
 * A single hereditary risk signal emitted by the engine.
 * One signal per (affected member, condition, at-risk member) triple.
 * The runner deduplicates and suppresses re-notifications.
 */
export type HereditaryRiskSignal = {
  /** Member who has the condition. */
  sourceId: string;
  sourceName: string;
  sourceRelation: FamilyRelation;
  /** Member who is at risk. */
  targetId: string;
  targetName: string;
  /** The matched hereditary condition. */
  condition: HereditaryConditionEntry;
  /** Which raw condition string from the source matched. */
  rawCondition: string;
  riskLevel: RiskLevel;
  /** Human-readable reason string for the notification body. */
  reason: string;
};

/* ─── Graph builder ───────────────────────────────────────── */

/**
 * Build a flat list of family nodes from the primary store.
 * The primary user is always included as the "self" node.
 */
export function buildFamilyGraph(
  primaryStore: PatientStore,
  getFamilyStore: (id: string) => PatientStore
): FamilyNode[] {
  const members: FamilyMemberMeta[] = primaryStore.familyMembers ?? [];

  // Self node
  const nodes: FamilyNode[] = [
    {
      id: "self",
      displayName: primaryStore.profile.firstName ?? primaryStore.profile.name ?? "You",
      relation: "self",
      conditions: (primaryStore.profile.conditions ?? []).map((c) => c.toLowerCase().trim()),
    },
  ];

  // Family member nodes
  for (const meta of members) {
    const memberStore = getFamilyStore(meta.id);
    nodes.push({
      id: meta.id,
      displayName: meta.displayName,
      relation: meta.relation,
      conditions: (memberStore.profile.conditions ?? []).map((c) => c.toLowerCase().trim()),
    });
  }

  return nodes;
}

/* ─── Risk evaluation ─────────────────────────────────────── */

/**
 * Determine whether the given source→target relation pair warrants a risk signal
 * for a hereditary condition with the given transmission direction.
 */
function shouldFlag(
  sourceRelation: FamilyRelation,
  targetId: string,
  condition: HereditaryConditionEntry
): boolean {
  const dir = condition.transmissionDirection;
  if (dir === "none") return false;

  if (targetId === "self") {
    // Source is a family member; target is the primary user
    if (dir === "vertical") return isVerticalBloodRelation(sourceRelation);
    if (dir === "bilateral") return isBloodRelation(sourceRelation);
  } else {
    // Source is "self" (primary user); target is a family member
    // or source is a family member with a relation that implies risk to another
    // For now: self conditions can flow to descendant children
    if (dir === "vertical") return isDescendantRelation(sourceRelation);
    if (dir === "bilateral") return isBloodRelation(sourceRelation);
  }
  return false;
}

/**
 * Evaluate all risk signals across the full family graph.
 * Returns one signal per unique (sourceId, targetId, canonicalCondition) triple.
 *
 * Algorithm:
 *  For every pair (source, target) where source ≠ target:
 *    For every condition on source:
 *      If it's heritable AND the relationship warrants risk for target → emit signal
 *
 * To keep it manageable we only emit signals where:
 *  - target = "self" (risk to the primary user from any member), OR
 *  - source = "self" and target is a descendant child/grandchild
 */
export function evaluateFamilyRisks(nodes: FamilyNode[]): HereditaryRiskSignal[] {
  const signals: HereditaryRiskSignal[] = [];
  const seen = new Set<string>(); // dedup key: sourceId|targetId|canonicalName

  const self = nodes.find((n) => n.id === "self");
  if (!self) return signals;

  const members = nodes.filter((n) => n.id !== "self");

  // ── Pass 1: member conditions → risk to self ──────────────────────────────
  for (const member of members) {
    for (const rawCond of member.conditions) {
      const entry = findHereditaryEntry(rawCond);
      if (!entry) continue;
      if (entry.transmissionDirection === "none") continue;

      const qualifies =
        entry.transmissionDirection === "vertical"
          ? isVerticalBloodRelation(member.relation)
          : isBloodRelation(member.relation);

      if (!qualifies) continue;

      const dedup = `${member.id}|self|${entry.canonicalName}`;
      if (seen.has(dedup)) continue;
      seen.add(dedup);

      const relationLabel = relationDisplayLabel(member.relation);
      signals.push({
        sourceId: member.id,
        sourceName: member.displayName,
        sourceRelation: member.relation,
        targetId: "self",
        targetName: self.displayName,
        condition: entry,
        rawCondition: rawCond,
        riskLevel: entry.riskLevel,
        reason: `Your ${relationLabel} (${member.displayName}) has ${entry.canonicalName}. ${entry.note}`,
      });
    }
  }

  // ── Pass 2: self conditions → risk to descendant members ─────────────────
  for (const member of members) {
    if (!isDescendantRelation(member.relation)) continue;

    for (const rawCond of self.conditions) {
      const entry = findHereditaryEntry(rawCond);
      if (!entry) continue;
      if (entry.transmissionDirection === "none") continue;

      // Only vertical conditions flow parent → child
      if (entry.transmissionDirection !== "vertical" && entry.transmissionDirection !== "bilateral") continue;

      const dedup = `self|${member.id}|${entry.canonicalName}`;
      if (seen.has(dedup)) continue;
      seen.add(dedup);

      const relationLabel = relationDisplayLabel(member.relation);
      signals.push({
        sourceId: "self",
        sourceName: self.displayName,
        sourceRelation: "self",
        targetId: member.id,
        targetName: member.displayName,
        condition: entry,
        rawCondition: rawCond,
        riskLevel: entry.riskLevel,
        reason: `${member.displayName} (your ${relationLabel}) may be at risk because you have ${entry.canonicalName}. ${entry.note}`,
      });
    }
  }

  // ── Pass 3: ancestor conditions → risk to descendant members ─────────────
  // e.g. grandfather has heart disease → grandchild member also flagged
  const ancestors = members.filter((m) => isAncestorRelation(m.relation));
  const descendants = members.filter((m) => isDescendantRelation(m.relation));

  for (const ancestor of ancestors) {
    for (const descendant of descendants) {
      for (const rawCond of ancestor.conditions) {
        const entry = findHereditaryEntry(rawCond);
        if (!entry) continue;
        if (entry.transmissionDirection !== "vertical" && entry.transmissionDirection !== "bilateral") continue;

        const dedup = `${ancestor.id}|${descendant.id}|${entry.canonicalName}`;
        if (seen.has(dedup)) continue;
        seen.add(dedup);

        const ancestorLabel = relationDisplayLabel(ancestor.relation);
        const descendantLabel = relationDisplayLabel(descendant.relation);
        signals.push({
          sourceId: ancestor.id,
          sourceName: ancestor.displayName,
          sourceRelation: ancestor.relation,
          targetId: descendant.id,
          targetName: descendant.displayName,
          condition: entry,
          rawCondition: rawCond,
          riskLevel: entry.riskLevel,
          reason: `${descendant.displayName} (your ${descendantLabel}) may be at risk because their ${ancestorLabel} (${ancestor.displayName}) has ${entry.canonicalName}. ${entry.note}`,
        });
      }
    }
  }

  // ── Pass 4: member (sibling) conditions → risk to sibling members ─────────
  // Not emitting sibling→sibling cross-member signals to keep noise low;
  // Pass 1 already covers sibling → self for bilateral conditions.

  return signals;
}

/* ─── Notification deduplication key ─────────────────────── */

/**
 * A stable string key for a risk signal used to suppress repeat notifications.
 * Stored in localStorage under `mv_hereditary_notif_log_v1`.
 */
export function signalNotifKey(signal: HereditaryRiskSignal): string {
  return `${signal.sourceId}|${signal.targetId}|${signal.condition.canonicalName}`;
}

/* ─── Utility ─────────────────────────────────────────────── */

export function relationDisplayLabel(rel: FamilyRelation): string {
  const map: Record<FamilyRelation, string> = {
    self: "you",
    mother: "mother",
    father: "father",
    spouse: "spouse",
    husband: "husband",
    wife: "wife",
    brother: "brother",
    sister: "sister",
    grandfather: "grandfather",
    grandmother: "grandmother",
    son: "son",
    daughter: "daughter",
    child: "child",
    other: "family member",
  };
  return map[rel] ?? "family member";
}

/** Build the notification title for a risk signal. */
export function buildRiskNotifTitle(signal: HereditaryRiskSignal): string {
  const levelLabel =
    signal.riskLevel === "high" ? "⚠️ Hereditary risk flagged" :
    signal.riskLevel === "moderate" ? "🧬 Family health flag" :
    "🧬 Family health note";

  return `${levelLabel}: ${signal.condition.canonicalName}`;
}
