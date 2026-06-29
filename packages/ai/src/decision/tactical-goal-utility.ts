import type { TacticalGoalLike } from "./semantic-decision-frame";
import { findForbiddenSemanticPath } from "../diagnostics/semantic-redaction";

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
  const forbiddenPath = findForbiddenSemanticPath(utility, "TacticalGoalUtility");
  if (forbiddenPath) {
    throw new Error(
      `TacticalGoalUtility contains forbidden hidden-info marker: ${forbiddenPath}`,
    );
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
  if (family === "economy" || goalIdHasTerm(goalId, "economy")) {
    return "economy";
  }
  if (
    family === "tag_punish" ||
    (goalIdHasTerm(goalId, "tag") && goalIdHasTerm(goalId, "punish"))
  ) {
    return "tag_punish";
  }
  if (family === "damage_pressure" || goalIdHasTerm(goalId, "damage")) {
    return "damage_pressure";
  }
  if (
    family === "corp_scoreline" ||
    (goalIdHasTerm(goalId, "score") && goalId.startsWith("corp."))
  ) {
    return "corp_scoreline";
  }
  if (goalIdHasTerm(goalId, "rez") || family === "corp_ice_defense") {
    return "corp_ice_defense";
  }
  if (family === "remote_contest" || goalIdHasTerm(goalId, "contest_remote")) {
    return "remote_contest";
  }
  if (
    goalIdHasTerm(goalId, "survive") ||
    goalIdHasTerm(goalId, "avoid") ||
    goalIdHasTerm(goalId, "buffer") ||
    family === "risk_control"
  ) {
    return "survival";
  }
  if (
    goalIdHasTerm(goalId, "coverage") ||
    goalIdHasTerm(goalId, "breaker") ||
    family === "coverage"
  ) {
    return "coverage";
  }
  if (family === "pressure" || goalIdHasTerm(goalId, "access")) {
    return "run_access";
  }
  if (goalIdHasTerm(goalId, "target")) return "target_resolution";
  if (goalIdHasTerm(goalId, "cleanup") || goalIdHasTerm(goalId, "remove")) {
    return "cleanup";
  }
  return "setup";
}

function goalIdHasTerm(goalId: string, term: string): boolean {
  return goalId
    .split(/[.:-]+/)
    .some((segment) => goalIdSegmentHasTerm(segment, term));
}

function goalIdSegmentHasTerm(segment: string, term: string): boolean {
  if (segment === term) return true;
  const termSet = new Set(segment.split("_").filter(Boolean));
  return termSet.has(term);
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
    .filter(evidenceEntryHasBlockerToken)
    .map((entry) => `evidence:${entry}`)
    .sort();
}

const BLOCKER_EVIDENCE_TOKENS = new Set([
  "blocked",
  "missing",
  "cannot",
  "unavailable",
  "unreachable",
]);

function evidenceEntryHasBlockerToken(entry: string): boolean {
  const tokens = evidenceEntryTokens(entry);
  return (
    tokens.some((token) => BLOCKER_EVIDENCE_TOKENS.has(token)) ||
    evidenceTokensIncludePhrase(tokens, ["too", "expensive"])
  );
}

function evidenceEntryTokens(entry: string): string[] {
  return entry
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function evidenceTokensIncludePhrase(
  tokens: readonly string[],
  phrase: readonly string[],
): boolean {
  return tokens.some((token, index) =>
    phrase.every((phraseToken, offset) => tokens[index + offset] === phraseToken),
  );
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
