import type { SemanticDecisionFrame, TacticalGoalLike } from "./semantic-decision-frame";
import { buildCorpTacticalGoals } from "./corp-tactical-goals";

export function synthesizeNeutralTacticalGoals(
  frame: SemanticDecisionFrame,
): TacticalGoalLike[] {
  const sideGoals =
    frame.side === "runner"
      ? synthesizeRunnerNeutralGoals(frame)
      : synthesizeCorpNeutralGoals(frame);
  return dedupeGoals(sideGoals);
}

function synthesizeRunnerNeutralGoals(
  frame: SemanticDecisionFrame,
): TacticalGoalLike[] {
  const goals: TacticalGoalLike[] = [];
  const semantics = new Set(
    frame.actionCandidates.map((candidate) => candidate.semanticActionType),
  );
  const runTargets = frame.runner?.runTargets ?? [];

  if (
    runTargets.some(
      (target) =>
        target.recommendation === "draw_for_damage_buffer" ||
        target.blinkRiskAssessment?.riskSeverity === "high" ||
        target.blinkRiskAssessment?.riskSeverity === "lethal",
    )
  ) {
    goals.push(goal("runner.neutral.survival_risk", "risk_control", 960, [
      "neutral_goal:survival_risk",
      "run_target:flatline_or_damage_buffer",
    ]));
  }
  if (semantics.has("economy.gain_credit") || frame.economyContext?.creditPressure === "high") {
    goals.push(goal("runner.neutral.economy", "economy", 720, [
      "neutral_goal:economy",
      `credit_pressure:${frame.economyContext?.creditPressure ?? "unknown"}`,
    ]));
  }
  if (semantics.has("draw.card") || semantics.has("install.card")) {
    goals.push(goal("runner.neutral.setup", "setup", 620, [
      "neutral_goal:setup",
      "candidate_semantic:draw_or_install",
    ]));
  }
  if (
    runTargets.some(
      (target) =>
        (target.targetKind === "hq" || target.targetKind === "rd") &&
        target.recommendation === "run_now" &&
        target.pathPassability === "reachable",
    )
  ) {
    goals.push(goal("runner.neutral.safe_run_access", "pressure", 760, [
      "neutral_goal:safe_run_access",
      "run_target:reachable_central",
    ]));
  }
  if (
    runTargets.some(
      (target) => target.targetKind === "remote" && target.scoreThreat,
    )
  ) {
    goals.push(goal("runner.neutral.remote_contest_if_score_threat", "remote_contest", 820, [
      "neutral_goal:remote_contest",
      "run_target:remote_score_threat",
    ]));
  }
  if (
    runTargets.some((target) =>
      target.pathPassability === "blocked_missing_coverage",
    )
  ) {
    goals.push(goal("runner.neutral.coverage", "coverage", 700, [
      "neutral_goal:coverage",
      "run_target:missing_coverage",
    ]));
  }
  if (semantics.has("tag.remove")) {
    goals.push(goal("runner.neutral.cleanup", "cleanup", 680, [
      "neutral_goal:cleanup",
      "candidate_semantic:tag.remove",
    ]));
  }
  if (goals.length === 0) {
    goals.push(goal("runner.neutral.survival", "risk_control", 500, [
      "neutral_goal:survival",
    ]));
  }
  return goals;
}

function synthesizeCorpNeutralGoals(
  frame: SemanticDecisionFrame,
): TacticalGoalLike[] {
  return buildCorpTacticalGoals(frame);
}

function goal(
  goalId: string,
  family: string,
  priority: number,
  evidence: readonly string[],
): TacticalGoalLike {
  return {
    goalId,
    family,
    priority,
    urgency: priority >= 800 ? "high" : "medium",
    source: "neutral",
    evidence,
  };
}

function dedupeGoals(goals: readonly TacticalGoalLike[]): TacticalGoalLike[] {
  const byId = new Map<string, TacticalGoalLike>();
  for (const goal of goals) {
    byId.set(goal.goalId, goal);
  }
  return [...byId.values()].sort(
    (left, right) =>
      right.priority - left.priority || left.goalId.localeCompare(right.goalId),
  );
}
