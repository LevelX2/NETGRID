import type { AiDecisionInput } from "@netgrid/shared";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import { runnerStrategicExchangeRequiresBoundParent } from "../../runtime/runner-strategic-exchange";
import type { RunnerHandDevelopmentEvaluation } from "../hand-development/runner-hand-development-types";
import type { CoverageState } from "../rig-coverage/coverage-types";
import type { RunnerCreditBankSignal } from "./credit-bank-types";

// A coverage quote may use one current payout. The bank still owns its execution.
export function currentRunnerCoverageBankPayout(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  minimumPayout: number,
  actionId?: string,
): { actionId: string; bankId: string; payout: number } | undefined {
  if (!Number.isSafeInteger(minimumPayout) || minimumPayout <= 0)
    return undefined;
  return candidates.flatMap((candidate) => {
    const p = candidate.economyProjection;
    const payout = p?.netLiquidCreditGain;
    const bankId = candidate.sourceCardInstanceId;
    const action = input.legalActions.find(
      (legal) => legal.actionId === candidate.actionId,
    );
    if (
      (actionId !== undefined && candidate.actionId !== actionId) ||
      candidate.actorSide !== "runner" ||
      candidate.stateVersion !== input.playerView.stateVersion ||
      !actionMatchesCurrentDecision(input, action) ||
      action.type !== "activated_card_ability" ||
      action.source !== bankId ||
      action.targetRequirements?.length ||
      action.choiceRequirements?.length ||
      !bankId ||
      !input.playerView.own.rig?.some(
        (card) =>
          card.instanceId === bankId &&
          card.definitionId === candidate.sourceDefinitionId,
      ) ||
      candidate.planOwnerBinding?.owner !== "runner.credit_bank" ||
      candidate.planOwnerBinding.route !== "cash_out" ||
      candidate.costProfile.clickCost !== 1 ||
      (candidate.costProfile.creditCost ?? 0) !== 0 ||
      candidate.costProfile.additionalCosts.length !== 0 ||
      candidate.costProfile.selfDamage?.length ||
      p?.source !== "legal_action_payload" ||
      p.confidence !== "high" ||
      p.kind !== "immediate_liquid" ||
      p.reliability !== "guaranteed" ||
      p.timing !== "immediate" ||
      p.creditRestriction !== "general" ||
      p.sourcePool !== "finite" ||
      p.payoutMode !== "all_available" ||
      p.cardsConsumed !== 0 ||
      p.cardsDrawn !== 0 ||
      p.netHandDelta !== 0 ||
      payout === undefined ||
      !Number.isSafeInteger(payout) ||
      payout < minimumPayout ||
      p.storedCreditsTaken !== payout
    )
      return [];
    return [{ actionId: candidate.actionId, bankId, payout }];
  }).sort(
    (a, b) =>
      a.payout - b.payout ||
      a.bankId.localeCompare(b.bankId) ||
      a.actionId.localeCompare(b.actionId),
  )[0];
}

/** Coverage owns the missing answer; the bank owns its current payout.
 * Use the currently quoted terminal conversion or replace a longer ordinary
 * credit sequence. The subsequent install and run need fresh LegalActions. */
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
  const stateVersion = input.playerView.stateVersion;
  const legalActionIds = new Set(
    input.legalActions
      .filter((action) => actionMatchesCurrentDecision(input, action))
      .map((action) => action.actionId),
  );
  const currentCandidates = candidates.filter(
    (candidate) =>
      candidate.actorSide === "runner" &&
      candidate.stateVersion === stateVersion &&
      legalActionIds.has(candidate.actionId),
  );
  const basic = currentCandidates.find(
    (c) =>
      c.actionType === "gain_credit" &&
      c.sourceKind === "basic_action" &&
      c.costProfile.clickCost === 1 &&
      c.economyProjection?.netLiquidCreditGain === 1 &&
      c.economyProjection.creditRestriction === "general",
  );
  for (const gap of gaps) {
    const installGap = gap.fundingGap;
    if (
      !gap.answerInHand ||
      !gap.handAnswerDefinitionId ||
      typeof installGap !== "number" ||
      !Number.isSafeInteger(installGap) ||
      installGap <= 0 ||
      gap.answerInstallCost === undefined ||
      (gap.preparationActionIds?.length ?? 0) > 0 ||
      !input.playerView.own.gripOrHq.some(
        (c) => c.definitionId === gap.handAnswerDefinitionId,
      )
    )
      continue;
    const conversion = gap.sameTurnRunConversion;
    const urgent =
      conversion?.bankCashOutActionId !== undefined &&
      gap.priorityClass === "P2" &&
      gap.requesterModuleId === "runner.contest_remote" &&
      gap.requesterPlanInstanceId !== undefined &&
      gap.requesterNeedId === gap.gapId &&
      gap.targetRunActionId === conversion.targetRunActionId &&
      conversion.requiredClicksAfterFunding < clicks
        ? currentRunnerCoverageBankPayout(
            input,
            currentCandidates,
            installGap,
            conversion.bankCashOutActionId,
          )
        : undefined;
    if (
      !urgent &&
      ((gap.priorityClass !== "P4" && gap.priorityClass !== "P5") ||
        installGap < 2 ||
        installGap > clicks - 1 ||
        gap.answerInstallCost !== input.playerView.own.credits + installGap ||
        conversion !== undefined ||
        (gap.installActionIds?.length ?? 0) > 0 ||
        gap.directSearchActionIds.length > 0 ||
        !basic ||
        !gap.fundingActionIds.includes(basic.actionId))
    )
      continue;
    const development = handDevelopment.find(
      (e) =>
        e.definitionId === gap.handAnswerDefinitionId &&
        e.fundingNeed?.installOrPlayCost === gap.answerInstallCost,
    );
    const targetCredits = urgent
      ? conversion?.requiredCredits
      : development?.fundingNeed?.targetCredits;
    if (
      targetCredits === undefined ||
      !Number.isSafeInteger(targetCredits) ||
      targetCredits < gap.answerInstallCost
    )
      continue;
    const missing = targetCredits - input.playerView.own.credits;
    if (urgent ? missing !== installGap : missing < installGap) continue;
    const ordinaryFasterIncome = currentCandidates.some((c) => {
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
        return currentCandidates
          .filter((c) => {
            const p = c.economyProjection;
            return (
              (!urgent || c.actionId === urgent.actionId) &&
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
              p.netLiquidCreditGain === signal.estimatedPayout
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
      stateVersion,
      needId: "coverage-bank-funding:" + gap.gapId,
      parentPlanInstanceId: planInstanceIdForProposal({
        moduleId: "runner.rig_and_coverage",
        dedupeKey: gap.gapId,
      }),
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
                urgent
                  ? "runner_credit_bank_funds_urgent_remote_coverage"
                  : "runner_credit_bank_replaces_basic_coverage_funding",
                "runner_credit_bank_bound_coverage_gap:" + gap.gapId,
                ...(urgent
                  ? []
                  : ["runner_credit_bank_replaced_basic_clicks:" + missing]),
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
    state.gap.bankFunding.bankId === need.bankId &&
    state.gap.bankFunding.targetCredits === need.targetCredits
    ? 60 + need.gap
    : undefined;
}
