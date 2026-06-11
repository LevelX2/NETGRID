import type { TacticalGoalLike } from "./semantic-decision-frame";

export type TacticalGoalUtilityFamily =
  | "survival"
  | "economy"
  | "setup"
  | "coverage"
  | "run_access"
  | "remote_contest"
  | "corp_scoreline"
  | "corp_ice_defense"
  | "tag_punish"
  | "damage_pressure"
  | "target_resolution"
  | "cleanup";

export type TacticalGoalUtilityUrgency =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type TacticalGoalUtilitySource =
  | "neutral"
  | "deck"
  | "boardstate"
  | "memory"
  | "plan";

export type TacticalGoalUtility = {
  goalId: string;
  family: TacticalGoalUtilityFamily;
  priority: number;
  urgency: TacticalGoalUtilityUrgency;
  source: TacticalGoalUtilitySource;
  blockers: string[];
  requiredActionSignals: string[];
  evidence: string[];
};

export function buildTacticalGoalUtilities(
  goals: readonly TacticalGoalLike[],
): TacticalGoalUtility[] {
  return goals
    .map(normalizeTacticalGoalUtility)
    .sort(compareTacticalGoalUtilities);
}

export function normalizeTacticalGoalUtility(
  goal: TacticalGoalLike,
): TacticalGoalUtility {
  const family = utilityFamilyForGoal(goal);
  const utility: TacticalGoalUtility = {
    goalId: goal.goalId,
    family,
    priority: normalizePriority(goal.priority),
    urgency: normalizeUrgency(goal.urgency, goal.priority),
    source: normalizeSource(goal.source),
    blockers: blockersFromEvidence(goal.evidence ?? []),
    requiredActionSignals: requiredActionSignalsForFamily(family),
    evidence: [
      `goal:${goal.goalId}`,
      `source_family:${goal.family}`,
      ...(goal.evidence ?? []),
    ],
  };
  assertTacticalGoalUtilitySideSafe(utility);
  return utility;
}

export function assertTacticalGoalUtilitySideSafe(
  utility: TacticalGoalUtility,
): void {
  const serialized = JSON.stringify(utility);
  for (const forbidden of [
    "cardInstances",
    "privatePayload",
    "sessionToken",
    "reconnectToken",
    "joinToken",
    "tokenHash",
    "fullGameState",
  ]) {
    if (serialized.includes(forbidden)) {
      throw new Error(
        `TacticalGoalUtility contains forbidden hidden-info marker: ${forbidden}`,
      );
    }
  }
  for (const signal of utility.requiredActionSignals) {
    if (signal.startsWith("actionId:")) {
      throw new Error("TacticalGoalUtility must not require a concrete actionId.");
    }
  }
}

function utilityFamilyForGoal(
  goal: TacticalGoalLike,
): TacticalGoalUtilityFamily {
  const goalId = goal.goalId;
  const family = goal.family;
  if (family === "economy" || goalId.includes("economy")) return "economy";
  if (goalId.includes("tag") && goalId.includes("punish")) return "tag_punish";
  if (goalId.includes("damage")) return "damage_pressure";
  if (goalId.includes("score") && goalId.startsWith("corp.")) {
    return "corp_scoreline";
  }
  if (goalId.includes("rez") || family === "corp_ice_defense") {
    return "corp_ice_defense";
  }
  if (family === "remote_contest" || goalId.includes("contest_remote")) {
    return "remote_contest";
  }
  if (
    goalId.includes("survive") ||
    goalId.includes("avoid") ||
    goalId.includes("buffer") ||
    family === "risk_control"
  ) {
    return "survival";
  }
  if (
    goalId.includes("coverage") ||
    goalId.includes("breaker") ||
    family === "coverage"
  ) {
    return "coverage";
  }
  if (family === "pressure" || goalId.includes("access")) return "run_access";
  if (goalId.includes("target")) return "target_resolution";
  if (goalId.includes("cleanup") || goalId.includes("remove")) return "cleanup";
  return "setup";
}

function normalizePriority(priority: number): number {
  const scaled = priority > 100 ? priority / 10 : priority;
  return Math.max(0, Math.min(100, Math.round(scaled)));
}

function normalizeUrgency(
  urgency: TacticalGoalLike["urgency"],
  priority: number,
): TacticalGoalUtilityUrgency {
  if (urgency === "critical") return "critical";
  if (urgency === "high" && normalizePriority(priority) >= 95) return "critical";
  if (urgency === "high") return "high";
  if (urgency === "medium") return "medium";
  return "low";
}

function normalizeSource(
  source: TacticalGoalLike["source"],
): TacticalGoalUtilitySource {
  switch (source) {
    case "deck_capability":
    case "strategic_intent":
    case "deck":
      return "deck";
    case "run_target_evaluation":
    case "economy_posture":
    case "boardstate":
      return "boardstate";
    case "memory":
      return "memory";
    case "plan":
      return "plan";
    default:
      return "neutral";
  }
}

function blockersFromEvidence(evidence: readonly string[]): string[] {
  return evidence
    .filter((entry) =>
      /blocked|missing|cannot|unavailable|unreachable|too_expensive/i.test(entry),
    )
    .map((entry) => `evidence:${entry}`)
    .sort();
}

function requiredActionSignalsForFamily(
  family: TacticalGoalUtilityFamily,
): string[] {
  switch (family) {
    case "survival":
      return ["tag.remove", "draw.card", "run.jack_out", "turn_flow.end_turn"];
    case "economy":
      return ["economy.gain_credit", "draw.card", "install.card"];
    case "setup":
      return ["install.card", "draw.card", "play.runner_event"];
    case "coverage":
      return ["install.card", "draw.card", "breaker.boost_strength"];
    case "run_access":
      return ["run.start", "run.continue", "access.resolve_card"];
    case "remote_contest":
      return ["run.start", "access.resolve_card"];
    case "corp_scoreline":
      return ["score.advance_card", "score.agenda", "install.card"];
    case "corp_ice_defense":
      return ["corp_window.rez", "install.card", "economy.gain_credit"];
    case "tag_punish":
      return ["tag.trash_runner_resource", "card_ability.trigger"];
    case "damage_pressure":
      return ["card_ability.trigger", "play.corp_operation"];
    case "target_resolution":
      return ["choice.resolve", "card_ability.unknown"];
    case "cleanup":
      return ["tag.remove", "counter.purge_virus", "turn_flow.end_turn"];
  }
}

function compareTacticalGoalUtilities(
  left: TacticalGoalUtility,
  right: TacticalGoalUtility,
): number {
  return (
    right.priority - left.priority ||
    urgencyRank(right.urgency) - urgencyRank(left.urgency) ||
    left.family.localeCompare(right.family) ||
    left.goalId.localeCompare(right.goalId)
  );
}

function urgencyRank(urgency: TacticalGoalUtilityUrgency): number {
  switch (urgency) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
  }
}
