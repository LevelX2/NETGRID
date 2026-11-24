import { costProfileForAction } from "../../actions/action-cost-timing";
import { actionMatchesCurrentDecision } from "../../actions/current-legal-action";
import {
  visibleRunnerInitialProgramInstallCredits,
  visibleRunnerPreparationIncomePerClick,
} from "@netgrid/engine";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { technicalIdCompare } from "../../runtime/runtime-identifiers";

/** Coverage owns this preparation only for its already selected hand answer.
 * The next install is rematerialized from new LegalActions after setup. */
export function runnerCoverageInstallCreditPreparation(
  input: AiDecisionInput,
  gap: RunnerCoverageGapSignal,
): RunnerCoverageGapSignal {
  if (
    input.side !== "runner" ||
    gap.priorityClass === "P2" ||
    gap.sameTurnRunConversion ||
    !gap.handAnswerDefinitionId ||
    gap.preparationActionIds?.length ||
    gap.memorySupportActionIds?.length ||
    input.playerView.timingPoint !== "runner_action.main"
  )
    return gap;
  const { memoryLimit, memoryUsed } = input.playerView.own;
  if (!Number.isSafeInteger(memoryLimit) || !Number.isSafeInteger(memoryUsed))
    return gap;
  const currentInstall = (action: LegalAction) =>
    actionMatchesCurrentDecision(input, action) &&
    action.type === "install_card" &&
    action.payload?.runnerProgramTrashBeforeInstall !== true;
  const installOffers = input.legalActions
    .filter(currentInstall)
    .flatMap((action) => {
      const cost = costProfileForAction(action);
      if (
        cost.clickCost === undefined ||
        cost.creditCost === undefined ||
        cost.additionalCosts.length !== 0
      )
        return [];
      return [{ action, clicks: cost.clickCost, credits: cost.creditCost }];
    });
  const answers = installOffers.filter(({ action }) =>
    gap.installActionIds?.includes(action.actionId),
  );
  const income = visibleRunnerPreparationIncomePerClick(
    input.playerView.own.rig ?? [],
  );
  const preparations: NonNullable<
    RunnerCoverageGapSignal["installCreditPreparation"]
  >[] = [];
  for (const {
    action,
    clicks: setupClicks,
    credits: setupCredits,
  } of installOffers) {
    const source = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === action.source,
    );
    if (!source || source.definitionId === gap.handAnswerDefinitionId) continue;
    const pool = visibleRunnerInitialProgramInstallCredits(source);
    if (pool <= 0) continue;
    for (const {
      action: answer,
      clicks: targetClicks,
      credits: targetCredits,
    } of answers) {
      const target = input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === answer.source,
      );
      if (
        !target ||
        target.type !== "program" ||
        target.definitionId !== gap.handAnswerDefinitionId
      )
        continue;
      const sourceMu = source.type === "program" ? source.memoryCost : 0;
      const targetMu = target.memoryCost;
      if (
        !Number.isSafeInteger(sourceMu) ||
        !Number.isSafeInteger(targetMu) ||
        memoryUsed! + sourceMu! + targetMu! > memoryLimit! ||
        setupClicks + targetClicks > input.playerView.own.clicks
      )
        continue;
      const saving = Math.min(pool, targetCredits) - setupCredits;
      if (
        !Number.isSafeInteger(saving) ||
        setupCredits + Math.max(0, targetCredits - pool) >
          input.playerView.own.credits ||
        saving <= setupClicks * income
      )
        continue;
      preparations.push({
        actionId: action.actionId,
        sourceCardInstanceId: source.instanceId,
        targetCardInstanceId: target.instanceId,
        targetDefinitionId: target.definitionId!,
        savedLiquidCredits: saving,
        stateVersion: input.playerView.stateVersion,
      });
    }
  }
  preparations.sort(
    (a, b) =>
      b.savedLiquidCredits - a.savedLiquidCredits ||
      technicalIdCompare(a.actionId, b.actionId) ||
      technicalIdCompare(a.targetCardInstanceId, b.targetCardInstanceId),
  );
  const best = preparations[0];
  return best
    ? {
        ...gap,
        preparationActionIds: [best.actionId],
        installCreditPreparation: best,
      }
    : gap;
}
