"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslations } from "use-intl/react";

import { type StandardDeckCatalogState } from "../account/standard-deck-catalog-state";

export function StandardDeckCatalogStatus({
  state,
  onRetry,
}: {
  state: StandardDeckCatalogState;
  onRetry(): void;
}) {
  const t = useTranslations("MatchStart.catalogStatus");
  if (
    state.phase === "ready" &&
    !state.refreshing &&
    state.lastError === undefined
  )
    return null;

  const error = state.lastError;
  const stale = state.hasUsableCatalog && error !== undefined;
  const title = error
    ? stale
      ? t("staleTitle")
      : t("errorTitle")
    : state.refreshing && state.hasUsableCatalog
      ? t("refreshingTitle")
      : t("loadingTitle");
  const description = error
    ? stale
      ? t("staleDescription")
      : t("errorDescription")
    : t("loadingDescription");
  return (
    <section
      className={`standardDeckCatalogStatus ${error ? "error" : "loading"}`}
      aria-live="polite"
      {...(error && !stale ? { role: "alert" } : {})}
      data-testid="standard-deck-catalog-status"
    >
      <div className="standardDeckCatalogStatusHeading">
        {error ? (
          <AlertTriangle size={17} aria-hidden="true" />
        ) : (
          <RefreshCw size={17} aria-hidden="true" />
        )}
        <strong>{title}</strong>
      </div>
      <p>{description}</p>
      {error ? (
        <div className="standardDeckCatalogStatusActions">
          <button
            className="button"
            type="button"
            onClick={onRetry}
            disabled={state.refreshing}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {state.refreshing ? t("loading") : t("retry")}
          </button>
          <details>
            <summary>{t("diagnostics")}</summary>
            <dl>
              <div>
                <dt>Server</dt>
                <dd>{error.serverOrigin}</dd>
              </div>
              <div>
                <dt>{t("time")}</dt>
                <dd>{error.occurredAt}</dd>
              </div>
              <div>
                <dt>{t("attempt")}</dt>
                <dd>{error.attempt}</dd>
              </div>
              <div>
                <dt>{t("category")}</dt>
                <dd>{t(`errorCategory.${error.category}`)}</dd>
              </div>
              {error.status !== undefined ? (
                <div>
                  <dt>HTTP-Status</dt>
                  <dd>{error.status}</dd>
                </div>
              ) : null}
              <div>
                <dt>{t("errorCode")}</dt>
                <dd>{error.code}</dd>
              </div>
            </dl>
          </details>
        </div>
      ) : null}
      {error !== undefined && state.attempt >= 2 ? (
        <small>{t("recoveryHint")}</small>
      ) : null}
    </section>
  );
}
