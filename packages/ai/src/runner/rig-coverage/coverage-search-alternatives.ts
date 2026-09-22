import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";

export function runnerAffordableCoverageSearchActionIds(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  gap: RunnerCoverageGapSignal,
): string[] {
  const own = input.playerView.own;
  if (
    !gap.answerInHand ||
    gap.sameTurnRunConversion !== undefined ||
    gap.answerInstallCost === undefined ||
    gap.answerInstallCost <= own.credits ||
    own.gripOrHq.length >= own.maxHandSize
  )
    return [];
  const inventory = (input as AiDecisionInputWithDeckCapabilities)
    .ownDeckCapabilities?.runner?.breakerInventory;
  return gap.directSearchActionIds.filter((actionId) => {
    const binding = gap.directSearchChoiceBindings?.find(
      (b) => b.actionId === actionId,
    );
    const target = inventory?.find(
      (card) => card.cardId === binding?.targetDefinitionId,
    );
    const action = input.legalActions.find((a) => a.actionId === actionId);
    const candidate = candidates.find((c) => c.actionId === actionId);
    if (
      action?.payload?.cardImplementationEffectKind !==
        "search_stack_to_grip" ||
      candidate?.costProfile.costKnownStatus !== "known" ||
      candidate.costProfile.creditCost === undefined ||
      target?.confidence !== "high" ||
      target.quantityKnownInDeck <= 0 ||
      !target.locations.includes("in_deck") ||
      target.installCost === undefined ||
      target.memoryCost === undefined ||
      own.memoryLimit === undefined ||
      own.memoryUsed === undefined
    )
      return false;
    // This is a staged acquisition, not a claim that installation or a run
    // can finish this turn. Rebind the actual install after the search choice.
    const acquisitionCost =
      candidate.costProfile.creditCost + target.installCost;
    return (
      acquisitionCost <= own.credits &&
      acquisitionCost < gap.answerInstallCost! &&
      target.memoryCost <= own.memoryLimit - own.memoryUsed
    );
  });
}
