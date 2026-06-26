import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createRuntimeCardsById } from "@netgrid/catalog";
import {
  buildEngineDeck,
  createDeckSnapshot,
  validateEditableDeck,
  type EditableDeck,
} from "@netgrid/decks";
import type {
  AiBenchmarkDeckReference,
  AiBenchmarkLocalEditableDeckResult,
  AiLocalBenchmarkDeckClassification,
} from "./benchmark-deck-types";
import { BENCHMARK_DECK_FORMAT_PROFILE } from "./benchmark-deck-format-profile";
import { LOCAL_REALISTIC_BENCHMARK_DECKS } from "./benchmark-local-deck-data";
import { classifyLocalEditableBenchmarkDeck } from "./local-editable-benchmark-classification";
import { resolveLocalDeckEditorDecksDir } from "./local-deck-editor-dir";
import { sortedUnique } from "../runtime/collection";

const BENCHMARK_RUNTIME_CARDS_BY_ID = createRuntimeCardsById();

export function benchmarkDeckFromLocalEditableDeck(
  reference: Extract<AiBenchmarkDeckReference, { kind: "local_editable_deck" }>,
): AiBenchmarkLocalEditableDeckResult {
  const filePath = path.join(
    resolveLocalDeckEditorDecksDir({
      ...(reference.baseDir ? { baseDir: reference.baseDir } : {}),
      storage: LOCAL_REALISTIC_BENCHMARK_DECKS.storage,
    }),
    reference.fileName,
  );
  const emptyFailure = (
    classification: AiLocalBenchmarkDeckClassification,
    reason: string,
    validationErrors: string[] = [],
  ): AiBenchmarkLocalEditableDeckResult => ({
    ok: false,
    classification,
    localDeckId: reference.localDeckId,
    expectedName: reference.expectedName,
    filePath,
    reason,
    validationErrors,
    missingCards: [],
    ambiguousNames: [],
    unsupportedCards: [],
    nonDeckLegalCards: [],
  });

  if (!existsSync(filePath)) {
    return emptyFailure(
      "unclear",
      `Local Deck-Editor deck file not found: ${reference.fileName}`,
    );
  }

  let parsed: { schemaVersion?: string; deck?: EditableDeck };
  try {
    parsed = JSON.parse(readFileSync(filePath, "utf8")) as {
      schemaVersion?: string;
      deck?: EditableDeck;
    };
  } catch (error) {
    return emptyFailure(
      "unclear",
      `Local Deck-Editor deck JSON could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (parsed.schemaVersion !== "netgrid-editable-deck-v1" || !parsed.deck) {
    return emptyFailure(
      "unclear",
      `Local Deck-Editor deck ${reference.fileName} has unsupported schema ${parsed.schemaVersion ?? "unknown"}.`,
    );
  }

  const deck = parsed.deck;
  const shapeErrors = [
    ...(deck.deckId !== reference.localDeckId
      ? [
          `Deck ID mismatch: expected ${reference.localDeckId}, got ${deck.deckId}.`,
        ]
      : []),
    ...(deck.name !== reference.expectedName
      ? [
          `Deck name mismatch: expected ${reference.expectedName}, got ${deck.name}.`,
        ]
      : []),
    ...(deck.side !== "runner" && deck.side !== "corp"
      ? [`Deck side is invalid: ${String(deck.side)}.`]
      : []),
    ...(!Array.isArray(deck.cards) || deck.cards.length === 0
      ? ["Deck has no cards."]
      : []),
  ];
  if (shapeErrors.length > 0) {
    return emptyFailure(
      deck.cards?.length === 0 ? "incomplete" : "unclear",
      shapeErrors.join(" | "),
      shapeErrors,
    );
  }

  const missingCards = sortedUnique(
    deck.cards
      .filter((entry) => !BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId])
      .map((entry) => entry.cardId),
  );
  const unsupportedCards = sortedUnique(
    deck.cards
      .filter((entry) => {
        const card = BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId];
        return card && card.statuses.ai_supported !== true;
      })
      .map((entry) => entry.cardId),
  );
  const nonDeckLegalCards = sortedUnique(
    deck.cards
      .filter((entry) => {
        const card = BENCHMARK_RUNTIME_CARDS_BY_ID[entry.cardId];
        return (
          card &&
          (card.statuses.deck_legal !== true ||
            card.statuses.format_legal !== true ||
            card.statuses.human_playable !== true)
        );
      })
      .map((entry) => entry.cardId),
  );
  const validation = validateEditableDeck(deck, {
    cardsById: BENCHMARK_RUNTIME_CARDS_BY_ID,
    profile: BENCHMARK_DECK_FORMAT_PROFILE,
  });
  const validationErrors = [...validation.errors];
  const classification = classifyLocalEditableBenchmarkDeck({
    deck,
    missingCards,
    unsupportedCards,
    nonDeckLegalCards,
    validationErrors,
  });

  if (classification !== "runnable_ai_benchmark") {
    return {
      ok: false,
      classification,
      localDeckId: reference.localDeckId,
      expectedName: reference.expectedName,
      filePath,
      reason:
        [
          ...(missingCards.length > 0
            ? [`missing_cards:${missingCards.join(",")}`]
            : []),
          ...(unsupportedCards.length > 0
            ? [`unsupported_cards:${unsupportedCards.join(",")}`]
            : []),
          ...(nonDeckLegalCards.length > 0
            ? [`non_deck_legal_cards:${nonDeckLegalCards.join(",")}`]
            : []),
          ...validationErrors,
        ].join(" | ") ||
        "Local Deck-Editor deck is not runnable for AI benchmark.",
      validationErrors,
      missingCards,
      ambiguousNames: [],
      unsupportedCards,
      nonDeckLegalCards,
    };
  }

  const snapshot = createDeckSnapshot(
    deck,
    {
      cardsById: BENCHMARK_RUNTIME_CARDS_BY_ID,
      profile: BENCHMARK_DECK_FORMAT_PROFILE,
    },
    {
      snapshotId: `${deck.deckId}_local_benchmark_snapshot_v1`,
      rulesBaselineId: "rules-baseline-mvp-0.4",
    },
  );
  const engineDeck = buildEngineDeck(snapshot);
  return {
    ok: true,
    classification,
    localDeckId: reference.localDeckId,
    expectedName: reference.expectedName,
    filePath,
    deck: {
      id: engineDeck.id,
      name: engineDeck.name,
      side: engineDeck.side,
      identity: engineDeck.identity,
      cards: engineDeck.cards,
    },
    metadata: snapshot.publicMetadata,
    validation: {
      totalCards: snapshot.validation.totalCards,
      agendaPoints: snapshot.validation.agendaPoints,
      ...(snapshot.validation.influenceSpent !== undefined
        ? { influenceSpent: snapshot.validation.influenceSpent }
        : {}),
    },
    missingCards,
    ambiguousNames: [],
    unsupportedCards,
    nonDeckLegalCards,
  };
}
