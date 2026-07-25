import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";

import { RUNTIME_CARDS } from "../../ai-hints";
import type { AiDeckStrategyDeckSnapshot } from "../../deck-strategy-snapshot";

export type CorpIceDensityProfile = {
  confidence: "deck_snapshot" | "unknown";
  initialDeckCount?: number;
  initialIceCount?: number;
  knownCardsOutsideDeck: number;
  knownIceOutsideDeck: number;
  iceInHq: number;
  installedIce: number;
  remainingDeckCount?: number;
  remainingIceCount?: number;
  remainingIceDensity?: number;
  iceDensityClass: "low" | "normal" | "high" | "unknown";
  evidence: string[];
};

type DecisionInputWithOptionalDeckSnapshot = AiDecisionInput & {
  ownDeckSnapshot?: AiDeckStrategyDeckSnapshot;
};

export function buildCorpIceDensityProfile(
  input: AiDecisionInput,
): CorpIceDensityProfile {
  const outsideDeckCards = visibleCorpCardsOutsideRd(input);
  const knownIceOutsideDeck = outsideDeckCards.filter(cardLooksLikeIce).length;
  const iceInHq = input.playerView.own.gripOrHq.filter(cardLooksLikeIce).length;
  const installedIce = input.playerView.servers.reduce(
    (count, server) => count + server.ice.filter(cardLooksLikeIce).length,
    0,
  );
  const remainingDeckCount = nonNegativeSafeInteger(
    input.playerView.own.stackOrRdCount,
  )
    ? input.playerView.own.stackOrRdCount
    : undefined;
  const snapshot = (input as DecisionInputWithOptionalDeckSnapshot)
    .ownDeckSnapshot;
  const snapshotCounts = readExactCorpDeckSnapshotCounts(snapshot);
  const initialDeckCount =
    snapshotCounts.status === "known"
      ? snapshotCounts.initialDeckCount
      : undefined;
  const initialIceCount =
    snapshotCounts.status === "known"
      ? snapshotCounts.initialIceCount
      : undefined;
  const rawRemainingIceCount =
    initialIceCount === undefined
      ? undefined
      : initialIceCount - knownIceOutsideDeck;
  const zoneAccountingValid =
    initialDeckCount !== undefined &&
    remainingDeckCount !== undefined &&
    rawRemainingIceCount !== undefined &&
    rawRemainingIceCount >= 0 &&
    rawRemainingIceCount <= remainingDeckCount &&
    outsideDeckCards.length <= initialDeckCount &&
    outsideDeckCards.length + remainingDeckCount <= initialDeckCount;
  const remainingIceCount = zoneAccountingValid
    ? rawRemainingIceCount
    : undefined;
  const remainingIceDensity =
    remainingIceCount !== undefined &&
    remainingDeckCount !== undefined &&
    remainingDeckCount > 0
      ? remainingIceCount / remainingDeckCount
      : undefined;
  const iceDensityClass =
    remainingIceDensity === undefined
      ? "unknown"
      : remainingIceDensity < 0.18
        ? "low"
        : remainingIceDensity > 0.36
          ? "high"
          : "normal";
  const confidence = zoneAccountingValid ? "deck_snapshot" : "unknown";

  return {
    confidence,
    ...(initialDeckCount !== undefined ? { initialDeckCount } : {}),
    ...(initialIceCount !== undefined ? { initialIceCount } : {}),
    knownCardsOutsideDeck: outsideDeckCards.length,
    knownIceOutsideDeck,
    iceInHq,
    installedIce,
    ...(remainingDeckCount !== undefined ? { remainingDeckCount } : {}),
    ...(remainingIceCount !== undefined ? { remainingIceCount } : {}),
    ...(remainingIceDensity !== undefined ? { remainingIceDensity } : {}),
    iceDensityClass,
    evidence: [
      `density_confidence:${confidence}`,
      `known_cards_outside_deck:${outsideDeckCards.length}`,
      `known_ice_outside_deck:${knownIceOutsideDeck}`,
      `ice_in_hq:${iceInHq}`,
      `installed_ice:${installedIce}`,
      ...(remainingDeckCount !== undefined
        ? [`remaining_deck_count:${remainingDeckCount}`]
        : ["remaining_deck_count:unknown"]),
      ...(initialDeckCount !== undefined
        ? [`initial_deck_count:${initialDeckCount}`]
        : []),
      ...(initialIceCount !== undefined
        ? [`initial_ice_count:${initialIceCount}`]
        : []),
      ...(remainingIceCount !== undefined
        ? [`remaining_ice_count:${remainingIceCount}`]
        : ["remaining_ice_count:unknown"]),
      ...(snapshotCounts.status === "unknown"
        ? [`deck_snapshot_unknown_reason:${snapshotCounts.reason}`]
        : []),
      ...(snapshotCounts.status === "known" && !zoneAccountingValid
        ? ["outside_deck_zone_accounting_mismatch:true"]
        : []),
      `ice_density_class:${iceDensityClass}`,
    ],
  };
}

function visibleCorpCardsOutsideRd(input: AiDecisionInput): VisibleCard[] {
  const cards = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.own.heapOrArchives,
    ...input.playerView.own.scoreArea,
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...server.root,
    ]),
    ...(input.playerView.specialZones?.setAside ?? []),
    ...(input.playerView.specialZones?.removedFromGame ?? []),
  ].filter((card) => card.known !== false);
  const unique = new Map(cards.map((card) => [card.instanceId, card]));
  return [...unique.values()];
}

function cardLooksLikeIce(card: VisibleCard): boolean {
  return card.known !== false && card.type === "ice";
}

function readExactCorpDeckSnapshotCounts(
  snapshot: AiDeckStrategyDeckSnapshot | undefined,
):
  | {
      status: "known";
      initialDeckCount: number;
      initialIceCount: number;
    }
  | {
      status: "unknown";
      reason:
        | "missing_or_wrong_side"
        | "invalid_cards"
        | "invalid_card_id"
        | "unknown_card_definition"
        | "invalid_quantity"
        | "duplicate_card_id"
        | "count_overflow";
    } {
  if (snapshot?.side !== "corp") {
    return { status: "unknown", reason: "missing_or_wrong_side" };
  }
  if (!Array.isArray(snapshot.cards)) {
    return { status: "unknown", reason: "invalid_cards" };
  }
  const cardIds = new Set<string>();
  let initialDeckCount = 0;
  let initialIceCount = 0;
  for (const entry of snapshot.cards) {
    if (typeof entry.cardId !== "string" || entry.cardId.length === 0) {
      return { status: "unknown", reason: "invalid_card_id" };
    }
    if (cardIds.has(entry.cardId)) {
      return { status: "unknown", reason: "duplicate_card_id" };
    }
    cardIds.add(entry.cardId);
    const definitionType = exactKnownDefinitionType(entry.cardId);
    if (definitionType === undefined) {
      return { status: "unknown", reason: "unknown_card_definition" };
    }
    if (!nonNegativeSafeInteger(entry.quantity)) {
      return { status: "unknown", reason: "invalid_quantity" };
    }
    initialDeckCount += entry.quantity;
    if (definitionType === "ice") {
      initialIceCount += entry.quantity;
    }
    if (
      !Number.isSafeInteger(initialDeckCount) ||
      !Number.isSafeInteger(initialIceCount)
    ) {
      return { status: "unknown", reason: "count_overflow" };
    }
  }
  return { status: "known", initialDeckCount, initialIceCount };
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function exactKnownDefinitionType(definitionId: string): string | undefined {
  const direct = CARD_DEFINITIONS_BY_ID[definitionId];
  if (direct) return direct.type;
  const engineCardId = RUNTIME_CARDS[definitionId]?.engineCardId;
  return engineCardId ? CARD_DEFINITIONS_BY_ID[engineCardId]?.type : undefined;
}
