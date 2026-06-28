import type { TacticalGoalLike } from "../decision/semantic-decision-frame";
import { rolesMatch } from "../runtime/role-match";
import type {
  PlanScoreBreakdown,
  TacticalPlanBuildContext,
} from "./tactical-plan-types";

export function runnerTacticalGoalEvidence(
  context: TacticalPlanBuildContext,
): string[] {
  return tacticalGoalsForPlanEvidence(context).slice(0, 6).map((goal) =>
    [
      `tactical_goal:${goal.goalId}`,
      `priority:${goal.priority}`,
      `urgency:${goal.urgency ?? "unknown"}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
    ].join("|"),
  );
}

export function tacticalGoalsForPlanEvidence(
  context: TacticalPlanBuildContext,
): readonly TacticalGoalLike[] {
  return context.tacticalGoals ?? context.runnerTacticalGoals ?? [];
}

export function strongestTacticalGoal(
  context: TacticalPlanBuildContext,
  predicate: (goal: TacticalGoalLike) => boolean,
): TacticalGoalLike | undefined {
  return tacticalGoalsForPlanEvidence(context)
    .filter(predicate)
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        urgencyRank(right.urgency) - urgencyRank(left.urgency) ||
        left.goalId.localeCompare(right.goalId),
    )[0];
}

export function tacticalGoalPriorityBoost(
  goal: TacticalGoalLike | undefined,
  maxBoost = 140,
): number {
  if (!goal) return 0;
  const urgencyBonus = goal.urgency === "high" ? 25 : 0;
  return Math.min(maxBoost, Math.max(0, Math.round(goal.priority / 10) + urgencyBonus));
}

export function tacticalGoalEvidence(
  goal: TacticalGoalLike | undefined,
): string[] {
  if (!goal) return [];
  return [
    `strategic_plan_goal:${goal.goalId}`,
    `strategic_plan_goal_priority:${goal.priority}`,
    `strategic_plan_goal_urgency:${goal.urgency ?? "unknown"}`,
    ...(goal.targetServerId ? [`strategic_plan_goal_target:${goal.targetServerId}`] : []),
    ...(goal.evidence ?? []).slice(0, 6),
  ];
}

export function tacticalGoalScoreBreakdown(
  goal: TacticalGoalLike | undefined,
  boost: number,
): PlanScoreBreakdown[] {
  if (!goal || boost <= 0) return [];
  return [
    {
      key: "strategic_tactical_goal_fit",
      label: "Strategic goal fit",
      value: boost,
      reason: goal.goalId,
    },
  ];
}

export function isStrategicTacticalGoal(goal: TacticalGoalLike): boolean {
  return (
    goal.source === "strategic_intent" ||
    goal.evidence?.some((entry) =>
      entry.startsWith("strategic_goal_source:"),
    ) === true
  );
}

export function urgencyRank(urgency: TacticalGoalLike["urgency"]): number {
  switch (urgency) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

export function runnerPressureGoalForServer(
  context: TacticalPlanBuildContext,
  serverId: string,
): TacticalGoalLike | undefined {
  return strongestTacticalGoal(
    context,
    (goal) =>
      isStrategicTacticalGoal(goal) &&
      goal.family === "pressure" &&
      (goal.targetServerId === undefined || goal.targetServerId === serverId) &&
      (
        goal.goalId === "runner.strategic.central_pressure" ||
        goal.goalId === "runner.pressure_good_central_target" ||
        goalIdMatches(goal.goalId, [
          "central_pressure",
          "rnd_pressure",
          "hq_pressure",
        ])
      ),
  );
}

export function runnerRemoteGoalForServer(
  context: TacticalPlanBuildContext,
  serverId: string,
): TacticalGoalLike | undefined {
  return strongestTacticalGoal(
    context,
    (goal) =>
      isStrategicTacticalGoal(goal) &&
      (goal.family === "remote_contest" || goalIdMatches(goal.goalId, ["remote"])) &&
      (goal.targetServerId === undefined || goal.targetServerId === serverId),
  );
}

export function corpGoalForFamily(
  context: TacticalPlanBuildContext,
  family: string,
): TacticalGoalLike | undefined {
  return strongestTacticalGoal(
    context,
    (goal) =>
      isStrategicTacticalGoal(goal) &&
      goal.goalId.startsWith("corp.") &&
      goal.family === family,
  );
}

function goalIdMatches(goalId: string, needles: readonly string[]): boolean {
  return rolesMatch([goalId], needles);
}
