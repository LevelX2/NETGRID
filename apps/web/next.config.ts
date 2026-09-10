import { execFileSync } from "node:child_process";
import path from "node:path";
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
const repositoryRoot = path.resolve(process.cwd(), "../..");
const releaseBuild = process.env.NETGRID_RELEASE_BUILD === "true";
const releaseCardIndex = process.env.NETGRID_RELEASE_CARD_INDEX;

if (releaseBuild && !releaseCardIndex)
  throw new Error("release_card_index_required");

const nextConfig: NextConfig = {
  distDir: process.env.NETGRID_NEXT_DIST_DIR ?? ".next",
  ...(releaseBuild
    ? { output: "standalone" as const, outputFileTracingRoot: repositoryRoot }
    : {}),
  transpilePackages: [
    "@netgrid/shared",
    "@netgrid/engine",
    "@netgrid/ai",
    "@netgrid/card-images",
    "@netgrid/runtime-data",
  ],
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
  ...(releaseBuild
    ? {
        webpack(config) {
          config.resolve.alias = {
            ...config.resolve.alias,
            [path.resolve(
              repositoryRoot,
              "packages/cards/src/generated/card-spec-import-index",
            )]: releaseCardIndex,
            [path.resolve(
              repositoryRoot,
              "packages/cards/src/generated/card-spec-import-index.ts",
            )]: releaseCardIndex,
            "@netgrid/runtime-data/deck-format-profiles": path.resolve(
              repositoryRoot,
              "packages/runtime-data/src/release-deck-fixtures.ts",
            ),
            "@netgrid/runtime-data/legacy-demo-decks": path.resolve(
              repositoryRoot,
              "packages/runtime-data/src/release-deck-fixtures.ts",
            ),
            [path.resolve(
              repositoryRoot,
              "packages/runtime-data/src/deck-format-profiles.ts",
            )]: path.resolve(
              repositoryRoot,
              "packages/runtime-data/src/release-deck-fixtures.ts",
            ),
            [path.resolve(
              repositoryRoot,
              "packages/runtime-data/src/legacy-demo-decks.ts",
            )]: path.resolve(
              repositoryRoot,
              "packages/runtime-data/src/release-deck-fixtures.ts",
            ),
          };
          return config;
        },
      }
    : {}),
};

export default nextConfig;
