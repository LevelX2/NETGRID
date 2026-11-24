import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";

import { runnerEncounterPaymentForAction } from "./runner-encounter-credit-budget";

export type RunnerEncounterBreakContextDependencies = {
  runnerCreditReserveTarget: (input: AiDecisionInput) => number;
};

export function createRunnerEncounterBreakContext(
  dependencies: RunnerEncounterBreakContextDependencies,
): {
  encounterBreakReserveContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { preserveReserve: boolean; evidence: string[] };
} {
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
    encounterBreakReserveContext,
  };
}
