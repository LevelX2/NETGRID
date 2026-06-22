import type {
  RunnerRunTargetEvaluation,
  RunnerRunTargetRecommendation,
} from "./runner-run-target-evaluation";

type RunTargetSemanticGuidanceInput = Pick<
  RunnerRunTargetEvaluation,
  "recommendation" | "accessPayoff"
>;

type RunTargetPayoffInput = Pick<
  RunnerRunTargetEvaluation,
  | "accessPayoff"
  | "creditsAfterRun"
  | "knownAccessState"
  | "pathPassability"
  | "recommendation"
>;

type RunTargetTacticalPriorityInput = Pick<
  RunnerRunTargetEvaluation,
  "recommendation"
>;

export type RunnerRunTargetMultiRunPayoffClass =
  | "high_payoff"
  | "unknown_probe"
  | "low_payoff"
  | "blocked"
  | "missing_target";

export const RUNNER_RUN_TARGET_TACTICAL_PRIORITY_DELTA_BY_RECOMMENDATION = {
  run_now: 180,
  run_if_free: 40,
  setup_first: -80,
  draw_for_damage_buffer: -520,
  gain_credits_first: -180,
  find_breaker_first: -220,
  known_no_current_payoff: -620,
  remote_changed_reassess: -180,
  declined_trash_memory_active: -520,
  do_not_run_now: -720,
} as const satisfies Record<RunnerRunTargetRecommendation, number>;

const RUNNER_RUN_TARGET_SEMANTIC_GUIDANCE_VALUE_BY_RECOMMENDATION = {
  run_now: 0,
  run_if_free: -900,
  setup_first: -1600,
  draw_for_damage_buffer: -3600,
  gain_credits_first: -2100,
  find_breaker_first: -2600,
  known_no_current_payoff: -4800,
  remote_changed_reassess: -2400,
  declined_trash_memory_active: -4200,
  do_not_run_now: -5000,
} as const satisfies Record<RunnerRunTargetRecommendation, number>;

const UNKNOWN_PAYOFF_RUN_IF_FREE_SEMANTIC_GUIDANCE_VALUE = -1700;

export function runnerRunTargetSemanticGuidanceValue(
  evaluation: RunTargetSemanticGuidanceInput,
): number {
  if (
    evaluation.recommendation === "run_if_free" &&
    evaluation.accessPayoff === "unknown"
  ) {
    return UNKNOWN_PAYOFF_RUN_IF_FREE_SEMANTIC_GUIDANCE_VALUE;
  }
  return RUNNER_RUN_TARGET_SEMANTIC_GUIDANCE_VALUE_BY_RECOMMENDATION[
    evaluation.recommendation
  ];
}

export function runnerRunTargetHighPayoff(
  evaluation: Pick<RunnerRunTargetEvaluation, "accessPayoff">,
): boolean {
  return (
    evaluation.accessPayoff === "agenda" ||
    evaluation.accessPayoff === "score_threat" ||
    evaluation.accessPayoff === "trash_affordable" ||
    evaluation.accessPayoff === "fresh" ||
    evaluation.accessPayoff === "access_bonus"
  );
}

export function runnerRunTargetPlausibleForMultiRun(
  evaluation: RunTargetPayoffInput | undefined,
): boolean {
  if (!evaluation) return false;
  if (evaluation.pathPassability !== "reachable") return false;
  if (evaluation.creditsAfterRun < 0) return false;
  if (evaluation.knownAccessState === "known_no_current_payoff") return false;
  if (runnerRunTargetHighPayoff(evaluation)) return true;
  return (
    evaluation.recommendation === "run_now" ||
    evaluation.recommendation === "run_if_free"
  );
}

export function runnerRunTargetMultiRunPayoffClass(
  evaluation: RunTargetPayoffInput | undefined,
): RunnerRunTargetMultiRunPayoffClass {
  if (!evaluation) return "missing_target";
  if (
    evaluation.pathPassability !== "reachable" ||
    evaluation.creditsAfterRun < 0
  ) {
    return "blocked";
  }
  if (evaluation.knownAccessState === "known_no_current_payoff") {
    return "low_payoff";
  }
  if (evaluation.accessPayoff === "unknown") return "unknown_probe";
  if (runnerRunTargetHighPayoff(evaluation)) return "high_payoff";
  if (evaluation.recommendation === "run_if_free") return "unknown_probe";
  return evaluation.recommendation === "run_now" ? "high_payoff" : "low_payoff";
}

export function runnerRunTargetTacticalPriorityDelta(
  evaluation: RunTargetTacticalPriorityInput,
): number {
  return RUNNER_RUN_TARGET_TACTICAL_PRIORITY_DELTA_BY_RECOMMENDATION[
    evaluation.recommendation
  ];
}

export function runnerRunTargetRecommendationGuidanceKeys(): RunnerRunTargetRecommendation[] {
  return Object.keys(
    RUNNER_RUN_TARGET_TACTICAL_PRIORITY_DELTA_BY_RECOMMENDATION,
  ) as RunnerRunTargetRecommendation[];
}
