import type {
  DeckDoctrineV2Diagnostic,
  DeckDoctrineV2StrategyDiagnostic,
} from "../deck-doctrine-strategy";
import type { TacticalGoalLike } from "./semantic-decision-frame";

export function synthesizeDoctrineTacticalGoals(
  diagnostic: DeckDoctrineV2Diagnostic | undefined,
): TacticalGoalLike[] {
  if (!diagnostic || diagnostic.side === "unknown") return [];
  if (diagnostic.neutralDoctrine || diagnostic.status === "anchorless") {
    return [
      goal(`${diagnostic.side}.doctrine.neutral`, "setup", 520, "medium", [
        "doctrine_v2:neutral",
        `doctrine_status:${diagnostic.status}`,
      ]),
    ];
  }

  const goals: TacticalGoalLike[] = [];
  for (const strategy of diagnostic.strategyDiagnostics) {
    if (diagnostic.side === "runner") {
      goals.push(...runnerDoctrineGoals(strategy));
    } else {
      goals.push(...corpDoctrineGoals(strategy));
    }
  }
  return dedupeGoals(goals);
}

function runnerDoctrineGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  switch (strategy.strategyId) {
    case "runner.rnd_pressure":
      return runnerRndPressureGoals(strategy);
    case "runner.remote_contest":
      return runnerRemoteContestGoals(strategy);
    default:
      return [];
  }
}

function runnerRndPressureGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("runner.doctrine.rnd_pressure_access", "pressure", 790, "high", [
        "doctrine_v2:runner.rnd_pressure",
        "doctrine_status:complete",
        "doctrine_goal:run_access",
      ]),
    ];
  }
  if (strategy.status === "partial" && hasCoverageGap(strategy)) {
    return [
      goal("runner.doctrine.rnd_pressure_coverage", "coverage", 720, "medium", [
        "doctrine_v2:runner.rnd_pressure",
        "doctrine_status:partial",
        "missing_breaker_coverage:doctrine_v2",
      ]),
    ];
  }
  if (strategy.status === "partial") {
    return [
      goal("runner.doctrine.rnd_pressure_setup", "setup", 650, "medium", [
        "doctrine_v2:runner.rnd_pressure",
        "doctrine_status:partial",
        "doctrine_gap:setup_before_pressure",
      ]),
    ];
  }
  return [];
}

function runnerRemoteContestGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.status === "complete") {
    return [
      goal("runner.doctrine.remote_contest", "remote_contest", 800, "high", [
        "doctrine_v2:runner.remote_contest",
        "doctrine_status:complete",
        "doctrine_goal:remote_contest",
      ]),
    ];
  }
  if (strategy.status === "partial" && hasCoverageGap(strategy)) {
    return [
      goal("runner.doctrine.remote_contest_coverage", "coverage", 710, "medium", [
        "doctrine_v2:runner.remote_contest",
        "doctrine_status:partial",
        "missing_breaker_coverage:doctrine_v2",
      ]),
    ];
  }
  return [];
}

function corpDoctrineGoals(
  strategy: DeckDoctrineV2StrategyDiagnostic,
): TacticalGoalLike[] {
  if (strategy.strategyId === "corp.remote_scoring" && strategy.status === "complete") {
    return [
      goal("corp.doctrine.remote_scoring_scoreline", "corp_scoreline", 810, "high", [
        "doctrine_v2:corp.remote_scoring",
        "doctrine_status:complete",
        "doctrine_goal:corp_scoreline",
      ]),
      goal(
        "corp.doctrine.remote_scoring_ice_defense",
        "corp_ice_defense",
        760,
        "medium",
        [
          "doctrine_v2:corp.remote_scoring",
          "doctrine_status:complete",
          "doctrine_goal:corp_ice_defense",
        ],
      ),
    ];
  }
  if (strategy.strategyId === "corp.tag_trace_punish" && tagPunishReady(strategy)) {
    return [
      goal("corp.doctrine.tag_trace_punish", "tag_punish", 740, "medium", [
        "doctrine_v2:corp.tag_trace_punish",
        "doctrine_status:complete",
      ]),
    ];
  }
  if (strategy.strategyId === "corp.damage_kill" && damagePressureReady(strategy)) {
    return [
      goal("corp.doctrine.damage_pressure", "damage_pressure", 740, "medium", [
        "doctrine_v2:corp.damage_kill",
        "doctrine_status:complete",
      ]),
    ];
  }
  return [];
}

function tagPunishReady(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return (
    strategy.status === "complete" &&
    !hasAnyGap(strategy, ["low_tag_sources", "payoff_without_enablers", "low_punish_payoff_density"])
  );
}

function damagePressureReady(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return (
    strategy.status === "complete" &&
    !hasAnyGap(strategy, ["payoff_without_enablers", "low_punish_payoff_density"])
  );
}

function hasCoverageGap(strategy: DeckDoctrineV2StrategyDiagnostic): boolean {
  return hasAnyGap(strategy, [
    "missing_wall_coverage",
    "missing_code_gate_coverage",
    "weak_sentry_coverage",
    "weak_breaker_coverage",
  ]);
}

function hasAnyGap(
  strategy: DeckDoctrineV2StrategyDiagnostic,
  gaps: readonly string[],
): boolean {
  return strategy.supportGaps.some((gap) =>
    gaps.some((blocked) => gap.includes(blocked)),
  );
}

function goal(
  goalId: string,
  family: string,
  priority: number,
  urgency: NonNullable<TacticalGoalLike["urgency"]>,
  evidence: readonly string[],
): TacticalGoalLike {
  return {
    goalId,
    family,
    priority,
    urgency,
    source: "deck",
    evidence,
  };
}

function dedupeGoals(goals: readonly TacticalGoalLike[]): TacticalGoalLike[] {
  const byId = new Map<string, TacticalGoalLike>();
  for (const goal of goals) byId.set(goal.goalId, goal);
  return [...byId.values()].sort(
    (left, right) =>
      right.priority - left.priority || left.goalId.localeCompare(right.goalId),
  );
}
