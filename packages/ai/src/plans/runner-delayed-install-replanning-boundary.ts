import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { delayedInstallAbilityForAction } from "../actions/delayed-install-action";
import {
  assessTurnObservationBoundary,
  type BoundaryActionAssessment,
} from "./turn-projection";

export function runnerDelayedInstallReplanningBoundary(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  remainingActionCapacity: Readonly<{ minimum: number; maximum: number }>,
): BoundaryActionAssessment | undefined {
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    !action ||
    action.side !== "runner" ||
    action.type !== "trigger_ability" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    candidate.sourceKind !== "card" ||
    candidate.sourceCardInstanceId === undefined ||
    candidate.sourceCardInstanceId !== action.source ||
    action.payload?.cardId !== action.source ||
    delayedInstallAbilityForAction(action) === undefined
  ) {
    return undefined;
  }

  return assessTurnObservationBoundary({
    boundaryKind: "projected_plan_discovery_required",
    remainingActionCapacity,
    residualTurnValueBasis: "public_outcome_distribution",
    immediateOutcomeCodes: [
      "delayed_install_state_changed",
      "free_install_or_memory_choice_may_open",
    ],
    uncertainty: [
      { code: "delayed_install_post_resolution_replanning_required" },
    ],
    assumptionIds: ["delayed_install_action_revalidated_by_engine"],
  });
}
