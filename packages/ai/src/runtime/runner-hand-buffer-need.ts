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
  const flatlineRisk = runnerDamageThreatAssessment(input).flatlineRisk;
  const damagePressure = flatlineRisk.level !== "none";
  const temporaryBufferBeforeRiskyRun =
    flatlineRisk.handBufferHeadroom === 0 &&
    input.playerView.own.clicks > 1 &&
    (flatlineRisk.level === "confirmed" || flatlineRisk.level === "critical") &&
    !input.legalActions.some(
      (legalAction) =>
        legalAction.side === "runner" &&
        legalAction.payload?.cardImplementationScoresSourceAsAgenda === true,
    ) &&
    input.legalActions.some(
      (legalAction) =>
        legalAction.side === "runner" &&
        legalAction.type === "start_run" &&
        typeof legalAction.payload?.serverId === "string" &&
        flatlineRisk.riskyRunServerIds.includes(legalAction.payload.serverId),
    );
  if (flatlineRisk.handBufferHeadroom === 0 && !temporaryBufferBeforeRiskyRun) {
    return undefined;
  }
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
    damagePressure && handCount < flatlineRisk.recommendedHandFloor;
  const damageBoost =
    flatlineRisk.level === "critical"
      ? handCount <= 0
        ? 2050
        : 1250
      : belowThreatFloor && flatlineRisk.level === "confirmed"
        ? handCount <= 1
          ? 1100
          : 550
        : belowThreatFloor && flatlineRisk.level === "suspected"
          ? 300
          : temporaryBufferBeforeRiskyRun
            ? 500
            : 0;
  return {
    key: "runner_hand_buffer_need",
    label: "Handpuffer-Bedarf",
    value: baseValue + damageBoost,
    reason: [
      `hand:${handCount}`,
      `damage_pressure:${damagePressure}`,
      `flatline_risk:${flatlineRisk.level}`,
      `damage_floor:${flatlineRisk.recommendedHandFloor}`,
      `effective_max_hand:${flatlineRisk.effectiveMaxHandSize}`,
      `hand_buffer_headroom:${flatlineRisk.handBufferHeadroom}`,
      `buffer_mode:${temporaryBufferBeforeRiskyRun ? "temporary_before_risky_run" : "durable"}`,
      `base:${baseValue}`,
      `damage_boost:${damageBoost}`,
    ].join("|"),
  };
}
