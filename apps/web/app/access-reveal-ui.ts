import type { LegalAction, PlayerView } from "@netgrid/shared";
import {
  normalizeVisibleTerms,
  stealCostPaymentLabel,
} from "./action-board-ui";

export type AccessRevealActionGroups = {
  primaryActions: LegalAction[];
  declineAction: LegalAction | null;
};

export function accessRevealActionGroups(
  actions: LegalAction[],
): AccessRevealActionGroups {
  return {
    primaryActions: actions.filter((action) => action.type !== "decline_trash"),
    declineAction:
      actions.find((action) => action.type === "decline_trash") ?? null,
  };
}

export type AccessDecisionContext = {
  cardType?: string | undefined;
  hasMoreAccesses?: boolean | undefined;
};

export type PendingAccessContinuation = {
  accessEventId: string;
  breachId: string;
  fromStateVersion: number;
  nextAccessSubmitted: boolean;
};

export function accessDecisionLabel(
  action: LegalAction,
  serverLabel?: string,
  context: AccessDecisionContext = {},
): string {
  const accessContext = accessDecisionContextLabel(serverLabel);
  if (
    action.payload?.agendaAccessReplacement === "install_as_runner_program" ||
    action.payload?.agendaAccessReplacement ===
      "declined_install_as_runner_program"
  )
    return normalizeVisibleTerms(action.label);
  if (action.type === "access_card")
    return accessContext ? `Nächste ${accessContext}-Karte` : "Nächste Karte";
  if (action.type === "steal_agenda") {
    const paymentLabel = stealCostPaymentLabel(action.payload);
    const stealLabel = accessContext
      ? `Agenda aus ${accessContext} stehlen`
      : "Agenda stehlen";
    return paymentLabel ? `${paymentLabel} und ${stealLabel}` : stealLabel;
  }
  if (action.type === "trash_accessed_card") {
    if (action.payload?.freeAccessTrash === true)
      return accessContext
        ? `Kostenlos aus ${accessContext} trashen`
        : "Kostenlos trashen";
    return accessContext ? `Aus ${accessContext} trashen` : "Trashen";
  }
  if (action.type === "trash_resource") return "Resource trashen";
  if (action.type === "decline_trash") {
    const subject =
      action.payload?.stealCost !== undefined
        ? "Nicht stehlen"
        : context.cardType === "asset" || context.cardType === "upgrade"
          ? "Nicht trashen"
          : "Weiter";
    if (context.hasMoreAccesses === true) return `${subject} – nächste Karte`;
    if (context.hasMoreAccesses === false)
      return subject === "Weiter"
        ? "Zugriff beenden"
        : `${subject} – Zugriff beenden`;
    return normalizeVisibleTerms(action.label);
  }
  return normalizeVisibleTerms(action.label);
}

export function accessDecisionDisplayLabel(
  action: LegalAction,
  serverLabel?: string,
  context: AccessDecisionContext = {},
): string {
  if (action.type === "steal_agenda" && stealCostPaymentLabel(action.payload))
    return "Zahlen & stehlen";
  return accessDecisionLabel(action, serverLabel, context);
}

export function shouldKeepAccessRevealOpen(
  action: LegalAction,
  hasMoreAccesses: boolean | undefined,
): boolean {
  return (
    hasMoreAccesses === true &&
    (action.type === "decline_trash" ||
      action.type === "trash_accessed_card" ||
      action.type === "steal_agenda")
  );
}

export function confirmedNextAccessAction(
  continuation: PendingAccessContinuation,
  view: PlayerView,
  legalActions: LegalAction[],
): LegalAction | null {
  if (view.stateVersion <= continuation.fromStateVersion) return null;
  if (view.pendingChoice) return null;
  if (view.run?.breach?.breachId !== continuation.breachId) return null;
  if (legalActions.length !== 1 || legalActions[0]?.type !== "access_card")
    return null;
  return legalActions[0];
}

function accessDecisionContextLabel(
  serverLabel: string | undefined,
): string | null {
  if (!serverLabel) return null;
  const label = normalizeVisibleTerms(serverLabel.trim());
  if (!label) return null;
  if (label === "Archive") return "Archiv";
  return label;
}
