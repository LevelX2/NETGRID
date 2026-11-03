import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import { runnerStrategicExchangeRequiresBoundParent } from "../../runtime/runner-strategic-exchange";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/runner-hand-development-types";
import type { CoverageState } from "../rig-coverage/coverage-types";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

/** Coverage owns the missing answer; the bank owns its current payout.
 * Replace only a strictly longer, currently offered basic-credit sequence.
 * This quotes funding, never a future legal installation or run. */
export function bindRunnerCreditBankCoverageFunding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  gaps: readonly RunnerCoverageGapSignal[],
  signals: readonly RunnerCreditBankSignal[],
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[],
): {
  coverageGaps: RunnerCoverageGapSignal[];
  creditBanks: RunnerCreditBankSignal[];
} {
  const unchanged = () => ({
    coverageGaps: [...gaps],
    creditBanks: [...signals],
  });
  const clicks = input.playerView.own.clicks;
  if (
    input.side !== "runner" ||
    input.playerView.timingPoint !== "runner_action.main" ||
    clicks < 2
  )
    return unchanged();
  const basic = candidates.find(
    (c) =>
      c.actionType === "gain_credit" &&
      c.sourceKind === "basic_action" &&
      c.costProfile.clickCost === 1 &&
      c.economyProjection?.netLiquidCreditGain === 1 &&
      c.economyProjection.creditRestriction === "general",
  );
  if (!basic) return unchanged();
  for (const gap of gaps) {
    const installGap = gap.fundingGap;
    if (
      !gap.answerInHand ||
      !gap.handAnswerDefinitionId ||
      (gap.priorityClass !== "P4" && gap.priorityClass !== "P5") ||
      typeof installGap !== "number" ||
      !Number.isSafeInteger(installGap) ||
      installGap < 2 ||
      installGap > clicks - 1 ||
      gap.answerInstallCost !== input.playerView.own.credits + installGap ||
      gap.sameTurnRunConversion ||
      (gap.preparationActionIds?.length ?? 0) > 0 ||
      (gap.installActionIds?.length ?? 0) > 0 ||
      gap.directSearchActionIds.length > 0 ||
      !gap.fundingActionIds.includes(basic.actionId) ||
      !input.playerView.own.gripOrHq.some(
        (c) => c.definitionId === gap.handAnswerDefinitionId,
      )
    )
      continue;
    const development = handDevelopment.find(
      (e) =>
        e.definitionId === gap.handAnswerDefinitionId &&
        e.fundingNeed?.installOrPlayCost === gap.answerInstallCost,
    );
    const targetCredits = development?.fundingNeed?.targetCredits;
    if (
      targetCredits === undefined ||
      !Number.isSafeInteger(targetCredits) ||
      targetCredits < gap.answerInstallCost!
    )
      continue;
    const missing = targetCredits - input.playerView.own.credits;
    if (missing < installGap) continue;
    const ordinaryFasterIncome = candidates.some((c) => {
      const p = c.economyProjection;
      return (
        c.planOwnerBinding?.owner !== "runner.credit_bank" &&
        !runnerStrategicExchangeRequiresBoundParent(c) &&
        p?.kind === "immediate_liquid" &&
        p.timing === "immediate" &&
        p.creditRestriction === "general" &&
        p.reliability === "guaranteed" &&
        p.netLiquidCreditGain !== undefined &&
        p.netLiquidCreditGain >= missing &&
        typeof c.costProfile.clickCost === "number" &&
        c.costProfile.clickCost <= 1
      );
    });
    if (ordinaryFasterIncome) continue;
    const options = signals
      .flatMap((signal) => {
        if (
          signal.phase === "cash_out" ||
          signal.defenseFunding ||
          signal.runFunding
        )
          return [];
        return candidates
          .filter((c) => {
            const p = c.economyProjection;
            return (
              c.sourceCardInstanceId === signal.bankId &&
              c.planOwnerBinding?.owner === "runner.credit_bank" &&
              c.planOwnerBinding.route === "cash_out" &&
              c.costProfile.clickCost === 1 &&
              (c.costProfile.creditCost ?? 0) === 0 &&
              c.costProfile.additionalCosts.length === 0 &&
              p?.kind === "immediate_liquid" &&
              p.timing === "immediate" &&
              p.creditRestriction === "general" &&
              p.reliability === "guaranteed" &&
              p.sourcePool === "finite" &&
              p.payoutMode === "all_available" &&
              p.cardsConsumed === 0 &&
              p.netLiquidCreditGain !== undefined &&
              p.netLiquidCreditGain >= missing &&
              p.netLiquidCreditGain === signal.estimatedPayout &&
              input.legalActions.some(
                (a) =>
                  a.actionId === c.actionId &&
                  a.side === "runner" &&
                  a.expiresAtStateVersion === input.playerView.stateVersion,
              )
            );
          })
          .map((candidate) => ({ signal, candidate }));
      })
      .sort(
        (a, b) =>
          a.signal.estimatedPayout - b.signal.estimatedPayout ||
          a.signal.bankId.localeCompare(b.signal.bankId),
      );
    const option = options[0];
    if (!option) continue;
    const funding = {
      stateVersion: input.playerView.stateVersion,
      needId: "coverage-bank-funding:" + gap.gapId,
      parentPlanInstanceId:
        "plan:runner.rig_and_coverage:" + encodeURIComponent(gap.gapId),
      gapId: gap.gapId,
      targetDefinitionId: gap.handAnswerDefinitionId,
      targetCredits,
      gap: missing,
      bankId: option.signal.bankId,
      actionId: option.candidate.actionId,
      replacedBasicClicks: missing,
    };
    return {
      coverageGaps: gaps.map((g) =>
        g === gap ? { ...g, fundingGap: missing, bankFunding: funding } : g,
      ),
      creditBanks: signals.map((s) =>
        s !== option.signal
          ? s
          : {
              ...s,
              phase: "cash_out",
              actionIds: [funding.actionId],
              rejectedActionIds: [
                ...new Set([...(s.rejectedActionIds ?? []), ...s.actionIds]),
              ].filter((id) => id !== funding.actionId),
              priorityClass: gap.priorityClass,
              coverageFunding: funding,
              value: 60 + missing,
              evidenceCodes: [
                "runner_credit_bank_replaces_basic_coverage_funding",
                "runner_credit_bank_bound_coverage_gap:" + gap.gapId,
                "runner_credit_bank_replaced_basic_clicks:" + missing,
                ...s.evidenceCodes,
              ],
            },
      ),
    };
  }
  return unchanged();
}

export function runnerCreditBankCoverageParentValue(
  parent: PlanInstance,
  need: NonNullable<RunnerCreditBankSignal["coverageFunding"]>,
  stateVersion: number,
): number | undefined {
  if (
    parent.instanceId !== need.parentPlanInstanceId ||
    parent.moduleId !== "runner.rig_and_coverage" ||
    need.stateVersion !== stateVersion ||
    (parent.viability !== "ready" && parent.viability !== "blocked")
  )
    return undefined;
  const state = parent.moduleState as CoverageState;
  return state.kind === "coverage" &&
    state.phase === "fund_answer" &&
    state.gap.gapId === need.gapId &&
    state.gap.answerInHand &&
    state.gap.handAnswerDefinitionId === need.targetDefinitionId &&
    state.gap.fundingGap === need.gap &&
    state.gap.bankFunding?.needId === need.needId &&
    state.gap.bankFunding.stateVersion === stateVersion &&
    state.gap.bankFunding.actionId === need.actionId &&
    state.gap.bankFunding.targetCredits === need.targetCredits
    ? 60 + need.gap
    : undefined;
}
