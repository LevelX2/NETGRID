import type { PlanModuleId } from "./plan-kernel-types";
import { runnerTurnPlanningModuleCoverage } from "./runner-turn-planning-coverage";

export function runnerEvaluationValues(
  moduleId: PlanModuleId,
  unboundedUtility: number,
  handQualityAdjustment: number,
): Record<string, number> {
  const ownerKind = runnerTurnPlanningModuleCoverage(moduleId)?.ownerKind;
  const dimension = {
    economy: "economy",
    breaker: "defense",
    defense: "defense",
    development: "hand_quality",
    run: "agenda_progress",
    multiaccess: "agenda_progress",
    agenda: "terminal_outcome",
    resource: "flexibility",
    information: "flexibility",
    turn_completion: "flexibility",
  }[ownerKind ?? "turn_completion"];
  const utility = boundedRunnerTurnUtility(unboundedUtility);
  const evaluationValues = { [dimension]: utility };
  if (handQualityAdjustment !== 0) {
    evaluationValues.hand_quality =
      (evaluationValues.hand_quality ?? 0) + handQualityAdjustment;
  }
  return evaluationValues;
}

export function boundedRunnerTurnUtility(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // Owner quotes may carry a bounded fractional tie-break after exact costs.
  // Rounding erases that ordering before the authoritative remainder search.
  return Math.max(-10_000, Math.min(10_000, value));
}
