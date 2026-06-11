import type { RunnerRunTargetEvaluation } from "../runner-run-target-evaluation";
import type { SemanticDecisionFrame } from "./semantic-decision-frame";

export type AiThreat =
  | "runner_flatline_risk"
  | "runner_tag_punish_risk"
  | "runner_economy_starvation"
  | "runner_no_coverage"
  | "corp_score_window"
  | "corp_central_exposure"
  | "corp_remote_vulnerable"
  | "corp_low_rez_reserve";

export type AiThreatSeverity = "low" | "medium" | "high" | "critical";

export type AiThreatProjection = {
  threat: AiThreat;
  severity: AiThreatSeverity;
  affectedSide: "runner" | "corp";
  targetId?: string;
  evidence: string[];
};

export function buildAiThreatProjections(
  frame: SemanticDecisionFrame,
): AiThreatProjection[] {
  const projections: AiThreatProjection[] = [];
  const runTargets = frame.runner?.runTargets ?? [];
  const economyPosture = frame.runner?.economyPosture;

  if (
    economyPosture?.fundingNeed ||
    economyPosture?.recommendation === "build_economy"
  ) {
    projections.push({
      threat: "runner_economy_starvation",
      severity: economyPosture.fundingNeed ? "high" : "medium",
      affectedSide: "runner",
      evidence: [
        `economy_recommendation:${economyPosture.recommendation}`,
        `funding_need:${economyPosture.fundingNeed}`,
        ...economyPosture.evidence.slice(0, 6),
      ],
    });
  }

  for (const target of runTargets) {
    if (target.pathPassability === "blocked_missing_coverage") {
      projections.push(runTargetThreat(target, "runner_no_coverage", "high"));
    }
    if (
      target.pathPassability === "blocked_unbreakable" ||
      target.pathPassability === "blocked_unpayable"
    ) {
      projections.push(runTargetThreat(target, "runner_no_coverage", "medium"));
    }
    if (
      target.recommendation === "draw_for_damage_buffer" ||
      target.blinkRiskAssessment?.riskSeverity === "high" ||
      target.blinkRiskAssessment?.riskSeverity === "lethal"
    ) {
      projections.push(
        runTargetThreat(
          target,
          "runner_flatline_risk",
          target.blinkRiskAssessment?.riskSeverity === "lethal"
            ? "critical"
            : "high",
        ),
      );
    }
    if (target.targetKind === "remote" && target.scoreThreat) {
      projections.push(
        runTargetThreat(
          target,
          "corp_score_window",
          target.recommendation === "find_breaker_first" ? "high" : "critical",
          "runner",
        ),
      );
    }
  }

  if (
    frame.side === "corp" &&
    frame.evidence.some((entry) => entry.includes("low_rez_reserve"))
  ) {
    projections.push({
      threat: "corp_low_rez_reserve",
      severity: "high",
      affectedSide: "corp",
      evidence: ["frame_evidence:low_rez_reserve"],
    });
  }

  return dedupeThreats(projections);
}

function runTargetThreat(
  target: RunnerRunTargetEvaluation,
  threat: AiThreat,
  severity: AiThreatSeverity,
  affectedSide: "runner" | "corp" = "runner",
): AiThreatProjection {
  return {
    threat,
    severity,
    affectedSide,
    targetId: target.targetServerId,
    evidence: [
      `target:${target.targetServerId}`,
      `target_kind:${target.targetKind}`,
      `recommendation:${target.recommendation}`,
      `path_passability:${target.pathPassability}`,
      `score_threat:${target.scoreThreat}`,
      ...target.evidence.slice(0, 6),
    ],
  };
}

function dedupeThreats(
  projections: readonly AiThreatProjection[],
): AiThreatProjection[] {
  const byKey = new Map<string, AiThreatProjection>();
  for (const projection of projections) {
    const key = `${projection.threat}:${projection.targetId ?? ""}`;
    const existing = byKey.get(key);
    if (!existing || severityRank(projection.severity) > severityRank(existing.severity)) {
      byKey.set(key, projection);
    }
  }
  return [...byKey.values()].sort(
    (left, right) =>
      severityRank(right.severity) - severityRank(left.severity) ||
      left.threat.localeCompare(right.threat) ||
      (left.targetId ?? "").localeCompare(right.targetId ?? ""),
  );
}

function severityRank(severity: AiThreatSeverity): number {
  switch (severity) {
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
