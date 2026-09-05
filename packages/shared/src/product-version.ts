export const NETGRID_PRODUCT_VERSION = "1.0";

export type ServerBuildInfo = {
  productVersion: string;
  buildNumber: string | null;
  commit: string | null;
  sourceDate: string | null;
  dirty: boolean | null;
  source: "git" | "embedded" | "unavailable";
  startedAt: string;
};

export function isServerBuildInfo(value: unknown): value is ServerBuildInfo {
  if (!value || typeof value !== "object") return false;
  const build = value as Record<string, unknown>;
  if (
    typeof build.productVersion !== "string" ||
    typeof build.startedAt !== "string" ||
    !Number.isFinite(Date.parse(build.startedAt))
  )
    return false;
  if (build.source === "unavailable")
    return (
      build.buildNumber === null &&
      build.commit === null &&
      build.sourceDate === null &&
      build.dirty === null
    );
  return (
    (build.source === "git" || build.source === "embedded") &&
    typeof build.buildNumber === "string" &&
    /^\d+$/.test(build.buildNumber) &&
    typeof build.commit === "string" &&
    /^[0-9a-f]{7,40}$/.test(build.commit) &&
    typeof build.sourceDate === "string" &&
    Number.isFinite(Date.parse(build.sourceDate)) &&
    typeof build.dirty === "boolean"
  );
}
