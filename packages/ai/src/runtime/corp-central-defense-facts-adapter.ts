import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type CardDefinitionId,
  type VisibleCard,
} from "@netgrid/shared";

import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  allocateCorpCentralDefense,
  type CorpCentralDefenseAllocation,
  type CorpCentralDefenseHqHoldCadence,
  type CorpCentralDefenseServerId,
} from "./corp-central-defense-allocation";
import { assessCorpScoreProtection } from "./corp-score-protection-assessment";

const FULL_ACCESS_PROBABILITY = { numerator: 1, denominator: 1 } as const;
const IMPORTANT_TRASHABLE_MECHANICS = new Set([
  "advance",
  "agenda",
  "trace",
  "tag",
  "damage",
  "economy",
  "gain_credits_on_rez",
  "install_ice",
]);

export function allocateCorpCentralDefenseFromAiFacts(params: {
  input: AiDecisionInput;
  hqHoldCadence?: CorpCentralDefenseHqHoldCadence;
}): CorpCentralDefenseAllocation {
  const { input, hqHoldCadence } = params;
  const view = input.playerView;
  if (input.side !== "corp" || !validTurnKey(view)) return unknown();
  const quotes = quotesForCurrentView(input);
  const inventory = centralInventory(input);
  if (!quotes || !inventory) return unknown();

  const hq = factsFor(input, "hq", quotes.hq, inventory.hq);
  const rd = factsFor(input, "rd", quotes.rd, inventory.rd);
  if (!hq || !rd) return unknown();
  return allocateCorpCentralDefense({
    observedAtStateVersion: view.stateVersion,
    turnKey: turnKeyFor(input),
    hq,
    rd,
    ...(hqHoldCadence ? { hqHoldCadence } : {}),
  });
}

function unknown(): CorpCentralDefenseAllocation {
  return { status: "unknown", reason: "incomplete_or_invalid_facts" };
}

function validTurnKey(view: AiDecisionInput["playerView"]): boolean {
  return (
    Number.isSafeInteger(view.stateVersion) &&
    view.stateVersion >= 0 &&
    Number.isSafeInteger(view.turnSerial) &&
    (view.turnSerial ?? -1) >= 0
  );
}

function turnKeyFor(input: AiDecisionInput): string {
  return `${input.side}:${input.playerView.turnSerial}`;
}

function quotesForCurrentView(
  input: AiDecisionInput,
):
  | Record<
      CorpCentralDefenseServerId,
      NonNullable<
        AiDecisionInput["playerView"]["corpCentralAccessQuotes"]
      >[number]
    >
  | undefined {
  const quotes = input.playerView.corpCentralAccessQuotes;
  if (!quotes || quotes.length !== 2) return undefined;
  const result = {} as Record<
    CorpCentralDefenseServerId,
    (typeof quotes)[number]
  >;
  for (const quote of quotes) {
    if (
      !quote.complete ||
      quote.stateVersion !== input.playerView.stateVersion ||
      (quote.serverId !== "hq" && quote.serverId !== "rd") ||
      result[quote.serverId]
    )
      return undefined;
    if (
      !Number.isSafeInteger(quote.effectiveAccessCount) ||
      quote.effectiveAccessCount < 1 ||
      quote.isMultiaccess !== quote.effectiveAccessCount > 1
    )
      return undefined;
    if (
      !sortedUnique(quote.sourceDefinitionIds) ||
      !sortedUnique(quote.serverBoundEffects.map((effect) => effect.id))
    )
      return undefined;
    if (
      quote.serverBoundEffects.some(
        (effect) =>
          !Number.isSafeInteger(effect.counterCount) ||
          effect.counterCount < 0 ||
          !Number.isSafeInteger(effect.additionalAccessCount) ||
          effect.additionalAccessCount < 0,
      )
    )
      return undefined;
    if (
      quote.serverBoundEffects.some(
        (effect) =>
          effect.kind !== "purgeable_runner_virus_counter_access_modifier" ||
          effect.serverId !== quote.serverId ||
          effect.id !== `corp:${effect.counterKind}` ||
          effect.counterCount < 1 ||
          !quote.sourceDefinitionIds.includes(effect.sourceDefinitionId) ||
          effect.additionalAccessCount !==
            (effect.formula === "per_counter_after_first"
              ? Math.max(0, effect.counterCount - 1)
              : effect.formula === "per_counter"
                ? effect.counterCount
                : Number.NaN),
      )
    ) {
      return undefined;
    }
    result[quote.serverId] = quote;
  }
  return result.hq && result.rd ? result : undefined;
}

function sortedUnique(values: readonly string[]): boolean {
  return values.every(
    (value, index) =>
      typeof value === "string" &&
      value.length > 0 &&
      (index === 0 || values[index - 1]! < value),
  );
}

type Inventory = {
  populationCardCount: number;
  agendaCardCount: number;
  agendaPointValue: number;
  importantTrashableCardCount: number;
  agendaPointCounts: ReadonlyMap<number, number>;
};

function centralInventory(
  input: AiDecisionInput,
): Record<CorpCentralDefenseServerId, Inventory> | undefined {
  const snapshot = (input as AiDecisionInputWithDeckCapabilities)
    .ownDeckSnapshot;
  if (!snapshot || snapshot.side !== "corp" || !Array.isArray(snapshot.cards))
    return undefined;
  const remaining = new Map<CardDefinitionId, number>();
  for (const entry of snapshot.cards) {
    if (
      !entry ||
      !entry.cardId ||
      !Number.isSafeInteger(entry.quantity) ||
      entry.quantity < 0 ||
      remaining.has(entry.cardId)
    )
      return undefined;
    if (!CARD_DEFINITIONS_BY_ID[entry.cardId]) return undefined;
    remaining.set(entry.cardId, entry.quantity);
  }
  const hqCards = input.playerView.own.gripOrHq;
  const archivesCards = canonicalCorpArchives(input);
  if (!archivesCards) return undefined;
  const visibleNonRd = [
    ...hqCards,
    ...archivesCards,
    ...input.playerView.own.scoreArea,
    ...input.playerView.opponent.scoreArea,
    ...(input.playerView.specialZones?.removedFromGame ?? []),
    ...(input.playerView.specialZones?.setAside ?? []),
    ...input.playerView.servers.flatMap((server) => [
      ...server.ice,
      ...(server.id === "archives" ? [] : server.root),
    ]),
  ];
  const nonRd = uniqueVisibleInstances(visibleNonRd);
  if (!nonRd) return undefined;
  for (const card of nonRd)
    if (!subtractKnown(remaining, card)) return undefined;
  let remainingCardCount = 0;
  for (const quantity of remaining.values()) {
    if (!Number.isSafeInteger(remainingCardCount + quantity)) return undefined;
    remainingCardCount += quantity;
  }
  if (
    !Number.isSafeInteger(remainingCardCount) ||
    remainingCardCount !== input.playerView.own.stackOrRdCount
  )
    return undefined;
  const hq = inventoryForCards(hqCards);
  const rd = inventoryForDefinitionCounts(remaining);
  return hq && rd ? { hq, rd } : undefined;
}

function canonicalCorpArchives(
  input: AiDecisionInput,
): readonly VisibleCard[] | undefined {
  const archivesServers = input.playerView.servers.filter(
    (server) => server.id === "archives",
  );
  if (archivesServers.length !== 1) return undefined;
  const ownArchives = uniqueVisibleInstanceMap(
    input.playerView.own.heapOrArchives,
  );
  const serverArchives = uniqueVisibleInstanceMap(archivesServers[0]!.root);
  if (
    !ownArchives ||
    !serverArchives ||
    ownArchives.size !== serverArchives.size
  )
    return undefined;
  for (const [instanceId, card] of ownArchives) {
    const mirrored = serverArchives.get(instanceId);
    if (
      !mirrored ||
      card.known !== mirrored.known ||
      card.definitionId !== mirrored.definitionId
    )
      return undefined;
  }
  return [...ownArchives.values()];
}

function uniqueVisibleInstanceMap(
  cards: readonly VisibleCard[],
): ReadonlyMap<string, VisibleCard> | undefined {
  const byInstanceId = new Map<string, VisibleCard>();
  for (const card of cards) {
    if (byInstanceId.has(card.instanceId)) return undefined;
    byInstanceId.set(card.instanceId, card);
  }
  return byInstanceId;
}

function uniqueVisibleInstances(
  cards: readonly VisibleCard[],
): readonly VisibleCard[] | undefined {
  const byInstanceId = uniqueVisibleInstanceMap(cards);
  return byInstanceId ? [...byInstanceId.values()] : undefined;
}

function subtractKnown(
  remaining: Map<CardDefinitionId, number>,
  card: VisibleCard,
): boolean {
  if (!card.known || !card.definitionId) return false;
  const count = remaining.get(card.definitionId);
  if (!count) return false;
  remaining.set(card.definitionId, count - 1);
  return true;
}

function inventoryForCards(
  cards: readonly VisibleCard[],
): Inventory | undefined {
  if (cards.some((card) => !card.known || !card.definitionId)) return undefined;
  return inventoryForDefinitionIds(cards.map((card) => card.definitionId!));
}

function inventoryForDefinitionIds(
  definitionIds: readonly CardDefinitionId[],
): Inventory | undefined {
  const counts = new Map<CardDefinitionId, number>();
  for (const definitionId of definitionIds) {
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return inventoryForDefinitionCounts(counts);
}

function inventoryForDefinitionCounts(
  definitionCounts: ReadonlyMap<CardDefinitionId, number>,
): Inventory | undefined {
  let populationCardCount = 0;
  let agendaCardCount = 0;
  let agendaPointValue = 0;
  let importantTrashableCardCount = 0;
  const agendaPointCounts = new Map<number, number>();
  for (const [definitionId, quantity] of definitionCounts) {
    const definition = CARD_DEFINITIONS_BY_ID[definitionId];
    if (
      !definition ||
      !Number.isSafeInteger(quantity) ||
      quantity < 0 ||
      !Number.isSafeInteger(populationCardCount + quantity)
    )
      return undefined;
    populationCardCount += quantity;
    if (definition.type === "agenda") {
      if (
        !Number.isSafeInteger(definition.agendaPoints) ||
        (definition.agendaPoints ?? 0) < 0
      )
        return undefined;
      if (!Number.isSafeInteger(agendaCardCount + quantity)) return undefined;
      agendaCardCount += quantity;
      agendaPointValue += definition.agendaPoints! * quantity;
      if (!Number.isSafeInteger(agendaPointValue)) return undefined;
      agendaPointCounts.set(
        definition.agendaPoints!,
        (agendaPointCounts.get(definition.agendaPoints!) ?? 0) + quantity,
      );
    }
    if (
      (definition.type === "asset" || definition.type === "upgrade") &&
      definition.mechanics.some(
        (mechanic) =>
          typeof mechanic === "string" &&
          IMPORTANT_TRASHABLE_MECHANICS.has(mechanic),
      )
    ) {
      if (!Number.isSafeInteger(importantTrashableCardCount + quantity))
        return undefined;
      importantTrashableCardCount += quantity;
    }
  }
  return {
    populationCardCount,
    agendaCardCount,
    agendaPointValue,
    importantTrashableCardCount,
    agendaPointCounts,
  };
}

function factsFor(
  input: AiDecisionInput,
  serverId: CorpCentralDefenseServerId,
  quote: NonNullable<
    AiDecisionInput["playerView"]["corpCentralAccessQuotes"]
  >[number],
  cards: Inventory,
) {
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const runnerRig = input.playerView.opponent.rig;
  if (!server || !runnerRig || cards.populationCardCount < 1) return undefined;
  const assessment = assessCorpScoreProtection({
    serverIce: server.ice,
    runnerRig,
    runnerCredits: input.playerView.opponent.credits,
    maximumRunnerAccessSuccessProbability: FULL_ACCESS_PROBABILITY,
  });
  if (assessment.knowledge !== "known") return undefined;
  const pressure = structuredRecentPressure(input, serverId);
  if (!pressure) return undefined;
  const matchpoint =
    input.playerView.agendaPointsToWin - input.playerView.opponent.agendaPoints;
  if (!Number.isSafeInteger(matchpoint) || matchpoint < 1) return undefined;
  let accessesRemaining = Math.min(
    quote.effectiveAccessCount,
    cards.agendaCardCount,
  );
  let maximumAccessibleAgendaPointValue = 0;
  for (const [points, count] of [...cards.agendaPointCounts].sort(
    ([left], [right]) => right - left,
  )) {
    const accessibleOfDefinition = Math.min(accessesRemaining, count);
    maximumAccessibleAgendaPointValue += points * accessibleOfDefinition;
    accessesRemaining -= accessibleOfDefinition;
    if (accessesRemaining === 0) break;
  }
  if (!Number.isSafeInteger(maximumAccessibleAgendaPointValue))
    return undefined;
  const { agendaPointCounts: _agendaPointCounts, ...publicCardFacts } = cards;
  void _agendaPointCounts;
  const threat =
    maximumAccessibleAgendaPointValue >= matchpoint
      ? "terminal"
      : quote.isMultiaccess || pressure.successful > 0
        ? "acute"
        : cards.agendaCardCount > 0
          ? "material"
          : "none";
  return {
    serverId,
    factsKnown: true,
    threat,
    access: {
      successfulAccessProbability: assessment.runnerAccessSuccessProbability,
      accessibleCardCount: quote.effectiveAccessCount,
      isMultiaccess: quote.isMultiaccess,
      recentRunOrAccessEvents: pressure.events,
      recentSuccessfulAccessRunnerTurns: pressure.successful,
      serverBoundEffectIds: quote.serverBoundEffects.map((effect) => effect.id),
    },
    cards: publicCardFacts,
  } as const;
}

function structuredRecentPressure(
  input: AiDecisionInput,
  serverId: CorpCentralDefenseServerId,
): { events: number; successful: number } | undefined {
  const turns = new Set<number>();
  let events = 0;
  const eventsById = new Map(
    [...input.playerView.publicEvents, ...input.eventTail].map((event) => [
      event.eventId,
      event,
    ]),
  );
  for (const event of eventsById.values()) {
    if (
      !Number.isSafeInteger(event.stateVersionAfter) ||
      event.stateVersionAfter > input.playerView.stateVersion
    )
      return undefined;
    if (event.stateVersionAfter < input.playerView.stateVersion - 32) continue;
    const payload = event.publicPayload as Record<string, unknown>;
    if (payload.actor !== "runner" || payload.serverId !== serverId) continue;
    const actionType =
      typeof payload.actionType === "string" ? payload.actionType : event.type;
    if (actionType !== "access_card" && actionType !== "run_successful")
      continue;
    events += 1;
    if (actionType === "access_card") {
      const turnSerial = event.turnSerial;
      if (typeof turnSerial !== "number" || !Number.isSafeInteger(turnSerial))
        return undefined;
      turns.add(turnSerial);
    }
  }
  return { events, successful: Math.min(3, turns.size) };
}
