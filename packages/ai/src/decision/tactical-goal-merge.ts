import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type {
  StrategicIntentFamily,
  StrategicIntentPhase,
  StrategicIntentState,
} from "../strategic-intent-state";
import type {
  SemanticDecisionFrame,
  TacticalGoalLike,
} from "./semantic-decision-frame";
import { synthesizeNeutralTacticalGoals } from "./neutral-goal-synthesis";

export const TACTICAL_GOAL_MERGE_SCHEMA_VERSION =
  "tactical-goal-merge-v1" as const;

export type TacticalGoalMergeSource =
  | "runner_tactical_goal"
  | "corp_tactical_goal"
  | "neutral"
  | "strategic_intent_state"
  | "corp_strategic_intent";

export type BuildMergedTacticalGoalsParams = {
  frame: SemanticDecisionFrame;
  tacticalGoals?: readonly TacticalGoalLike[];
};

type GoalInput = {
  goal: TacticalGoalLike;
  source: TacticalGoalMergeSource;
};

export function buildMergedTacticalGoals(
  params: BuildMergedTacticalGoalsParams,
): TacticalGoalLike[] {
  const frame = params.frame;
  const explicitGoals = (params.tacticalGoals ?? frame.tacticalGoals).filter(
    (goal) => !isReportOnlyDoctrineGoal(goal),
  );
  const inputs: GoalInput[] = [
    ...explicitGoals.map((goal) => ({
      goal,
      source: goalSourceFromExisting(frame, goal),
    })),
    ...strategicIntentGoals(frame.strategicIntentState).map((goal) => ({
      goal,
      source: "strategic_intent_state" as const,
    })),
    ...corpStrategicIntentGoals(frame.corpStrategicIntent).map((goal) => ({
      goal,
      source: "corp_strategic_intent" as const,
    })),
    ...synthesizeNeutralTacticalGoals({
      ...frame,
      tacticalGoals: [],
    })
      .filter((goal) => !isReportOnlyDoctrineGoal(goal))
      .map((goal) => ({
        goal,
        source: frame.side === "corp"
          ? "corp_tactical_goal" as const
          : "neutral" as const,
      })),
  ];
  return dedupeGoals(inputs).sort(compareGoals);
}

export function redactedMergedTacticalGoalFacts(
  goals: readonly TacticalGoalLike[],
): string[] {
  return goals.slice(0, 16).map((goal) =>
    [
      `tactical_goal:${goal.goalId}`,
      `family:${goal.family}`,
      `priority:${goal.priority}`,
      `urgency:${goal.urgency ?? "unknown"}`,
      `source:${goal.source ?? "unknown"}`,
      ...(goal.targetServerId ? [`target:${goal.targetServerId}`] : []),
      ...goalEvidenceByPrefix(goal, "merge_source:").slice(0, 4),
    ].join("|"),
  );
}

function strategicIntentGoals(
  state: StrategicIntentState | undefined,
): TacticalGoalLike[] {
  if (!state) return [];
  const goals: TacticalGoalLike[] = [];
  const primary = state.primaryStrategy;
  const targetServerId = strategicTargetServerId(state);
  goals.push({
    goalId: strategicGoalId(primary.family, state.side),
    family: tacticalFamilyForStrategicFamily(primary.family),
    priority: strategicGoalPriority(state),
    urgency: strategicGoalUrgency(state),
    ...(targetServerId ? { targetServerId } : {}),
    source: "strategic_intent",
    evidence: [
      "strategic_goal_source:strategic_intent_state",
      `strategic_schema:${state.schemaVersion}`,
      `strategic_primary:${primary.strategyId}`,
      `strategic_family:${primary.family}`,
      `strategic_phase:${state.phase}`,
      `strategic_completeness:${primary.completeness}`,
      `strategic_target:${state.targetVector.kind}`,
      `strategic_blocker_count:${state.blockers.length}`,
      ...state.blockers
        .slice(0, 4)
        .map((blocker) => `strategic_blocker:${blocker.reason}:${blocker.severity}`),
    ],
  });
  if (!state.reserve.satisfied && state.reserve.kind !== "none") {
    goals.push({
      goalId: `${state.side}.strategic.fund_reserve`,
      family: "economy",
      priority: 875,
      urgency: "high",
      source: "strategic_intent",
      evidence: [
        "strategic_goal_source:strategic_intent_state",
        `strategic_primary:${primary.strategyId}`,
        `reserve_kind:${state.reserve.kind}`,
        `reserve_required:${state.reserve.required}`,
        `reserve_available:${state.reserve.available ?? "unknown"}`,
      ],
    });
  }
  return goals;
}

function corpStrategicIntentGoals(
  intent: CorpStrategicIntentProfile | undefined,
): TacticalGoalLike[] {
  if (!intent) return [];
  const goals: TacticalGoalLike[] = [];
  if (intent.scorePlan.length > 0) {
    goals.push(corpIntentGoal("corp.intent.scoreline", "corp_scoreline", 835, "high", intent, [
      `score_plan:${intent.scorePlan.join("|")}`,
    ]));
  }
  if (intent.defensePlan.length > 0) {
    goals.push(corpIntentGoal("corp.intent.defense", "corp_ice_defense", 760, "medium", intent, [
      `defense_plan:${intent.defensePlan.join("|")}`,
    ]));
  }
  if (intent.economyPlan.length > 0) {
    goals.push(corpIntentGoal("corp.intent.economy", "economy", 720, "medium", intent, [
      `economy_plan:${intent.economyPlan.join("|")}`,
    ]));
  }
  if (intent.punishPlan.length > 0) {
    goals.push(corpIntentGoal("corp.intent.punish", "tag_punish", 745, "medium", intent, [
      `punish_plan:${intent.punishPlan.join("|")}`,
    ]));
  }
  return goals;
}

function corpIntentGoal(
  goalId: string,
  family: string,
  priority: number,
  urgency: NonNullable<TacticalGoalLike["urgency"]>,
  intent: CorpStrategicIntentProfile,
  evidence: readonly string[],
): TacticalGoalLike {
  return {
    goalId,
    family,
    priority,
    urgency,
    source: "strategic_intent",
    evidence: [
      "strategic_goal_source:corp_strategic_intent",
      `corp_primary_win_intent:${intent.primaryWinIntent}`,
      `corp_intent_confidence:${intent.confidence}`,
      ...evidence,
    ],
  };
}

function strategicGoalId(
  family: StrategicIntentFamily,
  side: StrategicIntentState["side"],
): string {
  switch (family) {
    case "runner_setup":
      return "runner.strategic.setup";
    case "runner_central_pressure":
      return "runner.strategic.central_pressure";
    case "runner_remote_contest":
      return "runner.strategic.remote_contest";
    case "runner_remote_trash":
      return "runner.strategic.remote_trash";
    case "runner_survival":
      return "runner.strategic.survival";
    case "runner_tempo":
      return "runner.strategic.tempo";
    case "corp_scoreline":
    case "corp_fast_advance":
      return "corp.strategic.scoreline";
    case "corp_ice_tax":
    case "corp_central_defense":
      return "corp.strategic.defense";
    case "corp_asset_economy":
    case "corp_economy_reserve":
      return "corp.strategic.economy";
    case "corp_tag_trace_punish":
      return "corp.strategic.tag_trace_punish";
    case "corp_damage_kill":
    case "corp_ambush":
      return "corp.strategic.damage_pressure";
    default:
      return `${side}.strategic.recover`;
  }
}

function tacticalFamilyForStrategicFamily(
  family: StrategicIntentFamily,
): string {
  switch (family) {
    case "runner_setup":
      return "setup";
    case "runner_central_pressure":
    case "runner_tempo":
      return "pressure";
    case "runner_remote_contest":
    case "runner_remote_trash":
      return "remote_contest";
    case "runner_survival":
      return "risk_control";
    case "corp_scoreline":
    case "corp_fast_advance":
      return "corp_scoreline";
    case "corp_ice_tax":
    case "corp_central_defense":
      return "corp_ice_defense";
    case "corp_asset_economy":
    case "corp_economy_reserve":
      return "economy";
    case "corp_tag_trace_punish":
      return "tag_punish";
    case "corp_damage_kill":
    case "corp_ambush":
      return "damage_pressure";
    default:
      return "setup";
  }
}

function strategicGoalPriority(state: StrategicIntentState): number {
  const phaseBonus = strategicPhasePriorityBonus(state.phase);
  const completenessBonus =
    state.primaryStrategy.completeness === "complete" ? 80 :
      state.primaryStrategy.completeness === "partial" ? 35 :
        0;
  const blockerPenalty = Math.min(160, state.blockers.length * 35);
  return Math.max(
    500,
    Math.min(900, 650 + phaseBonus + completenessBonus - blockerPenalty),
  );
}

function strategicPhasePriorityBonus(phase: StrategicIntentPhase): number {
  switch (phase) {
    case "closeout":
    case "convert":
      return 170;
    case "pressure":
      return 130;
    case "enable":
      return 90;
    case "fund":
      return 70;
    case "assemble":
      return 40;
    case "recover":
      return 20;
  }
}

function strategicGoalUrgency(
  state: StrategicIntentState,
): NonNullable<TacticalGoalLike["urgency"]> {
  if (
    state.phase === "convert" ||
    state.phase === "closeout" ||
    state.blockers.some((blocker) => blocker.severity === "hard")
  ) {
    return "high";
  }
  return state.phase === "recover" || state.phase === "fund"
    ? "medium"
    : "medium";
}

function strategicTargetServerId(
  state: StrategicIntentState,
): string | undefined {
  if (
    state.targetVector.kind === "central" ||
    state.targetVector.kind === "remote"
  ) {
    return state.targetVector.targetId;
  }
  return undefined;
}

function goalSourceFromExisting(
  frame: SemanticDecisionFrame,
  goal: TacticalGoalLike,
): TacticalGoalMergeSource {
  if (goal.source === "neutral") return "neutral";
  if (goal.source === "boardstate" && frame.side === "corp") {
    return "corp_tactical_goal";
  }
  if (goal.source && frame.side === "runner") return "runner_tactical_goal";
  if (goal.source && frame.side === "corp") return "corp_tactical_goal";
  if (goal.goalId.includes(".neutral.")) return "neutral";
  if (frame.side === "corp" || goal.goalId.startsWith("corp.")) {
    return "corp_tactical_goal";
  }
  return "runner_tactical_goal";
}

function isReportOnlyDoctrineGoal(goal: TacticalGoalLike): boolean {
  return (
    goal.source === "deck" ||
    goal.goalId.includes(".doctrine.") ||
    (goal.evidence ?? []).some((entry) => entry.startsWith("doctrine_v2:"))
  );
}

function dedupeGoals(inputs: readonly GoalInput[]): TacticalGoalLike[] {
  const byKey = new Map<string, GoalInput & { duplicateCount: number }>();
  for (const input of inputs) {
    const key = goalKey(input.goal);
    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, {
        ...input,
        goal: annotateGoalSource(input.goal, input.source),
        duplicateCount: 1,
      });
      continue;
    }
    byKey.set(key, {
      goal: mergeGoal(current.goal, input.goal, current.source, input.source),
      source: current.source,
      duplicateCount: current.duplicateCount + 1,
    });
  }
  return [...byKey.values()].map(({ goal, duplicateCount }) => ({
    ...goal,
    evidence: sortedUnique([
      ...(goal.evidence ?? []),
      `merged_duplicate_count:${duplicateCount}`,
    ]),
  }));
}

function annotateGoalSource(
  goal: TacticalGoalLike,
  source: TacticalGoalMergeSource,
): TacticalGoalLike {
  return {
    ...goal,
    evidence: sortedUnique([...(goal.evidence ?? []), `merge_source:${source}`]),
  };
}

function mergeGoal(
  left: TacticalGoalLike,
  right: TacticalGoalLike,
  leftSource: TacticalGoalMergeSource,
  rightSource: TacticalGoalMergeSource,
): TacticalGoalLike {
  const priorityWinner = right.priority > left.priority ? right : left;
  const urgency = higherUrgency(left.urgency, right.urgency);
  const source = left.source === right.source ? left.source : "merged";
  return {
    ...priorityWinner,
    priority: Math.max(left.priority, right.priority),
    ...(urgency ? { urgency } : {}),
    ...(source ? { source } : {}),
    evidence: sortedUnique([
      ...(left.evidence ?? []),
      ...(right.evidence ?? []),
      `merge_source:${leftSource}`,
      `merge_source:${rightSource}`,
    ]),
  };
}

function goalKey(goal: TacticalGoalLike): string {
  return `${goal.goalId}:${goal.targetServerId ?? ""}`;
}

function compareGoals(left: TacticalGoalLike, right: TacticalGoalLike): number {
  return (
    right.priority - left.priority ||
    urgencyRank(right.urgency) - urgencyRank(left.urgency) ||
    left.goalId.localeCompare(right.goalId) ||
    (left.targetServerId ?? "").localeCompare(right.targetServerId ?? "")
  );
}

function higherUrgency(
  left: TacticalGoalLike["urgency"],
  right: TacticalGoalLike["urgency"],
): TacticalGoalLike["urgency"] {
  return urgencyRank(right) > urgencyRank(left) ? right : left;
}

function urgencyRank(urgency: TacticalGoalLike["urgency"]): number {
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

function goalEvidenceByPrefix(
  goal: TacticalGoalLike,
  prefix: string,
): string[] {
  return (goal.evidence ?? []).filter((entry) => entry.startsWith(prefix));
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
