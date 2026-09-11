import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export function runnerImmediateAgendaPointGain(
  candidate: ActionSemanticCandidate,
): number | undefined {
  if (
    candidate.actorSide !== "runner" ||
    candidate.sourceKind !== "card" ||
    candidate.actionType !== "play_event"
  ) {
    return undefined;
  }
  const effect = candidate.functionalEffects?.find(
    (entry) =>
      entry.kind === "scored_agenda_action" &&
      entry.scope === "runner" &&
      entry.resource === "agenda_points" &&
      typeof entry.amount === "number" &&
      entry.amount > 0,
  );
  return effect?.amount;
}
