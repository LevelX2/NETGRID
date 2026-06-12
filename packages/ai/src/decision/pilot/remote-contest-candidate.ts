import { alignRunTargetAction } from "../run-target-action-alignment";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import type { SemanticRankedAction } from "../semantic-decision-trace";

type RunnerRunTarget = NonNullable<
  NonNullable<SemanticDecisionFrame["runner"]>["runTargets"]
>[number];

export type RemoteContestCandidateStatus = "eligible" | "blocked";

export type RemoteContestCandidateEvaluation = {
  actionId: string;
  targetServerId?: string;
  targetKind?: string;
  recommendation?: string;
  pathPassability?: string;
  scoreThreat?: boolean;
  structuredAlignment: boolean;
  scoreGap: number;
  scoreGapThreshold: number;
  candidateStatus: RemoteContestCandidateStatus;
  blockedReason?: string;
  productiveUseAllowed: false;
  runtimeConsumerStatus: "none";
  evidence: string[];
};

export function evaluateRemoteContestCandidate(params: {
  frame: SemanticDecisionFrame;
  top: SemanticRankedAction | undefined;
  topActionType: string | undefined;
  scoreGap: number | null;
  scoreGapThreshold?: number;
}): RemoteContestCandidateEvaluation | undefined {
  if (!params.top || params.frame.side !== "runner") return undefined;
  if (params.topActionType !== "start_run") return undefined;
  if (!rankedActionHasUtilityFamily(params.top, "remote_contest")) return undefined;

  const threshold = params.scoreGapThreshold ?? 0;
  const runTarget = remoteRunTargetFor(params.frame, params.top.actionId);
  const candidate = params.frame.actionCandidates.find(
    (actionCandidate) => actionCandidate.actionId === params.top?.actionId,
  );
  const alignment =
    candidate && runTarget ? alignRunTargetAction(candidate, runTarget) : undefined;
  const scoreGap = params.scoreGap ?? Number.NEGATIVE_INFINITY;
  const blockedReason = remoteContestBlockedReason({
    candidateMissing: candidate === undefined,
    runTarget,
    alignment,
    scoreGap,
    threshold,
  });

  return {
    actionId: params.top.actionId,
    ...(runTarget?.targetServerId ? { targetServerId: runTarget.targetServerId } : {}),
    ...(runTarget?.targetKind ? { targetKind: runTarget.targetKind } : {}),
    ...(runTarget?.recommendation ? { recommendation: runTarget.recommendation } : {}),
    ...(runTarget?.pathPassability ? { pathPassability: runTarget.pathPassability } : {}),
    ...(runTarget ? { scoreThreat: runTarget.scoreThreat } : {}),
    structuredAlignment:
      alignment?.aligned === true && alignment.source !== "evidence",
    scoreGap,
    scoreGapThreshold: threshold,
    candidateStatus: blockedReason ? "blocked" : "eligible",
    ...(blockedReason ? { blockedReason } : {}),
    productiveUseAllowed: false,
    runtimeConsumerStatus: "none",
    evidence: [
      "remote_contest_candidate:report_only",
      "productive_use_allowed:false",
      "runtime_consumer:none",
      `score_gap:${scoreGap}`,
      `score_gap_threshold:${threshold}`,
      ...(runTarget
        ? [
            `target_kind:${runTarget.targetKind}`,
            `recommendation:${runTarget.recommendation}`,
            `path_passability:${runTarget.pathPassability}`,
            `score_threat:${runTarget.scoreThreat}`,
            `risky_universal_coverage:${runTarget.riskyUniversalCoverage}`,
            `credits_after_run:${runTarget.creditsAfterRun}`,
          ]
        : ["remote_run_target:none"]),
      ...(alignment?.evidence ?? []),
      ...(alignment?.source ? [`alignment_source:${alignment.source}`] : []),
      blockedReason
        ? `remote_contest_candidate_blocked:${blockedReason}`
        : "remote_contest_candidate_status:eligible",
    ],
  };
}

function remoteRunTargetFor(
  frame: SemanticDecisionFrame,
  actionId: string,
): RunnerRunTarget | undefined {
  return frame.runner?.runTargets?.find(
    (target) =>
      target.actionId === actionId &&
      (target.targetKind === "remote" || target.accessTargetKind === "remote"),
  );
}

function remoteContestBlockedReason(input: {
  candidateMissing: boolean;
  runTarget: RunnerRunTarget | undefined;
  alignment: ReturnType<typeof alignRunTargetAction> | undefined;
  scoreGap: number;
  threshold: number;
}): string | undefined {
  if (input.candidateMissing) return "remote_contest_candidate_missing";
  if (!input.runTarget) return "remote_contest_remote_target_missing";
  if (!input.alignment?.aligned) return "remote_contest_alignment_blocked";
  if (input.alignment.source === "evidence") {
    return "remote_contest_structured_alignment_required";
  }
  if (input.runTarget.targetKind !== "remote" && input.runTarget.accessTargetKind !== "remote") {
    return "remote_contest_non_remote_target";
  }
  if (!input.runTarget.scoreThreat) return "remote_contest_score_threat_missing";
  if (input.runTarget.recommendation !== "run_now") {
    return "remote_contest_recommendation_blocked";
  }
  if (input.runTarget.pathPassability !== "reachable") {
    return "remote_contest_path_blocked";
  }
  if (input.runTarget.riskyUniversalCoverage || input.runTarget.creditsAfterRun < 0) {
    return "remote_contest_high_risk_blocked";
  }
  if (input.scoreGap < input.threshold) return "remote_contest_score_gap_below_threshold";
  return undefined;
}

function rankedActionHasUtilityFamily(
  action: SemanticRankedAction,
  family: string,
): boolean {
  if (action.primaryGoalId?.includes(family)) return true;
  return action.components.some(
    (component) =>
      component.component === "goal_fit" &&
      component.evidence.some((entry) => entry === `utility_family:${family}`),
  );
}
