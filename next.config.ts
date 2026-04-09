import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Prisma is also in Next’s default list; keeping this explicit avoids bundling issues on Vercel.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
