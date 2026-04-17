/**
 * In-memory rate limiter.
 *
 * Note (VULN-007): On serverless platforms (Vercel) each cold-start isolate has its own
 * empty map, so this limiter is NOT reliable across distributed deployments. It provides
 * a best-effort defence on single-process and long-running deployments only. For production
 * serverless use, replace with a database or Redis-backed counter.
 */

const DEFAULT_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_RATE_MAX = 8;

const rateBucket = new Map<string, { count: number; resetAt: number }>();

/**
 * Check and increment a rate limit bucket.
 * @param ipKey     Unique key (e.g. "otp:1.2.3.4")
 * @param max       Max allowed requests within the window (default: 8)
 * @param windowMs  Window size in milliseconds (default: 1 hour)
 * @returns true if the request is allowed, false if rate limit exceeded
 */
export function checkOtpRateLimit(
  ipKey: string,
  max: number = DEFAULT_RATE_MAX,
  windowMs: number = DEFAULT_RATE_WINDOW_MS,
): boolean {
  const now = Date.now();
  const b = rateBucket.get(ipKey);
  if (!b || now > b.resetAt) {
    rateBucket.set(ipKey, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}
