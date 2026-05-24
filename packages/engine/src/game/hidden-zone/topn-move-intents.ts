import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
} from "@netgrid/shared";
import type { LookTopStackTakeMatchingSelectionResult } from "./search-choice-resolvers";

type HiddenZonePayload = Record<string, string | number | boolean>;
export type TopNAllowedCardType = "program" | "event" | "hardware" | "resource";

export type TopNSelectedCardMove = {
  cardId: CardInstanceId;
  definitionId: CardDefinitionId;
  title: string;
  type: CardDefinition["type"];
};

export function toTopNSelectedCardMove(
  cardId: CardInstanceId,
  definition: Pick<CardDefinition, "id" | "title" | "type">,
): TopNSelectedCardMove {
  return {
    cardId,
    definitionId: definition.id,
    title: definition.title,
    type: definition.type,
  };
}

export type TopNTakeMatchingMoveIntent = {
  sourceDefinitionId: CardDefinitionId;
  topCardIds: CardInstanceId[];
  selectedCards: TopNSelectedCardMove[];
  allowedTypes: TopNAllowedCardType[];
  costPerTaken: number;
  paidCredits: number;
  shuffleNeeded: boolean;
};

export type TopNTakeMatchingMoveResult = {
  selectedCardIds: CardInstanceId[];
  movedCardIds: CardInstanceId[];
  destinationZone: "runner_grip";
  sourceDefinitionId: CardDefinitionId;
  privateLookCount: number;
  allowedTypes: TopNAllowedCardType[];
  costPerTaken: number;
  paidCredits: number;
  revealToCorp: true;
  shuffleNeeded: boolean;
  revealedDefinitionIds: CardDefinitionId[];
  revealedTitles: string[];
};

export function createTopNTakeMatchingMoveIntent(input: {
  selection: LookTopStackTakeMatchingSelectionResult;
  topCardIds: readonly CardInstanceId[];
  sourceDefinition: {
    id: CardDefinitionId;
    type: string;
  };
  installedRunnerResourceIds: readonly CardInstanceId[];
  selectedCards: readonly TopNSelectedCardMove[];
}): TopNTakeMatchingMoveIntent {
  const { selection } = input;
  if (input.sourceDefinition.id !== selection.sourceDefinitionId)
    throw new Error("Die Stack-Look-Quelle ist nicht mehr gueltig.");
  if (
    input.sourceDefinition.type === "resource" &&
    !input.installedRunnerResourceIds.includes(selection.sourceCardId)
  )
    throw new Error("Die Stack-Look-Quelle ist nicht mehr installiert.");
  const topCardIds = input.topCardIds.slice(0, selection.count);
  const selectedCards = selection.selectedCardIds.map((cardId) => {
    const selectedCard = input.selectedCards.find((card) => card.cardId === cardId);
    if (!selectedCard)
      throw new Error("Eine gewaehlte Stack-Karte fehlt im Move-Kontext.");
    return selectedCard;
  });
  const allowedTypes = new Set(selection.allowedTypes);
  if (
    selectedCards.some(
      (card) =>
        !topCardIds.includes(card.cardId) ||
        !isTopNAllowedCardType(card.type) ||
        !allowedTypes.has(card.type),
    )
  )
    throw new Error("Eine gewaehlte Stack-Karte ist fuer diesen Effekt nicht legal.");
  return {
    sourceDefinitionId: selection.sourceDefinitionId,
    topCardIds,
    selectedCards,
    allowedTypes: [...selection.allowedTypes],
    costPerTaken: selection.costPerTaken,
    paidCredits: selection.paidCredits,
    shuffleNeeded: selection.shuffleNeeded,
  };
}

function isTopNAllowedCardType(type: string): type is TopNAllowedCardType {
  return (
    type === "program" ||
    type === "event" ||
    type === "hardware" ||
    type === "resource"
  );
}

export function applyTopNTakeMatchingMoveIntent(
  intent: TopNTakeMatchingMoveIntent,
  operations: {
    cardInstances: Record<CardInstanceId, CardInstance>;
    removeFromAllZones: (cardId: CardInstanceId) => void;
    addToGrip: (cardId: CardInstanceId) => void;
  },
): TopNTakeMatchingMoveResult {
  for (const card of intent.selectedCards) {
    operations.removeFromAllZones(card.cardId);
    operations.addToGrip(card.cardId);
    const instance = operations.cardInstances[card.cardId];
    if (!instance) throw new Error(`CardInstance fehlt: ${card.cardId}`);
    operations.cardInstances[card.cardId] = {
      ...instance,
      zone: { side: "runner", zone: "grip" },
    };
  }
  return createTopNTakeMatchingMoveResult(intent);
}

export function createTopNTakeMatchingMoveResult(
  intent: TopNTakeMatchingMoveIntent,
): TopNTakeMatchingMoveResult {
  return {
    selectedCardIds: intent.selectedCards.map((card) => card.cardId),
    movedCardIds: intent.selectedCards.map((card) => card.cardId),
    destinationZone: "runner_grip",
    sourceDefinitionId: intent.sourceDefinitionId,
    privateLookCount: intent.topCardIds.length,
    allowedTypes: intent.allowedTypes,
    costPerTaken: intent.costPerTaken,
    paidCredits: intent.paidCredits,
    revealToCorp: true,
    shuffleNeeded: intent.shuffleNeeded,
    revealedDefinitionIds: intent.selectedCards.map((card) => card.definitionId),
    revealedTitles: intent.selectedCards.map((card) => card.title),
  };
}

export function buildTopNTakeMatchingResolvedPayload(
  result: TopNTakeMatchingMoveResult,
  input: {
    runnerCreditsAfter: number;
  },
): HiddenZonePayload {
  return {
    hiddenZoneBarrier: true,
    hiddenZoneAction: "p3_37_look_top_stack_take_matching",
    sourceDefinitionId: result.sourceDefinitionId,
    privateLookCount: result.privateLookCount,
    searchedZone: "runner_stack",
    takenCardCount: result.selectedCardIds.length,
    movedCardCount: result.movedCardIds.length,
    paidCredits: result.paidCredits,
    runnerCreditsAfter: input.runnerCreditsAfter,
    shufflePerformed: result.shuffleNeeded,
    shuffled: result.shuffleNeeded,
    ...(result.revealedDefinitionIds.length > 0
      ? {
          publicRevealKind: "reveal",
          publicRevealDefinitionIds: result.revealedDefinitionIds.join(","),
          publicRevealTitles: result.revealedTitles.join("||"),
          revealedCardDefinitionIds: result.revealedDefinitionIds.join(","),
        }
      : {}),
  };
}
