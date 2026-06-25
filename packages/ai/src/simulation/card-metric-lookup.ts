import type { VisibleCard } from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { RUNTIME_CARDS } from "../ai-hints";

export function definitionTypeForMetrics(
  definitionId: string,
): string | undefined {
  return (
    DEMO_CARDS_BY_ID[definitionId]?.type ?? RUNTIME_CARDS[definitionId]?.type
  );
}

export function agendaPointsForMetrics(definitionId: string): number {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.agendaPoints ??
    DEMO_CARDS_BY_ID[definitionId]?.agendaPoints ??
    0
  );
}

export function trashCostForDefinitionForMetrics(
  definitionId: string,
): number | undefined {
  return (
    RUNTIME_CARDS[definitionId]?.numeric.trashCost ??
    DEMO_CARDS_BY_ID[definitionId]?.trashCost
  );
}

export function remoteRootTrashCostForMetrics(
  card: VisibleCard,
): number | undefined {
  if (!card.definitionId) return undefined;
  return trashCostForDefinitionForMetrics(card.definitionId);
}
