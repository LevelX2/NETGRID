import type { LegalAction } from "@netgrid/shared";
import {
  allow,
  BASIC_SETUP_PILOT_MODE,
  block,
  decision,
  hasUtilityFamily,
  utilityFamilyEvidence,
  type PilotScopeDecision,
  type RankedAction,
} from "./pilot-scope-common";

export function basicSetupDecision(
  action: LegalAction,
  top: RankedAction,
): PilotScopeDecision {
  const baseEvidence = [
    `pilot_scope:${BASIC_SETUP_PILOT_MODE}`,
    `action_type:${action.type}`,
  ];
  switch (action.type) {
    case "gain_credit":
    case "draw_card":
      return allow(BASIC_SETUP_PILOT_MODE, "basic_setup_resource_action", baseEvidence);
    case "install_card": {
      const allowed = hasUtilityFamily(top, "setup") || hasUtilityFamily(top, "coverage");
      return decision(
        BASIC_SETUP_PILOT_MODE,
        allowed,
        allowed ? "basic_setup_install_allowed" : "basic_setup_install_family_blocked",
        [...baseEvidence, ...utilityFamilyEvidence(top)],
      );
    }
    case "remove_tag": {
      const allowed = hasUtilityFamily(top, "survival") || hasUtilityFamily(top, "cleanup");
      return decision(
        BASIC_SETUP_PILOT_MODE,
        allowed,
        allowed ? "basic_setup_remove_tag_allowed" : "basic_setup_remove_tag_family_blocked",
        [...baseEvidence, ...utilityFamilyEvidence(top)],
      );
    }
    case "end_turn":
      return decision(
        BASIC_SETUP_PILOT_MODE,
        top.score >= 80,
        top.score >= 80 ? "basic_setup_high_score_end_turn" : "basic_setup_low_score_end_turn",
        [...baseEvidence, `top_score:${top.score}`],
      );
    default:
      return block(BASIC_SETUP_PILOT_MODE, "basic_setup_action_type_blocked", baseEvidence);
  }
}
