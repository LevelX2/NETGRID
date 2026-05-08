import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@netgrid/shared", "@netgrid/engine", "@netgrid/ai"]
};

export default nextConfig;
