import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import { runnerVisibleDamagePressure } from "../runner-visible-damage-pressure";

export function runnerHandBufferNeedScoreComponent(
  input: AiDecisionInput,
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (input.side !== "runner" || action.side !== "runner") return undefined;
  if (action.type !== "draw_card") return undefined;
  const handCount = input.playerView.own.gripOrHq.length;
  if (handCount >= 5) return undefined;
  const damagePressure = runnerVisibleDamagePressure(input);
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
  const damageBoost =
    damagePressure && handCount <= 0
      ? 1750
      : damagePressure && handCount === 1
        ? 900
        : damagePressure && handCount === 2
          ? 350
          : 0;
  return {
    key: "runner_hand_buffer_need",
    label: "Handpuffer-Bedarf",
    value: baseValue + damageBoost,
    reason: [
      `hand:${handCount}`,
      `damage_pressure:${damagePressure}`,
      `base:${baseValue}`,
      `damage_boost:${damageBoost}`,
    ].join("|"),
  };
}
