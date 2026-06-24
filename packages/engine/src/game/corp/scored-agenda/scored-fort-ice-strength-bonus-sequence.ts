import type {
  CardInstance,
  CardInstanceId,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";

export function resolveScoredFortIceStrengthBonusOnScore(
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
    throw new Error("Scored-Fort-Strength-Bonus braucht ein gueltiges Remote.");
  host.zones.mustServer(selectedServerId as Exclude<ServerId, "new_remote">);
  host.state.cardInstances[cardId] = {
    ...host.cards.mustInstance(cardId),
    selectedServerId: selectedServerId as Exclude<ServerId, "new_remote">,
  };
  applySequencePayloadPatch(legalAction, {
    scoredFortIceStrengthBonusActive: true,
    selectedServerId,
    scoredFortIceStrengthBonusServerId: selectedServerId,
  });
}
