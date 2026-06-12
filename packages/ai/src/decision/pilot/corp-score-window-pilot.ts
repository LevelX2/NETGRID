import type { LegalAction } from "@netgrid/shared";
import type { SemanticDecisionFrame } from "../semantic-decision-frame";
import {
  block,
  CORP_SCORE_WINDOW_PILOT_MODE,
  decision,
  hasUtilityFamily,
  utilityFamilyEvidence,
  type PilotScopeDecision,
  type RankedAction,
} from "./pilot-scope-common";

export function corpScoreWindowDecision(
  frame: SemanticDecisionFrame,
  action: LegalAction,
  top: RankedAction,
): PilotScopeDecision {
  const evidence = [
    `pilot_scope:${CORP_SCORE_WINDOW_PILOT_MODE}`,
    `frame_side:${frame.side}`,
    `action_type:${action.type}`,
    ...utilityFamilyEvidence(top),
  ];
  if (frame.side !== "corp") {
    return block(CORP_SCORE_WINDOW_PILOT_MODE, "corp_score_window_wrong_side", evidence);
  }
  if (action.type !== "score_agenda") {
    return block(
      CORP_SCORE_WINDOW_PILOT_MODE,
      "corp_score_window_action_type_blocked",
      evidence,
    );
  }
  return decision(
    CORP_SCORE_WINDOW_PILOT_MODE,
    hasUtilityFamily(top, "corp_scoreline"),
    hasUtilityFamily(top, "corp_scoreline")
      ? "corp_score_window_scoreline_allowed"
      : "corp_score_window_scoreline_missing",
    evidence,
  );
}
