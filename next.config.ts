import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Turbopack walks up for lockfiles; a stray `~/package-lock.json` can steal the inferred root. */
  turbopack: {
    root: process.cwd(),
  },
  // Prisma is also in Next’s default list; keeping this explicit avoids bundling issues on Vercel.
  serverExternalPackages: ["@prisma/client", "prisma"],
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
