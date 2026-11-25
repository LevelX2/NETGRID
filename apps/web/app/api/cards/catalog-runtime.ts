import { assertCatalogPayloadSafe } from "@netgrid/catalog";
import {
  TEST_CARD_SET_ID,
  testCardsEnabledFromEnvironment,
} from "@netgrid/shared";

import type {
  CatalogCardList,
  CatalogDeckCard,
  CatalogPresentationCard,
} from "../../../features/catalog/catalog-types";
import { createRuntimeCardPool } from "../card-pool-runtime";

const catalogRuntimes = new Map<
  boolean,
  ReturnType<typeof createRuntimeCardPool>
>();

export function createCatalogRuntime() {
  const testCardsEnabled = testCardsEnabledFromEnvironment(process.env);
  let runtime = catalogRuntimes.get(testCardsEnabled);
  if (!runtime) {
    runtime = createRuntimeCardPool({
      excludedSetIds: testCardsEnabled ? [] : [TEST_CARD_SET_ID],
    });
    catalogRuntimes.set(testCardsEnabled, runtime);
  }
  return runtime;
}

export function catalogPresentationResponse() {
  const { snapshot, validation } = createCatalogRuntime();
  if (!validation.ok) return invalidCatalog();
  return safeCatalogPayload({
    cards: snapshot.cards.map(({ catalogCardId, title, type, setId }) => ({
      catalogCardId,
      title,
      type,
      setId,
    })),
  } satisfies CatalogCardList<CatalogPresentationCard>);
}

export function catalogDeckCardsResponse() {
  const { snapshot, validation } = createCatalogRuntime();
  if (!validation.ok) return invalidCatalog();
  const cards = snapshot.cards.map(
    (card): CatalogDeckCard => ({
      catalogCardId: card.catalogCardId,
      title: card.title,
      side: card.side,
      type: card.type,
      subtypes: card.subtypes,
      faction: card.faction,
      setId: card.setId,
      setName: card.setName,
      collectorNumber: card.collectorNumber,
      ...(card.rarity ? { rarity: card.rarity } : {}),
      text: card.text,
      numeric: card.numeric,
      statuses: {
        catalog_ready: card.statuses.catalog_ready,
        playable: card.statuses.playable,
        deck_legal: card.statuses.deck_legal,
      },
    }),
  );
  return safeCatalogPayload({ cards });
}

export function invalidCatalog() {
  return safeCatalogError(
    500,
    "catalog_invalid",
    "Katalogdaten sind ungültig.",
  );
}

export function safeCatalogPayload(payload: unknown) {
  const safety = assertCatalogPayloadSafe(payload);
  if (!safety.ok)
    return safeCatalogError(
      500,
      "catalog_payload_unsafe",
      "Katalogantwort wurde aus Sicherheitsgründen blockiert.",
    );
  return { status: 200, body: payload };
}

export function safeCatalogError(
  status: number,
  code: string,
  message: string,
) {
  return { status, body: { error: { code, message } } };
}
