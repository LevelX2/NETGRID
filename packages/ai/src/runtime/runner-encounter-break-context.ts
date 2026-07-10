import {
  CARD_DEFINITIONS_BY_ID,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";

import { breakerIdForEncounterAction } from "./encounter-action";
import { runnerEncounterPaymentForAction } from "./runner-encounter-credit-budget";

export type RunnerEncounterBreakContextDependencies = {
  actionCreditCost: (action: LegalAction) => number;
  findVisibleCard: (
    input: AiDecisionInput,
    instanceId: string,
  ) => VisibleCard | undefined;
  runnerCreditReserveTarget: (input: AiDecisionInput) => number;
};

export function createRunnerEncounterBreakContext(
  dependencies: RunnerEncounterBreakContextDependencies,
): {
  estimatedEncounterBreakCost: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => number | undefined;
  encounterBreakReserveContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { preserveReserve: boolean; evidence: string[] };
} {
  const estimatedEncounterBreakCost = (
    input: AiDecisionInput,
    action: LegalAction,
  ): number | undefined => {
    const breakerId = breakerIdForEncounterAction(action);
    const targetIceId =
      typeof action.payload?.iceId === "string"
        ? action.payload.iceId
        : undefined;
    const currentBreakCosts = input.legalActions
      .filter(
        (candidate) =>
          candidate.type === "break_subroutine" &&
          breakerIdForEncounterAction(candidate) === breakerId &&
          (!targetIceId || candidate.payload?.iceId === targetIceId),
      )
      .map((candidate) => dependencies.actionCreditCost(candidate));
    if (currentBreakCosts.length > 0) return Math.min(...currentBreakCosts);
    const breaker = dependencies.findVisibleCard(input, action.source);
    if (!breaker?.definitionId) return 1;
    const abilityCosts =
      CARD_DEFINITIONS_BY_ID[breaker.definitionId]?.abilities
        ?.filter((ability) => ability.type === "break_subroutine")
        .map((ability) =>
          typeof ability.cost?.credits === "number" ? ability.cost.credits : 1,
        ) ?? [];
    return abilityCosts.length > 0 ? Math.min(...abilityCosts) : 1;
  };

  const encounterBreakReserveContext = (
    input: AiDecisionInput,
    action: LegalAction,
  ): { preserveReserve: boolean; evidence: string[] } => {
    const reserveTarget = dependencies.runnerCreditReserveTarget(input);
    const payment = runnerEncounterPaymentForAction(input, action);
    const creditsAfterBreak = payment.creditsAfterPayment;
    const preserveReserve = creditsAfterBreak < Math.max(2, reserveTarget - 1);
    return {
      preserveReserve,
      evidence: preserveReserve
        ? [
            "break_skipped_to_preserve_trash_reserve:true",
            `break_credits_after:${creditsAfterBreak}`,
            `break_reserve_target:${reserveTarget}`,
            `break_restricted_credits_spent:${payment.restrictedSpent}`,
          ]
        : [],
    };
  };

  return {
    estimatedEncounterBreakCost,
    encounterBreakReserveContext,
  };
}
