import type { MetadataRoute } from "next";
import { canonicalAppUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms"],
      disallow: [
        "/api/",
        "/chat",
        "/dashboard",
        "/docs/",
        "/health-log",
        "/login",
        "/onboarding",
        "/profile",
        "/upload",
      ],
    },
    sitemap: new URL("/sitemap.xml", canonicalAppUrl()).toString(),
    host: canonicalAppUrl().origin,
  };
}
