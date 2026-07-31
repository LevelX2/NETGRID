"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import {
  standardDeckCatalogErrorCategoryLabel,
  standardDeckCatalogStatusView,
  type StandardDeckCatalogState,
} from "../account/standard-deck-catalog-state";

export function StandardDeckCatalogStatus({
  state,
  onRetry,
}: {
  state: StandardDeckCatalogState;
  onRetry(): void;
}) {
  const view = standardDeckCatalogStatusView(state);
  if (!view.visible) return null;

  const error = state.lastError;
  const stale = state.hasUsableCatalog && error !== undefined;
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
        <strong>{view.title}</strong>
      </div>
      <p>{view.description}</p>
      {error ? (
        <div className="standardDeckCatalogStatusActions">
          <button
            className="button"
            type="button"
            onClick={onRetry}
            disabled={state.refreshing}
          >
            <RefreshCw size={15} aria-hidden="true" />
            {state.refreshing ? "Wird geladen …" : "Standarddecks erneut laden"}
          </button>
          <details>
            <summary>Diagnosedaten</summary>
            <dl>
              <div>
                <dt>Server</dt>
                <dd>{error.serverOrigin}</dd>
              </div>
              <div>
                <dt>Zeitpunkt</dt>
                <dd>{error.occurredAt}</dd>
              </div>
              <div>
                <dt>Versuch</dt>
                <dd>{error.attempt}</dd>
              </div>
              <div>
                <dt>Kategorie</dt>
                <dd>{standardDeckCatalogErrorCategoryLabel(error.category)}</dd>
              </div>
              {error.status !== undefined ? (
                <div>
                  <dt>HTTP-Status</dt>
                  <dd>{error.status}</dd>
                </div>
              ) : null}
              <div>
                <dt>Fehlercode</dt>
                <dd>{error.code}</dd>
              </div>
            </dl>
          </details>
        </div>
      ) : null}
      {view.showRecoveryHint ? (
        <small>
          Wenn der Fehler nach einem Seitenreload bleibt, starte den lokalen
          Webclient über den regulären NETGRID-Startpfad neu.
        </small>
      ) : null}
    </section>
  );
}
