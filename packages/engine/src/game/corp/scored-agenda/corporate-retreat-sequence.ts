import type { CardInstanceId, LegalAction } from "@netgrid/shared";
import type { ScoredAgendaFlowHost } from "./scored-agenda-flow-host";

export function markCorporateRetreatAvailableOnScore(
  host: ScoredAgendaFlowHost,
  cardId: CardInstanceId,
  legalAction: LegalAction | undefined,
): void {
  host.counters.setCardCounter(cardId, "mark", 1);
  if (legalAction)
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      agendaAbility: "v1922_corporate_retreat",
      corporateRetreatAvailable: true,
    };
}
