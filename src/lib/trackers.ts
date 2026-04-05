import type { ExtractedLab } from "@/lib/types";

export const TRACKERS = ["Apple Health", "Fitbit", "Garmin"] as const;
export const REQUIRED_TRACKER_METRICS = ["HbA1c", "LDL", "Glucose", "HDL"] as const;

export function addTrackerLabData(existing: ExtractedLab[]): ExtractedLab[] {
  const template: Array<{ name: string; unit: string; values: string[] }> = [
    { name: "HbA1c", unit: "%", values: ["6.4", "6.2", "6.0", "5.8"] },
    { name: "LDL", unit: "mg/dL", values: ["145", "136", "129", "121"] },
    { name: "Glucose", unit: "mg/dL", values: ["118", "111", "106", "101"] },
    { name: "HDL", unit: "mg/dL", values: ["42", "46", "50", "55"] },
  ];
  const now = new Date();
  const additions: ExtractedLab[] = [];

  template.forEach((m) => {
    m.values.forEach((v, i) => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i * 6);
      additions.push({
        name: m.name,
        value: v,
        unit: m.unit,
        date: d.toISOString().slice(0, 10),
      });
    });
  });

  const merged = [...additions, ...existing];
  const seen = new Set<string>();
  return merged.filter((l) => {
    const key = `${l.name.toLowerCase()}|${l.date ?? ""}|${l.value}|${l.unit ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
