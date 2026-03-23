import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@afenda/ui-core",
    "@afenda/view-engine",
    "@afenda/erp-view-pack",
    "@afenda/db",
  ],
};

export default nextConfig;
