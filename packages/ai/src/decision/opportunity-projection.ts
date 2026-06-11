import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";

export type AiOpportunity =
  | "safe_central_access"
  | "known_agenda_payoff"
  | "remote_contest_window"
  | "score_window"
  | "rez_value_window"
  | "setup_window"
  | "punish_window"
  | "economy_window";

export type AiOpportunityProjection = {
  opportunity: AiOpportunity;
  priority: "low" | "medium" | "high" | "critical";
  side: "runner" | "corp";
  targetId?: string;
  evidence: string[];
};

export function buildAiOpportunityProjections(
  frame: SemanticDecisionFrame,
): AiOpportunityProjection[] {
  const projections: AiOpportunityProjection[] = [];
  const runTargets = frame.runner?.runTargets ?? [];

  for (const target of runTargets) {
    if (target.accessPayoff === "agenda") {
      projections.push(runTargetOpportunity(target, "known_agenda_payoff", "critical"));
    }
    if (
      (target.targetKind === "hq" || target.targetKind === "rd") &&
      target.recommendation === "run_now" &&
      target.pathPassability === "reachable"
    ) {
      projections.push(runTargetOpportunity(target, "safe_central_access", "high"));
    }
    if (target.targetKind === "remote" && target.scoreThreat) {
      projections.push(
        runTargetOpportunity(target, "remote_contest_window", "critical"),
      );
    }
  }

  if (frame.side === "corp") {
    if (
      frame.legalActionIds.some((actionId) => /score/i.test(actionId)) ||
      frame.evidence.some((entry) => entry.includes("score_window"))
    ) {
      projections.push({
        opportunity: "score_window",
        priority: "critical",
        side: "corp",
        evidence: ["frame:score_window"],
      });
    }
    if (frame.evidence.some((entry) => entry.includes("rez_value_window"))) {
      projections.push({
        opportunity: "rez_value_window",
        priority: "high",
        side: "corp",
        evidence: ["frame:rez_value_window"],
      });
    }
  }

  if (
    frame.actionCandidates.some((candidate) =>
      candidate.semanticActionType === "economy.gain_credit",
    )
  ) {
    projections.push({
      opportunity: "economy_window",
      priority: "medium",
      side: frame.side,
      evidence: ["candidate:economy.gain_credit"],
    });
  }
  if (
    frame.actionCandidates.some((candidate) =>
      candidate.semanticActionType === "install.card" ||
      candidate.semanticActionType === "draw.card",
    )
  ) {
    projections.push({
      opportunity: "setup_window",
      priority: "medium",
      side: frame.side,
      evidence: ["candidate:setup_or_draw"],
    });
  }

  return dedupeOpportunities(projections);
}

function runTargetOpportunity(
  target: RunnerRunTargetEvaluation,
  opportunity: AiOpportunity,
  priority: AiOpportunityProjection["priority"],
): AiOpportunityProjection {
  return {
    opportunity,
    priority,
    side: "runner",
    targetId: target.targetServerId,
    evidence: [
      `target:${target.targetServerId}`,
      `target_kind:${target.targetKind}`,
      `access_payoff:${target.accessPayoff}`,
      `recommendation:${target.recommendation}`,
      `path_passability:${target.pathPassability}`,
      ...target.evidence.slice(0, 6),
    ],
  };
}

function dedupeOpportunities(
  projections: readonly AiOpportunityProjection[],
): AiOpportunityProjection[] {
  const byKey = new Map<string, AiOpportunityProjection>();
  for (const projection of projections) {
    const key = `${projection.opportunity}:${projection.targetId ?? ""}`;
    const existing = byKey.get(key);
    if (!existing || priorityRank(projection.priority) > priorityRank(existing.priority)) {
      byKey.set(key, projection);
    }
  }
  return [...byKey.values()].sort(
    (left, right) =>
      priorityRank(right.priority) - priorityRank(left.priority) ||
      left.opportunity.localeCompare(right.opportunity) ||
      (left.targetId ?? "").localeCompare(right.targetId ?? ""),
  );
}

function priorityRank(priority: AiOpportunityProjection["priority"]): number {
  switch (priority) {
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
