import type {
  V143SimulationRunResult,
  V143TuningGateResult,
} from "../index";
import { roundNumber as round } from "../runtime/number-rounding";

export function evaluateV143TuningGate(
  candidate: V143SimulationRunResult,
  baseline: V143SimulationRunResult,
): V143TuningGateResult {
  const holdoutDelta = {
    winRate: round(
      (candidate.winRates.runner ?? 0) - (baseline.winRates.runner ?? 0),
    ),
    fallbackRate: round(candidate.fallbackRate - baseline.fallbackRate),
    timeoutRate: round(
      candidate.timeouts / Math.max(candidate.games, 1) -
        baseline.timeouts / Math.max(baseline.games, 1),
    ),
    illegalActions: candidate.illegalActions - baseline.illegalActions,
    replayFailures: candidate.replayFailures - baseline.replayFailures,
  };
  const hardRegression =
    holdoutDelta.illegalActions > 0 ||
    holdoutDelta.replayFailures > 0 ||
    holdoutDelta.timeoutRate > 0;
  if (hardRegression) {
    return {
      accepted: false,
      holdoutDelta,
      reason: "holdout_regression_on_safety_or_replay",
    };
  }
  const improved =
    holdoutDelta.winRate >= 0 &&
    holdoutDelta.fallbackRate <= 0 &&
    holdoutDelta.timeoutRate <= 0;
  return {
    accepted: improved,
    holdoutDelta,
    reason: improved
      ? "holdout_improved_or_stable"
      : "tradeoff_review_required",
  };
}
