import type { AiDecisionInput } from "@netgrid/shared";

/** Current Engine facts only. Unknown agenda identity never makes public server costs disappear. */
export function runnerAgendaStealCreditRequirement(
  input: AiDecisionInput,
  serverId: string,
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
  return quote?.complete === true &&
    quote.stateVersion === input.playerView.stateVersion &&
    quote.serverId === server.id &&
    Number.isSafeInteger(quote.minimumCreditCost) &&
    quote.minimumCreditCost >= 0
    ? quote.minimumCreditCost
    : undefined;
}
