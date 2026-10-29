import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import type {
  DefenseState,
  RunnerDefenseSignals,
} from "../defense-recovery/defense-types";
import { runnerDefenseTagClearFundingIsCurrentPhase } from "../defense-recovery/defense-plan-module";
import {
  quoteRunnerTagClearBankFunding,
  RUNNER_TAG_CLEAR_FUNDING_VALUE,
} from "../defense-recovery/tag-clear-bank-funding";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

/** Adopt only the Defense owner's complete current need, keeping the payout
 * at its bank owner and exactly one provider for the first quoted step. */
export function bindRunnerCreditBankDefenseFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  defense: RunnerDefenseSignals,
  signals: readonly RunnerCreditBankSignal[],
): RunnerCreditBankSignal[] {
  const need = defense.tagClearFundingNeed,
    bank = need?.bankFunding;
  if (
    !need ||
    !bank ||
    need.revalidation.stateVersion !== input.playerView.stateVersion ||
    bank.activeTags !== input.playerView.own.tags ||
    !runnerDefenseTagClearFundingIsCurrentPhase({
      actionCandidates: candidates,
      stateVersion: input.playerView.stateVersion,
      signals: defense,
    })
  )
    return [...signals];
  const current = quoteRunnerTagClearBankFunding(input, candidates);
  if (
    !current ||
    current.routeId !== bank.routeAssessment.routeId ||
    current.firstStepActionId !== bank.routeAssessment.firstStepActionId
  )
    return [...signals];
  const first = candidates.find(
    (c) => c.actionId === current.firstStepActionId,
  )!;
  return signals.map((signal) => {
    if (signal.bankId !== first.sourceCardInstanceId) return signal;
    const { runFunding, ...resident } = signal;
    return {
      ...resident,
      phase: "cash_out",
      actionIds: [first.actionId],
      rejectedActionIds: (signal.rejectedActionIds ?? []).filter(
        (id) => id !== first.actionId,
      ),
      priorityClass: "P2",
      value: RUNNER_TAG_CLEAR_FUNDING_VALUE,
      defenseFunding: { ...need, actionIds: [...need.actionIds] },
      evidenceCodes: [
        "runner_credit_bank_current_defense_tag_clear_support",
        ...current.evidenceCodes,
        ...signal.evidenceCodes,
      ],
    };
  });
}

export function runnerCreditBankDefenseParentValue(
  parent: PlanInstance,
  need: NonNullable<RunnerCreditBankSignal["defenseFunding"]>,
  stateVersion: number,
): number | undefined {
  if (
    parent.instanceId !== need.parentPlanInstanceId ||
    parent.moduleId !== "runner.defense_and_recovery" ||
    need.revalidation.stateVersion !== stateVersion ||
    (parent.viability !== "ready" && parent.viability !== "blocked")
  )
    return undefined;
  const state = parent.moduleState as DefenseState;
  const current = state.signals?.tagClearFundingNeed;
  return state.kind === "defense" &&
    state.phase === "fund_tag_clear" &&
    current?.needId === need.needId &&
    current.revalidation.stateVersion === stateVersion &&
    current.bankFunding?.routeAssessment.routeId ===
      need.bankFunding?.routeAssessment.routeId &&
    current.bankFunding?.activeTags === state.signals.activeTags &&
    state.signals.activeTags > 0
    ? RUNNER_TAG_CLEAR_FUNDING_VALUE
    : undefined;
}
