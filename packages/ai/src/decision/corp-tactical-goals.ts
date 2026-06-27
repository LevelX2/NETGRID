import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import type { SemanticDecisionFrame, TacticalGoalLike } from "./semantic-decision-frame";

type CorpGoalSpec = {
  goalId: string;
  family: string;
  priority: number;
  urgency: "medium" | "high";
  targetServerId?: string;
  evidence: string[];
};

// Corp goals translate side-safe LegalAction semantics into tactical intent.
// They are not actions and must not infer legality or hidden board contents.
export function buildCorpTacticalGoals(
  frame: SemanticDecisionFrame,
): TacticalGoalLike[] {
  if (frame.side !== "corp") return [];
  const goals = frame.actionCandidates.flatMap(goalSpecsForCandidate);
  if (goals.length === 0) {
    goals.push({
      goalId: "corp.tactical.turn_flow",
      family: "setup",
      priority: 500,
      urgency: "medium",
      evidence: ["corp_tactical_goal:turn_flow"],
    });
  }
  return dedupeGoals(goals.map(goal));
}

function goalSpecsForCandidate(candidate: ActionSemanticCandidate): CorpGoalSpec[] {
  const semantic = candidate.semanticActionType;
  const evidence = evidenceForCandidate(candidate);
  const targetServerId = targetServerForCandidate(candidate);
  const hasRemoteTarget = targetServerId?.startsWith("remote_") === true;
  const hasCentralTarget = targetServerId === "hq" || targetServerId === "rd";
  const hasScoreCloseoutSignal = hasVisibleScoreCloseoutBasis(candidate);
  const specs: CorpGoalSpec[] = [];

  if (semantic === "score.agenda" || hasScoreCloseoutSignal) {
    specs.push({
      goalId: "corp.tactical.score_closeout",
      family: "corp_scoreline",
      priority: semantic === "score.agenda" ? 900 : 860,
      urgency: "high",
      evidence: [
        ...evidence,
        "corp_goal:score_closeout",
        ...(hasScoreCloseoutSignal
          ? ["corp_goal:score_closeout_semantic_signal"]
          : []),
      ],
    });
  }
  if (semantic === "score.advance_card") {
    specs.push({
      goalId: "corp.tactical.advance_scoreline",
      family: "corp_scoreline",
      priority: 820,
      urgency: "high",
      ...(targetServerId ? { targetServerId } : {}),
      evidence: [...evidence, "corp_goal:advance_or_score_closeout"],
    });
  }
  if (semantic === "corp_window.rez") {
    specs.push({
      goalId: "corp.tactical.rez_relevant_ice",
      family: "corp_ice_defense",
      priority: hasCentralTarget ? 780 : 760,
      urgency: "medium",
      ...(targetServerId ? { targetServerId } : {}),
      evidence: [...evidence, "corp_goal:rez_or_reserve_ice"],
    });
  }
  if (semantic === "install.card" && (hasRemoteTarget || hasCentralTarget)) {
    specs.push({
      goalId: hasRemoteTarget
        ? "corp.tactical.prepare_remote"
        : "corp.tactical.protect_central",
      family: hasRemoteTarget ? "setup" : "corp_ice_defense",
      priority: hasRemoteTarget ? 690 : 720,
      urgency: "medium",
      targetServerId,
      evidence: [
        ...evidence,
        hasRemoteTarget
          ? "corp_goal:remote_preparation"
          : "corp_goal:central_protection",
      ],
    });
  }
  if (semantic === "economy.gain_credit" || semantic === "draw.card") {
    specs.push({
      goalId: "corp.tactical.stabilize_economy",
      family: "economy",
      priority: 640,
      urgency: "medium",
      evidence: [...evidence, "corp_goal:economy_stabilize"],
    });
  }
  if (semantic.includes("tag.") && hasVisiblePunishBasis(candidate)) {
    specs.push({
      goalId: "corp.tactical.visible_tag_punish",
      family: "tag_punish",
      priority: 730,
      urgency: "medium",
      evidence: [...evidence, "corp_goal:visible_tag_punish"],
    });
  }
  if (hasVisibleDamageOrAmbushBasis(candidate)) {
    specs.push({
      goalId: "corp.tactical.visible_damage_or_ambush_window",
      family: "damage_pressure",
      priority: 700,
      urgency: "medium",
      ...(targetServerId ? { targetServerId } : {}),
      evidence: [...evidence, "corp_goal:visible_damage_or_ambush"],
    });
  }

  return specs;
}

function goal(spec: CorpGoalSpec): TacticalGoalLike {
  return {
    goalId: spec.goalId,
    family: spec.family,
    priority: spec.priority,
    urgency: spec.urgency,
    ...(spec.targetServerId ? { targetServerId: spec.targetServerId } : {}),
    source: "boardstate",
    evidence: sortedUnique(spec.evidence).slice(0, 12),
  };
}

function evidenceForCandidate(candidate: ActionSemanticCandidate): string[] {
  return sortedUnique([
    `candidate:${candidate.actionId}`,
    `semantic:${candidate.semanticActionType}`,
    `action_type:${candidate.actionType}`,
    ...(candidate.targetContext?.selectedTargets.map(
      (target) => `target:${target.targetKind}:${target.targetId}`,
    ) ?? []),
    ...(candidate.targetContext?.availableTargets?.map(
      (target) => `available_target:${target.targetKind}:${target.targetId}`,
    ) ?? []),
    ...(candidate.targetContext?.targetZones.map((zone) => `target_zone:${zone}`) ?? []),
    ...(candidate.actionTacticSignals.map((signal) => `tactic:${signal}`)),
    ...(candidate.evidence.map((entry) => `evidence:${entry}`)),
  ]);
}

function targetServerForCandidate(
  candidate: ActionSemanticCandidate,
): string | undefined {
  const selected = candidate.targetContext?.selectedTargets.find(
    (target) => target.targetKind === "server" || target.targetZone,
  );
  const available = candidate.targetContext?.availableTargets?.find(
    (target) => target.targetKind === "server" || target.targetZone,
  );
  const raw =
    candidate.runProjectionSummary?.serverId ??
    selected?.targetZone ??
    selected?.targetId ??
    available?.targetZone ??
    available?.targetId;
  return normalizeServerId(raw);
}

function hasVisiblePunishBasis(candidate: ActionSemanticCandidate): boolean {
  const text = visibleSignalText(candidate);
  return /tag|trace|punish|trash_runner_resource/.test(text);
}

function hasVisibleDamageOrAmbushBasis(candidate: ActionSemanticCandidate): boolean {
  const text = visibleSignalText(candidate);
  return /damage|ambush|flatline/.test(text);
}

function hasVisibleScoreCloseoutBasis(
  candidate: ActionSemanticCandidate,
): boolean {
  const text = visibleSignalText(candidate);
  return /corp\.score_closeout|closeout\.agenda_score|advance_burst|advance\.counter_cashout|score\.advance_burst/.test(
    text,
  );
}

function visibleSignalText(candidate: ActionSemanticCandidate): string {
  return [
    candidate.semanticActionType,
    ...candidate.actionTacticSignals,
    ...candidate.cardContextSignals,
    ...candidate.evidence,
    ...(candidate.targetContext?.selectedTargets.flatMap((target) => target.evidence) ?? []),
  ]
    .join("|")
    .toLocaleLowerCase("en-US");
}

function normalizeServerId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLocaleLowerCase("en-US");
  if (normalized === "rnd" || normalized === "r&d") return "rd";
  if (normalized === "archives") return "archives";
  if (normalized === "hq" || normalized === "rd") return normalized;
  const remoteMatch = /remote[_\s-]*(\d+)/.exec(normalized);
  if (remoteMatch?.[1]) return `remote_${remoteMatch[1]}`;
  return undefined;
}

function dedupeGoals(goals: readonly TacticalGoalLike[]): TacticalGoalLike[] {
  const byId = new Map<string, TacticalGoalLike>();
  for (const goal of goals) {
    const current = byId.get(goal.goalId);
    if (!current || goal.priority > current.priority) byId.set(goal.goalId, goal);
  }
  return [...byId.values()].sort(
    (left, right) =>
      right.priority - left.priority || left.goalId.localeCompare(right.goalId),
  );
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort();
}
