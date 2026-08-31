import type { PatientStore } from "@/lib/types";
import { z } from "zod";

const UnknownObjectSchema = z.object({}).passthrough();
const ShortStringSchema = z.string().max(2_000);

const DocumentSchema = z
  .object({
    id: z.string().min(1).max(128),
    type: z.string().min(1).max(80),
    title: z.string().min(1).max(500),
    dateISO: z.string().max(64).optional(),
    provider: z.string().max(500).optional(),
    summary: z.string().max(50_000).optional(),
    markdownArtifact: z.string().max(500_000).optional(),
    medications: z.array(UnknownObjectSchema).max(500).default([]),
    labs: z.array(UnknownObjectSchema).max(5_000).default([]),
    tags: z.array(ShortStringSchema).max(200).default([]),
    allergies: z.array(ShortStringSchema).max(200).default([]),
    conditions: z.array(ShortStringSchema).max(200).default([]),
    sections: z.array(UnknownObjectSchema).max(500).default([]),
  })
  .passthrough();

const ProfileSchema = z
  .object({
    name: z.string().max(200).default(""),
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    email: z.string().email().max(320).optional().or(z.literal("")),
    phone: z.string().max(40).optional(),
    notes: z.string().max(20_000).optional(),
    allergies: z.array(ShortStringSchema).max(500).default([]),
    conditions: z.array(ShortStringSchema).max(500).default([]),
    trends: z.array(ShortStringSchema).max(200).default([]),
  })
  .passthrough();

const HealthLogsSchema = z
  .object({
    bloodPressure: z.array(UnknownObjectSchema).max(10_000).default([]),
    sideEffects: z.array(UnknownObjectSchema).max(10_000).default([]),
    medicationIntake: z.array(UnknownObjectSchema).max(20_000).default([]),
    medicationReminders: z.array(UnknownObjectSchema).max(2_000).default([]),
  })
  .passthrough();

export const PatientStoreSchema = z
  .object({
    docs: z.array(DocumentSchema).max(500),
    meds: z.array(UnknownObjectSchema).max(2_000).default([]),
    labs: z.array(UnknownObjectSchema).max(20_000).default([]),
    profile: ProfileSchema,
    preferences: z
      .object({
        theme: z.enum(["dark", "light", "system"]).default("system"),
      })
      .passthrough(),
    notifications: z.array(UnknownObjectSchema).max(5_000).optional(),
    healthLogs: HealthLogsSchema.optional(),
    standardLexicon: z.array(UnknownObjectSchema).max(2_000).optional(),
    insuranceClaims: z.array(UnknownObjectSchema).max(1_000).optional(),
    insurancePlans: z.array(UnknownObjectSchema).max(200).optional(),
    updatedAtISO: z.string().min(1).max(64),
  })
  .passthrough();

/** Drop embedded PDF bytes and sensitive ephemeral fields before syncing to the API.
 *
 * Security: `whatsappVerificationCode` and `whatsappVerificationSentAt` are
 * short-lived OTP fields that live on `profile` in the client-side localStorage
 * store. They must never be persisted verbatim to the database — the server
 * manages WhatsApp verification state on the User row, not in patientRecord.
 */
export function patientStoreForApiPayload(store: PatientStore): PatientStore {
  const { whatsappVerificationCode: _code, whatsappVerificationSentAt: _sentAt, ...safeProfile } =
    store.profile as PatientStore["profile"] & {
      whatsappVerificationCode?: unknown;
      whatsappVerificationSentAt?: unknown;
    };
  return {
    ...store,
    profile: safeProfile as PatientStore["profile"],
    docs: store.docs.map((d) => ({ ...d, originalPdfBase64: undefined })),
  };
}

export function parsePatientStoreJson(data: unknown): PatientStore | null {
  const parsed = PatientStoreSchema.safeParse(data);
  return parsed.success ? (parsed.data as unknown as PatientStore) : null;
}
