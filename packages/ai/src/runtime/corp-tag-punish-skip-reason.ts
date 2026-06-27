import type { AiDecision, LegalAction } from "@netgrid/shared";

import type { CorpTagPunishSkipReason } from "./corp-tag-punish-types";

export function corpTagPunishSkipReason(
  action: LegalAction,
  decision: AiDecision,
): CorpTagPunishSkipReason {
  const reason = decision.reasonCode;
  const reasonParts = structuredReasonParts(reason);
  if (
    action.type === "gain_credit" ||
    reasonParts.has("recover_economy") ||
    reasonParts.has("economy")
  )
    return "economy";
  if (
    action.type === "rez_ice" ||
    (action.type === "install_card" && action.payload?.placement === "ice") ||
    reasonParts.has("protect")
  ) {
    if (reasonParts.has("remote") || reasonParts.has("scoring"))
      return "remote_protection";
    if (
      reasonParts.has("central") ||
      reasonParts.has("hq") ||
      reasonParts.has("rd") ||
      reasonParts.has("rnd") ||
      reasonParts.has("archives")
    )
      return "central_protection";
    return "protection";
  }
  if (action.type === "score_agenda" || reasonParts.has("score"))
    return "score";
  if (action.type === "advance_card" || reasonParts.has("advance"))
    return "advance";
  if (reasonParts.has("remote_safety") || reasonParts.has("unsafe_remote"))
    return "remote_protection";
  if (action.type === "draw_card" || reasonParts.has("draw")) return "draw";
  if (action.type === "install_card" || reasonParts.has("install"))
    return "install";
  if (action.type === "end_turn") return "end_turn";
  return "unknown_higher_priority";
}

function structuredReasonParts(reasonCode: string): ReadonlySet<string> {
  const parts = new Set<string>();
  for (const dotPart of reasonCode.toLocaleLowerCase("en-US").split(".")) {
    addReasonPart(parts, dotPart);
    for (const underscorePart of dotPart.split("_")) {
      addReasonPart(parts, underscorePart);
      for (const dashPart of underscorePart.split("-")) {
        addReasonPart(parts, dashPart);
      }
    }
  }
  return parts;
}

function addReasonPart(parts: Set<string>, part: string): void {
  if (part.length > 0) parts.add(part);
}
