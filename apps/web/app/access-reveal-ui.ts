import type { LegalAction } from "@netgrid/shared";
import { normalizeVisibleTerms } from "./action-board-ui";

export type AccessRevealActionGroups = {
  primaryActions: LegalAction[];
  declineAction: LegalAction | null;
};

export function accessRevealActionGroups(actions: LegalAction[]): AccessRevealActionGroups {
  return {
    primaryActions: actions.filter((action) => action.type !== "decline_trash"),
    declineAction: actions.find((action) => action.type === "decline_trash") ?? null
  };
}

export function accessDecisionLabel(action: LegalAction): string {
  if (action.type === "access_card") return "Nächste Karte";
  if (action.type === "steal_agenda") return "Agenda stehlen";
  if (action.type === "trash_accessed_card") return "Trashen";
  if (action.type === "trash_resource") return "Resource trashen";
  if (action.type === "decline_trash") return "OK";
  return normalizeVisibleTerms(action.label);
}
