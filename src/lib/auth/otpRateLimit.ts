const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 8;

const rateBucket = new Map<string, { count: number; resetAt: number }>();

export function checkOtpRateLimit(ipKey: string): boolean {
  const now = Date.now();
  const b = rateBucket.get(ipKey);
  if (!b || now > b.resetAt) {
    rateBucket.set(ipKey, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (b.count >= RATE_MAX) return false;
  b.count += 1;
  return true;
}
