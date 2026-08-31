function enabled(value: string | undefined): boolean {
  return value === "1" || value === "true";
}

/** Public build-time feature gates for closed-beta surfaces. */
export const BETA_FEATURES = {
  whatsapp: enabled(process.env.NEXT_PUBLIC_ENABLE_WHATSAPP),
  familyConnections: enabled(process.env.NEXT_PUBLIC_ENABLE_FAMILY_CONNECTIONS),
  insuranceEmail: enabled(process.env.NEXT_PUBLIC_ENABLE_INSURANCE_EMAIL),
  healthKit: enabled(process.env.NEXT_PUBLIC_ENABLE_HEALTHKIT),
} as const;
