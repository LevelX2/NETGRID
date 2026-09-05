import type { AiDecisionInput } from "@netgrid/shared";
import type {
  CorpGenericDefenseSignal,
  CorpScoreProjectSignal,
} from "../plans/corp-core-plan-modules";
import { readExactCurrentInstalledCorpIceRezQuote } from "./corp-exact-ice-rez-route";
import { assessCorpExactIceRezAgainstScoreReserves } from "./corp-defense-score-reserve";

/** Defense admits the consumer; Economy may only execute its exact funding need. */
export function corpRestrictedRezDefenseSignals(
  input: AiDecisionInput,
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpGenericDefenseSignal[] {
  const signals = new Map<string, CorpGenericDefenseSignal>();
  for (const funding of input.corpRestrictedCreditRouteQuotes ?? []) {
    const consumer = funding.consumer;
    const block = consumer.currentRunAccessBlock;
    if (
      consumer.actionType !== "rez_ice" ||
      consumer.availableBeforePayout ||
      !block
    )
      continue;
    const sourceCard = input.playerView.servers
      .find((server) => server.id === consumer.serverId)
      ?.ice.find((card) => card.instanceId === consumer.sourceCardInstanceId);
    if (!sourceCard) continue;
    const priced = readExactCurrentInstalledCorpIceRezQuote({
      input,
      sourceCard,
      targetServerId: consumer.serverId,
    });
    // This first route is the ordinary fixed-cost rez. Differing variants need
    // their own complete effect/price binding; never substitute printed costs.
    if (
      !priced ||
      priced.totalRezCredits !== consumer.creditCost ||
      priced.quote.mandatoryAdditionalCosts.agendaPoints !== 0
    )
      continue;
    const reserve = assessCorpExactIceRezAgainstScoreReserves({
      input,
      scoreProjects,
      restrictedCreditFunding: funding,
      route: {
        sourceCardInstanceId: consumer.sourceCardInstanceId,
        sourceDefinitionId: consumer.sourceCardDefinitionId,
        targetServerId: consumer.serverId,
        quote: priced.quote,
        totalRezCredits: consumer.creditCost,
        routeKind: "access_reduction",
        effect: "satisfied",
        accessBlock: block,
      },
    });
    if (!reserve.preservesReserve) continue;
    const defenseId = `restricted-rez:${block.runId}:${consumer.serverId}:${consumer.sourceCardInstanceId}`;
    const previous = signals.get(defenseId);
    if (previous?.restrictedRezFunding) {
      previous.restrictedRezFunding.quotes.push(funding);
      continue;
    }
    signals.set(defenseId, {
      kind: "generic",
      defenseId,
      serverId: consumer.serverId,
      phase: "rez_response",
      actionIds: [],
      sourceDefinitionIds: [consumer.sourceCardDefinitionId],
      targetIceInstanceId: consumer.sourceCardInstanceId,
      urgent: true,
      rezWindowVerdict: "productive",
      value: 1,
      restrictedRezFunding: {
        gap:
          consumer.creditCost +
          funding.payoutGeneralCreditCost -
          input.playerView.own.credits,
        quotes: [funding],
      },
      evidenceCode: "corp_restricted_funding_exact_current_access_block",
    });
  }
  return [...signals.values()];
}
