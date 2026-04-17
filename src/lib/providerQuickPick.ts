import type { ExtractedDoc, PatientStore } from "@/lib/types";

export function normPickKey(s: string): string {
  return s.trim().toLowerCase();
}

export function doctorNamesFromDocs(docs: ExtractedDoc[]): string[] {
  const names = new Set<string>();
  for (const doc of docs) {
    doc.doctors?.forEach((d) => {
      const t = d.trim();
      if (t) names.add(t);
    });
    const p = doc.provider?.trim();
    if (p) names.add(p);
  }
  return [...names];
}

export function facilityNamesFromDocs(docs: ExtractedDoc[]): string[] {
  const names = new Set<string>();
  for (const doc of docs) {
    const f = doc.facilityName?.trim();
    if (f) names.add(f);
  }
  return [...names];
}

type DoctorPickProfile = Pick<
  PatientStore["profile"],
  "primaryCareProvider" | "doctorQuickPick" | "doctorQuickPickHidden"
>;

export function mergeDoctorQuickPick(profile: DoctorPickProfile, fromDocuments: string[]): string[] {
  const hidden = new Set((profile.doctorQuickPickHidden ?? []).map(normPickKey));
  const out = new Set<string>();
  for (const raw of fromDocuments) {
    const t = raw.trim();
    if (!t || hidden.has(normPickKey(t))) continue;
    out.add(t);
  }
  for (const raw of profile.doctorQuickPick ?? []) {
    const t = raw.trim();
    if (t) out.add(t);
  }
  if (profile.primaryCareProvider?.trim()) out.add(profile.primaryCareProvider.trim());
  return Array.from(out).sort((a, b) => a.localeCompare(b));
}

type FacilityPickProfile = Pick<
  PatientStore["profile"],
  "nextVisitHospital" | "facilityQuickPick" | "facilityQuickPickHidden"
>;

export function mergeFacilityQuickPick(profile: FacilityPickProfile, fromDocuments: string[]): string[] {
  const hidden = new Set((profile.facilityQuickPickHidden ?? []).map(normPickKey));
  const out = new Set<string>();
  for (const raw of fromDocuments) {
    const t = raw.trim();
    if (!t || hidden.has(normPickKey(t))) continue;
    out.add(t);
  }
  for (const raw of profile.facilityQuickPick ?? []) {
    const t = raw.trim();
    if (t) out.add(t);
  }
  if (profile.nextVisitHospital?.trim()) out.add(profile.nextVisitHospital.trim());
  return Array.from(out).sort((a, b) => a.localeCompare(b));
}
