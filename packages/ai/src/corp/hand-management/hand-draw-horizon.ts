import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { corpDrawCandidatePreservesHandCapacity } from "./hand-overflow";
import type { CorpHandManagementSignal } from "./hand-management-types";

export function corpDrawHorizonPreservationSignals(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  agendaCount: number,
): CorpHandManagementSignal[] {
  const remaining = input.playerView.own.stackOrRdCount;
  if (!Number.isSafeInteger(remaining) || remaining < 0 || remaining >= 3)
    return [];
  return candidates.flatMap((candidate): CorpHandManagementSignal[] => {
    const projection = candidate.economyProjection;
    const action = input.legalActions.find(
      (a) => a.actionId === candidate.actionId,
    );
    if (
      !action ||
      action.side !== "corp" ||
      action.expiresAtStateVersion !== input.playerView.stateVersion ||
      action.targetRequirements.length > 0 ||
      (action.choiceRequirements?.length ?? 0) > 0 ||
      projection?.source !== "legal_action_payload" ||
      projection.reliability !== "guaranteed" ||
      projection.confidence !== "high" ||
      !Number.isSafeInteger(projection.netDrawPileDelta) ||
      (projection.netDrawPileDelta ?? 0) <= 0 ||
      remaining + projection.netDrawPileDelta! < 3 ||
      !Number.isSafeInteger(projection.netHandDelta) ||
      input.playerView.own.gripOrHq.length + projection.netHandDelta < 0 ||
      !corpDrawCandidatePreservesHandCapacity(input, candidate)
    )
      return [];
    return [
      {
        handPlanId: `preserve-draw-horizon:${candidate.actionId}`,
        phase: "preserve_draw_horizon",
        actionIds: [candidate.actionId],
        exactActionRoute: true,
        agendaCount,
        handSize: input.playerView.own.gripOrHq.length,
        maximumHandSize: input.playerView.own.maxHandSize,
        concretePurposeCode:
          "Restore the mandatory draw horizon through the exact Engine-quoted zone transition, then revalidate.",
        value: 100 + projection.netDrawPileDelta!,
        evidenceCode: `corp_preserve_draw_horizon:${remaining}:${remaining + projection.netDrawPileDelta!}`,
      },
    ];
  });
}
