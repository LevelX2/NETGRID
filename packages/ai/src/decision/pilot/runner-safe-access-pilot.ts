import type { LegalAction } from "@netgrid/shared";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import { alignRunTargetAction } from "../run-target-action-alignment";
import {
  block,
  decision,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type PilotScopeDecision,
  type RankedAction,
} from "./pilot-scope-common";

type RunnerRunTarget = NonNullable<
  NonNullable<SemanticDecisionFrame["runner"]>["runTargets"]
>[number];

export function runnerSafeAccessDecision(
  frame: SemanticDecisionFrame,
  action: LegalAction,
  top: RankedAction,
): PilotScopeDecision {
  const targetServerId = action.payload?.serverId;
  const evidence = [
    `pilot_scope:${RUNNER_SAFE_ACCESS_PILOT_MODE}`,
    `frame_side:${frame.side}`,
    `action_type:${action.type}`,
    ...(typeof targetServerId === "string" ? [`target_server:${targetServerId}`] : []),
  ];
  if (frame.side !== "runner") {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, "runner_safe_access_wrong_side", evidence);
  }
  if (action.type !== "start_run") {
    return block(
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      "runner_safe_access_action_type_blocked",
      evidence,
    );
  }
  if (typeof targetServerId !== "string") {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, "runner_safe_access_missing_target", evidence);
  }
  const matchingRunTarget = frame.runner?.runTargets?.find(
    (target) =>
      target.actionId === top.actionId && target.targetServerId === targetServerId,
  );
  if (!matchingRunTarget) {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, "runner_safe_access_target_missing", evidence);
  }
  const candidate = frame.actionCandidates.find(
    (candidate) => candidate.actionId === action.actionId,
  );
  if (!candidate) {
    return block(
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      "runner_safe_access_candidate_missing",
      evidence,
    );
  }
  const alignment = alignRunTargetAction(candidate, matchingRunTarget);
  const alignmentEvidence = [
    ...evidence,
    ...alignment.evidence,
    ...(alignment.source ? [`alignment_source:${alignment.source}`] : []),
  ];
  if (!alignment.aligned) {
    return block(
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      "runner_safe_access_alignment_blocked",
      alignmentEvidence,
    );
  }
  if (alignment.source === "evidence") {
    return block(
      RUNNER_SAFE_ACCESS_PILOT_MODE,
      "runner_safe_access_structured_alignment_required",
      alignmentEvidence,
    );
  }
  const targetEvidence = [
    ...alignmentEvidence,
    `target_kind:${matchingRunTarget.targetKind}`,
    `recommendation:${matchingRunTarget.recommendation}`,
    `path_passability:${matchingRunTarget.pathPassability}`,
    `path_cost:${matchingRunTarget.pathCost}`,
    `credits_after_run:${matchingRunTarget.creditsAfterRun}`,
    `steal_or_trash_affordable:${matchingRunTarget.stealOrTrashAffordable}`,
    `risky_universal_coverage:${matchingRunTarget.riskyUniversalCoverage}`,
    `score_threat:${matchingRunTarget.scoreThreat}`,
  ];
  const blockReason = runnerSafeAccessBlockReason(matchingRunTarget);
  if (blockReason) {
    return block(RUNNER_SAFE_ACCESS_PILOT_MODE, blockReason, targetEvidence);
  }
  return decision(
    RUNNER_SAFE_ACCESS_PILOT_MODE,
    true,
    "runner_safe_access_central_reachable_allowed",
    targetEvidence,
  );
}

function runnerSafeAccessBlockReason(target: RunnerRunTarget): string | undefined {
  if (target.targetKind !== "hq" && target.targetKind !== "rd") {
    return "runner_safe_access_non_central_target";
  }
  if (target.recommendation !== "run_now") {
    return "runner_safe_access_recommendation_blocked";
  }
  if (target.pathPassability !== "reachable") {
    return "runner_safe_access_path_blocked";
  }
  if (target.scoreThreat) {
    return "runner_safe_access_score_threat_blocked";
  }
  if (target.riskyUniversalCoverage) {
    return "runner_safe_access_universal_risk_blocked";
  }
  if (target.creditsAfterRun < 0) {
    return "runner_safe_access_credit_risk_blocked";
  }
  if (target.stealOrTrashAffordable === false) {
    return "runner_safe_access_unaffordable_access_blocked";
  }
  return undefined;
}
