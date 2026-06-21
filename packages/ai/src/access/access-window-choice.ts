import type { LegalAction } from "@netgrid/shared";
import type { AccessTargetKind } from "./access-decision-types";
import {
  projectAccessDecision,
  type AccessDecisionProjection,
} from "../decision/access-decision-projection";

export type AccessWindowTargetType =
  | "agenda"
  | "asset_node"
  | "upgrade"
  | "unknown"
  | string;

export function projectAccessWindowChoice(params: {
  actionType: LegalAction["type"];
  serverId: string | undefined;
  knownRootDefinitionId?: string;
  targetType: AccessWindowTargetType;
  trashCost: number;
  generalTrashCost: number;
  dedicatedTrashCredits: number;
  reserveWouldBreak: boolean;
  finitePoolValueRemaining: number;
}): AccessDecisionProjection {
  return projectAccessDecision({
    source: "access_window",
    serverId: params.serverId ?? "unknown",
    ...(params.knownRootDefinitionId
      ? { knownRootDefinitionId: params.knownRootDefinitionId }
      : {}),
    target: accessWindowProjectionTarget(params.targetType),
    intendedAccessAction: accessWindowIntendedAction(params.actionType),
    trashCost: params.trashCost,
    generalTrashCost: params.generalTrashCost,
    dedicatedTrashCredits: params.dedicatedTrashCredits,
    reserveWouldBreak: params.reserveWouldBreak,
    finitePoolValueRemaining: params.finitePoolValueRemaining,
  });
}

export function accessWindowProjectionTarget(
  targetType: AccessWindowTargetType,
): AccessTargetKind {
  if (targetType === "agenda") return "agenda";
  if (targetType === "asset_node") return "asset";
  if (targetType === "upgrade") return "upgrade";
  return "unknown";
}

export function accessWindowIntendedAction(
  actionType: LegalAction["type"],
): "steal" | "trash" | "decline" | "access_only" {
  if (actionType === "steal_agenda") return "steal";
  if (actionType === "trash_accessed_card") return "trash";
  if (actionType === "decline_trash") return "decline";
  return "access_only";
}
