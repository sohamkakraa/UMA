import { describe, expect, it } from "vitest";
import {
  bmiFromMetric,
  daysBetweenUTC,
  parseYMD,
  summarizeMenstrualCycle,
} from "./menstrualCycle";

describe("summarizeMenstrualCycle", () => {
  it("computes day of cycle and next period from last start", () => {
    const s = summarizeMenstrualCycle(
      { lastPeriodStartISO: "2026-04-01", typicalCycleLengthDays: 28, flowLogDates: [] },
      "2026-04-07"
    );
    expect(s.dayOfCycle).toBe(7);
    expect(s.nextPeriodStartISO).toBe("2026-04-29");
    expect(s.daysUntilNextPeriod).toBe(22);
    expect(s.flowLoggedToday).toBe(false);
  });

  it("detects flow logged today", () => {
    const s = summarizeMenstrualCycle(
      {
        lastPeriodStartISO: "2026-04-01",
        typicalCycleLengthDays: 28,
        flowLogDates: ["2026-04-07"],
      },
      "2026-04-07"
    );
    expect(s.flowLoggedToday).toBe(true);
    expect(s.headline).toMatch(/^Flow ·/);
  });

  it("handles missing last period", () => {
    const s = summarizeMenstrualCycle({ flowLogDates: [] }, "2026-04-07");
    expect(s.dayOfCycle).toBeUndefined();
    expect(s.detail.toLowerCase()).toContain("last period");
  });
});

describe("parseYMD / daysBetweenUTC", () => {
  it("parses valid ISO dates", () => {
    const a = parseYMD("2026-04-01");
    const b = parseYMD("2026-04-07");
    expect(a && b).toBeTruthy();
    if (a && b) expect(daysBetweenUTC(a, b)).toBe(6);
  });
});

describe("bmiFromMetric", () => {
  it("computes BMI", () => {
    expect(bmiFromMetric(165, 62)).toBe(22.8);
  });
});
