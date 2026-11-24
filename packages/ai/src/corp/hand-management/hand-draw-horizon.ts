import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpDrawCandidatePreservesHandCapacity } from "./hand-overflow";
import type { CorpHandManagementSignal } from "./hand-management-types";

export function corpDrawHorizonPreservationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
): CorpHandManagementSignal[] {
  const { own, stateVersion, timingPoint } = input.playerView;
  const remaining = own.stackOrRdCount;
  const handSize = own.gripOrHq.length;
  if (
    input.side !== "corp" ||
    !Number.isSafeInteger(remaining) ||
    remaining < 0 ||
    remaining >= 3
  )
    return [];
  return candidates.flatMap((candidate): CorpHandManagementSignal[] => {
    const projection = candidate.economyProjection;
    const pileDelta = projection?.netDrawPileDelta;
    const action = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    if (
      !action ||
      action.side !== "corp" ||
      action.expiresAtStateVersion !== stateVersion ||
      action.timingPoint !== timingPoint ||
      action.targetRequirements.length > 0 ||
      (action.choiceRequirements?.length ?? 0) > 0 ||
      projection?.source !== "legal_action_payload" ||
      projection.reliability !== "guaranteed" ||
      projection.confidence !== "high" ||
      pileDelta === undefined ||
      !Number.isSafeInteger(pileDelta) ||
      pileDelta <= 0 ||
      remaining + pileDelta < 3 ||
      !Number.isSafeInteger(projection.netHandDelta) ||
      handSize + projection.netHandDelta < 0 ||
      !corpDrawCandidatePreservesHandCapacity(input, candidate)
    )
      return [];
    const remainingAfter = remaining + pileDelta;
    return [
      {
        handPlanId: `preserve-draw-horizon:${candidate.actionId}`,
        phase: "preserve_draw_horizon",
        actionIds: [candidate.actionId],
        exactActionRoute: true,
        agendaCount,
        handSize,
        maximumHandSize: own.maxHandSize,
        concretePurposeCode:
          "Restore the mandatory draw horizon through the exact Engine-quoted zone transition, then revalidate.",
        value: 100 + pileDelta,
        evidenceCode: `corp_preserve_draw_horizon:${remaining}:${remainingAfter}`,
      },
    ];
  });
}
