export type NormalizedIdentifier =
  | { kind: "email"; key: string; display: string }
  | { kind: "phone"; key: string; display: string; e164: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function looksLikeEmail(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  return EMAIL_RE.test(s);
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Digits only for national part; optional leading + stripped from country. */
export function normalizePhoneE164(countryDial: string, nationalDigits: string): string | null {
  const dial = countryDial.trim().startsWith("+") ? countryDial.trim() : `+${countryDial.trim()}`;
  const digits = nationalDigits.replace(/\D/g, "");
  if (!/^\+\d{1,4}$/.test(dial)) return null;
  if (digits.length < 6 || digits.length > 14) return null;
  return `${dial}${digits}`;
}

/**
 * Parse login identifier: email string, or phone with separate country + national fields from client.
 */
export function normalizeLoginIdentifier(
  identifier: string,
  phoneCountryCode?: string,
): NormalizedIdentifier | null {
  const id = identifier.trim();
  if (!id) return null;
  if (looksLikeEmail(id)) {
    const key = normalizeEmail(id);
    return { kind: "email", key: `email:${key}`, display: key };
  }
  const dial = (phoneCountryCode ?? "+1").trim();
  const e164 = normalizePhoneE164(dial, id);
  if (!e164) return null;
  return { kind: "phone", key: `phone:${e164}`, display: e164, e164 };
}

export function sessionClaimsFromNormalized(n: NormalizedIdentifier): { email?: string; phoneE164?: string } {
  if (n.kind === "email") return { email: n.display };
  return { phoneE164: n.e164 };
}
