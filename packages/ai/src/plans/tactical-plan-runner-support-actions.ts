import type { VisibleCard } from "@netgrid/shared";
import { evaluateKnownCentralAccessPayoff } from "../known-central-access-payoff";
import {
  runnerPressureProbeTargetAllowed,
  runnerRunTargetHighPayoff,
} from "../runner-run-target-guidance";
import {
  actionServerId,
  isCentralServer,
  isRemoteServer,
} from "./tactical-plan-server-targets";
import type { TacticalPlanBuildContext } from "./tactical-plan-types";

export function runnerMeaningfulRunOpportunityAvailable(
  context: TacticalPlanBuildContext,
): boolean {
  if (
    (context.runnerRunTargetEvaluations ?? []).some(
      (evaluation) =>
        evaluation.pathPassability === "reachable" &&
        evaluation.creditsAfterRun >= 0 &&
        (runnerRunTargetHighPayoff(evaluation) ||
          runnerPressureProbeTargetAllowed(evaluation)),
    )
  ) {
    return true;
  }
  return context.input.legalActions.some((action) => {
    if (action.side !== "runner" || action.type !== "start_run") return false;
    const serverId = actionServerId(action);
    if (!serverId) return false;
    const server = context.input.playerView.servers.find(
      (candidate) => candidate.id === serverId,
    );
    if (isCentralServer(serverId)) {
      if ((server?.ice.length ?? 0) > 0) return false;
      if (
        evaluateKnownCentralAccessPayoff(context.input, serverId)
          .knownNoCurrentPayoff
      ) {
        return false;
      }
      if (serverId === "rd") return true;
      return (
        serverId === "hq" &&
        context.input.playerView.opponent.handCount > 0
      );
    }
    if (!isRemoteServer(serverId)) return false;
    if ((server?.ice.length ?? 0) > 0) return false;
    return (server?.root ?? []).some((card) =>
      remoteRootHasImmediateRunPayoff(
        card,
        context.input.playerView.own.credits,
      ),
    );
  });
}

function remoteRootHasImmediateRunPayoff(
  card: VisibleCard,
  runnerCredits: number,
): boolean {
  if (!card.known) return true;
  if (card.type === "agenda") return true;
  if ((card.advancementCounters ?? 0) > 0) return true;
  return remoteRootTrashCost(card) <= runnerCredits;
}

function remoteRootTrashCost(card: VisibleCard): number {
  if (card.type !== "asset" && card.type !== "upgrade") {
    return Number.POSITIVE_INFINITY;
  }
  return typeof card.trashCost === "number"
    ? card.trashCost
    : Number.POSITIVE_INFINITY;
}
