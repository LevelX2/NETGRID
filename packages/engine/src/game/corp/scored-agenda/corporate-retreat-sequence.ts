import type { CardInstanceId, LegalAction } from "@netgrid/shared";
import { applySequencePayloadPatch } from "./scored-agenda-sequence-types";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

export function markCorporateRetreatAvailableOnScore(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  legalAction: LegalAction | undefined,
): void {
  host.counters.setCardCounter(cardId, "mark", 1);
  if (legalAction)
    applySequencePayloadPatch(legalAction, {
      agendaAbility: "scored_agenda_credit_until_install_or_rez",
      scoredAgendaCreditAvailable: true,
    });
}
