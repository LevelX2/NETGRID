import {
  DEMO_DECKS,
  type DeckDefinition,
  type DeckPublicMetadata,
  type Side,
} from "@netgrid/shared";
import type { AiSimulationConfig } from "./ai-simulation-config";
import type {
  AiBenchmarkDeckReference,
  AiBenchmarkDeckSlotDefinition,
} from "./benchmark-deck-types";
import {
  benchmarkDeckFromFrozenLocalSnapshot,
  benchmarkDeckFromSnapshot,
} from "./benchmark-deck-snapshot-resolver";
import { benchmarkDeckFromLocalEditableDeck } from "./benchmark-local-editable-deck-resolver";

export function resolveBenchmarkDeckSlot(slot: AiBenchmarkDeckSlotDefinition):
  | {
      ok: true;
      config: Partial<
        Pick<
          AiSimulationConfig,
          | "runnerDeckId"
          | "corpDeckId"
          | "runnerDeck"
          | "corpDeck"
          | "runnerDeckMetadata"
          | "corpDeckMetadata"
        >
      >;
    }
  | { ok: false; reason: string } {
  const runner = resolveBenchmarkDeckReference(slot.runner, "runner");
  const corp = resolveBenchmarkDeckReference(slot.corp, "corp");
  if (!runner.ok || !corp.ok) {
    return {
      ok: false,
      reason: [
        ...(!runner.ok ? [runner.reason] : []),
        ...(!corp.ok ? [corp.reason] : []),
      ].join(" | "),
    };
  }
  const resolvedConfig: Partial<
    Pick<
      AiSimulationConfig,
      | "runnerDeckId"
      | "corpDeckId"
      | "runnerDeck"
      | "corpDeck"
      | "runnerDeckMetadata"
      | "corpDeckMetadata"
    >
  > = {};
  if (runner.kind === "runtime_deck_id")
    resolvedConfig.runnerDeckId = runner.deckId as NonNullable<
      AiSimulationConfig["runnerDeckId"]
    >;
  else {
    resolvedConfig.runnerDeck = runner.deck;
    resolvedConfig.runnerDeckMetadata = runner.metadata;
  }
  if (corp.kind === "runtime_deck_id")
    resolvedConfig.corpDeckId = corp.deckId as NonNullable<
      AiSimulationConfig["corpDeckId"]
    >;
  else {
    resolvedConfig.corpDeck = corp.deck;
    resolvedConfig.corpDeckMetadata = corp.metadata;
  }
  return {
    ok: true,
    config: resolvedConfig,
  };
}

function resolveBenchmarkDeckReference(
  reference: AiBenchmarkDeckReference,
  expectedSide: Side,
):
  | { ok: true; kind: "runtime_deck_id"; deckId: string }
  | {
      ok: true;
      kind: "snapshot";
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
    }
  | {
      ok: true;
      kind: "frozen_local_snapshot";
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
    }
  | {
      ok: true;
      kind: "local_editable_deck";
      deck: DeckDefinition;
      metadata: DeckPublicMetadata;
    }
  | { ok: false; reason: string } {
  if (reference.kind === "pending_real_scene") {
    return { ok: false, reason: `Pending real scene deck: ${reference.label}` };
  }
  if (reference.kind === "runtime_deck_id") {
    const deck = DEMO_DECKS[reference.deckId as keyof typeof DEMO_DECKS];
    if (!deck)
      return {
        ok: false,
        reason: `Runtime-Deck nicht gefunden: ${reference.deckId}`,
      };
    if (deck.side !== expectedSide)
      return {
        ok: false,
        reason: `Runtime-Deck ${reference.deckId} hat falsche Seite ${deck.side}.`,
      };
    return { ok: true, kind: "runtime_deck_id", deckId: reference.deckId };
  }
  if (reference.kind === "local_editable_deck") {
    const localDeck = benchmarkDeckFromLocalEditableDeck(reference);
    if (!localDeck.ok)
      return {
        ok: false,
        reason: `${reference.expectedName}: ${localDeck.classification}: ${localDeck.reason}`,
      };
    if (localDeck.deck.side !== expectedSide)
      return {
        ok: false,
        reason: `Local Deck-Editor deck ${reference.localDeckId} hat falsche Seite ${localDeck.deck.side}.`,
      };
    return {
      ok: true,
      kind: "local_editable_deck",
      deck: localDeck.deck,
      metadata: localDeck.metadata,
    };
  }
  if (reference.kind === "frozen_local_snapshot") {
    try {
      const snapshot = benchmarkDeckFromFrozenLocalSnapshot(
        reference.snapshotId,
      );
      if (snapshot.deck.side !== expectedSide)
        return {
          ok: false,
          reason: `Frozen local snapshot ${reference.snapshotId} hat falsche Seite ${snapshot.deck.side}.`,
        };
      return {
        ok: true,
        kind: "frozen_local_snapshot",
        deck: snapshot.deck,
        metadata: snapshot.metadata,
      };
    } catch (error) {
      return {
        ok: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }
  try {
    const snapshot = benchmarkDeckFromSnapshot(reference.snapshotId);
    if (snapshot.deck.side !== expectedSide)
      return {
        ok: false,
        reason: `Snapshot ${reference.snapshotId} hat falsche Seite ${snapshot.deck.side}.`,
      };
    return {
      ok: true,
      kind: "snapshot",
      deck: snapshot.deck,
      metadata: snapshot.metadata,
    };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
