import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { runnerDamageThreatAssessment } from "../runner-damage-threat-assessment";

export function runnerHandBufferNeedScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "draw_card") return undefined;
  const handCount = input.playerView.own.gripOrHq.length;
  if (handCount >= 5) return undefined;
  const damageThreat = runnerDamageThreatAssessment(input);
  const damagePressure = damageThreat.level !== "none";
  const baseValue =
    handCount <= 0
      ? 750
      : handCount === 1
        ? 600
        : handCount === 2
          ? 350
          : handCount === 3
            ? 350
            : 150;
  const belowThreatFloor =
    damagePressure && handCount < damageThreat.recommendedHandFloor;
  const damageBoost =
    damageThreat.level === "critical"
      ? handCount <= 0
        ? 2050
        : 1250
      : belowThreatFloor && damageThreat.level === "confirmed"
        ? handCount <= 1
          ? 1100
          : 550
        : belowThreatFloor && damageThreat.level === "suspected"
          ? 300
          : 0;
  return {
    key: "runner_hand_buffer_need",
    label: "Handpuffer-Bedarf",
    value: baseValue + damageBoost,
    reason: [
      `hand:${handCount}`,
      `damage_pressure:${damagePressure}`,
      `damage_threat:${damageThreat.level}`,
      `damage_floor:${damageThreat.recommendedHandFloor}`,
      `base:${baseValue}`,
      `damage_boost:${damageBoost}`,
    ].join("|"),
  };
}
