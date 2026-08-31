/**
 * Database-backed rate limiter — fixes VULN-007.
 *
 * The previous in-memory Map resets on every serverless cold start (Vercel spins
 * up fresh isolates per request), meaning the 8 req/hour limit effectively didn't
 * apply in production. This version stores counters in Postgres so all instances
 * share the same state.
 *
 * Uses an upsert with atomic increment to avoid race conditions.
 * Fails closed by default when the database is unavailable. Callers may opt
 * into fail-open only for non-sensitive, non-billable operations.
 */

import { prisma } from "@/lib/prisma";

/**
 * Check and increment a rate limit bucket in the database.
 *
 * @param key       Unique key identifying this rate limit bucket (e.g. "otp-req:1.2.3.4")
 * @param max       Maximum requests allowed in the window
 * @param windowMs  Window size in milliseconds
 * @returns true if the request is allowed, false if the rate limit is exceeded
 */
export async function checkRateLimitDb(
  key: string,
  max: number,
  windowMs: number,
  options: { failOpen?: boolean } = {},
): Promise<boolean> {
  const now = new Date();
  try {
    // Use a transaction to atomically check + increment the counter.
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimit.findUnique({ where: { key } });

      if (!existing || existing.windowEnd < now) {
        // No record, or window has expired — start a fresh window
        await tx.rateLimit.upsert({
          where: { key },
          create: {
            key,
            count: 1,
            windowEnd: new Date(now.getTime() + windowMs),
          },
          update: {
            count: 1,
            windowEnd: new Date(now.getTime() + windowMs),
          },
        });
        return true; // first request in new window — always allow
      }

      if (existing.count >= max) {
        return false; // over limit
      }

      // Within window and under limit — increment
      await tx.rateLimit.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
      return true;
    });

    return result;
  } catch (err) {
    console.error("[RateLimit] DB error:", err instanceof Error ? err.message : "unknown");
    return options.failOpen === true;
  }
}

/**
 * Convenience: clean up expired rate limit rows.
 * Call this occasionally (e.g. from a cron job or lazily in a background task)
 * to prevent the table from growing unbounded.
 */
export async function pruneExpiredRateLimits(): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { windowEnd: { lt: new Date() } } });
  } catch {
    // Non-critical — ignore errors in cleanup
  }
}
