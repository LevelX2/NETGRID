import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import {
  assessTurnObservationBoundary,
  type BoundaryActionAssessment,
} from "../../plans/turn-projection";

/**
 * The current-head search does not project installation or advancement onto
 * the board and cannot materialize their subsequent advance/score actions.
 * An admitted score campaign therefore revalidates at that real state before
 * it can declare its milestone complete and hand remaining clicks to a sibling.
 * This is a projection boundary, not a priority claim or a locked campaign.
 */
export function scoreMilestoneBoundary(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): BoundaryActionAssessment | undefined {
  if (
    candidate.semanticActionType !== "install.card" &&
    candidate.semanticActionType !== "score.advance_card"
  )
    return undefined;
  const agenda = [
    ...input.playerView.own.gripOrHq,
    ...input.playerView.servers.flatMap((server) => server.root),
  ].find((card) => card.instanceId === candidate.sourceCardInstanceId);
  if (agenda?.type !== "agenda") return undefined;
  const remaining = Math.max(
    0,
    input.playerView.own.clicks - (candidate.costProfile.clickCost ?? 0),
  );
  return assessTurnObservationBoundary({
    boundaryKind: "projection_not_supported",
    remainingActionCapacity: { minimum: remaining, maximum: remaining },
    residualTurnValueBasis: "remaining_capacity",
    immediateOutcomeCodes: [
      candidate.semanticActionType === "install.card"
        ? "score_agenda_installed_requires_current_advance_route"
        : "score_agenda_advanced_requires_current_conversion_route",
    ],
    uncertainty: [{ code: "score_milestone_continuation_requires_real_state" }],
    assumptionIds: ["exact_score_owner_current_route_executable"],
  });
}
