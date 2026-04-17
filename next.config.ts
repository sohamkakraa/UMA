import type { NextConfig } from "next";

// Fixed VULN-008: add HTTP security headers to all responses.
// A medical app handling PHI must have these baseline protections.
const isDev = process.env.NODE_ENV === "development";

const securityHeaders: { key: string; value: string }[] = [
  {
    // Prevent clickjacking — disallow framing in any context
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Prevent MIME-type sniffing attacks
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Don’t send the full URL as Referer to external sites (health data in URL paths)
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Enforce HTTPS for 1 year, including subdomains
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // Restrict browser features — medical app has no need for camera, mic, geolocation etc.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // CSP is skipped in dev: Turbopack injects inline scripts/eval that violate strict CSP,
  // and the combination triggers ERR_INVALID_CHAR in Node.js header validation.
  // In production this header is fully enforced.
  ...(!isDev
    ? [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src ‘self’",
            "script-src ‘self’ ‘unsafe-inline’",
            "style-src ‘self’ ‘unsafe-inline’ https://fonts.googleapis.com",
            "img-src ‘self’ data: blob:",
            "font-src ‘self’ https://fonts.gstatic.com",
            "connect-src ‘self’ https://api.anthropic.com https://api.cloud.llamaindex.ai https://api.resend.com",
            "frame-ancestors ‘none’",
            "base-uri ‘self’",
            "form-action ‘self’",
          ].join("; "),
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Turbopack walks up for lockfiles; a stray `~/package-lock.json` can steal the inferred root. */
  turbopack: {
    root: process.cwd(),
  },
  // Prisma is also in Next’s default list; keeping this explicit avoids bundling issues on Vercel.
  serverExternalPackages: ["@prisma/client", "prisma"],
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logo.svg",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
