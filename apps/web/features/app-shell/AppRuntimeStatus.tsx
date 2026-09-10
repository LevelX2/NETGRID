"use client";

import { GitCommitHorizontal, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl/react";
import { NETGRID_BUILD_INFO } from "../../lib/app-build-info";
import {
  serverRuntimeModeFromHealth,
  type ServerRuntimeMode,
} from "../../lib/server-runtime-mode";

const SERVER_HTTP =
  process.env.NEXT_PUBLIC_NETGRID_SERVER_URL ?? "http://127.0.0.1:8787";

export function AppRuntimeStatus({ statusLabel }: { statusLabel: string }) {
  const t = useTranslations("AppShell.runtimeStatus");
  const [runtimeMode, setRuntimeMode] = useState<ServerRuntimeMode>();

  useEffect(() => {
    let active = true;

    const refreshRuntimeMode = async () => {
      try {
        const response = await fetch(`${SERVER_HTTP}/health`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const nextMode = serverRuntimeModeFromHealth(await response.json());
        if (active) setRuntimeMode(nextMode);
      } catch {
        if (active) setRuntimeMode(undefined);
      }
    };

    void refreshRuntimeMode();
    const interval = window.setInterval(refreshRuntimeMode, 5_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="appRuntimeStatus">
      <span className="topbarVersion">{statusLabel}</span>
      {runtimeMode === "watch" ? (
        <span className="topbarModeBadge watch" title={t("watchTitle")}>
          <RefreshCw size={13} aria-hidden="true" />
          {t("watch")}
        </span>
      ) : null}
      {NETGRID_BUILD_INFO.dirty ? (
        <span
          className="topbarModeBadge localChanges"
          title={t("localChangesTitle")}
        >
          <GitCommitHorizontal size={14} aria-hidden="true" />
          {t("localChanges")}
        </span>
      ) : null}
    </div>
  );
}
