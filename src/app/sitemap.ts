import type { MetadataRoute } from "next";
import { canonicalAppUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = canonicalAppUrl();
  const lastModified = new Date("2026-07-10T00:00:00.000Z");
  return [
    { url: new URL("/", base).toString(), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: new URL("/privacy", base).toString(), lastModified, changeFrequency: "monthly", priority: 0.4 },
    { url: new URL("/terms", base).toString(), lastModified, changeFrequency: "monthly", priority: 0.4 },
  ];
}
