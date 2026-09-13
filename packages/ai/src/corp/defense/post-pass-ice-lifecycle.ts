import type { AiDecisionScoreComponent, LegalAction } from "@netgrid/shared";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";

export function corpPostPassIceLifecycleComponent(
  action: LegalAction,
): AiDecisionScoreComponent | undefined {
  if (
    action.type !== "continue_run" ||
    action.payload?.corpPostPassIceAbility !== "return_passed_ice_to_hq"
  ) {
    return undefined;
  }
  if (typeof action.payload.postPassIceTrashedUnlessReturned !== "boolean") {
    throw new PlanResolutionFailure("window_origin_missing", {
      side: action.side,
      stateVersion: action.expiresAtStateVersion,
      timingPoint: action.timingPoint,
      legalActionTypes: [action.type],
      unresolvedActionIds: [action.actionId],
      owner: "plan_module",
      removalCondition:
        "corp.defend_servers requires the exact post-pass ICE retention fact from the Engine.",
    });
  }
  if (action.payload.postPassIceTrashedUnlessReturned) {
    const returned = action.payload.decision === "return_to_hq";
    return {
      key: "corp_post_pass_temporary_ice_retention",
      label: returned
        ? "Temporäres ICE zurücknehmen"
        : "Temporäres ICE geht verloren",
      value: returned ? 1900 : -1900,
      reason:
        "post_pass_temporary_ice:true|ice_retained:" +
        returned +
        "|decision:" +
        action.payload.decision,
    };
  }
  const decision =
    typeof action.payload.decision === "string"
      ? action.payload.decision
      : "unknown";
  const serverId =
    typeof action.payload.serverId === "string"
      ? action.payload.serverId
      : "unknown";
  const paymentAmount =
    typeof action.payload.paymentAmount === "number" &&
    Number.isFinite(action.payload.paymentAmount)
      ? Math.max(0, Math.floor(action.payload.paymentAmount))
      : 0;
  const isCentral = serverId === "hq" || serverId === "rd";
  const hqReinstallExtraCost = decision === "return_to_hq" && serverId === "hq";
  if (decision === "pay") {
    return {
      key: "corp_post_pass_ice_lifecycle_preserve",
      label: "ICE-Schutz erhalten",
      value: isCentral ? 1200 : 850,
      reason: [
        "post_pass_ice_lifecycle:pay",
        `server:${serverId}`,
        `payment_amount:${paymentAmount}`,
        "ice_remains_installed:true",
      ].join("|"),
    };
  }
  if (decision === "decline") {
    return {
      key: "corp_post_pass_ice_lifecycle_decline_return",
      label: "ICE liegen lassen",
      value: isCentral ? 650 : 450,
      reason: [
        "post_pass_ice_lifecycle:decline",
        `server:${serverId}`,
        "ice_remains_installed:true",
      ].join("|"),
    };
  }
  if (decision === "return_to_hq") {
    return {
      key: "corp_post_pass_ice_lifecycle_return_to_hq_penalty",
      label: "ICE-Schutzverlust",
      value: isCentral ? -1900 : -1200,
      reason: [
        "post_pass_ice_lifecycle:return_to_hq",
        `server:${serverId}`,
        "ice_remains_installed:false",
        "central_protection_loss:" + isCentral,
        ...(hqReinstallExtraCost ? ["hq_ice_reinstall_extra_cost:2"] : []),
      ].join("|"),
    };
  }
  return undefined;
}
