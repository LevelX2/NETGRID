import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
export function hasExactNonNegativeCostProfile(
  candidate: ActionSemanticCandidate,
): boolean {
  return (
    isFiniteNonNegativeInteger(candidate.costProfile.creditCost) &&
    isFiniteNonNegativeInteger(candidate.costProfile.clickCost)
  );
}

export function isFiniteNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function finiteNonNegativeIntegerOrResolutionFailure(
  input: AiDecisionInput,
  value: number | undefined,
  removalCondition: string,
): number {
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return value;
  }
  throw new PlanResolutionFailure("missing_action_semantics", {
    side: input.side,
    stateVersion: input.playerView.stateVersion,
    timingPoint: input.playerView.timingPoint,
    legalActionTypes: input.legalActions.map((action) => action.type),
    owner: "action_semantics",
    removalCondition,
  });
}
