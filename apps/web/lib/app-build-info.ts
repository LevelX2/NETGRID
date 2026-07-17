export const NETGRID_PRODUCT_VERSION = "0.9";

export type AppBuildInfo = {
  productVersion: string;
  buildNumber: string;
  commit: string;
  sourceDate: string;
  dirty: boolean;
  statusLabel: string;
  developmentStatus: string;
};

type AppBuildEnvironment = {
  buildNumber?: string | undefined;
  commit?: string | undefined;
  sourceDate?: string | undefined;
  dirty?: string | undefined;
};

export function createAppBuildInfo(
  environment: AppBuildEnvironment,
): AppBuildInfo {
  const buildNumber = normalizedValue(environment.buildNumber, "lokal");
  const commit = normalizedValue(environment.commit, "nicht verfügbar");
  const sourceDate = formatGitCommitDate(environment.sourceDate);
  const dirty = environment.dirty === "true";
  const buildLabel = `${buildNumber}${dirty ? "-dev" : ""}`;

  return {
    productVersion: NETGRID_PRODUCT_VERSION,
    buildNumber,
    commit,
    sourceDate,
    dirty,
    statusLabel: `V${NETGRID_PRODUCT_VERSION} · Build ${buildLabel}`,
    developmentStatus: dirty
      ? "Lokaler Entwicklungsstand mit nicht committeten Änderungen"
      : "Lokaler Entwicklungsstand",
  };
}

function normalizedValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function formatGitCommitDate(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "nicht verfügbar";

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return normalized;

  const [, year, month, day, hour, minute] = match;
  return `${day}.${month}.${year}, ${hour}:${minute} Uhr`;
}

export const NETGRID_BUILD_INFO = createAppBuildInfo({
  buildNumber: process.env.NEXT_PUBLIC_NETGRID_BUILD_NUMBER,
  commit: process.env.NEXT_PUBLIC_NETGRID_BUILD_COMMIT,
  sourceDate: process.env.NEXT_PUBLIC_NETGRID_BUILD_SOURCE_DATE,
  dirty: process.env.NEXT_PUBLIC_NETGRID_BUILD_DIRTY,
});

export const NETGRID_APP_STATUS_LABEL = NETGRID_BUILD_INFO.statusLabel;
