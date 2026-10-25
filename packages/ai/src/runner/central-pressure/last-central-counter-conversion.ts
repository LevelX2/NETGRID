import { quoteLastCentralCounterConversion } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import type { RunnerRunTargetEvaluation } from "../../runner-run-target-evaluation";

/** One missing central counter, with a currently legal, zero-credit,
 * unprotected basic run. Earlier multi-turn assembly is intentionally separate. */
export function runnerLastCentralCounterConversion(
  input: AiDecisionInput,
  evaluation: RunnerRunTargetEvaluation,
): { sourceDefinitionId: string; actionsDenied: number } | undefined {
  const server = input.playerView.servers.find(
    (s) => s.id === evaluation.targetServerId,
  );
  const action = input.legalActions.find(
    (a) => a.actionId === evaluation.actionId,
  );
  if (
    !server ||
    !["hq", "rd", "archives"].includes(server.id) ||
    server.ice.length > 0 ||
    evaluation.pathPassability !== "reachable" ||
    evaluation.pathCost !== 0 ||
    evaluation.prerunReserveQuote?.status === "blocked" ||
    !action ||
    action.type !== "start_run" ||
    action.source !== "basic_action" ||
    action.costs.some(
      (c) =>
        (c.credits ?? 0) > 0 || (c.clicks ?? 0) > input.playerView.own.clicks,
    )
  )
    return undefined;
  for (const card of input.playerView.own.rig ?? []) {
    if (!card.known || !card.definitionId) continue;
    const quote = quoteLastCentralCounterConversion(
      card.definitionId,
      input.playerView.servers,
      server.id,
    );
    if (quote.complete)
      return {
        sourceDefinitionId: card.definitionId,
        actionsDenied: quote.nextCorpTurnActionsDenied,
      };
  }
  return undefined;
}
