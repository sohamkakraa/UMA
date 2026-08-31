import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/sessionToken";

const PROTECTED_PREFIXES = ["/dashboard", "/chat", "/body", "/docs", "/upload", "/profile", "/onboarding"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isTrustedApiMutation(req: NextRequest): boolean {
  if (SAFE_METHODS.has(req.method)) return true;
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const allowed = new Set([req.nextUrl.origin]);
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

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/") && !isTrustedApiMutation(req)) {
    return NextResponse.json(
      { ok: false, error: "Cross-site request blocked." },
      { status: 403 },
    );
  }
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/body/:path*",
    "/docs/:path*",
    "/upload/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/api/:path*",
  ],
};
