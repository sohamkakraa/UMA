import { customArray } from "country-codes-list";

export type PhoneDialOption = { value: string; label: string };

/** One row per unique international dial code (first country name wins alphabetically). */
export function buildPhoneDialOptions(): PhoneDialOption[] {
  const rows = customArray(
    {
      dial: "+{countryCallingCode}",
      label: "{countryNameEn} (+{countryCallingCode})",
    },
    { sortDataBy: "countryNameEn" },
  );
  const seen = new Set<string>();
  const out: PhoneDialOption[] = [];
  for (const r of rows) {
    const dial = r.dial?.trim() ?? "";
    if (dial.length < 2 || !dial.startsWith("+")) continue;
    if (seen.has(dial)) continue;
    seen.add(dial);
    out.push({ value: dial, label: r.label });
  }
  out.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "accent" }));
  return out;
}
