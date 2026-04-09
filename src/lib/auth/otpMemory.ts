/** Shared OTP hashing and stable lookup keys (used with database-backed challenges). */

function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)!;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export function hashOtpCode(code: string): string {
  return simpleHash(`uma:otp:${code}`);
}

export function otpStorageKey(normalizedKey: string): string {
  return simpleHash(`uma:key:${normalizedKey}`);
}
