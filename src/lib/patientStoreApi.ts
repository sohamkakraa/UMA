import type { PatientStore } from "@/lib/types";

/** Drop embedded PDF bytes before syncing to the API (keeps DB small; PDFs stay in localStorage when present). */
export function patientStoreForApiPayload(store: PatientStore): PatientStore {
  return {
    ...store,
    docs: store.docs.map((d) => ({ ...d, originalPdfBase64: undefined })),
  };
}

export function parsePatientStoreJson(data: unknown): PatientStore | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.docs) || !o.profile || typeof o.profile !== "object") return null;
  return data as PatientStore;
}
