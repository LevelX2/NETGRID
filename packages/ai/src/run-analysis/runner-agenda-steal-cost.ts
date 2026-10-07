import type { AiDecisionInput } from "@netgrid/shared";
import { quoteAgendaDefinitionSelfStealCreditCost } from "@netgrid/engine";

/** Current Engine facts only. Unknown agenda identity never makes public server costs disappear. */
export function runnerAgendaStealCreditRequirement(
  input: AiDecisionInput,
  serverId: string,
  knownAgendaDefinitionIds?: readonly string[],
): number | undefined {
  const server = input.playerView.servers.find((s) => s.id === serverId);
  if (!server) return undefined;
  const agendas = server.root.filter((c) => c.known && c.type === "agenda");
  const quotes = agendas.map((c) => c.effectiveStealCostQuote);
  if (
    quotes.some(
      (q, i) =>
        !q ||
        q.complete !== true ||
        q.stateVersion !== input.playerView.stateVersion ||
        q.serverId !== server.id ||
        q.agendaInstanceId !== agendas[i]!.instanceId ||
        !Number.isSafeInteger(q.creditCost) ||
        q.creditCost < 0,
    )
  )
    return undefined;
  if (quotes.length > 0) return Math.min(...quotes.map((q) => q!.creditCost));
  const quote = server.runnerAgendaStealCostQuote;
  if (
    !(
      quote?.complete === true &&
      quote.stateVersion === input.playerView.stateVersion &&
      quote.serverId === server.id &&
      Number.isSafeInteger(quote.minimumCreditCost) &&
      quote.minimumCreditCost >= 0
    )
  )
    return undefined;
  if (knownAgendaDefinitionIds === undefined) return quote.minimumCreditCost;
  if (knownAgendaDefinitionIds.length === 0) return undefined;
  const selfCosts = knownAgendaDefinitionIds.map((id) =>
    quoteAgendaDefinitionSelfStealCreditCost(id, serverId),
  );
  if (selfCosts.some((cost) => cost === undefined)) return undefined;
  // Central access may select any known agenda, so reserve the largest single self-cost.
  const cost =
    quote.minimumCreditCost + Math.max(...selfCosts.map((cost) => cost!));
  return Number.isSafeInteger(cost) ? cost : undefined;
}
