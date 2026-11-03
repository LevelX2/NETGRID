import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

/** Fixed complete Engine paths publish costs for the whole remaining score.
 * Conditional funding/generated-action paths intentionally omit this fact;
 * their existing domain evaluations remain responsible for those routes.
 */
export function scoreQuotedResourceCost(
  signal: CorpScoreProjectSignal,
  input: AiDecisionInput,
): { credits: number; clicks: number } | undefined {
  const cost = signal.sameTurnConversionResourceCost;
  if (cost === undefined) return undefined;
  if (
    signal.sameTurnConversionProof !== "engine_quoted_path" ||
    cost.stateVersion !== input.playerView.stateVersion ||
    !Number.isSafeInteger(cost.credits) ||
    cost.credits < 0 ||
    !Number.isSafeInteger(cost.clicks) ||
    cost.clicks < 0
  ) {
    throw new PlanResolutionFailure("invalid_support_graph", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      unresolvedActionIds: signal.actionIds ?? [],
      owner: "plan_module",
      removalCondition:
        "Publish the complete fixed score resource cost from the exact current Engine-quoted score path.",
    });
  }
  return cost;
}
