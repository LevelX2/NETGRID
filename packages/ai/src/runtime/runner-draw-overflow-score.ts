import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";

export function runnerDrawOverflowScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
  actionSemanticCandidate?: ActionSemanticCandidate,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    (action.type !== "draw_card" &&
      (actionSemanticCandidate?.economyProjection?.cardsDrawn ?? 0) <= 0)
  ) {
    return undefined;
  }
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  const handCount = input.playerView.own.gripOrHq.length;
  const netHandDelta =
    action.type === "draw_card"
      ? 1
      : Math.max(
          0,
          actionSemanticCandidate?.economyProjection?.netHandDelta ?? 0,
        );
  if (netHandDelta === 0) return undefined;
  const projectedHandCount = handCount + netHandDelta;
  const expectedOverflow = Math.max(
    0,
    projectedHandCount - flatlineRisk.effectiveMaxHandSize,
  );
  if (expectedOverflow === 0) return undefined;
  if (
    flatlineRisk.level === "critical" &&
    handCount < flatlineRisk.recommendedHandFloor
  ) {
    return undefined;
  }
  const productiveAlternative = input.legalActions.some(
    (candidate) =>
      candidate.actionId !== action.actionId &&
      candidate.side === "runner" &&
      candidate.type !== "draw_card" &&
      candidate.type !== "gain_credit" &&
      candidate.type !== "end_turn" &&
      candidate.type !== "resolve_choice",
  );
  if (!productiveAlternative) return undefined;

  return {
    key: "runner_expected_draw_overflow",
    label: "Erwarteter Grip-Überlauf",
    value: -Math.min(1_800, 1_050 + (expectedOverflow - 1) * 300),
    reason: [
      `hand:${handCount}`,
      `projected_hand:${projectedHandCount}`,
      `effective_max_hand:${flatlineRisk.effectiveMaxHandSize}`,
      `expected_overflow:${expectedOverflow}`,
      `net_hand_delta:${netHandDelta}`,
      "productive_alternative:true",
    ].join("|"),
  };
}
