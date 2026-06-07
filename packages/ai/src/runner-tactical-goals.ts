import type { AiDecisionInput } from "@netgrid/shared";
import type { DeckCapabilityProfile } from "./deck-capabilities";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "./runner-run-target-evaluation";
import type { RunnerStrategicIntentProfile } from "./runner-strategic-intent";

export const RUNNER_TACTICAL_GOAL_SCHEMA_VERSION =
  "runner-tactical-goal-v1" as const;

export type RunnerTacticalGoalId =
  | "runner.find_or_install_primary_breaker"
  | "runner.build_economy_base"
  | "runner.draw_or_search_for_setup"
  | "runner.avoid_low_value_risk_runs"
  | "runner.pressure_good_central_target"
  | "runner.contest_remote_if_score_threat"
  | "runner.maintain_credit_and_hand_buffer"
  | "runner.use_bypass_for_high_value_access";

export type RunnerTacticalGoalFamily =
  | "setup"
  | "economy"
  | "pressure"
  | "remote_contest"
  | "risk_control";

export type RunnerTacticalGoal = {
  schemaVersion: typeof RUNNER_TACTICAL_GOAL_SCHEMA_VERSION;
  goalId: RunnerTacticalGoalId;
  family: RunnerTacticalGoalFamily;
  priority: number;
  urgency: "low" | "medium" | "high";
  targetServerId?: string;
  source:
    | "strategic_intent"
    | "run_target_evaluation"
    | "economy_posture"
    | "deck_capability";
  evidence: string[];
};

export type BuildRunnerTacticalGoalsParams = {
  input: AiDecisionInput;
  strategicIntent?: RunnerStrategicIntentProfile;
  runTargetEvaluations?: readonly RunnerRunTargetEvaluation[];
  economyPosture?: RunnerEconomyPosture;
  deckCapabilities?: DeckCapabilityProfile;
};

export function buildRunnerTacticalGoals(
  params: BuildRunnerTacticalGoalsParams,
): RunnerTacticalGoal[] {
  if (params.input.side !== "runner") return [];
  const goals: RunnerTacticalGoal[] = [];
  const strategicIntent = params.strategicIntent;
  const runTargets = params.runTargetEvaluations ?? [];
  const economyPosture = params.economyPosture;
  const deckCapabilities = params.deckCapabilities;
  if (
    strategicIntent?.setupEngine.includes("runner.search_breaker_setup") ||
    strategicIntent?.setupEngine.includes("runner.rig_first") ||
    runnerUniversalCoverageNotInstalled(deckCapabilities)
  ) {
    goals.push(goal({
      goalId: "runner.find_or_install_primary_breaker",
      family: "setup",
      priority: 900,
      urgency: "high",
      source: "strategic_intent",
      evidence: [
        "setup_engine:breaker_or_rig",
        `universal_coverage_not_installed:${runnerUniversalCoverageNotInstalled(deckCapabilities)}`,
      ],
    }));
  }
  if (
    economyPosture?.buildEconomyBeforePressure ||
    economyPosture?.recommendation === "build_economy" ||
    economyPosture?.recommendation === "cash_out_bank"
  ) {
    goals.push(goal({
      goalId: "runner.build_economy_base",
      family: "economy",
      priority: economyPosture.fundingNeed ? 940 : 780,
      urgency: economyPosture.fundingNeed ? "high" : "medium",
      source: "economy_posture",
      evidence: [
        `economy_recommendation:${economyPosture.recommendation}`,
        `desired_credit_reserve:${economyPosture.desiredCreditReserve}`,
      ],
    }));
  }
  if (
    strategicIntent?.setupEngine.includes("runner.draw_or_search_setup") ||
    strategicIntent?.setupEngine.includes("runner.search_breaker_setup")
  ) {
    goals.push(goal({
      goalId: "runner.draw_or_search_for_setup",
      family: "setup",
      priority: 820,
      urgency: "medium",
      source: "strategic_intent",
      evidence: ["setup_engine:draw_or_search"],
    }));
  }
  const lowValueRuns = runTargets.filter((target) =>
    target.recommendation === "do_not_run_now" ||
    target.knownAccessState === "known_no_current_payoff"
  );
  if (
    lowValueRuns.length > 0 ||
    strategicIntent?.riskProfile.includes(
      "runner.risky_universal_breaker_pressure",
    )
  ) {
    goals.push(goal({
      goalId: "runner.avoid_low_value_risk_runs",
      family: "risk_control",
      priority: lowValueRuns.length > 0 ? 960 : 760,
      urgency: lowValueRuns.length > 0 ? "high" : "medium",
      source: lowValueRuns.length > 0
        ? "run_target_evaluation"
        : "strategic_intent",
      evidence: [
        `low_value_target_count:${lowValueRuns.length}`,
        `risky_universal_pressure:${strategicIntent?.riskProfile.includes("runner.risky_universal_breaker_pressure") === true}`,
      ],
    }));
  }
  for (const target of runTargets.filter(
    (evaluation) =>
      (evaluation.targetKind === "rd" || evaluation.targetKind === "hq") &&
      evaluation.recommendation === "run_now",
  )) {
    goals.push(goal({
      goalId: "runner.pressure_good_central_target",
      family: "pressure",
      priority: 880 + Math.max(0, Math.min(120, target.score)),
      urgency: "high",
      targetServerId: target.targetServerId,
      source: "run_target_evaluation",
      evidence: [
        `target:${target.targetServerId}`,
        `access_payoff:${target.accessPayoff}`,
        `recommendation:${target.recommendation}`,
      ],
    }));
  }
  for (const target of runTargets.filter(
    (evaluation) => evaluation.targetKind === "remote" && evaluation.scoreThreat,
  )) {
    goals.push(goal({
      goalId: "runner.contest_remote_if_score_threat",
      family: "remote_contest",
      priority: target.recommendation === "find_breaker_first" ? 900 : 880,
      urgency: "high",
      targetServerId: target.targetServerId,
      source: "run_target_evaluation",
      evidence: [
        `target:${target.targetServerId}`,
        `path_passability:${target.pathPassability}`,
        `recommendation:${target.recommendation}`,
      ],
    }));
  }
  if (
    economyPosture?.riskAdjustedRunReserve ||
    (economyPosture &&
      params.input.playerView.own.credits < economyPosture.desiredCreditReserve)
  ) {
    goals.push(goal({
      goalId: "runner.maintain_credit_and_hand_buffer",
      family: "risk_control",
      priority: 740,
      urgency: economyPosture?.fundingNeed ? "high" : "medium",
      source: "economy_posture",
      evidence: [
        `risk_adjusted_run_reserve:${economyPosture?.riskAdjustedRunReserve === true}`,
        `credits:${params.input.playerView.own.credits}`,
      ],
    }));
  }
  if (
    strategicIntent?.pressureVectors.includes(
      "runner.conditional_remote_contest",
    ) &&
    runTargets.some((target) => highValueRunTarget(target))
  ) {
    goals.push(goal({
      goalId: "runner.use_bypass_for_high_value_access",
      family: "pressure",
      priority: 760,
      urgency: "medium",
      source: "strategic_intent",
      evidence: ["pressure_vector:conditional_remote_contest"],
    }));
  }
  return dedupeGoals(goals).sort(
    (left, right) =>
      right.priority - left.priority ||
      urgencyRank(right.urgency) - urgencyRank(left.urgency) ||
      left.goalId.localeCompare(right.goalId) ||
      (left.targetServerId ?? "").localeCompare(right.targetServerId ?? ""),
  );
}

export function redactedRunnerTacticalGoalFacts(
  goals: readonly RunnerTacticalGoal[],
): string[] {
  return goals.slice(0, 12).map((goal) =>
    [
      `runner_tactical_goal:${goal.goalId}`,
      `family:${goal.family}`,
      `priority:${goal.priority}`,
      `urgency:${goal.urgency}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  );
}

function goal(
  params: Omit<RunnerTacticalGoal, "schemaVersion">,
): RunnerTacticalGoal {
  return {
    schemaVersion: RUNNER_TACTICAL_GOAL_SCHEMA_VERSION,
    ...params,
  };
}

function runnerUniversalCoverageNotInstalled(
  deckCapabilities: DeckCapabilityProfile | undefined,
): boolean {
  const universalCoverage = deckCapabilities?.runner?.breakerCoverageMatrix.universal;
  return Boolean(
    universalCoverage &&
      !universalCoverage.installed &&
      (universalCoverage.inHand ||
        universalCoverage.inDeckKnown ||
        universalCoverage.searchableNow),
  );
}

function highValueRunTarget(target: RunnerRunTargetEvaluation): boolean {
  return (
    target.recommendation === "run_now" &&
    (target.accessPayoff === "agenda" ||
      target.accessPayoff === "trash_affordable" ||
      target.accessPayoff === "score_threat" ||
      target.accessPayoff === "fresh" ||
      target.accessPayoff === "access_bonus")
  );
}

function dedupeGoals(goals: readonly RunnerTacticalGoal[]): RunnerTacticalGoal[] {
  const byKey = new Map<string, RunnerTacticalGoal>();
  for (const goal of goals) {
    const key = `${goal.goalId}:${goal.targetServerId ?? ""}`;
    const existing = byKey.get(key);
    if (!existing || goal.priority > existing.priority) {
      byKey.set(key, goal);
    }
  }
  return [...byKey.values()];
}

function urgencyRank(urgency: RunnerTacticalGoal["urgency"]): number {
  switch (urgency) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}
