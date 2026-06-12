import type { LegalAction } from "@netgrid/shared";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import {
  block,
  decision,
  RUNNER_SAFE_ACCESS_PILOT_MODE,
  type PilotScopeDecision,
  type RankedAction,
} from "./pilot-scope-common";

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
  const targetEvidence = [
    ...evidence,
    `target_kind:${matchingRunTarget.targetKind}`,
    `recommendation:${matchingRunTarget.recommendation}`,
    `path_passability:${matchingRunTarget.pathPassability}`,
    `score_threat:${matchingRunTarget.scoreThreat}`,
  ];
  const allowed =
    (matchingRunTarget.targetKind === "hq" ||
      matchingRunTarget.targetKind === "rd") &&
    matchingRunTarget.recommendation === "run_now" &&
    matchingRunTarget.pathPassability === "reachable" &&
    matchingRunTarget.scoreThreat === false;
  return decision(
    RUNNER_SAFE_ACCESS_PILOT_MODE,
    allowed,
    allowed ? "runner_safe_access_central_reachable_allowed" : "runner_safe_access_gate_blocked",
    targetEvidence,
  );
}
