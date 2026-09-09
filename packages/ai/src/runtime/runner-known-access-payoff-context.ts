import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import type { AiDecisionInput } from "@netgrid/shared";

import { evaluateKnownRemoteAccessPayoff } from "../known-remote-access-payoff";
import { projectKnownCorpCardAccessEffect } from "./known-corp-card-access-effect-projection";

/** A safe completed path can still pay out without stealing or trashing a root. */
export function runnerCurrentRunHasSafeCompletionReward(
  input: AiDecisionInput,
): boolean {
  const run = input.playerView.run;
  if (
    run?.phase !== "movement" ||
    run.position?.kind !== "server" ||
    run.successful
  )
    return false;
  const continuation = input.legalActions.find(
    (action) => action.type === "continue_run",
  );
  if (
    !continuation ||
    continuation.costs.some(
      (cost) => (cost.credits ?? 0) !== 0 || (cost.clicks ?? 0) !== 0,
    )
  )
    return false;
  const server = input.playerView.servers.find(
    (server) => server.id === run.attackedServerId,
  );
  if (
    !server ||
    server.root.some((card) => {
      if (!card.known || !card.definitionId) return true;
      const effect = projectKnownCorpCardAccessEffect({
        input,
        sourceDefinitionId: card.definitionId,
        sourceCard: card,
      });
      return effect.status === "unknown" || effect.threatValue > 0;
    })
  )
    return false;
  return (input.playerView.own.rig ?? []).some((card) => {
    if (!card.known || !card.definitionId || !card.rezzed) return false;
    const effect = cardSpecPlanningCardByDefinitionId(card.definitionId)
      ?.planning.engine.uniqueDirectLongtail;
    return (
      effect?.kind === "successful_run_end_credit_resource" && effect.amount > 0
    );
  });
}

export function runnerRemoteHasKnownNoCurrentPayoff(
  input: AiDecisionInput,
  serverId: string,
): boolean {
  return evaluateKnownRemoteAccessPayoff(input, serverId).knownNoCurrentPayoff;
}
