import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

export function runnerImmediateAgendaPointGain(
  candidate: ActionSemanticCandidate,
  input: AiDecisionInput,
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
  if (!effect) return undefined;
  if (
    !candidate.conditions.some(
      (condition) => condition.kind === "requires_liberated_black_ops_agenda",
    )
  )
    return effect.amount;
  const action = input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    ),
    quote = action?.payload;
  if (
    action?.side !== "runner" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    typeof candidate.sourceCardInstanceId !== "string" ||
    typeof action.abilityRef?.sourceAbilityId !== "string" ||
    quote?.runnerConditionalAgendaPointQuoteSchema !==
      "runner-conditional-agenda-point-v1" ||
    quote.runnerConditionalAgendaPointQuoteStateVersion !==
      input.playerView.stateVersion ||
    quote.runnerConditionalAgendaPointQuoteSourceCardInstanceId !==
      candidate.sourceCardInstanceId ||
    quote.runnerConditionalAgendaPointQuoteSourceCapabilityId !==
      action.abilityRef?.sourceAbilityId ||
    (quote.runnerConditionalAgendaPointQuoteAmount !== 0 &&
      quote.runnerConditionalAgendaPointQuoteAmount !== effect.amount)
  ) {
    throw new PlanResolutionFailure("missing_action_semantics", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((a) => a.type),
      unresolvedActionIds: [candidate.actionId],
      owner: "action_semantics",
      removalCondition:
        "Project a current source- and capability-bound Engine quote for the conditional Runner agenda-point effect.",
    });
  }
  return quote.runnerConditionalAgendaPointQuoteAmount === 0
    ? undefined
    : effect.amount;
}
