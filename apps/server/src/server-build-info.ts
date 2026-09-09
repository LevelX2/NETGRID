import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  isServerBuildInfo,
  NETGRID_PRODUCT_VERSION,
  type ServerBuildInfo,
} from "@netgrid/shared";

export function readServerBuildInfo({
  embedded = process.env.NETGRID_SERVER_BUILD_INFO,
  startedAt = new Date().toISOString(),
  readGit = (args: string[]) =>
    execFileSync("git", args, {
      cwd: fileURLToPath(new URL("../../../", import.meta.url)),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim(),
}: {
  embedded?: string | undefined;
  startedAt?: string;
  readGit?: (args: string[]) => string;
} = {}): ServerBuildInfo {
  let metadata: unknown;
  if (embedded !== undefined) {
    metadata = JSON.parse(embedded);
  } else {
    try {
      metadata = {
        buildNumber: readGit(["rev-list", "--count", "HEAD"]),
        commit: readGit(["rev-parse", "--short=9", "HEAD"]),
        sourceDate: readGit(["show", "-s", "--format=%cI", "HEAD"]),
        dirty: readGit(["status", "--porcelain"]).length > 0,
      };
    } catch {
      return {
        productVersion: NETGRID_PRODUCT_VERSION,
        buildNumber: null,
        commit: null,
        sourceDate: null,
        dirty: null,
        source: "unavailable",
        startedAt,
      };
    }
  }
  const build = {
    ...(metadata && typeof metadata === "object" ? metadata : {}),
    productVersion: NETGRID_PRODUCT_VERSION,
    source: embedded === undefined ? "git" : "embedded",
    startedAt,
  };
  if (!isServerBuildInfo(build))
    throw new Error("server_build_metadata_invalid");
  // Deliberate allowlist: environment/file metadata must never add paths or secrets.
  return {
    productVersion: build.productVersion,
    buildNumber: build.buildNumber,
    commit: build.commit,
    sourceDate: build.sourceDate,
    dirty: build.dirty,
    source: build.source,
    startedAt: build.startedAt,
  };
}

// Capture once in the loaded process; /health must not describe later disk edits.
export const SERVER_BUILD_INFO = readServerBuildInfo();
