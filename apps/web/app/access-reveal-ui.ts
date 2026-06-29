import type { LegalAction } from "@netgrid/shared";
import { normalizeVisibleTerms, stealCostPaymentLabel } from "./action-board-ui";

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

export function accessDecisionLabel(action: LegalAction, serverLabel?: string): string {
  const accessContext = accessDecisionContextLabel(serverLabel);
  if (action.type === "access_card") return accessContext ? `Nächste ${accessContext}-Karte` : "Nächste Karte";
  if (action.type === "steal_agenda") {
    const paymentLabel = stealCostPaymentLabel(action.payload);
    const stealLabel = accessContext ? `Agenda aus ${accessContext} stehlen` : "Agenda stehlen";
    return paymentLabel ? `${paymentLabel} und ${stealLabel}` : stealLabel;
  }
  if (action.type === "trash_accessed_card") {
    if (action.payload?.freeAccessTrash === true) return accessContext ? `Kostenlos aus ${accessContext} trashen` : "Kostenlos trashen";
    return accessContext ? `Aus ${accessContext} trashen` : "Trashen";
  }
  if (action.type === "trash_resource") return "Resource trashen";
  if (action.type === "decline_trash") return accessContext ? `${accessContext}-Zugriff abschließen` : "OK";
  return normalizeVisibleTerms(action.label);
}

function accessDecisionContextLabel(serverLabel: string | undefined): string | null {
  if (!serverLabel) return null;
  const label = normalizeVisibleTerms(serverLabel.trim());
  if (!label) return null;
  if (label === "Archive") return "Archiv";
  return label;
}
