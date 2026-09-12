import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  runnerEncounterCreditBudgetForInput,
  spendRunnerEncounterActionCost,
} from "../runtime/runner-encounter-credit-budget";

/** Current encounter payments consume visible restricted pools before cash.
 * The run boundary requires fresh Engine facts before another projected step. */
export function projectRunnerEncounterCashCost(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): ActionSemanticCandidate {
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "run.encounter_ice" ||
    input.playerView.run?.phase !== "encounter_ice" ||
    candidate.stateVersion !== input.playerView.stateVersion ||
    (candidate.actionType !== "pump_breaker" &&
      candidate.actionType !== "break_subroutine")
  )
    return candidate;
  const action = input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  if (!action) return candidate;
  const grossCost = candidate.costProfile.creditCost;
  if (!Number.isSafeInteger(grossCost) || (grossCost ?? 0) <= 0)
    return candidate;
  const budget = runnerEncounterCreditBudgetForInput(input);
  // A bank activation is a separate Engine action, not current payment cash.
  budget.paymentSupportSources = [];
  budget.paymentSupportCreditsGained = 0;
  const payment = spendRunnerEncounterActionCost({
    input,
    action,
    budget,
    cost: grossCost!,
  });
  if (payment.restrictedSpent === 0) return candidate;
  const cashCost = grossCost! - payment.restrictedSpent;
  const economy = candidate.economyProjection;
  return {
    ...candidate,
    costProfile: {
      ...candidate.costProfile,
      creditCost: cashCost,
      hostedCreditCost: payment.restrictedSpent,
    },
    ...(economy
      ? {
          economyProjection: {
            ...economy,
            creditCost: cashCost,
            ...(economy.netLiquidCreditGain !== undefined
              ? {
                  netLiquidCreditGain:
                    economy.netLiquidCreditGain + payment.restrictedSpent,
                }
              : {}),
          },
        }
      : {}),
    evidence: [
      ...candidate.evidence,
      `runner_encounter_payment_gross:${grossCost}`,
      `runner_encounter_payment_restricted:${payment.restrictedSpent}`,
      `runner_encounter_payment_cash:${cashCost}`,
    ],
  };
}
