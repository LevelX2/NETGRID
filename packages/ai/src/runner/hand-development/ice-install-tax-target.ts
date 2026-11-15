import { cardImplementationForDefinitionId } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { runnerEffectsOnlyTaxCorpIceInstalls } from "../../runner-canonical-hint-semantics";
import type { RunnerRunTargetEvaluation } from "../../run-analysis/runner-run-target-types";
import {
  mergedPublicHistory,
  serverIdFromEvent,
} from "../../runtime/public-event-history";
import { isRemoteServerTarget } from "../../runtime/server-target";

export function runnerInstallTaxTarget(
  input: AiDecisionInput,
  definitionId: string,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
): { target?: { actionId: string; serverId: string } } | undefined {
  if (
    !runnerEffectsOnlyTaxCorpIceInstalls(
      AI_HINTS_BY_CARD.get(definitionId)?.effects,
    ) ||
    cardImplementationForDefinitionId(definitionId)?.installTargetBinding
      ?.kind !== "choose_data_fort_on_install"
  ) {
    return undefined;
  }

  const { playerView, legalActions } = input;
  const currentTurn = playerView.turnSerial;
  const recentRuns = mergedPublicHistory(input).filter(
    (event) =>
      event.type === "start_run" &&
      event.publicPayload.actor === "runner" &&
      typeof event.turnSerial === "number" &&
      typeof currentTurn === "number" &&
      event.turnSerial >= currentTurn - 4 &&
      event.turnSerial <= currentTurn,
  );
  const ranked = candidates.flatMap((candidate) => {
    const action = legalActions.find(
      (offer) =>
        offer.actionId === candidate.actionId &&
        offer.side === "runner" &&
        offer.type === "install_card" &&
        offer.expiresAtStateVersion === playerView.stateVersion,
    );
    const server = playerView.servers.find(
      (entry) => entry.id === action?.payload?.selectedServerId,
    );
    if (!action || !server) return [];

    const visibleAgenda = server.root.some(
      (card) => card.known && card.type === "agenda",
    );
    const scoringRemote =
      isRemoteServerTarget(server.id) &&
      runTargets.some(
        (run) => run.targetServerId === server.id && run.scoreThreat,
      );
    const central = server.id === "hq" || server.id === "rd";
    const value = visibleAgenda || scoringRemote ? 2 : central ? 1 : 0;
    if (value === 0) return [];

    return [
      {
        actionId: action.actionId,
        serverId: server.id,
        value,
        installedIce: server.ice.length,
        recentRuns: recentRuns.filter(
          (event) => serverIdFromEvent(event) === server.id,
        ).length,
      },
    ];
  });
  const best = ranked.sort(
    (a, b) =>
      b.value - a.value ||
      a.installedIce - b.installedIce ||
      b.recentRuns - a.recentRuns ||
      a.actionId.localeCompare(b.actionId),
  )[0];
  return best
    ? { target: { actionId: best.actionId, serverId: best.serverId } }
    : {};
}
