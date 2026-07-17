import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

function gitValue(args: string[], fallback: string): string {
  try {
    const value = execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

const gitStatus = gitValue(["status", "--porcelain"], "");

const allowedDevOrigins = (process.env.NETGRID_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0);

const nextConfig: NextConfig = {
  transpilePackages: ["@netgrid/shared", "@netgrid/engine", "@netgrid/ai"],
  env: {
    NEXT_PUBLIC_NETGRID_BUILD_NUMBER: gitValue(
      ["rev-list", "--count", "HEAD"],
      "lokal",
    ),
    NEXT_PUBLIC_NETGRID_BUILD_COMMIT: gitValue(
      ["rev-parse", "--short=9", "HEAD"],
      "nicht verfügbar",
    ),
    NEXT_PUBLIC_NETGRID_BUILD_SOURCE_DATE: gitValue(
      ["show", "-s", "--format=%cI", "HEAD"],
      "",
    ),
    NEXT_PUBLIC_NETGRID_BUILD_DIRTY: String(gitStatus.length > 0),
  },
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
