import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@netrunner/shared", "@netrunner/engine", "@netrunner/ai"]
};

export default nextConfig;
