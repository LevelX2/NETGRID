import { type AiDecisionInput } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { type RunnerRunAccessCommitmentSignal } from "../../plans/runner-tactical-plan-contracts";
import type { RunnerEconomyPosture } from "../../runner-run-target-evaluation";
import { assessRunnerAccessTrashImpact } from "./runner-access-trash-impact";

export function currentAccessWindowCommitment(
  input: AiDecisionInput,
  economy: RunnerEconomyPosture,
  parentCommitment: RunnerRunAccessCommitmentSignal | undefined,
): RunnerRunAccessCommitmentSignal | undefined {
  const trashAction = input.legalActions.find(
    (action) => action.type === "trash_accessed_card",
  );
  if (!trashAction) return parentCommitment;
  const accessedDefinitionId = input.playerView.run?.accessedCard?.definitionId;
  if (!accessedDefinitionId) return parentCommitment;
  const exactParentTarget =
    parentCommitment?.knownTargetDefinitionIds.includes(
      accessedDefinitionId,
    ) === true;
  const impact = assessRunnerAccessTrashImpact({
    input,
    trashAction,
    economyReserve: economy.desiredCreditReserve,
    parentReservedCredits: exactParentTarget
      ? 0
      : reservedAccessTrashCredits(input, parentCommitment),
  });
  if (!impact) return parentCommitment;
  if (impact.recommendation === "trash") {
    return {
      payoff: "trash_affordable",
      intendedAction: "trash",
      knownTargetDefinitionIds: [accessedDefinitionId],
      trashBudget: impact.trashCost,
      evidenceCode: "access_window_canonical_impact_trash",
    };
  }
  return {
    payoff:
      impact.creditsAfterTrash < impact.requiredReserve
        ? "trash_unaffordable"
        : "known_low_value",
    intendedAction: "decline",
    knownTargetDefinitionIds: [accessedDefinitionId],
    trashBudget: 0,
    evidenceCode:
      impact.creditsAfterTrash < impact.requiredReserve
        ? "access_window_trash_deferred_by_bound_reserve"
        : "access_window_visible_impact_below_cost",
  };
}

export function reservedAccessTrashCredits(
  input: AiDecisionInput,
  commitment: RunnerRunAccessCommitmentSignal | undefined,
): number {
  if (!commitment) return 0;
  if (
    typeof commitment.trashBudget === "number" &&
    Number.isFinite(commitment.trashBudget) &&
    commitment.trashBudget >= 0
  )
    return commitment.trashBudget;
  if (
    commitment.intendedAction !== "trash" &&
    (commitment.trashBudget === "unknown" ||
      commitment.trashBudget === "not_applicable")
  )
    return 0; // No committed trash objective reserves general credits.
  throw new PlanResolutionFailure("missing_action_semantics", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "A committed Runner trash objective requires a known nonnegative general-credit budget from its access owner.",
  });
}
