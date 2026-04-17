"use client";

/**
 * FamilyRiskRunner
 *
 * Silent background component mounted in the root layout.
 * Listens for store changes (new doc uploads, profile edits) and re-runs the
 * hereditary risk engine. Pushes in-app notifications for new risk signals only
 * (already-seen signals are suppressed via a localStorage dedup log).
 *
 * This component renders nothing — it's purely a side-effect runner.
 * It deliberately does not block or interrupt the user's flow.
 */

import { useEffect } from "react";
import {
  getStore,
  getFamilyMemberStore,
  pushNotification,
} from "@/lib/store";
import {
  buildFamilyGraph,
  evaluateFamilyRisks,
  signalNotifKey,
  buildRiskNotifTitle,
  type HereditaryRiskSignal,
} from "@/lib/familyRiskEngine";

/* ─── Dedup log ───────────────────────────────────────────── */
const NOTIF_LOG_KEY = "mv_hereditary_notif_log_v1";

function getSeenKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NOTIF_LOG_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function markKeysSeen(keys: string[]): void {
  if (typeof window === "undefined" || keys.length === 0) return;
  try {
    const existing = getSeenKeys();
    for (const k of keys) existing.add(k);
    // Cap at 2000 entries to avoid unbounded growth
    const arr = Array.from(existing).slice(-2000);
    localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(arr));
  } catch {
    // localStorage quota — silent
  }
}

/* ─── Engine runner ───────────────────────────────────────── */

function runRiskEngine(): void {
  try {
    const primaryStore = getStore();

    // Skip if no family members — nothing to graph
    if (!primaryStore.familyMembers || primaryStore.familyMembers.length === 0) return;

    const graph = buildFamilyGraph(primaryStore, getFamilyMemberStore);
    const signals = evaluateFamilyRisks(graph);

    if (signals.length === 0) return;

    const seen = getSeenKeys();
    const newSignals: HereditaryRiskSignal[] = [];

    for (const signal of signals) {
      const key = signalNotifKey(signal);
      if (!seen.has(key)) {
        newSignals.push(signal);
      }
    }

    if (newSignals.length === 0) return;

    // Push one notification per new signal, sorted high → moderate → low
    const sorted = newSignals.sort((a, b) => {
      const order: Record<string, number> = { high: 0, moderate: 1, low: 2 };
      return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
    });

    const newKeys: string[] = [];

    for (const signal of sorted) {
      pushNotification({
        kind: "family_risk_flag",
        title: buildRiskNotifTitle(signal),
        body: signal.reason,
        actionHref: "/dashboard",
        actionLabel: "View health summary",
      });
      newKeys.push(signalNotifKey(signal));
    }

    markKeysSeen(newKeys);
  } catch {
    // Silent — never interrupt the user
  }
}

/* ─── Component ───────────────────────────────────────────── */

export function FamilyRiskRunner() {
  useEffect(() => {
    // Run once on mount (covers page load and initial hydration)
    runRiskEngine();

    // Re-run whenever a store update or family member change is broadcast
    const handler = () => runRiskEngine();
    window.addEventListener("mv-store-update", handler);
    window.addEventListener("mv-active-member-changed", handler);

    return () => {
      window.removeEventListener("mv-store-update", handler);
      window.removeEventListener("mv-active-member-changed", handler);
    };
  }, []);

  return null;
}

/**
 * Export the engine runner for use in tests or manual triggering
 * (e.g. after the user edits their profile conditions).
 */
export { runRiskEngine };
