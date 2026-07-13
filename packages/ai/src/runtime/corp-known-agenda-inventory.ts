import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type VisibleCard,
} from "@netgrid/shared";

import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";

export type CorpKnownAgendaInventory = {
  totalAgendaPoints: number;
  corpScoredAgendaPoints: number;
  runnerScoredAgendaPoints: number;
  removedAgendaPoints: number;
  remainingStealableAgendaPoints: number;
  evidence: string[];
};

export function corpKnownAgendaInventory(
  input: AiDecisionInput,
): CorpKnownAgendaInventory | undefined {
  if (input.side !== "corp") return undefined;
  const snapshot = (input as AiDecisionInputWithDeckCapabilities)
    .ownDeckSnapshot;
  if (!snapshot || snapshot.side !== "corp") return undefined;
  let totalAgendaPoints = 0;
  for (const entry of snapshot.cards) {
    const definition = CARD_DEFINITIONS_BY_ID[entry.cardId];
    if (definition?.type !== "agenda") continue;
    const points = normalizedAgendaPoints(definition.agendaPoints);
    totalAgendaPoints += points * Math.max(0, Math.floor(entry.quantity));
  }
  if (totalAgendaPoints <= 0) return undefined;
  const corpScoredAgendaPoints = visibleAgendaPoints(
    input.playerView.own.scoreArea,
  );
  const runnerScoredAgendaPoints = visibleAgendaPoints(
    input.playerView.opponent.scoreArea,
  );
  const removedAgendaPoints = visibleAgendaPoints(
    input.playerView.specialZones?.removedFromGame ?? [],
  );
  const remainingStealableAgendaPoints = Math.max(
    0,
    totalAgendaPoints -
      corpScoredAgendaPoints -
      runnerScoredAgendaPoints -
      removedAgendaPoints,
  );
  return {
    totalAgendaPoints,
    corpScoredAgendaPoints,
    runnerScoredAgendaPoints,
    removedAgendaPoints,
    remainingStealableAgendaPoints,
    evidence: [
      `corp_agenda_inventory_total:${totalAgendaPoints}`,
      `corp_agenda_inventory_corp_scored:${corpScoredAgendaPoints}`,
      `corp_agenda_inventory_runner_scored:${runnerScoredAgendaPoints}`,
      `corp_agenda_inventory_removed:${removedAgendaPoints}`,
      `corp_agenda_inventory_remaining_stealable:${remainingStealableAgendaPoints}`,
    ],
  };
}

function visibleAgendaPoints(cards: readonly VisibleCard[]): number {
  return cards.reduce((sum, card) => {
    const definition = card.definitionId
      ? CARD_DEFINITIONS_BY_ID[card.definitionId]
      : undefined;
    if (card.type !== "agenda" && definition?.type !== "agenda") return sum;
    return (
      sum +
      normalizedAgendaPoints(card.agendaPoints ?? definition?.agendaPoints)
    );
  }, 0);
}

function normalizedAgendaPoints(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}
