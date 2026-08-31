const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
} as const;

export function sensitiveResponseHeaders(): Record<string, string> {
  return { ...NO_STORE_HEADERS };
}

export function requestClientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const values = forwarded.split(",").map((value) => value.trim()).filter(Boolean);
  return (values.at(-1) ?? "unknown").slice(0, 128);
}

/**
 * Browser mutations must originate from this deployment or the canonical app.
 * Native/server clients commonly omit Origin; explicit cross-site browser
 * requests are always rejected.
 */
export function hasTrustedMutationOrigin(req: Request): boolean {
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(req.url).origin);
  } catch {
    return false;
  }
  const canonical = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (canonical) {
    try {
      allowed.add(new URL(canonical).origin);
    } catch {
      // Invalid configuration must not broaden the allowlist.
    }
  }
  return allowed.has(origin);
}

export function exceedsDeclaredBodySize(req: Request, maxBytes: number): boolean {
  const raw = req.headers.get("content-length");
  if (!raw) return false;
  const length = Number(raw);
  return Number.isFinite(length) && length > maxBytes;
}
