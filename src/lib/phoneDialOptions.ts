import { customArray } from "country-codes-list";

export type PhoneDialOption = { value: string; label: string; countryName: string };

/** One row per unique international dial code (first country name wins alphabetically). */
export function buildPhoneDialOptions(): PhoneDialOption[] {
  const rows = customArray(
    {
      dial: "+{countryCallingCode}",
      label: "{countryNameEn}",
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
    // label = dial code only in the closed control; countryName for option title / screen readers.
    out.push({ value: dial, label: dial, countryName: r.label?.trim() || dial });
  }
  out.sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
  return out;
}
