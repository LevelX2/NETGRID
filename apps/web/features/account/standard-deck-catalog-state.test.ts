import { afterEach, describe, expect, it, vi } from "vitest";

import { AccountClientError } from "./account-client";
import {
  INITIAL_STANDARD_DECK_CATALOG_STATE,
  StandardDeckCatalogPayloadError,
  beginStandardDeckCatalogLoad,
  completeStandardDeckCatalogLoad,
  failStandardDeckCatalogLoad,
  requestStandardDeckCatalog,
  standardDeckCatalogBlocksSources,
  standardDeckCatalogDiagnostic,
  standardDeckCatalogStatusView,
  validateStandardDeckCatalogPayload,
  type StandardDeckCatalogPayload,
} from "./standard-deck-catalog-state";

afterEach(() => {
  vi.useRealTimers();
});

describe("standard deck catalog state", () => {
  it("accepts a catalog only when both sides have a valid snapshot", () => {
    const payload = catalogPayload();
    expect(validateStandardDeckCatalogPayload(payload)).toBe(payload);

    expect(() =>
      validateStandardDeckCatalogPayload({
        catalog: {
          decks: payload.catalog.decks,
          snapshots: payload.catalog.snapshots.filter(
            (snapshot) => snapshot.side === "runner",
          ),
        },
      }),
    ).toThrowError(StandardDeckCatalogPayloadError);
  });

  it("preserves a previously usable catalog when a refresh fails", () => {
    const loading = beginStandardDeckCatalogLoad(
      INITIAL_STANDARD_DECK_CATALOG_STATE,
      1,
    );
    const ready = completeStandardDeckCatalogLoad(
      loading,
      "2026-07-31T20:00:00.000Z",
    );
    const refreshing = beginStandardDeckCatalogLoad(ready, 2);
    const failed = failStandardDeckCatalogLoad(
      refreshing,
      standardDeckCatalogDiagnostic(
        new TypeError("secret browser detail"),
        2,
        "2026-07-31T20:01:00.000Z",
        "http://127.0.0.1:8787/private/path",
      ),
    );

    expect(failed).toMatchObject({
      phase: "ready",
      refreshing: false,
      hasUsableCatalog: true,
      loadedAt: "2026-07-31T20:00:00.000Z",
      lastError: {
        category: "network",
        serverOrigin: "http://127.0.0.1:8787",
        attempt: 2,
      },
    });
    expect(JSON.stringify(failed)).not.toContain("secret browser detail");
  });

  it("classifies HTTP failures without retaining response messages", () => {
    const diagnostic = standardDeckCatalogDiagnostic(
      new AccountClientError(
        "standard_catalog_failed",
        "sensitive response detail",
        503,
      ),
      1,
      "2026-07-31T20:00:00.000Z",
    );
    expect(diagnostic).toMatchObject({
      category: "http",
      code: "standard_catalog_failed",
      status: 503,
    });
    expect(JSON.stringify(diagnostic)).not.toContain(
      "sensitive response detail",
    );
  });

  it("turns a hanging request into a timeout and ignores its late result", async () => {
    vi.useFakeTimers();
    const pending = requestStandardDeckCatalog(
      () => new Promise<StandardDeckCatalogPayload>(() => undefined),
      50,
    );
    const rejected = expect(pending).rejects.toMatchObject({
      name: "StandardDeckCatalogTimeoutError",
    });
    await vi.advanceTimersByTimeAsync(50);
    await rejected;
  });

  it("blocks only standard-backed starts while no usable catalog exists", () => {
    expect(
      standardDeckCatalogBlocksSources(INITIAL_STANDARD_DECK_CATALOG_STATE, [
        "snapshot",
        "local",
      ]),
    ).toBe(true);
    expect(
      standardDeckCatalogBlocksSources(INITIAL_STANDARD_DECK_CATALOG_STATE, [
        "local",
        "local",
      ]),
    ).toBe(false);
    expect(
      standardDeckCatalogBlocksSources({ hasUsableCatalog: true }, [
        "random_standard",
        "snapshot",
      ]),
    ).toBe(false);
  });

  it("distinguishes initial failure, stale data and a healthy settled state", () => {
    const initialError = failStandardDeckCatalogLoad(
      beginStandardDeckCatalogLoad(INITIAL_STANDARD_DECK_CATALOG_STATE, 2),
      standardDeckCatalogDiagnostic(
        new TypeError("offline"),
        2,
        "2026-07-31T20:00:00.000Z",
      ),
    );
    expect(standardDeckCatalogStatusView(initialError)).toMatchObject({
      visible: true,
      title: "Standarddecks konnten nicht geladen werden",
      description: expect.stringContaining("Persönliche Decks bleiben nutzbar"),
      showRecoveryHint: true,
    });

    const ready = completeStandardDeckCatalogLoad(
      beginStandardDeckCatalogLoad(INITIAL_STANDARD_DECK_CATALOG_STATE, 1),
      "2026-07-31T20:00:00.000Z",
    );
    expect(standardDeckCatalogStatusView(ready)).toMatchObject({
      visible: false,
    });
    const stale = failStandardDeckCatalogLoad(
      beginStandardDeckCatalogLoad(ready, 2),
      standardDeckCatalogDiagnostic(
        new TypeError("offline"),
        2,
        "2026-07-31T20:01:00.000Z",
      ),
    );
    expect(standardDeckCatalogStatusView(stale)).toMatchObject({
      title: "Standarddeck-Katalog konnte nicht aktualisiert werden",
      description: "Der zuletzt erfolgreich geladene Stand bleibt verfügbar.",
    });
  });
});

function catalogPayload(): StandardDeckCatalogPayload {
  return {
    catalog: {
      decks: [
        {
          standardDeckId: "standard_runner",
          version: "1.0.0",
          status: "active",
          name: "Runner Standard",
          side: "runner",
          identityCardId: "runner_identity_001",
          cardPoolSnapshotId: "card-snapshot-0.8",
          formatProfileId: "netgrid_private_local_v1",
          cards: [],
        },
      ],
      snapshots: [
        snapshot("runner", "runner_snapshot"),
        snapshot("corp", "corp_snapshot"),
      ],
    },
  };
}

function snapshot(side: "runner" | "corp", deckSnapshotId: string) {
  return {
    deckSnapshotId,
    side,
    validation: { ok: true },
  } as StandardDeckCatalogPayload["catalog"]["snapshots"][number];
}
