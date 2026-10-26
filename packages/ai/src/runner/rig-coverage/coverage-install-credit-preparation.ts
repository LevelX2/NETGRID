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
    action.side === "runner" &&
    action.type === "install_card" &&
    action.timingPoint === input.playerView.timingPoint &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    action.payload?.runnerProgramTrashBeforeInstall !== true;
  const creditCost = (action: LegalAction) =>
    action.costs.reduce((sum, cost) => sum + (cost.credits ?? 0), 0) -
    Number(action.payload?.runnerInstallPaymentHostedCredits ?? 0);
  const clickCost = (action: LegalAction) =>
    action.costs.reduce((sum, cost) => sum + (cost.clicks ?? 0), 0);
  const answers = input.legalActions.filter(
    (action) =>
      gap.installActionIds?.includes(action.actionId) && currentInstall(action),
  );
  const income = visibleRunnerPreparationIncomePerClick(
    input.playerView.own.rig ?? [],
  );
  const preparations: NonNullable<
    RunnerCoverageGapSignal["installCreditPreparation"]
  >[] = [];
  for (const action of input.legalActions.filter(currentInstall)) {
    const source = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === action.source,
    );
    if (!source || source.definitionId === gap.handAnswerDefinitionId) continue;
    const pool = visibleRunnerInitialProgramInstallCredits(source);
    if (pool <= 0) continue;
    for (const answer of answers) {
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
        clickCost(action) + clickCost(answer) > input.playerView.own.clicks
      )
        continue;
      const setupCredits = creditCost(action);
      const targetCredits = creditCost(answer);
      const saving = Math.min(pool, targetCredits) - setupCredits;
      if (
        !Number.isSafeInteger(saving) ||
        setupCredits + Math.max(0, targetCredits - pool) >
          input.playerView.own.credits ||
        saving <= clickCost(action) * income
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
      technicalIdCompare(a.actionId, b.actionId),
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
