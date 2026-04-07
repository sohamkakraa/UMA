/** Local calendar date YYYY-MM-DD (no time zone shift for “today”). */
export function localTodayYMD(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYMD(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const da = Number(m[3]);
  const d = new Date(y, mo, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
  return d;
}

export function daysBetweenUTC(a: Date, b: Date): number {
  const ms = 86400000;
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((ub - ua) / ms);
}

import type { MenstrualCyclePrefs } from "@/lib/types";

export type CycleSummary = {
  /** Plain-language headline for dashboard */
  headline: string;
  /** Secondary line */
  detail: string;
  /** 1-based day within current cycle, if computable */
  dayOfCycle?: number;
  /** Approximate phase label (not clinical) */
  phaseLabel?: string;
  /** YYYY-MM-DD of estimated next period start */
  nextPeriodStartISO?: string;
  /** Days from today until next period (≥0) */
  daysUntilNextPeriod?: number;
  /** True if today is in flowLogDates */
  flowLoggedToday: boolean;
};

/**
 * Rough, non-clinical phase labels for display only. Not medical advice.
 */
function approximatePhase(dayOfCycle: number, cycleLen: number): string {
  if (dayOfCycle <= 5) return "Menstrual phase (approx.)";
  if (dayOfCycle <= 13) return "Follicular phase (approx.)";
  if (dayOfCycle <= 17) return "Ovulation window (approx.)";
  return "Luteal phase (approx.)";
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function summarizeMenstrualCycle(
  mc: MenstrualCyclePrefs | undefined,
  todayYMD: string = localTodayYMD()
): CycleSummary {
  const flowDates = new Set((mc?.flowLogDates ?? []).map((s) => s.trim()).filter(Boolean));
  const flowLoggedToday = flowDates.has(todayYMD);

  const cycleLen = Math.min(45, Math.max(21, mc?.typicalCycleLengthDays ?? 28));
  const last = mc?.lastPeriodStartISO?.trim();

  if (!last) {
    return {
      headline: "Cycle (beta)",
      detail: flowLoggedToday ? "Flow logged · add last period for day count" : "Add last period on profile",
      flowLoggedToday,
    };
  }

  const start = parseYMD(last);
  const today = parseYMD(todayYMD);
  if (!start || !today) {
    return {
      headline: "Cycle (beta)",
      detail: "Fix date format (YYYY-MM-DD)",
      flowLoggedToday,
    };
  }

  const diff = daysBetweenUTC(start, today);
  if (diff < 0) {
    return {
      headline: "Cycle (beta)",
      detail: "Last period is in the future",
      flowLoggedToday,
    };
  }

  const dayOfCycle = (diff % cycleLen) + 1;
  const cyclesCompleted = Math.floor(diff / cycleLen);
  const nextStart = addDays(start, (cyclesCompleted + 1) * cycleLen);
  const nextPeriodStartISO = toYMD(nextStart);
  const daysUntilNextPeriod = Math.max(0, daysBetweenUTC(today, nextStart));

  const phaseLabel = approximatePhase(dayOfCycle, cycleLen);

  let headline = `Day ${dayOfCycle}`;
  if (flowLoggedToday) headline = `Flow · ${headline}`;

  const detail =
    daysUntilNextPeriod === 0
      ? `Next period ~ today`
      : `Next ~ ${nextPeriodStartISO} (${daysUntilNextPeriod}d)`;

  return {
    headline,
    detail,
    dayOfCycle,
    phaseLabel,
    nextPeriodStartISO,
    daysUntilNextPeriod,
    flowLoggedToday,
  };
}

export function parseHeightCm(raw: string): number | null {
  const n = parseFloat(String(raw).replace(/,/g, ".").trim());
  if (!Number.isFinite(n) || n <= 0 || n > 300) return null;
  return n;
}

export function parseWeightKg(raw: string): number | null {
  const n = parseFloat(String(raw).replace(/,/g, ".").trim());
  if (!Number.isFinite(n) || n <= 0 || n > 500) return null;
  return n;
}

/** BMI from metric inputs; returns null if invalid. */
export function bmiFromMetric(heightCm: number, weightKg: number): number | null {
  if (heightCm <= 0) return null;
  const m = heightCm / 100;
  const bmi = weightKg / (m * m);
  if (!Number.isFinite(bmi)) return null;
  return Math.round(bmi * 10) / 10;
}
