import type { AiDecision, LegalAction } from "@netgrid/shared";

import type { CorpTagPunishSkipReason } from "./corp-tag-punish-types";

export function corpTagPunishSkipReason(
  action: LegalAction,
  decision: AiDecision,
): CorpTagPunishSkipReason {
  const reason = decision.reasonCode;
  if (
    action.type === "gain_credit" ||
    reason.includes("recover_economy") ||
    reason.includes("economy")
  )
    return "economy";
  if (
    action.type === "rez_ice" ||
    (action.type === "install_card" && action.payload?.placement === "ice") ||
    reason.includes("protect")
  ) {
    if (reason.includes("remote") || reason.includes("scoring"))
      return "remote_protection";
    if (
      reason.includes("central") ||
      reason.includes("hq") ||
      reason.includes("rd") ||
      reason.includes("archives")
    )
      return "central_protection";
    return "protection";
  }
  if (action.type === "score_agenda" || reason.includes("score"))
    return "score";
  if (action.type === "advance_card" || reason.includes("advance"))
    return "advance";
  if (reason.includes("remote_safety") || reason.includes("unsafe_remote"))
    return "remote_protection";
  if (action.type === "draw_card" || reason.includes("draw")) return "draw";
  if (action.type === "install_card" || reason.includes("install"))
    return "install";
  if (action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}
