import type {
  CardInstance,
  CardInstanceId,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

export function resolveSecurityNetOptimizationOnScore(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  instanceBefore: CardInstance,
  legalAction: LegalAction,
): void {
  const selectedServerId =
    typeof legalAction.payload?.selectedServerId === "string"
      ? String(legalAction.payload.selectedServerId)
      : instanceBefore.zone.side === "corp" &&
          instanceBefore.zone.zone === "serverRoot"
        ? instanceBefore.zone.serverId
        : undefined;
  if (!selectedServerId || selectedServerId === "new_remote")
    throw new Error("Security Net Optimization braucht ein gueltiges Remote.");
  host.zones.mustServer(selectedServerId as Exclude<ServerId, "new_remote">);
  host.state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    selectedServerId: selectedServerId as Exclude<ServerId, "new_remote">,
  };
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    securityNetOptimizationActive: true,
    selectedServerId,
    securityNetOptimizationServerId: selectedServerId,
  };
}
