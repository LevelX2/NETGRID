import type { VisibleCard } from "@netgrid/shared";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { RUNTIME_CARDS } from "../ai-hints";

export function definitionTypeForMetrics(
  definitionId: number,
): string | undefined {
  return (
    CARD_DEFINITIONS_BY_ID[definitionId]?.type ??
    RUNTIME_CARDS[definitionId]?.type
  );
}

export function agendaPointsForMetrics(definitionId: number): number {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.agendaPoints ??
    CARD_DEFINITIONS_BY_ID[definitionId]?.agendaPoints ??
    0
  );
}

export function trashCostForDefinitionForMetrics(
  definitionId: number,
): number | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.trashCost ??
    CARD_DEFINITIONS_BY_ID[definitionId]?.trashCost
  );
}

export function remoteTrashCostForVisibleCard(
  card: VisibleCard,
): number | undefined {
  if (!card.known || !card.definitionId) return undefined;
  return card.trashCost ?? trashCostForDefinitionForMetrics(card.definitionId);
}
