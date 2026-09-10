"use client";

import { useEffect, useState } from "react";
import { isServerBuildInfo, type ServerBuildInfo } from "@netgrid/shared";
import { useLocale, useTranslations } from "use-intl/react";
import { NETGRID_BUILD_INFO } from "../../lib/app-build-info";
import { formatAppDateTime } from "../../i18n/format";
import { normalizeAppLocale } from "../../i18n/locale";

export function MaintenanceBuildStatus({ serverHttp }: { serverHttp: string }) {
  const t = useTranslations("Maintenance.storage");
  const locale = normalizeAppLocale(useLocale());
  const [build, setBuild] = useState<ServerBuildInfo | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let closed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const current = new AbortController();
      controller = current;
      const timeout = window.setTimeout(() => current.abort(), 5000);
      try {
        const response = await fetch(`${serverHttp}/health`, {
          cache: "no-store",
          signal: current.signal,
        });
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          !payload ||
          typeof payload !== "object" ||
          !isServerBuildInfo((payload as { build?: unknown }).build)
        )
          throw new Error("server_build_metadata_unavailable");
        if (!closed && current === controller) {
          setBuild((payload as { build: ServerBuildInfo }).build);
          setFailed(false);
        }
      } catch {
        if (!closed && current === controller) {
          setBuild(null);
          setFailed(true);
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };
    const onFocus = () => void refresh();
    onFocus();
    window.addEventListener("focus", onFocus);
    return () => {
      closed = true;
      controller?.abort();
      window.removeEventListener("focus", onFocus);
    };
  }, [serverHttp]);
  const different =
    build?.source !== "unavailable" &&
    build &&
    (build.productVersion !== NETGRID_BUILD_INFO.productVersion ||
      build.buildNumber !== NETGRID_BUILD_INFO.buildNumber ||
      build.commit !== NETGRID_BUILD_INFO.commit);
  return (
    <aside className="maintenanceBuildStatus" aria-label={t("buildVersions")}>
      <span>
        <strong>{t("frontendBuild")}</strong> {NETGRID_BUILD_INFO.statusLabel} ·{" "}
        {NETGRID_BUILD_INFO.commit}
        {NETGRID_BUILD_INFO.dirty ? ` · ${t("buildDirty")}` : ""}
      </span>
      <span>
        <strong>{t("backendBuild")}</strong>{" "}
        {build ? (
          <>
            V{build.productVersion} ·{" "}
            {build.buildNumber
              ? `Build ${build.buildNumber} · ${build.commit}`
              : t("buildUnknown")}
            {build.dirty ? ` · ${t("buildDirty")}` : ""}
            {` · ${t("backendStarted", { time: formatAppDateTime(build.startedAt, locale, { dateStyle: "short", timeStyle: "medium" }) })}`}
          </>
        ) : failed ? (
          t("buildUnavailable")
        ) : (
          t("buildLoading")
        )}
      </span>
      {different ? (
        <span className="maintenanceBuildDifference">
          {t("buildDifferent")}
        </span>
      ) : null}
    </aside>
  );
}
