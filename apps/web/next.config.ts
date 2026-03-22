import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@afenda/ui", "@afenda/db"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
