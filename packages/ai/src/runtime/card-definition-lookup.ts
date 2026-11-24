import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import { type VisibleCard } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

export function runtimeCardDefinitionForAi(definitionId: number) {
  return RUNTIME_CARDS[definitionId];
}

export function cardDefinitionTypeForAi(
  definitionId: number | undefined,
): string | undefined {
  return definitionId
    ? planningCardFactsByDefinitionId(definitionId)?.type
    : undefined;
}

export function visibleCardDefinition(card: VisibleCard) {
  return card.known === true && card.definitionId
    ? planningCardFactsByDefinitionId(card.definitionId)
    : undefined;
}
