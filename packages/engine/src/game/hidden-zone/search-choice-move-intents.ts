import type {
  CardInstance,
  CardDefinitionId,
  CardInstanceId,
} from "@netgrid/shared";
import type {
  SearchToGripSelectionResult,
  SearchToGripSelectionsResult,
} from "./search-choice-resolvers";

type HiddenZonePayload = Record<string, string | number | boolean>;
type SearchToGripSourceZone = "heap" | "stack";

export type HiddenZoneMoveSource = "runner_heap" | "runner_stack";
export type HiddenZoneMoveDestination = "runner_grip";

export type SearchToGripMoveIntent = {
  selectedCardId: CardInstanceId;
  sourceZone: SearchToGripSourceZone;
  destinationZone: "grip";
  sourceDefinitionId: CardDefinitionId;
  selectedCardDefinitionId: CardDefinitionId;
  revealToCorp: boolean;
  shuffleNeeded: boolean;
};

export type SearchToGripMoveResult = {
  movedCardId: CardInstanceId;
  sourceZone: HiddenZoneMoveSource;
  destinationZone: HiddenZoneMoveDestination;
  sourceDefinitionId: CardDefinitionId;
  selectedCardDefinitionId: CardDefinitionId;
  revealToCorp: boolean;
  shuffleNeeded: boolean;
};

export type AppliedSearchToGripMove = {
  result: SearchToGripMoveResult;
  payload: HiddenZonePayload;
};

export type AppliedSearchToGripMoves = {
  results: SearchToGripMoveResult[];
  payload: HiddenZonePayload;
};

export function createSearchToGripMoveIntent(input: {
  selectedCardId: CardInstanceId;
  sourceCardIds: readonly CardInstanceId[];
  sourceZone: SearchToGripSourceZone;
  sourceDefinitionId: CardDefinitionId;
  selectedCardDefinitionId: CardDefinitionId;
  revealToCorp: boolean;
  shuffleNeeded: boolean;
}): SearchToGripMoveIntent {
  if (!input.sourceCardIds.includes(input.selectedCardId))
    throw new Error(
      "Die gewaehlte Hidden-Zone-Karte liegt nicht in der Quellzone.",
    );
  return {
    selectedCardId: input.selectedCardId,
    sourceZone: input.sourceZone,
    destinationZone: "grip",
    sourceDefinitionId: input.sourceDefinitionId,
    selectedCardDefinitionId: input.selectedCardDefinitionId,
    revealToCorp: input.revealToCorp,
    shuffleNeeded: input.shuffleNeeded,
  };
}

export function applySearchToGripMoveIntent(
  intent: SearchToGripMoveIntent,
  operations: {
    removeFromAllZones: (cardId: CardInstanceId) => void;
    addToGrip: (cardId: CardInstanceId) => void;
  },
): SearchToGripMoveResult {
  operations.removeFromAllZones(intent.selectedCardId);
  operations.addToGrip(intent.selectedCardId);
  return createSearchToGripMoveResult(intent);
}

export function applyResolvedSearchToGripMove(input: {
  selection: SearchToGripSelectionResult;
  sourceCardIds: readonly CardInstanceId[];
  sourceDefinition: {
    id: CardDefinitionId;
    type: string;
  };
  selectedCardDefinitionId: CardDefinitionId;
  installedRunnerResourceIds: readonly CardInstanceId[];
  cardInstances: Record<CardInstanceId, CardInstance>;
  removeFromAllZones: (cardId: CardInstanceId) => void;
  addToGrip: (cardId: CardInstanceId) => void;
}): AppliedSearchToGripMove {
  const { selection } = input;
  if (input.sourceDefinition.id !== selection.sourceDefinitionId)
    throw new Error("Die Search-Quelle ist nicht mehr gueltig.");
  if (
    input.sourceDefinition.type === "resource" &&
    !input.installedRunnerResourceIds.includes(selection.sourceCardId)
  )
    throw new Error("Die Search-Quelle ist nicht mehr installiert.");
  const moveIntent = createSearchToGripMoveIntent({
    selectedCardId: selection.selectedCardId,
    sourceCardIds: input.sourceCardIds,
    sourceZone: selection.sourceZone,
    sourceDefinitionId: selection.sourceDefinitionId,
    selectedCardDefinitionId: input.selectedCardDefinitionId,
    revealToCorp: selection.revealToCorp,
    shuffleNeeded: selection.shuffleNeeded,
  });
  const moveResult = applySearchToGripMoveIntent(moveIntent, {
    removeFromAllZones: input.removeFromAllZones,
    addToGrip: input.addToGrip,
  });
  const instance = input.cardInstances[moveResult.movedCardId];
  if (!instance)
    throw new Error(`CardInstance fehlt: ${moveResult.movedCardId}`);
  input.cardInstances[moveResult.movedCardId] = {
    ...instance,
    zone: { side: "runner", zone: "grip" },
  };
  return {
    result: moveResult,
    payload: buildSearchToGripResolvedPayload(moveResult),
  };
}

export function applyResolvedSearchToGripMoves(input: {
  selection: SearchToGripSelectionsResult;
  sourceCardIds: readonly CardInstanceId[];
  sourceDefinition: {
    id: CardDefinitionId;
    type: string;
  };
  selectedCards: readonly {
    cardId: CardInstanceId;
    definitionId: CardDefinitionId;
  }[];
  installedRunnerResourceIds: readonly CardInstanceId[];
  cardInstances: Record<CardInstanceId, CardInstance>;
  removeFromAllZones: (cardId: CardInstanceId) => void;
  addToGrip: (cardId: CardInstanceId) => void;
}): AppliedSearchToGripMoves {
  const { selection } = input;
  if (input.sourceDefinition.id !== selection.sourceDefinitionId)
    throw new Error("Die Search-Quelle ist nicht mehr gueltig.");
  if (
    input.sourceDefinition.type === "resource" &&
    !input.installedRunnerResourceIds.includes(selection.sourceCardId)
  )
    throw new Error("Die Search-Quelle ist nicht mehr installiert.");
  const selectedDefinitions = new Map(
    input.selectedCards.map((card) => [card.cardId, card.definitionId]),
  );
  const results = selection.selectedCardIds.map((selectedCardId) => {
    const selectedCardDefinitionId = selectedDefinitions.get(selectedCardId);
    if (!selectedCardDefinitionId)
      throw new Error("Die gewaehlte Hidden-Zone-Karte ist unbekannt.");
    const moveIntent = createSearchToGripMoveIntent({
      selectedCardId,
      sourceCardIds: input.sourceCardIds,
      sourceZone: selection.sourceZone,
      sourceDefinitionId: selection.sourceDefinitionId,
      selectedCardDefinitionId,
      revealToCorp: selection.revealToCorp,
      shuffleNeeded: selection.shuffleNeeded,
    });
    const moveResult = applySearchToGripMoveIntent(moveIntent, {
      removeFromAllZones: input.removeFromAllZones,
      addToGrip: input.addToGrip,
    });
    const instance = input.cardInstances[moveResult.movedCardId];
    if (!instance)
      throw new Error(`CardInstance fehlt: ${moveResult.movedCardId}`);
    input.cardInstances[moveResult.movedCardId] = {
      ...instance,
      zone: { side: "runner", zone: "grip" },
    };
    return moveResult;
  });
  return {
    results,
    payload: buildSearchToGripResolvedPayloadForResults(results),
  };
}

export function createSearchToGripMoveResult(
  intent: SearchToGripMoveIntent,
): SearchToGripMoveResult {
  return {
    movedCardId: intent.selectedCardId,
    sourceZone: intent.sourceZone === "heap" ? "runner_heap" : "runner_stack",
    destinationZone: "runner_grip",
    sourceDefinitionId: intent.sourceDefinitionId,
    selectedCardDefinitionId: intent.selectedCardDefinitionId,
    revealToCorp: intent.revealToCorp,
    shuffleNeeded: intent.shuffleNeeded,
  };
}

export function buildSearchToGripResolvedPayload(
  result: SearchToGripMoveResult,
): HiddenZonePayload {
  return buildSearchToGripResolvedPayloadForResults([result]);
}

function buildSearchToGripResolvedPayloadForResults(
  results: readonly SearchToGripMoveResult[],
): HiddenZonePayload {
  const first = results[0];
  if (!first) throw new Error("Search-to-Grip braucht mindestens eine Karte.");
  const revealedDefinitionIds = results.map(
    (result) => result.selectedCardDefinitionId,
  );
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction:
      first.sourceZone === "runner_heap"
        ? "p3_37_search_trash_to_grip"
        : "p3_37_search_stack_to_grip",
    sourceDefinitionId: first.sourceDefinitionId,
    searchedZone: first.sourceZone,
    selectedCount: results.length,
    movedCardCount: results.length,
    searchDestination: first.destinationZone,
    shufflePerformed: first.shuffleNeeded,
    shuffled: first.shuffleNeeded,
    ...(first.sourceZone === "runner_heap" || first.revealToCorp
      ? {
          cardDefinitionId: first.selectedCardDefinitionId,
          publicRevealKind: "reveal",
          publicRevealDefinitionId: first.selectedCardDefinitionId,
          revealedCardDefinitionIds: revealedDefinitionIds.join(","),
          revealedCount: results.length,
        }
      : {}),
  };
}
