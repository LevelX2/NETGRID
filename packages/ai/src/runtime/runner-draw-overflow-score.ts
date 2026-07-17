import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";

import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";

export function runnerDrawOverflowScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    input.side !== "runner" ||
    action.side !== "runner" ||
    action.type !== "draw_card"
  ) {
    return undefined;
  }
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  const handCount = input.playerView.own.gripOrHq.length;
  const projectedHandCount = handCount + 1;
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
    value: -Math.min(1_800, 900 + (expectedOverflow - 1) * 300),
    reason: [
      `hand:${handCount}`,
      `projected_hand:${projectedHandCount}`,
      `effective_max_hand:${flatlineRisk.effectiveMaxHandSize}`,
      `expected_overflow:${expectedOverflow}`,
      "productive_alternative:true",
    ].join("|"),
  };
}
