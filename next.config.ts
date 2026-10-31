import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client"],
};

export default nextConfig;
