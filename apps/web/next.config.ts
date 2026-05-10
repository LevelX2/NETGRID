import type { NextConfig } from "next";

const allowedDevOrigins = (process.env.NETGRID_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0);

const nextConfig: NextConfig = {
  transpilePackages: ["@netgrid/shared", "@netgrid/engine", "@netgrid/ai"],
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {})
};

export default nextConfig;
