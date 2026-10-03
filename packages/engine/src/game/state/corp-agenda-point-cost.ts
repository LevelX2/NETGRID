import type {
  CardInstanceId,
  CardDefinitionId,
  GameState,
} from "@netgrid/shared";
import { definitionFor, mustInstance } from "./card-server-lookup";

export function scoredAgendaPointValue(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const card = mustInstance(state.cardInstances, cardId);
  return Math.max(
    0,
    (definitionFor(state, cardId).agendaPoints ?? 0) +
      Number(card.counters?.agenda ?? 0) -
      Math.max(0, Math.floor(card.agendaPointsSpent ?? 0)),
  );
}

/** The authoritative deterministic payment transition, shared by execution
 * and projections operating on their own cloned state. */
export function spendCorpAgendaPoints(
  state: GameState,
  requiredPoints: number,
): {
  paidPoints: number;
  bonusPointsSpent: number;
  spentAgendaIds: CardInstanceId[];
  spentAgendaDefinitionIds: CardDefinitionId[];
} {
  if (!Number.isSafeInteger(requiredPoints) || requiredPoints <= 0)
    throw new Error("Agenda-Punkt-Kosten sind ungültig.");
  const bonusBefore = Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0));
  const targets = state.corp.scoreArea
    .slice()
    .sort(
      (a, b) =>
        scoredAgendaPointValue(state, a) - scoredAgendaPointValue(state, b) ||
        a.localeCompare(b),
    )
    .filter((id) => scoredAgendaPointValue(state, id) >= 1);
  if (
    bonusBefore +
      targets.reduce((n, id) => n + scoredAgendaPointValue(state, id), 0) <
    requiredPoints
  )
    throw new Error("Die Korp hat nicht genug Agenda-Punkte.");
  const bonusPointsSpent = Math.min(bonusBefore, requiredPoints);
  let remaining = requiredPoints - bonusPointsSpent;
  if (bonusPointsSpent > 0)
    state.corpBonusAgendaPoints = bonusBefore - bonusPointsSpent;
  const spentAgendaIds: CardInstanceId[] = [],
    spentAgendaDefinitionIds: CardDefinitionId[] = [];
  for (const id of targets) {
    const spent = Math.min(scoredAgendaPointValue(state, id), remaining);
    if (spent <= 0) continue;
    const card = mustInstance(state.cardInstances, id);
    state.cardInstances[id] = {
      ...card,
      agendaPointsSpent:
        Math.max(0, Math.floor(card.agendaPointsSpent ?? 0)) + spent,
    };
    spentAgendaIds.push(id);
    spentAgendaDefinitionIds.push(definitionFor(state, id).id);
    remaining -= spent;
    if (remaining === 0) break;
  }
  return {
    paidPoints: requiredPoints,
    bonusPointsSpent,
    spentAgendaIds,
    spentAgendaDefinitionIds,
  };
}
