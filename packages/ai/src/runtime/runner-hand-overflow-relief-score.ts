import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";

export function runnerHandOverflowReliefScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "install_card" && action.type !== "play_event") {
    return undefined;
  }
  const sourceId = String(action.payload?.cardId ?? action.source ?? "");
  if (
    !input.playerView.own.gripOrHq.some((card) => card.instanceId === sourceId)
  ) {
    return undefined;
  }
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  const handCount = input.playerView.own.gripOrHq.length;
  const currentOverflow = Math.max(
    0,
    handCount - flatlineRisk.effectiveMaxHandSize,
  );
  if (currentOverflow === 0) return undefined;
  const netHandDelta =
    action.type === "install_card"
      ? -1
      : (actionSemanticCandidate?.economyProjection?.netHandDelta ?? -1);
  const relievedCards = Math.min(currentOverflow, Math.max(0, -netHandDelta));
  if (relievedCards === 0) return undefined;

  return {
    key: "runner_hand_overflow_relief",
    label: "Grip-Überlauf abbauen",
    value: Math.min(360, relievedCards * 120),
    reason: [
      `hand:${handCount}`,
      `effective_max_hand:${flatlineRisk.effectiveMaxHandSize}`,
      `current_overflow:${currentOverflow}`,
      `net_hand_delta:${netHandDelta}`,
      `relieved_cards:${relievedCards}`,
    ].join("|"),
  };
}
