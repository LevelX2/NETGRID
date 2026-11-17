import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "./current-legal-action";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

export function runnerImmediateAgendaPointGain(
  candidate: ActionSemanticCandidate,
  input: AiDecisionInput,
): number | undefined {
  if (
    input.side !== "runner" ||
    candidate.actorSide !== input.side ||
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
      Number.isSafeInteger(entry.amount) &&
      entry.amount > 0,
  );
  if (!effect) return undefined;
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const currentSource =
    actionMatchesCurrentDecision(input, action) &&
    action.type === "play_event" &&
    typeof candidate.sourceCardInstanceId === "string" &&
    action.source === candidate.sourceCardInstanceId;
  const conditional = candidate.conditions.some(
    (condition) => condition.kind === "requires_liberated_black_ops_agenda",
  );
  if (currentSource && !conditional) return effect.amount;
  const quote = action?.payload;
  if (
    !currentSource ||
    typeof action?.abilityRef?.sourceAbilityId !== "number" ||
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
        "Bind the Runner agenda-point effect to its current source action and, when conditional, the Engine's capability-bound point quote.",
    });
  }
  return quote.runnerConditionalAgendaPointQuoteAmount === 0
    ? undefined
    : effect.amount;
}
