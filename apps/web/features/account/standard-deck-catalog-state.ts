import type { DeckSnapshot } from "../decks/deck-api-types";
import { ACCOUNT_SERVER_HTTP, AccountClientError } from "./account-client";
import { loadStandardDecks, type StandardDeck } from "./account-deck-client";

export const STANDARD_DECK_CATALOG_TIMEOUT_MS = 8_000;

export type StandardDeckCatalogPayload = {
  catalog: {
    decks: StandardDeck[];
    snapshots: DeckSnapshot[];
  };
};

export type StandardDeckCatalogErrorCategory =
  | "http"
  | "network"
  | "timeout"
  | "invalid_payload";

export type StandardDeckCatalogDiagnostic = {
  category: StandardDeckCatalogErrorCategory;
  code: string;
  serverOrigin: string;
  occurredAt: string;
  attempt: number;
  status?: number;
};

export type StandardDeckCatalogState = {
  phase: "loading" | "ready" | "error";
  attempt: number;
  refreshing: boolean;
  hasUsableCatalog: boolean;
  loadedAt?: string;
  lastError?: StandardDeckCatalogDiagnostic;
};

export const INITIAL_STANDARD_DECK_CATALOG_STATE: StandardDeckCatalogState = {
  phase: "loading",
  attempt: 0,
  refreshing: false,
  hasUsableCatalog: false,
};

export class StandardDeckCatalogTimeoutError extends Error {
  constructor() {
    super("standard_deck_catalog_timeout");
    this.name = "StandardDeckCatalogTimeoutError";
  }
}

export class StandardDeckCatalogPayloadError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "StandardDeckCatalogPayloadError";
  }
}

export function beginStandardDeckCatalogLoad(
  state: StandardDeckCatalogState,
  attempt: number,
): StandardDeckCatalogState {
  return {
    ...state,
    phase: state.hasUsableCatalog ? "ready" : "loading",
    attempt,
    refreshing: true,
  };
}

export function completeStandardDeckCatalogLoad(
  state: StandardDeckCatalogState,
  loadedAt: string,
): StandardDeckCatalogState {
  const stateWithoutError = { ...state };
  delete stateWithoutError.lastError;
  return {
    ...stateWithoutError,
    phase: "ready",
    refreshing: false,
    hasUsableCatalog: true,
    loadedAt,
  };
}

export function failStandardDeckCatalogLoad(
  state: StandardDeckCatalogState,
  diagnostic: StandardDeckCatalogDiagnostic,
): StandardDeckCatalogState {
  return {
    ...state,
    phase: state.hasUsableCatalog ? "ready" : "error",
    refreshing: false,
    lastError: diagnostic,
  };
}

export async function requestStandardDeckCatalog(
  load: (signal: AbortSignal) => Promise<StandardDeckCatalogPayload> = (
    signal,
  ) => loadStandardDecks(fetch, signal),
  timeoutMs = STANDARD_DECK_CATALOG_TIMEOUT_MS,
): Promise<StandardDeckCatalogPayload> {
  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new StandardDeckCatalogTimeoutError());
    }, timeoutMs);
  });
  try {
    const payload = await Promise.race([load(controller.signal), timeout]);
    return validateStandardDeckCatalogPayload(payload);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export function validateStandardDeckCatalogPayload(
  payload: StandardDeckCatalogPayload,
): StandardDeckCatalogPayload {
  if (
    !payload?.catalog ||
    !Array.isArray(payload.catalog.decks) ||
    !Array.isArray(payload.catalog.snapshots)
  ) {
    throw new StandardDeckCatalogPayloadError(
      "standard_deck_catalog_shape_invalid",
    );
  }
  const validRunner = payload.catalog.snapshots.some(
    (snapshot) =>
      snapshot.side === "runner" && snapshot.validation?.ok === true,
  );
  const validCorp = payload.catalog.snapshots.some(
    (snapshot) => snapshot.side === "corp" && snapshot.validation?.ok === true,
  );
  if (!validRunner || !validCorp) {
    throw new StandardDeckCatalogPayloadError(
      "standard_deck_catalog_missing_playable_side",
    );
  }
  return payload;
}

export function standardDeckCatalogDiagnostic(
  error: unknown,
  attempt: number,
  occurredAt: string,
  serverHttp = ACCOUNT_SERVER_HTTP,
): StandardDeckCatalogDiagnostic {
  const serverOrigin = standardDeckCatalogServerOrigin(serverHttp);
  if (error instanceof StandardDeckCatalogTimeoutError) {
    return {
      category: "timeout",
      code: "standard_deck_catalog_timeout",
      serverOrigin,
      occurredAt,
      attempt,
    };
  }
  if (error instanceof StandardDeckCatalogPayloadError) {
    return {
      category: "invalid_payload",
      code: error.code,
      serverOrigin,
      occurredAt,
      attempt,
    };
  }
  if (error instanceof AccountClientError) {
    return {
      category: "http",
      code: error.code,
      status: error.status,
      serverOrigin,
      occurredAt,
      attempt,
    };
  }
  return {
    category: "network",
    code: "standard_deck_catalog_network_error",
    serverOrigin,
    occurredAt,
    attempt,
  };
}

export function standardDeckCatalogServerOrigin(serverHttp: string): string {
  try {
    return new URL(serverHttp).origin;
  } catch {
    return "Unbekannt";
  }
}

export function standardDeckCatalogBlocksSources(
  state: Pick<StandardDeckCatalogState, "hasUsableCatalog">,
  sources: Array<"snapshot" | "local" | "random_standard">,
): boolean {
  return (
    !state.hasUsableCatalog && sources.some((source) => source !== "local")
  );
}

export function standardDeckCatalogErrorCategoryLabel(
  category: StandardDeckCatalogErrorCategory,
): string {
  switch (category) {
    case "http":
      return "Serverantwort fehlgeschlagen";
    case "timeout":
      return "Zeitüberschreitung";
    case "invalid_payload":
      return "Katalogantwort unvollständig";
    default:
      return "Netzwerkfehler";
  }
}

export function standardDeckCatalogStatusView(
  state: StandardDeckCatalogState,
): {
  visible: boolean;
  title: string;
  description: string;
  showRecoveryHint: boolean;
} {
  const error = state.lastError;
  if (state.phase === "ready" && !state.refreshing && error === undefined) {
    return {
      visible: false,
      title: "",
      description: "",
      showRecoveryHint: false,
    };
  }
  const stale = state.hasUsableCatalog && error !== undefined;
  return {
    visible: true,
    title: error
      ? stale
        ? "Standarddeck-Katalog konnte nicht aktualisiert werden"
        : "Standarddecks konnten nicht geladen werden"
      : state.refreshing && state.hasUsableCatalog
        ? "Standarddecks werden aktualisiert"
        : "Standarddecks werden geladen",
    description: error
      ? stale
        ? "Der zuletzt erfolgreich geladene Stand bleibt verfügbar."
        : "Standard- und Zufallsstandard-Decks sind derzeit nicht verfügbar. Persönliche Decks bleiben nutzbar."
      : "Die öffentliche Deckauswahl wird vorbereitet.",
    showRecoveryHint: error !== undefined && state.attempt >= 2,
  };
}
