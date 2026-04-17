/**
 * Shared OTP hashing and stable lookup keys (used with database-backed challenges).
 *
 * Security: uses HMAC-SHA256 (via Node crypto) instead of FNV-1a.
 * FNV-1a is a 32-bit non-cryptographic hash — all 1M possible OTP codes can be
 * precomputed and matched against a leaked hash table in milliseconds.
 * HMAC-SHA256 with a server-side salt makes offline brute-force infeasible.
 * Fixed: VULN-004 — replaced FNV-1a with HMAC-SHA256 keyed on AUTH_SECRET.
 */
import { createHmac } from "crypto";

function getHashSalt(): string {
  // Use AUTH_SECRET as HMAC key; fall back to a stable dev-only constant.
  // In production AUTH_SECRET must be set (enforced in sessionToken.ts).
  return process.env.AUTH_SECRET || "uma-dev-hash-salt-do-not-use-in-prod";
}

function hmacSha256(input: string): string {
  return createHmac("sha256", getHashSalt()).update(input).digest("hex");
}

export function hashOtpCode(code: string): string {
  return hmacSha256(`uma:otp:${code}`);
}

export function otpStorageKey(normalizedKey: string): string {
  return hmacSha256(`uma:key:${normalizedKey}`);
}
