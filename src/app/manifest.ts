import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UMA — Ur Medical Assistant",
    short_name: "UMA",
    description: "A synthetic-data beta for organising and understanding demo health records.",
    start_url: "/",
    display: "standalone",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
