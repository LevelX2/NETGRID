import type { VisibleCard } from "@netgrid/shared";
import { planningCardFactsByDefinitionId } from "@netgrid/cards/planning";
import { RUNTIME_CARDS } from "../ai-hints";

export function definitionTypeForMetrics(
  definitionId: number,
): string | undefined {
  return (
    planningCardFactsByDefinitionId(definitionId)?.type ??
    RUNTIME_CARDS[definitionId]?.type
  );
}

export function agendaPointsForMetrics(definitionId: number): number {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.agendaPoints ??
    planningCardFactsByDefinitionId(definitionId)?.agendaPoints ??
    0
  );
}

export function trashCostForDefinitionForMetrics(
  definitionId: number,
): number | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.trashCost ??
    planningCardFactsByDefinitionId(definitionId)?.trashCost
  );
}

export function remoteTrashCostForVisibleCard(
  card: VisibleCard,
): number | undefined {
  if (!card.known || !card.definitionId) return undefined;
  return card.trashCost ?? trashCostForDefinitionForMetrics(card.definitionId);
}
